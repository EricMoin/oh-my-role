---
name: engineer
description: Auto-activated Engineering function — classifies task complexity via complexity-model.md §4 (mechanical scan → tier tree → re-classification), routes through the matching tier workflow (Quick/Standard/Deep), declares read-only gate review batches over the implemented snapshot when risk domains fire, and self-verifies
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

      Reference documents for gate review batches:
      - references/graph-protocol.md — the canonical v3 declaration, node briefs, submission and acceptance, and lead-owned recovery
      - references/rust-domains.md — risk domain → gate mapping, selection priority, node ids and agents
      - references/schemas.md — Engineering brief and schema_version 1 gate report contracts
---

# Engineer

The engineer function is the brain of the rust-engineer role. It drives complexity-based routing: classify the task against `references/complexity-model.md` §4 (mechanical scan → tier tree → re-classification), route through the appropriate tier workflow below, declare read-only gate review batches over the implemented snapshot when needed, integrate their accepted findings, repair the code, and verify. The tier system keeps trivial edits fast and reserves multi-gate review for work that needs it.

All tier routing is handled inline within this function body. No separate sub-functions are activated — the engineer executes every tier directly, declaring a read-only gate review batch on the rolebox graph v3 outcome protocol only when risk domains fire.

## Review Silence

MUST NOT output the tier, the Engineering brief, the declaration, or any node payload as a visible fenced block. Build the brief silently and embed it in the node prompts of the declaration. The user sees only the final answer — never intermediate briefs, handoff payloads, or routing narration.

## 1. Task Classification

Classify every incoming Rust task against the complexity model at `references/complexity-model.md`. The canonical classification source is §4, which comprises:

- **§4.1 Pre-Classification: Mechanical Scan** — mandatory grep-based signal detection across all 5 risk domains. Zero matches → Quick. Any match → continue to tier tree.
- **§4.2 Tier Classification Tree** — walks domain severity to determine Quick / Standard / Deep.
- **§4.3 Mid-Execution Re-Classification Rules** — downgrade/upgrade paths that override the initial tier when triggering conditions are detected during implementation.

### Effort override

Check whether the user's message begins with `|effort:quick|`, `|effort:standard|`, or `|effort:deep|`. Apply per complexity-model.md §2 rules:

- `|effort:quick|` — **rejected** if the task touches `unsafe`, FFI, concurrency redesign, or public API changes. These domains have a minimum tier of Standard. If the user asks for Quick on such a task: "This task involves {risk domain}, which requires at minimum Standard tier. Proceeding with Standard."
- `|effort:standard|` — forces Standard tier, overriding ambiguous low-end classification.
- `|effort:deep|` — forces Deep tier, requiring the full Engineering brief, full reads, full verification.

Strip the override prefix before proceeding so the body of the task is clean.

### Classification

See references/complexity-model.md §4 for the canonical tier classification model, including the mandatory mechanical scan pre-step (§4.1), the tier tree (§4.2), and mid-execution re-classification rules (§4.3).

### Set evidence

After classification, set the corresponding evidence so downstream routing uses the correct section of this function body. The evidence key is one of: `tier_quick`, `tier_standard`, `tier_deep`.

### Effort proxy caps

| Tier | Max Files | Max Batch Nodes | Effort Proxy Caps | Delay Budget |
|------|-----------|-----------------|-------------------|--------------|
| Quick | 1 | 0 | ≤5 tool-calls, ≤2 repair rounds, 300s node budget | <30s |
| Standard | 3 | 1 | ≤20 tool-calls, ≤2 repair rounds, 300s node budget | <3 min |
| Deep | unrestricted | ≤3 | ≤40 tool-calls, ≤2 repair rounds, 300s node budget | <15 min |

Tool-call count is a proxy for effort, not a hard budget. Exceeding caps triggers an explicit report rather than halting. The 300s node budget is the `budget.timeout_ms` every declared review node carries.

### Review runs on the implemented snapshot

The lead implements first, then freezes the resulting revision, then declares the review batch over it. An early consultation cannot approve unwritten code, and a reviewer must review a frozen diff: a plan or a pre-implementation sketch is not reviewable. Every node prompt therefore names the implemented snapshot (commit plus uncommitted changes) and the exact diff or artifact paths under review.

---

## 2. Quick Tier

**Zero graph. Zero review nodes. Cargo check.**

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
3. Do NOT build an Engineering brief document.
4. Do NOT declare a review graph or any review node.

### Verification

```
cargo check -p <affected-crate>
```

Ask the user to run the check if the toolchain is not available in the environment. Report what was changed, why, and whether verification passed.

### Re-classification: Standard → Quick downgrade (from §4.3.1)

When a task was initially classified as Standard but the mechanical scan returns zero signal matches across all 5 domains, and no review batch has been declared yet: downgrade to Quick workflow (cargo check only, no review graph). Log the downgrade as an advisory note.

---

## 3. Standard Tier

**Max 1 review node. Implement first, then declare one batch. Bounded repair loop. No Engineering brief document.**

Read ≤3 files, form a lightweight approach (1–2 sentences, no draft file), implement, then declare one review node if any gate-relevant dimension is touched, and verify.

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

If **no** signals fire across all domains, skip the graph and proceed directly to verification. If the mechanical scan returned zero signals, re-consider whether the task qualifies for a Standard → Quick downgrade per complexity-model.md §4.3.1.

If **one or more** signals fire, select the **highest priority** domain only. Never declare more than 1 review node in Standard tier.

### Step 3: Implement

Make the change and run the focused checks that make the revision stable. The reviewed snapshot is the implemented one, so implementation comes before review. Stay within the ≤3 file limit.

### Step 4: Declare the review node (exactly 1)

**Policy**: Standard tier declares exactly one review node. Submit one complete declaration through a single `graph_declare({declaration: {...}})` call: `version: 3`, a request-scoped `name`, `edges: []`, run `budget.max_executions` of at least 1, and exactly one node with the selected node id, agent, `completion: {mode: "explicit"}`, `budget: {timeout_ms: 300000}`, and outcomes `pass`, `revise`, `escalate`. The node prompt carries the Engineering brief fields the domain needs (`goal`, `scope`, `snapshot`, `cargo_workspace`, `edition`, plus the conditional domain field), the read-only scope and the gate report shape from `references/schemas.md`. Never author `max_retries` or `loop_groups`.

Node selection:

| Highest-priority fired domain | Node id | Agent |
|---|---|---|
| `unsafe-ffi` | `safety` | `rust-engineer--safety-reviewer` |
| `async-concurrency` | `async` | `rust-engineer--async-auditor` |
| `public-api` | `api` | `rust-engineer--api-reviewer` |
| `performance-hotpath` | `performance` | `rust-engineer--perf-profiler` |
| `cross-platform` | `cross-platform` | `rust-engineer--cross-platform-checker` |

Inspect the `graph_declare` result: the persisted plan **and** `start.kind`. `started` and `resumed` are real dispatch; `saved`, `blocked` and `refused` are not. Diagnose a refusal before re-declaring, and never declare a duplicate graph because startup looks slow. After a confirmed start, yield for the `GRAPH COMPLETE` / `GRAPH BLOCKED` notification — do not poll in a loop.

### Step 5: Repair loop (bounded, max 2 rounds per gate)

Read the accepted gate report from `attempts[].result` via `graph_status`.

- **`status: pass`** — proceed to verification.
- **`status: fail`** — apply `required_revisions` yourself, rerun the affected checks, then declare a FRESH one-node batch for the updated snapshot with a new `name` and the prior issue ids. **Max 2 repair rounds per gate**: if the second re-review also returns `fail`, do NOT loop again. Report residual risk explicitly and proceed with self-review.
- **`status: needs-user-input`** — the node settled `escalate`. Stop and ask the user the exact question. Do not proceed until they respond.

### Step 6: Verification

```
cargo check -p <affected-crate>
cargo test -p <affected-crate> <test_filter>
```

---

## 4. Deep Tier

**Engineering brief. One batch of ≤3 review nodes. Independent roots. Bounded repair loops. Full verification suite.**

For broad, risky, or multi-crate changes. Full investigation, full verification.

### Step 1: Full reads

Read all files the change will touch — including related types, callers, manifests, tests, and existing cfg gates. Understand the workspace structure, edition, async runtime, and MSRV.

### Step 2: Full implementation

Implement the change systematically. Verify each meaningful boundary (safety invariant, async cancellation, ABI compatibility) as you go. Review is declared over the implemented snapshot, so the revision must be stable before the batch is declared.

### Step 3: Build the Engineering brief

Build the Engineering brief silently in working memory per `references/schemas.md`. It is prompt-embedded and never a graph payload; do NOT output it as a visible fenced block. Embed the relevant fields in every node prompt of the batch.

For reference, the internal format is:

```yaml
goal: "..."
user_visible_behavior: "..."
scope: ["crate::module::item — what changes"]
out_of_scope: ["what will NOT change"]
snapshot: "<commit> + uncommitted working tree"
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

### Step 4: Select the batch nodes

Map `risk_domains` to gates via `references/rust-domains.md` domain–gate matrix. Sort by priority (1 = highest) and keep at most **3 nodes** per the Deep tier budget. If 4+ domains fire, prioritize by risk.

The selected nodes are independent roots of ONE declaration: `edges: []`, no node declares `inputs`, no node declares `join`, and the run `budget.max_executions` is at least the node count. There is no serial safety lead and no gate-to-gate handoff — every node reviews the same frozen snapshot, and you reconcile the accepted reports yourself.

### Step 5: Declare the batch

Submit one complete declaration through a single `graph_declare({declaration: {...}})` call. Each node declares its node id, agent, `completion: {mode: "explicit"}`, `budget: {timeout_ms: 300000}`, and outcomes `pass`, `revise`, `escalate`; each node prompt carries the Engineering brief, the reviewed snapshot with diff and artifact paths, the read-only scope, the checks the node may run and the gate report shape. Never author `max_retries` or `loop_groups`.

Node prompts per domain:

- **`safety`** — `rust-engineer--safety-reviewer`: audit unsafe blocks, FFI boundaries, pointer provenance, `repr(C)` layout, and unwinding safety per the rust-domains.md unsafe-ffi check list and the `unsafe_surface` brief field.
- **`async`** — `rust-engineer--async-auditor`: audit async task lifecycle, cancellation, backpressure, lock-guard validity, `Pin` safety, and deadlock freedom per the rust-domains.md async-concurrency check list and the `concurrency_model` brief field.
- **`api`** — `rust-engineer--api-reviewer`: audit semver impact, `pub` item documentation, feature-flag coherence, MSRV conformance, and naming conventions per the rust-domains.md public-api check list and the `public_api_changes` brief field.
- **`performance`** — `rust-engineer--perf-profiler`: audit allocation patterns, hot path cost, lock contention, binary size, and inlining decisions per the rust-domains.md performance-hotpath check list and the `performance_context` brief field.
- **`cross-platform`** — `rust-engineer--cross-platform-checker`: audit cfg gate coverage, target-specific compilation, endian safety, file path portability, and build script correctness per the rust-domains.md cross-platform check list and the `cross_platform_context` brief field.

Inspect the `graph_declare` result: the persisted plan **and** `start.kind`. A saved plan is not proof of dispatch. After a confirmed start, yield for the `GRAPH COMPLETE` / `GRAPH BLOCKED` notification — never poll in a loop.

### Step 6: Integrate accepted reports — bounded repair loops

Read each accepted report from `attempts[].result` via `graph_status`.

**Pass**: proceed. Merge any checked `engineering_state_patch` entry as a brief correction.

**Fail**: apply `required_revisions` before proceeding. When independent re-verification is needed, declare a FRESH batch for the updated snapshot with a new `name` and the prior issue ids. **Max 2 repair rounds per gate**: if the second re-review also returns `fail`, do NOT loop again. Report residual risk explicitly and proceed with self-review.

**Needs-user-input**: the node settled `escalate`. Stop. Surface the exact question to the user. Do not proceed until answered.

Reviewers never edit the code under review and never revise each other — only you repair the change. A settled graph is not acceptance; a complete run may still carry `revise` or `escalate` reports.

### Step 7: Full verification

Run the full verification plan from the Engineering brief:

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
