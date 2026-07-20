# Rust Complexity Model — Quick / Standard / Deep

**Purpose**: Define the three-tier complexity classification for Rust engineering tasks. Each tier determines the degree of investigation, verification, and process ceremony before implementation. The model prevents both under-engineering (skipping checks on risky code) and over-engineering (ceremony on trivial changes).

**Rule**: When ambiguity exists between adjacent tiers, classify UP (more conservative). A task that could be Quick or Standard is Standard. A task that could be Standard or Deep is Deep. The burden of proof is on the lower tier.

---

## 1. Tier Definitions

### Quick (lightweight — 0 file reads, 0 ceremony)

**Trigger signals**: The task involves one or more of:

- Single-line change (fix a typo, rename a local binding, adjust a literal).
- Borrow-checker micro-adjustment (add `&` / `mut` / `*`, reorder an if-let, nudge a lifetime annotation).
- Documentation-only change (fix a doc comment, add an example, correct a doc-test).
- Test-only change (add a test case following existing patterns, correct an assertion).
- Read-only Q&A about Rust semantics, the toolchain, or existing code (no code generation).
- Trivial refactor: rename a private function, reorder module exports, extract an obvious helper.

**Constraints (all must hold)**:
  - ≤1 file modified.
  - No `unsafe` keyword touched.
  - No FFI boundary touched (no `extern`, `#[link]`, `#[no_mangle]`, C ABI types).
  - No concurrency changes (no new thread/task spawns, no new `Arc`/`Mutex`/channel/`async`).
  - No public API changes (visibility stays unchanged, no new exported types/fns).
  - No performance-sensitive path (cold path, logging, error formatting, test infrastructure only).
  - No cross-platform or target-specific cfg changes.

**Verification**: Ask the user to run the existing single-file check or `cargo check` on the package. Do not run full workspace tests or Clippy unless the file layout suggests risk.

**Dispatch**: Zero. Never dispatch a Quick tier task. The rust-engineer handles it inline.

**Examples:**

| # | Description | Rationale |
|---|-------------|-----------|
| 1 | Fix a doc-test assertion that now fails because an iterator order changed | ≤1 file, test-only, no unsafe/FFI/concurrency |
| 2 | Add `#[must_use]` to a private helper that returns `Result` | ≤1 file, single-line, no public API, no risk |
| 3 | Answer "What does `Option::map_or_else` do?" with a code snippet | Read-only Q&A, no code written |
| 4 | Rename a local variable `res` → `parsed` in a 5-line function | ≤1 file, single binding, no public API |
| 5 | Replace `.collect::<Vec<_>>().iter()` with `.iter().collect::<Vec<_>>()` | Single-line, borrow-checker micro-tweak only |
| 6 | Fix a Clippy warning about unused import | ≤1 file, mechanical, no behavioral change |

**Effort proxy**: ≤5 tool-calls, ≤2 revise rounds, 120s dispatch timeout. **Delay budget**: <30s.

---

### Standard (focused — ≤3 file reads, lightweight approach, gate gated)

**Trigger signals**: The task involves one or more of:

- Multi-file change with a clear boundary (add a method, wire a parameter through a call chain).
- New module or type within an existing crate (new `struct`, `enum`, `impl` block, `trait` impl).
- Refactor spanning ≤3 files (extract a function, split a module, reorganise internal helpers).
- Adding a dependency to `Cargo.toml` with no version conflict risk.
- Adding integration tests or compile-fail tests following existing patterns.
- Editing `Cargo.toml` features or workspace member lists (non-breaking).

**Constraints (all must hold)**:
  - ≤3 files modified.
  - No `unsafe` block introduced or significantly expanded (minor reformat inside an existing `unsafe` block is still Standard).
  - No FFI boundary (may read FFI code for context, but does not modify it).
  - No concurrency redesign (may add a trivial `tokio::spawn` following the exact existing pattern).
  - No public API changes that affect downstream (adding a `pub fn` is ok if it does not break or deprecate existing exports; changing a `pub fn` signature or visibility is not).
  - No performance-critical path changed (hot loops, allocation-heavy paths, network I/O boundaries).
  - No cross-platform cfg additions or removals.

**Process**:
1. Read the relevant files (≤3 reads).
2. Form a lightweight approach in 1–2 sentences (do not write a `draft` file).
3. If the change has any gate-relevant dimension (e.g., touches async code, or a public type), dispatch the **highest priority** single gate only — never more than 1 gate.
4. Do NOT create an EngineeringState document. Use the task description as implicit context.
5. After implementation, run `cargo check` on the affected crate(s) and the relevant focused tests.

**Verification**:
  - `cargo check` on the affected crate (exit 0).
  - Focused tests: `cargo test -p <crate> <test_filter>` (exit 0).
  - If a gate was dispatched, integrate the gate report into the implementation.

**Dispatch**: Max 1 gate. Only the highest-priority risk domain dispatches. Use `run_in_background=false` (synchronous) — the gate result is needed before the verify-fix micro-loop can proceed. Set a 120s timeout: if the gate times out, report residual risk and proceed with self-review.

**Examples:**

| # | Description | Rationale |
|---|-------------|-----------|
| 1 | Add a new `TimeSeriesMetrics` struct to `lib/metrics/`, wire into the existing collector | ≤3 files, new module, no public API, no unsafe |
| 2 | Extract `parse_config()` from a 200-line function into its own module | ≤3 files, internal refactor, no public API, no unsafe/FFI |
| 3 | Add a `#[derive(Default, Clone, Debug)]` and implement `From<Input>` for an internal type | ≤2 files, clear boundary, no FFI/concurrency |
| 4 | Replace a custom `Result`-handling macro with `anyhow`/`thiserror` derive macros | ≤3 files, dependency change, no unsafe |
| 5 | Add integration tests for an existing parser module | Test-only addition, no production code risk |
| 6 | Bump a minor dependency version and fix the resulting API changes | ≤3 files, well-scoped |

**Effort proxy**: ≤20 tool-calls, ≤2 revise rounds, 120s dispatch timeout. **Delay budget**: <3 min.

---

### Deep (thorough — full reads, EngineeringState, multi-gate, verification plan)

**Trigger signals**: The task involves one or more of:

- Any introduction or non-trivial modification of `unsafe` blocks, `unsafe trait`, or `unsafe impl`.
- FFI boundary: `extern "C"` / `extern "system"`, `#[link]`, `#[no_mangle]`, C ABI structs, bindgen output, raw pointer marshalling.
- Concurrency redesign: new task hierarchy, channel topology, lock ordering, async cancellation strategy, shared-state ownership changes.
- Public API change: adding, removing, renaming, or changing the signature of any `pub` item in a published crate.
- Structural refactor spanning >3 files or >1 crate.
- Performance-critical path changed: hot loop, allocation-heavy path, I/O-boundary, serialisation/deserialisation, binary-size-sensitive area.
- Cross-platform code: adding or modifying `#[cfg(...)]` gating, target-specific `Cargo.toml` dependencies, conditional compilation for tier-2/tier-3 targets.
- Workflow or build-system change: custom build script (`build.rs` significant modification), procedural macro, feature-unification changes.
- Data-structure redesign affecting layout, alignment, padding, or ABI compatibility.

**Process**:
1. **Full reads**: Read all files the change will touch, including related types, callers, manifests, tests, and existing cfg gates.
2. **EngineeringState**: Create an EngineeringState document (see [schemas.md](./schemas.md)) to capture goal, scope, risk domains, workspace facts, and verification plan.
3. **Gate dispatch**: Depending on the `risk_domains` in the EngineeringState, dispatch up to 3 gates from the domain–gate mapping (see [rust-domains.md](./rust-domains.md)). Gates may run in parallel where they are independent.
4. **Implement**: Work through the change systematically. Verify each meaningful boundary (safety invariant, async cancellation, ABI compatibility).
5. **Full verification**: Execute the full verification plan — workspace build, workspace tests, Clippy, rustdoc, target-specific checks, Miri/sanitizers where applicable.

**Verification**:
  - `cargo check --workspace` (exit 0).
  - `cargo test --workspace` (exit 0, all tests).
  - `cargo clippy --workspace -- -D warnings` (exit 0).
  - `cargo doc --workspace --no-deps` (no broken intra-doc links).
  - If `unsafe` touched: `cargo miri test` (if available), ASan/UBSan (if target supports).
  - If cross-platform: `cargo check --target <t2/t3 target>`.
  - If FFI: verify ABI alignment with `repr(C)` asserts or `static_assertions` crate.

**Dispatch**: Up to 3 gates. Use `run_in_background=true` (async) for gates with no data dependencies to dispatch in parallel. When `unsafe-ffi` is present, the safety-reviewer runs first (serial, `run_in_background=false`); other gates that depend on its output wait until it completes. All gate dispatches use a 120s timeout — if a gate times out, report residual risk and proceed.

**Examples:**

| # | Description | Rationale |
|---|-------------|-----------|
| 1 | Introduce an `unsafe`-based zero-copy parser that returns references into a buffer | unsafe, performance-critical, public API |
| 2 | Add a C FFI API to expose a Rust library via `extern "C"` — includes `#[repr(C)]` structs, `catch_unwind`, error marshalling | FFI, unsafe, public API, cross-platform |
| 3 | Redesign an async task supervisor: replace `tokio::spawn` per-task with a `JoinSet`-based lifecycle manager | Concurrency redesign, async, multi-file |
| 4 | Release a new minor version: audit semver, update MSRV, publish to crates.io | Public API, multi-crate, semver risk |
| 5 | Port a subsystem from tokio to monoio (or another io_uring runtime) | Concurrency, performance, cross-platform cfg |
| 6 | Add `#[cfg(target_os = "linux")]` gating for an io_uring-based I/O backend | Cross-platform, build script, performance-critical |

**Effort proxy**: ≤40 tool-calls, ≤2 revise rounds, 120s dispatch timeout. **Delay budget**: <15 min.

---

## 2. Effort Override

The user may explicitly override tier classification by prefixing the task with:

| Prefix | Effect |
|--------|--------|
| `|effort:quick|` | Force Quick tier — only valid if no unsafe/FFI/concurrency/public-API risk. Ignored if those risks are present (reverts to Standard minimum). |
| `|effort:standard|` | Force Standard tier — overrides ambiguous low-end classification. |
| `|effort:deep|` | Force Deep tier — forces EngineeringState, full reads, full verification. |

**Rule for `|effort:quick|`**: The override is **rejected** if the task touches `unsafe`, FFI, concurrency redesign, or public API changes. These domains have a minimum tier of Standard. If the user asks for Quick on such a task, respond: "This task involves {risk domain}, which requires at minimum Standard tier. Proceeding with Standard."

---

## 3. Effort Proxy Caps Summary

| Tier | Max Files | Max Gates | Effort Proxy Caps | Delay Budget |
|------|-----------|-----------|-------------------|--------------|
| Quick | 1 | 0 | ≤5 tool-calls, ≤2 revise rounds, 120s dispatch timeout | <30s |
| Standard | 3 | 1 | ≤20 tool-calls, ≤2 revise rounds, 120s dispatch timeout | <3 min |
| Deep | unrestricted | ≤3 | ≤40 tool-calls, ≤2 revise rounds, 120s dispatch timeout | <15 min |

Tool-call count is a proxy for effort, not a hard budget. Exceeding caps triggers an explicit report rather than halting.

---


## 4. Canonical Tier Classification


The canonical classification model: mechanical scan (§4.1) → tier tree (§4.2) → mid-execution re-classification (§4.3). All other role documents reference this section.

### 4.1 Pre-Classification: Mechanical Scan (mandatory first step)

Before walking the tier tree, the engineer MUST run the mechanical detection commands
in each risk domain's `### Mechanical Detection` subsection of
[rust-domains.md](./rust-domains.md).
Classification is based on objective grep output, not subjective self-assessment.

Each domain in [rust-domains.md](./rust-domains.md) defines a `### Mechanical Detection` subsection with exact rg/grep commands for that domain. Run all commands across all 5 domains against the staged or working diff.

**If grep returns zero matches across ALL domains** → classification is Quick.
**If grep returns matches in ANY domain** → classify based on domain severity below.
**Do not override a zero-signal result**: if the mechanical scan shows no signals,
the task *is* Quick even if the engineer subjectively estimates risk.

The same classification rule (zero → Quick, one domain → Standard, two+ domains or unsafe+extern → Deep) is also defined in the [Mechanical Detection: Pre-Classification Scan](./rust-domains.md#mechanical-detection-pre-classification-scan) overview.

---

### 4.2 Tier Classification Tree

After the mechanical scan, walk this tree:
```
Task arrives
  │
  ├─ 0. Run mechanical scan (§4.1)
  │     │
  │     ├─ Zero signals fire across all 5 domains → Quick
  │     └─ Signals fire → continue to Step 1
  │
  ├─ 1. Does it involve unsafe, FFI, concurrency redesign,
  │     public API change, >3 files, >1 crate, performance
  │     hotpath, or cross-platform cfg?
  │      └─ YES → Deep
  │
  ├─ 2. Does it involve >1 file but ≤3 file refactor,
  │     new module/type, dependency addition, or any
  │     gate-relevant dimension?
  │      └─ YES → Standard
  │
  ├─ 3. Single file, no unsafe/FFI/concurrency/
  │     public API, no perf hotpath, no cross-platform?
  │      └─ YES → Quick
  │
  └─ 4. Ambiguous → classify UP (Standard if unsure, Deep if risky)
```

### 4.3 Mid-Execution Re-Classification Rules

The initial classification is provisional. The following re-classifications
override the initial tier and MUST be applied when their triggering condition
is detected:

**4.3.1 Standard → Quick (Downgrade)**

When zero risk-domain signals fire after the mechanical scan (Step 0 returns
Quick), but the task was incorrectly classified as Standard (e.g., due to
ambiguous description or user override):

1. The mechanical scan returned zero matches.
2. No gate has been dispatched yet.
3. The change is ≤3 files with no unsafe/FFI/concurrency/public-api/perf/cross-platform.

**Action**: Downgrade to Quick verification. Run `cargo check` only. Do NOT
dispatch any gate. Log the downgrade as an advisory note to the user.

---

**4.3.2 Quick → Standard (Upgrade)**

When any Quick-tier constraint is violated during or after implementation:

| Constraint | Trigger | Action |
|------------|---------|--------|
| ≤1 file | 2nd file must be modified | Stop. Re-classify to Standard. |
| No `unsafe` keyword | `unsafe {` appears in diff | Stop. Re-classify to Standard minimum. |
| No FFI boundary | `extern "C"` appears in diff | Stop. Re-classify to Standard minimum. |
| No concurrency | `tokio::spawn` etc. appears | Stop. Re-classify to Standard. |
| No public API change | `pub fn`/`pub struct` etc. added | Stop. Re-classify to Standard. |
| No perf hotpath | `#[inline]` touched | Stop. Re-classify to Standard. |
| No cross-platform cfg | `#[cfg(...)]` appears | Stop. Re-classify to Standard. |

**Action**: Cease Quick workflow immediately. The work done so far is not wasted
— treat it as Step 1 (Read relevant files) of the Standard workflow. Form a
lightweight approach, dispatch the highest-priority gate if any gate-relevant
dimension is touched, implement, and verify per Standard verification rules.

---

**4.3.3 Standard → Deep (Upgrade)**

When an unsafe/FFI/async concurrency redesign/public API breaking change is
discovered mid-implementation that was not visible in the initial diff:

1. A new file is required (exceeds the ≤3 file Standard limit), OR
2. An `unsafe` block must be introduced or significantly expanded, OR
3. An FFI boundary must be added, OR
4. A concurrency redesign emerges (new task hierarchy, channel topology).

**Action**: Cease Standard workflow. Create an EngineeringState document.
Re-read all affected files. Dispatch up to 3 gates following Deep tier process.

---

**Rule**: Once classified and mid-execution re-classification conditions are
checked, do not re-scope further unless the user explicitly adds scope.
Re-classify by the **current scope**, not the hypothetical full scope.

---

## 5. Summary Table

| Criterion | Quick | Standard | Deep |
|-----------|-------|----------|------|
| Max files changed | 1 | 3 | ∞ |
| Unsafe/FFI | ❌ | ❌ (+ minor unsafe reformat) | ✅ |
| Concurrency changes | ❌ | ✅ (trivial only) | ✅ (redesign) |
| Public API changes | ❌ | ✅ (additive only) | ✅ |
| Cross-platform cfg | ❌ | ❌ | ✅ |
| Performance hotpath | ❌ | ❌ | ✅ |
| EngineeringState | never | never | required |
| Gates dispatched | 0 | ≤1 | ≤3 |
| Verification | `cargo check` | `cargo check + focused test` | workspace full suite + domain tools |
