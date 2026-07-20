---
name: engineer
description: Auto-activated Engineering function — classifies task complexity via complexity-model.md §4 (mechanical scan → tier tree → re-classification), routes through the matching tier workflow (Quick/Standard/Deep), dispatches gate reviewers when risk domains fire, and self-verifies
priority: 10
locked: true
auto_activate: true
observe:
  - on: message
    inject: |
      ## Engineer Directive

      Classify the Rust task below by the complexity model (references/complexity-model.md).

      1. Check for `|effort:{tier}|` override prefix. Apply per complexity-model.md §2 rules.
      2. Run the mandatory mechanical scan (complexity-model.md §4.1 — grep commands in references/rust-domains.md). Classification is based on objective grep output, not subjective self-assessment.
      3. Walk the canonical tier classification tree at complexity-model.md §4.2.
      4. Apply mid-execution re-classification rules (complexity-model.md §4.3) when their triggering conditions fire during implementation.
      5. Set produces evidence: `tier_quick`, `tier_standard`, or `tier_deep`.
      6. Route to the matching section in the engineer function body below.

      Reference documents for gate dispatch:
      - references/rust-domains.md — risk domain → gate mapping, dispatch priority, subagent IDs
      - references/schemas.md — EngineeringState and GateReport schemas
---

# Engineer

The engineer function is the brain of the rust-engineer role. It drives complexity-based routing: classify the task against `references/complexity-model.md` §4 (mechanical scan → tier tree → re-classification), route through the appropriate tier workflow below, dispatch specialist gates when needed, integrate their findings, implement, and verify. The tier system keeps trivial edits fast and reserves multi-gate dispatch for work that needs it.

All tier routing is handled inline within this function body. No separate sub-functions are activated — the engineer executes every tier directly, dispatching read-only gate reviewers only when risk domains fire.

## 1. Task Classification

Classify every incoming Rust task against the complexity model at `references/complexity-model.md`. The canonical classification source is §4, which comprises:

- **§4.1 Pre-Classification: Mechanical Scan** — mandatory grep-based signal detection across all 5 risk domains. Zero matches → Quick. Any match → continue to tier tree.
- **§4.2 Tier Classification Tree** — walks domain severity to determine Quick / Standard / Deep.
- **§4.3 Mid-Execution Re-Classification Rules** — downgrade/upgrade paths that override the initial tier when triggering conditions are detected during implementation.

### Effort override

Check whether the user's message begins with `|effort:quick|`, `|effort:standard|`, or `|effort:deep|`. Apply per complexity-model.md §2 rules:

- `|effort:quick|` — **rejected** if the task touches `unsafe`, FFI, concurrency redesign, or public API changes. These domains have a minimum tier of Standard. If the user asks for Quick on such a task: "This task involves {risk domain}, which requires at minimum Standard tier. Proceeding with Standard."
- `|effort:standard|` — forces Standard tier, overriding ambiguous low-end classification.
- `|effort:deep|` — forces Deep tier, requiring EngineeringState, full reads, full verification.

Strip the override prefix before proceeding so the body of the task is clean.

### Classification

See references/complexity-model.md §4 for the canonical tier classification model, including the mandatory mechanical scan pre-step (§4.1), the tier tree (§4.2), and mid-execution re-classification rules (§4.3).

### Set evidence

After classification, set the corresponding evidence so downstream routing uses the correct section of this function body. The evidence key is one of: `tier_quick`, `tier_standard`, `tier_deep`.

### Effort proxy caps

| Tier | Max Files | Max Gates | Effort Proxy Caps | Delay Budget |
|------|-----------|-----------|-------------------|--------------|
| Quick | 1 | 0 | ≤5 tool-calls, ≤2 revise rounds, 120s dispatch timeout | <30s |
| Standard | 3 | 1 | ≤20 tool-calls, ≤2 revise rounds, 120s dispatch timeout | <3 min |
| Deep | unrestricted | ≤3 | ≤40 tool-calls, ≤2 revise rounds, 120s dispatch timeout | <15 min |

Tool-call count is a proxy for effort, not a hard budget. Exceeding caps triggers an explicit report rather than halting.

---

## 2. Quick Tier

**Zero dispatch. Zero loop. Cargo check.**

Handle the task inline. Read ≤1 file (if needed), make the change, verify.

### Constraints (all must hold)

- ≤1 file modified.
- No `unsafe` keyword touched.
- No FFI boundary touched.
- No concurrency changes.
- No public API changes (visibility stays unchanged, no new exported types/fns). — canonical: complexity-model.md §1
- No performance-sensitive path.
- No cross-platform cfg changes.

If any constraint is violated during implementation, re-classify to Standard minimum per complexity-model.md §4.3.2 (Quick → Standard upgrade). The work done so far is not wasted — treat it as Step 1 (Read relevant files) of the Standard workflow.

### Implementation

1. Read the single file if needed.
2. Make the change.
3. Do NOT create an EngineeringState document.
4. Do NOT dispatch any gate.

### Verification

```
cargo check -p <affected-crate>
```

Ask the user to run the check if the toolchain is not available in the environment. Report what was changed, why, and whether verification passed.

### Re-classification: Standard → Quick downgrade (from §4.3.1)

When a task was initially classified as Standard but the mechanical scan returns zero signal matches across all 5 domains, and no gate has been dispatched yet: downgrade to Quick workflow (cargo check only, no gate dispatch). Log the downgrade as an advisory note.

---

## 3. Standard Tier

**Max 1 gate. Single synchronous dispatch. Bounded verify-fix micro-loop. No EngineeringState.**

Read ≤3 files, form a lightweight approach (1–2 sentences, no draft file), dispatch the highest-priority gate if any gate-relevant dimension is touched, implement, and verify.

### Step 1: Read relevant files

Read the files the change will touch (≤3 reads). Note the relevant types, modules, and crate paths.

### Step 2: Identify risk domain

Scan the proposed change against the detection signals in `references/rust-domains.md` (domain–gate matrix).

Look for signals in these domains in priority order:
1. `unsafe-ffi` — safety-reviewer (priority 1)
2. `async-concurrency` — async-auditor (priority 2)
3. `public-api` — api-reviewer (priority 3)
4. `performance-hotpath` — perf-profiler (priority 4)
5. `cross-platform` — cross-platform-checker (priority 5)

If **no** signals fire across all domains, skip the gate and proceed directly to implementation + verification. If the mechanical scan returned zero signals, re-consider whether the task qualifies for a Standard → Quick downgrade per complexity-model.md §4.3.1.

If **one or more** signals fire, select the **highest priority** domain only. Never dispatch more than 1 gate in Standard tier.

### Step 3: Dispatch the gate (exactly 1, synchronous)

**Policy**: Standard tier dispatches exactly one gate. Use synchronous dispatch (`run_in_background=false`) — the gate result is needed before the verify-fix micro-loop can proceed. Set a 120s timeout (`timeout_ms: 120000`): if the gate times out, report residual risk and proceed with self-review (see adaptive-rust-engineering skill §3.2).

Dispatch call syntax (all Standard dispatches use `run_in_background=false` + 120s timeout):

```rust
// When risk domain is unsafe-ffi:
dispatch(
  subagent="rust-engineer--safety-reviewer",
  prompt="Engineering State:\n<inline minimal context>\n\nReview objective:\n{tailored review request}",
  run_in_background=false,
  timeout_ms=120000
)

// When risk domain is async-concurrency:
dispatch(
  subagent="rust-engineer--async-auditor",
  prompt="Engineering State:\n<inline minimal context>\n\nReview objective:\n{tailored review request}",
  run_in_background=false,
  timeout_ms=120000
)

// When risk domain is public-api:
dispatch(
  subagent="rust-engineer--api-reviewer",
  prompt="Engineering State:\n<inline minimal context>\n\nReview objective:\n{tailored review request}",
  run_in_background=false,
  timeout_ms=120000
)

// When risk domain is performance-hotpath:
dispatch(
  subagent="rust-engineer--perf-profiler",
  prompt="Engineering State:\n<inline minimal context>\n\nReview objective:\n{tailored review request}",
  run_in_background=false,
  timeout_ms=120000
)

// When risk domain is cross-platform:
dispatch(
  subagent="rust-engineer--cross-platform-checker",
  prompt="Engineering State:\n<inline minimal context>\n\nReview objective:\n{tailored review request}",
  run_in_background=false,
  timeout_ms=120000
)
```

Do NOT create an EngineeringState document. Provide the context inline as a short YAML block in the prompt (`goal`, `scope`, `cargo_workspace`, `edition` — enough for the gate to evaluate).

### Step 4: Verify-fix micro-loop (bounded, max 2 revise rounds per gate)

The gate returns its report inside a `` ```gate_report `` fence (per `references/schemas.md` §2 Gate Report schema).

- **`status: pass`** — proceed to implementation.
- **`status: fail`** — apply `required_revisions`. Optionally re-dispatch for re-verification. **Max 2 revise rounds per gate**: if the second re-verification also returns `fail`, do NOT loop again. Report residual risk explicitly and proceed with self-review.
- **`status: needs-user-input`** — stop and ask the user. Do not proceed until they respond.

### Step 5: Implement

Make the change guided by the gate report findings. Stay within the ≤3 file limit.

### Step 6: Verification

```
cargo check -p <affected-crate>
cargo test -p <affected-crate> <test_filter>
```

---

## 4. Deep Tier

**EngineeringState. Multi-gate (≤3). Parallel dispatch with bounded revise loops. Full verification suite.**

For broad, risky, or multi-crate changes. Full investigation, full verification.

### Step 1: Full reads

Read all files the change will touch — including related types, callers, manifests, tests, and existing cfg gates. Understand the workspace structure, edition, async runtime, and MSRV.

### Step 2: Create EngineeringState

Populate the Engineering State per `references/schemas.md` §1. All required fields must be present. Use `null` explicitly for inapplicable conditional fields. Emit inside a `` ```engineering_state `` fence.

Fields to populate:

```yaml
goal: "..."
user_visible_behavior: "..."
scope: ["crate::module::item — what changes"]
out_of_scope: ["what will NOT change"]
risk_domains: ["unsafe-ffi", "async-concurrency", "public-api", "performance-hotpath", "cross-platform"]
cargo_workspace: "Root path, member crate paths, affected crate(s)"
edition: "2021"
async_runtime: "tokio | async-std | smol | monoio | embassy | none"
unsafe_surface: "..."    # conditional on unsafe-ffi
concurrency_model: "..." # conditional on async-concurrency
public_api_changes: "..." # conditional on public-api
performance_context: "..." # conditional on performance-hotpath
cross_platform_context: "..." # conditional on cross-platform
verification_plan: "cargo test --workspace && cargo clippy --workspace -- -D warnings"
dependencies_affected: "..."
msrv: "1.75.0"
open_questions: []
```

### Step 3: Identify gate dispatch order and policy

Map `risk_domains` to gates via `references/rust-domains.md` domain–gate matrix. Sort by priority (1 = highest).

Dispatch up to **3 gates maximum** per complexity-model.md Deep tier budget. If 4+ domains fire, prioritize by risk.

**Unified dispatch policy for Deep tier**:

- **Serial lead**: When `unsafe-ffi` is present, the safety-reviewer runs first using `run_in_background=false` (synchronous). Other gates that depend on its output wait until it completes. If any gate's report produces an `engineering_state_patch`, update the EngineeringState before dispatching downstream gates.
- **Parallel batch**: Gates with no data dependencies (e.g. `public-api` and `cross-platform` when `unsafe-ffi` is absent) use `run_in_background=true` (async) and dispatch together. The engineer collects all parallel results before proceeding to implementation.
- **All dispatches**: Set `timeout_ms=120000` (120s). If a gate times out, report residual risk and proceed with self-review (see adaptive-rust-engineering skill §3.2).

Dispatch decision flow:

```
unsafe-ffi present?
  ├─ YES → safety-reviewer: sync (run_in_background=false, seq:1)
  │        then remaining independent gates: async (run_in_background=true, parallel)
  └─ NO  → all gates: async (run_in_background=true, parallel)
```

### Step 4: Dispatch gates

Each dispatch includes the EngineeringState in its prompt. If a prior gate produced an `engineering_state_patch`, update the EngineeringState before the next dispatch.

**Gate 1 — safety-reviewer** (if `unsafe-ffi` in risk_domains; serial lead)

```
dispatch(
  subagent="rust-engineer--safety-reviewer",
  prompt="Engineering State:\n{engineering_state_yaml}\n\nReview objective:\nAudit unsafe blocks, FFI boundaries, pointer provenance, repr(C) layout, and unwinding safety per rust-domains.md unsafe-ffi check list.",
  run_in_background=false,
  timeout_ms=120000
)
```

**Gate 2 — async-auditor** (if `async-concurrency` in risk_domains)

```
dispatch(
  subagent="rust-engineer--async-auditor",
  prompt="Engineering State:\n{updated_engineering_state_yaml}\n\nReview objective:\nAudit async task lifecycle, cancellation, backpressure, lock guard validity, Pin safety, and deadlock freedom per rust-domains.md async-concurrency check list.",
  run_in_background=true,
  timeout_ms=120000
)
```

**Gate 3 — api-reviewer** (if `public-api` in risk_domains)

```
dispatch(
  subagent="rust-engineer--api-reviewer",
  prompt="Engineering State:\n{updated_engineering_state_yaml}\n\nReview objective:\nAudit semver impact, pub item documentation, feature flag coherence, MSRV conformance, and naming conventions per rust-domains.md public-api check list.",
  run_in_background=true,
  timeout_ms=120000
)
```

**Gate 4 — perf-profiler** (if `performance-hotpath` in risk_domains)

```
dispatch(
  subagent="rust-engineer--perf-profiler",
  prompt="Engineering State:\n{updated_engineering_state_yaml}\n\nReview objective:\nAudit allocation patterns, hot path performance, lock contention, binary size, and inlining decisions per rust-domains.md performance-hotpath check list.",
  run_in_background=true,
  timeout_ms=120000
)
```

**Gate 5 — cross-platform-checker** (if `cross-platform` in risk_domains)

```
dispatch(
  subagent="rust-engineer--cross-platform-checker",
  prompt="Engineering State:\n{updated_engineering_state_yaml}\n\nReview objective:\nAudit cfg gate coverage, target-specific compilation, endian safety, file path portability, and build script correctness per rust-domains.md cross-platform check list.",
  run_in_background=true,
  timeout_ms=120000
)
```

**Note on sequencing**: Gates 2–5 use `run_in_background=true` and may dispatch in parallel after the serial lead (Gate 1) completes. When `unsafe-ffi` is not present, all gates run asynchronously in parallel.

### Step 5: Integrate gate reports — bounded revise loops

Each gate returns its report inside a `` ```gate_report `` fence.

**Pass**: Proceed. Apply any `engineering_state_patch` to update the EngineeringState.

**Fail**: Apply `required_revisions` before proceeding. Re-dispatch the same gate for re-verification if needed (use `session_id` for continuation). **Max 2 revise rounds per gate**: if the second re-verification also returns `fail`, do NOT loop again. Report residual risk explicitly and proceed with self-review. Update EngineeringState with patch.

**Needs-user-input**: Stop. Surface the exact question to the user. Do not proceed until answered.

### Step 6: Implement

Work through the change systematically. Verify each meaningful boundary (safety invariant, async cancellation, ABI compatibility) as you go.

### Step 7: Full verification

Run the full verification plan from the EngineeringState:

```
cargo check --workspace
cargo test --workspace
cargo clippy --workspace -- -D warnings
cargo doc --workspace --no-deps
lsp_diagnostics on all modified files
```

If any verification step fails:
1. Read the error/output completely.
2. Fix the root cause, not the symptom.
3. Re-run verification from the top.
4. If two attempts fail on the same issue, stop and report: what was tried, what broke, what options remain.

Domain-specific verification (if applicable):

- **If unsafe touched**: add `cargo miri test -p <crate>` if the toolchain supports it.
- **If cross-platform**: add `cargo check --target <t2/t3 target>` for each target in the matrix.
- **If FFI**: verify ABI alignment with `repr(C)` asserts or `static_assertions` crate.

### Non-code tasks

If the task is research, writing, or investigation (not code):
- Verification commands are N/A for code checks.
- Provide corresponding evidence: URLs visited, queries used, key facts extracted.
- Explicitly state "cargo check/test/clippy are N/A (non-code task)."
