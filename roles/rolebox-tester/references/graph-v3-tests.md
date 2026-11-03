# Graph v3 outcome protocol — module body

This document owns the `graph-v3` test module of the rolebox-tester 7.0.0 suite: the
32 tests **18, 58, 120, 124, 125, 132, 136 and 200–224**. It is the body the catalog
maps to `references/graph-v3-tests.md`; the catalog's id list and this file's
`### Test <id>` headings must agree exactly.

The module exercises rolebox 2.2.0's declared-graph runtime: `graph_declare`,
`graph_submit_outcome`, `graph_control`, `graph_status` and `graph_audit`. The
declaration grammar, the compiled plan, the outcome acceptance, the trusted control
vocabulary, natural completion, host-derived completion, the durable store and the
run notifications are defined by rolebox's `docs/graph-outcome-protocol.md`,
`docs/graph-v3-operations.md`, `docs/worker-tools.md` and `docs/compatibility.md`, and
by the source under `src/graph/`. Read those when a live answer disagrees with a
body; the live answer is evidence, this document is the plan.

## Module gate

**Executor — the declaring primary.** Every body in this module is executed by the
`rolebox-tester` primary session that declared the graph. A dispatched worker's whole
granted graph face is `graph_submit_outcome` (plus its inherited native tools), so a
worker can never declare, control, read or audit a graph. Fixture children are the
graph **nodes**; they act, submit and report, and the primary observes via the tool
answers and the status read model.

**Host gate — the graph declarer face.** `graph_declare`, `graph_control`,
`graph_status` and `graph_audit` must be bound to the primary session, and
`graph_submit_outcome` must be withheld from it (the role manifest grants the four
declarer tools and disables the submission tool). Codex's MCP adapter has no graph
dispatch backend and no declarer face, so the module is SKIP there
(`capability_absent:graph_declarer`). Every graph cap of the dispatch adapter
(attempt credentials, execution observation, cancellation) must be present; a host
that reports `dispatch-unavailable` SKIPs the dispatch-dependent bodies with that
reason.

**Fixture agents.** Node `agent` values are the resolved subagent ids of the
`rolebox-tester` role tree:

| Fixture | Agent id | Role in this module |
|---|---|---|
| Echo | `rolebox-tester--echo` | fast marker node |
| Sleeper | `rolebox-tester--sleeper` | slow node for in-flight, stop and cancel tests |
| Processor | `rolebox-tester--processor` | pipeline stage 1 |
| Checker | `rolebox-tester--checker` | pipeline stage 2 |
| Validator | `rolebox-tester--validator` | pipeline stage 3 |
| Outcome worker | `rolebox-tester--outcome-worker` | the submission fixture: reads the attempt handoff, submits the outcome the node prompt names, reports every tool answer verbatim |

The four inline fixtures are declared on the primary's `role.yaml`; the directory
fixtures resolve from `subagents/`. A fixture id the role tree does not resolve is a
SKIP for that body (`fixture_agent_absent:<id>`), never a FAIL and never a rewrite of
the declaration into a different agent.

## How a body is executed

Every body uses the same contract:

1. **Probe first.** The module runs under the capability record from the mandatory
   capability probe in `references/host-capability-matrix.md`. Do not infer a
   capability from this document.
2. **Declare once.** Submit the body's declaration exactly as written through
   `graph_declare({ declaration: <block>, supported_validators?: [...] })`. Only a
   declaration inside a fenced json code block is an intended-success sketch: it must
   parse with the v3 front-end and compile to an **executable** plan when the installed
   validators include `schema@1` and `artifact-reference@1`. A fenced text block is
   deliberately refused, malformed or policy-gated; never paste one into a
   declaration and expect it to start a run.
3. **Dispatch is asynchronous.** `graph_declare` persists the plan and asks the host
   to start it. When the start arm reports `started` (or `resumed`), the dispatched
   attempts are in flight. Do not poll: end the turn, let the host deliver workers,
   and read `graph_status` once per completion notification. `saved` means the host
   performed no start step; the dispatch-dependent sub-checks then SKIP with
   `no_start_step_on_host` and persistence is still checked.
4. **Workers submit; the primary reads.** The primary must never claim an outcome.
   `graph_submit_outcome` calls in these bodies are made by the node workers through
   the attempt handoff they received. A body's expected `credential-missing`,
   `credential-unknown`, `credential-node-mismatch`, gate rejection, replay or
   `attempt-stopped` answer is therefore observed in the worker's tool answer, which
   the worker writes verbatim to the run evidence directory before ending its turn.
5. **Control commands are the primary's.** Only the declaring primary calls
   `graph_control`. `cancel` and `budget-stop` name no node; `failure`, `timeout`,
   `retry`, `approval-request`, `approve` and `reject` name a node. Every command
   carries a non-empty `reason`.
6. **Record the row.** Per-test status is exactly `PASS`, `FAIL` or `SKIP` per
   `references/host-capability-matrix.md`. A requested, named refusal is a PASS. A
   family that is absent or not exercisable is a SKIP with one machine-readable
   reason. A present family that contradicts the documented behavior is a FAIL with
   `error_detail`. A required test that was not run is unfinished work, not a SKIP.
7. **Clean up without deleting state.** Stop any run left in flight with
   `graph_control({ command: "budget-stop", reason: "graph-v3-<id>-cleanup" })`, remove
   the scratch evidence and export files this body wrote, and never delete, move or
   rewrite the graph store, its identity marker, accepted results or effect rows.
   Durable history is the record of what the run accepted.

**Evidence directory.** Each body writes scratch evidence under
`.rolebox/test-evidence/graph-v3/<test-id>/` in the workspace (relative to it); a
worker writes its tool answers and the input manifest it observed there, and the
primary reads them with the host's file tools. Accepted data, accepted artifact
revisions and status renders are the primary evidence; the files are the transport
for worker-side refusals. Delete the directory after the rows are recorded.

**Never print or persist an attempt credential.** The credential is a bearer value
bound to one attempt. A worker passes it only to `graph_submit_outcome`; nothing in
this module copies it into a prompt, a file, an evidence row or a report. A status
read, an audit report and a control answer must not render it — a credential that
appears there is a FAIL, not a PASS. The store keeps only a digest.

**Never fabricate operator authority.** These bodies never install a validator, a
completion-policy revision, an approval policy, a trusted command mapping, a
language server, a second role or a wake channel, and never set an environment
variable. A branch that needs an operator-installed capability SKIPs with
`operator_policy_absent` when the probe shows it absent.

**Bounded cost.** Every body finishes in a bounded number of worker turns. Bodies
that need sequencing use a release file: the worker polls
`.rolebox/test-evidence/graph-v3/<test-id>/release` for a bounded time, and the
primary writes it after issuing the control command. Never depend on wall-clock
guesses between independent actors.

## Scenario map

| Test | Scenario |
|---|---|
| 18 | declared 3-node pipeline across Processor, Checker and Validator |
| 58 | in-flight status read is safe and honest |
| 120 | `max_chars` / `tail` (absorbed by 213) |
| 124 | `export_path` (absorbed by 213) |
| 125 | summary render and node rows (absorbed by 213) |
| 132 | `include_artifacts` / `include_evidence` (absorbed by 213) |
| 136 | unresolvable agent is a named dispatch failure |
| 200 | minimal declaration accepted, persisted, `start.kind` |
| 201 | grammar and compile refusals; any/quorum joins accepted |
| 202 | re-declaration: identical preserved, changed refused |
| 203 | capability preflight refusals persist nothing |
| 204 | entry dispatch, accepted outcome, successor arming |
| 205 | `schema@1` data and `artifact-reference@1` evidence readback |
| 206 | gate rejection keeps the attempt open; corrected resubmission accepted |
| 207 | credential isolation |
| 208 | identical replay and a different settled submission |
| 209 | fan-out and join all with materialized inputs |
| 210 | bounded loop group: continuation, exit, loop-exhausted |
| 211 | `budget.max_executions` 0/1/absent and atomic rollback |
| 212 | node budgets: `timeout_ms` accepted, `max_retries`/unknown key refused |
| 213 | `graph_status` read model (absorbs 120/124/125/132) |
| 214 | `graph_audit` verdicts and read-only agreement with status |
| 215 | run-wide cancel, late submission, skipped target |
| 216 | attempt-scoped failure/timeout, node retry with reason, late submission |
| 217 | node retry on a stopped run refused; run-wide retry re-executes |
| 218 | approval preflight and gated installed-policy continuation |
| 219 | natural completion refused without policy; gated natural settle |
| 220 | worker tool face |
| 221 | `toolPresentation` native/discover/code |
| 222 | required and triggered accepted-result inputs on a repair round |
| 223 | DSH host-derived JSON fallback |
| 224 | durable run notification effect |

---

### Test 18: Declared 3-node pipeline (Processor, Checker, Validator)

**Executor:** `rolebox-tester` primary (declaring session), never a dispatched worker.

**Host gate:** graph declarer face — `graph_declare`, `graph_control`, `graph_status`
and `graph_audit` bound to this primary; `graph_submit_outcome` withheld from it;
Codex SKIPs (`capability_absent:graph_declarer`); the Processor, Checker and Validator
fixture ids resolve.

**Fixtures:** Processor (stage 1), Checker (stage 2), Validator (stage 3) as graph
nodes; no extra workers.

**Declaration (submit verbatim):**

```json
{
  "version": 3,
  "name": "graph-v3-pipeline-18",
  "budget": { "max_executions": 3 },
  "nodes": [
    {
      "id": "processor",
      "agent": "rolebox-tester--processor",
      "prompt": "Announce PROCESSOR_RECEIVED, append [PROCESSED] to the task payload, and submit the declared outcome ready with the processed text in data.text.",
      "completion": { "mode": "explicit" },
      "outcomes": [ { "id": "ready" } ]
    },
    {
      "id": "checker",
      "agent": "rolebox-tester--checker",
      "prompt": "Announce CHECKER_RECEIVED, verify that the materialized input contains [PROCESSED], and submit the declared outcome approved.",
      "outcomes": [ { "id": "approved" } ]
    },
    {
      "id": "validator",
      "agent": "rolebox-tester--validator",
      "prompt": "Announce VALIDATOR_RECEIVED, validate the approved input, and submit the declared outcome validated.",
      "outcomes": [ { "id": "validated" } ]
    }
  ],
  "edges": [
    { "from": "processor", "to": "checker", "outcome": "ready" },
    { "from": "checker", "to": "validator", "outcome": "approved" }
  ]
}
```

**Calls:**

```text
graph_declare({ "declaration": <the block above> })
```

Await the completion notification, then read once:

```text
graph_status({ "graph_id": "graph-v3-pipeline-18", "format": "json", "include_output": true })
```

**Expected:** the declaration result is `executability: "executable"`,
`persisted: true`, `declaration_version: 3`, `execution_protocol: 2`, `nodes: 3`,
`edges: 2`, `terminal_outcomes: 1` (only `validator.validated` has no outbound edge),
and `start.kind: "started"` with `dispatched: [{ "nodeId": "processor", ... }]` and
`phase: "executing"`. Each node's accepted event names its declared outcome
(`ready`, `approved`, `validated`). The Processor's accepted `data.text` carries
`PROCESSOR_RECEIVED` and `[PROCESSED]`; the Checker's answer reports
`CHECKER_RECEIVED` and a passing input; the Validator reports `VALIDATOR_RECEIVED`
and `VALIDATED`; every node settles and the final phase is `complete`. A node
settled out of order, a skipped stage or a fabricated completion is a FAIL.

**Evidence:** the declaration result fields; each accepted event
(`attempt_id`, `submission_id`, `outcome_id`); the three worker markers; the final
`phase` and node statuses.

**Cleanup:** the run completes on its own. If a node is still dispatched after the
bounded wait, `graph_control({ "graph_id": "graph-v3-pipeline-18", "command":
"budget-stop", "reason": "graph-v3-18-cleanup" })` and record the still-running
execution as unsettled. Never delete the store.

**SKIP:** `capability_absent:graph_declarer` when the declarer face is absent (Codex);
`fixture_agent_absent:<id>` when a pipeline fixture does not resolve;
`dispatch_unavailable` when the host cannot start a worker; `no_start_step_on_host`
for the dispatch half only when `start.kind` is `saved`.

---

### Test 58: In-flight status read is safe and honest

**Executor:** `rolebox-tester` primary (declaring session), never a dispatched worker.

**Host gate:** graph declarer face; the Sleeper fixture resolves; the host dispatch
adapter can start a worker; Codex SKIPs.

**Fixtures:** Sleeper as the single slow node.

**Declaration (submit verbatim):**

```json
{
  "version": 3,
  "name": "graph-v3-inflight-58",
  "nodes": [
    {
      "id": "slow",
      "agent": "rolebox-tester--sleeper",
      "prompt": "Count slowly to 20, one number per line, then submit the declared outcome done with SLOW_DONE_OK in data.",
      "outcomes": [ { "id": "done" } ]
    }
  ],
  "edges": []
}
```

**Calls:** declare, then immediately (before any completion notification) read twice:

```text
graph_status({ "graph_id": "graph-v3-inflight-58", "node_id": "slow", "format": "json" })
graph_status({ "graph_id": "graph-v3-inflight-58", "node_id": "slow", "format": "json" })
```

After the completion notification:

```text
graph_status({ "graph_id": "graph-v3-inflight-58", "format": "json", "include_output": true })
```

**Expected:** both in-flight reads succeed — no thrown error and no
`graph_status failed` — and report the node as `dispatched` with a non-empty
`attemptId`, no accepted event and no output. The two reads agree on the attempt id
(the read model does not fabricate or re-mint an attempt). After completion the node
is `settled` with accepted outcome `done`, `SLOW_DONE_OK` in the accepted data, and
phase `complete`. The in-flight read neither threw nor changed the lifecycle.

**Evidence:** both in-flight renders, the stable `attemptId`, the settled render with
the accepted result.

**Cleanup:** if the node is still dispatched after the bounded wait,
`budget-stop` with reason `graph-v3-58-cleanup`.

**SKIP:** `capability_absent:graph_declarer`; `fixture_agent_absent:rolebox-tester--sleeper`;
`no_start_step_on_host` for the in-flight half; `dispatch_unavailable`.

---

### Test 120: `max_chars` and `tail` on an accepted result (absorbed by Test 213)

**Executor:** `rolebox-tester` primary (declaring session), never a dispatched worker.

**Host gate:** graph declarer face; an accepted result exists from Test 205 or Test
213; Codex SKIPs.

**Fixtures:** none of its own — it re-reads the graph completed by Test 205 (or Test
204 when 205 skipped) and declares nothing.

**Declaration:** none. The scenario is absorbed by **Test 213**; this body records the
`max_chars`/`tail` sub-check as its own row so the retained id keeps its coverage.

**Calls:** read the untruncated node result, then the tail window:

```text
graph_status({ "graph_id": "graph-v3-evidence-205", "node_id": "report", "format": "json", "include_output": true })
graph_status({ "graph_id": "graph-v3-evidence-205", "node_id": "report", "format": "json", "include_output": true, "max_chars": 40, "tail": true })
```

**Expected:** both calls return without error. The truncated rendering is at most
`max_chars` characters long and ends with the same final characters as the
untruncated rendering (a suffix, not a prefix): `tail: true` reads the end of the
selected output. A prefix, an over-limit length or a thrown error is a FAIL.

**Evidence:** the two renders, their lengths, and the suffix comparison.

**Cleanup:** none — the calls are read-only.

**SKIP:** `capability_absent:graph_declarer`; `accepted_result_absent` when Test 205
and Test 204 both produced no accepted result.

---

### Test 124: `export_path` writes the selected rendering (absorbed by Test 213)

**Executor:** `rolebox-tester` primary (declaring session), never a dispatched worker.

**Host gate:** graph declarer face and a writable workspace; an accepted result
exists; Codex SKIPs.

**Fixtures:** none of its own — it re-reads the Test 205 graph.

**Declaration:** none. The scenario is absorbed by **Test 213**; this body records the
`export_path` sub-check.

**Calls:**

```text
graph_status({ "graph_id": "graph-v3-evidence-205", "format": "json", "include_output": true, "export_path": ".rolebox/test-evidence/graph-v3/124/status.json" })
```

Then read and parse the exported file with the host's file tools, and compare it with
the same query rendered without `export_path`.

**Expected:** the answer confirms the export (the exported rendering, or an
export confirmation naming the path) rather than silently dropping the argument. The
file exists, is non-empty, parses as JSON, and describes the same graph, plan revision
and selected nodes as the unexported rendering of the same query — the exported
content follows `format` and the filters. A partial, empty or differently filtered
file is a FAIL.

**Evidence:** the export answer, the file path, the parsed top-level keys
(`graphId`, `planRevision`, node list), and the equality check against the live render.

**Cleanup:** remove `.rolebox/test-evidence/graph-v3/124/` after recording.

**SKIP:** `capability_absent:graph_declarer`; `accepted_result_absent` when no accepted
result exists.

---

### Test 125: Summary render lists node rows (absorbed by Test 213)

**Executor:** `rolebox-tester` primary (declaring session), never a dispatched worker.

**Host gate:** graph declarer face; a graph exists from an earlier body; Codex SKIPs.

**Fixtures:** none of its own.

**Declaration:** none. The scenario is absorbed by **Test 213**; this body records the
summary-render and filter sub-check.

**Calls:**

```text
graph_status({ "graph_id": "graph-v3-pipeline-18", "format": "summary" })
graph_status({ "graph_id": "graph-v3-pipeline-18", "format": "summary", "status": "settled" })
graph_status({ "graph_id": "graph-v3-pipeline-18", "format": "summary", "status": "pending" })
```

**Expected:** all calls return without error. The summary carries the graph and run
identity plus one row per selected node with its id, agent and native attempt status,
and a graph-level phase. The `status: "settled"` filter selects only settled rows;
`status: "pending"` selects only pending rows (an empty result is an honest empty,
never a fabricated row or an error). A summary that omits node rows, throws while work
is in flight, or ignores the filter is a FAIL.

**Evidence:** the summary text, the row count, and the filtered subsets.

**Cleanup:** none — read-only.

**SKIP:** `capability_absent:graph_declarer`; no graph from an earlier body
(`graph_absent`).

---

### Test 132: `include_artifacts` and `include_evidence` (absorbed by Test 213)

**Executor:** `rolebox-tester` primary (declaring session), never a dispatched worker.

**Host gate:** graph declarer face; an accepted result with evidence exists (Test 205);
Codex SKIPs.

**Fixtures:** none of its own.

**Declaration:** none. The scenario is absorbed by **Test 213**; this body records the
artifact/evidence verbosity sub-check.

**Calls:**

```text
graph_status({ "graph_id": "graph-v3-evidence-205", "format": "json", "include_output": true, "include_artifacts": true, "include_evidence": true })
graph_status({ "graph_id": "graph-v3-evidence-205", "format": "json", "include_output": true })
```

**Expected:** both calls return without error — PASS when the flagged render carries
the immutable artifact revisions and the validation evidence (the validator identity
each gate ran under and the reference it read) and the lean render omits those blocks
for the same result; FAIL when a flag is ignored, a block is fabricated, or the lean
render invents data. When a graph genuinely recorded no artifacts or evidence, the
flagged rendering says so explicitly — it never fabricates rows. A later change to the
producer's original file must not change the recorded artifact revision (content
identity, not a path).

**Evidence:** the flagged and lean renders, the artifact revision, the evidence
entries, and the unchanged revision after touching the original file.

**Cleanup:** restore or remove the scratch file under
`.rolebox/test-evidence/graph-v3/205/` after recording; the accepted revision stays.

**SKIP:** `capability_absent:graph_declarer`; `accepted_result_absent`.

---

### Test 136: An unresolvable agent is a named dispatch failure

**Executor:** `rolebox-tester` primary (declaring session), never a dispatched worker.

**Host gate:** graph declarer face; the compiler does **not** validate agent names, so
this declaration compiles and the host's dispatch seam decides the refusal; Codex
SKIPs (no dispatch backend).

**Fixtures:** a deliberately invalid agent id on the single node — no fixture runs.

**Declaration (intentionally dispatch-refused; keep as text):**

```text
{
  "version": 3,
  "name": "graph-v3-invalid-agent-136",
  "nodes": [
    {
      "id": "bad",
      "agent": "rolebox-tester--definitely-nonexistent-subagent-xyz",
      "prompt": "This node must never run.",
      "outcomes": [ { "id": "done" } ]
    }
  ],
  "edges": []
}
```

**Calls:** declare the block, then read the graph:

```text
graph_declare({ "declaration": <the block above> })
graph_status({ "graph_id": "graph-v3-invalid-agent-136", "format": "json", "include_output": true })
```

**Expected:** `graph_declare` accepts and persists the plan (the compiler carries the
agent name and validates no role catalog), so `executability: "executable"` and
`persisted: true`. The start step then refuses or blocks the dispatch: the answer
carries a named dispatch failure — `start.kind: "refused"` with a `dispatch-failed`
refusal, or `start.kind: "blocked"` with the failure reason — and the text names
`rolebox-tester--definitely-nonexistent-subagent-xyz`. The node is never reported
`settled` and no accepted event is fabricated; the run does not claim `complete`.
A silent hang, a fabricated completion or an unattributed error is a FAIL.

**Evidence:** the declaration result, the start arm and its refusal code/text, the
node status with no accepted event, the run phase.

**Cleanup:** `budget-stop` the run with reason `graph-v3-136-cleanup` if it is not
already terminal; the failed attempt stays visible as an unsettled effect.

**SKIP:** `capability_absent:graph_declarer`; `no_start_step_on_host` when the host
performs no start step (the refusal cannot be observed).

---

### Test 200: Minimal declaration accepted, persisted, `start.kind`

**Executor:** `rolebox-tester` primary (declaring session), never a dispatched worker.

**Host gate:** graph declarer face; the Echo fixture resolves; the dispatch adapter can
start one worker; Codex SKIPs.

**Fixtures:** Echo as the only node.

**Declaration (submit verbatim):**

```json
{
  "version": 3,
  "name": "graph-v3-minimal-200",
  "nodes": [
    {
      "id": "echo",
      "agent": "rolebox-tester--echo",
      "prompt": "Reply with the exact phrase ECHO_V3_OK and submit the declared outcome done.",
      "completion": { "mode": "explicit" },
      "outcomes": [ { "id": "done" } ]
    }
  ],
  "edges": []
}
```

**Calls:**

```text
graph_declare({ "declaration": <the block above> })
graph_status({ "graph_id": "graph-v3-minimal-200", "format": "json", "include_output": true })
```

**Expected:** the declaration result reports `graph_id: "graph-v3-minimal-200"`, a
non-empty content-addressed `plan_revision`, `executability: "executable"`,
`declaration_version: 3`, `execution_protocol: 2`, `nodes: 1`, `edges: 0`,
`loop_groups: 0`, `terminal_outcomes: 1`, `persisted: true`, `runnable: true`, and a
`run_path` naming the graph-scoped outcome submission as the completion source. On a
fresh declaration `preserved` is `false`; an identical re-declaration reports
`preserved: true` with the same revision (Test 202 covers that comparison). The start
arm is one of the documented shapes: `started` with
`dispatched: [{ "nodeId": "echo", "attemptId": ... }]` and `phase: "executing"` on a
host with a dispatch adapter, `saved` when the host performs no start step, or
`blocked`/`refused` with a named reason. A persisted declaration is never evidence
that a worker started; the two fields are recorded separately.

**Evidence:** the full declaration result (never a credential); the start arm and its
dispatched attempts; the settled node with its accepted outcome and final phase.

**Cleanup:** the run completes. If it is left in flight, `budget-stop` with reason
`graph-v3-200-cleanup`.

**SKIP:** `capability_absent:graph_declarer`; `fixture_agent_absent:rolebox-tester--echo`;
`dispatch_unavailable`.

---

### Test 201: Grammar and compile refusals; any/quorum joins accepted

**Executor:** `rolebox-tester` primary (declaring session), never a dispatched worker.

**Host gate:** graph declarer face; refusal paths need no dispatch; Codex SKIPs.

**Fixtures:** Echo for the accepted join graph; no worker runs for the refused
declarations.

**Declaration (submit verbatim) — the accepted `any` and `quorum` joins:**

```json
{
  "version": 3,
  "name": "graph-v3-joins-201",
  "nodes": [
    {
      "id": "alpha",
      "agent": "rolebox-tester--echo",
      "prompt": "Submit the declared outcome done with marker ALPHA in data.",
      "outcomes": [ { "id": "done" } ]
    },
    {
      "id": "beta",
      "agent": "rolebox-tester--echo",
      "prompt": "Submit the declared outcome done with marker BETA in data.",
      "outcomes": [ { "id": "done" } ]
    },
    {
      "id": "merge",
      "agent": "rolebox-tester--processor",
      "prompt": "Report the materialized inputs, then submit the declared outcome done.",
      "join": { "strategy": "quorum", "quorum": 1 },
      "inputs": [
        { "from": "alpha", "outcome": "done" },
        { "from": "beta", "outcome": "done" }
      ],
      "outcomes": [ { "id": "done" } ]
    },
    {
      "id": "anyone",
      "agent": "rolebox-tester--checker",
      "prompt": "Report the materialized input, then submit the declared outcome done.",
      "join": { "strategy": "any" },
      "inputs": [
        { "from": "alpha", "outcome": "done" },
        { "from": "beta", "outcome": "done" }
      ],
      "outcomes": [ { "id": "done" } ]
    }
  ],
  "edges": [
    { "from": "alpha", "to": "merge", "outcome": "done" },
    { "from": "beta", "to": "merge", "outcome": "done" },
    { "from": "alpha", "to": "anyone", "outcome": "done" },
    { "from": "beta", "to": "anyone", "outcome": "done" }
  ]
}
```

**Calls:** declare the accepted block once, then exercise each refusal with a
one-field mutation of that declaration. The composed refusals below are kept as text
because they are intentionally refused.

```text
graph_declare({ "declaration": <the accepted block above>, "graph_id": "graph-v3-mismatch-201" })
```

```text
{
  "version": 3,
  "name": "graph-v3-duplicate-201",
  "nodes": [
    { "id": "a", "agent": "rolebox-tester--echo", "prompt": "Submit done.", "outcomes": [ { "id": "done" } ] },
    { "id": "a", "agent": "rolebox-tester--echo", "prompt": "Submit done.", "outcomes": [ { "id": "done" } ] }
  ],
  "edges": []
}
```

```text
{
  "version": 3,
  "name": "graph-v3-deadlock-201",
  "nodes": [
    { "id": "p", "agent": "rolebox-tester--echo", "prompt": "Produce.", "outcomes": [ { "id": "go" } ], "completion": { "mode": "explicit" } },
    { "id": "x", "agent": "rolebox-tester--echo", "prompt": "Converge.", "outcomes": [ { "id": "next" }, { "id": "again" } ], "completion": { "mode": "explicit" }, "join": { "strategy": "all" }, "inputs": [ { "from": "p", "outcome": "go" }, { "from": "y", "outcome": "done" } ] },
    { "id": "y", "agent": "rolebox-tester--echo", "prompt": "Relay.", "outcomes": [ { "id": "done" }, { "id": "stop" } ], "completion": { "mode": "explicit" }, "inputs": [ { "from": "x", "outcome": "next" } ] }
  ],
  "edges": [
    { "from": "p", "to": "x", "outcome": "go" },
    { "from": "x", "to": "y", "outcome": "next" },
    { "from": "x", "to": "y", "outcome": "again" },
    { "from": "y", "to": "x", "outcome": "done" }
  ],
  "loop_groups": [ { "id": "rounds", "nodes": ["x", "y"], "max_traversals": 3, "continuation_outcome": "again", "exit_outcome": "stop" } ]
}
```

```text
{
  "version": 3,
  "name": "graph-v3-no-exit-201",
  "nodes": [
    { "id": "a", "agent": "rolebox-tester--echo", "prompt": "Submit x.", "outcomes": [ { "id": "x" } ] },
    { "id": "b", "agent": "rolebox-tester--echo", "prompt": "Submit y.", "outcomes": [ { "id": "y" } ] }
  ],
  "edges": [
    { "from": "a", "to": "b", "outcome": "x" },
    { "from": "b", "to": "a", "outcome": "y" }
  ],
  "loop_groups": [ { "id": "g", "nodes": ["a", "b"], "max_traversals": 2, "continuation_outcome": "x", "exit_outcome": "y" } ]
}
```

**Expected refusals** (the call fails with `graph_declare failed: graph_declare
refused: ...`; the stable code and path are recorded, and nothing is persisted):

| Mutation of the accepted declaration | Refusal code and path |
|---|---|
| `version: 2` | `invalid-declaration` / front-end `unsupported-version` at `$.version` |
| unknown root key, e.g. `graphs` | `invalid-declaration` / `unknown-key` at `$.graphs` |
| unknown node key, e.g. `retry` | `invalid-declaration` / `unknown-key` at `$.nodes[0].retry` |
| unknown outcome key, e.g. `when` | `invalid-declaration` / `unknown-key` at `$.nodes[0].outcomes[0].when` |
| an edge with no `outcome` | `invalid-declaration` / `missing-field` at `$.edges[0].outcome` |
| duplicate node id (block above) | `invalid-declaration` / compile `duplicate-node-id` at `nodes.a` |
| duplicate outcome id on one node | `duplicate-outcome-id` at `nodes.<id>.outcomes[1]` |
| duplicate loop-group id | `duplicate-loop-group-id` at `loop_groups.<id>` |
| `graph_id` arg differs from `name` | declaration reason `graph-id-mismatch` |
| every outcome bound, no exit (block above) | compile `missing-terminal-outcome` at `$plan` |
| a cycle no loop group covers | compile `cycle-not-in-loop-group` at `$plan` |
| the deadlocking join (block above) | compile `unsatisfiable-join` at `nodes.x.inputs` and `nodes.y.inputs` |
| node budget `max_retries` (even `0`) | `invalid-value` at `$.nodes[0].budget.max_retries` |
| unknown node budget key | `unknown-key` at `$.nodes[0].budget.<key>` |
| loop group missing `max_traversals` | `missing-field` at `$.loop_groups[0].max_traversals` |
| loop group missing `continuation_outcome` | `missing-field` at `$.loop_groups[0].continuation_outcome` |
| loop group missing `exit_outcome` | `missing-field` at `$.loop_groups[0].exit_outcome` |
| continuation edge leaving its group | compile `loop-continuation-outside-group` at `edges[<index>]` |

Every refusal writes nothing: after the batch, `graph_status({ "format": "json" })`
and `graph_audit` list none of the refused graph names. The accepted join block
compiles and starts: `executability: "executable"`, `nodes: 4`, and both join nodes
are armed only from their declared feeders. The `quorum: 1` node is dispatched once
one feeder settles; the `any` node once either feeder settles. `quorum` on a
non-quorum strategy, `quorum: 0` and a non-integer quorum are `invalid-value`
refusals at the `join.quorum` path.

**Evidence:** the accepted declaration result; one row per mutation with the observed
code, path and refusal text; the empty status/audit listings afterwards.

**Cleanup:** `budget-stop` the accepted join run with reason `graph-v3-201-cleanup`
once the join arming is observed; refused declarations leave nothing to clean.

**SKIP:** `capability_absent:graph_declarer`; `fixture_agent_absent` for the accepted
join fixtures.

---

### Test 202: Re-declaration — identical preserved, changed refused

**Executor:** `rolebox-tester` primary (declaring session), never a dispatched worker.

**Host gate:** graph declarer face and a persisted graph store; Codex SKIPs.

**Fixtures:** Echo as the single node.

**Declaration (submit verbatim, twice):**

```json
{
  "version": 3,
  "name": "graph-v3-redeclare-202",
  "nodes": [
    {
      "id": "echo",
      "agent": "rolebox-tester--echo",
      "prompt": "Reply ECHO_REDECLARE_OK and submit the declared outcome done.",
      "outcomes": [ { "id": "done" } ]
    }
  ],
  "edges": []
}
```

**Calls:** declare the block, record the plan revision and run id, declare the same
block again, then submit the changed block below.

```text
graph_declare({ "declaration": <the block above> })
graph_status({ "graph_id": "graph-v3-redeclare-202", "format": "json" })
graph_declare({ "declaration": <the same block again> })
```

```text
{
  "version": 3,
  "name": "graph-v3-redeclare-202",
  "nodes": [
    {
      "id": "echo",
      "agent": "rolebox-tester--echo",
      "prompt": "Reply ECHO_REDECLARE_CHANGED_202 and submit the declared outcome done.",
      "outcomes": [ { "id": "done" } ]
    }
  ],
  "edges": []
}
```

**Expected:** the first declaration persists a plan revision `R1` (`persisted: true`,
`preserved: false`). The identical re-declaration returns the same `R1` with
`preserved: true` and rebuilds nothing; the durable history is not reset — the status
still reports the same run identity and its accepted results, and the start arm may
report `resumed` with no newly dispatched attempt. The changed declaration
is refused with reason `declaration-changed`: the message names the persisted revision
`R1` and the incoming revision `R2`, states that the persisted plan is authoritative
and never overwritten, and nothing is written. A later `graph_status` still reports
`R1`. An identical re-declaration that mints a new revision, or a changed declaration
that is silently accepted, is a FAIL.

**Evidence:** both `plan_revision` values, the `preserved` flags, the run id before and
after, the `declaration-changed` refusal text with both revisions, and the final status
revision.

**Cleanup:** record and stop the run if it is in flight (`budget-stop`, reason
`graph-v3-202-cleanup`); the persisted definition stays.

**SKIP:** `capability_absent:graph_declarer`; `persisted_store_unavailable` when the
host cannot persist a definition.

---

### Test 203: Capability preflight refusals persist nothing

**Executor:** `rolebox-tester` primary (declaring session), never a dispatched worker.

**Host gate:** graph declarer face and the shipped acceptance capability set (the four
validators are installed as identities; concrete schemas, command mappings and
approval rules are operator grants); Codex SKIPs.

**Fixtures:** none run — every declaration in this body is refused before dispatch.

**Declarations (intentionally refused; keep as text):**

```text
{
  "version": 3,
  "name": "graph-v3-command-check-203",
  "nodes": [
    {
      "id": "check",
      "agent": "rolebox-tester--outcome-worker",
      "prompt": "Submit the declared outcome done.",
      "outcomes": [ { "id": "done", "acceptance": [ { "validator": "command-exit", "version": 1 } ] } ]
    }
  ],
  "edges": []
}
```

```text
{
  "version": 3,
  "name": "graph-v3-approval-gate-203",
  "nodes": [
    {
      "id": "review",
      "agent": "rolebox-tester--outcome-worker",
      "prompt": "Submit the declared outcome approved.",
      "outcomes": [ { "id": "approved", "acceptance": [ { "validator": "principal-approval", "version": 1 } ] } ]
    }
  ],
  "edges": []
}
```

```text
{
  "version": 3,
  "name": "graph-v3-natural-203",
  "completion_policy": { "id": "rolebox.graph.completion", "revision": "2" },
  "nodes": [
    {
      "id": "work",
      "agent": "rolebox-tester--outcome-worker",
      "prompt": "Do not submit; end your final turn normally.",
      "completion": { "mode": "natural", "outcome": "done" },
      "outcomes": [ { "id": "done" } ]
    }
  ],
  "edges": []
}
```

**Calls:** four refusals, each naming its reason, then the persistence check.

```text
graph_declare({ "declaration": <Test 200 block>, "supported_validators": [ { "validator": "schema", "version": 999 } ] })
graph_declare({ "declaration": <Test 200 block>, "supported_validators": [ { "validator": "no-such-validator", "version": 1 } ] })
graph_declare({ "declaration": <the command-check block above> })
graph_declare({ "declaration": <the approval-gate block above> })
graph_declare({ "declaration": <the natural block above> })
graph_status({ "format": "json" })
graph_audit({})
```

**Expected:**

- **Uninstalled validator narrowing.** The call fails with
  `validator-capability-not-installed`, naming `schema@999` (or the unknown id) and
  the installed version(s) of that id. The argument narrows the installed set and
  never installs anything.
- **`command-exit` without an operator command mapping.** The call fails with reason
  `draft-plan`; `unresolved` names the node, outcome and `command-exit@1` with the
  reason that no trusted command policy authorizes a check for the exact
  `(graph, node, outcome)` mapping. The declaration may request a capability; it never
  installs or authorizes one.
- **`principal-approval` without an installed approval policy.** The call fails with
  reason `draft-plan`; `unresolved` names `principal-approval@1` and the reason that no
  installed approval policy authorizes approvers for this graph and node.
- **A `completion_policy` revision that is not installed.** The call fails with reason
  `draft-plan`; `unauthorizedCompletions` names the node, outcome and mapping code
  `completion-policy-unavailable` (no policy capability installed) or
  `completion-policy-unknown` / `completion-policy-unknown-revision` (the id or the
  exact revision is not installed). A catalog entry in the repository is not an
  authorization.
- **Nothing persisted.** None of the refused graph ids appears in the session or
  persisted `graph_status` listing or in `graph_audit`'s entries.

Never set `ROLEBOX_GRAPH_COMMAND_CHECKS`, `ROLEBOX_GRAPH_APPROVAL_POLICY` or
`ROLEBOX_GRAPH_COMPLETION_POLICIES` to turn these refusals into installs. A refusal that
persists a definition, or a "successful" declaration that later fails every gate, is a
FAIL.

**Evidence:** each refusal text with its reason and the unresolved/unauthorized entries;
the status and audit listings proving absence.

**Cleanup:** none — nothing was persisted; no run exists.

**SKIP:** `capability_absent:graph_declarer`; `capability_absent:graph_acceptance`
when no acceptance capability assembly is installed (then the preflight cannot run).

---

### Test 204: Entry dispatch, accepted outcome, successor arming

**Executor:** `rolebox-tester` primary (declaring session), never a dispatched worker.

**Host gate:** graph declarer face; the outcome-worker and Echo fixtures resolve; the
dispatch adapter can mint attempt credentials; Codex SKIPs.

**Fixtures:** Outcome worker as the entry node; Echo as the successor.

**Declaration (submit verbatim):**

```json
{
  "version": 3,
  "name": "graph-v3-outcome-204",
  "nodes": [
    {
      "id": "work",
      "agent": "rolebox-tester--outcome-worker",
      "prompt": "Submit the declared outcome done with data marker WORK_ACCEPTED_204 using the attempt credential in your dispatch request, and write the tool answer verbatim to .rolebox/test-evidence/graph-v3/204/work.json.",
      "outcomes": [ { "id": "done" } ]
    },
    {
      "id": "followup",
      "agent": "rolebox-tester--echo",
      "prompt": "Reply FOLLOWUP_ARMED_204 and submit the declared outcome done.",
      "outcomes": [ { "id": "done" } ]
    }
  ],
  "edges": [ { "from": "work", "to": "followup", "outcome": "done" } ]
}
```

**Calls:** declare, observe the start arm, then read once after the completion
notification and once more after the successor settles.

```text
graph_declare({ "declaration": <the block above> })
graph_status({ "graph_id": "graph-v3-outcome-204", "format": "json", "include_output": true, "include_history": true })
```

**Expected:** the start arm dispatches only `work`; `followup` is not dispatched
before `work` settles. `work`'s submission is accepted: `decision: "accepted"`,
`verdict: "committed"`, `attempt_id` equal to the dispatched attempt, and its accepted
data carries `WORK_ACCEPTED_204`. The acceptance then arms `followup` as a distinct
attempt: its `dispatchedAt` is later than `work`'s `settledAt`, its attempt id differs,
and it consumes one execution. `followup` settles `done` and the run reaches
`complete`. The primary never submits an outcome; a successor armed before the
acceptance, or an acceptance that routes nothing, is a FAIL.

**Evidence:** the start arm; `work`'s accepted event and data; the two attempt ids and
their order; `followup`'s accepted event; final phase `complete`.

**Cleanup:** the run completes; if a node is still in flight, `budget-stop` with reason
`graph-v3-204-cleanup`.

**SKIP:** `capability_absent:graph_declarer`; `capability_absent:graph_worker` when no
attempt credential is delivered; `fixture_agent_absent`; `no_start_step_on_host`.

---

### Test 205: `schema@1` data and `artifact-reference@1` evidence readback

**Executor:** `rolebox-tester` primary (declaring session), never a dispatched worker.

**Host gate:** graph declarer face; the outcome-worker fixture resolves and can write
in the workspace; the shipped `schema` and `artifact-reference` validators are
installed with the `json-object` schema; Codex SKIPs.

**Fixtures:** Outcome worker as the single node.

**Declaration (submit verbatim):**

```json
{
  "version": 3,
  "name": "graph-v3-evidence-205",
  "nodes": [
    {
      "id": "report",
      "agent": "rolebox-tester--outcome-worker",
      "prompt": "Write .rolebox/test-evidence/graph-v3/205/report.txt containing EVIDENCE_205_OK, then submit the declared outcome done with data marker SCHEMA_205_OK and evidence_refs [\".rolebox/test-evidence/graph-v3/205/report.txt\"], and write every tool answer verbatim to .rolebox/test-evidence/graph-v3/205/answers.json.",
      "outcomes": [
        {
          "id": "done",
          "data": { "schema": "json-object", "version": 1 },
          "acceptance": [
            { "validator": "schema", "version": 1 },
            { "validator": "artifact-reference", "version": 1 }
          ]
        }
      ]
    }
  ],
  "edges": []
}
```

**Calls:**

```text
graph_declare({ "declaration": <the block above> })
graph_status({ "graph_id": "graph-v3-evidence-205", "format": "json", "include_output": true })
graph_status({ "graph_id": "graph-v3-evidence-205", "format": "json", "include_output": true, "include_artifacts": true, "include_evidence": true })
```

**Expected:** the submission is accepted (`decision: "accepted"`,
`verdict: "committed"`) and both requirements pass in the declared order: `schema@1`
validated the object payload against the plan's `json-object@1` contract, and
`artifact-reference@1` read the reference inside the artifact root and digested the
bytes. The accepted result keeps the data as submitted (an object, never a stringified
copy) and records the artifact revision the gate actually read; the evidence names the
reference and the validator identity/version. `include_output` alone attaches the data;
`include_artifacts` adds the immutable artifact revision; `include_evidence` adds the
validation evidence; without the flags an attempt carries only its result identity and
timestamp. A submission whose data is not an object is rejected by `schema@1`; a
submission with no evidence reference is rejected by `artifact-reference@1` (absence
of evidence is not evidence) — record that behavior only if the worker's prompt
produces it, never by editing the declaration.

**Evidence:** the accepted result across the three renders; the two requirement
outcomes with their pinned identities; the recorded artifact revision and the
reference path; the file's own digest recorded beside it.

**Cleanup:** the run completes; remove `.rolebox/test-evidence/graph-v3/205/` after
recording. The accepted revision and its bytes stay in the store.

**SKIP:** `capability_absent:graph_declarer`; `capability_absent:graph_acceptance`
when `schema@1` or `artifact-reference@1` is not installed (a declaration that needs
them would be a draft); `fixture_agent_absent`.

---

### Test 206: Gate rejection keeps the attempt open; corrected resubmission accepted

**Executor:** `rolebox-tester` primary (declaring session), never a dispatched worker.

**Host gate:** graph declarer face; the outcome-worker fixture resolves; `schema@1` is
installed with `json-object@1`; Codex SKIPs.

**Fixtures:** Outcome worker as the single node.

**Declaration (submit verbatim):**

```json
{
  "version": 3,
  "name": "graph-v3-gate-206",
  "nodes": [
    {
      "id": "work",
      "agent": "rolebox-tester--outcome-worker",
      "prompt": "First submit the declared outcome done with data \"NOT_AN_OBJECT\" and record the answer. Then submit the declared outcome done with data marker CORRECTED_206 and record the answer, in .rolebox/test-evidence/graph-v3/206/answers.json.",
      "outcomes": [
        {
          "id": "done",
          "data": { "schema": "json-object", "version": 1 },
          "acceptance": [ { "validator": "schema", "version": 1 } ]
        }
      ]
    }
  ],
  "edges": []
}
```

**Calls:** declare, then read the graph between the two submissions and after the run.

```text
graph_declare({ "declaration": <the block above> })
graph_status({ "graph_id": "graph-v3-gate-206", "format": "json", "include_output": true })
```

**Expected:** the first submission is a **committed rejection**: `decision:
"rejected"`, the `schema@1` requirement fails with the reason that the payload is not
a JSON record, no accepted result and no accepted event exist, and the attempt stays
open (same attempt id, still dispatched) so the worker can repair its input. The second
submission on the same attempt is accepted (`decision: "accepted"`, `verdict:
"committed"`) with the object payload; the accepted data carries `CORRECTED_206` and
the run reaches `complete`. A rejection that settles the attempt, a rejection that
writes an accepted result, or a correction that requires a new attempt is a FAIL.

**Evidence:** both answers (decision, requirement outcome, reason), the attempt id
equality, the absence of an accepted event after the rejection, the accepted event
after the correction.

**Cleanup:** the run completes; remove `.rolebox/test-evidence/graph-v3/206/` after
recording.

**SKIP:** `capability_absent:graph_declarer`; `capability_absent:graph_acceptance`
(no `schema@1`); `fixture_agent_absent`.

---

### Test 207: Credential isolation

**Executor:** `rolebox-tester` primary (declaring session), never a dispatched worker.

**Host gate:** graph declarer face; two outcome-worker fixtures resolve; the dispatch
adapter delivers attempt credentials; Codex SKIPs.

**Fixtures:** Outcome worker for `alpha`, Outcome worker for `beta`.

**Declaration (submit verbatim):**

```json
{
  "version": 3,
  "name": "graph-v3-credential-207",
  "nodes": [
    {
      "id": "alpha",
      "agent": "rolebox-tester--outcome-worker",
      "prompt": "Submit the declared outcome done three times and record every answer verbatim in .rolebox/test-evidence/graph-v3/207/alpha.json: first with no credential, second with the literal credential WRONG-CREDENTIAL-207, third with node_id beta while passing your own attempt credential. Do not submit a valid outcome.",
      "outcomes": [ { "id": "done" } ]
    },
    {
      "id": "beta",
      "agent": "rolebox-tester--outcome-worker",
      "prompt": "Make no graph_submit_outcome call. Record in .rolebox/test-evidence/graph-v3/207/beta.json that you made no submission, then end your turn.",
      "outcomes": [ { "id": "done" } ]
    }
  ],
  "edges": []
}
```

**Calls:** declare; let both workers run; read the evidence files; read the status;
then stop the run.

```text
graph_declare({ "declaration": <the block above> })
graph_status({ "graph_id": "graph-v3-credential-207", "format": "json", "include_history": true })
graph_control({ "graph_id": "graph-v3-credential-207", "command": "cancel", "reason": "graph-v3-207-cleanup" })
```

**Expected:** the three refusals are named and write nothing:
`credential-missing` (no credential), `credential-unknown` (a value no attempt's
digest records), and `credential-node-mismatch` (alpha's own credential addressing
node `beta`; a credential is bound to one node and never re-aimed). The refusal
messages name the presented node and attempt, never the bearer value. After them,
`alpha` and `beta` still show no accepted events and no accepted results, and no
receipt, accepted event or state advance was written for the refused submissions.
`graph_status` and `graph_audit` render no credential value or credential digest; a
credential string appearing in either is a FAIL. The store keeps only a digest, and
the primary's report never contains the value.

**Evidence:** the three verbatim refusal answers with their codes and paths; the
unchanged attempt state; the status and audit renders checked for the bearer value;
the beta worker's no-submission record.

**Cleanup:** the `cancel` stops both in-flight attempts; their executions stay visible
as unsettled effects and are never deleted. Remove the evidence directory after
recording.

**SKIP:** `capability_absent:graph_declarer`; `capability_absent:graph_worker` when no
attempt credential is delivered (`worker_self_report_absent` when the worker cannot
report its answers).

---

### Test 208: Identical replay and a different settled submission

**Executor:** `rolebox-tester` primary (declaring session), never a dispatched worker.

**Host gate:** graph declarer face; the outcome-worker fixture resolves; Codex SKIPs.

**Fixtures:** Outcome worker as the single node.

**Declaration (submit verbatim):**

```json
{
  "version": 3,
  "name": "graph-v3-replay-208",
  "nodes": [
    {
      "id": "work",
      "agent": "rolebox-tester--outcome-worker",
      "prompt": "Submit the declared outcome done with data marker REPLAY_208 and n 1. Then submit the identical payload again. Then submit the declared outcome done with data marker REPLAY_208 and n 2. Record all three answers verbatim in .rolebox/test-evidence/graph-v3/208/answers.json.",
      "outcomes": [ { "id": "done" } ]
    }
  ],
  "edges": []
}
```

**Calls:** declare, then read the status and accepted event identity.

```text
graph_declare({ "declaration": <the block above> })
graph_status({ "graph_id": "graph-v3-replay-208", "format": "json", "include_output": true, "include_history": true })
```

**Expected:** the first submission is accepted (`decision: "accepted"`, `verdict:
"committed"`) with a submission id `submission:<digest>`. The identical replay returns
`verdict: "replayed"` with the **persisted** decision, the same `submission_id` and the
same accepted data; it writes no second accepted event, no second result and no
second successor. The different submission for the already settled attempt returns
`verdict: "settled"` (or `verdict: "conflict"` when the same submission key carries a
different proposal digest) with a non-empty reason and no second accepted result.
Exactly one accepted event exists for the attempt, and its data is the first payload.
An identical replay that re-commits, or a different submission that overwrites the
accepted result, is a FAIL.

**Evidence:** the three verbatim answers (verdict, submission id, decision); the
single accepted event per attempt; the accepted data marker and `n` value.

**Cleanup:** the run completes; remove `.rolebox/test-evidence/graph-v3/208/` after
recording.

**SKIP:** `capability_absent:graph_declarer`; `fixture_agent_absent`;
`worker_self_report_absent` when the worker cannot record its answers.

---

### Test 209: Fan-out, join all, materialized inputs

**Executor:** `rolebox-tester` primary (declaring session), never a dispatched worker.

**Host gate:** graph declarer face; the outcome-worker, Processor, Checker and Echo
fixtures resolve; the dispatch adapter materializes accepted inputs into the
consumer's workspace; Codex SKIPs.

**Fixtures:** Outcome worker (`seed`), Processor (`left`), Checker (`right`), Echo
(`merge`).

**Declaration (submit verbatim):**

```json
{
  "version": 3,
  "name": "graph-v3-fanout-209",
  "nodes": [
    {
      "id": "seed",
      "agent": "rolebox-tester--outcome-worker",
      "prompt": "Write .rolebox/test-evidence/graph-v3/209/seed.txt containing SEED_209, then submit the declared outcome done with data marker SEED_209 and evidence_refs [\".rolebox/test-evidence/graph-v3/209/seed.txt\"].",
      "outcomes": [
        {
          "id": "done",
          "data": { "schema": "json-object", "version": 1 },
          "acceptance": [
            { "validator": "schema", "version": 1 },
            { "validator": "artifact-reference", "version": 1 }
          ]
        }
      ]
    },
    {
      "id": "left",
      "agent": "rolebox-tester--processor",
      "prompt": "Record the materialized input manifest path and the accepted input content in .rolebox/test-evidence/graph-v3/209/left.json, then submit the declared outcome done with data side left.",
      "inputs": [ { "from": "seed", "outcome": "done" } ],
      "outcomes": [ { "id": "done", "data": { "schema": "json-object", "version": 1 }, "acceptance": [ { "validator": "schema", "version": 1 } ] } ]
    },
    {
      "id": "right",
      "agent": "rolebox-tester--checker",
      "prompt": "Record the materialized input manifest path and the accepted input content in .rolebox/test-evidence/graph-v3/209/right.json, then submit the declared outcome done with data side right.",
      "inputs": [ { "from": "seed", "outcome": "done" } ],
      "outcomes": [ { "id": "done", "data": { "schema": "json-object", "version": 1 }, "acceptance": [ { "validator": "schema", "version": 1 } ] } ]
    },
    {
      "id": "merge",
      "agent": "rolebox-tester--echo",
      "prompt": "Record both materialized input manifest paths and both accepted input contents in .rolebox/test-evidence/graph-v3/209/merge.json, then submit the declared outcome done with data joined true.",
      "join": { "strategy": "all" },
      "inputs": [
        { "from": "left", "outcome": "done" },
        { "from": "right", "outcome": "done" }
      ],
      "outcomes": [ { "id": "done", "data": { "schema": "json-object", "version": 1 }, "acceptance": [ { "validator": "schema", "version": 1 } ] } ]
    }
  ],
  "edges": [
    { "from": "seed", "to": "left", "outcome": "done" },
    { "from": "seed", "to": "right", "outcome": "done" },
    { "from": "left", "to": "merge", "outcome": "done" },
    { "from": "right", "to": "merge", "outcome": "done" }
  ]
}
```

**Calls:** declare; after completion read the status and the workers' input records.

```text
graph_declare({ "declaration": <the block above> })
graph_status({ "graph_id": "graph-v3-fanout-209", "format": "json", "include_output": true, "include_history": true })
```

**Expected:** `seed` is the only entry attempt. When its outcome is accepted, **both**
`left` and `right` are armed with distinct attempts; each reports a materialized input
manifest plus the real file whose content matches `seed`'s accepted revision
(`SEED_209` and the retained artifact), not a pathless summary and not a newer file.
`merge` is armed only after **both** `left` and `right` settle — a dispatch after one
settles is a FAIL — and its two materialized inputs are `left`'s and `right`'s accepted
revisions (its `arrivals`/`inputs` name both). The run reaches `complete`; each
consumer's accepted data is an object, so the `schema@1` gates pass. A consumer
that proceeds with a missing input must record an input refusal instead, never a
silent success.

**Evidence:** the four accepted events with attempt ids; the fan-out arming times; the
three worker input records with manifest paths and content; the merge arrivals;
final phase.

**Cleanup:** the run completes; remove `.rolebox/test-evidence/graph-v3/209/` after
recording.

**SKIP:** `capability_absent:graph_declarer`; `capability_absent:graph_inputs` when
the host does not materialize downstream inputs (`dispatch-input-unbound`); a fixture
that cannot report inputs (`worker_self_report_absent`).

---

### Test 210: Bounded loop group — continuation, exit, loop-exhausted

**Executor:** `rolebox-tester` primary (declaring session), never a dispatched worker.

**Host gate:** graph declarer face; the outcome-worker and Echo fixtures resolve; the
dispatch adapter can re-dispatch a loop member; Codex SKIPs.

**Fixtures:** Outcome worker (`work`), Outcome worker (`review`), Echo (`finish`).

**Declaration A (submit verbatim) — one continuation round and an exit:**

```json
{
  "version": 3,
  "name": "graph-v3-loop-210",
  "nodes": [
    {
      "id": "work",
      "agent": "rolebox-tester--outcome-worker",
      "prompt": "On your initial dispatch submit the declared outcome done with data round initial. On a repair dispatch whose materialized input contains LOOP_REVISE, submit done with data marker LOOP_ROUND_2. Record each dispatch's input manifest in .rolebox/test-evidence/graph-v3/210/work.json.",
      "inputs": [ { "from": "review", "outcome": "revise", "when": "triggered" } ],
      "outcomes": [ { "id": "done", "data": { "schema": "json-object", "version": 1 }, "acceptance": [ { "validator": "schema", "version": 1 } ] } ]
    },
    {
      "id": "review",
      "agent": "rolebox-tester--outcome-worker",
      "prompt": "If your materialized input contains LOOP_ROUND_2 submit the declared outcome pass with data marker LOOP_PASS; otherwise submit the declared outcome revise with data marker LOOP_REVISE. Record every answer verbatim in .rolebox/test-evidence/graph-v3/210/review.json.",
      "inputs": [ { "from": "work", "outcome": "done" } ],
      "outcomes": [ { "id": "revise" }, { "id": "pass" } ]
    },
    {
      "id": "finish",
      "agent": "rolebox-tester--echo",
      "prompt": "Reply LOOP_EXIT_210 and submit the declared outcome done.",
      "outcomes": [ { "id": "done" } ]
    }
  ],
  "edges": [
    { "from": "work", "to": "review", "outcome": "done" },
    { "from": "review", "to": "work", "outcome": "revise" },
    { "from": "review", "to": "finish", "outcome": "pass" }
  ],
  "loop_groups": [
    {
      "id": "revision",
      "nodes": ["work", "review"],
      "max_traversals": 2,
      "continuation_outcome": "revise",
      "exit_outcome": "pass"
    }
  ]
}
```

**Declaration B (submit verbatim) — `max_traversals: 1` and an always-revising review, for the exhausted stop:**

```json
{
  "version": 3,
  "name": "graph-v3-loop-exhausted-210",
  "nodes": [
    {
      "id": "work",
      "agent": "rolebox-tester--outcome-worker",
      "prompt": "On your initial dispatch submit the declared outcome done with data round initial. On a repair dispatch whose materialized input contains LOOP_REVISE, submit done with data marker LOOP_ROUND_2.",
      "inputs": [ { "from": "review", "outcome": "revise", "when": "triggered" } ],
      "outcomes": [ { "id": "done", "data": { "schema": "json-object", "version": 1 }, "acceptance": [ { "validator": "schema", "version": 1 } ] } ]
    },
    {
      "id": "review",
      "agent": "rolebox-tester--outcome-worker",
      "prompt": "Always submit the declared outcome revise with data marker LOOP_REVISE and record every answer verbatim in .rolebox/test-evidence/graph-v3/210/review-exhausted.json.",
      "inputs": [ { "from": "work", "outcome": "done" } ],
      "outcomes": [ { "id": "revise" }, { "id": "pass" } ]
    },
    {
      "id": "finish",
      "agent": "rolebox-tester--echo",
      "prompt": "Reply LOOP_EXIT_210 and submit the declared outcome done.",
      "outcomes": [ { "id": "done" } ]
    }
  ],
  "edges": [
    { "from": "work", "to": "review", "outcome": "done" },
    { "from": "review", "to": "work", "outcome": "revise" },
    { "from": "review", "to": "finish", "outcome": "pass" }
  ],
  "loop_groups": [
    {
      "id": "revision",
      "nodes": ["work", "review"],
      "max_traversals": 1,
      "continuation_outcome": "revise",
      "exit_outcome": "pass"
    }
  ]
}
```

**Calls:** declare A, then B; read each status.

```text
graph_declare({ "declaration": <Declaration A> })
graph_status({ "graph_id": "graph-v3-loop-210", "format": "json", "include_loops": true, "include_history": true })
graph_declare({ "declaration": <Declaration B> })
graph_status({ "graph_id": "graph-v3-loop-exhausted-210", "format": "json", "include_loops": true, "include_history": true })
```

**Expected (A):** `work` and `review` form the declared bounded cycle;
`finish` is outside it. Round 1: `review` submits `revise`, the continuation edge is
inside the group, `loops[0].traversals` becomes 1, and `work` is re-dispatched as a
successor attempt whose triggered input carries the review result (`LOOP_REVISE`).
Round 2: `review` submits `pass`, the exit edge routes to `finish`, `finish` settles,
and the run reaches `complete` with no stop record. Exactly one continuation round
occurred; the exit outcome left the loop; the traversal cap was not exceeded.

**Expected (B):** round 1's `revise` is accepted and counts traversal 1 (the cap).
Round 2's `revise` is also accepted (`decision: "accepted"`) but the advance refuses
the round that would exceed the cap: the answer carries `stop.reason:
"loop-exhausted"` with `loop_group_id`, `node_id`, `outcome_id`, `traversals: 1` and
`max_traversals: 1`, no successor is dispatched, and the run phase is `stopped` —
never `complete`, even though every attempt settled. The stop is durable and readable
through `graph_status`; a later submission to the stopped run is refused
`graph-stopped`.

**Evidence:** loop traversals per round; the continuation and exit attempts; the stop
record fields; the phase of each run; the accepted data on both rounds.

**Cleanup:** A is complete. B is stopped (terminal) and stays readable; no cleanup
command and no deletion.

**SKIP:** `capability_absent:graph_declarer`; `fixture_agent_absent`;
`no_start_step_on_host`; the loop half when the host refuses loop member re-dispatch
(`loop_dispatch_unsupported`).

---

### Test 211: `budget.max_executions` 0, 1 and absent; atomic rollback

**Executor:** `rolebox-tester` primary (declaring session), never a dispatched worker.

**Host gate:** graph declarer face and a budget-enforcing store; the outcome-worker,
Echo fixtures resolve; Codex SKIPs.

**Fixtures:** Echo (`blocked`, `free`), Outcome worker (`first`), Echo (`second`).

**Declaration A (submit verbatim) — `0` prevents the first dispatch:**

```json
{
  "version": 3,
  "name": "graph-v3-budget-zero-211",
  "budget": { "max_executions": 0 },
  "nodes": [
    { "id": "blocked", "agent": "rolebox-tester--echo", "prompt": "Reply BLOCKED_211 and submit done.", "outcomes": [ { "id": "done" } ] }
  ],
  "edges": []
}
```

**Declaration B (submit verbatim) — `1` leaves no room for the successor:**

```json
{
  "version": 3,
  "name": "graph-v3-budget-one-211",
  "budget": { "max_executions": 1 },
  "nodes": [
    {
      "id": "first",
      "agent": "rolebox-tester--outcome-worker",
      "prompt": "Submit the declared outcome done with data marker FIRST_211 and record the answer verbatim in .rolebox/test-evidence/graph-v3/211/answers.json.",
      "outcomes": [ { "id": "done" } ]
    },
    { "id": "second", "agent": "rolebox-tester--echo", "prompt": "Reply SECOND_211 and submit done.", "outcomes": [ { "id": "done" } ] }
  ],
  "edges": [ { "from": "first", "to": "second", "outcome": "done" } ]
}
```

**Declaration C (submit verbatim) — no ceiling:**

```json
{
  "version": 3,
  "name": "graph-v3-budget-absent-211",
  "nodes": [
    { "id": "free", "agent": "rolebox-tester--echo", "prompt": "Reply FREE_211 and submit done.", "outcomes": [ { "id": "done" } ] }
  ],
  "edges": []
}
```

**Calls:**

```text
graph_declare({ "declaration": <Declaration A> })
graph_status({ "graph_id": "graph-v3-budget-zero-211", "format": "json", "include_budget": true })
graph_declare({ "declaration": <Declaration B> })
graph_status({ "graph_id": "graph-v3-budget-one-211", "format": "json", "include_budget": true })
graph_declare({ "declaration": <Declaration C> })
graph_status({ "graph_id": "graph-v3-budget-absent-211", "format": "json", "include_budget": true })
```

**Expected:**

- **`0`** — the declaration persists, the start step blocks the first dispatch and
  answers `budget-exhausted` (as a `start.kind: "refused"` refusal, or as
  `start.kind: "blocked"` naming the budget): the dimension, the declared ceiling `0`
  and the committed amount are named. No attempt, credential, state change or dispatch
  effect is written; `nodes[].status` stays `pending` and `current.attempts` is empty.
- **`1`** — `first` is dispatched and consumes the single execution. Its submission
  would arm `second`, whose reservation cannot be made, so the **entire acceptance
  transaction rolls back**: the answer names `budget-exhausted`, no accepted event
  exists for `first`, `second` is not dispatched, and the run never commits a state
  whose next node cannot be started. `first` keeps its own claim (an attempt already
  in flight is never killed); `current.budget.runLimits.max_executions` is `1` and
  `totals.executions` is `1`.
- **absent** — the declaration declares no ceiling (`runLimits.max_executions` is
  absent, not `0`), dispatch works, and the run reaches `complete`.

A reservation that is refunded, a rolled-back acceptance that leaves an accepted
event, or a `0` budget that dispatches the entry attempt is a FAIL.

**Evidence:** the three declare results and budget reports (`runLimits`, `totals`,
`reservedTotals`, `unknownUsageAttempts`); the `budget-exhausted` refusal; the absence
of an accepted event after the rollback; the final phases.

**Cleanup:** stop the `first` run with `budget-stop` reason `graph-v3-211-cleanup`; the
other runs are terminal.

**SKIP:** `capability_absent:graph_declarer`; `capability_absent:graph_budget` when the
host installs no budget surface (`budget-unavailable`); `no_start_step_on_host`.

---

### Test 212: Node budgets — `timeout_ms` accepted, `max_retries` and unknown keys refused

**Executor:** `rolebox-tester` primary (declaring session), never a dispatched worker.

**Host gate:** graph declarer face and a budget-enforcing store; the outcome-worker
fixture resolves; Codex SKIPs.

**Fixtures:** Outcome worker as the single node.

**Declaration (submit verbatim) — the four authorized ceilings:**

```json
{
  "version": 3,
  "name": "graph-v3-node-budget-212",
  "nodes": [
    {
      "id": "timed",
      "agent": "rolebox-tester--outcome-worker",
      "prompt": "Submit the declared outcome done with data marker TIMEOUT_212 and record the answer verbatim in .rolebox/test-evidence/graph-v3/212/answers.json.",
      "budget": {
        "timeout_ms": 120000,
        "max_input_tokens": 20000,
        "max_output_tokens": 2000,
        "max_cost_usd": 0.5
      },
      "outcomes": [ { "id": "done" } ]
    }
  ],
  "edges": []
}
```

**Declarations (intentionally refused; keep as text):**

```text
{
  "version": 3,
  "name": "graph-v3-max-retries-212",
  "nodes": [
    { "id": "timed", "agent": "rolebox-tester--outcome-worker", "prompt": "Submit done.", "budget": { "max_retries": 0 }, "outcomes": [ { "id": "done" } ] }
  ],
  "edges": []
}
```

```text
{
  "version": 3,
  "name": "graph-v3-unknown-budget-212",
  "nodes": [
    { "id": "timed", "agent": "rolebox-tester--outcome-worker", "prompt": "Submit done.", "budget": { "timeout_ms": 1000, "retries": 2 }, "outcomes": [ { "id": "done" } ] }
  ],
  "edges": []
}
```

**Calls:**

```text
graph_declare({ "declaration": <the accepted block above> })
graph_status({ "graph_id": "graph-v3-node-budget-212", "format": "json", "include_budget": true, "include_history": true })
graph_declare({ "declaration": <the max_retries block above> })
graph_declare({ "declaration": <the unknown-key block above> })
```

**Expected:** the accepted declaration records the four ceilings as plan values and the
budget report exposes them per node
(`current.budget.nodes[0].limits.timeout_ms === 120000` and the three token/cost
ceilings); the attempt's reservation carries the declared limits and its usage is
reported separately. Recorded usage is compared against the ceiling and an overrun,
when one occurs, is the actual excess (`used - limit`), never clamped — but this body
never waits out 120 s and never fabricates an overrun. `max_retries`, even `0`, is
refused by name (`invalid-value` at `$.nodes[0].budget.max_retries`), and an unknown
budget key is `unknown-key` at `$.nodes[0].budget.retries`; both fail as
`invalid-declaration` and persist nothing. A ceiling this build cannot enforce is
never ignored or defaulted away.

**Evidence:** the accepted declaration result and node limits; the attempt reservation
and usage fields; both refusal texts with codes and paths; the absence of the refused
graphs from status/audit.

**Cleanup:** the run completes; remove `.rolebox/test-evidence/graph-v3/212/` after
recording.

**SKIP:** `capability_absent:graph_declarer`; `capability_absent:graph_budget`
(`budget-unavailable` for a ceiling the substrate cannot record); `no_start_step_on_host`.

---

### Test 213: `graph_status` read model — summary, tree, json, filters, history, prompt, window, export

**Executor:** `rolebox-tester` primary (declaring session), never a dispatched worker.

**Host gate:** graph declarer face and at least one graph with accepted results
(Test 205) and one with history (Test 210); Codex SKIPs.

**Fixtures:** none — the read model is exercised against the graphs those bodies
declared. This body absorbs the retained scenarios 120 (`max_chars`/`tail`), 124
(`export_path`), 125 (summary) and 132 (`include_artifacts`/`include_evidence`); each of
those ids keeps its own row and its own sub-check above and here.

**Declaration:** none of its own. Reuse `graph-v3-evidence-205`,
`graph-v3-pipeline-18` and `graph-v3-loop-210`; if none of them exists, the body
SKIPs (`graph_absent`) rather than declaring a substitute here.

**Calls** (one group per sub-check; read every answer and keep the render text):

```text
graph_status({ "graph_id": "graph-v3-evidence-205", "format": "summary" })
graph_status({ "graph_id": "graph-v3-evidence-205", "format": "tree" })
graph_status({ "graph_id": "graph-v3-evidence-205", "format": "json", "include_output": true })
graph_status({ "graph_id": "graph-v3-pipeline-18", "group_by": "agent" })
graph_status({ "graph_id": "graph-v3-pipeline-18", "group_by": "hour", "format": "json" })
graph_status({ "graph_id": "graph-v3-pipeline-18", "query": "checker" })
graph_status({ "graph_id": "graph-v3-pipeline-18", "status": "settled" })
graph_status({ "graph_id": "graph-v3-pipeline-18", "agent": "rolebox-tester--checker" })
graph_status({ "graph_id": "graph-v3-pipeline-18", "from_date": "<run start, ISO-8601>" })
graph_status({ "graph_id": "graph-v3-evidence-205", "format": "json", "include_history": true })
graph_status({ "graph_id": "graph-v3-evidence-205", "format": "json", "include_prompt": true })
graph_status({ "graph_id": "graph-v3-evidence-205", "format": "json" })
graph_status({ "graph_id": "graph-v3-loop-210", "format": "json", "include_history": true, "run_id": "<a run id from runs[]>" })
graph_status({ "graph_id": "graph-v3-evidence-205", "node_id": "report", "format": "json", "include_output": true, "max_chars": 40, "tail": true })
graph_status({ "graph_id": "graph-v3-evidence-205", "format": "json", "include_output": true, "export_path": ".rolebox/test-evidence/graph-v3/213/export.json" })
graph_status({ "graph_id": "graph-v3-pipeline-18", "format": "tree", "depth": 1, "limit": 2, "offset": 0 })
graph_status({ "format": "json", "scope": "session" })
```

**Expected:**

- **Formats.** `summary` renders the graph and run identity, a phase and one row per
  selected node (id, agent, native status). `tree` renders the node dependency
  structure. `json` parses and carries `graphId`, `planRevision`, `nodes`, `current`
  (run id, phase, attempts, stop, loops, decisions, unsettled effects, budget) and
  `runs`. The three formats agree on the same node ids, statuses and phase; an
  unreadable store is an error, never an empty success.
- **`group_by`.** `hour`, `day` and `agent` produce settled-node counts for the
  selected run and take precedence over `format`; the counts equal the corresponding
  settled nodes in the `json` render.
- **Filters.** `query` matches node id, prompt or agent case-insensitively; `status`
  selects `pending`, `dispatched` or `settled`; `agent` matches exactly; `from_date`
  and `to_date` bound `dispatchedAt`/`settledAt` in ISO-8601. Each filter returns only
  matching nodes (an empty set is honest).
- **History and `run_id`.** `include_history: true` adds the retained runs, attempts,
  control decisions, approvals and results. `run_id` selects the named archived run;
  querying the current run id returns the same view, and an unknown run id is an error
  rather than a fabricated run.
- **`include_prompt`.** Prompts are omitted by default and present exactly when
  `include_prompt: true` is set (it does not affect `query` matching).
- **`max_chars` / `tail`.** With `tail: true` the output is at most `max_chars`
  characters and is a suffix of the untruncated rendering (Test 120's sub-check).
- **`export_path`.** The selected rendering is written atomically to the path; the
  file parses and equals the same query's unexported render (Test 124's sub-check).
- **`include_artifacts` / `include_evidence`.** Present with the flags, absent without
  them on the same result, and an honest empty when nothing was recorded (Test 132's
  sub-check).
- **Windowing.** `depth`, `limit` and `offset` bound the rendered tree without
  inventing rows.
- **Scope.** `session`, `persisted` and `all` are restricted to this session's own
  persisted graphs; a graph this session never declared is not rendered as an empty
  graph but reported by the tool. The read model never writes.

**Evidence:** each render (trimmed), the parsed `json` keys, the `group_by` counts
beside the `json` counts, the exported file's parsed content, the prompt-omitted and
prompt-included renders, and the truncation suffix comparison.

**Cleanup:** remove `.rolebox/test-evidence/graph-v3/213/` after recording. The body
starts no run of its own; stop any graph it queried that is still in flight
(`budget-stop`, reason `graph-v3-213-cleanup`).

**SKIP:** `capability_absent:graph_declarer`; `graph_absent` when no eligible graph
exists; the result-dependent sub-checks SKIP with `accepted_result_absent` when Test
205 skipped.

---

### Test 214: `graph_audit` verdicts and read-only agreement with status

**Executor:** `rolebox-tester` primary (declaring session), never a dispatched worker.

**Host gate:** graph declarer face and a readable graph store; `graph_audit` takes no
arguments; Codex SKIPs.

**Fixtures:** none of its own — it audits the workspace store the earlier bodies wrote.

**Declaration:** none. The audit is a read-only inventory; it never needs a
declaration, and the body must not declare one just to create a verdict.

**Calls:**

```text
graph_status({ "format": "json", "include_budget": true })
graph_audit({})
```

Run the audit while a graph is still in flight (e.g. start Test 216's graph or use a
graph whose attempt is dispatched), record its verdict, stop every run, then audit
again. Read the reported `ledgerFilePath`, hash it with the host command tool before
and after the audit pair, and re-read `graph_status` after both audits.

**Expected:**

- **`in-flight`.** While any graph has work moving or owed (an executing attempt, a
  pending effect), the verdict is `in-flight`, and the graph's entry says it is not
  terminal and names the work it still owes.
- **`drained`.** After every graph is terminal and no unsettled effect remains, the
  verdict is `drained`; `entries` is sorted by graph id, and `totals` agrees with the
  entry list.
- **Agreement with status.** For every graph entry, terminal agrees with
  `graph_status` reporting `complete` or `stopped`, and in-flight agrees with `ready`
  or `executing`; the graph ids match exactly. A disagreement is a FAIL.
- **Read-only.** The audit opens the ledger read-only and never creates or initializes
  a store. Two consecutive audits with no graph mutation between them return equal
  `entries`, `blockers`, `totals` and `verdict`; the reported `ledgerFilePath` hash is
  unchanged across the pair; the `graph_status` `updatedAt` does not advance across the
  audit calls. If the host's own notification drain settles an effect between the two
  calls, record the change and compare the graph classifications rather than raw
  effect counts — the audit itself still wrote nothing.
- **Blocked verdict not exercised.** `blocked` requires a record the audit cannot
  classify, and this suite never corrupts, reshapes or truncates the store to create
  one. Record `blocked_verdict_not_exercised` in the evidence; do not fabricate a
  blocked store.

**Evidence:** the full audit reports (trimmed), the before/after ledger hashes, the
status phases compared entry by entry, and the two-audit equality check.

**Cleanup:** none — the audit is read-only. Delete any temporary hash files outside the
store.

**SKIP:** `capability_absent:graph_declarer`; `capability_absent:graph_audit` when the
tool is unregistered; `store_unavailable` when the workspace has no readable store
(record the reported ledger status, never initialize one).

---

### Test 215: Run-wide cancel, late submission, skipped target

**Executor:** `rolebox-tester` primary (declaring session), never a dispatched worker.

**Host gate:** graph declarer face; two Sleeper fixtures resolve; the dispatch adapter
delivers cancellation; Codex SKIPs.

**Fixtures:** Sleeper for `slow-a` and `slow-b`; both wait for the release file so the
primary controls the timing.

**Declaration (submit verbatim):**

```json
{
  "version": 3,
  "name": "graph-v3-cancel-215",
  "nodes": [
    {
      "id": "slow-a",
      "agent": "rolebox-tester--sleeper",
      "prompt": "Wait until .rolebox/test-evidence/graph-v3/215/release exists (poll up to 120 s), then submit the declared outcome done and record the answer verbatim in .rolebox/test-evidence/graph-v3/215/slow-a.json.",
      "outcomes": [ { "id": "done" } ]
    },
    {
      "id": "slow-b",
      "agent": "rolebox-tester--sleeper",
      "prompt": "Wait until .rolebox/test-evidence/graph-v3/215/release exists (poll up to 120 s), then submit the declared outcome done and record the answer verbatim in .rolebox/test-evidence/graph-v3/215/slow-b.json.",
      "outcomes": [ { "id": "done" } ]
    }
  ],
  "edges": []
}
```

**Calls:** declare, stop one attempt, cancel the run, then release the workers and
retry the commands.

```text
graph_declare({ "declaration": <the block above> })
graph_control({ "graph_id": "graph-v3-cancel-215", "command": "failure", "node_id": "slow-a", "reason": "ALREADY_DECIDED_215" })
graph_control({ "graph_id": "graph-v3-cancel-215", "command": "cancel", "reason": "CANCEL_215" })
```

Then write `.rolebox/test-evidence/graph-v3/215/release`, read the two worker files,
and exercise the repeats:

```text
graph_control({ "graph_id": "graph-v3-cancel-215", "command": "cancel", "reason": "CANCEL_215_REPEAT" })
graph_control({ "graph_id": "graph-v3-cancel-215", "command": "failure", "node_id": "slow-b", "reason": "COMPETING_215" })
graph_status({ "graph_id": "graph-v3-cancel-215", "format": "json", "include_history": true })
```

**Expected:** the `failure` is applied to `slow-a` and leaves the run executing (an
attempt-scoped stop claims no run fact). The `cancel` is applied: its `decided` list
contains `slow-b`, its `skipped` list contains `slow-a` with
`code: "control-already-decided"` and the existing failure named as its fact, and its
`runControl` records `command: "cancel"`. The run phase is `stopped`. Both late
submissions are refused `control-stopped` — after the cancel claimed the run, the run
fact decides even for the attempt that carries its own failure — and nothing is
written. Repeating `cancel` replays the recorded fact (no second decision). The
competing node-scoped `failure` on `slow-b` (already decided by the cancel) is
refused `control-already-decided`. The stopped run reports its still-unsettled effects
and unconfirmed executions; the worker executions that ran on past the stop stay
visible and are never settled.

**Evidence:** both control answers (`decided`, `skipped`, `runControl`, `unsettledEffects`,
`unconfirmedExecutions`); the two worker refusal files; the stopped run read and its
history.

**Cleanup:** the run is stopped (terminal); the workers' late submissions wrote
nothing. Remove the evidence directory after recording.

**SKIP:** `capability_absent:graph_declarer`; `capability_absent:graph_control`; a
fixture that cannot follow the release-file instruction
(`worker_self_report_absent`); `dispatch_unavailable`.

---

### Test 216: Attempt-scoped failure and timeout — run continues, retry with reason

**Executor:** `rolebox-tester` primary (declaring session), never a dispatched worker.

**Host gate:** graph declarer face; the Sleeper and outcome-worker fixtures resolve;
the host can report an execution end; the retry path holds a readable credential
capability; Codex SKIPs.

**Fixtures:** Sleeper (`victim` and `timed`), Outcome worker (`sibling`).

**Declaration A (submit verbatim) — failure and node-scoped retry:**

```json
{
  "version": 3,
  "name": "graph-v3-attempt-stop-216",
  "nodes": [
    {
      "id": "victim",
      "agent": "rolebox-tester--sleeper",
      "prompt": "Read your dispatch context. If it names RETRY_REASON_216, write that reason to .rolebox/test-evidence/graph-v3/216/retry-context.txt and submit the declared outcome done with data marker RETRY_CONTEXT_216. Otherwise wait until .rolebox/test-evidence/graph-v3/216/release exists (poll up to 120 s), then submit the declared outcome done and record the answer verbatim in .rolebox/test-evidence/graph-v3/216/victim.json.",
      "outcomes": [ { "id": "done" } ]
    },
    {
      "id": "sibling",
      "agent": "rolebox-tester--outcome-worker",
      "prompt": "Submit the declared outcome done with data marker SIBLING_216 and record the answer verbatim in .rolebox/test-evidence/graph-v3/216/sibling.json.",
      "outcomes": [ { "id": "done" } ]
    }
  ],
  "edges": []
}
```

**Declaration B (submit verbatim) — timeout on one attempt:**

```json
{
  "version": 3,
  "name": "graph-v3-attempt-timeout-216",
  "nodes": [
    {
      "id": "timed",
      "agent": "rolebox-tester--sleeper",
      "prompt": "Wait until .rolebox/test-evidence/graph-v3/216/timeout-release exists (poll up to 120 s), then submit the declared outcome done and record the answer verbatim in .rolebox/test-evidence/graph-v3/216/timed.json.",
      "outcomes": [ { "id": "done" } ]
    }
  ],
  "edges": []
}
```

**Calls:**

```text
graph_declare({ "declaration": <Declaration A> })
graph_control({ "graph_id": "graph-v3-attempt-stop-216", "command": "failure", "node_id": "victim", "reason": "FAIL_216" })
graph_status({ "graph_id": "graph-v3-attempt-stop-216", "format": "json", "include_history": true })
```

Wait for the sibling to settle, then write the release file, read `victim.json`, and
retry:

```text
graph_control({ "graph_id": "graph-v3-attempt-stop-216", "command": "retry", "node_id": "victim", "reason": "RETRY_REASON_216" })
```

After the successor settles, run the timeout variant:

```text
graph_declare({ "declaration": <Declaration B> })
graph_control({ "graph_id": "graph-v3-attempt-timeout-216", "command": "timeout", "node_id": "timed", "reason": "TIMEOUT_216" })
graph_status({ "graph_id": "graph-v3-attempt-timeout-216", "format": "json", "include_history": true })
```

**Expected:**

- **Failure is attempt-scoped.** The `failure` is applied to `victim`'s attempt and
  records no run control fact: `runControl` stays absent, the run phase stays
  `executing`, and the sibling still settles and is accepted. The victim's late
  submission is refused `attempt-stopped` while the run keeps executing.
- **Node retry mints a successor.** The `retry` is applied, `minted` names the
  successor attempt (a new attempt id, new credential) for `victim`, and the
  successor's dispatch context carries the superseded attempt id and `RETRY_REASON_216`
  (the worker writes the reason it observed). The successor settles `done` and the run
  reaches `complete`; the superseded attempt keeps its own decision and accepts
  nothing.
- **Timeout mirrors failure.** The `timeout` is applied to `timed`'s attempt, records
  its decision on that attempt, leaves the run executing (not stopped), and the late
  submission is refused `attempt-stopped`. The execution is never relaunched by the
  engine and the run reports it as an unsettled execution until the run-wide stop.

**Evidence:** the failure answer (no run control); the sibling's accepted event; the
late-submission refusal; the retry answer's `minted` successor and the observed retry
reason; the successor's accepted event; the timeout answer and the second late
refusal; the two phases.

**Cleanup:** A completes. B is left executing after the timeout; `budget-stop` it with
reason `graph-v3-216-cleanup`, which reports the still-unsettled execution. Remove
the evidence directory after recording.

**SKIP:** `capability_absent:graph_declarer`; `credential-isolation-unavailable` for
the retry half; `fixture_agent_absent`; `worker_self_report_absent`;
`dispatch_unavailable`.

---

### Test 217: Node retry on a stopped run refused; run-wide retry re-executes

**Executor:** `rolebox-tester` primary (declaring session), never a dispatched worker.

**Host gate:** graph declarer face; the outcome-worker and Echo fixtures resolve; the
host can re-execute a terminal run; Codex SKIPs.

**Fixtures:** Outcome worker (`work`, `review`), Echo (`finish`).

**Declaration (submit verbatim) — stops with `loop-exhausted` at the first traversal:**

```json
{
  "version": 3,
  "name": "graph-v3-run-stopped-217",
  "nodes": [
    {
      "id": "work",
      "agent": "rolebox-tester--outcome-worker",
      "prompt": "On your initial dispatch submit the declared outcome done with data round initial. On a repair dispatch whose materialized input contains LOOP_REVISE, submit done with data marker LOOP_ROUND_2.",
      "inputs": [ { "from": "review", "outcome": "revise", "when": "triggered" } ],
      "outcomes": [ { "id": "done", "data": { "schema": "json-object", "version": 1 }, "acceptance": [ { "validator": "schema", "version": 1 } ] } ]
    },
    {
      "id": "review",
      "agent": "rolebox-tester--outcome-worker",
      "prompt": "Always submit the declared outcome revise with data marker LOOP_REVISE and record every answer verbatim in .rolebox/test-evidence/graph-v3/217/review.json.",
      "inputs": [ { "from": "work", "outcome": "done" } ],
      "outcomes": [ { "id": "revise" }, { "id": "pass" } ]
    },
    { "id": "finish", "agent": "rolebox-tester--echo", "prompt": "Reply LOOP_EXIT_217 and submit the declared outcome done.", "outcomes": [ { "id": "done" } ] }
  ],
  "edges": [
    { "from": "work", "to": "review", "outcome": "done" },
    { "from": "review", "to": "work", "outcome": "revise" },
    { "from": "review", "to": "finish", "outcome": "pass" }
  ],
  "loop_groups": [
    { "id": "revision", "nodes": ["work", "review"], "max_traversals": 1, "continuation_outcome": "revise", "exit_outcome": "pass" }
  ]
}
```

**Calls:** declare, confirm the stop, try the node-scoped retry, then the run-scoped
retry.

```text
graph_declare({ "declaration": <the block above> })
graph_status({ "graph_id": "graph-v3-run-stopped-217", "format": "json", "include_history": true })
graph_control({ "graph_id": "graph-v3-run-stopped-217", "command": "retry", "node_id": "review", "reason": "NODE_RETRY_217" })
graph_control({ "graph_id": "graph-v3-run-stopped-217", "command": "retry", "reason": "RUN_RETRY_217" })
graph_status({ "graph_id": "graph-v3-run-stopped-217", "format": "json", "include_history": true })
```

**Expected:** the run stops with `reason: "loop-exhausted"` (the same record Test 210
asserts) and its settled attempts stay readable. The node-scoped `retry` is refused
`run-stopped`: a stopped run accepts no submission, so an attempt minted in place
could never settle; the refusal names the run and its stop. The run-scoped `retry`
(the command that names no node) is applied: its `reexecution` names the successor
run, a NEW run id appears, the entry node `work` is dispatched again in that run, and
the previous run remains terminal and readable by `run_id` with its own stop record and
receipts. The successor run's attempts are new attempts, not resumed ones. A node
retry that succeeds on the stopped run, or a run retry that reuses the old run id, is a
FAIL.

**Evidence:** the stop record; the `run-stopped` refusal; the `reexecution` and the
new run id; the entry attempt in the successor run; the two runs side by side by
`run_id`.

**Cleanup:** stop the successor run with `budget-stop` reason
`graph-v3-217-cleanup` once its entry dispatch is observed; nothing is deleted.

**SKIP:** `capability_absent:graph_declarer`; `fixture_agent_absent`;
`run_not_reexecutable` when the host refuses a run-scoped retry
(`run-has-unsettled-effects` or `run-not-terminal`).

---

### Test 218: Approval preflight and the gated installed-policy continuation

**Executor:** `rolebox-tester` primary (declaring session), never a dispatched worker.

**Host gate:** graph declarer face and an in-flight attempt; branch B additionally
needs an operator-installed `ROLEBOX_GRAPH_APPROVAL_POLICY` revision whose rule matches
the test graph and node, and (for a decision) a live approver session; Codex SKIPs.

**Fixtures:** Outcome worker as the single node; the worker waits for the release file
so the request lands on an in-flight attempt.

**Declaration (approval-gated; refused in branch A, executable in branch B — keep as
text because it needs an installed approval rule):**

```text
{
  "version": 3,
  "name": "graph-v3-approval-218",
  "nodes": [
    {
      "id": "review",
      "agent": "rolebox-tester--outcome-worker",
      "prompt": "Wait until .rolebox/test-evidence/graph-v3/218/release exists (poll up to 120 s), then submit the declared outcome approved and record every answer verbatim in .rolebox/test-evidence/graph-v3/218/review.json.",
      "outcomes": [
        { "id": "approved", "acceptance": [ { "validator": "principal-approval", "version": 1 } ] }
      ]
    }
  ],
  "edges": []
}
```

**Calls — branch A (no approval policy installed):** declare the rejection graph from
Test 216 Declaration B, raise the request on its still-in-flight attempt, then stop
the run.

```text
graph_declare({ "declaration": <Test 216 Declaration B> })
graph_control({ "graph_id": "graph-v3-attempt-timeout-216", "command": "approval-request", "node_id": "timed", "approver_session_id": "<this session's id>", "expires_at": <now + 600000>, "reason": "APPROVAL_218" })
graph_control({ "graph_id": "graph-v3-attempt-timeout-216", "command": "budget-stop", "reason": "graph-v3-218-cleanup" })
```

**Calls — branch B (policy installed; run only when the probe shows it):**

```text
graph_declare({ "declaration": <the block above> })
graph_control({ "graph_id": "graph-v3-approval-218", "command": "approval-request", "node_id": "review", "approver_session_id": "<this session's id>", "expires_at": <now + 120000>, "reason": "APPROVAL_SELF_218" })
graph_control({ "graph_id": "graph-v3-approval-218", "command": "approval-request", "node_id": "review", "approver_session_id": "<a session the policy allows>", "expires_at": <now + 120000>, "reason": "APPROVAL_218" })
graph_control({ "graph_id": "graph-v3-approval-218", "command": "approve", "node_id": "review", "reason": "APPROVE_218" })
graph_control({ "graph_id": "graph-v3-approval-218", "command": "reject", "node_id": "review", "reason": "REJECT_218" })
```

After the second request is pending, write
`.rolebox/test-evidence/graph-v3/218/release` so the worker submits once and its answer
observes `approval-pending` (the release is not an approval; only `graph_control`
decides).

**Expected — branch A (policy absent):** the declaration is refused by the preflight:
reason `draft-plan`, `unresolved` names `principal-approval@1` and the reason that no
installed approval policy authorizes approvers for this graph and node; nothing is
persisted (no entry in `graph_status` or `graph_audit`). The `approval-request` on the
in-flight attempt is refused `approval-not-authorized` (the installed policy
authorizes no approver; independent review forbids self-approval), and nothing is
written — no approval row, no pause. The installed-policy branch is SKIP with
`operator_policy_absent`.

**Expected — branch B (policy installed):** the declaration compiles (`executability:
"executable"`) because the installed rule authorizes this exact graph and node. A
request naming the declarer itself is refused `approval-not-authorized` under
`independent-review`; a request naming an allowed third session is raised with
`status: "pending"`, its pinned policy identity/revision/digest/mode, and a future
deadline. While pending, the attempt's submission is refused `approval-pending` (the
payload, including any `approved` field, is never read as a decision). A decision from
any session other than the recorded approver is refused `approval-not-authorized`; a
repeat decision replays; a competing decision is refused `approval-already-decided`; a
decision after the deadline is refused `approval-expired` and the expiry is
materialized durably. An approved request lets the submission settle; a rejected one
is refused `approval-rejected` and can never be approved later. Only an
`operator-confirmation` rule permits confirming one's own request, and the suite never
installs or edits the policy.

If the named approver session is not available to this run (a single-session host),
record the request and the self-approval/authorization refusals as PASS and SKIP the
approve/reject/expiry execution sub-checks with `approver_session_unavailable`; never
fabricate a decision and never name a session the policy does not allow.

**Evidence:** branch A's draft refusal and `approval-not-authorized`; branch B's
request row (policy id/revision/digest/mode, approver, deadline, status), each
decision answer, the pending/rejected submission refusals, and the expiry.

**Cleanup:** stop the runs with `budget-stop` reason `graph-v3-218-cleanup`; pending
and expired approvals stay visible in the run history and are never deleted.

**SKIP:** `operator_policy_absent` for branch B; `approver_session_unavailable` for the
decision sub-checks; `capability_absent:graph_declarer`; no in-flight attempt to
request approval on (`attempt_absent`).

---

### Test 219: Natural completion refused without policy; gated natural settle

**Executor:** `rolebox-tester` primary (declaring session), never a dispatched worker.

**Host gate:** graph declarer face; branch B additionally needs an
operator-installed `ROLEBOX_GRAPH_COMPLETION_POLICIES` revision that authorizes the
exact graph, node and outcome mapping; Codex SKIPs.

**Fixtures:** Echo as the single natural node (it must end its turn without submitting
in branch B).

**Declaration A (no policy request; keep as text):**

```text
{
  "version": 3,
  "name": "graph-v3-natural-norequest-219",
  "nodes": [
    {
      "id": "work",
      "agent": "rolebox-tester--echo",
      "prompt": "Do not call graph_submit_outcome; end your final turn normally with NATURAL_219_OK.",
      "completion": { "mode": "natural", "outcome": "done" },
      "outcomes": [ { "id": "done" } ]
    }
  ],
  "edges": []
}
```

**Declaration B (requests a revision that is not installed; keep as text):**

```text
{
  "version": 3,
  "name": "graph-v3-natural-219",
  "completion_policy": { "id": "rolebox.graph.completion", "revision": "2" },
  "nodes": [
    {
      "id": "work",
      "agent": "rolebox-tester--echo",
      "prompt": "Do not call graph_submit_outcome; end your final turn normally with NATURAL_219_OK.",
      "completion": { "mode": "natural", "outcome": "done" },
      "outcomes": [ { "id": "done" } ]
    }
  ],
  "edges": []
}
```

**Calls — branch A (no installed completion policy):**

```text
graph_declare({ "declaration": <Declaration A> })
graph_declare({ "declaration": <Declaration B> })
graph_status({ "format": "json" })
graph_audit({})
```

**Calls — branch B (the exact revision is installed and authorized):** declare
Declaration B (now executable), let the node's worker end its turn without a
submission, then read the accepted event and the run.

```text
graph_status({ "graph_id": "graph-v3-natural-219", "format": "json", "include_output": true, "include_history": true })
```

**Expected — branch A:** both declarations are refused by the preflight with reason
`draft-plan` and an unauthorized natural-completion mapping. Declaration A names the
node and outcome and the code `completion-policy-unavailable` ("the declaration
requests no policy revision at all"); Declaration B names the requested
`rolebox.graph.completion@2` and the code `completion-policy-unavailable` (no policy
capability installed) or `completion-policy-unknown` / `completion-policy-unknown-revision`
(no such id or exact revision installed). Neither definition is persisted; a catalog
entry in the repository is not an authorization. The installed-policy branch SKIPs
with `operator_policy_absent`.

**Expected — branch B:** the declaration compiles as executable because the host
installed that exact revision and its rule allows this graph, node and outcome mapping.
The worker ends its turn without calling `graph_submit_outcome`; when the host confirms
the execution ended, the host settles the node through natural completion: the accepted
event's outcome is the pinned `done`, its `submission_id` is
`natural-completion:<digest>`, the outcome's gates still run, and the run reaches
`complete`. The pinned policy identity is recorded with the plan; a policy republished
under the same id and revision with different content cannot settle it. Natural
completion never carries a payload (the no-data-channel envelope carries node, attempt
and credential only), and the dsh JSON fallback is refused for a natural node
(`derived-completion-natural-node`) — record that refusal only if a worker attempts it.

**Evidence:** branch A's two draft refusals with the mapping code; branch B's accepted
event and `natural-completion:` submission id, the pinned policy identity, and the
final phase.

**Cleanup:** branch B completes; branch A persists nothing. No environment variable is
set and no policy is installed by the tester.

**SKIP:** `operator_policy_absent` for branch B; `capability_absent:graph_declarer`;
the natural settle when the host exposes no execution-end observation
(`host_completion_unavailable`).

---

### Test 220: Worker tool face

**Executor:** `rolebox-tester` primary (declaring session), never a dispatched worker.
The worker is the observation subject; the primary records the row.

**Host gate:** graph declarer face; the outcome-worker fixture resolves; the worker can
enumerate and report its own tool roster; Codex SKIPs.

**Fixtures:** Outcome worker as the single node.

**Declaration (submit verbatim):**

```json
{
  "version": 3,
  "name": "graph-v3-toolface-220",
  "nodes": [
    {
      "id": "face",
      "agent": "rolebox-tester--outcome-worker",
      "prompt": "List the exact tool names in your session roster and write them to .rolebox/test-evidence/graph-v3/220/tools.txt. State explicitly whether graph_submit_outcome, graph_declare, graph_control, graph_status, graph_audit, team_create, team_list_roles, dispatch_task, task_retry and session_fork are present. Then submit the declared outcome done with data tools listing every name you found.",
      "outcomes": [
        { "id": "done", "data": { "schema": "json-object", "version": 1 }, "acceptance": [ { "validator": "schema", "version": 1 } ] }
      ]
    }
  ],
  "edges": []
}
```

**Calls:** declare, then read the worker's evidence file and the accepted data.

```text
graph_declare({ "declaration": <the block above> })
graph_status({ "graph_id": "graph-v3-toolface-220", "format": "json", "include_output": true })
```

**Expected:** the worker's roster and accepted `data.tools` agree: `graph_submit_outcome`
is present; the inherited native command/file tools the parent authorized are present
(`bash`, `read`, `write`, `edit` where the host registers them); `graph_declare`,
`graph_control`, `graph_status` and `graph_audit` are **absent**; `team_create` and the
other `team_*` tools are absent; every `dispatch_*` tool is absent; `task_retry` is
absent (withheld by design); `session_fork` is absent. The worker cannot declare,
control, read or audit a graph, and its submission settles only its own attempt. A
control tool or a team/dispatch tool appearing in the worker roster is a FAIL; a
worker that cannot report its roster is a SKIP, never a PASS.

**Evidence:** the worker's roster file, the accepted `data.tools`, and the primary's own
roster showing the declarer face it holds (the contrast is the point).

**Cleanup:** the run completes; remove `.rolebox/test-evidence/graph-v3/220/` after
recording.

**SKIP:** `capability_absent:graph_declarer`; `capability_absent:graph_worker`
(`graph_submit_outcome` not delivered); `worker_self_report_absent`.

---

### Test 221: `toolPresentation` native, discover and code

**Executor:** `rolebox-tester` primary (declaring session), never a dispatched worker.
The workers report their presentation; the primary records the row.

**Host gate:** graph declarer face; `toolPresentation` is part of the compiled plan and
presentation support depends on the host — DSH supports native, discover and code;
Pi and opencode 2 support native and discover and reject code; opencode 1.x rejects any
explicit presentation; Codex SKIPs.

**Fixtures:** Outcome worker in each declaration.

**Declaration A (submit verbatim) — native:**

```json
{
  "version": 3,
  "name": "graph-v3-presentation-native-221",
  "nodes": [
    {
      "id": "face",
      "agent": "rolebox-tester--outcome-worker",
      "prompt": "Report whether graph_worker_tools and graph_worker_code are in your roster and whether direct tool schemas are visible; write it to .rolebox/test-evidence/graph-v3/221/native.txt, then submit the declared outcome done with data mode native.",
      "toolPresentation": { "mode": "native" },
      "outcomes": [ { "id": "done", "data": { "schema": "json-object", "version": 1 }, "acceptance": [ { "validator": "schema", "version": 1 } ] } ]
    }
  ],
  "edges": []
}
```

**Declaration B (submit verbatim) — discover with preload:**

```json
{
  "version": 3,
  "name": "graph-v3-presentation-discover-221",
  "nodes": [
    {
      "id": "face",
      "agent": "rolebox-tester--outcome-worker",
      "prompt": "Report whether graph_worker_tools and graph_worker_code are in your roster, list the preloaded tools you can see, and describe one tool through graph_worker_tools; write it to .rolebox/test-evidence/graph-v3/221/discover.txt, then submit the declared outcome done with data mode discover.",
      "toolPresentation": { "mode": "discover", "preload": ["bash", "read", "edit"] },
      "outcomes": [ { "id": "done", "data": { "schema": "json-object", "version": 1 }, "acceptance": [ { "validator": "schema", "version": 1 } ] } ]
    }
  ],
  "edges": []
}
```

**Declaration C (submit verbatim) — code:**

```json
{
  "version": 3,
  "name": "graph-v3-presentation-code-221",
  "nodes": [
    {
      "id": "face",
      "agent": "rolebox-tester--outcome-worker",
      "prompt": "Report whether graph_worker_tools and graph_worker_code are in your roster, whether preloaded tools are visible, and whether a code invocation can call an authorized tool; write it to .rolebox/test-evidence/graph-v3/221/code.txt, then submit the declared outcome done with data mode code.",
      "toolPresentation": { "mode": "code", "preload": ["bash"] },
      "outcomes": [ { "id": "done", "data": { "schema": "json-object", "version": 1 }, "acceptance": [ { "validator": "schema", "version": 1 } ] } ]
    }
  ],
  "edges": []
}
```

**Calls:** declare each in turn on a host whose probe reports the mode supported; read
the worker reports.

```text
graph_declare({ "declaration": <Declaration A> })
graph_declare({ "declaration": <Declaration B> })
graph_declare({ "declaration": <Declaration C> })
graph_status({ "graph_id": "graph-v3-presentation-discover-221", "format": "json", "include_output": true })
```

**Expected by host:**

- **native (all supporting hosts).** Neither broker tool is visible; the authorized
  tool schemas are presented directly; `graph_submit_outcome` still settles the
  attempt. Omitting `toolPresentation` behaves exactly like `native`.
- **discover (DSH and opencode 2).** `graph_worker_tools` is visible and
  `graph_worker_code` is not; the preloaded names are visible; discovery can search,
  list and describe an authorized tool, and describing does not change the grant.
- **code (DSH only).** `graph_worker_tools` and `graph_worker_code` are both visible;
  preloaded tools are visible; a code invocation can call an authorized tool through
  the broker; completion remains a separate `graph_submit_outcome` call and a script
  cannot declare, control or settle through the broker.
- **Documented rejections.** Pi and opencode 2 reject `code` mode before starting the
  worker, and opencode 1.x rejects any explicit `toolPresentation` and keeps native
  presentation with host permissions. Those rejections are PASS when the observed
  refusal names the unsupported mode/field; the mode-specific success sub-check then
  SKIPs (`code_presentation_unsupported` / `presentation_unsupported`).
- **Plan identity.** Explicit presentation settings are part of the compiled plan
  revision: the three declarations have different revisions, and an unchanged
  re-declaration preserves its revision after a restart.

Preload is at most 32 exact task-tool names, never a wildcard, never a graph-control
name; an invalid preload entry is refused at declaration (`invalid-value`), not
silently dropped. Presentation changes visibility, never the grant.

**Evidence:** the three declaration results and their revisions; each worker's report;
the rejection texts; the broker call results (discovery search/describe, code
invocation).

**Cleanup:** each run completes; remove `.rolebox/test-evidence/graph-v3/221/` after
recording. A rejected mode leaves a persisted declaration with a failed start; record
it and move on.

**SKIP:** `capability_absent:graph_declarer`; `presentation_unsupported` on opencode
1.x; `code_presentation_unsupported` on Pi/opencode 2; `worker_self_report_absent`.

---

### Test 222: Required and triggered accepted-result inputs on a repair round

**Executor:** `rolebox-tester` primary (declaring session), never a dispatched worker.

**Host gate:** graph declarer face; the outcome-worker and Echo fixtures resolve; the
dispatch adapter materializes accepted inputs; Codex SKIPs.

**Fixtures:** Outcome worker (`work`, `review`), Echo (`finish`).

**Declaration (submit verbatim):**

```json
{
  "version": 3,
  "name": "graph-v3-triggered-input-222",
  "nodes": [
    {
      "id": "work",
      "agent": "rolebox-tester--outcome-worker",
      "prompt": "On your initial dispatch submit the declared outcome done with data round initial and record the input manifest set in .rolebox/test-evidence/graph-v3/222/work-initial.json. On a repair dispatch whose materialized input contains LOOP_REVISE, submit done with data marker TRIGGERED_INPUT_222 and record the input manifest set and content in .rolebox/test-evidence/graph-v3/222/work-repair.json.",
      "inputs": [ { "from": "review", "outcome": "revise", "when": "triggered" } ],
      "outcomes": [ { "id": "done", "data": { "schema": "json-object", "version": 1 }, "acceptance": [ { "validator": "schema", "version": 1 } ] } ]
    },
    {
      "id": "review",
      "agent": "rolebox-tester--outcome-worker",
      "prompt": "Record the required materialized input content in .rolebox/test-evidence/graph-v3/222/review-round1.json. If the input contains TRIGGERED_INPUT_222 submit the declared outcome pass with data marker LOOP_PASS; otherwise submit the declared outcome revise with data marker LOOP_REVISE.",
      "inputs": [ { "from": "work", "outcome": "done" } ],
      "outcomes": [ { "id": "revise" }, { "id": "pass" } ]
    },
    {
      "id": "finish",
      "agent": "rolebox-tester--echo",
      "prompt": "Reply TRIGGERED_EXIT_222 and submit the declared outcome done.",
      "outcomes": [ { "id": "done" } ]
    }
  ],
  "edges": [
    { "from": "work", "to": "review", "outcome": "done" },
    { "from": "review", "to": "work", "outcome": "revise" },
    { "from": "review", "to": "finish", "outcome": "pass" }
  ],
  "loop_groups": [
    { "id": "repair", "nodes": ["work", "review"], "max_traversals": 2, "continuation_outcome": "revise", "exit_outcome": "pass" }
  ]
}
```

**Calls:**

```text
graph_declare({ "declaration": <the block above> })
graph_status({ "graph_id": "graph-v3-triggered-input-222", "format": "json", "include_output": true, "include_history": true })
```

**Expected:** `work`'s **initial** dispatch carries no `review` input: the
`when: "triggered"` input is absent because no matching arrival exists, and the worker's
recorded input set for the initial round is empty (or contains no review entry) while
the dispatch still proceeds. `review` declares a **required** input from
`work/done` (no `when`), so every `review` dispatch — the first included — carries
`work`'s accepted result materialized from its accepted revision; the worker's
`review-round1` record shows that content. Round 1's `revise` triggers the repair
dispatch of `work`, which binds the exact `review` attempt that arrived: its accepted
data (containing `LOOP_REVISE`) and any retained artifacts are materialized in the
repair attempt, and `work`'s accepted repair data carries `TRIGGERED_INPUT_222`.
Round 2's `pass` exits the loop to `finish` and the run reaches `complete`.

The compiler requires a direct incoming edge matching both source and outcome for a
triggered input: a trigger input without that edge is refused `input-trigger-not-edge`,
a required input whose producer no declared edge path reaches is `input-not-upstream`,
and a missing/unreadable/mismatched triggered result blocks dispatch once triggered
(`dispatch-input-unbound`) rather than proceeding with a hole. Record those refusals
only from a deliberately malformed copy, never by editing this declaration.

**Evidence:** the initial and repair input records for `work`; the required-input record
for `review`; the accepted events and their revisions; the run phase.

**Cleanup:** the run completes; remove `.rolebox/test-evidence/graph-v3/222/` after
recording.

**SKIP:** `capability_absent:graph_declarer`; `capability_absent:graph_inputs` when
downstream inputs are not materialized; `worker_self_report_absent`.

---

### Test 223: DSH host-derived JSON fallback

**Executor:** `rolebox-tester` primary (declaring session), never a dispatched worker.

**Host gate:** **DSH only** — the JSON fallback guidance is exclusive to dsh: the host
reads the declaring worker's own final turn. A host that does not expose that read
reports no derived completion, and the whole body SKIPs
(`host_derived_completion_unsupported`); Codex SKIPs the module.

**Fixtures:** Echo for `one-block`, `no-block` and `two-blocks`, each instructed to end
its turn with the named declaration shape and never to call `graph_submit_outcome`.

**Declaration (submit verbatim):**

```json
{
  "version": 3,
  "name": "graph-v3-json-fallback-223",
  "nodes": [
    {
      "id": "one-block",
      "agent": "rolebox-tester--echo",
      "prompt": "Do not call graph_submit_outcome. Reply BLOCK_ONE_223 and end your final turn with exactly one fenced json code block declaring outcome_id done and data marker FALLBACK_ONE_223.",
      "outcomes": [ { "id": "done", "data": { "schema": "json-object", "version": 1 }, "acceptance": [ { "validator": "schema", "version": 1 } ] } ]
    },
    {
      "id": "no-block",
      "agent": "rolebox-tester--echo",
      "prompt": "Do not call graph_submit_outcome and do not include any fenced json block. Reply NO_BLOCK_223 and end your turn.",
      "outcomes": [ { "id": "done", "data": { "schema": "json-object", "version": 1 }, "acceptance": [ { "validator": "schema", "version": 1 } ] } ]
    },
    {
      "id": "two-blocks",
      "agent": "rolebox-tester--echo",
      "prompt": "Do not call graph_submit_outcome. End your final turn with two separate fenced json code blocks, each declaring outcome_id done and data marker FALLBACK_TWO_223.",
      "outcomes": [ { "id": "done", "data": { "schema": "json-object", "version": 1 }, "acceptance": [ { "validator": "schema", "version": 1 } ] } ]
    }
  ],
  "edges": []
}
```

**Calls:** declare, let all three executions end, then read the attempts.

```text
graph_declare({ "declaration": <the block above> })
graph_status({ "graph_id": "graph-v3-json-fallback-223", "format": "json", "include_history": true, "include_output": true })
```

**Expected:** `one-block` is settled by the host-derived channel: the accepted outcome
is `done`, `data.marker` is `FALLBACK_ONE_223`, and the accepted `submission_id` is
`host-derived:<digest>` (not `submission:` and not `natural-completion:`). `no-block`
and `two-blocks` derive nothing: no accepted event, no accepted result, and the
attempt stays open while the host reports the execution ended; each produces an
`attention` notice keyed `unsettled-completion:<attemptId>`. A declaration is not a
submission: the plan still decides whether the outcome exists and passes its gates, so
an undeclared `outcome_id`, a missing/empty `outcome_id`, an unknown key or a failed
gate derives nothing and settles nothing. A failed or aborted final turn is not a
declaration source. A prior rejected or refused submission does not disable the
fallback, and an already accepted attempt is never settled again. The channel carries
no credential and is reachable only from the host — no graph tool binds it.

**Evidence:** the three attempts' accepted state and submission ids; the open attempts
and their `attention` notices; the run's unsettled effects.

**Cleanup:** the two open attempts keep the run in flight; `cancel` or `budget-stop` it
with reason `graph-v3-223-cleanup` and record the unsettled executions. Nothing is
deleted.

**SKIP:** `host_derived_completion_unsupported` on a non-DSH host;
`worker_submitted_instead_of_declaring` when a worker calls the tool anyway (the
fallback was not exercised; the ordinary submission is recorded as such);
`capability_absent:graph_declarer`.

---

### Test 224: Durable run notification effect — complete, stopped, attention

**Executor:** `rolebox-tester` primary (declaring session), never a dispatched worker.

**Host gate:** graph declarer face; the declaring session is the run's invocation
origin; delivery needs a host wake channel (DSH, Pi and both opencode entries install
one when available); a host with no wake channel SKIPs the delivery sub-check
(`wake_channel_absent`) while the run itself is unaffected; Codex SKIPs.

**Fixtures:** Echo (`notify`, `fast`), Sleeper (`slow`, `victim`), Outcome worker
(`sibling`).

**Declaration A (submit verbatim) — a run that completes:**

```json
{
  "version": 3,
  "name": "graph-v3-notification-224",
  "nodes": [
    { "id": "notify", "agent": "rolebox-tester--echo", "prompt": "Reply NOTIFICATION_224_OK and submit the declared outcome done.", "outcomes": [ { "id": "done" } ] }
  ],
  "edges": []
}
```

**Declaration B (submit verbatim) — a run that is stopped while an attempt is in flight:**

```json
{
  "version": 3,
  "name": "graph-v3-notification-stopped-224",
  "nodes": [
    {
      "id": "slow",
      "agent": "rolebox-tester--sleeper",
      "prompt": "Wait until .rolebox/test-evidence/graph-v3/224/release exists (poll up to 120 s), then submit the declared outcome done.",
      "outcomes": [ { "id": "done" } ]
    },
    { "id": "fast", "agent": "rolebox-tester--echo", "prompt": "Reply FAST_224 and submit the declared outcome done.", "outcomes": [ { "id": "done" } ] }
  ],
  "edges": []
}
```

**Declaration C (submit verbatim) — a run that needs attention while it continues:**

```json
{
  "version": 3,
  "name": "graph-v3-notification-attention-224",
  "nodes": [
    {
      "id": "victim",
      "agent": "rolebox-tester--sleeper",
      "prompt": "Wait until .rolebox/test-evidence/graph-v3/224/attention-release exists (poll up to 120 s), then submit the declared outcome done.",
      "outcomes": [ { "id": "done" } ]
    },
    {
      "id": "sibling",
      "agent": "rolebox-tester--outcome-worker",
      "prompt": "Submit the declared outcome done with data marker SIBLING_224.",
      "outcomes": [ { "id": "done" } ]
    }
  ],
  "edges": []
}
```

**Calls:** declare A and let it complete; declare B and stop it; declare C and stop one
attempt while the run continues.

```text
graph_declare({ "declaration": <Declaration A> })
graph_declare({ "declaration": <Declaration B> })
graph_control({ "graph_id": "graph-v3-notification-stopped-224", "command": "budget-stop", "reason": "NOTIFY_STOPPED_224" })
graph_declare({ "declaration": <Declaration C> })
graph_control({ "graph_id": "graph-v3-notification-attention-224", "command": "failure", "node_id": "victim", "reason": "NOTIFY_ATTENTION_224" })
graph_status({ "graph_id": "graph-v3-notification-attention-224", "format": "json", "include_history": true })
```

**Expected:** the declaring session receives at least one reminder per run event,
deduplicated per run and event key (at-least-once delivery may repeat after a crash;
that replay is out of scope here):

- **complete** — after run A reaches `complete`, a reminder with the marker
  `[GRAPH COMPLETE]` whose JSON carries `notification_id` (`notify:` followed by a
  sha256 hex digest derived from graph, run and event key), `graph_id`,
  `run_id`, `status: "complete"` and a reason. It contains no credential and no
  business payload; it directs the reader to `graph_status` for the committed result.
- **stopped** — after `budget-stop`, a reminder with the marker `[GRAPH BLOCKED]`,
  `status: "stopped"` and a reason naming the stop; the notice names the run identity
  and the still-unsettled work.
- **attention** — after the attempt-scoped `failure` while the run continues, a
  reminder with `status: "attention"` naming the node, the attempt and the reason, with
  the event key `stopped:<attemptId>:failure`. It settles, releases and advances
  nothing: the sibling still settles, the stopped attempt stays open and the node's
  dependents stay unreleased until a retry or a run-wide stop.

Each notice is a durable intent committed in the same transaction as the graph
mutation: a committed event has a notification row and a failed commit has none.
Identity is stable per graph, run and event key, so the same event is recognisable
across attempts; a new run gets its own notification; an attention reminder whose
condition is resolved is discarded rather than retried. Delivery is at least once and
never drives execution: a failed delivery leaves it pending (visible as unsettled
work) and never changes the run's outcome. Re-delivery after a process crash is not
exercised here (`delivery_replay_out_of_scope`); record it as not run rather than
fabricating a duplicate.

**Evidence:** the three reminder texts with their JSON (notification id, graph, run,
status, node/attempt, reason); the run identities they name; the attention run's
continued phase and sibling settlement; the absence of a credential in every notice.

**Cleanup:** A completes; B is stopped; C's run is stopped with `budget-stop` reason
`graph-v3-224-cleanup` after the attention is recorded. The notifications are durable
effects and are not deleted. Remove `.rolebox/test-evidence/graph-v3/224/`.

**SKIP:** `wake_channel_absent` for the delivery sub-checks; `capability_absent:graph_declarer`;
`fixture_agent_absent`.

---

## Recording this module

Every one of the 32 ids above produces exactly one per-test row with `id`, `name`,
`status`, `evidence`, `error_detail`, `duration_ms`, `executor` (the primary lane) and
`capability_reason` (non-empty only for a SKIP). The module summary reports:

- **Total:** 32.
- **PASS:** the documented behavior observed, including every requested named refusal
  (a grammar refusal, a rejected gate, a credential isolation refusal, a replay, a
  `run-stopped`, a `control-already-decided`).
- **FAIL:** a present family contradicting its contract, a required marker missing, a
  wrong value, an unexpected refusal, or a test that could not complete after starting.
- **SKIP:** each with one machine-readable reason from this module's vocabulary:
  `capability_absent:graph_declarer`, `capability_absent:graph_worker`,
  `capability_absent:graph_acceptance`, `capability_absent:graph_budget`,
  `capability_absent:graph_inputs`, `capability_absent:graph_audit`,
  `fixture_agent_absent`, `dispatch_unavailable`, `no_start_step_on_host`,
  `operator_policy_absent`, `approver_session_unavailable`,
  `host_derived_completion_unsupported`, `presentation_unsupported`,
  `code_presentation_unsupported`, `worker_self_report_absent`,
  `accepted_result_absent`, `graph_absent`, `run_not_reexecutable`,
  `host_completion_unavailable`, `loop_dispatch_unsupported`,
  `persisted_store_unavailable`, `store_unavailable`, `wake_channel_absent`.

A module with every test SKIP for one capability class is reported as skipped for that
reason; a partially executed module reports its per-test rows. A required test that was
not run is a suite-level failure recorded in `incomplete_items`, never a silent SKIP.

## Not exercised by this module

- **`blocked` audit verdict.** It requires a record the audit cannot classify; the
  suite never corrupts, reshapes, truncates or rebinds the store, so the branch is
  recorded as not exercised (`blocked_verdict_not_exercised`) and never fabricated.
- **Notification re-delivery after a crash.** The at-least-once lease and the
  persisted acknowledgement need a process restart; that is out of scope here
  (`delivery_replay_out_of_scope`).
- **Approval decisions by a session this run cannot host.** The single-session suite
  cannot drive a second live declaring session; `approver_session_unavailable` records
  it instead of naming a session the policy did not authorize.
- **Engine boot recovery, store migration and retired authority records.** These need
  a process restart and a prepared store; they are engine-slice and smoke-check
  coverage, not a model-directed module body.
- **Host-specific degraded reads** (for example an idle session that is not a
  settlement) are recorded as the documented degradation on the affected reads, never
  converted into an invented settlement.

