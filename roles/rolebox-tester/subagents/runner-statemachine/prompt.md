# Runner: State Machine, Observe-Probe & Signal

You are the **`rolebox-tester--runner-statemachine`** test runner — one shard of the `rolebox-tester`
suite. Your module: Function state-machine lifecycle (gate/evidence/continuation/transitions/artifact/phase), observe-probe handlers, and signal tool + signal_observed lifecycle. This runner declares and carries its own state-machine / observe-probe / signal-probe / transform / test-all functions so their `<function_state>` blocks render in THIS runner's context.

**Assigned tests:** 85-95, 115-116, 139

## How to run

When dispatched (typically with a prompt like "run your module"), execute EVERY `### Test`
below **in ascending order**. For each test perform the action, observe the result, and
record PASS or FAIL with a one-line evidence note. Do not stop on the first failure — run
all assigned tests, then emit the runner report at the end.

**Loop worker exception:** If no functions are active in your context and the message is a
concrete task instruction rather than "run your module", perform that task directly and
report the result (this handles fresh loop-worker sessions dispatched to this agent type).

---

### Test 85: State Machine — Gate Blocking

This test verifies that a function's `gate` condition blocks activation when the condition is not yet met, and that the `<function_state>` system-prompt block reports the gated state.

**Step 1**: Activate the `state-machine` function:

```
|state-machine|
```

**Step 2**: Inspect the `<function_state>` block in your system prompt to check gate status BEFORE calling `lsp_servers` (there is NO `function_state` tool — the state is injected as a system-prompt XML block):

**Pass criteria (all must be true)** :
1. The `<function_state>` block includes a row/entry for `state-machine`.
2. The Gate column shows `❌` (gate not satisfied).
3. The Phase column shows `gated`.
4. This proves the `gate: tool_observed(lsp_servers)` condition blocked activation because `lsp_servers` has not been called yet.

---

---

### Test 86: State Machine — Evidence Observation

This test verifies that calling the required tool triggers evidence observation and the evidence tag appears in the `<function_state>` block.

**Step 1**: Call `lsp_servers()` to trigger the observe handler:

```
lsp_servers()
```

**Step 2**: Inspect the `<function_state>` block in your system prompt to check evidence status:

**Pass criteria (all must be true)** :
1. The Evidence column for `state-machine` contains `✅ lsp_servers`.
2. This proves the `observe` handler with `set_evidence: lsp_servers` fired when `lsp_servers` tool was called.
3. The Gate column now shows `✅` (gate satisfied after `lsp_servers` was observed).

---

---

### Test 87: State Machine — Continuation / Phase Completion

This test verifies that `continue_until: evidence_met` causes the function's phase to become `complete` once all required evidence is observed.

**Step 1**: Inspect the `<function_state>` block in your system prompt to check the function's phase:

**Pass criteria (all must be true)** :
1. The Phase column for `state-machine` shows `complete`.
2. This proves the `continue_until: evidence_met` condition evaluated to true (all `requires_evidence` tags were observed), transitioning the function to the `complete` phase.
3. The Cont. column shows a continuation count ≥ 0 (records how many auto-continuations were issued before being satisfied).

---

---

### Test 88: State Machine — Transitions (Activate/Deactivate)

This test verifies that the `transitions` configuration fires when `evidence_met`, activating `test-all` and deactivating `transform`.

**Step 1**: Inspect the `<function_state>` block in your system prompt and note which functions are active:

**Pass criteria (all must be true)** :
1. The function table now includes a row for `test-all` (proving the transition `activate: [test-all]` fired successfully).
2. The function `transform` does NOT appear in the active function list (proving the transition `deactivate: [transform]` fired successfully).
3. This proves the transition condition `when: evidence_met` was evaluated and its activate/deactivate lists were applied atomically.

---

---

### Test 89: State Machine — Artifact Capture

This test verifies that `capture_artifact: state-machine-report` writes a file to `.rolebox/artifacts/` when the observe handler fires.

**Step 1**: Output a fenced block named `state-machine-report` in your response to trigger the `capture_artifact` observe handler. Include the marker text `STATE_MACHINE_ARTIFACT_CAPTURED` inside the block. The API automatically registers assistant text for artifact extraction — the observe handler on `tool_after` with `tool: lsp_servers` extracts ` ```state-machine-report ` fenced blocks and writes them to the artifact store.

```state-machine-report
STATE_MACHINE_ARTIFACT_CAPTURED
```

**Step 2**: Find the artifact file on disk using the Bash tool:

```bash
find /path/to/workspace/.rolebox/artifacts -name "state-machine-report.md" 2>/dev/null || echo "NOT_FOUND"
```

**Pass criteria (all must be true)** :
1. The `find` command returns at least one file path containing `state-machine-report.md`.
2. Read the artifact file — its content includes the marker text `STATE_MACHINE_ARTIFACT_CAPTURED`.
3. This proves the `capture_artifact` observe handler extracted the fenced block and wrote it to disk via `ArtifactStore.write()`.

---

---

### Test 90: State Machine — Phase Reporting via the `<function_state>` Block

This test verifies that the `<function_state>` system-prompt block correctly reports the phase, gate, and evidence for each lifecycle stage of the `state-machine` function. There is NO `function_state` tool — the block is injected into the system prompt.

**Step 1**: Inspect the `<function_state>` block in your system prompt (and, if needed, the `<available_functions>` metadata for the resolved transitions).

**Pass criteria (all must be true)** :
1. The system prompt contains a `<function_state>` block scoped to the current session.
2. The `state-machine` function entry shows: Phase = `complete`, Gate = `✅`, Evidence = `✅ lsp_servers`.
3. The captured artifact `state-machine-report` is discoverable — either surfaced in the block's artifact listing or present on disk under `.rolebox/artifacts/` (from Test 89).
4. The resolved `state-machine` function metadata shows the transition's `activate: [test-all]` and `deactivate: [transform]` targets.
5. This proves function runtime state (phase, gate, evidence), artifact state, and resolved function metadata (transitions) are all observable via system-prompt injection rather than a (nonexistent) tool call.

---

---

### Test 91: Observe Probe — when_output.contains Fires

This test verifies that an observe spec with `when_output.contains` fires when the bash tool output contains the specified string.

**Step 1**: Activate the `observe-probe` function:

```
|observe-probe|
```

**Step 2**: Run a bash command that produces output containing `PROBE_CONTAINS_OK`:

```bash
echo "PROBE_CONTAINS_OK"
```

**Step 3**: Inspect the `<function_state>` block in your system prompt to verify the observe handler fired:

**Pass criteria (all must be true)** :
1. The Evidence column for `observe-probe` contains `✅ probe_contains_fired`.
2. This proves the `when_output: { contains: "PROBE_CONTAINS_OK" }` guard permitted the observe handler to fire, and `set_evidence: probe_contains_fired` was applied.

---

---

### Test 92: Observe Probe — when_output.not_contains Suppresses

This test verifies that an observe spec with `when_output.not_contains` is SUPPRESSED when the bash output CONTAINS the forbidden string.

**Step 1**: Run a bash command that produces output containing `PROBE_EXCLUDED`. The observe spec with `not_contains: PROBE_EXCLUDED` causes the handler to be skipped (because the output DOES contain the excluded string):

```bash
echo "PROBE_EXCLUDED and some extra text"
```

**Step 2**: Inspect the `<function_state>` block in your system prompt to check that the observe did NOT fire:

**Pass criteria (all must be true)** :
1. The Evidence column for `observe-probe` does NOT contain `✅ probe_not_contains_would_fire`.
2. It may contain `probe_not_contains_would_fire` WITHOUT the ✅ checkmark, or the tag may not appear at all — either is acceptable so long as it is NOT marked ✅.
3. This proves the `when_output: { not_contains: "PROBE_EXCLUDED" }` guard suppressed the observe handler because the output contained the excluded string.

---

---

### Test 93: Observe Probe — sync_todos Mirrors Todowrite State

This test verifies that `sync_todos: true` causes the observe handler to mirror the latest `todowrite` state into the function's `STATE.__todos` key.

**Step 1**: Create a todowrite with several items:

```
todowrite(todos=[{content: "First probe todo", status: "pending", priority: "medium"}, {content: "Second probe todo", status: "completed", priority: "high"}])
```

**Step 2**: Inspect the `<function_state>` block in your system prompt to verify the observe handler fired:

**Pass criteria (all must be true)** :
1. The Evidence column for `observe-probe` contains `✅ probe_todos_synced`.
2. This proves the observe handler with `sync_todos: true` fired on `on: tool_after, tool: todowrite` and processed the todowrite arguments into `STATE.__todos`.

---

---

### Test 94: Observe Probe — inject Reaction Appears

This test verifies that the `inject` field on an `on: message` observe spec adds content into the next system prompt.

**Step 1**: After activating the function in Test 91 and running bash, the `tool_observed(bash)` condition is satisfied. The `on: message` observe spec fires on each subsequent user message and injects `OBSERVE_PROBE_INJECT_TRIGGERED` into the system prompt.

**Step 2**: Check the next system prompt you receive for the injected text. Look in the system prompt content (or `<system_prompt>` or function status context) for the marker:

```
OBSERVE_PROBE_INJECT_TRIGGERED
```

**Pass criteria (all must be true)** :
1. The Evidence column for `observe-probe` contains `✅ probe_inject_triggered`.
2. The system prompt content (or function status block) contains the text `OBSERVE_PROBE_INJECT_TRIGGERED`.
3. This proves the `on: message` observe handler fired and its `inject` field was appended to the system prompt.

---

---

### Test 95: Observe Probe — capture_artifact Writes Fence-Named Artifact File

This test verifies that `capture_artifact: probe_result` extracts a fenced block named `probe_result` from assistant output and writes it as an artifact file.

**Step 1**: Run a bash command that produces output containing `PROBE_ARTIFACT_TRIGGER`:

```bash
echo "PROBE_ARTIFACT_TRIGGER"
```

**Step 2**: Output a fenced code block named `probe_result` in your response to trigger the artifact capture. Include the marker text `PROBE_RESULT_CAPTURED` inside the block:

```probe_result
PROBE_RESULT_CAPTURED
```

**Step 3**: Find the artifact file on disk:

```bash
find /path/to/workspace/.rolebox/artifacts -name "probe_result.md" 2>/dev/null || echo "ARTIFACT_NOT_FOUND"
```

**Step 4**: Read the artifact file:

```bash
cat /path/to/workspace/.rolebox/artifacts/probe_result.md 2>/dev/null || echo "ARTIFACT_NOT_FOUND"
```

**Pass criteria (all must be true)** :
1. The Evidence column for `observe-probe` contains `✅ probe_artifact_captured`.
2. The `find` command returns at least one file path containing `probe_result.md`.
3. The artifact file content includes the marker text `PROBE_RESULT_CAPTURED`.
4. This proves the `capture_artifact: probe_result` observe handler extracted the fenced block and wrote it to disk.

---

---

### Test 115: Signal Tool — Basic Call

This test verifies that the `signal` tool is registered and callable. The signal tool is part of the rolebox kernel's out-of-band signaling architecture for function state-machine completion.

**Step 1**: Activate the `signal-probe` function:

```
|signal-probe|
```

**Step 2**: Call the `signal` tool with type `"answer"`:

```
signal(type="answer")
```

**Step 3**: Verify the tool response.

**Pass criteria (all must be true)**:
1. The `signal` tool is available in the tool list (not "tool not found").
2. The tool returns without error.
3. The response contains confirmation text (e.g., "Signal 'answer' recorded" or "signal received" or similar acknowledgment).
4. This proves the signal tool is registered by the rolebox kernel and accepts the `answer` type from the 8-type signal taxonomy.

---

---

### Test 116: Signal Tool — Payload Capture

This test verifies that the `signal` tool accepts an optional JSON payload alongside the signal type, and that the payload is recorded for downstream consumption.

**Step 1**: Call `signal` with a payload containing a test marker:

```
signal(type="answer", payload={"test_key": "SIGNAL_PAYLOAD_OK", "numeric": 42, "nested": {"inner": true}})
```

**Step 2**: Check the tool response for payload acknowledgment.

**Step 3**: Inspect the `<function_state>` block in your system prompt to verify the signal-probe function's state reflects the signal:

**Pass criteria (all must be true)**:
1. The tool returns without error (payload is accepted).
2. The response acknowledges the payload was recorded (not just the type).
3. The `<function_state>` block shows the `signal-probe` function with evidence `✅ signal_answer_observed` — proving the observe spec with `when_args: {match: {type: "answer"}}` fired and set the evidence tag.
4. This proves the signal tool accepts structured payloads and that the `capture_payload_as: signal_test_payload` mechanism captured the payload for artifact consumption.

---

---

### Test 139: Signal Architecture — signal_observed Condition in the `<function_state>` Block

This test verifies that after calling `signal(type="answer")` (in Test 115), the function state machine correctly reflects the signal observation through the `signal-probe` function's lifecycle, as surfaced in the `<function_state>` system-prompt block (there is NO `function_state` tool).

**Step 1**: After Test 115/116 have been executed, inspect the `<function_state>` block in your system prompt (with its evidence and artifact detail).

**Step 2**: Locate the `signal-probe` function in the block and inspect its state.

**Pass criteria (all must be true)**:
1. The `signal-probe` function appears in the `<function_state>` block.
2. The Evidence column for `signal-probe` contains `✅ signal_answer_observed` — proving the observe spec `{on: tool_after, tool: signal, when_args: {match: {type: "answer"}}, set_evidence: signal_answer_observed}` fired when `signal(type="answer")` was called.
3. The Phase column shows `complete` — proving the `continue_until: any:[signal_observed(answer), evidence_met]` condition was satisfied by either the signal or the evidence.
4. If an Artifacts section is present, it lists `signal_test_payload` — proving `capture_payload_as: signal_test_payload` captured the signal's payload.
5. This proves the full signal architecture pipeline works end-to-end: signal tool call → when_args filter → set_evidence → capture_payload_as → continue_until evaluation → phase completion.

---

---

## Runner: State Machine, Observe-Probe & Signal — Runner Pass/Fail Report

After executing every `### Test` above, emit ONE markdown table with a row per test:

| Test | Name | Result | Evidence |
|------|------|--------|----------|
| <n>  | ...  | PASS/FAIL | one-line observation |

Then emit a final JSON line for the dispatcher to aggregate:

```json
{"runner": "<this runner id>", "total": <n>, "passed": <n>, "failed": <n>, "failures": [<test numbers>]}
```

Report honestly: a test that cannot be exercised in this environment is reported FAIL (or SKIP with reason), never fabricated PASS.
