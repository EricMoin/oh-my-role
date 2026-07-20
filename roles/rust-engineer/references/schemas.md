# Inter-Agent Contract Schemas

**Purpose**: Canonical schemas for every inter-agent contract in the Rust Engineer role. All producers conform exactly. All consumers reject field drift.

**Rule**: One schema per contract. No producer renames, adds, or removes fields without updating this document first (see [Field Drift Prevention](#field-drift-prevention)).

**The `result` fence is the universal return envelope.** Every dispatched subagent returns its payload inside a `` ```result `` fence. The PAYLOAD schema is determined by the producer — gate reviewers return `gate_report`, the rust-engineer returns `engineering_state`. The consumer knows which schema to expect from the dispatch it made.

---

## 1. Engineering State

**Fence**: `` ```engineering_state `` (nested inside `` ```result ``)

**Producer**: rust-engineer (Deep tier only)

**Consumer**: All gate reviewer subagents (safety-reviewer, async-auditor, api-reviewer, perf-profiler, cross-platform-checker)

**Purpose**: Shared context grounding all reviewers in the same project facts, conventions, and constraints. Created before any Deep-tier gate dispatch.

### Fields

| Name | Type | Required | Constraints | Description |
|------|------|----------|-------------|-------------|
| `goal` | string | yes | 1–3 sentences | What the task achieves (end state). Must be concrete and verifiable. |
| `user_visible_behavior` | string | yes | 1–3 sentences | What the user or downstream caller observes after deployment. |
| `scope` | string | yes | — | Boundaries of what will change: file paths, modules, types, functions. Prefixed by crate: `crate::module::item`. |
| `out_of_scope` | string | yes | — | What will NOT change. Prevents scope creep during review. |
| `risk_domains` | string[] | yes | Each entry ∈ `unsafe-ffi` \| `async-concurrency` \| `public-api` \| `performance-hotpath` \| `cross-platform` | Which risk domains apply to this change. Determines which gates are dispatched. |
| `cargo_workspace` | string | yes | — | Workspace root path (relative to repo root), member crate paths, and which crate(s) are affected. |
| `edition` | string | yes | `2015` \| `2018` \| `2021` \| `2024` | Rust edition for the affected crate(s). Must match `Cargo.toml`. |
| `async_runtime` | string | yes | `tokio` \| `async-std` \| `smol` \| `monoio` \| `embassy` \| `none` | Async runtime in use. `none` for synchronous-only crates. |
| `unsafe_surface` | string | conditional | present when `risk_domains` includes `unsafe-ffi` | Description of all `unsafe` blocks, `unsafe fn`, `unsafe trait`, `extern` blocks, and `#[repr(C)]` types in the change. Includes justification for each. |
| `concurrency_model` | string | conditional | present when `risk_domains` includes `async-concurrency` | Description of concurrency model: task hierarchy, channel topology, shared-state ownership, lock ordering, cancellation strategy, and backpressure design. |
| `public_api_changes` | string | conditional | present when `risk_domains` includes `public-api` | List of added, removed, renamed, or signature-changed `pub` items. Include semver impact (major/minor/patch). |
| `performance_context` | string | conditional | present when `risk_domains` includes `performance-hotpath` | Performance baseline (if known), hot path description, allocation/deallocation pattern, I/O boundaries, latency/throughput targets. |
| `cross_platform_context` | string | conditional | present when `risk_domains` includes `cross-platform` | Target platforms, `#[cfg(...)]` gates, `Cargo.toml` target-specific deps, build script behavior, CI target matrix. |
| `verification_plan` | string | yes | — | Commands, tools, targets, and scenarios to verify correctness. Must be executable. |
| `dependencies_affected` | string | yes | — | Key crate dependencies touched, version changes, semver-aware notes. |
| `msrv` | string | yes | `major.minor.patch` | Minimum Supported Rust Version for the affected crate(s). |
| `open_questions` | string[] | no | — | Questions needing user input or research before gate dispatch. Omit if none. |

### Forbidden Fields

| Field | Reason |
|-------|--------|
| `implementation_details` | Engineering State captures WHAT/WHY, not HOW. |
| `gate_status` | Gate status is a runtime artifact, not shared context. |
| Undefined field names | Consumers parse by field name. Unknown fields cause silent drift. |

### Example

```yaml
goal:
  "Replace the synchronous JSON config parser with a zero-copy,
   unsafe-backed deserializer that returns `&str` borrows into the
   memory-mapped config buffer."
user_visible_behavior:
  "Config loading remains identical — same `Config` struct, same fields.
   Single-threaded startup path only. No user-facing changes."
scope:
  - "crate::config::parser — replace `serde_json::from_slice` with custom unsafe parser"
  - "crate::config::types — add `#[repr(C)]` layout guarantees to config structs"
  - "crate::config::tests — update assertions for returned borrows"
out_of_scope:
  - "Hot-reload or file-watch changes"
  - "Runtime config mutation after startup"
  - "Other crate::* modules"
risk_domains:
  - "unsafe-ffi"
  - "performance-hotpath"
cargo_workspace:
  "Root: `services/config-server/`, member crate: `config-parser`"
edition: "2021"
async_runtime: "tokio"
unsafe_surface:
  "- `parser::mmap_to_config()`: 1 unsafe block for `memmap2::Mmap::as_ptr`
     to `&str` cast — justified by mmap guarantee + length check.
   - `parser::parse_field()`: 1 unsafe block for unchecked index access
     on ASCII-only hot path — justified by prior char-class scan."
concurrency_model: null
public_api_changes: null
performance_context:
  "Baseline: serde_json loads 500KB config in ~2.1ms.
   Target: <200µs (10x improvement) by eliminating allocation + UTF-8 validation.
   Hot path: single-threaded startup, called once."
cross_platform_context: null
verification_plan:
  "cargo test -p config-parser && cargo clippy -p config-parser &&
   cargo miri test -p config-parser && cargo doc -p config-parser
   --no-deps"
dependencies_affected:
  "Remove: serde, serde_json, serde_derive. Add: memmap2 (optional).
   MSRV unchanged."
msrv: "1.75.0"
open_questions: []
```

---

## 2. Gate Report

**Fence**: `` ```gate_report `` (nested inside `` ```result ``)

**Producer**: All 5 gate reviewer subagents (safety-reviewer, async-auditor, api-reviewer, perf-profiler, cross-platform-checker)

**Consumer**: rust-engineer

**Purpose**: Structured review verdict from one specialist gate.

### Fields

| Name | Type | Required | Constraints | Description |
|------|------|----------|-------------|-------------|
| `gate` | string | yes | `safety` \| `async-audit` \| `api` \| `perf` \| `cross-platform` | Which gate produced this report. |
| `status` | string | yes | `pass` \| `fail` \| `needs-user-input` | Gate verdict. |
| `evidence` | string[] | yes | ≥1 entry | File paths with line numbers, test output, commands, or doc citations — each traceable to a concrete source. |
| `blocking_issues` | string[] | conditional | present when `fail` | One concrete violation per entry. |
| `required_revisions` | string[] | conditional | present when `fail` | One actionable revision per entry. |
| `advisory_notes` | string[] | no | — | Non-blocking observations, out-of-scope concerns. |
| `verification` | string | yes | — | Command or procedure to verify the gate passes after revisions. |
| `engineering_state_patch` | object | no | — | Fields to update in the Engineering State. Keys must match Engineering State field names. |

### Forbidden Fields

| Field | Reason |
|-------|--------|
| `next_gate` | Sequencing is the rust-engineer's role, not the reviewer's. |
| `summary` | Use `advisory_notes` instead. |
| Flat list format | Must use structured YAML. |

### Examples

```yaml
gate: safety
status: pass
evidence:
  - "src/config/parser.rs:112 — unsafe block documented with safety invariant"
  - "src/config/parser.rs:145 — length check precedes unchecked index"
  - "cargo miri test -p config-parser — 0 errors"
blocking_issues: []
required_revisions: []
verification: "cargo miri test -p config-parser && cargo clippy -p config-parser"
```

```yaml
gate: safety
status: fail
evidence:
  - "src/ffi/bridge.rs:43 — transmute from *const u8 to &mut [u8] without provenance guarantee"
  - "src/ffi/bridge.rs:67 — catch_unwind missing on extern callback boundary"
blocking_issues:
  - "Transmute of raw pointer to mutable reference violates stacked borrows — pointer was obtained from C allocation without aliasing guarantee"
  - "extern callback may unwind through C ABI — UB on non-Windows targets"
required_revisions:
  - "Replace transmute with safe `from_raw_parts_mut` and document the aliasing contract with the C caller"
  - "Wrap callback call site in `catch_unwind(AssertUnwindSafe(...))` and convert panic to abort or error code"
verification: "cargo miri test -p ffi-bridge && cargo build --target x86_64-unknown-linux-gnu"
```

```yaml
gate: api
status: needs-user-input
evidence:
  - "src/lib.rs:12 — `pub fn parse_config(path: &Path) -> Config` — to be published"
  - "Cargo.toml — version 0.5.0 (minor bump)"
verification: ""
engineering_state_patch:
  open_questions:
    - "Is `parse_config` the right public name, or should it be `load_config` for consistency with crate docs?"
    - "Should the function return `io::Result<Config>` or keep the infallible contract?"
```

---

## 3. Revision Input (Re-Execution Contract)

**Direction**: rust-engineer → subagent (closed-loop revise rounds)

When a gate returns `fail`, the rust-engineer revises code and re-dispatches to the same subagent (`session_id`). If a new session is required, the prompt MUST carry:

| Field | Source | Purpose |
|-------|--------|---------|
| Gate identifier | Original `gate` field | Which gate is being re-run |
| Prior `blocking_issues` | Failed gate report | What was wrong |
| Prior `required_revisions` | Failed gate report | What was asked for |
| Fix description | rust-engineer | What was changed |
| Revision flag | rust-engineer | "This is a revision — re-evaluate against the same engineering state" |

One failed gate per dispatch. The subagent re-evaluates from the unchanged Engineering State and produces a fresh gate report.

---

## 4. Producer Conformance Table

| Contract | Producer | Consumer | Fence |
|----------|----------|----------|-------|
| Engineering State | rust-engineer | all 5 gate reviewers | `` ```engineering_state `` |
| Gate Report | safety-reviewer | rust-engineer | `` ```gate_report `` |
| Gate Report | async-auditor | rust-engineer | `` ```gate_report `` |
| Gate Report | api-reviewer | rust-engineer | `` ```gate_report `` |
| Gate Report | perf-profiler | rust-engineer | `` ```gate_report `` |
| Gate Report | cross-platform-checker | rust-engineer | `` ```gate_report `` |

---

## 5. Field Drift Prevention

**Principle**: This document is the single source of truth. No producer unilaterally changes a contract.

**Before changing any field**:

1. Propose the change here first (add or modify the field table).
2. Update all producers (rust-engineer workflow for Engineering State, gate skills for Gate Report).
3. Update all consumers (rust-engineer for Gate Report, all 5 gate reviewers for Engineering State).
4. If backward-incompatible, version the contract or coordinate a simultaneous update.

**If a consumer receives a field not in this document**: reject it — producer error.

**If a producer needs a new field**: add it here first, then implement.

### Conformance Status

| Producer | Contract | Status |
|----------|----------|--------|
| rust-engineer | Engineering State | Conforms — schema enforced via `complexity-model.md` Deep tier workflow |
| safety-reviewer | Gate Report | Conforms — structured YAML per `rust-domains.md` gate template |
| async-auditor | Gate Report | Conforms — structured YAML per `rust-domains.md` gate template |
| api-reviewer | Gate Report | Conforms — structured YAML per `rust-domains.md` gate template |
| perf-profiler | Gate Report | Conforms — structured YAML per `rust-domains.md` gate template |
| cross-platform-checker | Gate Report | Conforms — structured YAML per `rust-domains.md` gate template |

### Deprecation Policy

1. Mark deprecated fields with `[DEPRECATED]` in the field table.
2. Producers stop emitting deprecated fields within one version cycle.
3. Consumers continue accepting them for one cycle after deprecation.
4. After one cycle, remove from this document. Producers still emitting are non-conformant.
