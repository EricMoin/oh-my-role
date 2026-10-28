---
name: rust-platform-gate
description: Review Rust changes affecting supported targets, conditional compilation, build scripts, native dependencies and platform-dependent data or filesystem behavior.
---
# Rust Cross-Platform Gate

## Establish the supported matrix

Read the project's support policy, CI, manifests, build scripts and assigned acceptance criteria. Identify the affected target triples, feature combinations, native libraries, toolchains and execution environments. A single-platform project need not gain unrelated portability work. `#[cfg(test)]` or the presence of any `cfg` expression is not by itself evidence of a cross-platform risk.

Read `references/schemas.md` for the report contract. Review only matrix cells whose behavior or support promise the change can affect; explain omitted essential cells.

## Review decisions

- Trace the actual conditional compilation predicate and fallback. `#[cfg]` excludes an item; `cfg!` produces a boolean and does not remove the other branch from type checking. Check missing definitions, incompatible signatures or assumptions using the supported targets rather than demanding every operating system implement every capability.
- Separate build host from compilation target. `build.rs` runs on the host, so its own `cfg!` and `#[cfg]` inspect host properties. Use Cargo's `TARGET` and `CARGO_CFG_*` environment inputs when deciding the target's ABI or native configuration. Distinguish host executables used during generation from target libraries being linked.
- Inspect target-specific dependencies and native build/link settings where their availability differs. An unconditional dependency is fine when it supports the project's matrix. Correct source gating alone does not establish that a target linker, system library or generated binding is available.
- Check integer width, signedness, overflow and endian assumptions at actual persistence, protocol, allocation and FFI boundaries. On 32- and 64-bit targets, `usize as u64` is non-truncating; `u64 as usize` can truncate on 32-bit. Identify the conversion and supported width that loses information instead of treating every `as` cast as a defect. Use explicit wire formats where cross-platform interchange requires them.
- Evaluate paths and OS strings against the real input and filesystem contract: encoding, absolute paths, roots, case sensitivity, symlinks and reserved names can differ. `Path`/`OsStr` abstractions help but do not themselves prove identical behavior across filesystems.
- Treat features and targets as separate axes. `--all-features` does not compile other targets or all combinations; some projects intentionally have mutually exclusive features. `--all-targets` selects Cargo target kinds such as tests and examples, not every target triple. Choose valid supported combinations that exercise the changed boundary.

## Evidence and verification

Use existing CI evidence or scoped builds for the supported cells at risk. Record the toolchain, exact target triple, features and result for each executed check. A successful `cargo check --target ...` establishes compile checking for that configuration; it does not prove native linking or runtime behavior. Tests on the host cannot establish a foreign target's behavior.

When a required target, SDK, linker or execution environment is unavailable, investigate locally and distinguish a code defect from a verification gap. Preserve repository files and lockfiles. Do not silently install toolchains or rewrite CI solely to complete a reviewer checklist; return the missing evidence for the lead to resolve within task scope.

## Verdict

Return gate `cargo-platform` using `references/schemas.md` and stable issue ids. Each blocker identifies the promised configuration, the failing branch or assumption, and evidence of the failure mechanism. Pass only for the resolved assigned scope; revise a demonstrated portability violation; escalate essential unavailable target evidence or an unresolved support decision. Speculative additional platforms belong in advisory notes.

## Authoritative references

Resolve toolchain and dependency versions before applying version-sensitive details:

- [Cargo build scripts](https://doc.rust-lang.org/cargo/reference/build-scripts.html#inputs-to-the-build-script) and [build-script environment](https://doc.rust-lang.org/cargo/reference/environment-variables.html#environment-variables-cargo-sets-for-build-scripts): host versus target inputs.
- [Rust conditional compilation](https://doc.rust-lang.org/reference/conditional-compilation.html): target predicates and configuration semantics.
- [Numeric casts](https://doc.rust-lang.org/reference/expressions/operator-expr.html#numeric-cast): widening and truncation rules.
- [Cargo check](https://doc.rust-lang.org/cargo/commands/cargo-check.html): target kinds, compilation target and feature selection.
