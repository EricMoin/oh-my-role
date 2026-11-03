# Test catalog — rolebox-tester 7.0.0

This document is the authoritative catalog of the rolebox-tester suite for rolebox
2.2.0 and the graph v3 outcome protocol. It fixes the module set, every test id, the
executor lane, the host gate, the body file that owns each module's `### Test <id>`
sections, the ids retired from the v6 catalog, and the fixture roster.

The suite has **178 tests**: **121 retained** ids carried over from the v6 (167-test)
catalog and **57 new** ids in 200–256. **46 ids** were retired from the v6 catalog.
The machine-readable block below is the single source of truth; the human table, the
retirement ledger and the body files must agree with it. The deterministic
`roles/rolebox-tester/tests/role-contract.test.js` asserts the arithmetic, the body
union and the live role tree, so do not edit one surface without the others.

## Machine-readable catalog

```json
{
  "suite_version": "7.0.0",
  "total": 178,
  "modules": [
    {
      "module": "core-prompt",
      "executor": "primary",
      "host_gate": "primary loaded role prompt plus load_role_skill/load_reference; prompt-block checks need the rendered prompt (Codex MCP has no role prompt)",
      "body": "references/core-tests.md",
      "ids": [
        "1",
        "2",
        "3",
        "17",
        "107",
        "110",
        "111",
        "112",
        "113",
        "114"
      ],
      "count": 10
    },
    {
      "module": "tools-hashline",
      "executor": "primary",
      "host_gate": "native command/file/todo family and hashline_read/hashline_edit registered; todo name resolved per host",
      "body": "references/tool-tests.md",
      "ids": [
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "27",
        "28",
        "29",
        "122",
        "123",
        "137",
        "140",
        "180",
        "181"
      ],
      "count": 15
    },
    {
      "module": "session",
      "executor": "primary",
      "host_gate": "session_list/read/search/info/diff/fork registered; DSH caller-scoped, opencode 2 degraded, Codex absent",
      "body": "references/session-memory-web-tests.md",
      "ids": [
        "20",
        "21",
        "22",
        "23",
        "24",
        "25",
        "138",
        "179"
      ],
      "count": 8
    },
    {
      "module": "lsp",
      "executor": "primary",
      "host_gate": "lsp_servers plus the requested lsp_* tool registered and a language server installed for the temp file language; opencode 1.x/2.x and Pi only",
      "body": "references/lsp-tests.md",
      "ids": [
        "26",
        "30",
        "31",
        "35",
        "36",
        "37",
        "38",
        "39",
        "40",
        "41",
        "42",
        "43",
        "44",
        "45",
        "46",
        "47",
        "48",
        "49",
        "50",
        "51",
        "52",
        "53",
        "54",
        "55",
        "56",
        "57",
        "250",
        "251",
        "252",
        "253",
        "254",
        "255"
      ],
      "count": 32
    },
    {
      "module": "memory",
      "executor": "primary",
      "host_gate": "memory_write/recall/list/read/update registered; prompt blocks and worker recall are DSH-only",
      "body": "references/session-memory-web-tests.md",
      "ids": [
        "59",
        "60",
        "61",
        "62",
        "63",
        "64",
        "108",
        "245",
        "246",
        "247",
        "248",
        "249"
      ],
      "count": 12
    },
    {
      "module": "statemachine-signal",
      "executor": "runner-statemachine",
      "host_gate": "function system with state-machine/observe-probe/signal-probe and the signal tool; graph-dispatched runner-statemachine node; Codex absent",
      "body": "subagents/runner-statemachine/prompt.md",
      "ids": [
        "85",
        "86",
        "87",
        "88",
        "89",
        "90",
        "91",
        "92",
        "93",
        "94",
        "95",
        "115",
        "116",
        "139"
      ],
      "count": 14
    },
    {
      "module": "loop",
      "executor": "runner-loop",
      "host_gate": "loop function and host dispatch support for loop rounds; graph-dispatched runner-loop node; SKIP when a worker cannot trigger loop rounds",
      "body": "subagents/runner-loop/prompt.md",
      "ids": [
        "19",
        "67",
        "97",
        "100"
      ],
      "count": 4
    },
    {
      "module": "task",
      "executor": "primary",
      "host_gate": "task_search/task_budget/task_graph/task_chronology/task_export registered; opencode 1.x/2.x and Pi only, task_retry withheld",
      "body": "references/asset-task-tests.md",
      "ids": [
        "69",
        "70",
        "71",
        "74",
        "75",
        "130",
        "142"
      ],
      "count": 7
    },
    {
      "module": "asset",
      "executor": "primary",
      "host_gate": "asset core tools on all hosts; function_graph/skill_compose/context_assemble on opencode 1.x/2.x and Pi; asset_hot_reload on opencode only",
      "body": "references/asset-task-tests.md",
      "ids": [
        "76",
        "77",
        "78",
        "79",
        "80",
        "81",
        "82",
        "83",
        "84",
        "84a",
        "117",
        "118",
        "131",
        "133",
        "134",
        "135",
        "182"
      ],
      "count": 17
    },
    {
      "module": "web",
      "executor": "primary",
      "host_gate": "web_search/web_read/web_fetch registered with network reachable; MCP resource tools only when the host exposes them",
      "body": "references/session-memory-web-tests.md",
      "ids": [
        "127",
        "128",
        "129",
        "256"
      ],
      "count": 4
    },
    {
      "module": "permission",
      "executor": "primary",
      "host_gate": "role permission enforcement and the restricted fixture reachable from a declared graph; Codex MCP has no permission prompt",
      "body": "references/tool-tests.md",
      "ids": [
        "106",
        "141"
      ],
      "count": 2
    },
    {
      "module": "graph-v3",
      "executor": "primary",
      "host_gate": "graph_declare/graph_control/graph_status/graph_audit registered (graph declarer face); not Codex; fixture agents resolvable",
      "body": "references/graph-v3-tests.md",
      "ids": [
        "18",
        "58",
        "120",
        "124",
        "125",
        "132",
        "136",
        "200",
        "201",
        "202",
        "203",
        "204",
        "205",
        "206",
        "207",
        "208",
        "209",
        "210",
        "211",
        "212",
        "213",
        "214",
        "215",
        "216",
        "217",
        "218",
        "219",
        "220",
        "221",
        "222",
        "223",
        "224"
      ],
      "count": 32
    },
    {
      "module": "runtime-hooks-cli",
      "executor": "primary",
      "host_gate": "custom hooks/recovery service, rolebox CLI on PATH and a TTY for the monitor test; each test SKIPs when its own gate is absent",
      "body": "references/runtime-tests.md",
      "ids": [
        "172",
        "235",
        "236",
        "237",
        "238",
        "239",
        "240"
      ],
      "count": 7
    },
    {
      "module": "team",
      "executor": "primary",
      "host_gate": "DSH only: team_* tools registered, a second top-level role installed for peer tests, creator-only tests stay cost-free",
      "body": "references/team-tests.md",
      "ids": [
        "225",
        "226",
        "227",
        "228",
        "229",
        "230",
        "231",
        "232",
        "233",
        "234"
      ],
      "count": 10
    },
    {
      "module": "computer",
      "executor": "primary",
      "host_gate": "computer_* registered (DSH, Pi, Codex) plus OS screen-capture permission and a known window/display target; no input gestures",
      "body": "references/computer-browse-tests.md",
      "ids": [
        "241",
        "242"
      ],
      "count": 2
    },
    {
      "module": "browse",
      "executor": "primary",
      "host_gate": "browse_* registered with the Playwright driver and a deterministic local page; DSH/Pi/Codex gated by browseUse",
      "body": "references/computer-browse-tests.md",
      "ids": [
        "243",
        "244"
      ],
      "count": 2
    }
  ],
  "retired_ids": [
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "32",
    "33",
    "34",
    "65",
    "66",
    "68",
    "72",
    "98",
    "99",
    "104",
    "105",
    "109",
    "121",
    "143",
    "144",
    "145",
    "147",
    "148",
    "149",
    "163",
    "164",
    "165",
    "166",
    "167",
    "168",
    "169",
    "170",
    "171",
    "173",
    "174",
    "175",
    "176",
    "177",
    "178",
    "84b",
    "84c",
    "84d",
    "84e",
    "119a"
  ],
  "fixtures": [
    {
      "name": "Echo",
      "kind": "inline",
      "dispatch_id": "rolebox-tester--echo",
      "top_level": true
    },
    {
      "name": "Sleeper",
      "kind": "inline",
      "dispatch_id": "rolebox-tester--sleeper",
      "top_level": true
    },
    {
      "name": "Processor",
      "kind": "inline",
      "dispatch_id": "rolebox-tester--processor",
      "top_level": true
    },
    {
      "name": "Checker",
      "kind": "inline",
      "dispatch_id": "rolebox-tester--checker",
      "top_level": true
    },
    {
      "name": "restricted",
      "kind": "directory",
      "path": "subagents/restricted",
      "dispatch_id": "rolebox-tester--restricted",
      "top_level": true
    },
    {
      "name": "validator",
      "kind": "directory",
      "path": "subagents/validator",
      "dispatch_id": "rolebox-tester--validator",
      "top_level": true
    },
    {
      "name": "nester",
      "kind": "directory",
      "path": "subagents/nester",
      "dispatch_id": "rolebox-tester--nester",
      "top_level": true
    },
    {
      "name": "grandchild",
      "kind": "nested",
      "path": "subagents/nester/subagents/grandchild",
      "dispatch_id": "rolebox-tester--nester--grandchild",
      "top_level": false
    },
    {
      "name": "outcome-worker",
      "kind": "directory",
      "path": "subagents/outcome-worker",
      "dispatch_id": "rolebox-tester--outcome-worker",
      "top_level": true
    },
    {
      "name": "runner-statemachine",
      "kind": "runner",
      "path": "subagents/runner-statemachine",
      "dispatch_id": "rolebox-tester--runner-statemachine",
      "top_level": true
    },
    {
      "name": "runner-loop",
      "kind": "runner",
      "path": "subagents/runner-loop",
      "dispatch_id": "rolebox-tester--runner-loop",
      "top_level": true
    }
  ]
}
```

## Module table

Fourteen modules are primary-executed. `statemachine-signal` and `loop` are
graph-dispatched runner modules whose bodies live in their runner prompts. The body
path is role-relative and names the file that owns the module's `### Test <id>`
sections; three documents carry two or three modules each because the bodies read
better together (the body union, not the module count, is what the contract test
asserts).

| Module | Tests | Ids | Executor | Host gate | Body reference |
|---|---|---|---|---|---|
| core-prompt | 10 | 1, 2, 3, 17, 107, 110, 111, 112, 113, 114 | primary | primary loaded role prompt plus load_role_skill/load_reference; prompt-block checks need the rendered prompt (Codex MCP has no role prompt) | `references/core-tests.md` ([core-tests.md](core-tests.md)) |
| tools-hashline | 15 | 11–16, 27–29, 122, 123, 137, 140, 180, 181 | primary | native command/file/todo family and hashline_read/hashline_edit registered; todo name resolved per host | `references/tool-tests.md` ([tool-tests.md](tool-tests.md)) |
| session | 8 | 20–25, 138, 179 | primary | session_list/read/search/info/diff/fork registered; DSH caller-scoped, opencode 2 degraded, Codex absent | `references/session-memory-web-tests.md` ([session-memory-web-tests.md](session-memory-web-tests.md)) |
| lsp | 32 | 26, 30, 31, 35–57, 250–255 | primary | lsp_servers plus the requested lsp_* tool registered and a language server installed for the temp file language; opencode 1.x/2.x and Pi only | `references/lsp-tests.md` ([lsp-tests.md](lsp-tests.md)) |
| memory | 12 | 59–64, 108, 245–249 | primary | memory_write/recall/list/read/update registered; prompt blocks and worker recall are DSH-only | `references/session-memory-web-tests.md` ([session-memory-web-tests.md](session-memory-web-tests.md)) |
| statemachine-signal | 14 | 85–95, 115, 116, 139 | runner-statemachine | function system with state-machine/observe-probe/signal-probe and the signal tool; graph-dispatched runner-statemachine node; Codex absent | `subagents/runner-statemachine/prompt.md` ([runner-statemachine/prompt.md](../subagents/runner-statemachine/prompt.md)) |
| loop | 4 | 19, 67, 97, 100 | runner-loop | loop function and host dispatch support for loop rounds; graph-dispatched runner-loop node; SKIP when a worker cannot trigger loop rounds | `subagents/runner-loop/prompt.md` ([runner-loop/prompt.md](../subagents/runner-loop/prompt.md)) |
| task | 7 | 69, 70, 71, 74, 75, 130, 142 | primary | task_search/task_budget/task_graph/task_chronology/task_export registered; opencode 1.x/2.x and Pi only, task_retry withheld | `references/asset-task-tests.md` ([asset-task-tests.md](asset-task-tests.md)) |
| asset | 17 | 76–84, 84a, 117, 118, 131, 133–135, 182 | primary | asset core tools on all hosts; function_graph/skill_compose/context_assemble on opencode 1.x/2.x and Pi; asset_hot_reload on opencode only | `references/asset-task-tests.md` ([asset-task-tests.md](asset-task-tests.md)) |
| web | 4 | 127, 128, 129, 256 | primary | web_search/web_read/web_fetch registered with network reachable; MCP resource tools only when the host exposes them | `references/session-memory-web-tests.md` ([session-memory-web-tests.md](session-memory-web-tests.md)) |
| permission | 2 | 106, 141 | primary | role permission enforcement and the restricted fixture reachable from a declared graph; Codex MCP has no permission prompt | `references/tool-tests.md` ([tool-tests.md](tool-tests.md)) |
| graph-v3 | 32 | 18, 58, 120, 124, 125, 132, 136, 200–224 | primary | graph_declare/graph_control/graph_status/graph_audit registered (graph declarer face); not Codex; fixture agents resolvable | `references/graph-v3-tests.md` ([graph-v3-tests.md](graph-v3-tests.md)) |
| runtime-hooks-cli | 7 | 172, 235–240 | primary | custom hooks/recovery service, rolebox CLI on PATH and a TTY for the monitor test; each test SKIPs when its own gate is absent | `references/runtime-tests.md` ([runtime-tests.md](runtime-tests.md)) |
| team | 10 | 225–234 | primary | DSH only: team_* tools registered, a second top-level role installed for peer tests, creator-only tests stay cost-free | `references/team-tests.md` ([team-tests.md](team-tests.md)) |
| computer | 2 | 241, 242 | primary | computer_* registered (DSH, Pi, Codex) plus OS screen-capture permission and a known window/display target; no input gestures | `references/computer-browse-tests.md` ([computer-browse-tests.md](computer-browse-tests.md)) |
| browse | 2 | 243, 244 | primary | browse_* registered with the Playwright driver and a deterministic local page; DSH/Pi/Codex gated by browseUse | `references/computer-browse-tests.md` ([computer-browse-tests.md](computer-browse-tests.md)) |

## Retirement ledger

Forty-six ids from the v6 catalog are retired; the remaining 121 v6 ids are
retained, and 57 new ids (200–256) take the suite to 178. A retired id is never
reused and never appears in a `### Test` body. Two earlier generations of
retirements are already history and are listed here only so the numbering is
unambiguous: ids **73, 96, 101, 102, 103, 126 and 146** were removed in v6.0, and
ids **150–162** (the old `loop_*` tool range) were removed in v5.0 when those tools
were deleted. A retired id either has no v3 surface at all or its semantics now
appear under a different id named in the last column.

| Retired id | v6 test | Why retired | Semantics now |
|---|---|---|---|
| 4 | Single-Node Dispatch (Graph Engine v2) | Imperative `graph_create`/`graph_add_node` dispatch no longer exists; v3 graphs are declared documents. | 200 (minimal declaration), 204 (entry dispatch and accepted outcome) |
| 5 | Non-Blocking Dispatch + Completion Reminder (Graph Engine v2) | There is no polling dispatch: a declared run is read once after the durable completion notification. | 204, 213 (read model), 224 (durable notification effect) |
| 6 | Session Continuation via Node Retry (Graph Engine v2) | v3 retry mints a successor attempt; it does not continue the old worker session. | 216 (attempt-scoped failure/retry), 217 (node-scoped retry) |
| 7 | Per-Node Timeout Budget (Graph Engine v2) | v3 owns the timeout as a plan ceiling plus an attempt-scoped control decision. | 212 (node budgets incl. `timeout_ms`), 216 (timeout control) |
| 8 | Node Output Truncation (Graph Engine v2) | Output windowing moved to the `graph_status` read model (`max_chars`/`tail`), not node options. | 213 |
| 9 | Graph Metrics (Graph Engine v2) | The v2 metrics counter surface is gone; budget/usage facts are read from status. | 213 (`include_budget`), 214 (`graph_audit` totals) |
| 10 | Graph Cancel (Graph Engine v2) | v3 cancel is a closed control command with its own refusal rules. | 215 (run-wide cancel, late submission refusal) |
| 32 | Node Session Continuation (Graph Engine v2) | Same reason as 6: attempts replace session continuation. | 216, 217 |
| 33 | Per-Node Completion Reminders (Graph Engine v2) | Notifications are now the run's durable effect, not per-node reminders. | 224, 213 |
| 34 | Node Timeout Budget on a Chained Node (Graph Engine v2) | Chained-node timeout is just a node budget plus the attempt timeout control in v3. | 212, 216 |
| 65 | Live-Graph Visibility — Parallel Node Activity Panel | The v2 live activity panel has no v3 counterpart; v3 is observed through the status read model. | 213 (`format: tree`, `include_progress`) |
| 66 | Live-Graph Visibility — Chained Node Activity | Same as 65. | 213 |
| 68 | Live-Graph Visibility — Error/Escalate Node State | Error/escalation state is reported by status and audit, not a panel. | 213 (`status` filter), 214 |
| 72 | Graph Node Retry (in the task module) | Node retry is a graph control, not a task-query test. | 216, 217 |
| 84b | Hot Reload — Deleted Role Cleanup | The supported hot-reload contract is the deliberate one-shot rescan (`asset_hot_reload`); deletion cleanup through the watcher is internal and not a stable observable. | 84, 84a (discovery after one-shot rescan) |
| 84c | Hot Reload — New Subagent Becomes Dispatchable | Subagent re-resolution after a manual reload is not separately observable from role discovery. | 84a (new-role discovery), 113 (subagent roster block) |
| 84d | Hot Reload — File Watcher Auto-Trigger | The debounced file watcher is internal behaviour; the suite calls the reload tool explicitly instead of racing a watcher. | 84 (manual reload), 84a |
| 84e | Hot Reload — Failure Reporting | A failed scan's rollback/reporting is not a documented public contract. | 84 (successful reload contract) |
| 98 | Loop State Schema — Fields Survive Serialization | The loop store's internal schema is not a public contract; the file path and identity remain covered. | 97 (persistence), 100 (expected directory), 210 (bounded loop behaviour) |
| 99 | Loop Store Structure Supports Dispatching Phase Recovery | Dispatch-phase recovery internals were retired; supported recovery is the graph retry path. | 210, 217 |
| 104 | Graph Metrics — Runtime Counters | The metrics surface no longer exists. | 213 (`include_budget`), 214 |
| 105 | Graph Status — Safe All-Node & Per-Node Liveness | Liveness and the `include_liveness` flags are retired; status has scopes, filters and depth instead. | 213 |
| 109 | System Prompt — `<graph_state>` Block Structure | The angle-bracket introspection block is retired; prompt blocks are markdown headings. | 110–114 (markdown prompt blocks) |
| 119a | Nested Dispatch — 3-Level Deep | The nester fixture no longer instructs recursive dispatch; recursive dispatch is not a supported v3 test path for a worker. | 113 (ten top-level sub-agents), fixture roster contract |
| 121 | Multi-Turn Node Session Continuation | v3 has attempts, not multi-turn session continuation. | 216, 217 |
| 143 | Live-Graph Visibility — Live Node Activity Panel | No live panel in v3. | 213 (`include_progress`) |
| 144 | Live Visibility — Loop Round Progression (task_chronology) | Loop progress is read from the v3 loop group state, not from task chronology. | 210, 213 (`include_loops`) |
| 145 | Live-Graph Visibility — Error State Display | Error display is a status/audit read, not a panel. | 213, 214 |
| 147 | Visibility — Session Activity State (session_info) | v3 exposes no live activity state; session_info retains its own read contract only. | 23 (`session_info`), 213 |
| 148 | Visibility — Multi-Function State Display (`<function_state>` block) | The function state block is now a markdown `## Function state:` heading. | 90 (phase reporting), 139 (signal_observed condition) |
| 149 | Live-Graph Visibility — JSON Snapshot During Activity | Snapshot reads moved to `graph_status format: json`. | 213 |
| 163 | Graph Engine v2 — Graph Construction & Linear-Chain Execution | The v2 imperative construction/linear-run model is replaced by declared plans. | 200, 201, 204 |
| 164 | Graph Engine v2 — Fan-Out/Fan-In Joins & Signal-Routed Edges | v3 has declared joins and accepted-result inputs; signals never route a v3 graph. | 209 (fan-out/join all), 201 (any/quorum joins) |
| 165 | Graph Engine v2 — Bounded Loops & Signal Propagation | v3 uses bounded loop groups; signal propagation into run control is retired. | 210 (loop group), 139 (signals do not settle) |
| 166 | Graph Engine v2 — Approval Gate & Cancellation | Approval is a durable v3 control request; cancellation is a run-wide control. | 218 (approval), 215 (cancel) |
| 167 | Graph Engine v2 — graph_status Observability Flags | The v2 flags are gone; the v3 read model has its own argument groups. | 213 |
| 168 | Graph Engine v2 — on_condition Edges | The declaration grammar is closed; routes are outcome-bound edges only. | 201 (grammar refusals), 204 (edge routing) |
| 169 | Graph Engine v2 — Loop mode & the Retired termination Argument | Loop mode is a v3 loop group with `max_traversals`, `continuation_outcome` and `exit_outcome`. | 201, 210 |
| 170 | Graph Engine v2 — Node & Graph budget Limits | v3 budgets are `budget.max_executions` and the node ceiling set. | 201, 211, 212 |
| 171 | Graph Engine v2 — Node Liveness / Stall | Liveness was a v2 surface; v3 reports timeouts as attempt decisions. | 216, 212 |
| 173 | `graph:` Role-Config Key — Recognized-with-Warning, No Runtime Effect | The role manifest no longer carries a `graph:` block; v3 runs are declared per graph. | 200, 202 (re-declaration) |
| 174 | Graph Engine v2 — Pending-Approval Gate Enumeration | Approval requests are read from the v3 run record, not enumerated from a gate list. | 218, 213 |
| 175 | Graph Engine v2 — Escalate-Retry Budget & `backoff_ms` | v3 retries are trusted controls with no backoff/escalate budget; signals never settle a node. | 216, 217, 139 |
| 176 | Graph Engine v2 — Graph Validation Rejections | The v3 grammar/compile refusal catalogue replaces the v2 validation test. | 201, 203 |
| 177 | Graph Engine v2 — `graph_approve` No-Op Idempotence | `graph_approve` is gone; approval decisions are durable v3 controls that replay or refuse a competing decision. | 218 |
| 178 | `<graph_state>` Live Content During Activity | The block is retired; live reads use the status read model. | 213, 110–114 |

## Fixture roster

Fixtures are test targets, never executors. Inline fixtures are declared in
`role.yaml`; directory fixtures and the two runners live under `subagents/` and are
dispatched by full id. Ten entries are top-level; the nester's grandchild is nested
under the nester and is not an eleventh top-level entry.

| Fixture | Kind | Path / declaration | Dispatch id | Role in the suite |
|---|---|---|---|---|
| Echo | inline | `role.yaml` `subagents` | `rolebox-tester--echo` | Basic dispatch and echo marker. |
| Sleeper | inline | `role.yaml` `subagents` | `rolebox-tester--sleeper` | Delay/slow fixture for timing and cancellation. |
| Processor | inline | `role.yaml` `subagents` | `rolebox-tester--processor` | First stage; appends its processed marker. |
| Checker | inline | `role.yaml` `subagents` | `rolebox-tester--checker` | Second stage; approves or asks for revision. |
| restricted | directory | `subagents/restricted` | `rolebox-tester--restricted` | Declared graph node used for the permission-denial tests. |
| validator | directory | `subagents/validator` | `rolebox-tester--validator` | Graph node that submits pass/fail with its validator markers. |
| nester | directory | `subagents/nester` | `rolebox-tester--nester` | Reports its own registration; it no longer dispatches recursively. |
| grandchild | nested | `subagents/nester/subagents/grandchild` | `rolebox-tester--nester--grandchild` | Nested descendant; registration-only, not a top-level entry. |
| outcome-worker | directory | `subagents/outcome-worker` | `rolebox-tester--outcome-worker` | Submission fixture for credential, replay and evidence variants; also performs the cross-role memory read. |
| runner-statemachine | runner | `subagents/runner-statemachine` | `rolebox-tester--runner-statemachine` | Graph-dispatched executor for the statemachine-signal module. |
| runner-loop | runner | `subagents/runner-loop` | `rolebox-tester--runner-loop` | Graph-dispatched executor for the loop module. |

## Suite invariants

- 16 modules; the counts are core-prompt 10, tools-hashline 15, session 8, lsp 32,
  memory 12, statemachine-signal 14, loop 4, task 7, asset 17, web 4, permission 2,
  graph-v3 32, runtime-hooks-cli 7, team 10, computer 2, browse 2 — sum 178.
- Ids are unique across the catalog. The only letter-suffixed retained id is `84a`;
  the retired letter ids are `84b`, `84c`, `84d`, `84e` and `119a`.
- New ids are exactly 200–256 (57 ids). Retained ids are the other 121 catalog ids.
- Eleven distinct body paths: nine reference documents plus the two runner prompts.
  Two documents carry more than one module: `references/tool-tests.md` owns
  tools-hashline (15) + permission (2) = 17; `references/session-memory-web-tests.md`
  owns session (8) + memory (12) + web (4) = 24; `references/asset-task-tests.md`
  owns asset (17) + task (7) = 24; `references/computer-browse-tests.md` owns
  computer (2) + browse (2) = 4.
- Body union: core-tests 10, lsp 32, graph-v3 32, runtime-tests 7, team 10, tool-tests
  17, session-memory-web 24, asset-task 24, computer-browse 4, runner-statemachine
  prompt 14, runner-loop prompt 4 — sum 178.
- Every body section is exactly `### Test <id>`; a body file's id set must equal the
  union of the ids of the modules mapped to it, with no extra and no missing id.
  `test-catalog.md` is excluded from the retired-vocabulary sweep because it records
  the retired vocabulary deliberately; every other file must be free of it.
- Executors: 14 modules are `primary`; `runner-statemachine` and `runner-loop` are
  the only graph-dispatched executors. The graph/team/role-level tests are never
  assigned to a dispatched worker, whose graph face is only `graph_submit_outcome`.
