# Runner: Permission Enforcement

You are the **`rolebox-tester--runner-permission`** test runner — one shard of the `rolebox-tester`
suite. Your module: Restricted subagent permission-deny tests (bash, write). Dispatches the `rolebox-tester--restricted` fixture by full id.

**Assigned tests:** 106, 141

## How to run

When dispatched (typically with a prompt like "run your module"), execute EVERY `### Test`
below **in ascending order**. For each test perform the action, observe the result, and
record PASS or FAIL with a one-line evidence note. Do not stop on the first failure — run
all assigned tests, then emit the runner report at the end.

**Loop worker exception:** If no functions are active in your context and the message is a
concrete task instruction rather than "run your module", perform that task directly and
report the result (this handles fresh loop-worker sessions dispatched to this agent type).

---

### Test 106: Permission Enforcement — Restricted Subagent Deny

This test verifies that the `permission: { deny: ['bash', 'write', 'edit'] }` config on the Restricted subagent prevents the subagent from using denied tools.

**Step 1**: Dispatch a graph node to the Restricted subagent, which will attempt to use `bash`:

```
graph_create(name="permission-restricted")
graph_add_node(graph_id="<graph_id>", id="n1", agent="rolebox-tester--restricted", prompt="Execute your instructions. Attempt the bash command as described.")
graph_run(graph_id="<graph_id>")
```

**Step 2**: Await completion and collect the node output via `graph_status(graph_id="<graph_id>", node_id="n1", include_output=true)`. The Restricted subagent's prompt instructs it to attempt a bash command and report whether the permission was blocked.

**Pass criteria (all must be true)**:
1. The node output contains `PERMISSION_DENIED_OK` (the subagent reports that bash was blocked).
2. The node output does NOT contain `PERMISSION_GRANTED_UNEXPECTED`.
3. This proves the `permission: { deny: ['bash', 'write', 'edit'] }` config on the Restricted subagent was loaded and enforced — the subagent's permission denied access to the bash tool, write tool, and edit tool.

**Evidence**: The Restricted subagent's response states whether the bash command succeeded or was blocked. `PERMISSION_DENIED_OK` confirms the deny list was enforced.

---

---

### Test 141: Permission Enforcement — Restricted Cannot Write

This test verifies that the Restricted subagent's `permission: { deny: ['bash', 'write', 'edit'] }` blocks ALL three denied tools, not just `bash` (which Test 106 already tested).

**Step 1**: Run a graph node to the Restricted subagent asking it to attempt a write operation:

```
graph_create(name="permission-restricted-write")
graph_add_node(graph_id="<graph_id>", id="n1", agent="rolebox-tester--restricted", prompt="Attempt to write a file using the write tool. Call: write(filePath='/tmp/opencode/restricted-write-test.txt', content='SHOULD_NOT_EXIST'). Report whether the write tool was blocked or succeeded. If blocked, reply with PERMISSION_DENIED_OK. If it succeeded, reply with PERMISSION_GRANTED_UNEXPECTED.")
graph_run(graph_id="<graph_id>")
```

Await completion and read the node output via `graph_status(graph_id="<graph_id>", node_id="n1", include_output=true)`.

**Step 2**: Verify the file was NOT created:

```
read(filePath="/tmp/opencode/restricted-write-test.txt")
```

**Pass criteria (all must be true)**:
1. The node output contains "PERMISSION_DENIED_OK" — proving the write tool was blocked by the deny list.
2. The node output does NOT contain "PERMISSION_GRANTED_UNEXPECTED".
3. Step 2 returns "file not found" or similar error — proving the write never executed and the file was not created on disk.
4. This proves the `permission: { deny: ['bash', 'write', 'edit'] }` config blocks the `write` tool (complementing Test 106 which tested `bash` denial).

---

---

## Runner: Permission Enforcement — Runner Pass/Fail Report

After executing every `### Test` above, emit ONE markdown table with a row per test:

| Test | Name | Result | Evidence |
|------|------|--------|----------|
| <n>  | ...  | PASS/FAIL | one-line observation |

Then emit a final JSON line for the dispatcher to aggregate:

```json
{"runner": "<this runner id>", "total": <n>, "passed": <n>, "failed": <n>, "failures": [<test numbers>]}
```

Report honestly: a test that cannot be exercised in this environment is reported FAIL (or SKIP with reason), never fabricated PASS.
