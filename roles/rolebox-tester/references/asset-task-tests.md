---
description: Asset and task module bodies for rolebox-tester 7.0.0 — asset search/inspect/validate, skill composition, function graph, reference search, context assembly, hot reload, the broken-dependency probe, and the legacy task query surface.
---

# Asset and task module bodies — rolebox-tester 7.0.0

This document owns the `### Test <id>` bodies for **two** catalog modules of the
rolebox-tester 7.0.0 suite:

- **asset** — 17 tests: `76, 77, 78, 79, 80, 81, 82, 83, 84, 84a, 117, 118, 131,
  133, 134, 135, 182`.
- **task** — 7 tests: `69, 70, 71, 74, 75, 130, 142`.

Twenty-four bodies in total. Every body is executed by the **declaring primary**
(catalog `executor: primary`); none of them is a runner module, so no body here is
dispatched to a graph worker. The machine-readable catalog in
[`test-catalog.md`](test-catalog.md) is the single source of truth for the id sets,
the executor lane and the host gate;
[`host-capability-matrix.md`](host-capability-matrix.md) defines the capability
probe, tool-name resolution, the SKIP-versus-FAIL contract and the report
vocabulary used throughout. The union of the two id sets is exactly the 24 ids
above; no other `### Test` heading belongs in this file.

The target is **rolebox 2.2.0**. Contract sources for the assertions below, from
the read-only reference checkout, are:

- `src/asset/asset-search.ts` — caller-visible role tree, keyword AND matching,
  `type` normalization to `all` (`.catch("all")` plus the execute guard), `role_id`
  and `limit` filters, `markdown`/`json` output;
- `src/asset/asset-inspect.ts` — exact-name lookup in the caller's visible tree and
  the skill/function/reference renderers, including `### Requires` and the
  `Asset not found` refusal;
- `src/asset/asset-validate.ts` and `src/asset/issue-renderer.ts` — the three
  categories (missing dependency, broken reference path, unknown transition
  condition), severity ordering, and the `role_id` filter within the caller's
  visible tree;
- `src/asset/skill-compose.ts` — found skills, deduplicated references, conflicts,
  missing skills and the summary line;
- `src/asset/hot-reload.ts` and `src/core/services/hot-reload-service.ts` — the
  no-argument one-shot rescan, `completed`/`skipped`/`disabled`/`failed` statuses,
  the `Discovered`/`Resolved`/`Skipped` counts, and the full-reload scan of the
  host rolebox directory;
- `src/utils/reference-search.ts` — caller-visible references, `context_lines`,
  `limit`, `role_id` and `format`;
- `src/function/function-graph.ts` — the dependencies and state-machine renderers;
  edges are plain text arrows and a missing dependency is **not** marked with a
  special glyph;
- `src/dispatch/query/context-assemble.ts` — per-source sections, the token budget
  split and the `_(truncated to fit token budget)_` marker;
- `src/dispatch/query/task-tools.ts` — the legacy `task_*` thin adapters over the
  dispatch manager, the budget table, the task tree, the chronology table and the
  workspace-relative export;
- `src/core/services/tool-service.ts` and `src/entries/pi.ts` — the opencode/Pi
  task tool registration that destructures `task_retry` out of the registered map;
- `src/entries/dsh.ts`, `src/entries/codex.ts` and `src/platform/tool-assembly.ts`
  — the DSH and Codex surfaces that register no `task_*` and no asset extras;
- `docs/compatibility.md`, `docs/limitations.md`, `docs/directory-structure.md`
  and the 2.2.0 entry in `CHANGELOG.md` (caller-identity scoping of the shared
  tools) and the earlier `asset_search` type-normalization entry.

The live probe wins. Re-read the installed 2.2.0 source when a probe disagrees with
these notes; record the divergence in the run summary instead of silently changing
the assertion.

## Module map

| Module | Ids | Count | Executor | Host gate | Catalog body |
|---|---|---|---|---|---|
| task | 69, 70, 71, 74, 75, 130, 142 | 7 | primary | `task_search/task_budget/task_graph/task_chronology/task_export` registered; opencode 1.x/2.x and Pi only; `task_retry` withheld | `references/asset-task-tests.md` |
| asset | 76, 77, 78, 79, 80, 81, 82, 83, 84, 84a, 117, 118, 131, 133, 134, 135, 182 | 17 | primary | asset core tools on every host; `function_graph`/`skill_compose`/`context_assemble` on opencode 1.x/2.x and Pi only; asset_hot_reload on opencode only | `references/asset-task-tests.md` |

## Attribution and visibility

The shared asset and reference tools resolve against the **caller's visible role
tree** (`visibleRolesForAgent`), not a global inventory:

- When the live session has a resolvable role identity (opencode 1.x/2.x, Pi and
  DSH primary sessions), the visible tree is `rolebox-tester` and its own
  sub-agents. Asset rows carry the role id `rolebox-tester` for role-level assets
  and `rolebox-tester/<subagent>` for sub-agent assets; another top-level role's
  assets are private and are not returned.
- When the transport carries no role identity (Codex MCP `context.agent` is the
  empty string), the tools fall back to the documented **administrative roster**:
  every top-level role's role-level assets, with private sub-agent assets stripped.
  Codex therefore returns an inventory view, never another role's private children.

The capability probe records which scope applied (attributed tree or administrative
roster) in the run's capability record. The bodies below adapt their scope
assertions to it and never report the documented administrative fallback as a
failure. Every body still names the exact scope it observed in `evidence`.

## Shared execution rules

1. **Probe first.** Run the capability probe from
   [`host-capability-matrix.md`](host-capability-matrix.md) before the first body.
   Record the host id and version, the rolebox version, the workspace, the executor
   lane, the attribution scope above and the exact registered names for the asset,
   reference, task, command, file and memory families. A name printed in this
   document, in `role.yaml` or in the catalog is not a capability signal.
2. **Resolve native names.** The canonical rolebox names are `asset_search`,
   `asset_inspect`, `asset_validate`, `skill_compose`, `function_graph`,
   `reference_search`, `context_assemble`, `asset_hot_reload`, `task_search`,
   `task_budget`, `task_graph`, `task_chronology` and `task_export`. Command and
   file access uses the host's resolved native tools (`bash`/`shell`/`exec`,
   `read`, `write`, `edit`), recorded by the probe; never simulate a missing
   rolebox tool with a shell command.
3. **Gate per test, not per host name.** A missing capability family is a **SKIP**
   with one stable reason code; a present family that contradicts its documented
   behavior is a **FAIL** with an `error_detail` naming expected and observed
   behavior:

   | Condition | Result | Reason code |
   |---|---|---|
   | Core asset tools (`asset_search`, `asset_inspect`, `asset_validate`, `reference_search`) absent | SKIP | `capability_absent:asset_core` |
   | `function_graph`, `skill_compose` or `context_assemble` absent | SKIP | `capability_absent:asset_extras` |
   | `asset_hot_reload` absent (Pi, DSH, Codex) | SKIP | `capability_absent:asset_hot_reload` |
   | Reload disabled by `ROLEBOX_HOT_RELOAD=false`/`0`, or another reload holds the single-flight guard | SKIP | `hot_reload_disabled` / `hot_reload_busy` |
   | The host rolebox directory is not writable, so the 84a fixture cannot be created | SKIP | `rolebox_dir_not_writable` |
   | The host rolebox directory is inside a git working tree (a rolebox checkout) | SKIP | `rolebox_checkout_protected` |
   | The host rolebox directory cannot be resolved from the installed role | SKIP | `rolebox_dir_unresolved` |
   | Task family (`task_search`…`task_export`) absent (DSH, Codex) | SKIP | `capability_absent:task_query` |
   | A task-data-dependent assertion runs with no completed dispatch task | SKIP | `task_history_absent` |
   | The memory family needed to seed test 131 is absent | SKIP | `capability_absent:memory` |
   | A present family returns a value that contradicts the contract below | FAIL | `error_detail` |

   A test that requests a documented refusal (not-found inspect, path-traversal
   export refusal) is a **PASS** when the named refusal is observed.
4. **Sandbox and cleanup.** Every temporary artifact goes under
   `<workspace>/.rolebox/test-reports/tmp/asset-task/<id>-<slug>/` or
   `$TMPDIR/asset-task/<id>-<slug>/` and is removed before the row is written.
   No body may modify the rolebox read-only reference checkout, the installed
   role's tracked files, a tracked repository file, the registry/lock files or a
   running service. The **only** write outside the sandbox is the designated
   temporary role of test 84a, and only under the host rolebox directory after the
   writability and checkout guards pass.
5. **Hot reload is explicit, never raced.** `asset_hot_reload` takes no arguments.
   The suite never waits for the debounced file watcher to act on its own: a body
   calls the tool once per deliberate state transition, records the returned
   status, and never polls. The temp-role fixture is created, reloaded, removed and
   reloaded; cleanup runs in a `finally`-equivalent path even after a failure.
6. **Task history is data, not authority.** The legacy `task_*` tools are thin
   adapters over dispatch-manager state. In 2.2.0 the dispatch/loop tool families
   are withheld, and the suite has no supported way to create a dispatch task from
   the primary: on the opencode entries a declared-graph node creates the worker
   session directly, while on Pi the outcome delivery runs through the dispatch
   manager and can leave a completed task behind. A user's existing dispatch
   history may therefore be present or absent. No body fabricates a task record;
   the query, budget, graph, chronology and request-budget contracts are asserted
   against whichever documented branch (empty store or populated table) the live
   store returns, and the two export bodies SKIP `task_history_absent` when no
   completed task exists.
7. **`task_retry` is withheld by design.** The registered task map omits it at the
   source (`src/core/services/tool-service.ts` destructures `task_retry` out; the
   Pi entry does the same), and `docs/compatibility.md` lists
   `task_retry` as withheld on every host. The suite makes **no live call** to it,
   asks it to do nothing, and never instructs a worker to use it. Test 70 asserts
   it is absent from the live roster without calling it; the deterministic
   `roles/rolebox-tester/tests/role-contract.test.js` additionally asserts the role
   never instructs it.
8. **Report the row.** One row per id with `id`, `name`, `status`
   (`PASS`/`FAIL`/`SKIP`), `evidence`, `error_detail`, `duration_ms`,
   `executor: primary` and, for a SKIP, `capability_reason`. Quote the tool name,
   the arguments used and the observed marker/message/counts; truncate long
   transcripts but keep ids, paths and markers verbatim.

---

## Task module

### Module contract

The task module is seven tests: **69, 70, 71, 74, 75, 130, 142**, all executed by
the primary. The canonical tools are `task_search`, `task_budget`, `task_graph`,
`task_chronology` and `task_export`; `task_retry` is intentionally not registered.
The family is registered on opencode 1.x/2.x and Pi and is absent on DSH and Codex,
so those hosts SKIP the module with `capability_absent:task_query`.

The tools read the dispatch manager's task records: `task_search` renders a
markdown table with `Task ID`, `Agent`, `Status`, `Started`, `Duration` and
`Description` (plus a 200-character `Result Preview` when `include_result: true`);
`task_budget` renders a `Task Budget:` header and the request-level Input
Tokens/Output Tokens/Cost (USD) rows with `Current`, `Limit`, `% Used` and
`Remaining`; `task_graph` renders a parent/child tree (or every root task) with an
explicit `(Max depth expanded: N)` footer; `task_chronology` renders a time- or
agent-bucketed table with a status column for each dispatch state; `task_export`
writes a markdown or JSON file to a path **relative to the project root**, refusing
a path that resolves outside it.

Two consequences shape the bodies:

- **No task producer in the suite.** The query/budget/tree/chronology bodies accept
  the documented empty-store answers (`No dispatch tasks found.`, `No tasks found.`)
  as the contract for an empty store, and exercise the table shape only when the
  store already holds a task. They never create a task to make a test pass.
- **The export bodies need data.** Test 75 and test 130 first look for a completed
  task with `task_search(query="rolebox-tester", status="completed", limit=5,
  include_result=true)`. If none exists, they SKIP with `task_history_absent` and
  record the probe; when one exists, they export it and verify the file content.

The export path is always workspace-relative and lives under
`.rolebox/test-reports/tmp/asset-task/`; the two exports are separate tests with
separate cleanup, and each also exercises a path-traversal refusal where a valid
task allowed the export step to be reached.

### Test 69: Task search query surface

- **Module:** task
- **Executor:** primary
- **Host gate:** `task_search` registered (opencode 1.x/2.x, Pi).
- **SKIP:** `capability_absent:task_query` when the family is absent (DSH, Codex).

**Steps**

1. Probe the roster and record the registered task names. Call
   `task_search(query="rolebox-tester", limit=10)`.
2. **Empty branch.** If the answer is exactly `No dispatch tasks found.`, record
   the empty-history branch and proceed to step 4. This is the documented contract
   for a store with no task records; it is not a failure.
3. **Populated branch.** If the answer is a table, assert the header
   `## Task Search Results: "rolebox-tester"`, the `Found N matching task(s)` line,
   the columns `| Task ID | Agent | Status | Started | Duration | Description |`,
   at least one row and no more than ten rows. Repeat with
   `status="completed"`: either the table again, in which case every row must read
   `completed`, or the documented no-match message when the store holds no
   completed task — record which. Repeat with `include_result=true`: the header
   gains a `Result Preview` column and each row gains a preview cell.
4. Call `task_search(query="ROLEBOX_NO_SUCH_TASK_MARKER_169", limit=5)`. The
   populated branch must answer
   `No tasks matching "ROLEBOX_NO_SUCH_TASK_MARKER_169".`; the empty branch must
   answer `No dispatch tasks found.`. A thrown error or an unfiltered result is a
   FAIL.
5. Call `task_search(query="rolebox-tester", status="completed",
   from_date="2999-01-01T00:00:00Z", limit=5)`. Expect the empty message (no
   task can start in the future) or the no-match message; a row with a start date
   before the synthetic range is a FAIL.

**Pass criteria**

1. Every call returned without a tool error and answered with a documented
   response.
2. In the populated branch, the columns, query filtering, status filter, date
   filter and limit hold, and the rows are consistent with the query.
3. In the empty branch the exact empty message is observed and the table-shape
   branch is recorded as not exercised (`task_history_absent`); no task record is
   fabricated.
4. `evidence` names the observed branch and quotes the header/row/message.

**Cleanup:** none; this body creates no files and no tasks.

### Test 70: Task budget surface and session scoping

- **Module:** task
- **Executor:** primary
- **Host gate:** `task_budget` registered (opencode 1.x/2.x, Pi).
- **SKIP:** `capability_absent:task_query` when the family is absent.

**Steps**

1. Call `task_budget()` with no arguments. Assert the response starts with
   `## Task Budget: \`` and names a non-empty session id (the tool falls back to
   the calling tool context's session id).
2. Assert the section heading
   `### Request-level Usage (cumulative across all dispatched sessions)` and the
   table header `| Metric | Current | Limit | % Used | Remaining |`, followed by
   one row each for `Input Tokens`, `Output Tokens` and `Cost (USD)`.
3. Call `task_budget(session_id="rolebox-tester-budget-probe-<run-id>")` with a
   unique probe id never used by a real session. Assert the header names exactly
   that id and the three rows report `0`, `0` and `0.000000` in the Current
   column: an unseen session has no recorded usage.
4. Record the live roster and assert it does **not** expose `task_retry` (withheld
   by design; see the module contract). Do not call `task_retry` and do not pass
   any undocumented flag to `task_budget`.

**Pass criteria**

1. Both calls returned without a tool error.
2. The request-level heading and the three metric rows are present in both
   responses, with the four columns intact.
3. The default call names a non-empty session id; the explicit call echoes the
   probe id and reports zero usage for the unseen session.
4. `task_retry` is absent from the live roster; a roster that exposes it is a FAIL
   with `error_detail` naming the documented withheld surface.
5. `evidence` quotes the two headers and the zero rows.

**Cleanup:** none.

### Test 71: Task graph tool

- **Module:** task
- **Executor:** primary
- **Host gate:** `task_graph` registered (opencode 1.x/2.x, Pi).
- **SKIP:** `capability_absent:task_query` when the family is absent.

**Steps**

1. Call `task_graph()` with no arguments.
2. **Empty branch.** If the answer is exactly `No dispatch tasks found.`, record
   the empty-history branch and proceed to step 4.
3. **Populated branch.** Assert a `## Task Graph: \`` header per rendered root,
   indented `- \`<task id>\`` node lines (two spaces per depth level), status and
   agent annotations (the default is `include_status: true`) and the closing
   `(Max depth expanded: 5)`. Repeat with `depth=2` and assert the footer reads
   `(Max depth expanded: 2)`.
4. Call `task_graph(depth=2, include_status=false)`: on the populated branch the
   nodes must carry no `[status]`/agent annotation and the footer must read `2`; on
   the empty branch the documented empty message is returned.
5. A populated tree that contains a node line without a task id, or that places a
   child at the same indentation as its parent, is a FAIL.

**Pass criteria**

1. Every call returned without a tool error and a documented response shape.
2. Empty branch: exact empty message, recorded as `task_history_absent`.
3. Populated branch: headers, indentation, annotations and depth footer hold; the
   output names real task ids (never a placeholder).
4. `evidence` quotes the branch, the footer and one node line.

**Cleanup:** none.

### Test 74: Task chronology tool

- **Module:** task
- **Executor:** primary
- **Host gate:** `task_chronology` registered (opencode 1.x/2.x, Pi).
- **SKIP:** `capability_absent:task_query` when the family is absent.

**Steps**

1. Call `task_chronology()`.
2. **Empty branch.** If the answer is exactly `No tasks found.`, record the
   empty-history branch and proceed to step 5.
3. **Populated branch.** Assert `## Task Chronology`, `Grouped by: hour`,
   `Range: beginning to now`, and the table header `| Bucket | Count | Pending |
   Running | Completed | Awaiting_approval | Error | Cancelled | Timeout |`
   (case follows the renderer's capitalized status names). Assert at least one
   bucket row and that the status columns sum to `Count` for each row.
4. Call `task_chronology(group_by="agent")` and assert `Grouped by: agent`; call
   `task_chronology(from_date="2999-01-01T00:00:00Z")` and expect
   `No tasks in the specified date range.` on the populated store.
5. Call `task_chronology(group_by="agent")` on the empty store and expect the
   documented empty message.

**Pass criteria**

1. Every call returned without a tool error.
2. Empty branch: exact empty message, recorded as `task_history_absent`.
3. Populated branch: header, grouping line, bucket table, column totals and the
   future-range empty answer all hold.
4. `evidence` quotes the branch, the grouping line and one row (or the empty
   message).

**Cleanup:** none.

### Test 75: Task export — markdown

- **Module:** task
- **Executor:** primary
- **Host gate:** `task_export` registered and at least one completed dispatch task
  exists (opencode 1.x/2.x, Pi).
- **SKIP:** `capability_absent:task_query` when the family is absent;
  `task_history_absent` when `task_search(query="rolebox-tester",
  status="completed", limit=5, include_result=true)` returns
  `No dispatch tasks found.`, the no-match message, or no completed row.

**Steps**

1. Discover a completed task with
   `task_search(query="rolebox-tester", status="completed", limit=5,
   include_result=true)` and capture the first `Task ID` cell verbatim. If none
   exists, SKIP with `task_history_absent` and record the probe; never fabricate a
   task or a sidecar file.
2. Export markdown to the workspace-relative path
   `.rolebox/test-reports/tmp/asset-task/75-<task-id>/task-export.md`:
   `task_export(task_id="<task-id>", format="markdown", export_path="...")`.
3. Assert the answer matches
   `Exported task <task-id> to <absolute path> (<n> chars, markdown format)`.
   Read the file back and assert `# Task Export`, `- **Task ID:** <task-id>`,
   `- **Status:** completed`, a `## Result` heading and a non-empty result body.
4. Negative: call
   `task_export(task_id="<task-id>", format="markdown", export_path="../escape.md")`
   and assert the answer is `Error: Path traversal detected — "../escape.md"
   resolves outside the project root` (the renderer names the resolved path; quote
   it verbatim). Assert no `escape.md` was created outside the workspace.
5. Cleanup: remove the `75-<task-id>` directory and confirm the workspace has no
   `escape.md`.

**Pass criteria**

1. A completed task was found (otherwise the SKIP above applies, not a PASS).
2. The export message names the task, the absolute path and the markdown format.
3. The exported file contains the header, the task id, `completed` status, and a
   non-empty result body.
4. The traversal path is refused and writes nothing outside the workspace.
5. `evidence` quotes the discovery row, the export message and the first lines of
   the exported file.

**Cleanup:** the export directory and any partial file are removed even when an
assertion fails.

### Test 130: Task export — JSON

- **Module:** task
- **Executor:** primary
- **Host gate:** `task_export` registered with `format="json"` and at least one
  completed dispatch task exists (opencode 1.x/2.x, Pi).
- **SKIP:** `capability_absent:task_query` when the family is absent;
  `task_history_absent` when no completed task exists (same discovery as test 75).

**Steps**

1. Discover a completed task with the same `task_search` call as test 75 and
   capture the first `Task ID`. If none exists, SKIP with `task_history_absent`.
2. Export JSON to
   `.rolebox/test-reports/tmp/asset-task/130-<task-id>/task-export.json`:
   `task_export(task_id="<task-id>", format="json", export_path="...")`.
3. Assert the answer matches
   `Exported task <task-id> to <absolute path> (<n> chars, json format)`. Read the
   file back, parse it as JSON (a parse error is a FAIL), and assert an object with
   the keys `task_id`, `agent`, `description`, `status`, `started_at`,
   `completed_at`, `prompt` and `result`.
4. Assert `task_id` equals the captured id, `status` is `completed`, `started_at`
   is an ISO-8601 timestamp, `prompt` is a string (the default `include_prompt` is
   `true`), and `result` is a non-empty string. Assert the file is JSON, not the
   markdown export (`# Task Export` must not appear).
5. Cleanup: remove the `130-<task-id>` directory.

**Pass criteria**

1. A completed task was found (otherwise SKIP, not PASS).
2. The export message names the task, the absolute path and the JSON format.
3. The file parses as a JSON object with every required key and the completed-task
   values above; the result text is non-empty.
4. `evidence` quotes the discovery row, the export message and the parsed keys.

**Cleanup:** the export directory and any partial file are removed even when an
assertion fails.

### Test 142: Task budget — request-level consumption and remaining quota

- **Module:** task
- **Executor:** primary
- **Host gate:** `task_budget` registered (opencode 1.x/2.x, Pi).
- **SKIP:** `capability_absent:task_query` when the family is absent.

**Steps**

1. Call `task_budget()` and `task_budget(session_id="rolebox-tester-budget-probe-<run-id>")`.
   Assert both headers name the inspected session (default vs explicit) and that
   both responses carry
   `### Request-level Usage (cumulative across all dispatched sessions)`.
2. Parse the three metric rows (`Input Tokens`, `Output Tokens`, `Cost (USD)`)
   into Current / Limit / % Used / Remaining.
3. **Unlimited branch** (the 2.2.0 default when the operator configured no
   per-request limit): each row must read `unlimited` in the Limit column and `—`
   in `% Used` and `Remaining`. A numeric limit with a dash in those columns, or an
   `unlimited` limit with a fabricated percentage, is a FAIL.
4. **Configured branch** (an operator set `maxInputTokensPerRequest`,
   `maxOutputTokensPerRequest` or `maxCostPerRequest`): for each row with a numeric
   limit `L > 0`, assert `% Used` equals `((Current / L) * 100).toFixed(1) + "%"`
   and `Remaining` equals `max(0, L - Current)` rendered with `0 (exhausted)` when
   the remainder is zero. A configured limit of `0` renders `0` in Limit and `—`
   in `% Used`/`Remaining` (the pct/remaining helpers treat a non-positive limit
   as unset) — assert that documented rendering rather than a division. Cost
   renders with six decimals in Current.
5. Assert the explicit probe id reports Current `0`, `0` and `0.000000`: an unseen
   request session has no consumption, so remaining quota is derived from the live
   config, not fabricated.
6. Assert the roster exposes no `task_retry` (withheld); do not call it.

**Pass criteria**

1. Both calls returned without a tool error and the four columns are intact in
   every row.
2. Exactly one documented branch (unlimited or configured) is observed and its
   arithmetic/formatting holds for every row.
3. The unseen probe session reports zero consumption.
4. `task_retry` is absent from the roster.
5. `evidence` quotes the three rows and the limit state (unlimited or the numeric
   limits).

**Cleanup:** none.

---

## Asset module

### Module contract

The asset module is seventeen tests: **76, 77, 78, 79, 80, 81, 82, 83, 84, 84a,
117, 118, 131, 133, 134, 135, 182**, all executed by the primary. The tools split
into three gates:

| Tool | Hosts | SKIP reason |
|---|---|---|
| `asset_search`, `asset_inspect`, `asset_validate`, `reference_search` | opencode 1.x/2.x, Pi, DSH, Codex | `capability_absent:asset_core` |
| `function_graph`, `skill_compose`, `context_assemble` | opencode 1.x/2.x, Pi only | `capability_absent:asset_extras` |
| `asset_hot_reload` | opencode 1.x/2.x only | `capability_absent:asset_hot_reload` |

The asset tools resolve against the caller's visible tree (see *Attribution and
visibility* above). The **one expected defect** in the resolved rolebox-tester
tree is the intentional `broken-dep` function: its `requires` names
`nonexistent-function`, which no role defines. Test 78, test 117 and test 118
assert that this is the only missing dependency and the only validation error. A
surprising extra error — any second missing dependency, a broken reference path, an
unknown transition condition, or any warning row — is a **FAIL** with the full
issue table as `error_detail`; it means a role or asset regressed beyond the
intentional probe.

Test 80 is a retained id re-grounded on the 2.2.0 surface. The v6 body inspected
the retired `<function_state>` element; in 2.2.0 function state is the markdown
`## Function state:` heading covered by tests 90 and 139, so test 80 now verifies
the **function metadata** surface (`asset_inspect` on the `broken-dep` function,
including its `### Requires` dependency). The retention keeps the id in the asset
module; the retired element is never asserted here.

Hot reload is a deliberate one-shot rescan, never a watcher race. Test 84 verifies
the no-argument tool and its documented statuses; test 84a creates one temporary
role under the host rolebox directory, calls the tool once, proves the role was
discovered and resolved by the count deltas, removes it and calls the tool once
more to restore the previous state. Both bodies state the guards: the host rolebox
directory must be writable and must not be inside a git working tree (the rolebox
checkout is read-only), and the temporary directory must be the exact
`rolebox-tester-hot-reload-<run-id>` path before any delete. A failed reload must
report `**Status:** failed` with a non-empty `**Details:**`, and it is a FAIL here
because the role tree under test is valid.

### Test 76: Asset search surface

- **Module:** asset
- **Executor:** primary
- **Host gate:** `asset_search` registered (all five hosts).
- **SKIP:** `capability_absent:asset_core` when it is absent.

**Steps**

1. Call `asset_search(query="test", limit=10)`.
2. Assert the header `## Asset Search Results: "test"`, the
   `Found N matching asset(s)` line and the table header
   `| Name | Type | Role | Description |`. Assert between one and ten data rows.
3. Apply the attribution scope recorded by the probe:
   - **Attributed tree:** every Role cell is `rolebox-tester` or starts with
     `rolebox-tester/`. A row owned by another top-level role is a FAIL (private
     assets leaked).
   - **Administrative roster (unattributed call):** every Role cell is a top-level
     role id with no `/` segment (private sub-agent assets are stripped); record
     that the inventory scope applied.
4. Assert every row's Type cell begins with `skill`, `function` or `reference`
   (a function may append a parenthesized phase, for example `function (test)`),
   and that the rows are sorted by relevance score implicitly (documented ordering;
   do not assert numeric scores in markdown output).
5. Call `asset_search(query="test", limit=2)` and assert at most two data rows, so
   the limit is honored.

**Pass criteria**

1. The call returns without a tool error with a non-empty result for `test`.
2. Header, count line, table columns and row count hold.
3. The scope rule for the recorded attribution branch holds.
4. `limit` is honored.
5. `evidence` quotes the header, the count and one row.

**Cleanup:** none.

### Test 77: Asset inspect — skill frontmatter

- **Module:** asset
- **Executor:** primary
- **Host gate:** `asset_inspect` registered (all five hosts).
- **SKIP:** `capability_absent:asset_core` when it is absent.

**Steps**

1. Call `asset_inspect(name="test-skill", type="skill")`.
2. Assert the response contains `## Skill: test-skill`, `**Owner**: \``, a
   non-empty `**Description**:`, `**Scope**:` and `**File**: \`` with a path
   ending `skills/test-skill/SKILL.md`. Assert the skill's own reference appears
   under `### Skill References` as `skill-ref` (the skill declares one reference).
3. Call `asset_inspect(name="rolebox-no-such-asset", type="skill")` and assert the
   exact not-found refusal `Asset not found: no skill named
   "rolebox-no-such-asset" exists in any loaded role or sub-agent.` The call must
   return normally, not throw.

**Pass criteria**

1. The known asset renders its frontmatter metadata (name, owner, description,
   scope, file path) and its skill reference.
2. The unknown asset returns the named not-found refusal.
3. `evidence` quotes the header lines and the refusal.

**Cleanup:** none.

### Test 78: Asset validate — the single expected defect

- **Module:** asset
- **Executor:** primary
- **Host gate:** `asset_validate` registered (all five hosts).
- **SKIP:** `capability_absent:asset_core` when it is absent.

**Steps**

1. Call `asset_validate()` with no `role_id` filter.
2. Assert the `## Asset Validation` header and the summary line
   `**1 issue(s) found** — 1 error(s), 0 warning(s)`.
3. Assert exactly one data row and that it names `broken-dep` in the Asset cell
   (the renderer writes the owner-qualified name, for example
   `rolebox-tester/broken-dep`), `function` as the Type, the `🔴 error` badge, and
   the issue text `requires nonexistent function: nonexistent-function`.
4. Assert the errors-first ordering (trivially satisfied by a single row; record
   it) and that no row names any other asset.
5. On an unattributed (administrative) call the scope is every top-level role's
   role-level assets; the same single-issue expectation applies across that roster.
   A second issue row of any severity, a warning, or a different missing
   dependency is a FAIL with the complete rendered table as `error_detail`.

**Pass criteria**

1. The tool returns without error and reports exactly one error and zero warnings.
2. The single issue is the intentional `broken-dep → nonexistent-function`
   missing dependency.
3. `evidence` quotes the summary line and the issue row.

**Cleanup:** none.

### Test 79: Skill composition

- **Module:** asset
- **Executor:** primary
- **Host gate:** `skill_compose` registered (opencode 1.x/2.x, Pi).
- **SKIP:** `capability_absent:asset_extras` when it is absent.

**Steps**

1. Call `skill_compose(skill_names=["test-skill"])`.
2. Assert `## Skill Composition Analysis`, `**Requested:** test-skill`,
   `### Found Skills` with a row `| test-skill | rolebox-tester | 1 |` (the skill
   declares exactly one reference), `### Combined References (deduplicated)` with
   a `skill-ref` row whose Source Skills cell names `test-skill`, `### Conflicts`
   followed by `No conflicts detected.`, and the summary
   `**Summary:** 1 skills found, 1 unique references, 0 conflicts, 0 missing.`
3. Call `skill_compose(skill_names=["test-skill", "missing-skill"])` and assert
   `### Missing Skills` with `- ❌ missing-skill not found in any loaded role`,
   plus a summary reporting `1 missing`.
4. Assert the composition is read-only: no file under the role tree is created or
   modified by either call.

**Pass criteria**

1. Both calls return without error.
2. The found/deduplicated/conflict sections and the summary match the declared
   skill and its one reference.
3. The missing-skill branch names the absent skill.
4. `evidence` quotes the found row, the reference row and the summary.

**Cleanup:** none.

### Test 80: Asset inspect — function metadata and the requires field

- **Module:** asset
- **Executor:** primary
- **Host gate:** `asset_inspect` registered (all five hosts).
- **SKIP:** `capability_absent:asset_core` when it is absent.

**Steps**

1. Call `asset_inspect(name="broken-dep", type="function")`.
2. Assert `## Function: broken-dep`, `**Owner**: \`` with a rolebox-tester owner,
   a `**Description**:` that names the intentionally unsatisfied dependency,
   `**File**: \`` with a path ending `functions/broken-dep.md`, `**Source**:`, and
   `**Priority**: 1`.
3. Assert the `### Requires` section lists exactly `- \`nonexistent-function\``,
   proving the dependency field survives resolution and metadata rendering.
4. Call `asset_inspect(name="nonexistent-function", type="function")` and assert
   the named not-found refusal. This is the cross-check for tests 117 and 118: the
   dependency target does not exist in the resolved role tree.
5. Do not inspect or assert the retired `<function_state>` element anywhere in
   this body; function-state rendering belongs to the statemachine-signal module.

**Pass criteria**

1. The function metadata renders all required fields and the requires entry.
2. The dependency target is confirmed absent by the second inspect call.
3. `evidence` quotes the metadata header, the requires entry and the refusal.

**Cleanup:** none.

### Test 81: Function graph

- **Module:** asset
- **Executor:** primary
- **Host gate:** `function_graph` registered (opencode 1.x/2.x, Pi).
- **SKIP:** `capability_absent:asset_extras` when it is absent.

**Steps**

1. Call `function_graph(role_id="rolebox-tester")` (dependencies focus is the
   default).
2. Assert the header `## Function Dependency Graph (N functions, M edges)`, the
   `**Nodes (K):**` line and the `**Edges:**` section. Assert `M` equals the number
   of edge lines (each edge is rendered as two leading spaces,
   `<source> --<label>--> <target>`).
3. Assert the `broken-dep` edge is present as
   `broken-dep --requires--> nonexistent-function`; the renderer does not add a
   broken glyph, so the missing target is established by test 117's absence check,
   not by a marker.
4. Call `function_graph(role_id="rolebox-tester", focus="state_machine")` and
   assert the `## State Machine Graph (N functions with transitions)` header, a
   `### state-machine (rolebox-tester)` section, the activation line
   `|state-machine| → (evidence_met) → |test-all|` and the deactivation line
   `|state-machine| → (evidence_met) ✗ |transform|`.
5. Assert the `role_id` filter excludes another role's functions (the Nodes and
   sections name only rolebox-tester-owned entries); if the probe recorded the
   unattributed roster, the filter is still applied to `rolebox-tester` and the
   same assertion holds.

**Pass criteria**

1. Both calls return the documented headers and graph bodies.
2. The edge line count matches the header's edge total.
3. The dependency graph contains the broken-dep edge and the state-machine graph
   contains the role's transition lines.
4. `evidence` quotes the two headers and the broken-dep edge.

**Cleanup:** none.

### Test 82: Reference search

- **Module:** asset
- **Executor:** primary
- **Host gate:** `reference_search` registered (all five hosts).
- **SKIP:** `capability_absent:asset_core` when it is absent.

**Steps**

1. Call `reference_search(query="REFERENCE_LOAD_SUCCESS", limit=5)`.
2. Assert the header `## Reference Search Results: "REFERENCE_LOAD_SUCCESS"`, the
   `Found N match(es)` line, and at least one match block with
   `File: <path>:<line>` and the matched line rendered as
   `> **...REFERENCE_LOAD_SUCCESS...**`.
3. Assert the matched files are references of the caller's visible tree: on the
   attributed tree every file path is under the rolebox-tester role directory; on
   the unattributed roster every path is a top-level role reference (no private
   sub-agent references). Record the branch.
4. Call `reference_search(query="REFERENCE_LOAD_SUCCESS", limit=3,
   format="json")` and parse the array. Each entry must carry `refName`, `roleId`,
   `filePath`, `lineNumber` (number), `matchedLine` containing the query, and
   `contextBefore`/`contextAfter` arrays.
5. Call `reference_search(query="ROLEBOX_NO_SUCH_REFERENCE_MARKER", limit=3)` and
   assert `No matches for "ROLEBOX_NO_SUCH_REFERENCE_MARKER" in reference
   documents.`

**Pass criteria**

1. The marker is found with file paths and line numbers; the JSON form parses and
   carries every documented field.
2. The scope rule for the recorded attribution branch holds.
3. The no-match query returns the named message without an error.
4. `evidence` quotes the count line, one match block and the no-match message.

**Cleanup:** none.

### Test 83: Context assembly with a token budget

- **Module:** asset
- **Executor:** primary
- **Host gate:** `context_assemble` registered (opencode 1.x/2.x, Pi).
- **SKIP:** `capability_absent:asset_extras` when it is absent.

**Steps**

1. Call `context_assemble(topic="test", sources=["asset"], max_tokens=100)`.
2. Assert `## Assembled Context`, `**Topic:** test`,
   `**Budget:** 100 tokens (1 sources, ~100 tokens each)` (the renderer emits
   `1 sources`; match the implementation literally) and `**Sources:** asset`.
3. Assert a `### Asset Matches` section with at least one `- Skill:`, `- Function:`
   or `- Reference:` line. Assert no `### Memory Matches`, `### Task Matches` or
   `### Session Matches` section appears (only the requested source is assembled).
4. Assert the assembled body respects the per-source budget: the asset section is
   at most 400 characters plus the `_(truncated to fit token budget)_` marker. If
   the source produced more than the budget, the marker must be present and the
   section must stop at the boundary; if the source produced less, no marker is
   expected. Record the measured length.
5. If the tool answers `No matches found for 'test' across any source.`, that is a
   FAIL: the role's own assets contain `test`, so an empty result contradicts the
   assembled source.

**Pass criteria**

1. The response is a markdown context block with the header, topic, budget and
   source lines.
2. Only the requested source section is present and it contains real matches.
3. The budget/truncation rule holds and the measured length is recorded.
4. `evidence` quotes the budget line, the source line and the first asset match.

**Cleanup:** none.

### Test 84: Asset hot reload — status contract

- **Module:** asset
- **Executor:** primary
- **Host gate:** `asset_hot_reload` registered (opencode 1.x/2.x only) and hot
  reload not disabled by `ROLEBOX_HOT_RELOAD=false`/`0`.
- **SKIP:** `capability_absent:asset_hot_reload` (Pi, DSH, Codex);
  `hot_reload_disabled` when the tool reports the disabled status;
  `hot_reload_busy` when it reports the single-flight `skipped` status.

**Steps**

1. Call `asset_hot_reload()` with no arguments (the schema takes none; pass none).
2. Assert the header `## Asset Hot Reload`, the
   `**Requested:** assets (full reload)` line and a `**Status:**` line with one of
   `completed`, `skipped`, `disabled` or `failed`.
3. **completed:** assert `**Details:** Roles re-discovered and re-resolved.
   Discovered: N, Resolved: M, Skipped: K.` with integer counts, `N >= 1`,
   `M <= N`, and `K = N - M`. A valid role tree must not skip a role (`K = 0`);
   record `N`, `M` and `K` as the reload evidence. A `fast`-scope answer instead
   (`skills re-resolved for role "<id>"`) is acceptable only when the reload
   classified a skill-only change; record the scope and do not require the full
   counts on that branch (test 84a is self-contained and does not consume them).
4. **skipped (busy):** record the documented "another hot reload is already in
   progress; nothing was changed" detail and SKIP `hot_reload_busy`; do not poll.
5. **disabled:** record the `ROLEBOX_HOT_RELOAD` detail and SKIP
   `hot_reload_disabled`.
6. **failed:** FAIL with the non-empty `**Details:**`; the suite's role tree is
   valid, so a failed rescan contradicts the reload contract.

**Pass criteria**

1. The completed branch reports integer discovered/resolved/skipped counts that
   satisfy `M = N - K` and, for a clean tree, `K = 0`.
2. The disabled/busy branches SKIP with the documented reason and detail; the
   failed branch FAILs with its detail.
3. `evidence` quotes the status line and the details line.

**Cleanup:** none; this body creates no role and no file. Test 84a owns the
temporary role and its cleanup.

### Test 84a: Hot reload — new-role discovery and cleanup

- **Module:** asset
- **Executor:** primary
- **Host gate:** `asset_hot_reload` registered (opencode 1.x/2.x only), the host
  rolebox directory writable, and that directory not inside a git working tree.
- **SKIP:** `capability_absent:asset_hot_reload`;
  `rolebox_dir_unresolved`; `rolebox_dir_not_writable`;
  `rolebox_checkout_protected`; `hot_reload_disabled`; `hot_reload_busy`.

**Steps**

1. **Resolve the rolebox directory.** Inspect the installed role's own skill file
   (`asset_inspect(name="test-skill", type="skill")`), take the `**File**:` path,
   and resolve its role directory (`.../rolebox-tester`) and the rolebox root that
   contains it (`.../rolebox`). Cross-check that `<rolebox-root>/rolebox-tester` is
   the installed role directory. If the path cannot be resolved, SKIP
   `rolebox_dir_unresolved` and write nothing.
2. **Checkout guard.** Run the resolved command tool with
   `git -C "<rolebox-root>" rev-parse --show-toplevel`. Exit 0 means the rolebox
   directory is inside a git working tree: SKIP `rolebox_checkout_protected` and
   write nothing. Exit 128 ("not a git repository") means the directory is not a
   checkout: continue. Any other outcome is recorded and the body SKIPs
   `rolebox_dir_unresolved`. If `git` is unavailable, check for a `.git` entry in
   the rolebox root and each ancestor with the file tool; a hit is treated as a
   checkout.
3. **Writability probe.** Create
   `<rolebox-root>/rolebox-tester-hot-reload-<run-id>` and write the two fixtures
   below with the resolved write tool. A permission denial or write error means
   the directory is not writable: remove any partial directory and SKIP
   `rolebox_dir_not_writable`.

   ```yaml
   # role.yaml — minimal, no model (the host default applies), inline prompt
   name: Rolebox Tester Hot Reload Probe
   description: "[rolebox-tester self-test] temporary role created by test 84a; safe to delete."
   prompt: |
     Hot reload probe role. Reply with ROLEBOX_84A_HOT_RELOAD_OK.
   ```

   ```text
   # PROMPT.md — only needed by a host whose role.yaml requires prompt_file
   # Hot Reload Probe
   Reply with ROLEBOX_84A_HOT_RELOAD_OK.
   ```

   The directory name is unique per run (`<run-id>` is the run's report id); never
   reuse or overwrite an existing role directory.
4. **Discover.** Call `asset_hot_reload()` once and assert `**Status:** completed`
   with `Discovered: D1, Resolved: R1, Skipped: S1`. Assert `R1 = D1 - S1` and
   `S1 = 0`: the freshly created role is valid, so it must resolve rather than
   skip. (A `skipped` busy answer SKIPs `hot_reload_busy` after cleanup; a `failed`
   answer FAILs with its detail after cleanup.)
5. **Remove and restore.** Before deleting, print the resolved absolute path and
   confirm it equals `<rolebox-root>/rolebox-tester-hot-reload-<run-id>` exactly
   (never `/`, a parent, or any other role). Remove exactly that directory. Call
   `asset_hot_reload()` once more and assert `completed` with
   `Discovered: D2, Resolved: R2, Skipped: S2`.
6. **Prove discovery and cleanup.** Assert `D1 = D2 + 1`, `R1 = R2 + 1` and
   `S1 = S2 = 0`. The deltas prove the temporary role was discovered **and
   resolved**, and that its removal restored the previous count. A larger delta
   means another role directory changed concurrently; FAIL with both count sets
   and the evidence instead of masking it. The reload counts, not `asset_search`,
   are the discovery evidence: a peer top-level role's assets are private to the
   caller's visible tree, so the new role must not be observable through
   asset_search.
7. Assert the temporary directory no longer exists. If any step after creation
   fails, still remove the directory and attempt the cleanup reload; report the
   FAIL with the observed reload output and the cleanup state.

**Pass criteria**

1. The guards passed (writable, not a checkout) and the fixture was created under
   the host rolebox directory.
2. The post-creation reload resolved the one extra role, and the post-removal
   reload restored the baseline counts exactly.
3. The temporary directory (and its generated content) is gone; no other role
   directory was touched.
4. `evidence` quotes the two `Discovered/Resolved/Skipped` lines and the resolved
   temporary path.

**Cleanup:** remove the exact temporary role directory and run the second reload;
the body does not leave the fixture or a generated role agent behind. The rolebox
checkout and the installed role's tracked files are never modified.

### Test 117: Broken dependency — function graph detection

- **Module:** asset
- **Executor:** primary
- **Host gate:** `function_graph` registered (opencode 1.x/2.x, Pi).
- **SKIP:** `capability_absent:asset_extras` when it is absent.

**Steps**

1. Call `function_graph(role_id="rolebox-tester")` (dependencies focus).
2. Assert the response contains the `broken-dep` node and the edge line
   `broken-dep --requires--> nonexistent-function`. The renderer lists edge
   endpoints under `**Nodes (K):**`, so `nonexistent-function` appears there as a
   target, not as a loaded function.
3. Assert `nonexistent-function` is never an edge **source** (no loaded function
   defines it), and confirm with `asset_inspect(name="nonexistent-function",
   type="function")` that the target is absent from the resolved role tree. This
   is the missing-dependency proof: the graph tracks the edge, the inspect tool
   confirms the target does not exist.
4. Assert the header's edge total `M` equals the number of rendered edge lines and
   that the function count `N` is at least the seven role-level functions (the
   probe may include sub-agent functions under the role prefix).
5. Do not require a special broken/missing glyph. The v6 criterion that demanded a
   `⚠`/`[missing]` marker is retired because the 2.2.0 renderer emits plain text
   arrows and distinguishes the missing target by the absence check instead.

**Pass criteria**

1. The graph renders the broken-dep requires edge with the missing target.
2. The target is absent from the resolved function set.
3. The edge count matches the header total.
4. `evidence` quotes the header, the edge line and the not-found refusal.

**Cleanup:** none.

### Test 118: Broken dependency — asset_validate reporting

- **Module:** asset
- **Executor:** primary
- **Host gate:** `asset_validate` registered (all five hosts).
- **SKIP:** `capability_absent:asset_core` when it is absent.

**Steps**

1. Call `asset_validate()`.
2. Assert `## Asset Validation` and the summary
   `**1 issue(s) found** — 1 error(s), 0 warning(s)`.
3. Assert the single row is the missing-dependency category: Asset cell names
   `broken-dep`, Type `function`, badge `🔴 error`, and Issue text
   `requires nonexistent function: nonexistent-function`.
4. Assert the issue count and the exact pair agree with test 117's graph edge: one
   edge, one validation error, the same `broken-dep → nonexistent-function`
   relation. A second issue of any severity, a warning, or a different dependency
   is a FAIL with the rendered table as `error_detail`.
5. Assert the third validation category (unknown transition condition) is clean for
   the role tree: no warning rows (the summary's `0 warning(s)` covers it).

**Pass criteria**

1. Exactly one issue, one error, zero warnings.
2. The issue is the intentional missing dependency, named exactly as above.
3. The result is consistent with the function graph of test 117.
4. `evidence` quotes the summary line and the issue row.

**Cleanup:** none.

### Test 131: Context assembly across multiple sources

- **Module:** asset
- **Executor:** primary
- **Host gate:** `context_assemble` registered (opencode 1.x/2.x, Pi) and the
  memory family available to seed a deterministic memory match.
- **SKIP:** `capability_absent:asset_extras` when `context_assemble` is absent;
  `capability_absent:memory` when `memory_write`/`memory_recall` are absent.

**Steps**

1. **Seed the memory source.** Search for the existing fixture with
   `memory_recall(query="[rolebox-tester self-test] context assemble 131 test
   fixture")`. If an entry is returned, update it with `memory_update` instead of
   writing another; otherwise write it once with `memory_write` using the title
   `[rolebox-tester self-test] context assemble 131 test fixture`, category
   `note`, scope `workspace` when the probe recorded no caller attribution and
   `role` when it recorded the rolebox-tester identity, relevance `low` and
   content containing the literal word `test`. One identifiable
   entry is the policy limit; never store a secret or a transcript. There is no
   memory delete tool, so the entry intentionally remains and is reused on the
   next run.
2. Call `context_assemble(topic="test", sources=["memory", "asset", "session"],
   max_tokens=3000)`.
3. Assert `## Assembled Context`, `**Topic:** test`,
   `**Budget:** 3000 tokens (3 sources, ~1000 tokens each)` and
   `**Sources:** memory, asset, session` in that order.
4. Assert at least **two** of the three requested sections are present:
   - `### Memory Matches` with the fixture title (the seeded entry proves the
     memory source actually searched);
   - `### Asset Matches` with at least one real role asset line;
   - `### Session Matches` (optional when the current session's recent text has no
     `test` match) with `- Session:` lines.
   If only one section appears, FAIL: the requested multi-source search did not
   draw from at least two domains.
5. Assert each present section is truncated to its per-source budget
   (3000 / 3 × 4 = 4000 characters) or ends with
   `_(truncated to fit token budget)_`; a section longer than the budget without
   the marker is a FAIL.
6. Cleanup: the memory entry has no delete surface; record its title and id in
   `evidence` so the next run updates the same entry rather than multiplying
   self-test entries. No file is created.

**Pass criteria**

1. The memory fixture was found or written once and the tool searched it.
2. At least two requested source sections are present; the memory section names
   the seeded fixture and the asset section names real role assets.
3. The budget line, source order and per-source truncation rule hold.
4. `evidence` quotes the budget/sources lines, the two section headers and the
   memory fixture id.

**Cleanup:** the one identifiable memory entry remains (no delete tool exists);
no other state is written.

### Test 133: Reference search — context_lines

- **Module:** asset
- **Executor:** primary
- **Host gate:** `reference_search` registered (all five hosts).
- **SKIP:** `capability_absent:asset_core` when it is absent.

**Steps**

1. Call `reference_search(query="REFERENCE_LOAD_SUCCESS", limit=3,
   context_lines=5)` and record the output length and the list of matching
   `File: <path>:<line>` locations.
2. Call `reference_search(query="REFERENCE_LOAD_SUCCESS", limit=3,
   context_lines=0)` and record the same.
3. Assert both calls return the same match locations (the parameter changes
   context, never which lines match) and the same match count.
4. In the `context_lines=5` output, assert at least one match block contains
   context lines besides the marked match line: lines rendered with two leading
   spaces between the `File:` line and the `> **...**` matched line, and/or after
   it. In the `context_lines=0` output, assert no such two-space context lines
   appear: the matched line follows the `File:` line and no surrounding lines are
   rendered.
5. Assert the `context_lines=5` output is strictly longer than the
   `context_lines=0` output.
6. Call with `context_lines=10` (the documented maximum) and assert it is accepted
   and still returns the same match locations.

**Pass criteria**

1. Both calls return the same matches and the larger context renders strictly
   more text.
2. The zero-context block contains only the matched line; the five-line block
   contains surrounding context.
3. The maximum valid value is accepted without an error.
4. `evidence` quotes one match location and both block shapes.

**Cleanup:** none.

### Test 134: Asset search — type filter

- **Module:** asset
- **Executor:** primary
- **Host gate:** `asset_search` registered (all five hosts).
- **SKIP:** `capability_absent:asset_core` when it is absent.

**Steps**

1. Call `asset_search(query="test", type="skill", limit=10)` and
   `asset_search(query="test", type="function", limit=10)`.
2. Assert both calls return without error and both result sets are non-empty (the
   query matches `test-skill` as a skill and `test-all` as a function).
3. Assert every Type cell in the skill result begins with `skill`, and every Type
   cell in the function result begins with `function` (a parenthesized phase may
   follow the type, for example `function (test)`). No reference row may appear in
   either result.
4. Apply the attribution scope rule from test 76 to the Role cells of both result
   sets.

**Pass criteria**

1. Both filtered calls return non-empty, type-pure result sets.
2. The type filter never leaks another asset type.
3. The scope rule holds.
4. `evidence` quotes the header, the count and one row from each call.

**Cleanup:** none.

### Test 135: Asset search — role filter

- **Module:** asset
- **Executor:** primary
- **Host gate:** `asset_search` registered (all five hosts).
- **SKIP:** `capability_absent:asset_core` when it is absent.

**Steps**

1. Call `asset_search(query="test", type="all", limit=10)` as the unfiltered
   baseline and record the `Found N` total and Role cells.
2. Call `asset_search(query="test", type="all", role_id="rolebox-tester",
   limit=10)` and assert every Role cell is `rolebox-tester` or starts with
   `rolebox-tester/`.
3. Apply the attribution scope, comparing the `Found N` totals (not just the
   rendered rows, which the limit may cut):
   - **Attributed tree:** the filtered total equals the baseline total (the whole
     baseline is already the caller's tree) and every baseline Role cell is
     rolebox-tester-scoped.
   - **Administrative roster (unattributed):** the filtered total is smaller than
     the baseline total (the filter genuinely narrows the inventory) and the
     baseline contains at least one other top-level role id; the filtered set
     still contains only rolebox-tester rows.
4. Call `asset_search(query="test", type="all",
   role_id="rolebox-tester-does-not-exist", limit=10)` and assert the named
   no-match message `No assets matching "test".` (with `type: "all"` the renderer
   omits the ` of type "<type>"` clause; the filter must not silently fall back to
   the unfiltered result set).
5. Count each call once; this body is a single report row.

**Pass criteria**

1. The role filter narrows or preserves the result set exactly as the recorded
   attribution branch requires.
2. The filtered rows carry only rolebox-tester ids.
3. The unknown role id returns the documented no-match message.
4. `evidence` quotes the two counts and one filtered row.

**Cleanup:** none.

### Test 182: Asset search — type normalization

- **Module:** asset
- **Executor:** primary
- **Host gate:** `asset_search` registered (all five hosts).
- **SKIP:** `capability_absent:asset_core` when it is absent.

**Steps**

1. Call `asset_search(query="test", format="json", limit=10)` with the `type`
   argument **omitted** and parse the JSON array.
2. Call `asset_search(query="test", type="undefined", format="json", limit=10)`
   and parse the array.
3. Call `asset_search(query="test", type="all", format="json", limit=10)` and
   parse the array.
4. Assert all three arrays are non-empty and that step 1 and step 2 are equal to
   step 3 (same names, types, roles and scores): the schema `.catch("all")` plus
   the execute-level guard normalize the missing value and the literal
   `"undefined"` to `all`.
5. Assert no response is the type-scoped empty message
   `No assets matching "test" of type "undefined".` (that message must never be
   produced for the normalized calls) and that every entry's `type` is one of
   `skill`, `function` or `reference`.
6. Assert `format="json"` itself is honored: each response parses as a JSON array
   of objects (not the markdown table).

**Pass criteria**

1. Omitted and literal-`"undefined"` type values both resolve to `all` and return
   the same non-empty result set as the explicit `all`.
2. No bogus-type empty message appears; every entry has a valid type.
3. `evidence` quotes the three entry counts and the first entry of each array.

**Cleanup:** none.
