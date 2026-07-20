# Rust Risk Domains → Gate Mapping

**Purpose**: Map each Rust-specific risk domain to a specialist gate, define the detection signals that trigger the gate, and specify the verification tools each gate uses. This document is the authoritative routing table for `risk_domains` declared in the Engineering State (see [schemas.md](./schemas.md)).

**Rule**: A domain is included in the Engineering State's `risk_domains` field if ANY of its detection signals fire — even if the change is small. Over-inclusion is safe (the gate may quickly pass). Under-inclusion risks undetected defects.

---

## Domain–Gate Matrix

| Risk Domain | Gate | Dispatch Priority | Typical Crate Ecosystem |
|---|---|---|---|
| `unsafe-ffi` | safety-reviewer | 1 (highest) | `libffi`, `winapi`, `nix`, `libc`, `bindgen`, `cc`, `memmap2`, `static_assertions` |
| `async-concurrency` | async-auditor | 2 | `tokio`, `async-std`, `smol`, `futures`, `tokio-util`, `tower`, `tracing` |
| `public-api` | api-reviewer | 3 | `semver`, `public-api`, `cargo-semver-checks`, `rustdoc` |
| `performance-hotpath` | perf-profiler | 4 | `criterion`, `iai`, `divan`, `flamegraph`, `pprof`, `perf` (system), `tracy` |
| `cross-platform` | cross-platform-checker | 5 | `cfg-if`, `target-lexicon`, `build-rs`, `cross`, `cargo-cross`, `qemu` |

**Dispatch ordering**: When multiple domains fire, dispatch gates in priority order (1 = highest). Independent gates (no data dependency) may run in parallel. The safety-reviewer always runs first when `unsafe-ffi` is present, as its findings may invalidate assumptions other gates depend on.

---

## Mechanical Detection: Pre-Classification Scan

Before any tier classification, the engineer MUST run the domain-specific grep/rg commands listed in each `### Mechanical Detection` subsection below. Classification is based on objective grep output, not subjective self-assessment.

### Classification Rule

| Signal Pattern | Resulting Tier |
|---|---|
| Zero grep matches across ALL commands in ALL domains | **Quick** (downgrade from any higher initial estimate) |
| Grep matches in exactly ONE domain (any number of matches) | **at least Standard** |
| Grep matches in TWO OR MORE domains | **Deep** |
| Any match of BOTH `unsafe` AND `extern` (across any commands) | **Deep** |

**Do not override a zero-signal result**: if the mechanical scan shows no matches across all domains, the task *is* Quick even if the engineer subjectively suspects risk.

---

## 1. `unsafe-ffi` → safety-reviewer

### Mechanical Detection

Run these commands against the working tree before classification:

```
rg -n 'unsafe\b' --type rust
rg -n 'extern\s+"C"|extern\s+"system"' --type rust
rg -n '#\[link\(|#\[link_kind|#\[no_mangle\]' --type rust
rg -n 'transmute|transmute_copy' --type rust
rg -n '\*const\s|\*\s*mut\s' --type rust
rg -n 'core::mem::(zeroed|uninitialized)' --type rust
rg -n 'catch_unwind|AssertUnwindSafe' --type rust
```

### Detection Signals

Fire this domain when ANY of the following appear in the diff or surrounding code:

| Signal | Source | Urgency |
|--------|--------|---------|
| `unsafe { ... }` block introduced or modified | Any `.rs` file | Critical |
| `extern "C"` / `extern "system"` block | Any `.rs` file | Critical |
| `#[link(name = "...")]` or `#[link_kind = "..."]` | Any `.rs` file | Critical |
| `#[no_mangle]` attribute | Any `.rs` file | High |
| `#[repr(C)]`, `#[repr(C, packed)]`, `#[repr(align(...))]` on new or changed types | Any `.rs` file | High |
| `transmute` / `transmute_copy` | Any `.rs` file | Critical |
| Raw pointer dereference: `*const T`, `*mut T` | Any `.rs` file | Critical |
| `core::mem::zeroed()`, `core::mem::uninitialized()` | Any `.rs` file | Critical |
| `Pin` projections (especially `unsafe` ones) | Any `.rs` file | High |
| `catch_unwind` / `AssertUnwindSafe` | Any `.rs` file | Medium |
| `bindgen`-generated code in build artifact or diff | `build.rs`, `*.rs` in output dir | Critical |
| `build.rs` with `cc` crate or manual C compilation | `build.rs` | Critical |
| FFI callback parameters: `extern "C" fn(...)` in signatures | Any `.rs` file | Critical |
| `*const c_void` / `*mut c_void` passed across FFI | Any `.rs` file | Critical |
| Manual `Layout` computation (`alloc::alloc::Layout`) | Any `.rs` file | High |

### Gate Scope

| Check | Tool / Method |
|---|---|
| Pointer provenance validity | `cargo miri test` |
| Stacked Borrows / Tree Borrows conformance | `cargo miri test` |
| Type layout and ABI match | `static_assertions` crate, manual `assert_eq!(size_of::<T>(), ...)` |
| Initialization and validity invariants | Unsafe code audit + Miri |
| Unwinding safety across FFI boundaries | Code audit: `catch_unwind` wrapper on all extern callbacks |
| Aliasing guarantees (mutable reference from unique pointer, etc.) | Code audit + Miri |
| No null-pointer dereference in raw pointer paths | Code audit + Miri |
| `no_mangle` symbol collision risk | Code audit + `nm` / `objdump` |
| `repr(C)` padding and alignment on multi-target | `cargo check --target <target>` for each platform |

### Gate Report Template

```yaml
gate: safety
status: pass | fail | needs-user-input
evidence:
  - "<file>:<line> — <specific finding>"
blocking_issues:
  - "<concrete violation>"
required_revisions:
  - "<actionable fix>"
verification: "cargo miri test -p <crate>"
```

---

## 2. `async-concurrency` → async-auditor

### Mechanical Detection

Run these commands against the working tree before classification:

```
rg -n '(tokio|async_std|smol)::spawn|JoinSet|JoinHandle|spawn_blocking' --type rust
rg -n '#\[tokio::main\]|#\[tokio::test\]' --type rust
rg -n 'tokio::select!|futures::(try_)?join!|tokio::(try_)?join!' --type rust
rg -n 'CancellationToken|Unpin' --type rust
```

### Detection Signals

Fire this domain when ANY of the following appear:

| Signal | Source | Urgency |
|--------|--------|---------|
| New `tokio::spawn`, `async_std::task::spawn`, `smol::spawn` | Any `.rs` file | High |
| New channel topology (`tokio::sync::mpsc`/`oneshot`/`watch`/`broadcast`, `crossbeam::channel`, `flume`) | Any `.rs` file | High |
| New `Arc<Mutex<T>>` or `Arc<RwLock<T>>` on shared state | Any `.rs` file | High |
| New `#[tokio::main]` or `#[tokio::test]` entrypoint | Any `.rs` file | Medium |
| `.await` call inside a `Mutex::lock()` guard | Any `.rs` file | Critical |
| New `async fn` that could block indefinitely | Any `.rs` file | High |
| `JoinHandle` or `JoinSet` usage without cancellation handling | Any `.rs` file | High |
| `tokio::select!` with biased branches that could starve | Any `.rs` file | Medium |
| `tokio::spawn_blocking` usage | Any `.rs` file | Medium |
| `loop { ... }` inside async context without yielding | Any `.rs` file | High |
| `futures::join!` / `tokio::join!` / `try_join!` on heterogeneous fns | Any `.rs` file | Medium |
| `CancellationToken` or `task::AbortHandle` introduction | Any `.rs` file | Medium |
| `Unpin` requirement on a self-referential or non-`Unpin` type | Any `.rs` file | High |
| Custom `Future` implementation | Any `.rs` file | Critical |

### Gate Scope

| Check | Tool / Method |
|---|---|
| Send/Sync bounds on spawned tasks | `cargo check` (compiler error) |
| Lock guard validity (no `.await` held across guard) | Code audit + `clippy::await_holding_lock` |
| Task cancellation correctness (drop safety, clean shutdown) | Code audit + `tokio::select!` analysis |
| Backpressure (bounded channels, bounded work queues) | Code audit |
| Deadlock freedom (lock ordering, no nested `park`) | `loom` (if feasible), code audit |
| Task lifecycle (spawn → work → join/cancel) | Code audit |
| `Pin` safety for self-referential async types | Code audit + `pin-project` audit |
| `select!` fairness and biased branch review | Code audit |

### Gate Report Template

```yaml
gate: async-audit
status: pass | fail | needs-user-input
evidence:
  - "<file>:<line> — <specific finding>"
blocking_issues:
  - "<concrete violation>"
required_revisions:
  - "<actionable fix>"
verification: "cargo check -p <crate> && cargo clippy -p <crate> -- -D clippy::await_holding_lock"
```

---

## 3. `public-api` → api-reviewer

### Mechanical Detection

Run these commands against the working tree before classification:

```
rg -n '^pub\s+(fn|struct|enum|trait|type|mod|use|macro|unsafe)' --type rust
git diff --name-only | xargs rg -n 'pub fn|pub struct|pub enum|pub trait' --type rust 2>/dev/null || true
git diff -- Cargo.toml 2>/dev/null | rg '^\+.*\[dependencies|^\+.*feature|^\+.*version' || true
```

### Detection Signals

Fire this domain when ANY of the following appear:

| Signal | Source | Urgency |
|--------|--------|---------|
| New `pub` item added to a published crate | Any `.rs` file | High |
| Existing `pub` item signature changed (params, return type, generics) | Any `.rs` file | Critical |
| `pub` visibility narrowed (`pub` → `pub(crate)`) | Any `.rs` file | Critical (breaking) |
| `pub` item removed | Any `.rs` file | Critical (breaking) |
| New `pub use` re-export | `lib.rs` or `mod.rs` | High |
| Trait added to `pub` type's `impl` block without sealed trait | Any `.rs` file | Medium |
| New dependency added to `[dependencies]` (affects feature resolution) | `Cargo.toml` | Medium |
| Feature flag added, removed, or renamed | `Cargo.toml` | High |
| MSRV changed | `Cargo.toml` | High |
| Default feature set changed | `Cargo.toml` | High |
| `#[doc(hidden)]` added or removed on a `pub` item | Any `.rs` file | Medium |

### Gate Scope

| Check | Tool / Method |
|---|---|
| Semver diff against previous release | `cargo semver-checks` |
| `#[must_use]` on fallible or side-effect-free `pub` fns | Code audit + `clippy::must_use_candidate` |
| Documentation completeness on all new `pub` items | `cargo doc --no-deps` (no broken links, no missing docs warnings) |
| Feature flag coherence (default features, feature activation, naming) | `cargo tree -e features` + code audit |
| MSRV conformance | `cargo +msrv check` |
| Intra-doc link correctness | `cargo doc --no-deps -D warnings` |
| Orphan rule / coherence safety (no new trait impls on foreign types) | Compiler check |
| Naming conventions match crate's existing style | Code audit |

### Gate Report Template

```yaml
gate: api
status: pass | fail | needs-user-input
evidence:
  - "<file>:<line> — <specific finding>"
blocking_issues:
  - "<concrete violation>"
required_revisions:
  - "<actionable fix>"
verification: "cargo semver-checks check-release -p <crate> && cargo doc -p <crate> --no-deps -D warnings"
```

---

## 4. `performance-hotpath` → perf-profiler

### Mechanical Detection

Run these commands against files identified as hot-path (benchmarked functions, loops over large data, I/O boundaries):

```
# Hot-path scoped: run against files in the hot path only, not the entire tree
rg -n '#\[inline|#\[inline\(always\)\]' --type rust
rg -n 'clone\(\)|to_owned\(\)|to_string\(\)' --type rust
rg -n 'Box::new|Arc::new|Vec::new|HashMap::new' --type rust
```

### Detection Signals

Fire this domain when ANY of the following appear:

| Signal | Source | Urgency |
|--------|--------|---------|
| Change in a function annotated with `#[inline]` or `#[inline(always)]` | Any `.rs` file | High |
| Change in a loop body that iterates over large data | Any `.rs` file | High |
| Allocation addition or removal (`Box`, `Vec`, `String`, `HashMap`, `Arc::new`) | Any `.rs` file | High |
| `clone()` / `to_owned()` / `to_string()` on potentially large data | Any `.rs` file | High |
| Serialisation/deserialisation hot path (`serde`, `bincode`, `protobuf`, `flatbuffers`) | Any `.rs` file | High |
| Network I/O boundary change | Any `.rs` file | High |
| Lock or atomic operation on a contended path | Any `.rs` file | High |
| `unsafe` optimisation: unchecked indexing, unchecked arithmetic | Any `.rs` file | High |
| New allocation in a benchmarked function | Any `.rs` file | Medium |
| Change to a function called from within a benchmark | Any `.rs` file | Medium |
| Feature gate that enables an alternative implementation path | Any `.rs` file | Medium |
| Binary size impact (`size`, `bloat` differences) | Any `.rs` file | Medium |

### Gate Scope

| Check | Tool / Method |
|---|---|
| Allocation count and volume | `dhat-rs`, `cargo-puffin` (if available) |
| Benchmark regression detection | `cargo criterion` (compare branches) |
| Hot path (CPU profiling) | `perf` + `flamegraph`, `pprof-rs` |
| Lock contention | `tokio-console`, `perf lock` |
| Binary size | `cargo bloat --crate <name>` |
| Cache-line behaviour and false sharing | `perf stat -e cache-misses`, code audit |
| Inlining decisions (code size ↔ speed trade-off) | `cargo rustc -- --emit llvm-ir` or `objdump` |
| LLVM optimization remarks | `-C llvm-args=--remarks` |
| Comparison against benchmark baseline | `cargo criterion --baseline <tag>` |

### Gate Report Template

```yaml
gate: perf
status: pass | fail | needs-user-input
evidence:
  - "<file>:<line> — <specific finding>"
  - "<benchmark output / comparison table>"
blocking_issues:
  - "<concrete regression or concern>"
required_revisions:
  - "<actionable fix>"
verification: "cargo criterion --baseline main -p <crate> 2>&1 | tail -20"
```

---

## 5. `cross-platform` → cross-platform-checker

### Mechanical Detection

Run these commands against the working tree before classification:

```
rg -n '#\[cfg\(' --type rust
rg -n 'cfg!\(|std::os::(unix|windows|linux|macos)' --type rust
test -f build.rs && rg -n 'cfg|target_os|target_arch|target_family|target_endian' build.rs || true
```

### Detection Signals

Fire this domain when ANY of the following appear:

| Signal | Source | Urgency |
|--------|--------|---------|
| `#[cfg(target_os = "...")]` introduced or modified | Any `.rs` file | High |
| `#[cfg(target_arch = "...")]` introduced or modified | Any `.rs` file | High |
| `#[cfg(target_family = "...")]` introduced or modified | Any `.rs` file | High |
| `#[cfg(target_endian = "...")]` introduced or modified | Any `.rs` file | Critical |
| `#[cfg(unix)]` / `#[cfg(windows)]` / `#[cfg(android)]` gates | Any `.rs` file | High |
| New platform-specific dependency in `Cargo.toml` (`[target.'cfg(...)'.dependencies]`) | `Cargo.toml` | High |
| `build.rs` with conditional compilation (target-triple inspection) | `build.rs` | High |
| `cfg!(...)` macro usage in runtime code | Any `.rs` file | Medium |
| `cargo:rustc-cfg=` in `build.rs` output | `build.rs` | High |
| `std::os::unix` / `std::os::windows` / `std::os::linux` modules imported | Any `.rs` file | High |
| `target_pointer_width` assumptions (e.g., `usize as u64` without `as u32` branch) | Any `.rs` file | Critical |
| Endian-sensitive code (manual bit manipulation, protocol parsing, binary format) | Any `.rs` file | Critical |
| File path handling (`Path::new`, `std::path`, `/` vs `\\`) | Any `.rs` file | Medium |
| Conditional test module (`#[cfg(test)]` inside `#[cfg(target_os = "...")]` code) | Any `.rs` file | Medium |

### Gate Scope

| Check | Tool / Method |
|---|---|
| Compilation on all target platforms | `cargo check --target <t1/t2/t3>` for each target in matrix |
| Missing cfg gate coverage | `cargo check --all-features` (detects compile errors in disabled branches) |
| Endian-safety in binary parsing | `cargo miri test` on big-endian target (if qemu available), code audit for `to_le()`/`to_be()` correctness |
| File path portability | `clippy::filetype_is_file`, code audit for `std::path` vs string concat |
| Feature set unification across targets | `cargo tree -e features -p <crate>` on each target |
| Build script target-triple inspection correctness | Code audit |
| `target_pointer_width` assumptions | Code audit: `usize` to integer casts |
| Conditional test execution on CI | `cargo test --target <target>` (validate test skip/pass) |

### Gate Report Template

```yaml
gate: cross-platform
status: pass | fail | needs-user-input
evidence:
  - "<file>:<line> — <specific finding>"
blocking_issues:
  - "<concrete portability violation>"
required_revisions:
  - "<actionable fix>"
verification: >
  cargo check --target x86_64-unknown-linux-gnu -p <crate> &&
  cargo check --target aarch64-apple-darwin -p <crate> &&
  cargo check --target x86_64-pc-windows-msvc -p <crate>
```

---

## Priority Dispatch Logic

When the Engineering State declares multiple `risk_domains`, the rust-engineer dispatches gates in the following pattern:

```
risk_domains: [unsafe-ffi, async-concurrency, performance-hotpath]
                              │
                              ▼
           Dispatch order: safety-reviewer → async-auditor → perf-profiler
                           (seq: 1)          (seq: 2)         (seq: 3)
```

**Sequential dependency**: `async-auditor` waits for `safety-reviewer` only if the async runtime uses `unsafe` internals (tokio APIs are safe to call but a trivial safety audit is still worth doing first). `perf-profiler` and `cross-platform-checker` have no dependency on either and can run in parallel.

**Parallel gates**: When independent domains fire (e.g., `public-api` and `cross-platform`), dispatch both in parallel with `run_in_background=true`.

**Maximum gates**: 3 concurrent dispatches max (see [complexity-model.md](./complexity-model.md) Deep tier budget).

---

## Gate Name Convention

Each gate report MUST use the exact `gate` name from the matrix above:

| Domain | `gate` field value | Subagent ID |
|--------|-------------------|-------------|
| `unsafe-ffi` | `safety` | safety-reviewer |
| `async-concurrency` | `async-audit` | async-auditor |
| `public-api` | `api` | api-reviewer |
| `performance-hotpath` | `perf` | perf-profiler |
| `cross-platform` | `cross-platform` | cross-platform-checker |

These values are consumed programmatically by the rust-engineer to route gate reports. Any deviation is a producer error.
