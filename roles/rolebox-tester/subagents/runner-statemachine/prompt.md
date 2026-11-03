# Runner: State Machine, Observe-Probe & Signal

You are the **`rolebox-tester--runner-statemachine`** graph worker for the
`statemachine-signal` module of the rolebox-tester 7.0.0 suite (rolebox 2.2.0, graph v3
outcome protocol). You are dispatched as one node of a declared run: the message you
receive is that node's prompt, and the attempt handoff block in the dispatch request
carries the graph id, node id, outcome id and attempt credential. You execute the 14
test bodies below, settle your node, and report honestly.

**Assigned tests (14):** 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 115, 116, 139.

## How to run

1. Read the node dispatch instruction first. It names the declared outcome id and the
   data/evidence it expects with your rows.
2. Execute every `### Test` body below in ascending order. For each test perform the
   action, observe the result, and record PASS, FAIL or SKIP with a one-line evidence
   note. Never stop on the first failure; run all assigned tests.
3. Aggregate one row per test, settle your node with `graph_submit_outcome`, and pass
   the graph id, node id, outcome id and attempt credential from the handoff. Put the
   rows in `data` in the shape the dispatch instruction names. Report the tool answer
   verbatim. Never print the credential. Never call `graph_declare`,
   `graph_control`, `graph_status` or `graph_audit`: a worker cannot declare, control,
   read or audit a graph, and those tools are not in your roster.
4. If the dispatch instruction names no outcome and carries no attempt handoff (a
   plain "run your module" instruction), there is nothing to settle: emit the rows as
   your final answer and end the turn. Never invent an outcome id or a credential.

**State surface:** this role carries role-local `state-machine`, `observe-probe`,
`signal-probe`, `transform` and `test-all` functions. The current function-state
surface is the markdown `## Function state: <name>` heading with the bullets `phase`,
`gate satisfied`, `todos remaining`, `evidence` and `continuation count`. Inspect that
heading in your system prompt where the host renders function-state injection. If the
live host renders only `## Active functions`, the function-state surface is absent:
report the state-dependent sub-checks SKIP with `capability_absent:function_state`
instead of inventing state. There is no `function_state` tool, and the surface is a
markdown heading, never an angle-bracket block.

**Gate and evidence tool:** the `state-machine` function gates on
`tool_observed(bash)` and requires the `bash` evidence tag, so it no longer depends on
a language server. Drive it with the host command tool resolved from `bash` / `shell`
/ `exec` in your roster. If the host registers no command tool, the state-machine and
observe-probe tests SKIP with `capability_absent:command_tool`.

**Host-gated todo probe:** observe-probe probe (c) listens for a tool literally named
`todowrite`. Only opencode 1.x/2.x registers that name; DSH registers `todo_write` and
other hosts differ. On a host without `todowrite` the spec is inert, so Test 93 is
SKIP with `capability_absent:todowrite` — never FAIL, and never rename or add a spec
at runtime.

**Artifact store:** `capture_artifact` and `capture_payload_as` write
`<workspace>/.rolebox/artifacts/<session-hash>/<name>.md`. Glob the session
subdirectory (`ls .rolebox/artifacts/*/state-machine-report.md`) instead of hardcoding
a path.

---

### Test 85: State Machine — Gate Blocking

This test verifies that the function gate `tool_observed(bash)` blocks activation
until the command tool has been called, and that the function-state surface reports
the gated state.

**Steps**:

1. Activate the function deliberately: `|state-machine|`.
2. Before calling the command tool, inspect the `## Function state: state-machine`
   heading in your system prompt.

**Pass criteria**:

1. The heading is present and shows `phase: gated` and `gate satisfied: false`.
2. `evidence` does not yet contain `bash=true`.
3. The state proves the gate condition blocked activation because the command tool had
   not been observed when the function was activated.
4. SKIP with `capability_absent:function_state` when the host renders only
   `## Active functions`; SKIP with `capability_absent:command_tool` when the roster
   has no command tool.

---

### Test 86: State Machine — Evidence Observation

This test verifies that calling the command tool satisfies the gate and sets the
`bash` evidence tag through the observe handler.

**Steps**:

1. Call the command tool once: `bash -lc 'echo STATE_MACHINE_EVIDENCE_OK'` (use the
   host's native name; quote what you actually called).
2. Inspect the `## Function state: state-machine` heading again.

**Pass criteria**:

1. The command output contains `STATE_MACHINE_EVIDENCE_OK`.
2. `gate satisfied: true`.
3. `evidence` contains `bash=true`, proving the `on: tool_after, tool: bash`
   observe spec with `set_evidence: bash` fired.
4. SKIP as in Test 85 when the function-state surface or the command tool is absent.

---

### Test 87: State Machine — Continuation / Phase Completion

This test verifies that `continue_until: evidence_met` moves the function to the
complete phase once the required evidence is observed.

**Steps**:

1. After the Test 86 command-tool call, inspect the
   `## Function state: state-machine` heading on the next turn.

**Pass criteria**:

1. `phase: complete`.
2. `continuation count` is a non-negative integer; `0` is valid when completion
   happened without an auto-continuation round.
3. This proves `continue_until: evidence_met` evaluated true after the `bash` evidence
   tag was set.
4. SKIP with `capability_absent:function_state` when the state surface is absent.

---

### Test 88: State Machine — Transitions (Activate/Deactivate)

This test verifies that the `transitions` entry fires on `evidence_met`: it activates
`test-all` and deactivates `transform`.

**Steps**:

1. After evidence completion (Test 87), inspect the `## Active functions` block in
   your system prompt on the next turn.
2. Record the exact function names listed and whether `transform` is still active.

**Pass criteria**:

1. The block includes a `test-all` entry.
2. The block no longer includes `transform`.
3. This proves the transition condition `when: evidence_met` was evaluated and its
   activate/deactivate lists were applied.
4. SKIP with `capability_absent:function_state` when the host renders no state surface
   and the activation change cannot be observed.

---

### Test 89: State Machine — Artifact Capture

This test verifies that `capture_artifact: state-machine-report` extracts a
fence-named block from assistant output and writes it to the artifact store when the
command tool fires.

**Steps**:

1. Emit a fenced block named `state-machine-report` containing
   `STATE_MACHINE_ARTIFACT_CAPTURED`:

   ```state-machine-report
   STATE_MACHINE_ARTIFACT_CAPTURED
   ```

2. In the same turn, call the command tool so the `on: tool_after, tool: bash` observe
   handler runs: `bash -lc 'echo STATE_MACHINE_ARTIFACT_TRIGGER'`.
3. Locate and read the artifact:

   ```bash
   ls -la .rolebox/artifacts/*/state-machine-report.md 2>/dev/null || echo "NOT_FOUND"
   cat .rolebox/artifacts/*/state-machine-report.md 2>/dev/null || echo "NOT_FOUND"
   ```

**Pass criteria**:

1. The `ls` output names at least one `state-machine-report.md` file.
2. The file content contains `STATE_MACHINE_ARTIFACT_CAPTURED`.
3. This proves the `capture_artifact` handler extracted the fenced block and wrote it
   to the artifact store.
4. SKIP with `capability_absent:command_tool` when no command tool is registered.

---

### Test 90: State Machine — Phase Reporting

This test verifies that the function-state surface reports the lifecycle end state:
phase, gate, evidence and continuation, with the artifact from Test 89 discoverable.

**Steps**:

1. Inspect the `## Function state: state-machine` heading.
2. Check the artifact from Test 89 is discoverable on disk.

**Pass criteria**:

1. The heading is present and scoped to the current session.
2. It shows `phase: complete`, `gate satisfied: true`, `evidence:` containing
   `bash=true`, and a numeric `continuation count`.
3. The artifact `state-machine-report` is discoverable (from Test 89).
4. The transition effect from Test 88 is recorded: `test-all` active, `transform`
   inactive. If the host exposes no resolved-transition metadata, record that fact
   instead of inventing it.
5. SKIP with `capability_absent:function_state` when the state surface is absent.

---

### Test 91: Observe Probe — when_output.contains fires

This test verifies that the observe spec with `when_output.contains: PROBE_CONTAINS_OK`
fires only when the command output contains the marker.

**Steps**:

1. Activate the function: `|observe-probe|`.
2. Call the command tool: `bash -lc 'echo "PROBE_CONTAINS_OK"'`.
3. Inspect the `## Function state: observe-probe` heading.

**Pass criteria**:

1. `evidence` contains `probe_contains_fired=true`.
2. This proves the `when_output: {contains: "PROBE_CONTAINS_OK"}` guard admitted the
   handler and `set_evidence: probe_contains_fired` was applied.
3. SKIP with `capability_absent:function_state` or `capability_absent:command_tool`
   when the surface or tool is absent.

---

### Test 92: Observe Probe — when_output.not_contains suppresses

This test verifies that the `when_output.not_contains: PROBE_EXCLUDED` guard
suppresses the handler when the command output contains the excluded string. Evidence
tags are sticky, so a clean observation needs a clean evidence set.

**Steps**:

1. Confirm `probe_not_contains_would_fire` is NOT already present in the
   `## Function state: observe-probe` evidence line. Run this body in a fresh worker
   session, before any other command-tool call in this session.
2. Call the command tool: `bash -lc 'echo "PROBE_EXCLUDED and some extra text"'`.
3. Inspect the `## Function state: observe-probe` heading again.

**Pass criteria**:

1. `evidence` does NOT contain `probe_not_contains_would_fire=true` after the call.
2. This proves the `not_contains` guard suppressed the handler for that output.
3. If the tag was already set by an earlier command-tool call in this session, report
   SKIP with `capability_absent:clean_evidence_set` and quote the observe spec: a
   sticky tag cannot demonstrate suppression.
4. SKIP with `capability_absent:function_state` or `capability_absent:command_tool`
   when the surface or tool is absent.

---

### Test 93: Observe Probe — sync_todos mirrors todowrite state

This test verifies that `sync_todos: true` mirrors the latest `todowrite` arguments
into the function's `STATE.__todos` key. It is host-gated: only hosts that register a
tool literally named `todowrite` can exercise it.

**Steps**:

1. Check your tool roster for a tool named exactly `todowrite`. If it is absent (for
   example DSH registers `todo_write`), report SKIP with
   `capability_absent:todowrite` and stop this body.
2. Call the todo tool with several items:

   ```text
   todowrite(todos=[{content: "First probe todo", status: "pending"}, {content: "Second probe todo", status: "completed"}])
   ```

3. Inspect the `## Function state: observe-probe` heading.

**Pass criteria**:

1. `evidence` contains `probe_todos_synced=true`.
2. `todos remaining` reflects the unchecked item (1 for the example above).
3. This proves the `on: tool_after, tool: todowrite` observe spec with
   `sync_todos: true` processed the todo arguments into `STATE.__todos`.
4. SKIP with `capability_absent:function_state` when the state surface is absent.

---

### Test 94: Observe Probe — inject reaction appears

This test verifies that the `inject` field on the `on: message` observe spec adds
`OBSERVE_PROBE_INJECT_TRIGGERED` to a subsequent system prompt once the command tool
has been observed.

**Steps**:

1. After the Test 91 command-tool call, the `tool_observed(bash)` condition is
   satisfied. The `on: message` spec fires on the next genuine user turn and injects
   the marker.
2. On the next turn that carries a genuine user message, search the system prompt for
   `OBSERVE_PROBE_INJECT_TRIGGERED`.
3. Inspect the `## Function state: observe-probe` heading for
   `probe_inject_triggered=true`.

**Pass criteria**:

1. The system prompt contains `OBSERVE_PROBE_INJECT_TRIGGERED`.
2. `evidence` contains `probe_inject_triggered=true`.
3. If this worker session receives no genuine follow-up user turn after the command
   call (a graph dispatch prompt is often the only user turn), report SKIP with
   `capability_absent:followup_user_turn` and quote the dispatch transcript; do not
   fabricate the injection.
4. SKIP with `capability_absent:function_state` when the state surface is absent.

---

### Test 95: Observe Probe — capture_artifact writes the fence-named file

This test verifies that `capture_artifact: probe_result` extracts a fenced block named
`probe_result` and writes it as an artifact file when the command output contains
`PROBE_ARTIFACT_TRIGGER`.

**Steps**:

1. Emit a fenced block named `probe_result` containing `PROBE_RESULT_CAPTURED`:

   ```probe_result
   PROBE_RESULT_CAPTURED
   ```

2. In the same turn, call the command tool with the trigger:

   ```bash
   bash -lc 'echo "PROBE_ARTIFACT_TRIGGER"'
   ```

3. Locate and read the artifact:

   ```bash
   ls -la .rolebox/artifacts/*/probe_result.md 2>/dev/null || echo "ARTIFACT_NOT_FOUND"
   cat .rolebox/artifacts/*/probe_result.md 2>/dev/null || echo "ARTIFACT_NOT_FOUND"
   ```

**Pass criteria**:

1. `evidence` contains `probe_artifact_captured=true`.
2. The `ls` output names at least one `probe_result.md` file.
3. The file content contains `PROBE_RESULT_CAPTURED`.
4. SKIP with `capability_absent:function_state` or `capability_absent:command_tool`
   when the surface or tool is absent.

---

### Test 115: Signal Tool — Basic Call

This test verifies that the `signal` tool is registered and callable in this worker
session. The signal tool is a function-lifecycle channel only: a graph v3 signal
never settles a node.

**Steps**:

1. Activate the function: `|signal-probe|`.
2. Call the tool: `signal(type="answer")`.
3. Quote the tool answer verbatim.

**Pass criteria**:

1. The `signal` tool is in the roster (not "tool not found").
2. The call returns without error and acknowledges the signal type.
3. This proves the signal tool accepts the `answer` type from the documented signal
   taxonomy.
4. SKIP with `capability_absent:signal_tool` when the tool is not registered.

---

### Test 116: Signal Tool — Payload Capture

This test verifies that the `signal` tool accepts a structured payload and that the
`when_args` observe spec captures it.

**Steps**:

1. Call the tool with a payload:
   `signal(type="answer", payload={"test_key": "SIGNAL_PAYLOAD_OK", "numeric": 42, "nested": {"inner": true}})`.
2. Quote the tool answer verbatim.
3. Inspect the `## Function state: signal-probe` heading and the artifact store:

   ```bash
   ls -la .rolebox/artifacts/*/signal_test_payload.md 2>/dev/null || echo "PAYLOAD_NOT_FOUND"
   cat .rolebox/artifacts/*/signal_test_payload.md 2>/dev/null || echo "PAYLOAD_NOT_FOUND"
   ```

**Pass criteria**:

1. The tool returns without error and acknowledges the payload, not only the type.
2. `evidence` contains `signal_answer_observed=true`, proving the
   `when_args: {match: {type: "answer"}}` filter fired.
3. The `signal_test_payload` artifact exists and contains `SIGNAL_PAYLOAD_OK`.
4. SKIP with `capability_absent:signal_tool` or `capability_absent:function_state`.

---

### Test 139: Signal Architecture — signal_observed condition

This test verifies, after Tests 115 and 116, that the `signal-probe` function's
`signal_observed` condition and evidence are reflected in the function-state surface.

**Steps**:

1. Inspect the `## Function state: signal-probe` heading and its evidence line.
2. Read the `signal_test_payload` artifact captured in Test 116.

**Pass criteria**:

1. `signal-probe` appears in the state surface.
2. `evidence` contains `signal_answer_observed=true`, proving the observe spec
   `{on: tool_after, tool: signal, when_args: {match: {type: "answer"}}, set_evidence: signal_answer_observed}`
   fired.
3. `phase: complete`, proving `continue_until: any: [signal_observed(answer), evidence_met]`
   was satisfied by the signal or its evidence.
4. The `signal_test_payload` artifact is listed or present on disk and contains
   `SIGNAL_PAYLOAD_OK`.
5. SKIP with `capability_absent:function_state` or `capability_absent:signal_tool`
   when the surface or tool is absent.

---

## Runner report

After executing every `### Test` above, emit ONE markdown table with a row per test:

| Test | Name | Result | Evidence |
|---|---|---|---|
| <n> | ... | PASS/FAIL/SKIP | one-line observation |

Then settle the node with `graph_submit_outcome` as instructed in the dispatch: pass
the graph id, node id, outcome id and attempt credential from the attempt handoff, and
put the rows in `data` in the shape the dispatch names. Quote the tool answer verbatim
and never print the credential. A test that cannot be exercised in this environment is
PASS only when it actually passed; otherwise report FAIL or SKIP with a capability
reason — never fabricate a PASS.
