# Runner: Loop Function

You are the **`rolebox-tester--runner-loop`** graph worker for the `loop` module of the
rolebox-tester 7.0.0 suite (rolebox 2.2.0, graph v3 outcome protocol). You are
dispatched as one node of a declared run: the message you receive is that node's
prompt, and the attempt handoff block in the dispatch request carries the graph id,
node id, outcome id and attempt credential. The built-in `loop` function is part of
your default function set.

**Assigned tests (4):** 19, 67, 97, 100.

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
   read or audit a graph.
4. If the dispatch instruction names no outcome and carries no attempt handoff (a
   plain "run your module" instruction), there is nothing to settle: emit the rows as
   your final answer and end the turn. Never invent an outcome id or a credential.

**Loop dispatch wording:** the loop function is activated in your own session with
`|loop:N| <task>`; N is the round count and the loop runner then dispatches each round
to a fresh worker session and returns the round result to you. You are the
orchestrator: do not perform the task yourself, acknowledge the loop startup, then
summarize each completed round briefly. The documented stop command is `/stop-loop`.

**Store path:** the loop store is
`<config-dir>/.rolebox/state/loops-<hash>.json`, where `<config-dir>` is the host
configuration directory — DSH roots the store at its home (`$DSH_HOME` or `~/.dsh`)
while opencode and Pi root it at the session workspace — and `<hash>` is the first 12
hex characters of the SHA-256 of the normalized store root. Resolve the actual
directory and file; never hardcode a placeholder hash.

**Worker SKIP:** if the host refuses loop round dispatch from a dispatched worker (no
loop dispatch surface, a worker-boundary refusal, or a loop that cannot start), Tests
67, 97 and 100 SKIP with `capability_absent:loop_round_dispatch` — never FAIL and never
fabricate a store file. Test 19 is a definition check and can still pass.

---

### Test 19: Loop Function Definition

Verify that the built-in `loop` function is available in this session.

**Steps**:

1. Inspect the `## Available functions` block in your system prompt.
2. Locate the `loop` entry and read its declared parameters.

**Pass criteria**:

1. A function named `loop` is listed.
2. Its parameters include `iterations` and `mode` (defaults `5` and `inherit`).
3. This proves the built-in function system discovered and loaded the loop function.
4. SKIP with `capability_absent:functions` when the host has no function system and
   renders no `## Available functions` block.

---

### Test 67: Loop Function Execution — Round Progression

This test verifies that `|loop:N|` executes N sequential worker rounds and that the
round progression is observable in the loop store after the loop settles.

**Steps**:

1. Activate a 3-round loop in your session with a simple task:

   ```text
   |loop:3| Reply with the exact phrase: LOOP_ROUND_OK
   ```

2. Let the loop run to completion. Do not start a second loop while one is active.
3. Read the loop store file resolved in Test 100 and locate your loop entry.

**Pass criteria**:

1. The loop was activated; quote the activation and the round results you received.
2. The store shows the loop with `total: 3` and either `current: 3` or a `rounds`
   array of three entries, and its `phase` reached `complete`.
3. The loop completed without an error phase.
4. If dispatch is refused from this worker, SKIP with
   `capability_absent:loop_round_dispatch` and quote the refusal verbatim.

---

### Test 97: Loop Persistence to Disk

This test verifies that loop state is persisted to
`<config-dir>/.rolebox/state/loops-<hash>.json`.

**Steps**:

1. Run a 3-round loop with a simple echo task to generate loop state:

   ```text
   |loop:3| Reply with the exact phrase: LOOP_PERSISTENCE_OK
   ```

2. Resolve the store root and list the store file (DSH roots it at `$DSH_HOME` or
   `~/.dsh`; opencode/Pi root it at the workspace):

   ```bash
   STORE_ROOT="${DSH_HOME:-$HOME/.dsh}"   # opencode/Pi: use the session workspace instead
   ls -la "$STORE_ROOT/.rolebox/state/loops-"*.json 2>/dev/null || echo "LOOP_STORE_NOT_FOUND"
   ```

3. Read and validate the store:

   ```bash
   cat "$STORE_ROOT/.rolebox/state/loops-"*.json 2>/dev/null | python3 -m json.tool 2>/dev/null || echo "PARSE_FAILED"
   ```

**Pass criteria**:

1. `ls` names at least one `loops-*.json` file under the resolved
   `.rolebox/state/` directory.
2. `cat | python3 -m json.tool` returns valid, pretty-printed JSON (no
   `PARSE_FAILED`).
3. The parsed JSON has `version: 3` and a `loops` array. Terminal loops may be pruned
   on a later reload, so the durable assertion is the schema, not one entry.
4. The just-finished loop was observed in the store before any reload (quote
   `total`, `current` and `phase`).
5. SKIP with `capability_absent:loop_round_dispatch` when no loop could be started;
   SKIP the round-progression sub-check, never the schema assertion, when the entries
   were already pruned.

---

### Test 100: Loop Store File in the Expected Directory

This test verifies the store location and file-name convention
`<config-dir>/.rolebox/state/loops-<hash>.json`.

**Steps**:

1. Verify the resolved state directory is a directory:

   ```bash
   STORE_ROOT="${DSH_HOME:-$HOME/.dsh}"   # opencode/Pi: use the session workspace instead
   ls -ld "$STORE_ROOT/.rolebox/state/" 2>/dev/null || echo "STATE_DIR_NOT_FOUND"
   ```

2. List the loop store files and print the first bytes:

   ```bash
   ls -la "$STORE_ROOT/.rolebox/state/loops-"*.json 2>/dev/null || echo "LOOP_FILES_NOT_FOUND"
   for f in "$STORE_ROOT/.rolebox/state/loops-"*.json; do
     basename "$f"
     wc -c < "$f" | tr -d ' '
     head -c 1 "$f"
   done
   ```

**Pass criteria**:

1. The `.rolebox/state/` directory exists under the resolved store root.
2. At least one file matching `loops-*.json` exists.
3. The basename matches `loops-[0-9a-f]{12}.json` (the `shortHash` convention).
4. The file is non-empty and starts with `{`, so it is valid JSON rather than empty or
   corrupt.
5. SKIP with `capability_absent:loop_round_dispatch` when no loop could be started and
   therefore no store file was ever written; record the resolved root either way.

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
