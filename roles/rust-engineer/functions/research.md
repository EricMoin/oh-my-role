---
name: research
description: Evidence-first research for Rust crate APIs, compiler behavior, toolchain, and cross-platform semantics — triggered when encountering unfamiliar or version-sensitive Rust behavior
priority: 15
---

# Research

You have encountered an unfamiliar Rust crate, version-sensitive compiler behavior, platform-specific code path, performance claim about a Rust construct, or build-system behavior. Follow the research channels in priority order until the behavior is understood, then cite findings and proceed.

## (a) Research Channels in Priority Order

| Priority | Channel | Use When | Tool / Method |
|----------|---------|----------|---------------|
| 1 | Context7 | Known crates and frameworks with documentation coverage (e.g., tokio, serde, axum, clap, reqwest) | `resolve-library-id` → `query-docs` |
| 2 | docs.rs | Crate API reference, type signatures, trait implementations, feature flags, version-specific docs | WebFetch `https://docs.rs/{crate-name}/{version}/{crate}/index.html` |
| 3 | crates.io | Crate metadata, version history, dependency tree, feature documentation, MSRV, license, repository link | WebFetch `https://crates.io/crates/{crate-name}` |
| 4 | Local dependency source grep | Version-specific implementation details, undocumented internal behavior, private types/functions | Grep in local Cargo cache (`~/.cargo/registry/src/`) or workspace `target/` directory |
| 5 | Reproducible experiment | Contradictory documentation, suspected compiler bug, edition migration behavior, platform-specific cfg differences | Create a minimal reproduction in a temp crate or the workspace's `tests/` directory |

Move to the next channel only when the current one produces no useful result.

### Channel usage notes

**Channel 1 — Context7**: Always the first channel for well-known crates. Follow the Context7 Workflow in section (c) below.

**Channel 2 — docs.rs**: The canonical API reference host for all published crates. Navigate to specific modules, types, and functions. Version-pinned URLs are stable — always pin the version when investigating version-sensitive behavior:
```
https://docs.rs/tokio/1.40.0/tokio/sync/struct.Mutex.html
```

**Channel 3 — crates.io**: Use for checking version history, MSRV, active maintenance, `[features]` documentation, and source repository links. The version list helps identify when a behavior was introduced or removed.

**Channel 4 — Local Cargo cache**: Cached sources live under `~/.cargo/registry/src/`. Use `cargo locate-project --workspace` to find workspace root, then grep crate sources directly for specific implementation details:

```bash
# Find the crate source directory
ls ~/.cargo/registry/src/*/tokio-*/tokio/src/runtime/
# Grep for a specific function implementation
grep -r "fn spawn" ~/.cargo/registry/src/*/tokio-*/tokio/src/runtime/
```

**Channel 5 — Reproducible experiment**: When documentation is contradictory or missing, write a minimal reproduction:

```bash
cargo new /tmp/repro && cd /tmp/repro
# Add dependencies, write minimal test case
cargo test 2>&1
```

--- 

## (b) Trigger Conditions

Research the following channels when ANY of these trigger conditions fire. Each trigger includes one or more concrete Rust examples.

| # | Trigger Condition | Rust Examples | Primary Channels |
|---|---|---|---|
| 1 | **Unfamiliar crate** — workspace first use of a crate you have not used before | `use tokio::sync::Mutex;` in a new project; first-time use of `axum`, `bevy`, `clap`, `reqwest`, `sqlx`, `diesel`, `nix`, `libc`, `bindgen` | Context7, docs.rs, crates.io |
| 2 | **Version-sensitive API** — deprecated API, edition-specific behavior, or API removed in a newer version | `std::mem::uninitialized()` (removed in 1.39); `try!` macro vs `?` operator (edition 2018); `await!(expr)` → `expr.await`; `intra-doc::links` stabilization across editions; `Box::into_raw_non_null()` added in 1.70; `std::sync::OnceLock` stabilization in 1.70 | Context7, docs.rs (version-pinned), crates.io changelog |
| 3 | **Platform-specific behavior** — `#[cfg(target_os = "...")]` or `#[cfg(target_arch = "...")]` affecting API semantics | `#[cfg(target_os = "linux")]` vs `#[cfg(target_os = "macos")]` for `epoll` vs `kqueue`; `std::os::unix::fs::PermissionsExt` on Linux-only; `std::path::PathBuf` separator differences on Windows; `cfg!(target_endian = "big")` for binary protocol parsing; `std::mem::size_of::<usize>()` differing per pointer width | docs.rs (platform-specific docs), local source grep, reproducible experiment |
| 4 | **Performance claim** — claims about allocation, inlining, monomorphization, or zero-cost abstraction cost | `Box::new(T)` vs `T` on stack; `collect::<Vec<_>>()` on large iterators; `#[inline]` / `#[inline(always)]` heuristics; `Arc<RwLock<T>>` vs `parking_lot::RwLock<T>`; `HashMap` vs `BTreeMap` for small maps; `dyn Trait` vs `impl Trait` dispatch overhead; iterator chain vs hand-written loop | docs.rs (perf notes), reproducible experiment with `criterion`, local source grep |
| 5 | **Build system behavior** — Cargo features, build.rs, profile configuration, target-specific flags | `cargo:rustc-cfg=...` in `build.rs`; feature unification across workspace members; `[profile.release] lto = "fat"` effects; `panic = "abort"` binary size impact; `cfg(debug_assertions)` in release vs debug; `build-dependencies` vs `[dependencies]` resolution order; proc-macro vs build script execution ordering | docs.rs (`Cargo.toml` examples), crates.io (feature docs), reproducible experiment |

---

## (c) Context7 Workflow (Primary Research Channel)

Context7 is the first channel for researching well-known crates and Rust frameworks. Follow these steps:

1. **Identify the target.** Determine the crate or framework name (e.g., "tokio", "serde", "axum", "clap", "reqwest", "sqlx", "tower", "tonic", "bevy"). Be specific about what behavior you are investigating.

2. **Resolve the library ID.** Call `resolve-library-id` with the crate name and the specific question. Use the official crate name with proper punctuation (e.g., "tokio" not "tokio-rs", "serde" not "serde-rs").

3. **Select the best match.** From the results, choose by:
   - Exact name match (preferred over partial)
   - Code snippet count (higher is better)
   - Source reputation (High/Medium preferred)
   - Benchmark score (higher is better)
   - Version match when the user specified a version

4. **Query documentation.** Call `query-docs` with the selected library ID and a specific, focused question. Keep each query to one concept — if the question spans multiple topics, make separate calls.

5. **Parse and extract.** Extract the relevant API details, type signatures, code examples, or behavior documentation from the response.

6. **Record the citation.** Format: `[source: Context7/{libraryId} — "{query summary}"]`

**Common Rust crate search hints:**

| Crate | Context7 Search Hint |
|-------|---------------------|
| Tokio | Search "tokio" |
| Serde | Search "serde" |
| Axum | Search "axum" |
| Clap | Search "clap" |
| Reqwest | Search "reqwest" |
| SQLx | Search "sqlx" |
| Tower | Search "tower" |
| Tonic (gRPC) | Search "tonic" |
| Bevy | Search "bevy" |
| Tracing | Search "tracing" |
| Thiserror | Search "thiserror" |
| Anyhow | Search "anyhow" |

**When Context7 returns no match:** If `resolve-library-id` returns poor or irrelevant results, try alternate names (e.g., "tokio" → "tokio-rs", "axum" → "axum-web"). If still no match after 3 attempts, move to channel 2.

---

## (d) Citation Format

All research findings follow an evidence-first discipline with these core principles:

**Evidence tiers.** Classify evidence by reliability — use the highest available:
- *Primary*: Source code path + line number, official API documentation, commit hash, issue tracker link — strongest evidence
- *Secondary*: Release notes, specification URLs, official migration guides, official changelogs — acceptable when primary is unavailable
- *Insufficient*: Blog posts, Stack Overflow answers, training-data memory, unverified AI-generated content — MUST NOT be cited as fact; flag as assumption

**When research is required.** Research MUST be completed before writing implementation code when any of these apply:
- Writing code against an unfamiliar external API
- Asserting platform-specific behavior (OS differences, concurrency guarantees)
- Claiming "this is the standard way to do X"
- Using library internals beyond the public interface
- Making version-sensitive decisions
- Relying on training-data memory for external behavior without verification

**Core principles:**
- *No training-data claims without verification* — external API behavior MUST carry a citation or an explicit assumption flag
- *Prefer docs over memory* — when documentation contradicts training-data memory, prefer the documentation and report the discrepancy
- *Cite or flag* — every external behavior claim in an execution report MUST carry a citation or be explicitly flagged as an unverified assumption
- *Research before code* — complete research before writing implementation code; do not code first and backfill citations later
- *No fake citations* — do not fabricate URLs, file paths, line numbers, or commit hashes; use the assumption flag format instead

All research findings must be cited using these formats:

| Source Type | Format | Example |
|-------------|--------|---------|
| Context7 | `[source: Context7/{libraryId} — "{query}"]` | `[source: Context7/tokio — "tokio::sync::Mutex vs std::sync::Mutex guard semantics"]` |
| docs.rs | `[source: docs.rs/{crate}/{version}/{path}]` | `[source: docs.rs/tokio/1.40.0/tokio/sync/struct.Mutex.html]` |
| crates.io | `[source: crates.io/{crate}/{version}]` | `[source: crates.io/tokio/1.40.0]` |
| Cargo cache (local) | `[source: ~/.cargo/registry/src/{crate}-{version}/{file}:L{line}]` | `[source: ~/.cargo/registry/src/tokio-1.40.0/tokio/src/sync/mutex.rs:L142]` |
| Reproducible experiment | `[source: /tmp/repro/src/main.rs:{line} — "{command output summary}"]` | `[source: /tmp/repro/src/main.rs:12-18 — "Box::new([0u8; 1024]) allocated 1024 bytes on heap"]` |
| Rust reference / edition guide | `[source: {url} — "{section}"]` | `[source: https://doc.rust-lang.org/reference/attributes/codegen.html — "inline attribute semantics"]` |
| Rust RFC | `[source: RFC {number} — "{title}"]` | `[source: RFC 2094 — "Non-lexical lifetimes"]` |
| GitHub issue / PR | `[source: GitHub:{org}/{repo}#{number}]` | `[source: GitHub:tokio-rs/tokio#6789]` |
| Assumption | `[assumption: not verified — {reason}]` | `[assumption: not verified — could not find official docs for this specific const generic pattern]` |

**Usage rules:**
- Cite inline when the source directly supports a specific claim: `The tokio::sync::Mutex guard does not hold the lock across .await points (source: docs.rs/tokio/1.40.0/tokio/sync/struct.Mutex.html) because the lock is released when the guard is dropped...`
- For broader research, collect citations in a `### Research Evidence` block at the end of the investigation.
- Never omit a citation — unsubstantiated claims about API behavior are forbidden.
- When citing a channel that returned nothing useful, note the negative result: `[channel: Context7 — no results for "edition 2024 unsafe blocks"]`

**Negative result format:**
```
[source: docs.rs/tokio/1.39.0/tokio/ — no mention of the `foo` method in this version — behavior first appeared in 1.40.0]
```

---

## (e) Escalation Rules

**When to stop and escalate to the user** instead of proceeding with uncertain findings:

1. **No documentation exists.** Context7 has no entry, docs.rs has no documentation for the relevant version, and crates.io shows a version mismatch.

2. **Contradictory documentation.** The Rust Reference and published crate documentation disagree (e.g., docs.rs says a function returns `Result<T, E>` but the reference indicates a different error type).

3. **Compiler version mismatch.** The behavior appears to rely on a Rust nightly/unstable feature not available in the project's MSRV stated in `Cargo.toml`.

4. **Deprecated with no migration path.** The crate API is marked `#[deprecated]` but the deprecation notice and release notes do not specify the replacement.

5. **Observed behavior contradicts compiler/language guarantees.** A platform-specific cfg path behaves differently from what the Rust reference or edition guide claims, e.g., `size_of::<usize>()` differs from expectations, or a `#[repr(C)]` struct layout does not match documented alignment rules.

**Escalation format:**

```
⚠️ Research inconclusive: {description of what was searched}
Channels tried: {list of channels attempted and results}
Finding: {what was found or not found}
Recommendation: {suggested next step for the user — e.g., file an issue on GitHub, open a Rust RFC discussion, test on the target platform, create a Miri test case}
```

When you escalate, do NOT proceed with the task. Present the findings and wait for user guidance.

---

## (f) Output

When research completes, produce an output section in the execution report structured as follows:

```
### Research Evidence

- {citation 1} — {finding}
- {citation 2} — {finding}
- {citation 3} — {finding}
...
```

---

## (g) Research Scope Boundaries

**This function covers:**
- Rust crate APIs — tokio, serde, axum, clap, reqwest, sqlx, tower, tonic, tracing, bevy, and any crate added to `[dependencies]`
- Rust standard library and core language — `std`, `core`, `alloc`, language items, macros, attributes
- Edition-specific behavior — edition 2015, 2018, 2021, 2024 migration paths, keyword changes, prelude additions
- Platform-specific code — `#[cfg(...)]` behavior, target_os/arch/endian/family differences, `std::os::*` modules
- Compiler/toolchain behavior — rustc flags, codegen options, LTO, panic strategy, debug info, profile-guided optimization
- Build system — Cargo features and feature unification, `build.rs`, proc-macro execution order, dependency resolution
- Concurrency and async primitives — `std::sync`, `tokio::sync`, async runtime internals, cancellation semantics
- Unsafe code and FFI — `unsafe` invariants, `extern "C"` ABI, `#[repr(C)]` layout guarantees, pointer provenance
- Performance characteristics — allocation patterns, inlining, monomorphization, SIMD auto-vectorization

**This function does NOT cover (defer to the relevant discipline):**
- Architecture decisions (sync vs async, actor vs channel, monolithic vs microservice) — defer to architecture domain knowledge
- Cargo workspace layout or crate organization choices — defer to project conventions
- Test strategy selection (unit vs integration vs property-based, fuzzing vs snapshot testing) — defer to testing discipline
- Production deployment, CI/CD, or observability tooling configuration — defer to operations discipline
