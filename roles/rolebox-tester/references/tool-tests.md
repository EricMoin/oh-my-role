# Tool tests — rolebox-tester 7.0.0

This document owns the `### Test` bodies for **two** catalog modules:

- **tools-hashline** — 15 tests: `11, 12, 13, 14, 15, 16, 27, 28, 29, 122, 123, 137, 140, 180, 181`.
  The native command/file family (`bash`/`shell`/`exec`, `read`, `write`, `edit`, `grep`,
  `glob`, `todowrite`/`todo_write`, `working_directory`) and the two canonical hashline
  tools (`hashline_read`, `hashline_edit`).
- **permission** — 2 tests: `106, 141`. Role permission enforcement observed through the
  `restricted` directory fixture dispatched as a graph v3 node.

Seventeen bodies total. Every body is executed by the **declaring primary** (catalog
`executor: primary`); none of them is a runner module. Test 172 (`interactive_terminal`)
belongs to `references/runtime-tests.md` and is not repeated here. The catalog in
`references/test-catalog.md` is the authority for the id sets; this file is the authority
for the bodies.

The target is rolebox 2.2.0. Every body drives the **live tool roster**: a name printed in
this document, the role manifest, or the capability matrix is documentation, not proof of
registration. Resolve the native name first (see *Native tool-name resolution*), record it
in `evidence`, and only then call it. A family the session does not register is a **SKIP** with the body's
machine-readable reason, never a FAIL. A family that is present and contradicts its
documented contract is a FAIL with `error_detail`.

Contract sources for the assertions in this file (read-only reference checkout, rolebox
2.2.0): `src/hashline/hashline-read.ts` (header fields, window clamp, 2000-character
display truncation), `src/hashline/hashline-edit.ts` (per-file `version` and `hashWidth`
validation, duplicate-path rejection, `Error:`-prefixed diagnostics, success `version:`),
`src/hashline/path-resolve.ts` (workspace-relative resolution), `src/hashline/path-lock.ts`
(filesystem-identity duplicate keys), `src/hashline/fuzzy.ts` (`Ambiguous anchor` refusal),
`src/hashline/constants.ts` (anchor grammar `\d+#[A-Za-z0-9_-]{2,8}`, width 2–8),
`src/prompt/agent-config.ts` (role `permission` → host agent ruleset),
`src/platform/adapters/opencode2/agents.ts` (v2 permission rules),
`src/platform/adapters/dsh/agent-registrar.ts` (DSH subagent `.tools` is catalog data, not
an enforcement request), and `src/platform/adapters/dsh/role-tool-policy.ts` (DSH role
guards cover the rolebox-owned `computer_*`/`browse_*` families, not the host's native
command/file tools). Re-read the installed version when a probe disagrees; the live probe
wins.

## How to read a body

Each body has the same fields:

- **Executor** — the lane that runs it (always `primary` here).
- **Native tool names** — the candidates and the resolution rule, taken from
  `references/host-capability-matrix.md` § *Tool-name resolution*.
- **SKIP gate** — the exact capability condition and the `snake_case` reason code. A body
  whose gate fires is `SKIP`, not `FAIL`, and never silently disappears from the denominator.
- **Steps** — the actions in order. Tool calls use the resolved native name.
- **Pass criteria** — the observed facts that make the row `PASS`.
- **Cleanup** — removal of every probe file and restoration of any mutated state.
- **Evidence** — what to quote into the per-test `evidence` field (never a fabricated
  observation).

Report each body with the stable per-test record from the capability matrix
(`id`, `name`, `status`, `evidence`, `error_detail`, `duration_ms`, `executor`,
`capability_reason`). Do not run a body against a different role's installation, and do
not treat a name printed in this file as proof that the tool is registered.

## Native tool-name resolution

Resolve every name from the live roster, then use the resolved name consistently for the
whole body. The candidates are documented expectations, not capabilities.

| Capability | Candidate names | Resolution rule | Bodies |
|---|---|---|---|
| Command execution | `bash`, `shell`, `exec` | Use the registered native command tool; prefer a per-call `workdir`/`cwd` argument over a persistent shell `cd`. | 11, 140, 106 |
| File read | `read` | Host native read tool. | 12, 13, 15, 28, 29, 123, 180, 181 |
| File write | `write` | Host native write tool. | 12, 15, 27, 28, 29, 123, 140, 180, 181, 141 |
| File edit | `edit`, `apply_patch` | Use `edit` where registered; Codex may expose `apply_patch`, whose patch syntax replaces the edit call. Never simulate an edit with a shell redirect when an edit tool exists. | 15 |
| Text search | `grep` | Host grep tool; if the host only has shell, SKIP `13` (do not hand-roll grep and call it a tool test). | 13 |
| File discovery | `glob` | Host glob tool; do not substitute `find`/`ls` output. | 14 |
| Todo list | `todowrite` (opencode 1.x/2.x), `todo_write` (DSH), host-specific on Pi/Codex | Resolve from the roster and record the exact name in `evidence`. A missing todo tool SKIPs `16` and `137`; it never FAILs them. | 16, 137 |
| Working directory | `working_directory` (DSH), otherwise per-command `cwd`/`workdir` | Use the tool when present; otherwise pass the directory per command. Restore a changed session directory before the body ends. | 11, 180 |
| Hashline read/edit | `hashline_read`, `hashline_edit` | Canonical names on every host that registers the family. | 27, 28, 29, 122, 123, 140, 180, 181 |
| Graph declarer | `graph_declare`, `graph_status` | Declaring primary only; a worker never receives them. | 106, 141 |
| Restricted fixture | agent id `rolebox-tester--restricted` | Dispatch target only; never an executor and never the source of a report row. | 106, 141 |

A host-specific alias (for example a collision-renamed tool) is resolved by the live
schema, not by string matching this table. If two candidates exist, prefer the rolebox
canonical name and record the alias in `evidence`.

## Sandbox, cleanup and non-pollution

Every body runs in a disposable sandbox and leaves no trace.

- **Sandbox root.** `<workspace>/.rolebox/test-reports/tmp/tests/rolebox-tester/`. If the
  workspace `.rolebox` directory is not writable, use `$TMPDIR/tests/rolebox-tester/`.
  Per-test directory: `<sandbox-root>/<id>-<slug>/`. Record the resolved absolute sandbox
  root in the run's capability record; `180` needs the workspace spelling and SKIPs when
  the fallback was used.
- **All temporary files live under the sandbox root.** No test writes to `/tmp` directly,
  to the rolebox checkout, to the oh-my-role checkout, or to any tracked repository file.
  Read-only operations (`read`, `grep`, `glob`, `hashline_read`) against the role tree are
  allowed because they change nothing.
- **Cleanup is part of the body.** After the last pass criterion, remove the body's
  per-test directory (and the sandbox root when it is empty). Verify with `glob` or
  `read` that the path is gone. A body that fails still cleans up its probes in the same
  step; record a cleanup failure as a FAIL of that body.
- **Hashline edits restore the original file.** A hashline-edited probe is either (a) a
  file the body created in the sandbox, which is deleted at cleanup, or (b) a copy of an
  existing file, in which case the body saves the exact original bytes before editing,
  restores them afterwards, and proves restoration with a fresh `hashline_read` whose
  `version` equals the pre-edit version. No body edits a tracked file in place.
- **Delete order.** Files, then the per-test directory, then the sandbox root when empty.
  Do not delete `.rolebox/test-reports/` itself: the report artifact and the human summary
  live there.
- **Todos are session state, not files.** Clear the test todo list with the host's clearing
  call when the schema accepts it; otherwise leave the items visible and say so in
  `evidence`. Never leave a pending item that looks like real work.
- **Report paths use one run id.** The report artifact and the human summary are written
  under `.rolebox/test-reports/`; the tool sandbox is a sibling `tmp/` tree. A cleanup
  wildcard must never match the report artifacts.

Cleanup itself uses only the resolving family (read/glob or the command tool) and is
read-only until the delete step. If the host provides no delete path (no command tool and
no writable file family), the body SKIPs at its gate instead of leaving an artifact.

## tools-hashline module (15 bodies)

### Test 11: Native command execution

**Executor**: primary.

**Native tool names** (resolved from the live roster per `references/host-capability-matrix.md` § *Tool-name resolution*): resolve the command tool from `bash` / `shell` / `exec` and the
working-directory mechanism from `working_directory` or a per-command `cwd`/`workdir`
argument. Record both resolved names; the test asserts tool behavior, not a name.

**SKIP gate**: no command tool is registered → `capability_absent:command`. Do not
substitute a file tool for a command execution; that is a different capability.

**Steps**:

1. Resolve the command tool and the working-directory mechanism. Record the session's
   current working directory if the host has a `working_directory` tool, so it can be
   restored.
2. Create the sandbox directory `<sandbox-root>/11-bash/` through the command tool, using
   the sandbox root as the working directory.
3. Run `echo BASH_TOOL_OK` and `pwd` with the sandbox directory as the working directory.
   If the command tool has no per-call directory argument, set `working_directory` to the
   sandbox for this step and restore the recorded directory immediately afterwards.
4. Capture the exit code, stdout and the reported working directory.

**Pass criteria**:

1. The command exits 0 (or the tool reports success when it does not expose an exit code).
2. Stdout contains `BASH_TOOL_OK` exactly once.
3. `pwd` reports the sandbox directory, proving the working-directory mechanism took
   effect; a different directory means the command ran in an unexpected place and the
   body FAILs.
4. No file was created outside the sandbox.

**Cleanup**: remove `<sandbox-root>/11-bash/`; restore the session working directory if it
was changed; verify the sandbox subdirectory is gone.

**Evidence**: resolved command name, the command line, exit code, the marker, the reported
`pwd`, and the cleanup check.

### Test 12: Write and read round-trip

**Executor**: primary.

**Native tool names** (resolved from the live roster per `references/host-capability-matrix.md` § *Tool-name resolution*): resolve `write` and `read` from the live roster. Record both; the
`WRITE_READ_OK` marker is a capability smoke test, so if either family is absent the
round-trip cannot be proven.

**SKIP gate**: no `write` tool → `capability_absent:write`; no `read` tool →
`capability_absent:read`. Either absence SKIPs the whole body, because a one-sided
round-trip proves nothing.

**Steps**:

1. Create `<sandbox-root>/12-write-read/probe.txt` with the write tool; content is exactly
   two lines: `WRITE_READ_OK` and `SECOND_LINE_OK`, each terminated by a newline.
2. Read the file back with the read tool.
3. Compare the payload lines in order. Host read output may prefix line numbers; strip the
   host's display prefix and compare the content, not the numbering.

**Pass criteria**:

1. The write call returns success and names the sandbox path.
2. The read result contains both lines in that order, with no missing or extra non-empty
   content.
3. The file is inside the sandbox; no other path was written.

**Cleanup**: remove `<sandbox-root>/12-write-read/`; verify it is gone.

**Evidence**: resolved write/read names, the path, the two payload lines, and the cleanup
check.

### Test 13: Text search with grep

**Executor**: primary.

**Native tool names** (resolved from the live roster per `references/host-capability-matrix.md` § *Tool-name resolution*): resolve `grep` from the live roster. A host that exposes only shell
search has no grep tool; do not hand-roll one and call it this test.

**SKIP gate**: no `grep` tool → `capability_absent:grep`. The absence of the command or
file family does not change this gate; it is grep-specific.

**Steps**:

1. Create `<sandbox-root>/13-grep/target.md` containing a line `GREP_TOOL_OK` and
   `<sandbox-root>/13-grep/other.md` containing only `GREP_OTHER_TEXT`.
2. Call the grep tool with pattern `GREP_TOOL_OK` and path `<sandbox-root>/13-grep/`.
3. Record every matched path and line number from the result. Host output shapes vary, so
   assert the named file and marker, not a fixed formatting template.

**Pass criteria**:

1. The grep call succeeds and reports a match in `target.md`.
2. The match names the marker `GREP_TOOL_OK` (and the line number when the tool reports
   one).
3. `other.md` is not reported as a match.
4. The search did not modify either file; a read after the grep still shows the original
   content.

**Cleanup**: remove `<sandbox-root>/13-grep/`; verify it is gone.

**Evidence**: resolved grep name, pattern, path, matched file/line, and the negative result
for `other.md`.

### Test 14: File discovery with glob

**Executor**: primary.

**Native tool names** (resolved from the live roster per `references/host-capability-matrix.md` § *Tool-name resolution*): resolve `glob` from the live roster. Host glob semantics differ for
bare basenames (some search recursively, some only at the root), so this body uses
patterns with an explicit directory component and never asserts a bare `*.md` count.

**SKIP gate**: no `glob` tool → `capability_absent:glob`.

**Steps**:

1. Create the fixture tree `<sandbox-root>/14-glob/` with `alpha.md`, `beta.md`,
   `notes.txt` and `nested/delta.md`.
2. Glob `alpha*.md` with path `<sandbox-root>/14-glob/`.
3. Glob `*.txt` with the same path.
4. Glob `nested/*.md` with the same path.
5. For each result, record the returned paths and check they resolve inside the sandbox.

**Pass criteria**:

1. `alpha*.md` returns `alpha.md` and does not return `beta.md` or `notes.txt`.
2. `*.txt` returns `notes.txt`.
3. `nested/*.md` returns `nested/delta.md`.
4. Every returned path is under the sandbox root; no result escapes to the workspace or
   the role tree.

**Cleanup**: remove `<sandbox-root>/14-glob/`; verify it is gone.

**Evidence**: resolved glob name, the three patterns, the returned path sets, and the
containment check.

### Test 15: File edit with the native edit tool

**Executor**: primary.

**Native tool names** (resolved from the live roster per `references/host-capability-matrix.md` § *Tool-name resolution*): resolve `edit` (or `apply_patch` on a host that exposes it) and
`read` and `write` for the setup and read-back, per the capability matrix. If only
`apply_patch` exists, use its documented patch syntax; do not fake an edit with `write` or
a shell redirect.

**SKIP gate**: no edit-capable tool → `capability_absent:edit`. If the write family is
absent, create the probe with the command tool; if neither can create it →
`capability_absent:write`. A missing `read` read-back can use `hashline_read` instead; if
neither can display the result, record that and SKIP the read-back sub-check rather than
claiming it.

**Steps**:

1. Create `<sandbox-root>/15-edit/probe.txt` with the write tool; content is exactly
   `edit me` / `keep me`, one per line.
2. Call the edit tool to replace `edit me` with `EDIT_TOOL_OK`, leaving `keep me` intact.
3. Read the file back with the native `read` tool (or `hashline_read` when `read` is
   absent).

**Pass criteria**:

1. The edit call succeeds (or, for `apply_patch`, the patch applies cleanly).
2. The read-back shows `EDIT_TOOL_OK` on line 1 and `keep me` on line 2, in that order.
3. No other line changed and the file length is consistent with a single-line
   replacement.

**Cleanup**: remove `<sandbox-root>/15-edit/`; verify it is gone.

**Evidence**: resolved edit name (and patch flavor), the before/after content, and the
cleanup check.

### Test 16: Todo creation and completion

**Executor**: primary.

**Native tool names** (resolved from the live roster per `references/host-capability-matrix.md` § *Tool-name resolution*): resolve the todo tool from `todowrite` (opencode 1.x/2.x) and
`todo_write` (DSH), or the host-specific name on Pi/Codex, per the capability matrix.
Record the exact resolved name; the body must never assume `todowrite`.

**SKIP gate**: no todo tool → `capability_absent:todo`. Handle this SKIP separately from
the `sync_todos` observe probe, which is a function-state concern, not this module.

**Steps**:

1. Call the todo tool with one item: content `[rolebox-tester self-test] tool-16`,
   status `pending`, plus only the optional fields the live schema accepts (`priority`
   exists on opencode, not everywhere).
2. Call it again with the same item at status `completed`.
3. Read the resulting list from the call result (or a follow-up read if the tool exposes
   one).

**Pass criteria**:

1. Both calls are accepted without error.
2. The final list shows the item at `completed`.
3. The item is identifiable as a self-test by its `[rolebox-tester self-test]` prefix, so a
   leftover can be recognized and cleared.

**Cleanup**: clear the test list if the tool accepts an empty array (or an explicit clear
action); otherwise leave the completed item and state in `evidence` that it is session
state, not a file. Never leave a `pending` self-test item.

**Evidence**: resolved todo name, both call results, and the final item state.

### Test 27: Hashline read — basic annotated read

**Executor**: primary.

**Native tool names** (resolved from the live roster per `references/host-capability-matrix.md` § *Tool-name resolution*): resolve `hashline_read` and `write` (for the probe). The family is
canonical on every host that registers hashline; a missing `hashline_read` is a SKIP, not
a reason to fall back to `read` output.

**SKIP gate**: no `hashline_read` → `capability_absent:hashline`. A missing `write` setup
path can be replaced by the command tool; if neither can create the probe, record the
setup gap and SKIP with `capability_absent:write`.

**Steps**:

1. Create `<sandbox-root>/27-read/probe.txt` with exactly three lines: `line one`,
   `line two`, `line three`, each newline-terminated.
2. Call `hashline_read` with the absolute probe path.
3. Parse the header and annotated lines from the returned text.

**Pass criteria**:

1. The result begins with a `version:` field whose value is 64 lowercase hexadecimal
   characters (SHA-256).
2. A numeric `hashWidth:` field is present and is in the documented 2–8 range.
3. `totalLines: 3` is reported.
4. Exactly three annotated lines are returned in `LINE#HASH|content` form, with anchors
   matching `^3#[A-Za-z0-9_-]{2,8}\|` (the grammar allows 2–8 hash characters; the actual
   width is the reported `hashWidth`) and the original line text after the `|`.
5. `startLine`/`endLine` are absent for a full read (they are window-only fields).

**Cleanup**: remove `<sandbox-root>/27-read/`; verify it is gone.

**Evidence**: the header fields, the three anchor lines, and the cleanup check.

### Test 28: Hashline edit — read-then-edit round-trip

**Executor**: primary.

**Native tool names** (resolved from the live roster per `references/host-capability-matrix.md` § *Tool-name resolution*): resolve `hashline_read`, `hashline_edit`, `read` and `write` per the
capability matrix. The edit uses the exact anchors and the per-file `version` from the
read; anchors are copied, never recomputed by hand.

**SKIP gate**: no `hashline_read` or no `hashline_edit` →
`capability_absent:hashline`. A missing native `read` read-back can use `hashline_read`
instead; if neither can display the post-edit content, record that and SKIP the read-back
sub-check rather than claiming it.

**Steps**:

1. Create `<sandbox-root>/28-edit/probe.txt` with exactly `apple`, `banana`, `cherry`,
   `durian`, `elderberry`, one per line.
2. Call `hashline_read` on the probe and keep its `version`, line 3 anchor and `hashWidth`.
3. Call `hashline_edit` with one file entry: the probe path, the read's `version`, the
   read's `hashWidth` when the schema accepts it, and one `replace` edit targeting the
   line-3 anchor with `lines: ["CITRUS"]`.
4. Read the probe back with the native `read` tool (or `hashline_read` when `read` is
   absent).

**Pass criteria**:

1. The read returns three metadata fields (`version`, `hashWidth`, `totalLines: 5`) and
   five annotated lines.
2. The edit call returns success: a leading `version:` line, a `files:` block naming the
   probe, a `diff`, and `additions`/`deletions` counts.
3. The read-back shows line 3 as `CITRUS` and lines 2, 4 and 5 unchanged.
4. The edit was accepted with the read's `version` token, proving the optimistic
   concurrency input was wired through (a stale token would have produced the version
   mismatch diagnostic from Test 29).

**Cleanup**: delete `<sandbox-root>/28-edit/`. If the body was run against a copy of an
existing file, restore the saved original bytes and verify the restored `hashline_read`
`version` equals the pre-edit version. Verify the directory is gone.

**Evidence**: the pre-edit version (first 12 characters are enough in prose, but quote the
full value in machine evidence), the edit result's new `version:`, the post-edit content,
and cleanup.

### Test 29: Hashline edit — stale-version guard

**Executor**: primary.

**Native tool names** (resolved from the live roster per `references/host-capability-matrix.md` § *Tool-name resolution*): resolve `hashline_read`, `hashline_edit` and `write` (or the
command tool) for the external mutation. The mutation must be external to hashline — a
`hashline_edit` cannot be used to create the staleness.

**SKIP gate**: no `hashline_read` or no `hashline_edit` →
`capability_absent:hashline`. If no write/edit/command tool can mutate the probe between
the read and the edit, the stale state cannot be constructed → SKIP with
`capability_absent:write`.

**Steps**:

1. Create `<sandbox-root>/29-stale/probe.txt` with `alpha`, `beta`, `gamma`, `delta`, one
   per line.
2. `hashline_read` it and keep the `version` and the line-1 anchor.
3. Externally overwrite the file through the native write tool (or the command tool) with
   `alpha`, `beta`, `MODIFIED`, `delta`.
4. Call `hashline_edit` with the old `version` from step 2 and the old line-1 anchor,
   asking to replace line 1 with `MODIFIED_ALPHA`.
5. Read the file back with the native `read` tool (or `hashline_read`).
6. Call `hashline_read` again to record the new version.

**Pass criteria**:

1. Step 2 returns a 64-hex `version` and annotated lines.
2. Step 4 is refused: the result begins with `Error:` and contains a version/staleness
   diagnostic — the documented text is
   `File version mismatch for <path>: expected <old>, got <new>. Re-read the file with hashline_read to get the current version.`
   (the batch wrapper prefixes the documented `Error: Edit failed for some files.`). A
   silent success is a FAIL.
3. The file still contains `MODIFIED` from step 3 and not `MODIFIED_ALPHA`.
4. Step 6 reports a different `version` from step 2, proving the read model sees the
   external write and the guard rejected against the stale token.

**Cleanup**: remove `<sandbox-root>/29-stale/`; verify it is gone.

**Evidence**: the old and new versions, the verbatim refusal prefix, the preserved
content, and cleanup.

### Test 122: Hashline read — windowed read and EOF clamp

**Executor**: primary.

**Native tool names** (resolved from the live roster per `references/host-capability-matrix.md` § *Tool-name resolution*): resolve `hashline_read` and the probe writer per the capability
matrix. `offset`/`limit` are the canonical argument names; do not translate them.

**SKIP gate**: no `hashline_read` → `capability_absent:hashline`.

**Steps**:

1. Create `<sandbox-root>/122-window/probe.txt` with ten lines `line01` … `line10`.
2. Call `hashline_read` with `offset: 3, limit: 4`.
3. Call `hashline_read` with `offset: 999, limit: 4`.
4. Parse each result's header and annotated lines.

**Pass criteria**:

1. Both calls succeed.
2. The first window contains exactly lines 3, 4, 5, 6 — four annotated lines, no lines
   1, 2 or 7–10.
3. The first result contains `startLine: 3`, `endLine: 6` and `totalLines: 10`.
4. The second (past-EOF) window clamps at the end: `startLine: 10`, `endLine: 10`, exactly
   one annotated line (line 10), and no fabricated out-of-range lines. `endLine` is never
   less than `startLine`.

**Cleanup**: remove `<sandbox-root>/122-window/`; verify it is gone.

**Evidence**: both windows' header fields and anchor line numbers, and cleanup.

### Test 123: Hashline edit — batch operations and snapshot semantics

**Executor**: primary.

**Native tool names** (resolved from the live roster per `references/host-capability-matrix.md` § *Tool-name resolution*): resolve `hashline_read`, `hashline_edit`, `read` and `write` per the
capability matrix. Both edits use anchors and one `version` from a single read.

**SKIP gate**: no `hashline_read` or no `hashline_edit` →
`capability_absent:hashline`.

**Steps**:

1. Create `<sandbox-root>/123-batch/probe.txt` with `alpha`, `beta`, `gamma`, `delta`,
   `epsilon`, one per line.
2. `hashline_read` it and keep the `version` and the line-2 and line-4 anchors.
3. Call `hashline_edit` with two `replace` operations in one `edits` array: line 2 →
   `BRAVO`, line 4 → `DELTA_REPLACED`. Both operations reference the original snapshot.
4. Read the file back with the native `read` tool (or `hashline_read` when `read` is
   absent).
5. Call `hashline_read` again and compare its `version` with the edit result's
   `version:`.

**Pass criteria**:

1. The edit is accepted and reports success for the file.
2. The read-back shows line 2 `BRAVO`, line 4 `DELTA_REPLACED`, and lines 1, 3, 5
   unchanged (`alpha`, `gamma`, `epsilon`).
3. Both operations shared the single pre-edit `version`, proving snapshot semantics (a
   second read was not required between operations).
4. The fresh read's `version` equals the edit-returned `version`, so a chained edit needs
   no re-read.
5. The result's diff covers two changes and the file is not replaced wholesale.

**Cleanup**: delete `<sandbox-root>/123-batch/`; restore the original bytes if the probe
was a copy of an existing file; verify cleanup.

**Evidence**: the pre-edit version, the edit's returned version, the fresh-read version,
the five lines after the edit, and cleanup.

### Test 137: Todo lifecycle across the host vocabulary

**Executor**: primary.

**Native tool names** (resolved from the live roster per `references/host-capability-matrix.md` § *Tool-name resolution*): resolve the todo tool (`todowrite` on opencode 1.x/2.x,
`todo_write` on DSH, host-specific on Pi/Codex) and record the exact name. The status
vocabulary is host-specific: resolve it from the live schema, not from this document.

**SKIP gate**: no todo tool → `capability_absent:todo`.

**Steps**:

1. Record the accepted status values from the live tool schema. Documented baseline:
   opencode uses `pending`, `in_progress`, `completed`, `cancelled`; DSH uses `pending`,
   `in_progress`, `completed` (no `cancelled`).
2. Create three pending items with the `[rolebox-tester self-test]` prefix:
   `tool-137-alpha` (high), `tool-137-beta` (medium), `tool-137-gamma` (low) — using only
   fields the live schema accepts.
3. Call 2: alpha `in_progress`, beta pending, gamma pending.
4. Call 3: alpha `completed`, beta `in_progress`, gamma pending.
5. Call 4: alpha `completed`, beta `completed`, gamma at the host's terminal cancellation
   status (`cancelled` where the schema accepts it; otherwise leave gamma `pending` and
   record that the host vocabulary has no cancellation state).
6. Read the final list.

**Pass criteria**:

1. Every call the schema accepts is accepted without error.
2. Final state: alpha `completed`, beta `completed`; gamma `cancelled` where supported,
   otherwise gamma remains `pending` and the vocabulary limitation is quoted in `evidence`.
3. The accepted transitions include `pending → in_progress`, `in_progress → completed`,
   and (where supported) `pending → cancelled`.
4. A status outside the live enum is rejected; do not probe it by inventing success — only
   assert it if the schema documents the rejection.

**Cleanup**: clear the test list if the tool accepts an empty array/clear action; otherwise
remove every item from `pending`/`in_progress` by completing it, leaving nothing that
looks like real work. Record the residual state if the host has no clear call.

**Evidence**: resolved todo name, the observed status vocabulary, each call's result, the
final list, and cleanup.

### Test 140: Hashline read — large-file `totalLines`

**Executor**: primary.

**Native tool names** (resolved from the live roster per `references/host-capability-matrix.md` § *Tool-name resolution*): resolve `hashline_read` and a probe creator (`write`, or the command
tool with a deterministic generator). Record both; the read is the tested tool, the
creator is setup.

**SKIP gate**: no `hashline_read` → `capability_absent:hashline`. If neither `write` nor
the command tool can create the 50-line probe, SKIP with `capability_absent:write`.

**Steps**:

1. Create `<sandbox-root>/140-large/probe.txt` with 50 lines `line_001` … `line_050`.
   Prefer the command tool when available (for example a `seq`/`printf` generator); the
   write tool with an explicit 50-line payload is the fallback.
2. Call `hashline_read` with `limit: 5` (no offset, or `offset: 1`).
3. Parse the header and the returned annotated lines.

**Pass criteria**:

1. The read succeeds and returns exactly five annotated lines: 1–5.
2. `totalLines: 50`, proving the full file size is reported for a windowed read.
3. `version:` is present as 64 hex characters and `hashWidth:` is numeric.
4. `hashWidth` is 2, the documented small-file width for a file at or below 1000 lines.
5. Lines 6–50 do not appear in the output.

**Cleanup**: remove `<sandbox-root>/140-large/`; verify it is gone.

**Evidence**: the header fields, the five anchors, the count of absent lines, and cleanup.

### Test 180: Hashline — workspace-relative path resolution

**Executor**: primary.

**Native tool names** (resolved from the live roster per `references/host-capability-matrix.md` § *Tool-name resolution*): resolve `hashline_read`, `hashline_edit`, `read`, `write` and the
working-directory mechanism (`working_directory` or a per-command `cwd`/`workdir`) per the
capability matrix. The relative spelling is derived from the session workspace, never from
the host process cwd.

**SKIP gate**: no `hashline_read` or no `hashline_edit` →
`capability_absent:hashline`. If the sandbox could only be created under `$TMPDIR`
because the workspace is not writable, the relative spelling cannot exist →
`workspace_unwritable`.

**Steps**:

1. Record the session workspace root (the directory the host resolves relative tool paths
   against). Confirm the sandbox path is under it: it must be the default
   `<workspace>/.rolebox/test-reports/tmp/tests/rolebox-tester/` root, not `$TMPDIR`.
2. Write the probe through its **absolute** sandbox path:
   `<sandbox-root>/180-relative/probe.txt`, content `probe alpha`, `probe beta`,
   `probe gamma`.
3. Call `hashline_read` with the **workspace-relative** spelling of the probe, for example
   `.rolebox/test-reports/tmp/tests/rolebox-tester/180-relative/probe.txt` when the
   session workspace is the repository root.
4. Call `hashline_read` with the absolute path to the same file.
5. Call `hashline_edit` with the relative spelling, using the version and line-2 anchor
   from step 3, replacing `probe beta` with `PROBE_BETA_REL`.
6. Read the file back through its absolute path with the native `read` tool.
7. Call `hashline_read` on a relative spelling that exists nowhere under the workspace,
   for example `<relative-sandbox>/../180-missing/probe.txt`.

**Pass criteria**:

1. Step 3 succeeds and returns `LINE#HASH|content` lines plus a 64-hex `version`.
2. Steps 3 and 4 report the same `version` and `totalLines`, proving both spellings resolve
   to the same physical file (workspace-relative, not cwd-relative).
3. Step 5 succeeds and step 6 shows line 2 as `PROBE_BETA_REL` with lines 1 and 3
   preserved.
4. Step 7 returns `Error: File not found:` followed by the **resolved absolute** path
   (workspace + missing relative spelling), not the bare relative spelling.
5. No file is created outside the sandbox by the relative operations.

**Cleanup**: delete `<sandbox-root>/180-relative/`; if the probe was copied from an
existing file, restore the saved bytes and verify with `hashline_read`; verify the
directory and the missing-path probe are gone.

**Evidence**: the workspace root, the two spellings, both read versions, the relative edit
and absolute read-back, the missing-path error verbatim, and cleanup.

### Test 181: Hashline — failure diagnostics, duplicate aliases and anchor widths

**Executor**: primary.

**Native tool names** (resolved from the live roster per `references/host-capability-matrix.md` § *Tool-name resolution*): resolve `hashline_read`, `hashline_edit`, `write`, `read` and, for
the symlink alias variant, the command tool per the capability matrix. Every failing call
is asserted by its returned diagnostic; nothing is swallowed.

**SKIP gate**: no `hashline_read` or no `hashline_edit` →
`capability_absent:hashline`. The symlink and collision sub-checks are conditional (see
below); their unavailability is recorded, not invented.

**Steps**:

1. **Failure prefix and file naming.** Call `hashline_edit` on a path that does not exist
   (for example `<sandbox-root>/181-diag/absent-probe.txt`) with an arbitrary version and
   anchor, or call `hashline_read` on a missing path. Capture the verbatim result prefix
   and the path it names.
2. **Duplicate alias folding, zero writes.** Create
   `<sandbox-root>/181-diag/alias-probe.txt` with `alias one` / `alias two`, read it, then
   call `hashline_edit` with the same physical file named twice in one batch: once as
   `.../alias-probe.txt` and once as `..././alias-probe.txt`, both with the same read
   `version` and line anchors. Read the file afterwards.
3. **Symlink alias (variant of step 2).** On a host where the command tool can create a
   symlink, create `alias-link.txt` pointing at `alias-probe.txt` and send the real path
   and the symlink path in one batch. (On Windows or a host that refuses symlink creation,
   record this variant as `not_exercised: symlink_unavailable`; step 2 already proves
   duplicate folding.)
4. **Anchor width acceptance.** On the 2-line alias probe, call `hashline_edit` with
   `hashWidth: 6` (inside the schema's 2–8 range but different from the computed width 2)
   and capture the diagnostic; then call it with `hashWidth: 9` (outside the schema) and
   capture the refusal. Read the file afterwards.
5. **Ambiguous fuzzy anchor (conditional).** A width-2 hash collision inside the ±10-line
   fuzzy window is the only deterministic trigger for the `Ambiguous anchor` refusal. If a
   collision fixture can be constructed, submit an anchor that matches two
   content-different candidate lines and assert the refusal; if no collision can be
   constructed in the environment, record the sub-check as `not_exercised: collision
   fixture not constructible` in `evidence`. Never fabricate the diagnostic.

**Pass criteria**:

1. Step 1's result begins with `Error:` and names the affected file (for a missing read,
   the documented text is `Error: File not found: <resolved path>`).
2. Step 2 is rejected before any write: the result begins
   `Error: Duplicate filePath in edit batch:`, names both spellings, and a subsequent read
   shows `alias one` / `alias two` unchanged.
3. Step 3, when exercised, folds the symlink by filesystem identity and rejects the batch
   the same way; the file is unchanged. When not exercised, the reason is recorded.
4. Step 4: `hashWidth: 6` passes argument validation and yields
   `hashWidth mismatch for <path>: expected 6 from read output, computed 2 from file`
   inside an `Error: Edit failed for some files.` result; `hashWidth: 9` is refused as
   out of range by argument validation (the schema bounds are 2–8). Neither call writes:
   the file is unchanged after both.
5. Step 5, when exercised, refuses with a message containing `Ambiguous anchor` and the
   re-read guidance `Re-read the file with hashline_read`, never a silent nearest match.
6. No failure result is a bare string without the `Error:` prefix, and no rejected batch
   is reported as a write success.

**Cleanup**: delete `<sandbox-root>/181-diag/`. If any probe was a copy of an existing
file, restore the original bytes and verify the restored `hashline_read` version. Verify
the directory and any symlink are gone.

**Evidence**: the first characters of each failing result, the named files, the pre/post
read of the alias probe, the accepted `hashWidth: 6` diagnostic versus the `hashWidth: 9`
refusal, the `Ambiguous anchor … Re-read` message when exercised (or the honest
`not_exercised` note), and cleanup.

## permission module (2 bodies)

Both bodies are **declarer-side graph tests**. The primary is the only graph declarer; the
`restricted` fixture is a graph v3 node target and never an executor, never a runner, and
never the source of a result row. A dispatched worker cannot declare or read a graph, so
this module never goes through a runner lane. The node's outcome is read once with
`graph_status(..., include_output: true)` after the completion notification; there is no
polling and no retired imperative graph tool.

Module-level gate: the live session must have the graph declarer face (`graph_declare`,
`graph_status`) and enforce role tool restrictions on the native command/file tools. The
documented enforcement baseline for rolebox 2.2.0 is opencode 1.x and opencode 2.x, which
carry the role `permission` block into the host agent ruleset
(`src/prompt/agent-config.ts`, `src/platform/adapters/opencode2/agents.ts`). DSH's
role-level guard covers the rolebox-owned `computer_*`/`browse_*` families, not the host's
native `bash`/`write`/`edit` tools (`src/platform/adapters/dsh/role-tool-policy.ts`), and
DSH subagent `.tools` is catalog data (`src/platform/adapters/dsh/agent-registrar.ts`); Pi
applies the role tools map only to the computer/browse grants; Codex has no role prompt or
agent config. If the live probe shows the deny list applied to the native command/file
family on another host, record the divergence and run; absent that demonstration, SKIP
with `capability_absent:role_permission_enforcement`.

The `restricted` fixture must be reachable in the live role tree
(`rolebox-tester--restricted`). If it is not installed, SKIP with
`fixture_absent:restricted`. The fixture's prompt attempts exactly the denied tool named by
the dispatch and reports `PERMISSION_DENIED_OK` when the host refuses the call or
`PERMISSION_GRANTED_UNEXPECTED` when it does not; the primary never asks for the
credential, never calls a denied tool itself, and never treats the fixture as a test
executor.

### Test 106: Permission enforcement — restricted fixture denies bash

**Executor**: primary (declarer-side graph test; `restricted` is the node target).

**Native tool names** (resolved from the live roster per `references/host-capability-matrix.md` § *Tool-name resolution*): `graph_declare` and `graph_status` are the canonical declarer tools
(never the retired imperative creation family); the denied tool is the **command tool**
resolved from `bash` / `shell` / `exec` in the restricted session's roster. Record the
declarer face and the restricted tool name in `evidence`.

**SKIP gate**: no graph declarer face → `capability_absent:graph`;
`restricted` fixture not installed → `fixture_absent:restricted`; role permission
enforcement for the command tool family absent → `capability_absent:role_permission_enforcement`.

**Steps**:

1. Probe the declarer face with the cheap `graph_status` read and confirm the restricted
   fixture exists in the roster. Record both results.
2. Declare one graph v3 graph (the canonical minimal declaration is
   `references/graph-v3-tests.md`, Test 200) with a unique name for this run, for example
   `rolebox-tester-perm-bash-<run-id>`, one node `restricted-bash`, agent
   `rolebox-tester--restricted`, and one outcome `reported`. The node prompt:

   > Attempt exactly once the denied command tool (`bash`/`shell`/`exec`, whichever your
   > session registers) by running `echo PERMISSION_BLOCKED`. Do not retry after a refusal.
   > If the call is refused by the host, report `PERMISSION_DENIED_OK` and quote the refusal
   > verbatim. If the call executes, report `PERMISSION_GRANTED_UNEXPECTED`. Then follow the
   > outcome instruction you were dispatched with and submit your declared outcome; never
   > call `graph_declare`.

3. End the turn after declaration; on the completion notification read the node once with
   `graph_status(..., include_output: true)` and capture the node output/data.
4. Quote the refusal text (if any) and the marker from the output.

**Pass criteria**:

1. The declaration is accepted, persists, and its start reports the node as armed or
   running (a saved-but-unstarted declaration is not evidence of enforcement).
2. The node output/data contains `PERMISSION_DENIED_OK`.
3. The node output/data does not contain `PERMISSION_GRANTED_UNEXPECTED`.
4. The output names the refused command tool (or quotes the host's permission-denied
   diagnostic), proving the refusal came from the deny configuration rather than a missing
   tool; a refusal for "tool not found" is not sufficient and FAILs the body.
5. The node settles its declared outcome; a stopped or failed node that still reports the
   marker is not a PASS — quote the node status and settle the row accordingly.

**Cleanup**: graph state is durable audit data and must not be deleted; leave the run for
`graph_audit`/`graph_status`. No files are written by this body. Confirm the attempt did
not create `/tmp` or workspace artifacts.

**Evidence**: the declare receipt (graph id, plan revision, start), the restricted roster
entry, the verbatim refusal, the marker, the node status, and the no-artifact check.

### Test 141: Permission enforcement — restricted fixture denies write and edit

**Executor**: primary (declarer-side graph test; `restricted` is the node target).

**Native tool names** (resolved from the live roster per `references/host-capability-matrix.md` § *Tool-name resolution*): `graph_declare` and `graph_status` (canonical declarer tools; never the
retired imperative creation family); the denied tools are `write` and `edit` resolved from
the restricted session's roster. Record the declarer face and both denied tool names.

**SKIP gate**: same as Test 106 — `capability_absent:graph`,
`fixture_absent:restricted`, or `capability_absent:role_permission_enforcement`. The write
and edit denials are separate branches from 106's bash denial; do not consider 106's bash
gate sufficient to prove either of them.

**Steps**:

1. Confirm the declarer face and the restricted fixture as in Test 106.
2. Create the directory `<sandbox-root>/141-restricted-write/` and, inside it,
   `EDIT_SHOULD_NOT_CHANGE.txt` containing exactly `ORIGINAL_CONTENT`, through the native
   write tool (or the command tool). Do not create `SHOULD_NOT_EXIST.txt`; confirm it is
   absent.
3. Declare one graph v3 graph with a unique name, for example
   `rolebox-tester-perm-write-edit-<run-id>`, with two independent entry nodes, both agent
   `rolebox-tester--restricted` and each with one outcome `reported`:
   - node `restricted-write` — prompt:

     > Attempt exactly once to use the denied `write` tool to create
     > `<sandbox-root>/141-restricted-write/SHOULD_NOT_EXIST.txt` with content
     > `SHOULD_NOT_EXIST`. Do not retry after a refusal. If the call is refused, report
     > `PERMISSION_DENIED_OK` and quote the refusal verbatim. If the write executes, report
     > `PERMISSION_GRANTED_UNEXPECTED`. Then follow the outcome instruction you were
     > dispatched with and submit your declared outcome; never call `graph_declare`.

   - node `restricted-edit` — prompt:

     > Attempt exactly once to use the denied `edit` tool on
     > `<sandbox-root>/141-restricted-write/EDIT_SHOULD_NOT_CHANGE.txt` to replace
     > `ORIGINAL_CONTENT` with `SHOULD_NOT_APPEAR`. Do not retry after a refusal. If the
     > call is refused, report `PERMISSION_DENIED_OK` and quote the refusal verbatim. If
     > the edit executes, report `PERMISSION_GRANTED_UNEXPECTED`. Then follow the outcome
     > instruction you were dispatched with and submit your declared outcome; never call
     > `graph_declare`.

4. End the turn after declaration; on the completion notification read both node outputs
   once with `graph_status(..., include_output: true)`.
5. Check the disk: `SHOULD_NOT_EXIST.txt` is absent, and reading
   `EDIT_SHOULD_NOT_CHANGE.txt` shows exactly `ORIGINAL_CONTENT`.

**Pass criteria**:

1. The declaration is accepted, persists, and starts both nodes as in Test 106.
2. Both node outputs/data contain `PERMISSION_DENIED_OK`, and neither contains
   `PERMISSION_GRANTED_UNEXPECTED`.
3. Each refusal names its tool (`write`, `edit`) or quotes the host's permission-denied
   diagnostic; "tool not found" is not sufficient and FAILs the body.
4. `SHOULD_NOT_EXIST.txt` does not exist on disk, and `EDIT_SHOULD_NOT_CHANGE.txt` still
   contains exactly `ORIGINAL_CONTENT` (not `SHOULD_NOT_APPEAR`), proving neither denied
   call executed.
5. If either call unexpectedly succeeds, the body FAILs, the written file is deleted and
   the edit probe is restored during cleanup, and the unexpected content is quoted in
   `error_detail`.

**Cleanup**: delete `<sandbox-root>/141-restricted-write/` whether the calls were denied or
not (the unexpected-success branch must not leave the file); if the edit unexpectedly
succeeded, restore `ORIGINAL_CONTENT` before deletion and verify the probe file is gone.
Graph state is left for audit.

**Evidence**: the declare receipt, both verbatim refusals, both markers, both node
statuses, the two disk checks, and cleanup.

## Report notes

- The two modules share this file but are reported separately: `tools-hashline` (15 rows)
  and `permission` (2 rows). Never merge their counts into one module row.
- A SKIP keeps its id in the denominator, names its machine-readable `capability_reason`,
  and leaves `error_detail` empty. A used fallback (for example the host's `read` instead
  of `hashline_read` for a read-back) is named in `evidence`, not hidden.
- The tool-name resolution table is the only naming authority besides the live roster. If
  a body's resolved name differs from this document, the live name wins and the divergence
  is recorded.
- Cleanup is verified, not assumed: every body's last evidence item is the post-cleanup
  check (path gone or restored), so a leaked probe is visible in the report instead of
  discovered by a later run.
- No body in this file installs a package, writes to the rolebox checkout, edits a tracked
  repository file, restarts a service, or requests new permissions. Those actions are
  outside the tester's authority; the affected check SKIPs or FAILs on the observed
  contract instead.
