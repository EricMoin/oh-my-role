# Host capability matrix — rolebox-tester 7.0.0

The suite is capability-first, not hostname-first. Before any module is selected, the
executing primary runs the capability probe below and records what this session can
actually call. The matrix in this document is the documented baseline for rolebox
2.2.0 across opencode 1.x, opencode 2.x, Pi, DSH and Codex; the live probe decides the
run, and a difference is recorded as evidence or a SKIP reason, never papered over.

**Absent capability families are SKIP not FAIL.** A family the host does not
register is an environment fact the tester cannot change; only a present family that
contradicts its documented behavior is a FAIL. A refusal that a test explicitly
requests (a permission denial, a grammar refusal, an isolation refusal) is a PASS when
the named refusal is observed.

The baseline facts in this document come from the rolebox 2.2.0 documentation and
source: `docs/compatibility.md`, `docs/limitations.md`, `docs/worker-tools.md`,
`docs/graph-outcome-protocol.md`, `docs/team-work.md`, `docs/hooks.md`,
`docs/computer-use.md`, `docs/browser-use.md`, and the built-in
`skills/rolebox-config/references/{configuration,roles,assets,orchestration,runtime}.md`.
Re-read the installed version when a probe disagrees with the baseline instead of
assuming the document is current.

## Capability probe

The capability probe is mandatory for every run and every executor lane. It happens
after the role loads and before the first module body executes. Its output is the
capability record the run uses for module selection and for every SKIP decision.

A capability signal is one of:

1. a callable tool with a documented schema and behavior, registered in this session
   and resolvable by its exact name; or
2. an observable prompt or runtime effect with a documented contract (for example the
   `## Available functions` block, a rendered `## Function state:` heading, a custom
   hook injection, a role's locked auto-activation); or
3. an installed operator capability (approval policy, completion policy, command
   check binding) that the host itself installed before the role loaded.

A name printed in a document, a role.yaml declaration, a subagent prompt or a catalog
table is **not** a capability signal. Neither is a function that exists in the package
but is not activated in this session.

### Probe procedure

1. **Record the environment.** Host id and version, rolebox version, role id
   (`rolebox-tester`), workspace directory, executor lane, and whether the session is
   a primary, a graph worker or a fixture. A graph worker reports only the tool face
   it actually received.
2. **Enumerate the tool roster.** Read the live tool list / system prompts for exact
   names. Match against the candidate names in the table below; record the resolved
   native name for the command/file/todo family rather than assuming `bash`,
   `todowrite` or `working_directory`.
3. **Probe cheaply and read-only.** Use the probe call in the table where one is
   safe. `computer_status`, `browse_status`, `lsp_servers`, `graph_status`,
   `team_list_roles`, `memory_list`, `session_list`, `asset_search` and
   `function_graph` are diagnostic reads; none of them may mutate user state.
4. **Probe the loaders.** Call `load_role_skill` for `test-skill` where that tool
   exists, or use the host's native skill tool where it does not; call
   `load_reference` for `test-reference`; use `reference_search` for a known marker.
   Record which loader answered. Direct `read` is only a fallback.
5. **Record the probe result per family** as `available`, `available-degraded` (with
   the documented degradation), `absent`, or `gated` (present only behind an operator
   setting or OS permission that is not currently granted). A gated family the probe
   cannot open is a SKIP for the tests that need it, not a FAIL.
6. **Never fabricate authority.** The probe does not install packages, create a
   second top-level role, install an approval/completion policy or command check,
   enable the browse/computer gates, request OS permissions, or synthesize env
   variables. Those are operator decisions; the affected tests SKIP with a reason.

### Probe table

| Family | Candidate names | Availability signal | Cheap probe |
|---|---|---|---|
| Graph declarer | `graph_declare`, `graph_control`, `graph_status`, `graph_audit` | All four callable by the primary; not by a worker | `graph_status({scope:"session"})` read; record the declarer face |
| Graph worker | `graph_submit_outcome` | Present in a dispatched worker; the primary never has it as a worker | Worker self-report in tests 220/221 |
| Graph worker tools/code | `graph_worker_tools`, `graph_worker_code` | Discovery/code presentation actually granted to the worker | Worker self-report; never assumed from the declarer face |
| Team | `team_list_roles`, `team_create`, `team_add`, `team_send_event`, `team_status`, `team_remove`, `team_delete`, `team_resume` | All eight registered; DSH capability set only | `team_list_roles` |
| Task query | `task_search`, `task_budget`, `task_graph`, `task_chronology`, `task_export` | Names registered; `task_retry` must be absent | `task_search` with an empty filter |
| LSP | `lsp_servers` plus the 32 `lsp_*` tools | Family registered and at least one server reported for the temp language | `lsp_servers` |
| Session | `session_list`, `session_read`, `session_search`, `session_info`, `session_diff`, `session_fork` | Registered; DSH caller-scoped; opencode 2 degraded reads | `session_list` (DSH: own session only) |
| Asset core | `asset_search`, `asset_inspect`, `asset_validate`, `reference_search`, `load_reference`, `load_role_skill` | Registered by the role snapshot | `asset_search` or `load_reference({name:"test-reference"})` |
| Asset extras | `function_graph`, `skill_compose`, `context_assemble` | Registered individually; opencode/Pi only | `function_graph` (read-only) |
| Asset hot reload | `asset_hot_reload` | Registered; opencode only | Roster only — never call during the probe |
| Hooks/recovery | role `hooks.custom`, `hooks.builtin.edit_error`, `hooks.recovery.edit_error` | A custom hook module loaded and observable; a recovery chain configured | Manifest + host service probe; no paid turn |
| CLI | `rolebox` on `PATH` and the `bash` tool | `rolebox --version` exits 0; `rolebox monitor` needs a TTY | `rolebox --version` |
| Function system | `## Available functions` block, `## Function state:` block, `\|name\|` activation | Block rendered and the role's function roster resolves | Read the rendered prompt block; no cost |
| Native command/file/todo | `bash`/`shell`/`exec`, `read`, `write`, `edit`, `grep`, `glob`, `todowrite`/`todo_write`, `working_directory` | Exact names present in the session roster | Roster + a trivial `bash` echo |
| Computer | 12 `computer_*` tools | Tools registered; `computer_status` reports helper availability | `computer_status` |
| Browse | 23 `browse_*` tools | Tools registered; `browse_status` reports Playwright/browser state | `browse_status` |
| MCP resource | `list_mcp_resources`, `read_mcp_resource` | Present when the host exposes MCP resources for a configured server | `list_mcp_resources` |
| Web | `web_search`, `web_read`, `web_fetch` | Registered; network reachable | Roster; the network call belongs to the test |
| Memory | `memory_write`, `memory_recall`, `memory_list`, `memory_read`, `memory_update` | Registered for the caller's allowed scope; DSH prompt blocks observable | `memory_list` |
| Hashline | `hashline_read`, `hashline_edit` | Registered | Roster |
| Interactive terminal | `interactive_terminal` | Registered and a PTY-capable host | Roster |
| Graph worker presentation | `graph_worker_tools` / `graph_worker_code` | Same as the worker tools/code family | Worker self-report |

The probe record is part of the run evidence: module selection, module SKIPs and any
divergence between this matrix and the live session are derived from it, not guessed
from the host name. A documented degradation (opencode 2's reduced session reads, DSH's
caller-scoped sessions) is not a divergence; it is the contract the test asserts.

## Host matrix

Baseline for rolebox 2.2.0. `yes` means the family is documented as registered and
exercisable; `degraded` means registered with the named documented limitation;
`gated` means registered only when an operator setting or OS permission allows it;
`absent` means not registered and therefore a SKIP; `—` marks a lane that does not
apply (for example a worker face on a host with no worker sessions).

### Tool families

| Family | opencode 1.x | opencode 2.x | Pi | DSH | Codex |
|---|---|---|---|---|---|
| Graph declarer (`graph_declare`/`control`/`status`/`audit`) | yes | yes | yes | yes | absent |
| Graph worker (`graph_submit_outcome`) | yes | yes | yes | yes | absent |
| `graph_worker_tools` (discovery) | absent — explicit presentation is rejected | yes | yes | yes | absent |
| `graph_worker_code` (code presentation) | absent | absent — code invocation rejected | absent — code invocation rejected | yes | absent |
| Team (`team_*`) | absent | absent | absent | yes — DSH-only | absent |
| Task query (`task_*`) | yes | yes | yes | absent | absent |
| LSP (`lsp_*`, 32 tools) | yes | yes | yes | absent | absent |
| Session (`session_*`) | yes | degraded — list/children/todo/diff empty, fork/status null | yes | degraded — caller-scoped, self only | absent |
| Asset core (`asset_search`/`inspect`/`validate`, `reference_search`, `load_reference`) | yes | yes | yes | yes | yes |
| Asset extras (`function_graph`, `skill_compose`, `context_assemble`) | yes | yes | yes | absent | absent |
| Asset hot reload (`asset_hot_reload`) | yes | yes | absent | absent | absent |
| Web (`web_search`, `web_read`, `web_fetch`) | yes | yes | yes | yes | yes |
| Memory (`memory_*`) | yes | yes | yes | yes | yes |
| Hashline (`hashline_read`, `hashline_edit`) | yes | yes | yes | yes | yes |
| Interactive terminal (`interactive_terminal`) | yes | yes | yes | yes | yes |
| Computer (`computer_*`, 12 tools) | absent | absent | yes | yes | yes |
| Browse (`browse_*`, 23 tools) | absent | absent | gated — `browseUse` and Playwright | gated — `browseUse`, Playwright and the tool-guard seam | gated — `browseUse` and Playwright |
| MCP resource (`list_mcp_resources`, `read_mcp_resource`) | host-dependent | host-dependent | host-dependent | host-dependent — MCP resource tools when a server is configured | host-dependent — MCP client resources |

### Runtime services and prompt surfaces

| Surface | opencode 1.x | opencode 2.x | Pi | DSH | Codex |
|---|---|---|---|---|---|
| Function system and `## Available functions` | yes | yes | yes | yes | absent — MCP carries no role prompt |
| `## Function state:` / state-machine runtime | yes | yes | yes | yes | absent |
| Role prompt blocks (references, skills, sub-agents, memory) | yes | yes | yes | yes | absent — no role prompt |
| Custom hooks (`hooks.custom` / tool events) | yes | yes | yes | yes | absent — no host event stream |
| Recovery engine (`hooks.builtin.edit_error`, `hooks.recovery` chains) | yes | yes | absent — platform non-goal | absent — no rolebox recovery chain | absent |
| CLI (`rolebox list`/`info`/`status`/`config`/`logs`/`monitor`) | independent of the host: needs the `rolebox` binary on `PATH` and a shell; `monitor` additionally needs a TTY | same | same | same | same |
| `load_role_skill` | absent — host native skill tool | absent — host native skill tool | yes | yes | yes |
| `load_reference` / `reference_search` | yes | yes | yes | yes | yes |
| Graph run notifications (durable wake effect) | yes — the entry supplies a wake channel | yes — delivered as a retried pending effect | yes | yes | absent |

Notes on the cells that are easy to misread:

- **opencode 1.x worker presentation.** The 1.x plugin API cannot filter a worker's
  tools independently of permissions, so an explicit `toolPresentation` is refused.
  That documented refusal is a PASS in test 221; a 1.x worker keeps native tools and
  `graph_submit_outcome`.
- **opencode 2 session tools.** The six tools still register, but `session_list` and
  `session_children` report empty, `session_todo`/`session_diff` are empty, and
  `session_fork` returns null. Tests assert that documented degradation where it is
  the contract, and SKIP the fork sub-check when fork returns null.
- **DSH sessions are caller-scoped.** `session_list` returns only the calling session,
  cross-session `session_read`/`session_search` are refused with the documented
  "session access denied" refusal, and `children` is empty. `session_fork` can fork
  the caller's own session only; the cross-session fork assertion SKIPs.
- **DSH teams** are the only team implementation. Team tools register only when the
  host provides resumable agents, durable sessions, execution guards and prompt
  contributions. A peer test additionally requires a second installed top-level role.
- **Codex** is an MCP server surface: it owns no role prompt, sessions, dispatch
  backend, graph capability layer or host event stream. Its 18-tool intersection is
  the canonical rolebox face plus `load_role_skill`; computer/browse are gated by the
  host option. Codex therefore SKIPs the graph, team, task, LSP, session, function,
  hooks/recovery and prompt-block tests rather than failing them.
- **Pi** runs the lightweight service stack: no hot reload, extension service,
  recovery engine or TUI; it has LSP, task tools, asset extras, session tools, hooks
  and the canonical graph face.
- **opencode** is the only host with `asset_hot_reload`; both opencode entries share
  the canonical tool face plus LSP, function/asset extras and task tools.

## SKIP versus FAIL

The distinction is a contract, not a convenience.

| Condition | Outcome | Machine-readable signal |
|---|---|---|
| A capability family is absent from the live roster | SKIP | `capability_absent:<family>` |
| The family is registered but documented as degraded for this host, and the test targets the degraded contract | PASS | the documented degradation is the evidence |
| A documented rejection path is exercised (permission denial, grammar refusal, wrong credential, replay) | PASS | the named refusal/verdict is recorded |
| No second top-level role is installed | SKIP (team peer tests) | `peer_role_absent` |
| No operator-installed approval policy, completion policy or command-check binding | SKIP (the installed-policy branches of 203/218/219) | `operator_policy_absent` |
| No language server for the temp file's language | SKIP (LSP module or the individual test) | `language_server_absent` |
| Playwright or the browser build is unavailable | SKIP (browse tests) | `playwright_absent` / `browser_absent` |
| No TTY for the monitor test | SKIP (test 240) | `tty_absent` |
| `rolebox` is not on `PATH` | SKIP (the CLI module) | `cli_absent` |
| Screen-capture permission is not granted or no deterministic window/display target exists | SKIP (computer tests) | `os_permission_absent` / `window_target_absent` |
| MCP resource tools are not exposed | SKIP (test 129) | `mcp_resource_absent` |
| Network is unreachable for web tests | SKIP (environmental) | `network_unavailable` |
| The host refuses loop-round dispatch from a worker | SKIP (the loop module) | `loop_dispatch_unsupported` |
| The host exposes no wake channel for run notifications | SKIP (the delivery sub-check of 224) | `wake_channel_absent` |
| A present family returns a value or behavior that contradicts its documented contract | FAIL | `error_detail` naming the expected and observed contract |
| A required marker is missing, a value is wrong, a required command exits nonzero, or a required test was not run | FAIL | `error_detail`; an unexecuted required test is a suite failure, not a SKIP |
| The host or OS denies an action the test required and the test did not request that denial | FAIL | `error_detail`; report the denial verbatim |
| An environmental failure interrupts a test that was already executing | FAIL with `error_detail`, unless the test's own gate names the environment as optional | — |

Rules:

- **Absent family = SKIP.** This includes tool families the matrix marks absent and
  families the live roster does not show, even if the documentation says the host
  should have them. Record the divergence in the run summary; do not convert it into
  a FAIL for a test whose own contract is not about installation.
- **Present but contrary = FAIL.** If `browse_status` exists but a documented
  determinism guarantee fails, or a present `team_status` drops an event, that is a
  failure, not a SKIP.
- **A documented rejection path may PASS.** A test that requests a denial and receives
  the named refusal has passed, with the refusal text as evidence. A denial the test
  did not request is a failure.
- **Never fabricate installed authority.** Do not set policy environment variables,
  install approvals, create a second role, enable a gate, install a language server or
  grant OS permissions to turn a SKIP into a PASS. If the operator has not installed
  it, the branch SKIPs.
- **One reason per SKIP.** The capability reason is a stable `snake_case` code with
  the family or setting appended (`capability_absent:lsp`, `operator_policy_absent`).
  A module is reported SKIP only when every test in it is SKIP for the same class of
  reason; a partially executed module reports its per-test rows.
- **SKIP is not a denominator failure**, but it is not invisible either: the report
  counts SKIPs separately, names the capability reason for each, and never silently
  drops a test id.

## Tool-name resolution

Resolve the native tool name from the live session, then use it consistently. The
candidate names below are documented expectations; a name in `role.yaml`, a prompt or
this table never proves registration.

| Capability | Candidate names | Resolution rule |
|---|---|---|
| Command execution | `bash`, `shell`, `exec` | Use the registered native command tool. opencode 1.x/2.x, Pi and DSH use `bash`; Codex uses its own shell tool, not a rolebox MCP tool. |
| File read | `read` | All hosts with a native file surface; Codex's own read tool. |
| File write | `write` | Same as read. |
| File edit | `edit`, `apply_patch` | Use `edit` where registered; Codex may expose `apply_patch` instead of a rolebox-style edit. Never simulate an edit with a shell redirect when the edit tool exists. |
| Text search | `grep` | Use the host's grep tool; Codex may only have shell. |
| File discovery | `glob` | Use the host's glob tool; Codex may only have shell. |
| Todo list | `todowrite` (opencode 1.x/2.x), `todo_write` (DSH), host-specific on Pi/Codex | Resolve from the roster. A missing todo tool SKIPs the todo tests (16, 137) and the `sync_todos` observe probe, never FAILs them. |
| Working directory | `working_directory` (DSH), otherwise per-command `cwd`/`workdir` | Use the tool when present; otherwise pass the working directory on each command. Do not `cd` a persistent shell. |
| Hashline read/edit | `hashline_read`, `hashline_edit` | Canonical names on every host. |
| Role skill loader | `load_role_skill` (Pi, DSH, Codex), host native skill tool (opencode 1.x/2.x) | Prefer `load_role_skill`; fall back to the host's skill tool; direct `read` is the last resort. |
| Reference loaders | `load_reference`, `reference_search` | Canonical names on every host. |
| Graph declarer | `graph_declare`, `graph_control`, `graph_status`, `graph_audit` | Declaring primary only. A worker must not call them. |
| Graph worker | `graph_submit_outcome` | Worker's only graph tool; `graph_worker_tools`/`graph_worker_code` only via an explicit presentation on a supporting host. |
| Team | `team_list_roles`, `team_create`, `team_add`, `team_send_event`, `team_status`, `team_remove`, `team_delete`, `team_resume` | DSH only. |
| Task query | `task_search`, `task_budget`, `task_graph`, `task_chronology`, `task_export` | Never call `task_retry`; it is withheld by design and the suite asserts the role never instructs it. |
| LSP | `lsp_servers`, `lsp_diagnostics`, `lsp_goto_definition`, … (32 names) | Canonical on opencode/Pi; absent elsewhere. |
| Session | `session_list`, `session_read`, `session_search`, `session_info`, `session_diff`, `session_fork` | DSH caller-scoped; opencode 2 degraded; Codex absent. |
| Asset core | `asset_search`, `asset_inspect`, `asset_validate`, `reference_search`, `load_reference` | Role-snapshot tools on every host. |
| Asset extras | `function_graph`, `skill_compose`, `context_assemble` | opencode/Pi only. |
| Hot reload | `asset_hot_reload` | opencode only; one deliberate call per test. |
| Web | `web_search`, `web_read`, `web_fetch` | Canonical on every host. |
| Memory | `memory_write`, `memory_recall`, `memory_list`, `memory_read`, `memory_update` | Canonical on every host; DSH prompt blocks are a separate surface. |
| Signal | `signal` | Canonical on every host; it never settles a graph-v3 node. |
| Terminal | `interactive_terminal` | Canonical on every host that registers it. |
| Computer | 12 `computer_*` names | DSH/Pi/Codex when the gate/OS allow. |
| Browse | 23 `browse_*` names | DSH/Pi/Codex when the gate and Playwright allow. |
| MCP resources | `list_mcp_resources`, `read_mcp_resource` | Host-exposed only; otherwise the test SKIPs. |

## Executor lanes

The suite has three lanes. Only the first two execute tests.

| Lane | Who runs | What it may do | Modules |
|---|---|---|---|
| Primary | The declaring `rolebox-tester` primary | Declare graphs, call `graph_control`/`graph_status`/`graph_audit`, run bodies directly, aggregate the report | 14 modules: core-prompt, tools-hashline, session, lsp, memory, task, asset, web, permission, graph-v3, runtime-hooks-cli, team, computer, browse |
| Graph-dispatched runner | `runner-statemachine` and `runner-loop` workers | Run the module body that lives in their own prompt and submit one declared outcome; their graph face is only `graph_submit_outcome` | statemachine-signal (14), loop (4) |
| Graph fixture | Echo, Sleeper, Processor, Checker, restricted, validator, nester (+ grandchild), outcome-worker | Act as graph nodes/targets; they execute no suite test bodies | none |

Lane rules:

- **Graph/team/role-level tests never go to a dispatched worker.** A worker cannot
  declare, control or read a graph; it cannot create teams; it holds only its own
  outcome submission. The 14 primary-executed modules stay in the primary lane.
- **The runner modules are dispatched, not inlined.** Declare one v3 graph with the
  runner node, end the turn, and read `graph_status` once after the completion
  notification. Do not poll, do not call the retired imperative `graph_create` family,
  and do not ask a runner to declare its own graph.
- **Fixtures are targets, not executors.** A fixture's report is evidence inside a
  test body (marker, outcome data, refusal), never a per-test result row attributed to
  a fixture.
- **The primary owns the report.** Per-test rows from both runner lanes are merged by
  module and id; the runner's `graph_submit_outcome` data is the transport, not the
  final report.

## Report vocabulary

Per-test status is exactly one of the following uppercase strings. The v7 report
artifact uses these values and the field names below; no other per-test status exists.

| Status | Meaning | Required evidence |
|---|---|---|
| `PASS` | The documented behavior was observed in this run. A documented rejection path (permission denial, grammar/compile refusal, credential isolation refusal, replay) counts as PASS when the named refusal is recorded. | `evidence` names the tool call and the observed result/marker; `error_detail` is `""`. |
| `FAIL` | The family was present and the observed behavior contradicted its contract: a required marker was missing, a value was wrong, a required command exited nonzero, an unexpected refusal was returned, or the test could not complete after starting. | `evidence` and a non-empty `error_detail` naming the expected and observed contract. |
| `SKIP` | The capability the test requires was absent or not exercisable in this run. Absent family, no second role, no installed operator policy, no language server, no Playwright/browser, no TTY, no CLI, no OS permission/target, no MCP resources, no network, no worker loop dispatch, no wake channel — each is a SKIP with its machine-readable reason. | `evidence` states the probe result; `error_detail` is `""`; `capability_reason` is a stable `snake_case` code such as `capability_absent:lsp` or `peer_role_absent`. |

Per-test record fields: `id`, `name`, `status`, `evidence`, `error_detail`,
`duration_ms`, `executor` (the lane/role that produced the row), and
`capability_reason` (required for SKIP, empty otherwise).

Rules:

- `PASS`, `FAIL` and `SKIP` are the only per-test statuses. `not_run`, `error`,
  `blocked` and `unknown` are not test results: a required test that was not run is a
  suite-level failure recorded in the run's `incomplete_items`, and an execution error
  is a `FAIL` with `error_detail`.
- A module row aggregates its per-test rows and keeps the module's SKIP count visible;
  a module with every test SKIP is reported as skipped for its capability reason, and
  its tests do not count against the module denominator as failures.
- A run is complete only when every selected module has a result for every catalog id
  (PASS, FAIL or SKIP). A missing id is unfinished work, not an implicit SKIP.
- The status vocabulary is stable across hosts; only the capability reasons change.
