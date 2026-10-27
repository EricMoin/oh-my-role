---
name: graph-protocol
description: Canonical rolebox Graph v3 protocol reference for generated roles — tool surface, declaration grammar, accepted-outcome transport and bounded recovery
---

# Graph v3 protocol (generated-role contract)

This is the canonical protocol reference the Role Creator teaches and validates
with. Verify these source contracts against the selected rolebox checkout; a
matching package version alone does not prove compatibility:

- `docs/graph-outcome-protocol.md` — the declaration grammar, acceptance,
  controls and storage semantics.
- `docs/graph-v3-operations.md` — the run-level execution ceiling, per-node
  budgets and the host-installed approval/completion capabilities.
- `src/graph/compiler/declaration-v3.ts` — the grammar's TypeScript types,
  including `tools?: string[]` and host-dependent `toolPresentation` on a node.
- `src/graph/compiler/parse-declaration-v3.ts` — the closed key sets and the
  front-end refusals.
- `src/graph/compiler/compile.ts` — loop-group compilation, edge/outcome
  resolution, tool reading and the terminal-outcome check.
- `src/graph/host/tool-binding.ts` — the graph tool vocabulary and the worker
  grant boundary.
- `src/loader/role-loader.ts` — how a role manifest's `tools:` map and its
  retirement key are read.

The installed runtime's tool schemas are authoritative if they differ from this
reference. Re-verify against those sources when changing the selected checkout
or host, even if the package version stays the same.

## The tool surface

The Graph v3 namespace currently contains seven names; availability depends on the host
(`src/graph/host/tool-binding.ts`, `GRAPH_TOOL_NAMES`):

| Tool | What it does | Who may call it |
| --- | --- | --- |
| `graph_declare({declaration, graph_id?, supported_validators?})` | Strict parse, compile, capability preflight, persist and start or resume one graph in a single call; the result reports `persisted` and `start.kind` | The declaring session only |
| `graph_submit_outcome({graph_id, node_id, outcome_id, credential, data?, evidence_refs?})` | Settles the caller's own attempt with one outcome that attempt's node declares; the host derives attempt, submission and compiled-revision identity | Every worker, for its own node and attempt only |
| `graph_control(command, ...)` | Trusted lifecycle command on a run or an attempt: `failure`, `timeout`, `cancel`, `budget-stop`, `retry`, `approval-request`, `approve`, `reject` | The declaring session only |
| `graph_status({...})` | Reads the shared read model: phase, runs, nodes, attempts, accepted results, loops, approvals, controls, budget and unsettled effects | The declaring session only |
| `graph_audit({...})` | Read-only drain and migration inventory of the authoritative store; mutates nothing | The declaring session only |
| `graph_worker_tools(...)` | Discovers the node's granted host tools | Workers with discovery/code presentation on a supporting host |
| `graph_worker_code(...)` | Composes granted host tool calls in JavaScript | dsh workers with code presentation |

There is **one start path**: `graph_declare`. No separate run tool and no
dry-run tool exist. A dispatched worker's graph face grants exactly
`graph_submit_outcome` (`WORKER_GRANTED_GRAPH_TOOLS`). Host-supported presentation can add discovery/code entries.
The runtime enforces the worker boundary; the director owns graph inspection and
control, and every credential belongs to one attempt.

### Host capability selection

Select the actual host before generating a role or declaration:

| Host | Workspace operations | Optional presentation |
| --- | --- | --- |
| OpenCode 1.x | Native worker tools and `graph_submit_outcome` | Omit `toolPresentation`; explicit presentation is unsupported |
| OpenCode 2 | Native worker tools and `graph_submit_outcome` | `native` / `discover`; code mode is unsupported |
| Pi | Native worker tools and `graph_submit_outcome` | `native` / `discover`; code mode is unsupported |
| dsh | Authorized native tools, rolebox capabilities and `graph_submit_outcome` | `native` / `discover` / `code` |
| Codex | The rolebox MCP server does not own graph worker sessions | Do not declare rolebox graphs; use a non-graph role and the host's own collaboration tools |

For ordinary workspace work, omit both `tools` and `toolPresentation` on the
node to retain the host's native baseline. Extra integrations require the actual
registered host tool names in `tools`, never assumed names such as `Write`,
`Edit`, or `Bash`. A grant does not install a tool. With explicit presentation,
OpenCode 2/Pi use `bash` and `graph_submit_outcome` as their baseline; declare any
additional tools and verify the host supports that mode. On dsh, task tools inherit
the parent's authorization and remain subject to role and host permissions; the legacy
node `tools` list is not an additional restriction. See `docs/worker-tools.md`.

## Declarer and worker split

A role manifest's `tools:` block is the machine-checkable marker of the split.
The loader surfaces it on `RoleConfig.tools` as a `Record<string, boolean>` and
a subagent's `tools` inherits from its parent unless it declares its own
(`src/loader/role-loader.ts`; seven fields inherit, `tools` and `permission`
among them).

- **Declaring role** (primary): `graph_declare`, `graph_control`, `graph_status`
  and `graph_audit` `true`; `graph_submit_outcome` `false`.
- **Worker subagent**: the four declarer tools `false` and
  `graph_submit_outcome` `true`. Native file and command permissions use the
  target host's names and follow the worker's job. Denying file-edit tools while
  allowing a shell does not enforce read-only execution.

Inside a graph, extra capabilities use the **node grant** together with the
host's baseline and permission enforcement: a declared node `tools` list names extra **host** tools
only, and a `graph_`-prefixed name in that list admits nothing because the graph
namespace is refused before the entries are consulted
(`isGraphFaceToolName` / `declaredToolsAllow`). A node that genuinely needs a
host capability declares that tool itself; the worker baseline needs none.

## The v3 declaration grammar

`graph_declare` accepts one declaration object. The grammar is closed: an unknown
key, a wrong type or a malformed limit is refused with a stable code and the
failing path, and nothing is persisted. Author the whole graph as **one
declaration**; there is no incremental node/edge construction tool.

### Root fields

| Field | Required | Meaning |
| --- | --- | --- |
| `version` | Yes | The literal `3` — the authoring-format tag, not a storage or protocol number |
| `name` | Yes | Non-empty graph name; the grammar carries no separate id, so the name **is** the graph id (an explicitly supplied `graph_id` must equal it) |
| `budget` | No | `{max_executions}`, a non-negative safe integer: the run-level execution ceiling |
| `nodes` | Yes | Node declarations; ids unique |
| `edges` | Yes | Directed control edges; each binds exactly one outcome of its source node |
| `loop_groups` | No | Bounded-cycle groups; ids unique |
| `completion_policy` | No | `{id, revision}`: the completion-policy revision the graph **requests** for its natural-completion mappings — a request, never a grant |

### Node fields

| Field | Required | Meaning |
| --- | --- | --- |
| `id` | Yes | Unique node id within the graph; edge endpoints and loop members name it |
| `agent` | Yes | Agent to dispatch, resolved by the host from its role catalog; the compiler does not validate it against a catalog |
| `prompt` | Yes | The prompt the worker executes; the node brief carries every input it needs |
| `outcomes` | Yes | At least one outcome declaration; outcome ids unique within the node |
| `completion` | No | `{mode: "explicit"}` or `{mode: "natural", outcome}`; **absent leaves the policy open** |
| `budget` | No | `timeout_ms`, `max_input_tokens`, `max_output_tokens`, `max_cost_usd`; `max_retries` is refused by name |
| `inputs` | No | The accepted results this node consumes, each `{from, outcome, when?: "triggered"}`, resolved at compile time |
| `join` | No | `{strategy: "all"}`, `{strategy: "any"}` or `{strategy: "quorum", quorum: N}` |
| `tools` | No | A **string array** of extra host tool names (or trailing-`*` prefixes) beyond the worker baseline; absent means baseline only |
| `toolPresentation` | No | `{mode: "native" | "discover" | "code", preload?: string[]}`; host support must be checked, and preloads must be covered by `tools` |
| `contractRef` | No | The exact contract identity the node is bound to |

### Outcome, edge and input details

- An **outcome** is `{id, data?, acceptance?}`. `data` is `{schema, version?}`;
  `acceptance` is an ordered gate sequence of `{validator, version?}`
  requirements. Outcome ids are a set — declaration order carries no meaning.
  The runtime injects this node's compiled outcome IDs, data schema identities/versions,
  acceptance requirements and completion policy. Schema identities name executable
  validator capabilities; they do not contain a field-level JSON Schema.
- An **edge** is `{from, to, outcome}`. Every endpoint must name a declared node
  and every edge outcome must be declared by its source node. There is no
  implicit "any outcome" edge and no predicate field.
- An **input** names a producer and one of its outcomes. Inputs are fixed and
  upstream: a consumer never reads "the latest result of some type" at run time,
  and a repeated or self-referential reference is refused. Edges schedule work;
  inputs deliver payloads.
- **Join** waits for feeders, excluding the loop continuation back-edges of the
  group they belong to. A non-entry node whose feeder can only run after it is
  refused (`unsatisfiable-join`).

### Loop groups

A loop group is `{id, nodes, max_traversals, continuation_outcome,
exit_outcome, progress?}`:

- `max_traversals` is a hard **positive** cap; an open cap is refused
  (`loop-group-missing-limits`).
- `continuation_outcome` is the outcome that re-enters the loop. It must be
  declared by a member node, and **every edge carrying it must stay inside the
  group**; an edge carrying it out of the group is refused
  (`loop-continuation-outside-group`).
- `exit_outcome` is the outcome that leaves the loop and must likewise be
  declared by a member node.
- Members are a set; the plan sorts them by id.
- A cycle that no declared loop group covers cannot be compiled: loop traversal
  is the engine's only bounded repetition. A graph must also be able to
  terminate — an outcome with no outbound edge is a declared exit, and a graph
  whose every outcome is bound is refused.

### Budgets

`budget.max_executions` is the run-level ceiling. Each entry dispatch, each
successor an acceptance arms and each attempt a `retry` mints spends one
execution; a re-delivery or recovery of the same attempt spends nothing. A
reserved execution is never refunded — settlement, cancellation and
reconciliation all leave it counted. Per-node `budget.timeout_ms` is the
wall-clock ceiling (its value `0` is the documented opt-out that disables the
per-node watchdog). Automatic retry has no semantics in this build, so
`max_retries` is refused everywhere, including as `0`.

## Completion: explicit is the shipped default

`completion: {mode: "explicit"}` means the agent must submit one of the node's
declared outcomes; nothing else settles it. `completion: {mode: "natural",
outcome}` means runtime completion maps to **exactly** that named outcome, and it
cannot be authorized without a `completion_policy` request that the host has
authorized: a declaration that maps natural completion with no request compiles
to a non-executable draft naming the mapping, and the tool refuses a draft by
name. Hosts install completion policies from `ROLEBOX_GRAPH_COMPLETION_POLICIES`;
a declaration can only request an `(id, revision)` pair and never carries rules,
a body or a digest (`docs/graph-v3-operations.md`).

Every role-creator template therefore declares `completion: {mode: "explicit"}`
on **every** node, so no host-authorized completion policy is needed and every
settlement arrives through `graph_submit_outcome`.

## The canonical declaration

The declaration below is role-creator's own generated-role pipeline: the
generator writes the role, the validator verifies it and may send it back, and
the grader scores eval transcripts. It is the single source of truth for this
role's topology; a contract test reads this block out of this file, so the
documented contract and the tested contract are the same object.

The full three-stage example assumes authorized evaluation transcripts already
exist. For initial role creation, omit the grader node and validator-to-grader
edge; validator pass then terminates the generation/validation graph. That subset
needs at most eight executions for the initial round plus three repair traversals.
The full example needs nine, including final grading. A declaration does not
authorize paid evaluation or manufacture missing transcripts.

Replace `name` with the request identity and replace each prompt placeholder with
the real brief for the current snapshot; keep the pinned node ids, agents,
declared outcomes, explicit completion, accepted-result inputs and the loop
group. Select host-specific extra tool grants only when the task needs them. The block is intentionally unindented — the opening fence at
column 0, the JSON object on the very next line and the closing fence at column 0
— because the contract test's reader matches exactly that shape.

```json
{
  "version": 3,
  "name": "role-creator-generated-role-pipeline",
  "budget": {
    "max_executions": 9
  },
  "nodes": [
    {
      "id": "role-creator--generator",
      "agent": "role-creator--generator",
      "prompt": "Template placeholder - replace with the real authoring brief for this node: the user intent, the chosen template, the target role directory, the reference roles to mirror and the selected runtime contract for the generated manifest. Write every artifact the new role needs and report the exact paths you wrote. Declare the generated role for Graph v3: a node's tools is the grammar's string array of host tool names, every node declares its outcomes and completion {mode: explicit}, and every edge binds one declared outcome of its source. Never write a retired imperative graph-authoring tool name, a retired role.yaml orchestration key, or an outcome-less edge into a generated role. Use generated when the files are written, blocked when the user intent or a required reference is missing, and failed when the work cannot be completed. Produce the authoring report of references/schemas.md with schema_version 1. On a repair attempt read the delivered validator revise input and apply its required_revisions within the authorized target role directory. Do not repeat the initial brief without incorporating this feedback.",
      "outcomes": [
        {
          "id": "generated"
        },
        {
          "id": "blocked"
        },
        {
          "id": "failed"
        }
      ],
      "completion": {
        "mode": "explicit"
      },
      "budget": {
        "timeout_ms": 600000
      },
      "inputs": [
        {
          "from": "role-creator--validator",
          "outcome": "revise",
          "when": "triggered"
        }
      ]
    },
    {
      "id": "role-creator--validator",
      "agent": "role-creator--validator",
      "prompt": "Template placeholder - replace with the real verification brief for this node: the generated role directory, the validation catalog and selected runtime source it is checked against and the concrete checks to run. Verify read-only: run the role validator and the scoped protocol checks without editing the generated role, its manifests or its fixtures. Use pass when no supported blocking issue exists in the assigned scope, revise for concrete blocking issues with stable required fixes, blocked when a required input is missing, and failed when verification cannot proceed. Produce the gate report of references/schemas.md with schema_version 1. Read the delivered authoring report to locate the target directory and changed files; verify the current files independently. Return concrete required_revisions on revise.",
      "outcomes": [
        {
          "id": "pass"
        },
        {
          "id": "revise"
        },
        {
          "id": "blocked"
        },
        {
          "id": "failed"
        }
      ],
      "completion": {
        "mode": "explicit"
      },
      "budget": {
        "timeout_ms": 600000
      },
      "inputs": [
        {
          "from": "role-creator--generator",
          "outcome": "generated"
        }
      ]
    },
    {
      "id": "role-creator--grader",
      "agent": "role-creator--grader",
      "prompt": "Template placeholder - replace with the real grading brief for this node: the eval cases and the transcripts to score, the expectations of each case and the pass threshold. Grade read-only against transcript evidence and never rewrite the graded artifacts. Use graded when every supplied case has a verdict, blocked when the eval cases or transcripts are missing, and failed when grading cannot proceed. Produce the grading report with schema_version 1. Read the delivered passing gate report. Eval cases and transcripts must also be supplied explicitly in the brief or as readable paths; the gate report is not an eval transcript.",
      "outcomes": [
        {
          "id": "graded"
        },
        {
          "id": "blocked"
        },
        {
          "id": "failed"
        }
      ],
      "completion": {
        "mode": "explicit"
      },
      "budget": {
        "timeout_ms": 600000
      },
      "inputs": [
        {
          "from": "role-creator--validator",
          "outcome": "pass"
        }
      ]
    }
  ],
  "edges": [
    {
      "from": "role-creator--generator",
      "to": "role-creator--validator",
      "outcome": "generated"
    },
    {
      "from": "role-creator--validator",
      "to": "role-creator--generator",
      "outcome": "revise"
    },
    {
      "from": "role-creator--validator",
      "to": "role-creator--grader",
      "outcome": "pass"
    }
  ],
  "loop_groups": [
    {
      "id": "generate-validate",
      "nodes": [
        "role-creator--generator",
        "role-creator--validator"
      ],
      "max_traversals": 3,
      "continuation_outcome": "revise",
      "exit_outcome": "pass"
    }
  ]
}
```

How the pinned declaration reads:

- **Nodes and agents.** Three nodes whose ids match their agents exactly and name
  the role's real subagents on disk: `role-creator--generator`,
  `role-creator--validator` and `role-creator--grader`.
- **Outcomes.** The generator settles `generated`, `blocked` or `failed`; the
  validator settles `pass`, `revise`, `blocked` or `failed`; the grader settles
  `graded`, `blocked` or `failed`.
- **Completion.** `{mode: "explicit"}` on every node, so every settlement is a
  submission and no host completion policy is required.
- **Routes.** `generated` sends the new role to verification; `revise` sends it
  back to the generator; `pass` releases it to grading. The node's other
  outcomes carry no outbound edge and are declared exits.
- **The bounded cycle.** The single `loop_groups` entry
  `generate-validate` covers the generator and the validator, caps the
  revise cycle at `max_traversals: 3`, re-enters on `revise` and leaves on
  `pass`; the `revise` edge stays inside the group, as the compiler requires.
- **Inputs.** The validator consumes the authoring report; the grader consumes
  the passing gate report. The generator consumes `revise` with `when: "triggered"`,
  so its entry attempt needs no prior review and repair attempts receive the exact
  accepted review payload. Edges alone never deliver that payload.
- **Budgets and tools.** `budget.max_executions: 9` covers the initial generator/validator
  pair, three repair pairs and the final grader; every node carries `budget.timeout_ms`. These nodes
  use the host workspace baseline and declare no extra `tools` or presentation.
  Read-only verification is a job constraint plus the host sandbox, not a
  guarantee supplied by this declaration.

## Accepted-result transport

Only one thing settles a node:

> an **accepted** decision whose `verdict` is `committed` or `replayed` and whose
> `refusals` are empty.

- A **rejection** returns the per-requirement outcomes that failed and leaves the
  attempt open; a payload that fails a declared acceptance gate is a rejection.
- A **refusal** returns structured repair diagnostics and writes nothing — the
  attempt stays exactly as it was, so the caller repairs the input and submits
  again. A forged, unknown or another node's credential is refused, an outcome
  the node never declared is refused, and a record that is not this build's
  declared outcome-protocol state is refused by name.

The runtime owns worker credential, submission and completion-fallback instructions.
Generated workers need only the domain brief and report contract.

The declaring session reads committed state with:

    graph_status({graph_id, scope: "all", format: "json", include_output: true, include_history: true})

`attempts[].accepted` carries the outcome identity and `attempts[].result`
carries the accepted data; `run_id` and `node_id` select the intended producer.
JSON output is not paginated by `offset`/`max_chars` (those apply to non-JSON
output), so narrow by `run_id`/`node_id` when the host display truncates it. A
complete graph can still contain a failed or blocked business outcome and
unsettled effects: graph phase is not business success, and a settled node is not
a passing result. Consumers check `references/schemas.md` and prerequisite
completeness before working.

## Node briefs

Node sessions share no conversation history. Every node prompt must carry enough
context to act alone:

- Goal, expected behaviour, the authorization already given and the concrete
  question the node answers.
- The full subtask, the plan revision and the request counters.
- The readable inputs: the artifacts to read, the sandbox scope and the commands
  the node may run. A read-only posture is agent discipline plus whatever the
  host sandbox enforces; workspace commands run with the host's session policy,
  so the declaration cannot itself enforce a read-only sandbox.
- Domain-specific outcome meanings, evidence requirements and acceptance criteria.
  Keep `outcomes`, data contracts, acceptance requirements and completion policy
  in the declaration; the runtime injects them with the attempt identity, credential and settlement instructions. Do not copy
  those mechanics or graph-access restrictions into node prompts or gate skills.
  A named data schema is a capability identity, not a replacement for readable
  field documentation: retain payload guidance such as `references/schemas.md`.
- For a consumer, the declared `inputs` it reads. If a declared input is missing
  or incomplete, settle `blocked` with the exact missing evidence instead of
  inventing a predecessor result.

## Bounded recovery with graph_control

`graph_control` acts on the plan and the store, not on business data:

| Command | Scope | Meaning |
| --- | --- | --- |
| `failure` | attempt | Records a failed attempt out of band; distinct from the `failed` business outcome a worker submits |
| `timeout` | attempt | Records an attempt that exceeded its declared time |
| `cancel` | run or attempt | Contains obsolete or superseded work |
| `budget-stop` | run | Records an exhausted run and answers with the budget report |
| `retry` | node or run | Mints a NEW attempt (node) or a NEW run with the SAME immutable plan (run); spends budget |
| `approval-request` | attempt | Raises a durable approval request naming one approver session and an epoch-millisecond deadline |
| `approve` / `reject` | request | The named approver session records the decision |

- A node-scoped `retry` is only for a diagnosed transient failure after
  confirming external execution and effects; it does not reset every descendant
  and does not guarantee session reuse. A run-scoped `retry` re-executes a
  **terminal** run as a successor run with a fresh execution allowance.
- A node-scoped `retry` on a **stopped** run is refused (`run-stopped`); recover
  the abandoned work with a run-wide `retry`.
- A cancel request or a timeout is not confirmed termination; never duplicate an
  unknown live execution.
- Approval requires host-installed policy (`ROLEBOX_GRAPH_APPROVAL_POLICY`) and an
  outcome that declares the `principal-approval@1` acceptance primitive; the
  capability preflight refuses a declaration whose graph and node have no
  installed approval rule. A declarer never impersonates the approver.
- Use `graph_audit` for storage or recovery blockers. Never delete or recreate an
  unreadable store, decode old state yourself, or treat state loss as permission
  to rerun.
- No control command converts an incomplete report into an accepted outcome, and
  no control decision replaces a declared acceptance gate.

## Author checklist

- [ ] `role.yaml` declares no `graph:` or `collaboration:` orchestration key; the
      `tools:` declarer/worker split is the machine-checkable marker.
- [ ] Exactly one declaration per request; `name` carries the request identity.
- [ ] Every node declares `outcomes` and `completion: {mode: "explicit"}`.
- [ ] Every edge is `{from, to, outcome}` binding an outcome its source declares;
      every consumer declares the `inputs` it reads.
- [ ] Run level `budget.max_executions` is set; every node carries
      `budget.timeout_ms`; no `max_retries` anywhere.
- [ ] Every cycle sits inside one `loop_groups` entry with a positive
      `max_traversals`, a declared `continuation_outcome` and a declared
      `exit_outcome`; continuation edges stay inside the group.
- [ ] Workspace-only nodes omit `tools` and `toolPresentation`; extra grants
      use actual registered host names. No graph-face name appears in `tools`.
- [ ] The selected host supports the workflow and its authorized native task tools.
      A Codex role does not rely on rolebox graph execution.
- [ ] Node briefs contain domain instructions, not copies of the runtime handoff.
- [ ] The declaring session reads results with `graph_status` scope `all`,
      format `json`, `include_output` and `include_history`.
- [ ] No generated role carries a retired imperative graph tool name, a retired
      role.yaml orchestration key, or an outcome-less edge.

## Sources verified for this reference

| Claim | Source |
| --- | --- |
| Graph tool vocabulary and host-specific execution and the worker allow-list | `src/graph/host/tool-binding.ts` (`GRAPH_TOOL_NAMES`, `WORKER_GRANTED_GRAPH_TOOLS`, `declaredToolsAllow`) |
| Root/node/outcome/edge/loop-group key sets and `tools?: string[]` | `src/graph/compiler/declaration-v3.ts`, `src/graph/compiler/parse-declaration-v3.ts` (`ROOT_KEYS`, `NODE_KEYS`, `LOOP_GROUP_KEYS`) |
| Loop-group cap, routes and the continuation-stays-inside rule | `src/graph/compiler/compile.ts` (`compileLoopGroup`, `compileLoopGroups`) |
| Non-empty string-array host-tool grant | `src/graph/compiler/compile.ts` (`readDeclaredTools`) |
| `graph:` recognized but with no runtime effect | `src/loader/role-loader.ts` (`parseGraphConfig`) |
| Declaration grammar, acceptance, tools, completion request | `docs/graph-outcome-protocol.md` |
| Run execution ceiling, per-node budgets, host approval/completion config | `docs/graph-v3-operations.md` |
