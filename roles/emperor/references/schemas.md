---
name: schemas
description: Canonical inter-agent contract schemas — Strategy, Review Verdict, Validate Result, Execution Report, and Revision Dispatch
---

# Inter-Agent Contract Schemas

**Purpose**: This document defines the canonical schema for every inter-agent contract in the Emperor orchestration system. All producers MUST conform to these schemas exactly. All consumers rely on these contracts and MUST NOT accept field drift.

**Rule**: There is exactly ONE schema per contract. No producer may rename, add, or remove fields without updating this document first (see [Field Drift Prevention](#field-drift-prevention)).

**The `result` fence is a universal return envelope.** Every dispatched subagent returns its payload to its parent inside a ` ```result ` fence. The fence name is constant; the PAYLOAD schema is determined by the producer — `orchestrate` returns a Strategy, `validate` returns a Validate Result, and jinyiwei and its departments return an Execution Report. A consumer knows which schema to expect from the dispatch it made, so the shared fence name is unambiguous at runtime.

---

## Contracts

### 1. Strategy

**Artifact fences**: `plan`, `draft`, `final_strategy`

**Produced by**: chancellor (plan), drafter (draft), finalizer (final_strategy)

**Consumed by**: emperor (dispatch gate), jinyiwei (execution)

**Purpose**: Describes the objective and dependency-ordered subtasks for a unit of work. The `risk` field determines whether the emperor auto-dispatches or presents the strategy to the user for approval.

#### Fields

| Name | Type | Required | Enum/Constraint | Description |
|------|------|----------|-----------------|-------------|
| `objective` | string | yes | — | One sentence stating the end goal. Emperor uses this for routing decisions. |
| `subtasks` | array | yes | — | Ordered list of dispatchable execution units. |
| `subtasks[].id` | integer | yes | monotonic from 1 | Unique identifier within the strategy. |
| `subtasks[].description` | string | yes | — | Concrete, scoped instruction. Jinyiwei reads only this line — no surrounding context. Include specific files, functions, behaviors. |
| `subtasks[].target` | string | yes | `jinyiwei` | The dispatch target. |
| `subtasks[].dependencies` | integer[] | yes | IDs of other subtasks | Subtasks that must complete before this one. Empty `[]` means runnable immediately. |
| `subtasks[].acceptance` | string | yes | — | Verifiable done-condition. Must be checkable with tools (lsp_diagnostics clean, build exits 0, grep for patterns). Not "looks good" or "should work." |
| `risk` | string | yes | `low` \| `high` | Overall execution risk. `high` triggers user approval gate before dispatch. |
| `notes` | string | no | — | Optional additional context for the emperor. Single string, not a list. |
| `subtasks[].research_required` | boolean | no | `true` \| `false` (default `false`) | When true, the subtask requires evidence-backed research into external API/library/platform behavior before implementation. Overrides default execution workflow. |

#### Forbidden Fields

| Field | Reason |
|-------|--------|
| `risks` (list form) | Replaced by scalar `risk`. No producer emits a list. |
| `final_notes` | Not part of the canonical strategy contract. Use `notes` instead. |
| `subtasks[].id` as string | IDs are integers only. No short-id strings. |

#### Example

```yaml
objective: "Add rate limiting middleware to the API layer"
subtasks:
  - id: 1
    description: "Create rate_limiter.go in internal/middleware with token-bucket algorithm"
    target: jinyiwei
    dependencies: []
    acceptance: "lsp_diagnostics clean, go build ./... exits 0"
  - id: 2
    description: "Wire rate limiter into the router in cmd/server/main.go"
    target: jinyiwei
    dependencies: [1]
    acceptance: "lsp_diagnostics clean, go test ./internal/middleware/... passes"
risk: low
notes: "Default limit should be 100 req/s per IP"
```

---

### 2. Review Verdict

**Artifact fence**: `review_verdict`

**Produced by**: reviewer

**Consumed by**: chancellor (orchestrate — pass/fail gate for drafter revision loop)

**Purpose**: Audit verdict on a strategy draft. A `veto` verdict sends the draft back to the drafter with concrete revision notes. A `pass` verdict allows the draft to proceed to finalization.

#### Fields

| Name | Type | Required | Enum/Constraint | Description |
|------|------|----------|-----------------|-------------|
| `verdict` | string | yes | `pass` \| `veto` | Whether the draft passes review. |
| `notes` | string | yes | — | Concrete revision notes if veto; confirmation context if pass. |
| `severity` | string | yes | `low` \| `medium` \| `high` | Overall severity assessment of issues found. Named `severity` to avoid collision with the strategy contract's `risk` field. |

#### Forbidden Fields

| Field | Reason |
|-------|--------|
| `risk` | Collides with strategy contract's `risk` field. Use `severity` instead. |

#### Example

```yaml
verdict: veto
notes: "Subtask 2 lacks acceptance criteria. Subtask 3 references a file that does not exist (config/settings.yaml)."
severity: medium
```

---

### 3. Validate Result

**Artifact fence**: `result`

**Produced by**: validator (validate)

**Consumed by**: emperor

**Purpose**: Per-item pass/revise verdict comparing an execution report against the original strategy's acceptance criteria. Informational only — the emperor reads the verdict and decides next steps; no automatic retry.

#### Fields

| Name | Type | Required | Enum/Constraint | Description |
|------|------|----------|-----------------|-------------|
| `verdict` | string | yes | `pass` \| `revise` | Aggregate verdict. `pass` means every item meets its acceptance criteria. `revise` means at least one item has unmet criteria. |
| `items` | array | yes | — | Per-subtask assessment. |
| `items[].id` | integer | yes | matches strategy subtask ID | The subtask ID from the original strategy. |
| `items[].status` | string | yes | `pass` \| `revise` | Whether this subtask's acceptance criteria are fully met. |
| `items[].note` | string | yes | — | For `pass`: confirmation of evidence reviewed. For `revise`: description of what is missing and suggested fix direction. |

#### Example

```yaml
verdict: revise
items:
  - id: 1
    status: pass
    note: "rate_limiter.go created, lsp_diagnostics clean, build passes"
  - id: 2
    status: revise
    note: "main.go import references middleware.RateLimiter but the function is named NewRateLimiter in the package"
```

---

### 4. Execution Report

**Artifact fence**: `result`

**Produced by**: jinyiwei (executor), departments (backend/test/ui)

**Consumed by**: emperor, validator (validate)

**Purpose**: Structured summary of what was executed, what files were modified, verification evidence, and any incomplete items. The emperor and chancellor use this to assess whether the subtask was completed to the acceptance criteria.

#### Structure (Markdown Sections)

The execution report is a markdown document with the following fixed section headings. Fields within each section are documented below.

| Section | Required | Description |
|---------|----------|-------------|
| `## Subtask` | yes | Subtask identifier or brief description (≤80 chars). |
| `### Files Modified` | yes | Bulleted list of every file touched, with a short change description per file. |
| `### Verification Evidence` | yes | Tool-level verification results. Subsections: `lsp_diagnostics`, `build/tests`, `Other evidence`. |
| `### Incomplete / Open Items` | yes | Bulleted list of unfinished items with reasons. Use `None` if nothing is pending. |
| `### Summary` | yes | One to two sentence verdict: what was done, final state. |
| `### Research Evidence` | no | Bulleted list of research citations in format: `- {source type}: {citation} — {what was verified}`. Included only when research was conducted as part of the subtask. |

#### Section Details

**`## Subtask`**: Heading text is the subtask ID or a concise label. No additional fields.

**`### Files Modified`**: Bulleted list in format:
```
- `path/to/file` — short description of change (≤10 words)
```

**`### Verification Evidence`**: Three sub-subsections, each as a bold label followed by the result:

| Sub-section | Required | Format |
|-------------|----------|--------|
| `lsp_diagnostics` | yes | `{clean}` or list specific errors/warnings |
| `build/tests` | yes | `{passed}` or include command and failure output |
| `Other evidence` | no | Manual verification, non-code checks, or `None` |

**`### Incomplete / Open Items`**: Bulleted list in format:
```
- {item}: {reason not yet done}
```
Use `None` if nothing is pending. Never omit this section.

**`### Summary`**: Plain text. One to two sentences. No fluff.

**`### Research Evidence`**: Optional section. Bulleted list of citations in format:
```
- {source type}: {citation} — {what was verified}
```
`{source type}` is one of: `docs` (official library/framework docs), `source` (source code), `experiment` (local reproduction), `issue` (issue tracker), `discussion` (forum/discussion), `blog` (engineering blog).
`{citation}` is a URL, file path, or reference to the specific source consulted.
`{what was verified}` is a short statement of what was confirmed or disproven.
Include only when the subtask involved evidence-backed research. Omit entirely for standard implementation subtasks.

#### Forbidden Patterns

| Pattern | Reason |
|---------|--------|
| Empty `### Incomplete / Open Items` section | Must explicitly state `None` if nothing is pending. |
| Unverified claims in `### Verification Evidence` | Never guess. If a check was not run, say so. |
| Content after the closing fence | Everything after the ` ```result ` fence is invisible to `dispatch_output`. |

#### Example

```result
## Subtask: 1 — Create rate_limiter.go

### Files Modified
- `internal/middleware/rate_limiter.go` — new file with token-bucket implementation
- `internal/middleware/rate_limiter_test.go` — unit tests for token-bucket

### Verification Evidence
- **lsp_diagnostics**: clean
- **build/tests**: `go test ./internal/middleware/...` — 4 tests passed, 0 failed
- **Other evidence**: None

### Incomplete / Open Items
- None

### Summary
Created rate_limiter.go with token-bucket algorithm. All tests pass, diagnostics clean. Ready for router wiring in subtask 2.

### Research Evidence
- **docs**: https://pkg.go.dev/golang.org/x/time/rate — confirmed token-bucket API signatures
- **source**: internal/middleware/rate_limiter.go — verified exported interface matches docs
```

## Revision Dispatch (Re-Execution Input)

**Direction**: emperor → jinyiwei (closed-loop revise rounds only)

**Purpose**: Re-execute a failed subtask idempotently. The emperor uses `dispatch_retry(task_id)` to reopen the failed item's original session. The checkpoint context (including `### Files Modified` from the prior execution) is auto-injected into the retry prompt — the revision prompt no longer needs to carry prior file lists verbatim.

A revision dispatch prompt MUST carry:

| Field | Source | Purpose |
|-------|--------|---------|
| subtask id + original description | strategy | identifies the unit |
| validator note | validate result `items[].note` | what is wrong |
| fix direction | emperor | the specific correction |
| revision flag | emperor | explicit "this is a revision — edit in place; do NOT recreate, duplicate, or re-append" |

The worker reads existing files first (from the reopened session's workspace state), then makes minimal corrective edits guided by the validator note and fix direction. One failed item per re-dispatch (see `functions/synthesize.md` Step 4b).

---

## Field Drift Prevention

**Principle**: This document is the single source of truth for inter-agent contract schemas. All producers reference it. No producer may unilaterally change a contract.

**Before changing any field**:
1. Propose the change in this document first (add/modify the field table).
2. Update all producers that emit that contract.
3. Update all consumers that parse that contract.
4. If the change is backward-incompatible, version the contract or coordinate a flag day.

**Producer conformance status** (all producers conform to the canonical schema as of v2.0.0):

| Producer | Contract point | Status |
|----------|----------------|--------|
| drafter | integer `subtasks[].id`, scalar `risk`, no `risks` list | Conforms — enforced in `draft.md` schema rules |
| finalizer | integer IDs, scalar `risk`, `notes` (not `final_notes`) | Conforms — enforced in `finalize.md` field rules |
| reviewer | emits `severity` (not `risk`) | Conforms — enforced in `review.md` and `veto-criteria` skill |
| validator | English-only output | Conforms — enforced in the validator's `validate.md` |
| jinyiwei | canonical execution-report section structure | Conforms — enforced in `report.md` / `route.md` |
| jinyiwei | `research_required` subtask field | Conforms — optional boolean, schema updated in schemas.md §1 |
| jinyiwei | `### Research Evidence` report section | Conforms — optional section, schema updated in schemas.md §4 |

If any future edit reintroduces a divergence, the reviewer's `veto-criteria` skill and this table are the enforcement points. **If a consumer receives a field not in this document**: reject it. Unknown fields are a producer error.

**If a producer needs a new field**: add it here first, then implement.


---

## Out-of-Band Signal Architecture

**Purpose**: Define the signal-based state-machine driver for out-of-band transitions across functions — enabling declarative orchestration replace of imperative triage and text-fence parsing patterns.

**Status**: Adopted in the function model. All function authors MUST understand signal mechanics before designing transitions. Signal semantics are defined here; individual functions wire them via `transitions[].when: signal_observed(type)`.

### 1. Signal Tool Contract

The `signal(type, payload?)` tool is a control-plane primitive for out-of-band state transitions.

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `type` | yes | string | One of: `answer`, `need_approval`, `blocked`, `need_clarification`, `handoff`, `progress`, `revise_needed`, `escalate` |
| `payload` | no | JSON object | Structured data for the signal consumer. Schema is signal-type-specific (see taxonomy below). |

**Behavior**:
- Returns a confirmation string on call.
- Triggers no side effects beyond the standard tool-after observation pipeline.
- The signal is recorded in the session's signal ledger — a typed event log that the condition `signal_observed(type)` queries.
- Multiple calls of the same type are tracked; `signal_observed` is satisfied by the first occurrence.
- Payload from the most recent call of each type is captured (via `capture_payload_as`) and stored as a named artifact accessible to parent functions.

### 2. Signal Type Taxonomy

All eight signal types, their payload requirements, mechanism mapping, and canonical use cases:

| Type | Payload Required? | Payload Schema | Mechanism | Canonical Use Case |
|------|------------------|----------------|-----------|--------------------|
| `answer` | No | — | Terminating | Function completes normally and returns its result. The standard "done" signal. |
| `need_approval` | Yes | `{action: string, description: string, details?: object}` | Pausing | Function encounters a destructive or high-risk operation and pauses, awaiting user confirmation. |
| `blocked` | Yes | `{reason: string, blocker_type: string, wait_for?: string}` | Pausing | Function cannot proceed due to an external dependency or missing resource. Parent may retry or skip. |
| `need_clarification` | Yes | `{question: string, options: string[], context?: string}` | Pausing | Function finds the task description ambiguous and needs user input before continuing. |
| `handoff` | Yes | `{target: string, context: object, reason: string}` | Non-terminating | Function hands a sub-context to another function or subagent without completing itself. |
| `progress` | No | Free-form JSON | Non-terminating | Function reports intermediate status (e.g., "step 3 of 7 complete"). Informational only — does NOT satisfy a terminating continue_until. |
| `revise_needed` | Yes | `{items: [{id: string, note: string}], original_task?: string}` | Terminating | Function determines that its output needs revision. Payload carries structured revision items. |
| `escalate` | Yes | `{reason: string, failed_attempts: number, last_error: string}` | Terminating | Function encounters an unrecoverable error and escalates to the recovery handler or parent. |

**Mechanism semantics**:
- **Terminating**: The signal satisfies `continue_until` conditions and ends the function's execution loop.
- **Pausing**: The signal deactivates the current function but does not end the loop; a parent or approval function must reactivate it.
- **Non-terminating**: The signal provides information only; it does not affect `continue_until` evaluation.

### 3. Transition-Driven Exemplars

Each exemplar documents a real transition pattern. YAML fragments show the declarative state-machine wiring.

#### Pattern A: Destructive approval gate via signal

```yaml
# In a hypothetical execute_destructive function:
transitions:
  - when: signal_observed(need_approval)
    activate: [await_approval]
    deactivate: [execute_destructive]

# The await_approval function:
gate: user_approval
transitions:
  - when: user_approval
    activate: [execute_destructive]
    deactivate: [await_approval]
```

**Explanation**: This replaces the current manual "check for approval in next turn's triage" flow with declarative state-machine orchestration. When `execute_destructive` calls `signal("need_approval", {action: "delete file", description: "..."})`, the `need_approval` transition fires: `execute_destructive` deactivates and `await_approval` activates. The user then approves or denies via the `user_approval` gate. On approval, `await_approval` deactivates and `execute_destructive` reactivates to continue. The model never needs to remember to check for pending approvals — the state machine enforces the flow.
> **Caveat:** This pattern works for same-session function transitions only. For subagent→parent approval flows (the common case in emperor orchestration), see [Cross-Session Signal Isolation](#cross-session-signal-isolation) below. The native kernel HITL flow (subagent signals `need_approval` → kernel pauses → parent approves/rejects via `dispatch_approve`/`dispatch_reject`) replaces the prior `dispatch_output`-based detection approach.

#### Pattern B: Escalate → recovery activation

```yaml
# In any executor function:
transitions:
  - when: signal_observed(escalate)
    activate: [recovery_handler]
    deactivate: [current_executor]
```

**Explanation**: Maps to the existing [`escalate-recovery`](/Users/mgl/.config/opencode/rolebox/emperor/references/escalate-recovery.md) skill but makes it state-machine driven. When an executor calls `signal("escalate", {reason: "...", failed_attempts: 2, last_error: "..."})`, the escalate transition fires: the executor deactivates and the `recovery_handler` activates. The recovery handler reads the escalate payload from the captured `latest_escalate` artifact, assesses retry viability, and either re-dispatches or reports terminal failure. Previously this was a manual check at the start of each turn; now it is automatic.

#### Pattern C: Validator revise verdict

```yaml
# In validator function:
observe:
  - on: tool_after
    tool: signal
    when_args:
      match:
        type: revise_needed
    capture_payload_as: revise_items
continue_until:
  any:
    - signal_observed(answer)          # pass verdict
    - signal_observed(revise_needed)   # revise verdict
    - artifact_exists(result)          # fence fallback
```

**Explanation**: The validator signals `revise_needed` with a structured payload:
```json
{
  "items": [
    {"id": 2, "note": "main.go import references middleware.RateLimiter but the function is named NewRateLimiter"}
  ]
}
```
The parent function reads the `revise_items` artifact (captured by the observer), extracts the items, and re-dispatches the affected subtask. No text-fence parsing or string matching is required — the payload is structured data. The `artifact_exists(result)` clause remains as a backward-compatible fallback for non-signal-aware callers.

#### Pattern D: Progress reporting (non-terminating signal)

```yaml
observe:
  - on: tool_after
    tool: signal
    when_args:
      match:
        type: progress
    capture_payload_as: latest_progress
# Note: progress does NOT appear in continue_until — it is informational only
continue_until: signal_observed(answer)
```

**Explanation**: An executor can report intermediate progress without triggering a state transition:
```js
signal("progress", {step: 3, total: 7, current_phase: "validation"})
```
The parent observes and optionally logs the progress, but the function continues executing normally. Only `signal_observed(answer)` (or another terminating signal) ends the loop. This is useful for long-running operations where the parent wants visibility into the current stage without interrupting execution.

#### Cross-Session Signal Isolation (Kernel-Enabled HITL)

`signal_observed(type)` remains session-scoped — the parent session's condition evaluator cannot directly observe a subagent's signals. However, the kernel now natively supports HITL for the `need_approval` signal type at the dispatch level.

**Approval flow (subagent → parent):**

When a subagent calls `signal(type="need_approval", payload={action, risk, details})`:

1. The completion evaluator (`src/dispatch/completion/completion-evaluator.ts:40-109`) recognizes `need_approval` as a pausing signal and transitions the dispatch task to `awaiting_approval` state.
2. The parent session receives a standard completion notification — the task is paused, not terminated. The `payload` from the signal is carried in the notification.
3. The parent presents the flagged operation (action, risk, details from payload) to the user for explicit approval.
4. On user approval, the parent calls `dispatch_approve(task_id)` — the original worker session resumes execution from where it paused.
5. On user rejection, the parent calls `dispatch_reject(task_id, reason)` — the task transitions to a terminal error state and the destructive operation is never executed.

**No re-dispatch needed on approval.** The original session continues, unlike the pre-planned destructive flow (chancellor → user approval → fresh jinyiwei dispatch). The `approval_request` artifact is still captured in the subagent's session as a structured record, but the parent uses the kernel notification + `dispatch_approve`/`dispatch_reject` tools rather than parsing execution report text.

### 4. Dual-Channel Migration Guide

As the system transitions from fence-only to signal-native orchestration, all functions pass through four phases:

| Phase | Channel A | Channel B | When |
|-------|-----------|-----------|------|
| **1 — Current** | `signal_observed(answer)` | `artifact_exists(result)` | Both are valid in `continue_until`. Functions may fire either (or both). The fence is the dominant channel. |
| **2 — Signal-primary** | `signal_observed(answer)` | `artifact_exists(result)` | New functions use signal-only. Old functions keep dual-channel for backward compatibility. Observers are added to capture signal payloads. |
| **3 — Fence fallback** | `signal_observed(answer)` | `artifact_exists(result)` | The fence becomes a legacy fallback. Primary orchestration decisions use signal state. All new functions MUST emit `signal("answer")` on completion. |
| **4 — Fence deprecation (optional/far future)** | `signal_observed(answer)` | — | The fence is removed from `continue_until`. All functions complete by signaling. The fence is used only for textual result delivery, never for completion detection. |

**Example `continue_until` expressing the Phase 2 dual-channel pattern**:
```yaml
continue_until:
  any:
    - signal_observed(answer)
    - artifact_exists(result)
```
The `any` compositor means the function completes on the first of: signal answer received, or result fence materialized. Both paths are valid during migration.
| Safeguard | Description |
|-----------|-------------|
| **Evidence-gated signal** | Two mechanisms prevent premature completion. (1) The `requires_evidence` field (event-handler.ts:199-206) hard-gates the function — if evidence is not yet met, the continuation engine skips this function entirely on the idle cycle. Neither continuation nor completion is evaluated until evidence arrives. (2) The `evidence_met()` condition (conditions.ts:51) can be composed with signal conditions via `all: [signal_observed(answer), evidence_met()]` for finer-grained control. Together these ensure a function cannot complete via signal before verification checks pass. |
| **continue_max applies unconditionally** | The continuation engine's `blockingReason` (continuation.ts:39-46) runs BEFORE any condition evaluation. Per-fn cap, global cap, loop detection, and cooldown are computed independently of the completion condition type — whether `signal_observed`, `artifact_exists`, or any composite. A function cannot bypass caps by switching signal types. |
| **Dual-channel `any:[...]`** | When using `any: [signal_observed(answer), artifact_exists(result)]`, EITHER path triggers completion. This handles two failure modes during migration: the model calls `signal("answer")` but never writes the result fence, OR the model writes the result fence but forgets to signal. The function completes on the first satisfied condition. |
| **Multi-signal independence** | Each signal type is tracked independently in `kv["__signals_observed"]`. `signal_observed(progress)` does NOT satisfy `signal_observed(answer)`. The first signal of each type sets the observation; subsequent calls of the same type update the payload but do not re-trigger transitions. |
| **Orphaned signal on completed function** | If a function is already in `"complete"` phase (e.g. the fence condition was satisfied on a prior idle cycle), any subsequent `signal(...)` call is inert for continuation. The observe handler (observe.ts:41-51) still records the signal in `__signals_observed`, but the continuation loop (event-handler.ts:197) skips functions in `"complete"` phase — the condition evaluation path never runs. This prevents stale signals from re-activating completed functions. |
| **Unrecognized signal types** | If a model calls `signal` with a `type` not in the taxonomy, the tool returns an error and the signal is not recorded. No transition fires. Prevents silent misbehavior from typos or ad-hoc type creation. |

#### Phase 3: Fence Downgrade (Signal-Only Paths Identified)

##### Signal-Only Viable Paths (fence can be removed in future)

| Producer | Consumer | Artifact | Reason |
|----------|----------|----------|--------|
| drafter → chancellor | orchestrate reads dispatch_output | `draft` | Machine-to-machine — parent never displays raw content |
| reviewer → chancellor | orchestrate reads dispatch_output | `review_verdict` | Machine-to-machine — parent never displays raw content |
| finalizer → chancellor | orchestrate reads dispatch_output | `final_strategy` | Machine-to-machine — parent never displays raw content |
| validator → emperor | synthesize reads dispatch_output | `result` / `revise_items` | Machine-to-machine — structured items parsed programmatically |
| jinyiwei → emperor | synthesize reads dispatch_output | `result` | Machine-to-machine — execution report parsed programmatically |
| departments → jinyiwei | route reads dispatch_output | `result` | Machine-to-machine — execution report parsed programmatically |
| plan (state-machine) → orchestrate | same-session transition | `artifact_exists(plan)` | Same-session artifact gate — always signal-driven via state machine |

##### Fence-Required Paths (must keep indefinitely)

| Producer | Consumer | Artifact | Reason |
|----------|----------|----------|--------|
| emperor → user | Terminal display | `final_answer` | Human-readable output — displayed in the user's terminal |

##### Phase 3 Actions

1. **Update `continue_until` for signal-only paths**: Change from `any:[signal_observed(answer), artifact_exists(X)]` to `signal_observed(answer)` only (dropping `artifact_exists` fallback).
2. **Keep fence instruction in prompts** as "optional compatibility" rather than "required fallback" — the model may still emit a fence for backward compatibility, but the function no longer depends on it.
3. **Verify via testing strategy §3.3** that all signal-only functions complete without fence emission — the `signal_observed` path is the only satisfaction mechanism.
4. **Fence-required paths: no change ever** — the `final_answer` tag remains mandatory for user-facing terminal output. The `final_answer` fence will never be downgraded.

##### Phase 3 Criteria (must be met before executing)

- All signal-only path functions have been stable in production for ≥1 month with signal-primary.
- Zero instances of fence-only completion in logs (i.e., signal path is consistently used for every function completion).
- Testing strategy §3.3 smoke tests pass with signal-only (fence never written — function completes via `signal_observed(answer)` alone).
- No open issues in the function graph where a signal-only path lacks a reliable signal emission path.

---

### 5. Signal Payload Schemas

**Purpose**: Define the structured payload schema for each signal-emitting producer in the ecosystem. These payloads are captured as artifacts via the observer pipeline (`capture_payload_as`) and consumed by parent functions programmatically — no text parsing required.

Payloads flow through the `signal(type, payload)` tool call. The parent observes the call via an ObserveSpec with `when_args: {match: {type: ...}}` and `capture_payload_as`. Each producer has exactly one payload schema. Consumers MUST NOT assume fields exist beyond those documented here.

#### Chancellor `final_strategy` (emitted by orchestrate)

**Signal**: `signal(type="answer", payload={...})`

```json
{
  "type": "answer",
  "payload": {
    "objective": "<clear one-sentence goal>",
    "subtasks": [
      {
        "id": 1,
        "description": "<concrete, scoped instruction>",
        "target": "jinyiwei",
        "dependencies": [],
        "acceptance": "<verifiable done-condition>",
        "research_required": false
      }
    ],
    "risk": "low|high",
    "notes": "<optional context>"
  }
}
```

#### Validator Verdict — Pass

**Signal**: `signal(type="answer", payload={...})`

```json
{
  "type": "answer",
  "payload": {
    "verdict": "pass",
    "items": [
      {
        "id": 1,
        "status": "pass",
        "note": "<confirmation of evidence reviewed>"
      }
    ]
  }
}
```

#### Validator Verdict — Revise

**Signal**: `signal(type="revise_needed", payload={...})`

Captured as `revise_items` artifact by the synthesize function's observer.

```json
{
  "type": "revise_needed",
  "payload": {
    "verdict": "revise",
    "items": [
      {
        "id": 1,
        "status": "revise",
        "note": "<what is missing and suggested fix direction>"
      }
    ]
  }
}
```

#### Jinyiwei Execution Report (emitted by route)

**Signal**: `signal(type="answer", payload={...})`

```json
{
  "type": "answer",
  "payload": {
    "subtask_id": 1,
    "summary": "<1-2 sentence verdict>",
    "files_modified": ["path/to/file"],
    "verification": "<lsp_diagnostics clean, tests passed>"
  }
}
```

#### Drafter Draft Revision (emitted by draft)

**Signal**: `signal(type="answer", payload={...})`

```json
{
  "type": "answer",
  "payload": {
    "objective": "<clear one-sentence goal>",
    "subtasks": [
      { "id": 1, "description": "...", "target": "jinyiwei", "dependencies": [], "acceptance": "..." }
    ],
    "risk": "low|high",
    "notes": "<optional>"
  }
}
```

#### Reviewer Verdict (emitted by review)

**Signal** (pass): `signal(type="answer", payload={...})`
**Signal** (veto): `signal(type="revise_needed", payload={...})`

```json
{
  "type": "answer|revise_needed",
  "payload": {
    "verdict": "pass|veto",
    "notes": "<revision notes or confirmation>",
    "severity": "low|medium|high"
  }
}
```

#### Finalizer Final Strategy (emitted by finalize)

**Signal**: `signal(type="answer", payload={...})`

```json
{
  "type": "answer",
  "payload": {
    "objective": "<goal>",
    "subtasks": [
      { "id": 1, "description": "...", "target": "jinyiwei", "dependencies": [], "acceptance": "..." }
    ],
    "risk": "low|high",
    "notes": "<optional>"
  }
}
```

### Decision Records

**DR-001: Cross-session signal propagation — partially resolved.**
- **Decision**: The transition-driven `need_approval` gate (Pattern A) remains same-session only, but the kernel now supports HITL at the dispatch level via `awaiting_approval` state.
- **Rationale**: The `signal_observed()` condition evaluator remains session-scoped. However, the completion evaluator (`completion-evaluator.ts:40-109`) intercepts `need_approval` signals at the dispatch boundary, enabling the parent to use `dispatch_approve`/`dispatch_reject` tools directly.
- **Current approach**: Subagent signals `need_approval` → kernel transitions to `awaiting_approval` → parent approves via `dispatch_approve(task_id)` — original session resumes. No re-dispatch needed.
- **Remaining gap**: `signal_observed()` in the parent's function conditions still cannot see subagent signals. Full cross-session event bubbling remains a future enhancement.

---

## Relationship to Existing Contracts

The signal architecture does not replace any existing contract schema. It operates at a different layer — the **control plane** of the function model — whereas the contracts above (§1–4) are **data plane** schemas for inter-agent payloads. Key distinctions:

| Layer | Scope | Mechanism | Examples |
|-------|-------|-----------|----------|
| Control plane | Function lifecycle | `signal` / observe / `transitions` | Activate/deactivate functions, gate continuations, capture payloads |
| Data plane | Inter-agent contracts | `dispatch` / `result` fence | Strategy, Validate Result, Execution Report |

The signal architecture controls WHEN and WHETHER a function transitions. The data plane contracts control WHAT information passes between agents. They are independent and composable.
