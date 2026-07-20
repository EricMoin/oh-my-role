---
name: rust-platform-gate
description: Cross-platform gate for Rust Cross-Platform Checker. Reviews cfg-gated code, target_os/target_arch differences, conditional compilation coverage, platform-specific dependencies, build script correctness, and endian-safety.
---
# Rust Cross-Platform Gate

## Mission

Confirm that the proposed change compiles and functions correctly across all target platforms declared in the Engineering State's `cross_platform_context`. Conditional compilation is Rust's primary mechanism for platform abstraction, but it is also a source of latent breakage — disabled branches can rot, endian assumptions can silently corrupt data, and file path handling can fail on non-UNIX platforms. This gate ensures every `#[cfg(...)]` path is either actively verified or explicitly documented as untested.

## Inputs

- Engineering State block from the rust-engineer containing: `cross_platform_context` (target platforms, `#[cfg(...)]` gates, `Cargo.toml` target-specific deps, build script behavior, CI target matrix), `cargo_workspace`, and `edition`.
- Code diff for the change under review, with focus on `#[cfg(...)]` attributes, `cfg!(...)` macro usage, `std::os::*` imports, platform-specific `Cargo.toml` entries, and `build.rs` target-triple inspection.
- Reference documents: `references/rust-domains.md` for the cross-platform domain detection signals and gate scope; `references/schemas.md` for the gate report contract.
- Optional: `cargo check --target <triple>` output for each target, `cargo tree -e features` output on multiple targets, or clippy platform-specific lint output.

## Required Checks

- Every `#[cfg(...)]` gated code path compiles on its target platform — verified by `cargo check --target <triple>` for each target in the project's platform matrix.
- `#[cfg(target_endian = "big")]` and `#[cfg(target_endian = "little")]` paths both handle endian-sensitive operations correctly: binary parsers, protocol buffers, manual bit manipulation use `to_le()`/`to_be()`/`from_le()`/`from_be()` for cross-platform correctness.
- `target_pointer_width` assumptions are handled: `usize as u64` conversions have an `as u32` branch (or equivalent) for 32-bit targets. Pointer-sized values serialized to fixed-width formats include width-aware handling.
- Platform-specific dependencies in `Cargo.toml` use the `[target.'cfg(...)'.dependencies]` table, not the unconditional `[dependencies]` table. This prevents linking errors on unsupported platforms.
- `build.rs` inspects the target triple correctly using `std::env::var("TARGET")` or `cfg!()` macros, not by parsing `HOST` or hardcoded strings. `cargo:rustc-cfg=` directives produce valid cfg flags.
- `cfg!(...)` macro calls in runtime code are consistent with the `#[cfg(...)]` attribute gates in the same module — mismatches cause dead code or unreachable branches on some targets.
- `std::os::unix` / `std::os::windows` / `std::os::linux` imports are gated with the corresponding `#[cfg(target_os = "...")]` attribute to prevent compilation failure on other platforms.
- File path handling uses `std::path::Path` and `PathBuf` (which handle `/` vs `\` portably) rather than string concatenation with hardcoded path separators.
- Conditional test modules (`#[cfg(test)]` inside `#[cfg(target_os = "...")]` code) are covered by the CI target matrix — tests are not skipped unsilently on the only CI platform.
- Unsupported cfg paths (targets that cannot be tested) are explicitly annotated with a `// Not tested on <target>: <reason>` comment in the cfg gated code or at the module level.
- Feature set unification: `cargo tree -e features` on each target shows consistent feature activation — platform-specific features do not inadvertently enable or disable unrelated functionality.

## Pass Criteria

- **Pass**: All cfg-gated code compiles on the declared target platforms. Endian-sensitive code uses correct byte-order conversions. Pointer width assumptions handle both 32-bit and 64-bit. Platform dependencies use cfg-gated tables. Build script logic is correct. Untested paths are explicitly documented.
- **Fail**: Compilation error on a declared target platform. Endian-sensitive code missing `to_le()`/`to_be()` on manual bit manipulation. `usize as u64` without 32-bit fallback. Platform dependency in unconditional `[dependencies]`. Build script uses `HOST` instead of `TARGET`.
- **Conditional Pass**: Not all target platforms were checked (version skew, CI constraints — documented). Untested paths are annotated. Feature set unification was reviewed but not verified with `cargo tree` on each target.

## Output Format

Return a `gate_report` inside a ```result fence with these fields:

```yaml
gate: cross-platform
status: pass | fail | needs-user-input
evidence:
  - "src/platform/unix.rs:12 — #[cfg(unix)] with matching std::os::unix import"
  - "src/binary/parser.rs:45 — to_le() used for multi-byte field, big-endian safe"
  - "cargo check --target aarch64-apple-darwin — 0 errors"
  - "cargo check --target x86_64-pc-windows-msvc — 0 errors"
blocking_issues:
  - "src/binary/parser.rs:33 — usize as u64 without 32-bit fallback — breaks on 32-bit targets"
  - "Cargo.toml:15 — platform-specific dep in [dependencies] instead of [target.'cfg(unix)'.dependencies]"
required_revisions:
  - "Add cfg-aware usize-to-u64 conversion with a 32-bit branch in src/binary/parser.rs:33"
  - "Move platform-specific dependency to [target.'cfg(unix)'.dependencies] in Cargo.toml"
advisory_notes:
  - "x86_64-unknown-linux-gnu not tested (no CI target) — annotated as untested at module level"
verification: >
  cargo check --target x86_64-unknown-linux-gnu -p <crate> &&
  cargo check --target aarch64-apple-darwin -p <crate> &&
  cargo check --target x86_64-pc-windows-msvc -p <crate>
```

## Review Flow

1. Load the Engineering State and identify the `cross_platform_context` — target platform matrix, cfg gates, CI coverage.
2. Scan the diff for all `#[cfg(...)]` attributes and `cfg!(...)` macro calls — build a map of which targets each path covers.
3. For endian-sensitive code (bit manipulation, protocol parsing, binary formats): verify `to_le()`/`to_be()`/`from_le()`/`from_be()` usage.
4. Review `target_pointer_width` handling: every `usize as u64` cast must have an `as u32` branch for 32-bit targets.
5. Check `Cargo.toml` for platform dependencies: are they in cfg-gated tables or unconditional?
6. Review `build.rs` for target-triple inspection logic — is `TARGET` correctly sourced?
7. Compile findings into a gate report with file:line citations.

## Antipatterns to Detect

- **Missing endian conversion**: Manual byte shuffling without `to_be()`/`to_le()` — works on LE, corrupts on BE.
- **usize as u64 without 32-bit handling**: Compiles on 64-bit, truncates silently on 32-bit targets.
- **Unconditional platform dep**: `[dependencies.winapi]` on a cross-platform crate — fails to compile on Linux/macOS.
- **build.rs using HOST**: `std::env::var("HOST")` instead of `"TARGET"` — returns the build host, not the target.
- **std::os::import without cfg gate**: `use std::os::unix::fs::PermissionsExt` without `#[cfg(unix)]` — breaks on Windows.
- **Path string concatenation**: `format!("{}/{}", dir, name)` instead of `dir.join(name)` — broken path separators on Windows.
- **cfg!(...) != #[cfg(...)] mismatch**: Runtime check differs from compile-time gate — some targets silently skip code.
- **Untested cfg path with no annotation**: Disabled branches can rot silently until a user on that target reports a breakage.
