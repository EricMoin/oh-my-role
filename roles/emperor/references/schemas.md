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
```

---

## Revision Dispatch (Re-Execution Input)

**Direction**: emperor → jinyiwei → department (closed-loop revise rounds only)

**Purpose**: Re-execute a failed subtask idempotently. The emperor re-dispatches to a NEW jinyiwei session, and the original department session cannot be resumed across the isolation boundary — so the prior work is invisible to the new worker unless the prompt carries it. Without this contract a revision would recreate or duplicate work already done.

Unlike the contracts above, this is an INPUT prompt shape (not a fenced return envelope). A revision dispatch prompt MUST carry:

| Field | Source | Purpose |
|-------|--------|---------|
| subtask id + original description | strategy | identifies the unit |
| prior `### Files Modified` + `### Summary` | the item's previous execution report | tells the worker what already exists |
| validator note | validate result `items[].note` | what is wrong |
| fix direction | emperor | the specific correction |
| revision flag | emperor | explicit "this is a revision — edit in place; do NOT recreate, duplicate, or re-append" |

The worker treats the listed files as existing state: it reads them first, then makes minimal corrective edits. One failed item per dispatch (see `functions/synthesize.md` Step 4b). This is how the closed loop stays idempotent across isolated sessions.

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

If any future edit reintroduces a divergence, the reviewer's `veto-criteria` skill and this table are the enforcement points. **If a consumer receives a field not in this document**: reject it. Unknown fields are a producer error.

**If a producer needs a new field**: add it here first, then implement.
