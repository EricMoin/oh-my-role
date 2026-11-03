# Session, memory and web module bodies — rolebox-tester 7.0.0

This document owns the `### Test <id>` bodies for three catalog modules of the
rolebox-tester 7.0.0 suite: **session** (8 ids), **memory** (12 ids) and **web**
(4 ids) — 24 bodies in total. It is one of the eleven body files named by
[`test-catalog.md`](test-catalog.md); the machine-readable catalog remains the
single source of truth for the id set, the executor lane and the host gate, and
[`host-capability-matrix.md`](host-capability-matrix.md) defines the capability
probe, tool-name resolution, SKIP-versus-FAIL contract and report vocabulary used
throughout this document.

## Module map

| Module | Ids | Count | Executor | Host gate | Catalog body |
|---|---|---|---|---|---|
| session | 20, 21, 22, 23, 24, 25, 138, 179 | 8 | primary | `session_list/read/search/info/diff/fork` registered; DSH caller-scoped, opencode 2 degraded, Codex absent | `references/session-memory-web-tests.md` |
| memory | 59, 60, 61, 62, 63, 64, 108, 245, 246, 247, 248, 249 | 12 | primary | `memory_write/recall/list/read/update` registered; prompt blocks need a rendered role prompt; worker recall and session focus are DSH-only | `references/session-memory-web-tests.md` |
| web | 127, 128, 129, 256 | 4 | primary | `web_search/web_read/web_fetch` registered with the network reachable; MCP resource tools only when the host exposes them | `references/session-memory-web-tests.md` |

The union of the three id sets is exactly the 24 ids above; no other `### Test`
heading belongs in this file. Tests 246 and 249 declare a graph whose node is a
fixture in another role, but the **primary is still the executor**: it writes the
fixture prompt, declares the graph, reads the recorded answer once and grades it.
No body in this document is assigned to a dispatched worker.

## How every body is executed

1. **Probe before the first body.** Run the capability probe from
   [`host-capability-matrix.md`](host-capability-matrix.md): record the host id and
   version, the rolebox version, the workspace, the executor lane and the exact
   registered tool names for every family this document uses. A name in this
   document, in `role.yaml` or in the catalog is not a capability signal; only the
   live roster is.
2. **Resolve native names.** Use the tool-name resolution table in the capability
   matrix. The canonical rolebox names are `session_*`, `memory_*`, `web_search`,
   `web_read`, `web_fetch`, `list_mcp_resources` and `read_mcp_resource`; a host
   that renames or shadows a tool is recorded and called under the name that is
   actually registered. Never simulate a missing tool with a shell command.
3. **Gate per test.** A missing capability family is a **SKIP** with one stable
   `snake_case` reason (`capability_absent:session`, `network_unavailable`, …), not
   a FAIL. A present family that contradicts its documented contract is a **FAIL**
   with an `error_detail` naming expected and observed behavior. A refusal the test
   explicitly requests (an access-denied refusal, a not-found read, an SSRF block)
   is a **PASS** when the named refusal is recorded.
4. **Record evidence.** For each test quote the tool name, the arguments used, and
   the observed answer or marker; truncate long transcripts but keep ids, titles
   and markers verbatim. A test that cannot be exercised in this environment is
   SKIP with a reason, never a fabricated PASS.
5. **Clean up.** Temporary files go under `.rolebox/test-reports/tmp/` or
   `$TMPDIR` and are removed at the end. No body may modify the rolebox checkout or
   any tracked repository file. The session-diff body must not create tracked
   changes. Memory has no delete tool, so the memory hygiene policy below governs
   every write and update.
6. **Report.** Emit one row per id with `id`, `name`, `status`, `evidence`,
   `error_detail`, `duration_ms`, `executor` and, for a SKIP, `capability_reason`;
   the report vocabulary is the one in the capability matrix. The module row
   aggregates its tests and keeps the SKIP count visible.

---

## Session

### Module contract

The session module is eight tests: 20, 21, 22, 23, 24, 25, 138 and 179. The
canonical tool names are `session_list`, `session_read`, `session_search`,
`session_info`, `session_diff` and `session_fork`; resolve each from the live
roster.

- **opencode 1.x and Pi** expose the full session surface. `session_list` returns a
  markdown table whose `Session ID` cell is the complete id, and every downstream
  read accepts that id unmodified.
- **opencode 2.x** still registers all six tools but the plugin session domain is
  reduced: `session_list`, `children`, `todo` and `diff` answer empty, while
  `session_fork` and `status` answer null. The tools must therefore report the
  documented emptiness or refusal without throwing; the tests assert that
  degradation where it is the contract and never call it a host failure.
- **DSH** session tools are caller-scoped. `session_list` returns exactly the
  calling session (one row); `get`, `messages`, `todo`, `diff`, `fork` and `status`
  for any other session id are refused with the documented refusal
  `Session access denied: DSH session tools may only access the calling session.`;
  `children` is always empty; a parent id is hidden unless it is the caller; and
  only a self-fork is possible. These bodies assert that contract directly instead
  of inventing a second session: a synthetic foreign id is enough to exercise the
  refusal.
- **Codex** has no session tools (the MCP transport exposes no session client), so
  the whole module SKIPs with `capability_absent:session`.

An id used by more than one step is captured from `session_list` and fed
downstream **verbatim** — no trim, re-type, prefix or truncation. When no id can be
obtained (for example opencode 2 list is empty), the id-dependent sub-checks SKIP
with `session_id_source_absent`; the body does not fabricate an id. A platform that
genuinely emits short ids records that fact and passes the round-trip test on its
own id length instead of assuming twelve characters.

### Test 20: Session List

- **Module:** session
- **Executor:** primary
- **Host gate:** `session_list` registered.
- **SKIP:** `capability_absent:session` when the family is not registered (Codex).

**Steps**

1. Call `session_list(limit=5)` with no date or project filter.
2. Inspect the table headers. The list renderer emits `Session ID`, `Title`,
   `Messages`, `Date Range` and `Duration`; a host that documents a reduced table
   records the headers it actually emits.
3. Capture the `Session ID` cell of the newest row verbatim.
4. On DSH, assert exactly one data row and that it is the calling session: feed its
   id to `session_info` (it resolves) and confirm the cross-session refusal of test
   21 with a synthetic id. An empty list on DSH is a FAIL because the calling
   session always exists.
5. On opencode 2.x, assert the documented degraded answer — the tool returns
   `No sessions found.` (or the equivalent empty table message) without throwing.
   That is a PASS: the documented emptiness is the contract.
6. On opencode 1.x and Pi, assert at least one row with a non-empty title and no
   more than five rows, so `limit` is honored.
7. Assert the captured id contains no `...` ellipsis and no fixed-width cut (the
   renderer emits the full `session.id` value).

**Pass criteria**

1. The call returns without a tool error.
2. The output is either the documented table (with `Session ID` and `Title` columns)
   or the documented empty message for the host.
3. The captured id is complete and can be reused by `session_info`/`session_read`.
4. DSH returns exactly the calling session; opencode 2 returns the documented empty
   list; opencode 1.x and Pi return at least one real session.
5. `limit` is respected.

**Failure boundary.** A thrown error, a truncated id, or an empty list on a host
documented as returning sessions is a FAIL with `error_detail`. A missing family is
the SKIP above.

### Test 21: Session Read

- **Module:** session
- **Executor:** primary
- **Host gate:** `session_read` registered and a valid session id obtainable.
- **SKIP:** `capability_absent:session`; `session_id_source_absent` when no id can be
  obtained (opencode 2 list is empty and the host supplies none).

**Steps**

1. Obtain a valid id from `session_list` (DSH: the calling session; opencode 1.x
   and Pi: the newest session).
2. Call `session_read(session_id="<id>")` with defaults.
3. Call `session_read(session_id="<id>", include_todos=true,
   include_tool_results=true, role_filter="assistant", limit=5)`.
4. On DSH, call `session_read(session_id="ses_foreign_probe")` (a synthetic id that
   is not the caller's) and record the refusal.
5. On opencode 2.x with no obtainable id, SKIP steps 1–3 with
   `session_id_source_absent`; when the operator supplies an id, the read must work
   and any empty/degraded section is the documented contract.

**Pass criteria**

1. The default read returns a transcript with a header containing `Session:` and
   the `ID:` line echoing the requested id.
2. The transcript contains at least one `[Message N]` entry.
3. The filtered read returns without error and applies the filters: only assistant
   messages, at most five, with tool results and todos accepted.
4. On DSH, the cross-session read is refused with
   `Session access denied: DSH session tools may only access the calling session.`
   and no content from the foreign id is returned. That requested refusal is a
   PASS.
5. No step reports a phantom id or claims the caller's session is missing.

**Failure boundary.** Returning content for a foreign id on DSH, ignoring
`role_filter`, or an unexpected error is a FAIL.

### Test 22: Session Search

- **Module:** session
- **Executor:** primary
- **Host gate:** `session_search` registered.
- **SKIP:** `capability_absent:session`; `session_id_source_absent` only for the
  scoped sub-check when no id exists.

**Steps**

1. Call `session_search(query="test", limit=5)`.
2. Call `session_search(query="test", limit=5, include_tool_output=true)`.
3. On DSH, call `session_search(query="test", session_id="ses_foreign_probe")` and
   record the refusal; the unscoped call must search only the calling session.
4. On opencode 2.x, assert the documented empty answer (`No sessions found.` or
   `No matches found.`); it must not throw.

**Pass criteria**

1. Both calls return without error.
2. When matches exist, the answer contains `Found N match(es) across M session(s)`
   with excerpts, and the session/message ids are complete (no `...` cut).
3. When no match exists, the answer is `No matches found.` (or the documented empty
   list), which is a PASS.
4. `include_tool_output=true` is accepted and changes nothing else.
5. On DSH the unscoped search never reports another session and the synthetic
   foreign id is refused with the access-denied refusal.

**Failure boundary.** A present search that leaks a foreign session on DSH, or an
unhandled error, is a FAIL.

### Test 23: Session Info

- **Module:** session
- **Executor:** primary
- **Host gate:** `session_info` registered and a valid session id obtainable.
- **SKIP:** `capability_absent:session`; `session_id_source_absent` when no id can be
  obtained.

**Steps**

1. Obtain a valid id from `session_list`.
2. Call `session_info(session_id="<id>")`.
3. On opencode 2.x, record the documented degraded fields: `Status:` is `unknown`,
   children and todos are empty, and the call still succeeds rather than throwing.
4. On DSH, confirm the call resolves only for the caller's id and never for a
   foreign id (already exercised by test 21; do not repeat the side effect).

**Pass criteria**

1. The output contains a header with `## Session:` and the session title.
2. The `**ID:**` line echoes the requested id exactly.
3. The output has `### Token Usage` with at least `Input:` and `Output:` counts and
   a `Total Cost:` line.
4. The output reports `**Messages:**`, `**Children:**` and `**Status:**`.
5. If the session has tool calls, `### Tool Usage` lists frequency counts.
6. On opencode 2.x the degraded values above are reported honestly, not invented.

**Failure boundary.** A missing header/ID/token section, or an unexpected error, is
a FAIL. The documented opencode 2 degradation is a PASS.

### Test 24: Session Diff

- **Module:** session
- **Executor:** primary
- **Host gate:** `session_diff` registered and a valid session id obtainable.
- **SKIP:** `capability_absent:session`; `session_id_source_absent` when no id can be
  obtained.

**Steps**

1. Obtain a valid id from `session_list`.
2. Call `session_diff(session_id="<id>")`.
3. Do not create tracked repository changes to force a diff. If the body creates a
   temporary probe file under `.rolebox/test-reports/tmp/` or `$TMPDIR`, remove it
   afterwards and keep the working tree clean.
4. On opencode 2.x, assert the documented empty result
   `No file changes in this session.` without an error.
5. On DSH, the diff is read for the caller's session only; a foreign id is refused
   (covered by the access-denied contract in test 21).

**Pass criteria**

1. The tool returns without error.
2. When the session made file changes, the output contains `Files changed:` with a
   count and unified diff markers `--- a/` and `+++ b/`.
3. When it made none (or the host documents an empty diff), the output is
   `No file changes in this session.` — a PASS.
4. No tracked repository file is changed by this body and no temp probe remains.

**Failure boundary.** An error, a fabricated diff, or leftover tracked changes is a
FAIL.

### Test 25: Session Fork

- **Module:** session
- **Executor:** primary
- **Host gate:** `session_fork` registered and a valid session id obtainable.
- **SKIP:** `capability_absent:session`; `session_id_source_absent` when no id can be
  obtained; `self_fork_only` on DSH (only the caller's own session can be forked);
  `capability_degraded:fork_null` on opencode 2.x (`session_fork` answers null and
  the tool renders the documented refusal).

**Steps**

1. Obtain a valid id from `session_list` (opencode 1.x/Pi only for this body's
   positive branch).
2. On opencode 1.x or Pi, call `session_fork(session_id="<id>")` with no
   `message_id`.
3. On DSH, do not fork the user's live session. Record that only a self-fork is
   available and SKIP the fork assertion with `self_fork_only`.
4. On opencode 2.x, call is not required; record the documented null return and
   SKIP with `capability_degraded:fork_null`. If the tool is called, the documented
   refusal text (`the session exists, but the fork was refused`) is the evidence.
5. When a fork is refused, apply the refusal-honesty checks: no phantom message id
   when none was supplied, no claim that the session may not exist, and the cause is
   surfaced rather than swallowed.

**Pass criteria**

1. On opencode 1.x/Pi the output contains `## Session Forked Successfully`, an
   `Original Session` id and a different, non-empty `New Session` id.
2. On DSH the SKIP reason is `self_fork_only`; no new session is created.
3. On opencode 2.x the SKIP reason is `capability_degraded:fork_null` and the
   documented refusal (if observed) is recorded verbatim.
4. A refusal never blames a message id that was not supplied and never claims the
   session is missing.

**Failure boundary.** A fork that silently fails, returns the original id as the new
id, or a refusal that contradicts the refusal-honesty rules is a FAIL.

### Test 138: Session Read — tool_filter Parameter

- **Module:** session
- **Executor:** primary
- **Host gate:** `session_read` registered with the `tool_filter` argument and a
  valid session id obtainable.
- **SKIP:** `capability_absent:session`; `session_id_source_absent` when no id can be
  obtained.

**Steps**

1. Obtain a valid id (`session_list(limit=5)`).
2. Call `session_read(session_id="<id>", tool_filter="bash", limit=10)`.
3. Call `session_read(session_id="<id>", tool_filter="read", limit=10)`.
4. Call `session_read(session_id="<id>", tool_filter="__no_such_tool__", limit=10)`
   to prove an empty filter result is handled without error.

**Pass criteria**

1. All three calls return without error, proving `tool_filter` is accepted.
2. When the session contains matching tool calls, only messages carrying that tool
   call are shown.
3. When none match, the output is `No matching messages` or an empty transcript —
   not an error.
4. A different tool name changes the narrowed set (or both are legitimately empty),
   proving the filter is applied rather than ignored.
5. The id is used verbatim; the body does not reference a retired tool name as the
   sample filter.

**Failure boundary.** An unknown argument error, or a filter that does not narrow
the transcript when matching calls exist, is a FAIL.

### Test 179: Session Id Round-Trip (list → info → read → fork)

- **Module:** session
- **Executor:** primary
- **Host gate:** the session family plus a list-obtained id; the fork step keeps its
  own gate.
- **SKIP:** `capability_absent:session`; `session_id_source_absent` when
  `session_list` yields no id and the host supplies none; `self_fork_only` for the
  DSH fork step; `capability_degraded:fork_null` for the opencode 2.x fork step.

**Steps**

1. Call `session_list(limit=5)` and capture a `Session ID` cell **verbatim** — do
   not trim, reformat or re-type it.
2. Feed the exact string to `session_info(session_id="<id>")`.
3. Feed the same exact string to `session_read(session_id="<id>", limit=1)`.
4. Feed the same exact string to `session_fork(session_id="<id>")` on a host that
   supports a cross/self fork; on DSH record `self_fork_only` and on opencode 2.x
   record `capability_degraded:fork_null` instead of forking.
5. Compare the emitted `**ID:**` / `ID:` values with the captured value
   byte-for-byte.

**Pass criteria**

1. The captured id contains no `...` ellipsis (length greater than twelve unless the
   platform genuinely emits short ids, which is recorded).
2. `session_info` resolves with `## Session:` and its `**ID:**` line equal to the
   captured id.
3. `session_read` resolves with its `ID:` line equal to the captured id.
4. On opencode 1.x/Pi the fork resolves with a non-empty new id different from the
   original; the DSH and opencode 2.x fork steps are the documented SKIPs above.
5. No downstream call answers `Session not found` or a permission error for the
   caller's own id, and no character was added, removed or substituted between
   capture and use.

**Failure boundary.** A truncated id that fails downstream, or a host echoing a
different id, is a FAIL.

---

## Memory

### Module contract

The memory module is twelve tests: 59, 60, 61, 62, 63, 64, 108, 245, 246, 247, 248
and 249. The canonical tool names are `memory_write`, `memory_recall`,
`memory_list`, `memory_read` and `memory_update`; resolve each from the live roster.
The tools work against the workspace's `.rolebox/memory.db`.

**Scope and visibility.** `scope: "workspace"` entries are shared by every role in
the workspace; `scope: "role"` entries are visible only to the role that wrote them.
Visibility is enforced by search, list, read and update, including reads by id. With
no active role, only workspace entries are visible and a role-scoped write is
refused with `Cannot write role-scoped memory without an active role.`. A role never
sees another role's private entry, and `memory_read` of an invisible id answers
`Memory ID <id> not found.` rather than leaking content. Test 246 asserts this
cross-role boundary with a real dispatched fixture.

**Memory hygiene and cleanup policy.** Rolebox memory has **no delete tool**. Every
write and update made by this suite therefore uses one identifiable title prefix,
`[rolebox-tester self-test]`, and the tag `rolebox-tester-self-test`. Each body
searches for that entry first and updates it rather than adding a duplicate: the
suite keeps at most two entries — one workspace-scope self-test entry and one
role-scope self-test entry — and the run report states how many `self-test` entries
remain after the memory module (expected: two). No body stores secrets, credentials,
tokens, private hostnames or paths, user data, raw transcripts or transient task
progress, and no body treats a failed call as a successful save. Because update is
the only correction path, test 248 proves id stability and provenance merging
instead of relying on a delete-and-rewrite cycle.

**Han-script full-text search.** The memory index stores the original title, content
and tags plus the deduplicated two-character bigrams of every Han run, and a query
containing Han characters is rewritten to those bigrams joined with `OR`. A
two-character Chinese term therefore matches inside a longer phrase, while a query
with no Han characters is passed through with its ordinary tokenization and explicit
FTS syntax intact. Test 247 asserts both halves of that contract.

**Update provenance.** Both `memory_write` and `memory_update` record the current
session automatically and accept additional `source_sessions`; updates merge source
ids instead of replacing them and preserve the entry id. Test 248 asserts the merge
and the preserved id.

**Prompt delivery.** Memory is delivered as **tools plus prompt blocks**, never as a
`memory` function. The session-start `## Available memory` block renders a markdown
table with the columns `id`, `category`, `relevance`, `title` and `updated` on hosts
that assemble a role prompt (opencode 1.x/2.x, Pi, DSH). The per-turn
`## Relevant memory` block and the `## Session focus` block are **DSH-only**
prompt-assembly surfaces; a worker reports which blocks it actually received in test
249. Codex carries no role prompt, so the prompt-block bodies SKIP with
`capability_absent:role_prompt`.

### Test 59: Memory Write Tool

- **Module:** memory
- **Executor:** primary
- **Host gate:** `memory_write` registered (plus `memory_recall`/`memory_list` for
  the duplicate check).
- **SKIP:** `capability_absent:memory` when the family is not registered.

**Steps**

1. Search for an existing self-test entry: `memory_list(scope="both", limit=100,
   sort="recent")` and `memory_recall(query="[rolebox-tester self-test]",
   scope="both", limit=10)`.
2. If no workspace-scope self-test entry exists, call
   `memory_write(title="[rolebox-tester self-test] workspace knowledge",
   content="Rolebox tester self-test workspace entry; see the memory module bodies.",
   category="note", scope="workspace", tags=["rolebox-tester-self-test"],
   relevance="high")`.
3. If one already exists, do **not** write a second: call
   `memory_update(id="<existing id>", content="<same durable content>",
   tags=["rolebox-tester-self-test"])` instead and record that this run reused the
   entry.
4. Search again with the tag and confirm exactly one workspace self-test entry.

**Pass criteria**

1. The first call returns `Memory written. ID: <non-empty id>` (create path) or
   `Memory <id> updated.` (reuse path).
2. The response contains a non-empty id and the entry is discoverable by
   `memory_recall` and `memory_list`.
3. Exactly one workspace-scope entry carries the self-test tag after the step.
4. The content contains no secrets, credentials, private paths, transcripts or
   transient progress.
5. The evidence states whether this run created or reused the entry.

**Failure boundary.** A second workspace self-test entry, a missing confirmation, or
an empty id is a FAIL. Missing memory tools are the SKIP above.

### Test 60: Memory Recall Tool

- **Module:** memory
- **Executor:** primary
- **Host gate:** `memory_recall` registered.
- **SKIP:** `capability_absent:memory`.

**Steps**

1. Call `memory_recall(query="rolebox-tester self-test", scope="workspace",
   limit=5)`.
2. Call `memory_recall(query="[rolebox-tester self-test]", scope="both",
   limit=10, format="json")` and parse the result.
3. Call `memory_recall(query="definitely-absent-<run-id>", scope="workspace",
   limit=5)`.
4. On a host with an active role, recall the self-test tag with `scope="both"` and
   confirm the workspace entry appears.

**Pass criteria**

1. The scoped recall returns without error and includes the self-test entry.
2. The markdown previews show `ID:`, `Title:`, `Scope:`, `Category:` and
   `Relevance:` fields for the entry.
3. The JSON form parses and returns the full entry fields, not just a truncated
   preview.
4. The absent-term query returns `No memories found matching "<query>".` without an
   error — an empty result is not proof that no memory exists and must not throw.
5. The entry's scope is reported honestly (`workspace`).

**Failure boundary.** An error, or a recall that omits an entry that `memory_list`
shows, is a FAIL.

### Test 61: Memory List Tool

- **Module:** memory
- **Executor:** primary
- **Host gate:** `memory_list` registered.
- **SKIP:** `capability_absent:memory`.

**Steps**

1. Call `memory_list(scope="both", limit=20, sort="recent")`.
2. Call `memory_list(format="json", scope="workspace", limit=1)` and then
   `memory_list(format="json", scope="workspace", limit=1, offset=1)`.
3. Compare the two JSON pages.

**Pass criteria**

1. The markdown list returns without error and includes the self-test entry with
   title, category, relevance, updated timestamp, id, scope and source sessions.
2. Each JSON page parses; page 0 and page 1 contain different ids when at least two
   workspace entries exist, proving `limit` and `offset` paginate rather than
   repeat.
3. `sort="recent"`, `sort="relevance"` and `sort="accessed"` are accepted (at most
   two calls are needed to prove the argument is honored).
4. An empty workspace returns `No memories found.` without an error.

**Failure boundary.** Pagination returning the same row twice, or an ignored
`offset`, is a FAIL.

### Test 62: Memory Update Tool

- **Module:** memory
- **Executor:** primary
- **Host gate:** `memory_update` registered (plus `memory_recall`/`memory_read` for
  the read-back).
- **SKIP:** `capability_absent:memory`.

**Steps**

1. Find the self-test workspace entry id with `memory_recall` or `memory_list`.
2. Call `memory_update(id="<id>", content="<self-test content plus
   SELFTEST_UPDATE_<run-id>>", tags=["rolebox-tester-self-test"],
   relevance="high")`.
3. Read the entry back with `memory_read(id="<id>")`.
4. Call `memory_update(id="mem_absent_<run-id>", relevance="low")`.

**Pass criteria**

1. The successful update returns `Memory <id> updated.` and the id is unchanged.
2. The read-back contains the `SELFTEST_UPDATE_<run-id>` marker, the self-test tag,
   and relevance `high`; fields not passed to the update keep their previous values.
3. The unknown-id update returns `Memory ID <id> not found — nothing updated` and
   does not create an entry.
4. No duplicate self-test entry is created.

**Failure boundary.** An update that changes the id, drops the tag, or silently
succeeds for an unknown id is a FAIL.

### Test 63: Memory Injection Block

- **Module:** memory
- **Executor:** primary
- **Host gate:** a rendered role prompt carrying the `## Available memory` block
  (opencode 1.x/2.x, Pi, DSH), `memory.inject` enabled with `max_inject` greater
  than zero, and at least one memory entry at or above `min_relevance`.
- **SKIP:** `capability_absent:role_prompt` (Codex), or
  `capability_absent:memory` when no memory tools are registered. If
  `memory.inject` is disabled or `max_inject` is zero, the block is documented as
  absent and the body SKIPs with `memory_injection_disabled`.

**Steps**

1. Read the primary's rendered system prompt.
2. Locate the `## Available memory` heading.
3. Check the markdown table under it: the header row must be
   `| id | category | relevance | title | updated |`, followed by a separator row
   and at least one data row.
4. Confirm the self-test entry (from tests 59/62/246) appears as a row, and that its
   id matches the id returned by the tools.
5. Confirm the block's instruction line tells the agent to use `memory_recall` to
   search for specific memories.

**Pass criteria**

1. `## Available memory` is present exactly once.
2. The table header has the five columns in the documented order.
3. At least one row is present and the self-test entry is among them.
4. The instruction line mentioning `memory_recall` is present.
5. The block does not expose an entry outside the role's visibility: a role-scope
   entry belonging to another role never appears.

**Failure boundary.** A missing heading/table, wrong columns, or an entry the role
cannot see is a FAIL. A disabled injection setting is the SKIP above.

### Test 64: Memory Tool Availability (no `memory` Function)

- **Module:** memory
- **Executor:** primary
- **Host gate:** the `## Available functions` block or the role manifest is readable.
- **SKIP:** `capability_absent:role_prompt` (Codex has no role prompt) or
  `capability_absent:memory` when no memory tools are registered.

**Steps**

1. Read the function roster: the primary's `## Available functions` block and the
   `functions:` list in `role.yaml`. The declared roster is `test-all`, `transform`,
   `loop`, `state-machine`, `observe-probe`, `broken-dep`, `signal-probe`; a host may
   also list the builtin `plan` and `execute`.
2. Scan the roster for a function named `memory`.
3. Confirm the memory tools themselves are registered (`memory_write`,
   `memory_recall`, `memory_list`, `memory_read`, `memory_update`).
4. Confirm no `|memory|` activation is used anywhere in the run and no
   `functions/memory.md` exists.

**Pass criteria**

1. No function named `memory` appears in the available-functions list.
2. The memory tools are present and callable in this session.
3. The role's `functions:` list does not contain `memory`, and the seven declared
   functions above are the non-builtin entries.
4. No body, function or prompt in the run activates `|memory|`.

**Failure boundary.** A `memory` function in the roster, or a missing memory tool
family, is a FAIL for this body (a missing family is the SKIP above only when the
whole family is absent).

### Test 108: Memory Delivery — Tools + Injection Block (not a function)

- **Module:** memory
- **Executor:** primary
- **Host gate:** memory tools registered and a rendered role prompt with the
  `## Available memory` block.
- **SKIP:** `capability_absent:role_prompt` (Codex) or
  `capability_absent:memory`.

**Steps**

1. Verify the `## Available memory` block is present in the primary prompt with the
   five documented columns (the same check as test 63, re-read for this body).
2. Call `memory_list(scope="workspace", limit=5)` and confirm it returns without
   error.
3. Verify the function roster contains no `memory` entry.
4. Verify the delivery is tools plus injection: no `memory` function is activated
   and `functions/memory.md` does not exist.

**Pass criteria**

1. The `## Available memory` block exists and contains a self-test row with the
   required columns.
2. The memory tools are present and callable (`memory_list` returns).
3. No `memory` function appears in the roster.
4. This triple — block, tools, no function — proves memory is delivered by tools
   plus prompt blocks, matching the role configuration.

**Failure boundary.** Any missing leg of the triple is a FAIL; a missing role prompt
is the SKIP above.

### Test 245: Memory Read Round-Trip and Paginated List

- **Module:** memory
- **Executor:** primary
- **Host gate:** `memory_read`, `memory_list` and `memory_recall` registered.
- **SKIP:** `capability_absent:memory`; `pagination_insufficient` when fewer than two
  visible entries exist after the self-test fixtures are ensured (see step 3).

**Steps**

1. Find the workspace self-test entry id with `memory_recall(query=
   "[rolebox-tester self-test]", scope="both", limit=10)` and capture the id.
2. Call `memory_read(id="<id>")` (markdown) and `memory_read(id="<id>",
   format="json")`.
3. Ensure a second visible entry exists for pagination: if the role-scope self-test
   entry from test 246 does not exist yet, create it with
   `memory_write(title="[rolebox-tester self-test] role knowledge", content=
   "<durable role-only content with SELFTEST_ROLE_<run-id>>", category="note",
   scope="role", tags=["rolebox-tester-self-test"], relevance="high")`; otherwise
   reuse it. This is the only role-scope self-test entry the suite keeps.
4. Call `memory_list(format="json", scope="both", limit=1)` and
   `memory_list(format="json", scope="both", limit=1, offset=1)`.
5. Assert the two list pages have different ids and together include both
   self-test entries.

**Pass criteria**

1. The markdown read contains `ID:`, `Title:`, `Scope:`, `Category:`, `Relevance:`
   and `Source sessions:` lines and the full content, not a `...` preview.
2. The JSON read parses and returns the same id, title, scope, category, relevance,
   content and source_sessions; the content length equals the stored content.
3. Both paginated pages parse; page 0 and page 1 return different ids and no row is
   repeated within a page.
4. No second entry is created when the role-scope self-test entry already exists.
5. The run reports the current self-test entry count.

**Failure boundary.** A read that returns a truncated preview, a JSON payload that
disagrees with the markdown read, or pagination that repeats a row, is a FAIL. A
role-scope write refused because no role is active is a SKIP for the pagination
leg only (`role_scope_unavailable`).

### Test 246: Cross-Role Memory Scope Isolation

- **Module:** memory
- **Executor:** primary (declares the graph and grades the fixture; the fixture only
  produces evidence)
- **Host gate:** memory tools registered, `graph_declare`/`graph_status` available
  to the primary, and the `rolebox-tester--outcome-worker` fixture registered. Its
  `role.yaml` **grants `memory_read` and `memory_recall`** (and lowercase
  `write`/`edit`/`bash`), so it can read memory as a different role but cannot write.
- **SKIP:** `capability_absent:memory`; `capability_absent:graph_declarer` when the
  primary has no declarer face; `fixture_absent:outcome-worker` when the fixture is
  not registered; `role_scope_unavailable` when no role is active for the primary.

**Setup — two self-test entries with distinct sentinels.**

1. Ensure the workspace entry exists with
   `memory_write(title="[rolebox-tester self-test] workspace knowledge", content=
   "SELFTEST_SCOPE_<run-id> WORKSPACE_ONLY_TOKEN; shared workspace memory.", ...,
   scope="workspace", tags=["rolebox-tester-self-test"])` or update the existing one.
2. Ensure the role entry exists with
   `memory_write(title="[rolebox-tester self-test] role knowledge", content=
   "SELFTEST_SCOPE_<run-id> ROLE_ONLY_TOKEN; private to the active role.", ...,
   scope="role", tags=["rolebox-tester-self-test"])` or update the existing one.
   Capture both ids.
3. Confirm the primary sees both: `memory_list(scope="workspace")` includes the
   workspace entry and `memory_list(scope="role")` includes the role entry.

**Dispatch.**

4. Declare one version-3 graph with a single node whose agent is
   `rolebox-tester--outcome-worker`. The node prompt asks the worker to:
   - call `memory_recall(query="SELFTEST_SCOPE_<run-id>", scope="both", limit=10)`
     and report every returned id, title and scope;
   - call `memory_read(id="<role-entry id>")` and report the answer verbatim;
   - submit the node's declared outcome with `data` containing the recall rows and
     the read answer, and with the recall/read outputs as evidence.
5. End the turn after `graph_declare`. Do not poll; when the completion notification
   arrives, read `graph_status(graph_id="<id>", include_output=true,
   include_evidence=true)` once.

**Pass criteria**

1. The worker's recall reports the **workspace-scope** self-test entry (title and
   scope visible) and **never** reports the role-scope entry, its title, its content
   or its id.
2. The worker's `memory_read` of the role-entry id answers
   `Memory ID <role-entry id> not found.` — no content, title or metadata leaks.
3. The worker reports the memory tool names it holds: `memory_read` and
   `memory_recall`; it does not claim `memory_write` or `memory_update`.
4. The primary's own `memory_list(scope="role")` still shows the role entry, proving
   the entry exists and only the cross-role read was denied.
5. The graph's recorded outcome/evidence contains the worker's answer; the primary
   never substitutes its own read for the worker's evidence.

**Failure boundary.** Any role-scope title, content or id in the worker's report, a
successful cross-role read, or a worker claiming an ungranted tool is a FAIL. The
memory fixtures remain limited to the two tagged entries.

### Test 247: Han-Script FTS Recall

- **Module:** memory
- **Executor:** primary
- **Host gate:** `memory_write`, `memory_recall` and `memory_read` registered (the
  index must be the SQLite FTS index).
- **SKIP:** `capability_absent:memory`; `store_unavailable` if the memory store
  cannot be opened.

**Steps**

1. Update (do not duplicate) the workspace self-test entry so its content contains
   the Han phrase `蓝鲸哨兵记忆校验` and the Latin marker `HANFTSLATIN`.
2. Call `memory_recall(query="哨兵")` — a two-character sub-phrase of the longer
   Han run.
3. Call `memory_recall(query="记忆")` — a second two-character term from the same
   run.
4. Call `memory_recall(query="鲸鱼")` — a two-character term that does not occur
   as a bigram in the stored phrase.
5. Call `memory_recall(query="HANFTSLATIN")` — a Han-free Latin query.
6. Call `memory_recall(query="HANFTSLATIN OR 哨兵")` — a mixed query.
7. Call `memory_read` on the hit id and confirm the content is unchanged.

**Pass criteria**

1. The `哨兵` query returns the self-test entry: a two-character bigram matches
   inside the longer phrase.
2. The `记忆` query returns it too, and a different two-character query that is not
   in the phrase does not.
3. The Latin `HANFTSLATIN` query matches through the ordinary tokenizer.
4. The mixed query returns the entry without an FTS syntax error.
5. No duplicate entry was created; content and the `[rolebox-tester self-test]`
   title prefix are intact.

**Failure boundary.** A zero-match for a two-character term that is inside the
stored phrase, or a Latin query that changes behavior, is a FAIL.

### Test 248: Memory Update Provenance Merge

- **Module:** memory
- **Executor:** primary
- **Host gate:** `memory_update`, `memory_read` and `memory_recall` registered.
- **SKIP:** `capability_absent:memory`.

**Steps**

1. Read the workspace self-test entry with `memory_read(id="<id>", format="json")`
   and capture `id` and `source_sessions`.
2. Call `memory_update(id="<id>", content="<updated self-test content with
   SELFTEST_PROVENANCE_<run-id>>", source_sessions=["session-alpha",
   "session-beta"], relevance="high")`.
3. Read it back with `memory_read(id="<id>", format="json")`.
4. Repeat a no-op update (same id, no changed fields) if the tool accepts it.
5. Call `memory_update(id="mem_absent_<run-id>", title="should not exist")`.

**Pass criteria**

1. The updated entry keeps the **same id** and the same title prefix and tag.
2. `source_sessions` is the union of the previous list, `session-alpha`,
   `session-beta` and the current session; entries are deduplicated and no previous
   session is dropped.
3. The content and relevance changes are visible; fields not supplied are unchanged.
4. The second read's `updated_at` is not older than the first read's.
5. The unknown-id update returns `Memory ID <id> not found — nothing updated` and
   writes nothing.
6. No additional self-test entry is created.

**Failure boundary.** A new id, a replaced rather than merged source list, or a
successful update of an unknown id is a FAIL.

### Test 249: DSH Worker Recall and Session Focus Self-Report

- **Module:** memory
- **Executor:** primary
- **Host gate:** **DSH only** — the per-turn `## Relevant memory` block and the
  `## Session focus` block are assembled by DSH prompt assembly. Memory tools must be
  registered and a memory-capable worker fixture (`rolebox-tester--outcome-worker`
  with `memory_read`/`memory_recall`) must be dispatchable.
- **SKIP:** `capability_absent:dsh_prompt_blocks` on every non-DSH host;
  `capability_absent:memory` or `fixture_absent:outcome-worker` as applicable.

**Steps**

1. Ensure the workspace self-test entry exists and contains the sentinel
   `SELFTEST_RECALL_<run-id>` (tests 59/246 already maintain it; update, do not
   duplicate).
2. Declare one version-3 graph with a single node whose agent is
   `rolebox-tester--outcome-worker`. The node prompt contains at least two concrete
   search terms — the sentinel and the words `rolebox tester self-test` — and asks
   the worker to report, verbatim:
   - whether a `## Relevant memory` block is present, and if so which entries it
     lists (title/id/scope);
   - whether a `## Session focus` block is present, and if so its content; if it is
     absent, why (no focus entry and no `memory_write` grant is the expected
     documented state for this read-only worker);
   - the exact memory tool names it holds.
3. End the turn after `graph_declare`; read the recorded answer once from
   `graph_status` after the completion notification.
4. Grade the worker's self-report against the documented DSH rules.

**Pass criteria**

1. The worker reports `## Relevant memory` with the self-test entry that carries the
   sentinel (the deterministic tier runs first and does not require a model-cost
   query scout; `recall_mode` is `deterministic` in this role).
2. The worker reports the `## Session focus` state truthfully: a focus block with
   content is a PASS when a focus entry exists; an absent block is a PASS when the
   worker has no focus entry and no `memory_write` grant, and the worker names that
   documented reason.
3. The worker names only the memory tools it actually holds (`memory_read`,
   `memory_recall`), never `memory_write`, `memory_update` or `memory_list` unless
   its manifest grants them.
4. The worker confirms it sees only workspace-scope entries, consistent with test
   246.
5. No memory is written by the worker and no credential is printed.

**Failure boundary.** A missing `## Relevant memory` block for a matching prompt, a
reported tool the worker does not hold, or an invented focus block is a FAIL. A
non-DSH host is the SKIP above.

---

## Web

### Module contract

The web module is four tests: 127, 128, 129 and 256. The canonical tool names are
`web_search`, `web_read` and `web_fetch`; `list_mcp_resources` and
`read_mcp_resource` are exercised only when the host exposes MCP resource tools.

**Tool-name resolution.** On DSH the base profile may already own `web_search` and
`web_fetch`. Rolebox 2.2.0 probes the registry before registering and either
registers its tools under `rb_web_search`/`rb_web_fetch` or lets the session-scoped
host tool shadow them; a preset-based profile leaves the canonical names free.
Resolve the name that is actually registered and inspect its schema before calling:
`web_search` takes `query`, `source` and `max_results`, while a host-provided search
may take a different argument shape. The resolved name and schema are recorded as
evidence; an absent family is a SKIP, never a FAIL.

**Environment degradation.** Web tests are network-dependent. DNS failure,
connection refusal, timeout, TLS failure, a provider returning a transport error, or
MCP resource tools that are not exposed are **environmental SKIPs**
(`network_unavailable`, `mcp_resource_absent`), never FAILs. A present tool that
returns a malformed result, ignores a documented argument, or contradicts its
documented contract is a FAIL. Tests fetch only stable public pages
(`https://example.com`); they never fetch intranet, localhost, credential-bearing or
user-private URLs, and they never use the browser/computer tools as a fallback.

### Test 127: Web Search Tool

- **Module:** web
- **Executor:** primary
- **Host gate:** a `web_search`-family tool registered with a search schema.
- **SKIP:** `capability_absent:web` when the family is absent;
  `network_unavailable` when the call fails at the transport layer.

**Steps**

1. Resolve the registered search tool and its schema (canonical `web_search` or the
   `rb_`/host variant).
2. Call it with a benign query (`example.com` or `rolebox`) and `max_results=3`
   using the schema's own argument names.
3. Record whether the answer is a result list, a zero-result message, or a transport
   error.
4. If a `source` argument exists, call once with an explicit supported source to
   prove it is accepted.

**Pass criteria**

1. The call returns without a tool/schema error.
2. When results are returned, at least one has a title and a URL and the list has no
   more than `max_results` entries.
3. A reachable provider with zero hits returns the documented zero-result message
   (`## No Results Found` / `No results`), which is a PASS.
4. A transport failure (DNS, timeout, connection refused) is recorded as SKIP with
   `network_unavailable`, evidence = the error text; it is not a FAIL.
5. The optional `source` argument is accepted when present.

**Failure boundary.** A schema mismatch on the resolved tool, a result with no URL,
or an unhandled crash is a FAIL; an unreachable network is the SKIP above.

### Test 128: Web Read Tool

- **Module:** web
- **Executor:** primary
- **Host gate:** `web_read` (or the resolved rolebox variant) registered.
- **SKIP:** `capability_absent:web`; `network_unavailable`.

**Steps**

1. Call `web_read(url="https://example.com")`.
2. Call `web_read(url="https://example.com", engine="default")` if the argument is
   present, to prove the selector/engine options are accepted.
3. Record the returned markdown.

**Pass criteria**

1. The call returns without error and yields markdown-formatted content (heading,
   paragraph or link).
2. The content contains `Example Domain` (or the stable page's known text), proving
   the page was actually fetched and converted rather than fabricated.
3. A fetch failure is reported as a descriptive error string, not a raw crash; the
   body records it as SKIP `network_unavailable`.
4. Only the public example page is fetched; no private URL is attempted.

**Failure boundary.** A successful call that returns unrelated or fabricated content
is a FAIL; a transport failure is the SKIP above.

### Test 129: MCP Resource Listing

- **Module:** web
- **Executor:** primary
- **Host gate:** the host exposes `list_mcp_resources` (and optionally
  `read_mcp_resource`) for a configured MCP server.
- **SKIP:** `mcp_resource_absent` when the tools are not registered (the common
  Codex/opencode case and any DSH profile without an MCP server).

**Steps**

1. Confirm from the live roster that `list_mcp_resources` is registered.
2. Call `list_mcp_resources()`.
3. If a resource is listed, call `read_mcp_resource(uri="<uri>")` for one readable
   text resource and record a short excerpt; skip the read sub-check when no
   resource is exposed.
4. If no server is configured, accept the empty list or the documented "no MCP
   servers" message.

**Pass criteria**

1. The call returns without error.
2. The answer is either a list of resources (each with a `uri`, optionally `name`
   and `description`) or an explicit empty/no-server message.
3. When a readable text resource is listed and `read_mcp_resource` is registered, the
   read returns content for that uri.
4. The tools are exercised read-only; no MCP tool side effect is attempted.

**Failure boundary.** A registered `list_mcp_resources` that crashes, or resources
without a `uri`, is a FAIL. An unregistered family is the SKIP above.

### Test 256: Web Fetch Tool

- **Module:** web
- **Executor:** primary
- **Host gate:** `web_fetch` (or the resolved rolebox `rb_web_fetch` variant)
  registered with its `url`/`format` schema.
- **SKIP:** `capability_absent:web`; `network_unavailable` for the remote-fetch
  branch.

**Steps**

1. Call `web_fetch(url="https://example.com", format="markdown")` and record the
   markdown.
2. Call `web_fetch(url="https://example.com", format="text")` and confirm HTML tags
   are stripped from the body.
3. Call `web_fetch(url="https://example.com", format="html")` and confirm markup is
   returned (or, when the host's variant does not support `format`, record the
   schema it does support and exercise that).
4. Call the tool with a blocked local/private URL (for example
   `http://127.0.0.1:9/`) and record the SSRF refusal. This check does not need the
   network and must pass on every host.

**Pass criteria**

1. The markdown fetch returns content containing `Example Domain`.
2. `format="text"` returns visible text without HTML tags; `format="html"` returns
   markup; the formats differ as documented.
3. The blocked URL returns a `Blocked:` SSRF refusal, not a connection attempt or a
   crash. That requested refusal is a PASS.
4. `timeout`/`max_size` arguments are accepted when the schema declares them.
5. A remote transport failure is recorded as SKIP `network_unavailable`; the SSRF
   check still runs and passes independently.
6. Only public example URLs and the synthetic blocked URL are used; no private data
   is fetched or echoed.

**Failure boundary.** A successful fetch of a blocked private URL, a format that
returns the wrong representation, or a crash is a FAIL. An unreachable network is the
SKIP above.

---

## Report integration

- **Ids and ownership.** This file contributes exactly the 24 ids named in the
  module map. The catalog's grouped body-union check reads this file for the union
  session + memory + web = 8 + 12 + 4 = 24; a missing or extra heading fails that
  check.
- **Per-test rows.** Each body yields one row with the fields in the capability
  matrix. `PASS` requires observed evidence, `FAIL` requires a non-empty
  `error_detail`, and `SKIP` requires one stable `capability_reason`.
- **Environment split.** Session and memory are capability-gated; web adds the
  environmental `network_unavailable`/`mcp_resource_absent` SKIPs. Do not turn an
  absent capability or an unreachable network into a FAIL, and do not turn a present
  contradiction into a SKIP.
- **Memory artifact.** After the memory module, the report states how many
  `[rolebox-tester self-test]` entries remain (expected: one workspace entry and one
  role entry). The suite never deletes memories — no delete tool exists — so the
  count and the reused-entry policy are the cleanup evidence.
- **Fixture evidence.** For tests 246 and 249 the worker's `graph_submit_outcome`
  data is evidence, not a per-test row attributed to the fixture; the primary owns
  the rows and reads the recorded answer once.
- **No residue.** No body leaves temporary files in the repository or modifies a
  tracked file; the session-diff and web bodies clean up their probes.

Files in this document that share a body with the catalog:

| Body file | Modules | Id count |
|---|---|---|
| `references/session-memory-web-tests.md` (this file) | session, memory, web | 24 |
