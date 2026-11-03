# Runtime, hooks and CLI module bodies

Module `runtime-hooks-cli` of the rolebox-tester 7.0.0 suite. This document owns the
`### Test <id>` bodies for **test 172** and **tests 235–240** (7 tests). The catalog
maps this module to the declaring primary (`references/test-catalog.md`), and the host
gates and SKIP reasons come from `references/host-capability-matrix.md`.

These bodies verify the runtime surfaces that are invisible from a single tool call:
a persistent interactive terminal, custom-hook injection, the edit-error recovery
chain, the hooks/recovery manifest, the read-only CLI, log reads and the monitor
dashboard. They are executed by the primary, in ascending id order, and are never
assigned to a graph-dispatched worker: a worker receives only its outcome-submission
face and cannot observe the role-level prompt or recovery service.

Every body obeys the shared rules below, resolves native tool names from the live
roster, sends no desktop input, installs nothing, enables no operator gate and
modifies no repository file.

## Module contract

| Id | Test | Executor | Host gate | SKIP reason |
|---|---|---|---|---|
| 172 | Interactive terminal persistent session | primary | `interactive_terminal` registered | `capability_absent:interactive_terminal` |
| 235 | Custom hook injection | primary | `hooks.custom` service present on this host (opencode 1.x/2.x, Pi or DSH; absent on Codex) and the role's probe entry declared | `capability_absent:hooks` |
| 236 | Edit-error recovery | primary | rolebox recovery service active with the `edit_error` chain (opencode 1.x/2.x; absent on Pi, DSH and Codex) and this role's recovery config supplying the chain first | `capability_absent:recovery`, `recovery_config_foreign` |
| 237 | Hooks/recovery manifest check | primary | the installed role manifest is readable (file tools on every host) | `manifest_unavailable`, `internal_surface_unavailable` |
| 238 | CLI read-only commands | primary | `rolebox` on `PATH`; the interactive `config` sub-check additionally needs a TTY | `cli_absent` (module), `tty_absent` (the `config` wizard sub-check only) |
| 239 | CLI logs | primary | `rolebox` on `PATH` | `cli_absent` (module) |
| 240 | Monitor dashboard smoke | primary | `rolebox` on `PATH`, a TTY and `interactive_terminal` for the live sub-check | `cli_absent`, `tty_absent`, `capability_absent:interactive_terminal` |

The CLI gate is `rolebox --version` exiting 0 with a version string. A `rolebox` that
only resolves through a fetching `npx rolebox` is **absent**: the suite never installs
or downloads a package to make a test runnable.

## Shared execution rules

1. **Probe first.** Run the capability probe from `host-capability-matrix.md` and
   record the resolved native names before executing a body. Use the resolved command
   tool (`bash`/`shell`/`exec`) and the resolved `read`/`write`/`edit` tools; never
   assume `bash` when the roster says otherwise.
2. **Read-only by default.** These tests inspect configuration and produce temp files
   only under `<workspace>/.rolebox/test-reports/tmp/runtime-<id>/`. They never modify
   the rolebox checkout, the installed role directory, a tracked repository file, the
   user's global config, the registry/lock files, or a running service.
3. **No self-installed authority.** Do not install packages, sync or re-install roles,
   create a second role, set policy/notification environment variables, grant OS
   permissions, enable a gated family, or restart a host. A capability the operator
   did not supply is a SKIP, not something to construct.
4. **No input gestures.** No body in this module clicks, types into, keys, drags or
   scrolls a desktop. The monitor test presses Ctrl-C inside its own PTY session only,
   which is process control, not desktop input.
5. **Bounded waits only.** Every wait has a timeout (≤ 15 s unless a body names a
   different limit) and records the timeout honestly. Do not poll in a loop to turn a
   timeout into a pass.
6. **Exact markers.** A marker is a literal `ROLEBOX_<id>_<NAME>` string. PASS requires
   the exact substring in the observed output; "looks right" is not evidence. Strip ANSI
   escapes before matching terminal output.
7. **Cleanup always runs.** Close every `interactive_terminal` session, remove every
   temp directory and confirm the session list/process table is clean before writing the
   row. A leftover process or file is a FAIL, not a cleanup note.
8. **Record the row.** Each test emits exactly one report row with `id`, `name`,
   `status` (`PASS`/`FAIL`/`SKIP`), `evidence`, `error_detail`, `duration_ms`,
   `executor: primary`, and `capability_reason` (required only for SKIP). Include the
   exact command, exit code and the observed marker/message in `evidence`.

## Test bodies

### Test 172 — Interactive terminal persistent session

**Executor:** primary. **Host gate:** `interactive_terminal` registered. **SKIP:**
`capability_absent:interactive_terminal` when the tool is absent from the roster.

**Procedure**

1. Open a persistent shell session with the tool's `open` action. Use the host's
   shell (`sh` or the platform equivalent) and a small loop that prints a ready marker
   and echoes each stdin line with a prefix, for example:
   `printf 'ROLEBOX_172_READY\n'; while IFS= read -r line; do printf 'ROLEBOX_172_GOT:%s\n' "$line"; done`.
   The backend is `auto`: a PTY is preferred, a line-oriented pipe is acceptable.
   Record the returned session id and the backend the tool reports.
2. `read` until the exact marker `ROLEBOX_172_READY` appears (stream/auto mode,
   `strip_ansi: true`), bounded to 15 s. A read that times out before the ready marker
   is a FAIL.
3. `write` the literal line `ROLEBOX_172_PING` followed by Enter (the tool's
   `append_newline` or `\r`, as its schema defines). Read until
   `ROLEBOX_172_GOT:ROLEBOX_172_PING` appears, again bounded to 15 s.
4. Resize is **optional**. Send `resize` (for example `rows: 30, cols: 100`). If the
   backend reports resize unsupported (documented for a line-oriented backend), record
   that fact and continue; if it succeeds, assert the session is still readable
   afterwards. Resize never fails this test.
5. `close` the session and assert the close result names the session. Call `list` and
   assert the closed session id no longer appears. If the host exposes a process view,
   assert the shell process exited.
6. Remove any capture artifacts; this test creates no workspace files.

**PASS:** open returned a session id; both literal markers were read; close succeeded;
`list` no longer shows the session. **FAIL:** a timeout or a missing marker, a close
that reports an error, or a session that remains listed. **SKIP:** the tool is not
registered — record the roster evidence and do not substitute a `bash` one-liner, which
is a different capability.

### Test 235 — Custom hook injection

**Executor:** primary. **Host gate:** the host dispatches `hooks.custom` tool events
(opencode 1.x/2.x, Pi, DSH); Codex has no host event stream. The role manifest must
declare the probe entry from test 237. **SKIP:** `capability_absent:hooks`.

The contract being tested is the documented one: a custom hook fires after the command
tool returns, calls `ctx.inject(...)`, and the injected text is appended to the next
system prompt via the correction path (`docs/hooks.md`).

**Procedure**

1. Locate and read the installed role's `role.yaml` (see test 237 for the location
   rules). Assert the single `hooks.custom` probe entry has:
   `events: [tool.execute.after]`; `filter.tools` containing the resolved command tool
   name (the manifest declares `bash`); `module: hooks/probe.mjs`; `priority: 50`;
   `phase: after`; and `config` with `marker: HOOK_PROBE_TRIGGER` and
   `inject: HOOK_PROBE_FIRED`. If the host has no custom-hook service, SKIP now with
   `capability_absent:hooks` and record the probe result.
2. Prove the declared module loads. Resolve the role directory from
   `rolebox info rolebox-tester --json` `.path` (or the host sync directory), then run
   the command tool with Node:
   `node --input-type=module -e "import { pathToFileURL } from 'node:url'; const m = await import(pathToFileURL('<role>/hooks/probe.mjs').href); if (typeof m.onToolAfter !== 'function') { console.error('onToolAfter missing'); process.exit(1); } console.log('HOOK_MODULE_OK');"`.
   Assert exit 0 and `HOOK_MODULE_OK`. A missing or unloadable module is a FAIL: the
   manifest promises a module the host will load.
3. Run the command tool once so its output contains the trigger marker, for example
   `printf 'ROLEBOX_235_PRE\nHOOK_PROBE_TRIGGER\n'`. Assert exit 0 and that the tool
   result text contains `HOOK_PROBE_TRIGGER`. The hook fires on `tool.execute.after`
   and calls `inject("...HOOK_PROBE_FIRED...")`.
4. The observation point is the **next turn** — the next model step after the tool
   result, whose context includes the pending correction appended to its system prompt.
   Inspect that next turn's context and record the exact injected line; PASS requires the
   literal `HOOK_PROBE_FIRED` to appear exactly once, without the test having written that
   word into a file or prompt itself. A host transcript reader (`session_read`) may be
   used to corroborate, but a manifest entry alone is not evidence.
5. Negative sub-check: after the correction has been consumed, run a command whose
   output does **not** contain `HOOK_PROBE_TRIGGER` (for example
   `printf 'ROLEBOX_235_NEGATIVE\n'`). On the following model step, assert no new
   `HOOK_PROBE_FIRED` injection appears and the first injection is not duplicated.
6. No cleanup is needed; nothing was written. Never edit `role.yaml` to force the hook.

**PASS:** the manifest entry matches, the module loads, the trigger reaches the next
step's context exactly once, and the non-trigger command injects nothing.
**FAIL:** a loaded hook family with a missing marker, a duplicated marker, or an
injection on the negative command. **SKIP:** no hooks service, recorded as
`capability_absent:hooks`; the config/manifest checks may be recorded as supporting
evidence but do not convert the SKIP into a PASS.

### Test 236 — Edit-error recovery

**Executor:** primary. **Host gate:** the rolebox recovery service is active and the
`edit_error` chain is in force. The documented matrix lists the recovery engine on
opencode 1.x/2.x only; Pi, DSH and Codex have no rolebox recovery chain. The service
uses the first supplied `hooks.recovery` configuration across the resolved roles, so a
different role's config being first makes this test SKIP, not FAIL. **SKIP:**
`capability_absent:recovery`, `recovery_config_foreign`.

**Procedure**

1. Read `role.yaml` and record: `hooks.builtin.edit_error: true`,
   `hooks.recovery.enabled: true`, and the first `hooks.recovery.edit_error.chain`
   step (expected `strategy: remind_and_retry`, `max_retries` ≥ 1, an optional
   `reminder_text`; when absent the shipped default is
   `[EDIT ERROR] STOP and re-read the file before retrying.`).
2. Determine which recovery config is in force. If the first `hooks.recovery` block in
   the resolved role roster belongs to another role, record that role and SKIP with
   `recovery_config_foreign`; the service documents that the first supplied config
   wins. If no recovery service was created (the master switch is explicitly false, or
   the host has none), SKIP with `capability_absent:recovery`.
3. Create the temp file `<workspace>/.rolebox/test-reports/tmp/runtime-236/note.txt`
   with exactly `alpha\nbeta\n` using the native write tool.
4. Issue the native `edit` on that file with a stale anchor:
   `old_string: "ROLEBOX_236_NOT_PRESENT"`, `new_string: "x"`. The edit must fail; the
   error text must contain one of the documented edit-error patterns
   (`oldString not found`, `Found multiple matches`, `no edits were applied`,
   `anchor not found`, `version mismatch`, `stale content`, `edit conflict`). If the edit
   unexpectedly succeeds, FAIL: the edit contract did not detect a stale anchor.
5. Observe the next model step. PASS requires the recovery reminder to be present in
   context — either the role's configured `reminder_text` or the shipped default
   `[EDIT ERROR] STOP and re-read the file before retrying.` Record the exact text.
   A present recovery engine with no reminder is a FAIL; do not accept the manifest
   declaration as evidence of the runtime chain.
6. Follow the reminder: re-read the file, then edit `old_string: "alpha"`,
   `new_string: "gamma"`. Assert the corrected edit succeeds and the file content is
   exactly `gamma\nbeta\n`.
7. Remove the temp directory. If the file was created outside the workspace (it must
   not be), remove it and record the path; never edit a tracked repository file.

**PASS:** the chain is configured, the stale edit failed with a documented pattern, the
reminder reached the next step, and the corrected edit produced the expected content.
**FAIL:** no reminder despite a present recovery service, a reminder that cannot be
observed, or a corrected edit that fails. **SKIP:** `capability_absent:recovery` or
`recovery_config_foreign`, with the observed config/roster as evidence.

### Test 237 — Hooks/recovery manifest check

**Executor:** primary. **Host gate:** the installed role directory is readable; the
inspection is host-independent and works wherever the role files exist. **SKIP:**
`manifest_unavailable` when no documented role directory or `rolebox info --json`
path resolves, `internal_surface_unavailable` when the shipped recovery-keys module
cannot be imported for the unknown-key sub-check.

**Procedure**

1. Resolve the role directory, in order: the `path` field of
   `rolebox info rolebox-tester --json`; the host sync directory
   (`$DSH_HOME/rolebox/rolebox-tester`, `$XDG_CONFIG_HOME/opencode/rolebox/rolebox-tester`,
   `$PI_CODING_AGENT_DIR/rolebox/rolebox-tester`, with the platform defaults when the
   variable is unset); finally the current checkout's `roles/rolebox-tester`. Read its
   `role.yaml` with the native read tool. Never write it.
2. Parse the YAML with the repository's Python YAML (the same parser
   `scripts/validate.py` uses), or an equivalent local parser. Assert, strictly:
   - `hooks.builtin.edit_error is True` (boolean, not the string `"true"`);
   - `hooks.builtin.recovery` is absent (the shipped default is true) or explicitly
     `True`; an explicit `False` is a FAIL because the edit-error chain would not be
     created;
   - `hooks.recovery.enabled is True`;
   - `hooks.recovery.edit_error.chain` is a non-empty list whose first step is
     `strategy: remind_and_retry` with an integer `max_retries` ≥ 1;
   - there is **no root-level `recovery:` key** in `role.yaml` — the chain is only valid
     under `hooks.recovery`;
   - every key in `hooks.builtin` is a known built-in key (no typo has slipped into the
     manifest).
3. Unknown-key behaviour. Resolve the installed rolebox package (the real path of the
   `rolebox` binary, `npm root -g`, or the host's plugin install directory) and import
   its shipped `dist/recovery/builtin/keys.js`:
   `findUnknownBuiltinConfigKeys({ edit_error: true, made_up_flag: false })` must return
   `["made_up_flag"]`; `made_up_flag` must not be in `BUILTIN_CONFIG_KEYS`; and the
   recovery service's warning path (`Unknown hooks.builtin key "…" — no built-in hook
   uses it; this flag has no effect`) must exist in the shipped service module. This is
   the "warns and no-ops" contract: the key is reported and has no consumer, so it does
   not enable, disable or alter a hook.
4. If the shipped internal module cannot be imported (for example a package layout
   without `dist/recovery/builtin/keys.js`), SKIP the unknown-key sub-check with
   `internal_surface_unavailable`; the test row is SKIP because a required assertion
   could not run, with the manifest assertions recorded as evidence.

**PASS:** every manifest assertion holds and the unknown-key probe returns exactly the
unknown key with no known-key match. **FAIL:** a missing/incorrect flag, a chain under
a root `recovery:` key, a wrong strategy, an unknown key in this role's own
`hooks.builtin`, or a shipped module that contradicts the documented warning/no-op
contract.

### Test 238 — CLI read-only commands

**Executor:** primary. **Host gate:** `rolebox` on `PATH` (`rolebox --version` exits 0).
**SKIP:** the module SKIPs with `cli_absent` when the binary is absent; do not install
it and do not treat a fetching `npx rolebox` as present.

All commands run from the workspace root. Every command records its exact argv, exit
code, and the first/last meaningful output lines. This test never writes configuration.

**Procedure**

1. `rolebox --version` — exit 0 and a semantic version string (record it; the suite
   baseline is 2.2.0).
2. `rolebox list` — exit 0; output is either `Installed roles:` followed by rows of
   `role  version  (registry)` or the documented `No roles installed.` sentence.
   Then `rolebox list --json` — exit 0 and a JSON array; every entry has `role`,
   `registry`, `version` and `installedAt`. Record whether `rolebox-tester` is present.
3. `rolebox status` — exit 0; output reports the rolebox version, the configuration
   and the installed roles, and names every registered platform target. Then
   `rolebox status --json` — exit 0 and an object with `version`, `config`,
   `registries`, `roles` and `targets`; each target has its target/sync fields. When
   the tester was found installed in step 2, assert its sync state appears in `roles`;
   otherwise record `role_not_installed` for this sub-check.
4. `rolebox info rolebox-tester` — only when step 2 found the role installed;
   otherwise record the sub-check as `role_not_installed` and continue. Exit 0 and
   output names the role, version, installed path, skills, functions, subagents and
   sync targets. Then `rolebox info rolebox-tester --json` — exit 0 and an object with
   `role`, `version`, `path`, `skills`, `functions`, `subagents` and `syncTargets`.
5. `rolebox config` — this subcommand is an interactive model wizard in rolebox 2.2.0;
   invoking it bare in a non-TTY exits 1 with
   `Interactive role selection for \`rolebox config\` requires a TTY`. The read-only
   checks are therefore:
   - `rolebox config --help` — exit 0; the usage lists the `ROLE` argument and the
     `--model` (`-m`), `--primary-only` (`-p`) and `--target` (`-t`) options.
   - Only when `interactive_terminal` is registered and a TTY is available, open a PTY
     session, run `rolebox config` from the workspace, wait (≤ 15 s) for the target or
     role picker to render, then cancel with Ctrl-C without selecting anything. Assert
     the process exits 0 and no wizard selection was committed. Hash the tester's
     `role.yaml` (from the `rolebox info --json` `path`; `shasum -a 256` or
     `sha256sum`) before and after and assert the hash is unchanged. Never pass
     `--model`: that path writes role.yaml and is outside this read-only test.
   - Without a TTY, record the wizard sub-check as `tty_absent`; the `--help` check
     still runs. This sub-check SKIP does not fail the test because the command's
     non-interactive contract was verified by `--help` and the TTY-only path is a
     documented environment gate.
6. Record, for each command, whether the expected fields were present. A nonzero exit
   or a missing documented field is a FAIL of this test.

**PASS:** every applicable command exits 0 with the fields above; the config wizard
either renders and is cancelled cleanly (with no file change) or is recorded as
`tty_absent`. **FAIL:** any nonzero exit, an unparsable JSON output, a missing required
field, or a changed role.yaml hash. **SKIP:** the module SKIPs only when `rolebox` is
absent (`cli_absent`).

### Test 239 — CLI logs

**Executor:** primary. **Host gate:** `rolebox` on `PATH`. **SKIP:** module SKIP with
`cli_absent` when absent.

The command's documented exit-code contract: `0` for any answer — including "no records
matched" and a source that does not exist yet — and `1` only for an argument the command
cannot honour, reported with the usage line.

**Procedure**

1. `rolebox logs` — exit 0. Output is either console-format records
   (`[level] channel … — message`) or the documented empty answer naming the location it
   read. No stack trace. Record whether records were present.
2. `rolebox logs files` — exit 0. Output is the source heading (`<n> log file(s) in
   <path>:` or the empty note) and, when files exist, one row per file with channel,
   rotation (`active`, `.1`, …), size and modification time.
3. Deterministic fixture: create
   `<workspace>/.rolebox/test-reports/tmp/runtime-239/` and write two valid records —
   `cli.log` containing
   `{"time":1791453600000,"level":"warn","channel":"cli","message":"ROLEBOX_239_FIXTURE","fields":{},"scope":{},"process":{"pid":1,"role":"host"}}`
   and `cli.log.1` containing the same shape with message `ROLEBOX_239_ROTATED` and an
   earlier `time`. Then assert:
   - `rolebox logs files --log-dir <dir>` exits 0, names `<dir>` in the heading, and
     lists `cli` twice — `active` and `.1` — with byte sizes and modification times;
   - `rolebox logs --log-dir <dir> --json` exits 0 with exactly two JSON lines, each
     parsing, and both markers present;
   - `rolebox logs --log-dir <dir> --text ROLEBOX_239_FIXTURE` exits 0, returns the
     fixture record and not the rotated record;
   - `rolebox logs --log-dir <dir>/empty` (create it first; a directory with no files)
     exits 0 with the documented "no log files … yet" note and does not create a file.
4. Invalid-argument check: `rolebox logs --level nope` must exit **1**, print
   `Error: --level must be one of debug, info, warn, error, fatal (got "nope")` and the
   `Usage: rolebox logs [options]` line to stderr, and print no stack trace. The
   nonzero exit here is the expected PASS condition; a zero exit is a FAIL.
5. Remove the fixture directory and assert nothing remains.

**PASS:** every read exits 0 with the documented shape, the fixture records and files are
reported correctly, and the invalid argument exits 1 with the usage line.
**FAIL:** any unexpected exit code, an unparsable JSON line, a wrong record set, a
missing usage line, or a leftover `--log-dir` file. **SKIP:** `cli_absent` only.

### Test 240 — Monitor dashboard smoke

**Executor:** primary. **Host gate:** `rolebox` on `PATH`, a TTY, and
`interactive_terminal` for the live sub-check. **SKIP:** `cli_absent`, `tty_absent`, or
`capability_absent:interactive_terminal` (the tool is required for the live frame).

**Procedure**

1. `rolebox monitor --json` from the workspace root — exit 0 and a JSON object with
   `projectDir`, `timestamp`, `tasks`, `activeFunctions`, `loops`, `graphSessions`,
   `engineGraphs`, `graphEvents`, `dispatchSummary` and `concurrency`. Assert the count
   fields under `dispatchSummary` are integers (zero is a valid answer). This is the
   deterministic reader check and needs no TTY.
2. Live dashboard: open an `interactive_terminal` session running
   `rolebox monitor --watch --interval 500` in the workspace. Wait with a bounded
   timeout (≤ 15 s) for one rendered frame. In rolebox 2.2.0 the watch view writes the
   alternate-screen sequence and a diff-rendered text dashboard; accept as a frame the
   first non-empty screen (or the `refreshing every` line) after the command starts.
   Record a short, ANSI-stripped excerpt of the frame. Do not screenshot the desktop and
   do not send any input except the quit key.
3. Quit with Ctrl-C inside that PTY session. Wait for the process to exit; assert exit
   code 0 and the `Monitor stopped.` line. Confirm the terminal session is closed and no
   monitor process remains.
4. Also record `rolebox monitor --help` exit 0 and that `--watch`, `--json` and
   `--interval` appear in the usage, as supporting evidence for the CLI surface.
5. Clean up: close the PTY session even when an assertion fails; never leave the
   alternate screen active in the user's terminal.

**PASS:** the one-shot JSON has the documented keys, the watch view rendered a frame
inside the timeout, and Ctrl-C exited 0 with the stop line. **FAIL:** a nonzero exit, a
missing JSON section, no frame inside the timeout, a quit that leaves the process or
session alive, or a missing stop line. **SKIP:** `cli_absent` when the CLI is absent;
`tty_absent` or `capability_absent:interactive_terminal` when the live TTY sub-check
cannot be exercised — the one-shot JSON evidence is still recorded, but the test row is
SKIP because the required live contract could not run.

## Out of scope

The following shipped surfaces are deliberately **out of scope** for this module. The
reasons are capability and observability facts, not missing effort; a later suite may
add them only with a deterministic, reversible observation path.

| Surface | Why it is out of scope | Where covered instead |
|---|---|---|
| Copilot continuation | Fires only on `session.idle` of a root role, starts a fresh child session with a hard timeout, and cannot be observed inside a test turn without hijacking the user's turn. | Not covered; a documented limitation. The built-in function-continuation path is separate and is not a substitute. |
| Notifications | Configured at host startup via `ROLEBOX_NOTIFICATIONS_CONFIG`; notifications are idle-event driven, with no in-session injection path. | The durable graph notification effect is covered by test 224 (`references/graph-v3-tests.md`). |
| Extensions | YAML `extensions:` blocks are dropped by the loader; only programmatic registration exists and there is no in-session public registration surface. | Not covered; a documented limitation. |
| `computer_click` | Desktop input gesture with no rollback; changes the user's desktop state. | Out of scope by the no-input rule. |
| `computer_move` | Moves the user's pointer; a desktop state change. | Out of scope by the no-input rule. |
| `computer_type` | Types into whatever holds focus; can leak text into a user application. | Out of scope by the no-input rule. |
| `computer_key` | Presses keys in a user application; irreversible side effects. | Out of scope by the no-input rule. |
| `computer_scroll` | Scrolls a user application at the pointer position. | Out of scope by the no-input rule. |
| `computer_drag` | Press-drag-release with no rollback. | Out of scope by the no-input rule. |
| `computer_focus` | Brings a window to the foreground and changes the user's desktop focus. | 242 discovers windows; 241 captures by window id, which needs no focus. |
| `computer_permissions` | Probes or requests OS grants; requesting permission is an operator decision, and a grant is not proof of a successful capture. | Out of scope; 241 reads the permission verdict from `computer_status` instead. |
| `browse_click` | Interactive page input; this module only reads a deterministic local page. | Out of scope. |
| `browse_type` | Types text into a page control; state-changing input. | Out of scope. |
| `browse_press` | Presses a key on a page element; interactive input. | Out of scope. |
| `browse_select` | Changes a form selection; interactive input. | Out of scope. |
| `browse_drag` | Drag gesture on a page; interactive input. | Out of scope. |
| `browse_hover` | Hover-driven menus; interactive timing surface. | Out of scope. |
| `browse_scroll` | Scrolls the page; adds no coverage on a page that fits. | Out of scope; 243/244 read the page directly. |
| `browse_wait` | Waits for dynamic content; the deterministic local page renders synchronously. | Out of scope. |
| `browse_eval` | Executes arbitrary page JavaScript and can bypass the read surface. | Out of scope. |
| `browse_screenshot` | Binary image capture; text snapshot/read are the deterministic evidence. | Out of scope; 241 covers the desktop capture path. |
| `browse_upload` | Attaches user files to the page; changes page state and exposes paths. | Out of scope. |
| `browse_downloads` | Exports files produced by the page; writes artifacts. | Out of scope. |
| `browse_dialog` | Handles a page dialog; the deterministic page raises none. | Out of scope. |
| `browse_cookies` | Reads or writes session cookies — private session data and a browser-context mutation. | Out of scope. |

The computer/browse tests that **are** in scope are the read-only bodies 241–244 in
`references/computer-browse-tests.md`: `computer_status`, `computer_windows`,
`computer_displays` and one `computer_screenshot`; and `browse_status`,
`browse_open`, `browse_snapshot`, `browse_read`, `browse_tabs`, `browse_history`,
`browse_console`, `browse_network` and `browse_close`.

## Module accounting

- 7 tests in this module: 172, 235, 236, 237, 238, 239, 240.
- A module row reports SKIP only when every test in it SKIPs for the same class of
  reason. A partially executed test keeps its own row; the `config` wizard sub-check and
  the live monitor sub-check are the only sub-check SKIPs and both are recorded in
  `evidence`.
- No test in this module is assigned to `runner-statemachine` or `runner-loop`; both are
  dispatched workers and cannot observe role-level hooks, recovery, prompt injection or
  the role manifest.
