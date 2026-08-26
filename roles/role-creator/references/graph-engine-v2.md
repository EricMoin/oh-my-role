# Graph Engine v2 — Role Authoring Guide

The canonical reference for role authors building multi-agent orchestration on the
rolebox Graph Engine v2. This document is the **live contract** for the imperative
`graph_*` tool family and the `signal` tool. It mirrors the authoritative in-repo
examples:

- emperor 2.9.0 — `roles/emperor/role.yaml` (graph block), `roles/emperor/PROMPT.md`
  (signal-approval, stale-node, and background-orchestration sections),
  `roles/emperor/subagents/chancellor/functions/orchestrate.md` (full graph recipe).
- ai-designer 3.1.0 — `roles/ai-designer/role.yaml` + `roles/ai-designer/PROMPT.md`
  (graph-driven gate pipeline sections).
- rolebox-tester 5.0.0 — `roles/rolebox-tester/role.yaml` (memory block,
  `collaboration.termination`, signal-emitting subagents).
- `roles/emperor/references/schemas.md` — the out-of-band signal taxonomy.

> **Status**: adopted. Orchestration runs on the graph engine. A role authors its
> pipeline as ONE graph (`graph_create` → `graph_add_node` / `graph_add_edge` /
> `graph_add_loop` → `graph_run`), yields its turn, and collects results via
> `graph_status(include_output=true)`. The legacy v1 tool family is removed and
> MUST NOT appear as a live contract — see
> [Legacy Vocabulary](#9-legacy-vocabulary--must-not-appear-as-a-live-contract).

---

## 1. Orchestration Model

The graph engine replaces sequential/background orchestration with a declarative
graph that the engine executes. Three properties define how a role uses it:

1. **Imperative authoring at runtime.** The `graph_*` tools are ordinary tools the
   role calls each request. There is no static graph declaration that the engine
   reads — the role builds the graph, then runs it.
2. **Non-blocking execution.** `graph_run` launches ready nodes and returns
   immediately. The role ends its turn and is re-awakened by a `[GRAPH COMPLETE]`
   (or `[GRAPH BLOCKED]`) system-reminder.
3. **Signal-driven edges.** Nodes exchange control flow by emitting `signal(...)`
   tool calls; `on_signal` edges route those signals to downstream or upstream
   nodes. See [Signal Tool Taxonomy](#3-signal-tool-taxonomy).

### 1.1 role.yaml graph block

Role manifests that orchestrate subagents declare the engine mode in `role.yaml`:

```yaml
# roles/<role>/role.yaml
graph:
  orchestration: graph_v2
  # The declarative `collaboration:` edge list below mirrors what graph_add_edge
  # wires at runtime; the live execution path is the imperative graph_* tools.
```

The `collaboration:` block (flow edges, `max_iterations`, `termination`) is a
legacy v1 declaration kept for schema compatibility. It feeds only the legacy
`rolebox/src/graph/collaboration-bridge.ts` bridge and does NOT bound the
imperative `graph_add_loop` revise/review cycles — the engine enforces loop bounds
via `max_traversals` (see [Loop Groups](#5-loop-groups--bounded-revisereview-cycles)).

---

## 2. Graph Tool Contract

All signatures below are the canonical contract. Parameters marked **required**
must be supplied; optional parameters are listed with their meaning.

### 2.1 `graph_create`

Create a new graph / orchestration context.

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `name` | yes | string | Human-readable graph name for logging (e.g. `"plan-<req>"`). |
| `budget` | no | object | Graph-level resource limits: `max_total_input_tokens`, `max_total_output_tokens`, `max_total_cost_usd`. |

Returns a `graph_id` used by all subsequent `graph_*` calls for this graph.

```js
graph_id = graph_create(name="design-request").graph_id
```

### 2.2 `graph_add_node`

Register a worker node bound to a subagent. One node per stage / subtask.

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `graph_id` | yes | string | The graph to add the node to. |
| `id` | yes | string | Unique node identifier within this graph (e.g. `"drafter"`, `"design"`, `"n1"`). |
| `agent` | yes | string | Subagent identifier to run (e.g. `"emperor--chancellor--drafter"`). |
| `prompt` | yes | string | The prompt the node's agent executes. **All cross-session input flows through this prompt** (see [Cross-Session Data Flow](#6-cross-session-data-flow)). |
| `needs_approval` | no | bool | When `true`, the engine pauses this node in `blocked` state if its agent emits `signal(type="need_approval")` (see [needs_approval Gates](#4-needs_approval-gates-human-in-the-loop)). |
| `budget` | no | object | Per-node resource limits: `max_input_tokens`, `max_output_tokens`, `max_cost_usd`, `timeout_ms`, `max_retries`. |
| `timeout_ms` | no | number | Wall-clock timeout for this node (ms). A node past its budget is treated as stale. |
| `max_retries` | no | number | Auto-retry count on `escalate`. |
| `join` | no | object | Fan-in convergence for multiple upstream edges: `{strategy: "all" \| "any" \| "quorum", quorum: number}`. |
| `completion_condition` | no | string | Named condition that auto-completes the node. |

Structural validation is atomic — an invalid node is rejected without mutating
the graph.

```js
graph_add_node({ graph_id, id: "reviewer", agent: "emperor--chancellor--reviewer",
                 prompt: "Review this draft and emit a verdict (pass or veto): {draft}" })
```

### 2.3 `graph_add_edge`

Wire data flow and control flow between two nodes.

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `graph_id` | yes | string | The graph containing both nodes. |
| `from` | yes | string | Source node ID. |
| `to` | yes | string | Target node ID. |
| `type` | no | enum | Edge activation rule: `always`, `on_signal`, or `on_condition`. |
| `signal_filter` | on_signal | string[] | Signal types that activate this edge (e.g. `["answer"]`, `["revise_needed"]`). Required when `type="on_signal"`. |
| `condition` | on_condition | string | Named condition that must evaluate true. Required when `type="on_condition"`. |
| `data_passthrough_include` | no | string[] | Whitelist of payload fields to pass downstream. |
| `data_passthrough_exclude` | no | string[] | Blacklist of payload fields to omit from the passed context. |
| `data_passthrough_max_chars` | no | number | Truncation limit for the passed context. |
| `retry` | no | number \| object | Auto-retry count when the source node emits `escalate`; object form `{max, backoff_ms}`. |

Canonical edge patterns:

```js
// Forward flow: source answers → target runs
graph_add_edge({ graph_id, from: "reviewer", to: "finalizer", type: "on_signal", signal_filter: ["answer"] })

// Revise back-edge: source requests revision → source-stage re-enters (loop group)
graph_add_edge({ graph_id, from: "reviewer", to: "drafter", type: "on_signal", signal_filter: ["revise_needed"] })

// Unconditional pipeline edge
graph_add_edge({ graph_id, from: "processor", to: "checker", type: "always" })
```

### 2.4 `graph_add_loop`

Declare a loop group — a set of nodes forming a bounded cycle.

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `graph_id` | yes | string | The graph to add the loop group to. |
| `id` | yes | string | Unique loop group identifier (e.g. `"review-cycle"`). |
| `nodes` | yes | string[] | Node IDs forming the cycle. |
| `max_traversals` | **yes** | number | **Hard cap — engine-enforced.** The loop exits after this many traversals. Required; pick the smallest bound that gives the cycle a fair chance to converge. |
| `termination` | no | object | Soft termination conditions for early exit, composed with `any_of` / `all_of`: `{max_iterations}`, `{timeout_ms}`, `{converged: "<condition>"}`, `{result_matches: {agent, contains\|regex\|score_gte\|no_changes}}`, `{stuck: {repeats}}`, `{budget_exhausted: true}`, `{signal: "<type>"}`. |
| `mode` | no | enum | Loop-round session isolation: `inherit` (rounds re-run within the SAME engine state — the real mode) is default. `fresh` is documented-unsupported and returns an explicit error; use a separate graph per round for per-round session isolation. |

```js
// Bound the draft→review revise cycle. max_traversals is required and engine-enforced.
graph_add_loop({ graph_id, id: "review-cycle", nodes: ["drafter", "reviewer"],
                 max_traversals: <a small task-appropriate bound> })
```

### 2.5 `graph_run`

Execute the graph. **Non-blocking**: it launches ready root nodes and returns
immediately with `phase`, `active_nodes`, and `pending_nodes`.

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `graph_id` | yes | string | The graph to execute. |
| `node_id` | no | string | Re-run a specific node. |
| `retry` | no | bool | When `true` with `node_id`, retry that node. |
| `modify_prompt` | no | string | When retrying, optionally modify the node's prompt. |
| `dry_run` | no | bool | Validate graph structure without executing. |

**Yield-and-wake protocol — this is the core rhythm:**

1. Author the whole request as ONE graph (create → nodes → edges → loop).
2. `graph_run(graph_id)` — returns immediately.
3. **END YOUR TURN.** Do not poll. Do not continue working.
4. The engine emits a `[GRAPH COMPLETE]` system-reminder when all nodes finish, or
   `[GRAPH BLOCKED]` when a `needs_approval` node pauses awaiting human approval.
5. On the reminder, read results ONCE via `graph_status(graph_id, include_output=true)`.

Polling `graph_status` is fallback-only (e.g. the user asks for status mid-run, or
a reminder appears lost). Never poll in a loop.

```js
graph_run(graph_id)
// END YOUR TURN — await [GRAPH COMPLETE] / [GRAPH BLOCKED]
```

### 2.6 `graph_status`

Unified observability endpoint — read node, loop, or graph state.

| Parameter | Description |
|-----------|-------------|
| `graph_id` | The graph to query (inferred from `node_id` / `loop_id` if omitted). |
| `node_id` | Query a specific node's runtime state. |
| `include_output` | **Include the materialized node result** — the primary way results are collected. |
| `loop_id` | Query a loop group's state. |
| `format` | `summary` (table) / `tree` / `json`. |
| `scope` | `session` (default, in-memory registry), `persisted` / `all` (cross-session hydrated graphs). |
| `query`, `status`, `agent`, `from_date`, `to_date`, `group_by`, `limit`, `depth` | Filters and aggregation. |
| `include_progress` / `include_liveness` | Latest progress-signal payload / liveness state (heartbeat, stall status). |
| `include_budget`, `include_metrics`, `include_loops`, `include_history`, `include_checkpoint`, `include_artifacts`, `include_evidence` | Per-area detail. |
| `stream`, `since` | Timestamped per-node signal-event history. |
| `max_chars`, `offset`, `tail` | Output truncation / pagination for large results. |
| `export_path` | Atomically write the node's materialized result (or metrics JSON) to a file. |

`graph_status` is a **safe, non-blocking liveness probe**: it NEVER throws while
work is in flight — it returns the node's current non-terminal status (e.g.
`running` / `ready` / `pending`) instead. This makes it the correct polling
primitive, unlike the legacy output tool which threw on running tasks.

```js
// Whole graph: read every node's output once
graph_status(graph_id, include_output=true)
// Single node: read one stage's materialized result
graph_status(graph_id, node_id="finalizer", include_output=true)
```

### 2.7 `graph_approve`

The human-in-the-loop resolution surface for blocked `needs_approval` nodes.

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `graph_id` | yes | string | The graph containing the blocked node. |
| `node_id` | yes | string | The `needs_approval` node currently `blocked`. |
| `action` | yes | enum | `approve` or `reject`. |
| `reason` | no | string | Rejection feedback — merged into the node's re-execution prompt when `action="reject"`. |
| `payload` | no | object | Optional approval output passed downstream on the `answer` edge when `action="approve"`. |

Semantics:

- `action="approve"` resolves the gate: `blocked → completed`, and the node's
  forward `answer` data flow resumes the graph automatically.
- `action="reject"` re-enters the node (when it belongs to a loop group) or
  escalates it (when it has no loop) with the supplied reason.
- Both actions are idempotent — a decision on an already-resolved node is a no-op.

No re-run is needed after approval; the engine drives the continuation from the
resolved gate (see [needs_approval Gates](#4-needs_approval-gates-human-in-the-loop)).

### 2.8 `graph_cancel`

Cancel a graph, node, or loop group.

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `graph_id` | yes | string | The graph containing the target. |
| `node_id` | no | string | Cancel a specific node. |
| `loop_id` | no | string | Cancel a loop group (resolved to its full member set). |
| `cascade` | no | bool | When `true`, cancel every node transitively downstream of the target (forward closure over edges). |

With neither `node_id` nor `loop_id`, the whole graph is cancelled. Returns the
ACTUAL cancelled node ids. Use it to free the engine/model-pool slot when a node
is stale, or when a path is abandoned (e.g. the user rejects a strategy) —
**never leave orphaned graph nodes running after you emit your final result**.

> Note: `graph_cancel` is a human-gated control — intended for monitoring and
> intervention, not agent-driven self-cancellation of a healthy running workflow.

---

## 3. Signal Tool Taxonomy

The `signal(type, payload?)` tool is the control-plane primitive. Nodes use it to
terminate, pause, or report; `on_signal` edges consume the emissions.

| Type | Payload Required? | Payload Schema | Mechanism | Canonical Use Case |
|------|-------------------|----------------|-----------|--------------------|
| `answer` | No | — | Terminating | Normal completion and result delivery. The standard "done" signal; drives forward edges. |
| `need_approval` | Yes | `{action: string, description: string, details?: object}` | Pausing | Destructive / high-risk operation discovered at runtime; pauses a `needs_approval` node in `blocked` state. |
| `blocked` | Yes | `{reason: string, blocker_type: string, wait_for?: string}` | Pausing | External dependency or missing resource prevents progress. Parent may retry or skip. |
| `need_clarification` | Yes | `{question: string, options: string[], context?: string}` | Pausing | Task is ambiguous; needs user input before continuing. |
| `handoff` | Yes | `{target: string, context: object, reason: string}` | Non-terminating | Hand a sub-context to another node / subagent without completing. |
| `progress` | No | Free-form JSON | Non-terminating | Intermediate status ("step 3 of 7"). Informational only. |
| `revise_needed` | Yes | `{items: [{id: string, note: string}], original_task?: string}` | Terminating | Output needs revision; structured revision items flow through the back-edge into the source stage's re-entry prompt. |
| `escalate` | Yes | `{reason: string, failed_attempts: number, last_error: string}` | Terminating | Unrecoverable error; triggers recovery (and edge-level auto-retry). |

**Mechanism semantics**:

- **Terminating** — completes the node's execution; the node's output is routed by
  `on_signal` edges filtered on the emitted type.
- **Pausing** — suspends the node without ending it; a parent or approval action
  must reactivate it (the `needs_approval` gate is the graph-native case).
- **Non-terminating** — information only; does not satisfy completion or fire
  termination-driven routing.

**How `on_signal` edges consume signals:**

| Signal | Typical edge wiring |
|--------|---------------------|
| `answer` | Forward edge `source → next` with `signal_filter: ["answer"]`. A `pass` verdict flows the draft to the finalizer; a completed gate flows to the next gate. |
| `revise_needed` | Back-edge `reviewer → drafter` / `review → design` with `signal_filter: ["revise_needed"]`. The engine re-enters the source stage with the revision items merged into its prompt. |
| `escalate` | Edge-level `retry` auto-retries the source node; repeated failure surfaces to the parent for honest reporting. |
| `need_approval` | Pauses the emitting `needs_approval` node; resolved via `graph_approve`, then the forward `answer` flow resumes. |
| `blocked`, `need_clarification`, `handoff`, `progress` | Routed by filtered edges when the graph declares them; otherwise informational for the parent's `graph_status(include_progress=true)` view. |

Multi-signal independence: each type is tracked independently — `signal(progress)`
does NOT satisfy `signal(answer)`, and an `on_signal` edge filtered on `answer`
does not fire on a `revise_needed` emission.

---

## 4. needs_approval Gates (Human-in-the-Loop)

The graph-native approval flow replaces the legacy "flag in report, re-run a new
session" pattern. Three pieces cooperate:

1. **Declaration.** The parent declares the gate on the node:

```js
graph_add_node({ graph_id, id: "worker", agent: "emperor--jinyiwei--backend",
                 prompt: "...", needs_approval: true })
```

2. **Pause.** When the node's agent emits `signal(type="need_approval",
   payload={action, risk, details})`, the engine's advancement critical section
   recognizes the signal on the declared `needs_approval` node and transitions it
   to `blocked` (awaiting approval), stashing an `approval_payload` in the node's
   signal ledger. The graph emits `[GRAPH BLOCKED]`.

3. **Resolution.** The parent reads the paused state —
   `graph_status(graph_id, node_id=…, include_output=true)` carries the
   `need_approval` / `approval_payload` summary — presents the flagged operation to
   the user, then:

```js
// User approved: node completes (blocked → completed); forward answer flow resumes.
graph_approve(graph_id, node_id="worker", action="approve")
// User rejected: node re-enters (loop-group member) or escalates (no loop).
graph_approve(graph_id, node_id="worker", action="reject", reason="...")
```

No re-run is needed on approval — the engine drives the continuation from the
resolved gate. The destructive operation is never executed on rejection.

---

## 5. Loop Groups — Bounded Revise/Review Cycles

Revise/review cycles (drafter↔reviewer, design↔review, processor↔checker) are
declared as **loop groups** whose bound is enforced by the engine, not by the
role's discipline.

- `graph_add_loop(..., max_traversals: N)` — `max_traversals` is **required** and
  **engine-enforced**: the loop exits after N traversals no matter what. Choose the
  smallest bound that gives the cycle a fair chance to converge; do not hardcode
  round-count prose in prompts (fixed round counts are not configurable and make
  root-causing harder).
- The revise back-edge (`on_signal`, `signal_filter: ["revise_needed"]`) re-enters
  the source stage; the engine merges the reviewer's structured revision items into
  that stage's re-execution prompt automatically.
- **Bound reached with an unresolved veto / failing review** → the loop exits at
  `max_traversals`; proceed best-effort with the limitation surfaced honestly
  (e.g. deliver the design with noted limitations, or surface the unresolved veto
  in the final strategy's notes).
- `termination` soft conditions (`max_iterations`, `timeout_ms`, `converged`,
  `result_matches`, `stuck`, `budget_exhausted`, `signal`) allow early exit before
  the hard cap.
- Session isolation: default `mode: "inherit"` re-runs rounds within the same
  engine state (checkpoint context auto-injected). `mode: "fresh"` is
  documented-unsupported — use a separate graph per round when per-round session
  isolation is required.

Node retry inside a loop uses the same-session continuation path:
`graph_run(graph_id, node_id=…, retry=true, modify_prompt=…)` re-opens the node's
session with its checkpoint context auto-injected — no unbounded retry loops.

---

## 6. Cross-Session Data Flow

Each graph node runs in its **own session**. The consequences are hard rules:

- **Pass ALL input via node prompts.** Stage content, draft text, design state,
  revision feedback — everything a node needs must be embedded in its
  `graph_add_node` prompt (or arrive via the edge's data passthrough). Do NOT
  expect a node to read artifacts produced by another session — cross-session
  artifact reads do not exist.
- **Collect via `graph_status(include_output=true)`.** Node results are read from
  the graph (materialized node output), never by having one node read another's
  files.
- **Structured control flow travels in signals.** Verdicts (pass/veto), revision
  items, and escalation reasons move in signal payloads routed by `on_signal`
  edges — no text-fence parsing between nodes.
- **The parent synthesizes.** Intermediate nodes return their own outputs; the
  orchestrating role (the graph author) integrates them and produces the final
  deliverable.

---

## 7. Canonical Authoring Recipe

The recipe below is the exact pattern in ai-designer 3.1.0's graph-driven gate
pipeline and emperor 2.9.0's orchestrate function. Use it for any multi-stage,
multi-node workflow.

**Step 1 — Author the graph.** Create ONE graph per request, add one node per
stage with the stage content embedded in its prompt, wire the flow edges, add the
revise back-edge, and bound the cycle:

```js
graph_id = graph_create(name="design-request").graph_id

// Standard tier: intake-strategist → design → review
graph_add_node({ graph_id, id: "intake", agent: "ai-designer--intake-strategist",
                 prompt: "Run the Intake gate. Current Design State: {state}" })
graph_add_node({ graph_id, id: "design", agent: "ai-designer--design",
                 prompt: "Run the Design gate. Current Design State: {state}" })
graph_add_node({ graph_id, id: "review", agent: "ai-designer--review",
                 prompt: "Run the Review gate. Current Design State: {state}" })

// Forward flow: intake → design → review
graph_add_edge({ graph_id, from: "intake", to: "design", type: "on_signal", signal_filter: ["answer"] })
graph_add_edge({ graph_id, from: "design", to: "review", type: "on_signal", signal_filter: ["answer"] })

// Review revise back-edge: review emits revise_needed → design re-enters
graph_add_edge({ graph_id, from: "review", to: "design", type: "on_signal", signal_filter: ["revise_needed"] })

// Bound the Design↔Review review cycle. max_traversals is required and engine-enforced.
graph_add_loop({ graph_id, id: "design-review", nodes: ["design", "review"], max_traversals: 2 })
```

**Step 2 — Run and yield.**

```js
graph_run(graph_id)
```

`graph_run` is NON-blocking: it launches the ready nodes and returns. **After
`graph_run`, END YOUR TURN.** The engine emits a `[GRAPH COMPLETE]` system-reminder
when the whole graph finishes (or `[GRAPH BLOCKED]` when a `needs_approval` node
pauses it).

**Step 3 — Collect outputs.** On the `[GRAPH COMPLETE]` reminder, read each node's
output ONCE:

```js
graph_status(graph_id, include_output=true)                        // whole graph
graph_status(graph_id, node_id="review", include_output=true)      // one gate
```

**Step 4 — Assemble.** Integrate the node outputs, resolve conflicts, and emit the
final deliverable (signal `answer` preferred; result fence for textual delivery).

The same shape with a bounded review loop appears in the planning pipeline
(drafter → reviewer → finalizer, with `reviewer → drafter` on `revise_needed`):

```js
graph_id = graph_create(name="plan-<req>").graph_id
graph_add_node({ graph_id, id: "drafter",   agent: "emperor--chancellor--drafter",
                 prompt: "Produce a strategy draft based on this plan: {plan}" })
graph_add_node({ graph_id, id: "reviewer",  agent: "emperor--chancellor--reviewer",
                 prompt: "Review this draft and emit a verdict (pass or veto): {draft}" })
graph_add_node({ graph_id, id: "finalizer", agent: "emperor--chancellor--finalizer",
                 prompt: "Produce the final strategy based on this approved draft: {draft}" })
graph_add_edge({ graph_id, from: "drafter",  to: "reviewer", type: "on_signal", signal_filter: ["answer"] })
graph_add_edge({ graph_id, from: "reviewer", to: "finalizer", type: "on_signal", signal_filter: ["answer"] })  // pass → finalize
graph_add_edge({ graph_id, from: "reviewer", to: "drafter",  type: "on_signal", signal_filter: ["revise_needed"] })  // veto → re-draft
graph_add_loop({ graph_id, id: "review-cycle", nodes: ["drafter", "reviewer"],
                 max_traversals: <a small task-appropriate bound> })
graph_run(graph_id)
// END YOUR TURN — await [GRAPH COMPLETE], then graph_status(include_output=true)
```

---

## 8. role.yaml Declarations

The runtime graph is imperative, but `role.yaml` still carries declarations the
engine and tooling read:

### 8.1 `graph.orchestration`

```yaml
graph:
  orchestration: graph_v2
```

Declares the role is a graph-orchestrated role. The declarative `collaboration:`
block mirrors the runtime wiring but is NOT the execution mechanism (see §1.1).

### 8.2 `collaboration.termination` (declarative mirror)

rolebox-tester 5.0.0 shows the declarative termination mirror — soft exit
conditions for the pipeline:

```yaml
collaboration:
  topology: pipeline
  agents: [processor, checker, validator]
  max_iterations: 2
  termination:
    any_of:
      - max_iterations: 2
      - result_matches:
          agent: validator
          contains: "VALIDATED"
```

The imperative equivalent at runtime is `graph_add_loop`'s `termination` param
(`any_of` / `all_of` over `max_iterations`, `timeout_ms`, `converged`,
`result_matches`, `stuck`, `budget_exhausted`, `signal`). `max_iterations` in the
declarative block is legacy schema compatibility — it is NOT a live bound on
imperative loops.

### 8.3 `memory`

The memory block controls session memory injection for the role's sessions:

```yaml
memory:
  inject: true      # inject relevant memories into the system prompt
  max_inject: 10    # max memories injected per session
  min_relevance: medium  # relevance floor for injection
  scope: both       # workspace | role | both
```

### 8.4 Signal-emitting subagents

A subagent whose only job is to emit a specific terminating/pausing signal (used
for testing and as leaf nodes). Declared like any subagent, with a prompt that
forces signal termination:

```yaml
subagents:
  - name: Signal Answer
    description: Signal-emitting graph agent that always terminates via signal(type="answer") with a fixed ANSWER_SIGNAL_OK marker payload
    prompt_file: subagents/signal-answer/prompt.md
```

The prompt contract for such a subagent: read the input, then terminate via the
`signal` tool with exactly one call of the assigned type and payload; no prose
outside the signal; no further delegation.

---

## 9. Legacy Vocabulary — must NOT appear as a live contract

The following vocabulary is **legacy** (v1). It MUST NOT appear in role assets as
a live contract — no invocation examples, no "how to call" instructions, no
permission grants. These tokens may appear ONLY in migration/avoidance notes like
this one. The engine rejects them.

| Legacy term | Status | Live replacement |
|-------------|--------|------------------|
| `dispatch` (v1 background tool family) | Removed — never invoke | `graph_create` + `graph_add_node` + `graph_run` |
| `dispatch_output` | Removed — never invoke | `graph_status(include_output=true)` — safe, non-blocking liveness probe |
| `dispatch_cancel` | Removed — never invoke | `graph_cancel(graph_id, node_id?)` |
| `dispatch_retry` | Removed — never invoke | `graph_run(graph_id, node_id, retry=true, modify_prompt=…)` — same-session node continuation |
| `dispatch_approve` / `dispatch_reject` | Removed — never invoke | `graph_approve(graph_id, node_id, action=…)` |
| `loop_*` tools | Deprecated, zero consumers | `graph_add_loop` bounded cycles |
| `function_state` | Removed — never invoke | Node state via `graph_status`; signal-driven state transitions |
| `collaboration.max_iterations` | Schema-compat only — NOT a live bound | `graph_add_loop` `max_traversals` (required, engine-enforced) |
| Legacy `dispatch:` block in role.yaml (`maxConcurrent`, `maxQueueDepth`, `maxActivePerParent`, `syncReservedSlots`, `syncPromptTimeoutMs`, `backgroundStaleTimeoutMs`) | Replaced | Per-node `timeout_ms` / `max_retries` on `graph_add_node`; concurrency is engine-managed |
| `dispatch_checkpoint` / `dispatch_progress` / `dispatch_stream` / `dispatch_status` / `dispatch_budget` (v1 task-visibility family) | Removed — never invoke | `graph_status(include_progress=true)` / `include_liveness=true` / `include_budget=true` / `stream` |

**Why this matters:** rolebox resolves assets by name; a role that re-introduces a
legacy token as a live instruction will be rejected at validation or fail at
runtime. When authoring, write the graph, not the v1 tool calls.

---

## 10. Author Checklist

Before shipping a graph-orchestrated role, confirm:

- [ ] `role.yaml` declares `graph.orchestration: graph_v2` when the role orchestrates subagents.
- [ ] Every workflow is authored as ONE graph: `graph_create` → `graph_add_node`
      per stage → `graph_add_edge` → `graph_add_loop` → `graph_run`.
- [ ] Every revise/review cycle is wrapped in `graph_add_loop` with a required,
      task-appropriate `max_traversals` — no unbounded cycles, no round-count prose.
- [ ] All cross-session input is embedded in node prompts; nothing relies on
      cross-session artifact reads.
- [ ] Results are collected ONCE via `graph_status(include_output=true)` after the
      `[GRAPH COMPLETE]` reminder; polling is fallback-only.
- [ ] Destructive / high-risk nodes are declared `needs_approval: true` and
      resolved via `graph_approve` — never re-run a fresh session to perform an
      unauthorized destructive operation.
- [ ] Stale or abandoned nodes are cancelled with `graph_cancel` — no orphaned
      nodes left running after the final result is emitted.
- [ ] No legacy vocabulary (`dispatch` family, `loop_*`, `function_state`,
      `collaboration.max_iterations` as a live bound) appears as a live contract.
