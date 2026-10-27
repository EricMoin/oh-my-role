---
description: Complete field reference dictionary for role.yaml (RoleConfig) and SubAgentConfig types, including the declarer/worker tool split that marks a Graph v3 role
rolebox_version: 2.0.0
---

# role.yaml Field Reference

This is an authoring reference for supported role fields, not a generated exhaustive schema. Runtime parsing is authoritative; offline contract tests pin the source revision in `tests/rolebox-revision.txt`.
It documents the installed rolebox loader (`src/loader/role-loader.ts`,
`src/types.core.ts`, `src/types.graph.ts`), pinned here at `2.0.0`.

This is a field DICTIONARY. Validation rules live in `validation-catalog.md`, and
the Graph v3 declaration grammar that replaced role-level orchestration lives in
`../graph-protocol.md`.

---

## RoleConfig Fields

| Field | Type | Required | Default | Inheritable | Description |
|-------|------|----------|---------|-------------|-------------|
| `name` | `string` | YES | — | — | Human-readable role name. Used for display and ID derivation. |
| `description` | `string` | NO (strongly recommended) | `""` | — | Brief description of the role's purpose. |
| `prompt` | `string` | YES (xor `prompt_file`) | — | — | Inline system prompt text. Ignored if `prompt_file` is set. |
| `prompt_file` | `string` | NO (xor `prompt`) | — | — | Path to external prompt file, resolved relative to role directory. |
| `model` | `string` | NO | (system default) | YES | LLM model identifier (e.g. `"provider/tier-1-flagship"`). |
| `mode` | `"primary" \| "subagent" \| "all"` | NO | `"primary"` | NO | Determines when the role is active. |
| `color` | `string` | NO | — | YES | Display color for the role in terminal/UI. |
| `variant` | `string` | NO | — | YES | Model variant selector. |
| `temperature` | `number` (0.0–2.0) | NO | — | YES | Sampling temperature for the model. |
| `top_p` | `number` (0.0–1.0) | NO | — | YES | Top-p (nucleus) sampling parameter. |
| `permission` | `PermissionConfig` | NO | — | YES | Tool permission controls (allow/deny lists). |
| `tools` | `Record<string, boolean>` | NO | — | YES | Tool enable/disable map. The machine-checkable declarer/worker split marker of a Graph v3 role — see below. |
| `skills` | `string[]` | NO | — | NO | Rolebox-local skill names resolved from the role's `skills/` directory. |
| `opencode_skills` | `string[]` | NO | — | NO | Opencode-global skill names resolved from the global skills directory. |
| `functions` | `string[]` | NO | `["plan", "execute", "loop"]` | NO | Added to defaults; `disable_functions` removes names from the union. |
| `disable_functions` | `string[]` | NO | — | NO | Functions to explicitly disable (removed from the resolved set). |
| `subagents` | `SubAgentConfig[]` | NO | — | NO | Inline subagent definitions. |
| `references` | `Record<string, string \| ReferenceEntry>` | NO | — | NO | Named reference declarations. Values are paths or `ReferenceEntry` objects. |
| `memory` | `MemoryConfig` | NO | — | NO | Session memory injection configuration. |
| `dispatch` | `DispatchRoleConfig` | NO | — | NO | Dispatch subsystem overrides for concurrency and backpressure. |
| `auto_activate` | `string[]` | NO | — | NO | Functions activated automatically on role load. |
| `locked` | `boolean` | NO | `false` | NO | When true, locks auto-activated functions (prevents deactivation). |
| `version` | `string` | NO | — | — | Semantic version string for the role. |

Additional fields read by the current loader:

| Field | Type | Meaning |
|---|---|---|
| `open` | boolean | Expose this role as a public producer |
| `exports` | string[] | Explicit subagent names/slugs exported by an open role |
| `open_roles` | string[] | Producer role IDs whose public agents this consumer can discover |
| `hooks` | HooksBlock | Host-supported lifecycle hooks; verify against `docs/hooks.md` |
| `copilot` | CopilotConfig | Host-supported turn-end policy; verify against `docs/copilot.md` |

These optional capabilities require host support. Native benchmarks currently require
self-contained roles, so external `open_roles` dependencies need a different evaluation
setup. Other type-only fields must not be assumed loadable without checking the loader.

Two role.yaml keys that older contracts documented here as live orchestration
configuration — `graph:` and `collaboration:` — are **not** live config under the
Graph v3 outcome protocol. They are documented under
[Retired orchestration keys](#retired-orchestration-keys) below.

---

## SubAgentConfig Fields

| Field | Type | Required | Default | Inheritable | Description |
|-------|------|----------|---------|-------------|-------------|
| `name` | `string` | YES | — | — | Subagent name. Must not contain `--`. |
| `description` | `string` | NO | `""` | — | Brief description of the subagent's purpose. |
| `prompt` | `string` | YES (xor `prompt_file`) | — | — | Inline system prompt text. |
| `prompt_file` | `string` | NO (xor `prompt`) | — | — | Path to external prompt file. |
| `model` | `string` | NO | inherits from parent | YES | Model override. Falls back to parent's value. |
| `color` | `string` | NO | inherits from parent | YES | Color override. Falls back to parent's value. |
| `variant` | `string` | NO | inherits from parent | YES | Variant override. Falls back to parent's value. |
| `temperature` | `number` (0.0–2.0) | NO | inherits from parent | YES | Temperature override. Falls back to parent's value. |
| `top_p` | `number` (0.0–1.0) | NO | inherits from parent | YES | Top-p override. Falls back to parent's value. |
| `permission` | `PermissionConfig` | NO | inherits from parent | YES | Permission override. Falls back to parent's value. |
| `tools` | `Record<string, boolean>` | NO | inherits from parent | YES | Tools override. A worker subagent declares the inverse of its declaring role's split. |
| `skills` | `string[]` | NO | — | NO | Rolebox-local skill names for this subagent. |
| `opencode_skills` | `string[]` | NO | — | NO | Opencode-global skill names for this subagent. |
| `functions` | `string[]` | NO | — | NO | Function names to load. |
| `disable_functions` | `string[]` | NO | — | NO | Function names to disable. |
| `auto_activate` | `string[]` | NO | — | NO | Auto-activated functions on subagent load. |
| `locked` | `boolean` | NO | `false` | NO | Locks auto-activated functions. |
| `subagents` | `SubAgentConfig[]` | NO | — | NO | Nested subagent definitions (recursive). |

---

## The `tools:` split — the machine-checkable marker

A Graph v3 role is marked by its `tools:` block, not by an orchestration key.
The loader surfaces `tools` as a `Record<string, boolean>` and a subagent's
`tools` inherits from its parent unless the subagent declares its own (inheritance
uses `child_value ?? parent_value`; see [Inheritance Rules](#inheritance-rules)).

| Tool | Declaring role (`mode: primary`) | Worker subagent |
|------|----------------------------------|-----------------|
| `graph_declare` | `true` | `false` |
| `graph_control` | `true` | `false` |
| `graph_status` | `true` | `false` |
| `graph_audit` | `true` | `false` |
| `graph_submit_outcome` | `false` | `true` |
| `Write` / `Edit` / `Bash` | per the role's own job | per the worker's job |

```yaml
# Declaring role: declares, controls, reads and audits graphs; never submits.
tools:
  graph_declare: true
  graph_control: true
  graph_status: true
  graph_audit: true
  graph_submit_outcome: false
  Write: true
  Edit: true
  Bash: true
```

```yaml
# Worker subagent: submits its own outcome and runs sandboxed commands.
tools:
  graph_declare: false
  graph_control: false
  graph_status: false
  graph_audit: false
  graph_submit_outcome: true
  Write: false
  Edit: false
  Bash: true
```

Inside a graph the binding boundary is the **node** grant recorded in the
declaration, not this manifest map: a dispatched worker's graph face grants
`graph_submit_outcome`. The four
declarer tools refuse workers; additional worker discovery/code entries depend on
the host presentation described in `../graph-protocol.md`. A node's `tools` list
names extra **host** tools only. The five protocol tools and their request
shapes are documented in `../graph-protocol.md`.

---

## Graph v3 declarations are not role.yaml fields

Orchestration is declared as data and compiled into an immutable plan, so the
following concepts are **not** role.yaml fields:

- **Topology.** `graph_declare({declaration})` accepts one version-3 document:
  `version: 3`, `name` (the graph id), an optional `budget.max_executions`, the
  `nodes` array and the `edges` array.
- **Nodes and outcomes.** Each node declares `id`, `agent`, `prompt`, at least
  one `outcomes` entry and `completion: {mode: "explicit"}`. A node's `tools` is
  the declaration grammar's **string array** of extra host tool names — a
  different shape from this file's role-level `tools:` boolean map.
- **Routes.** Every edge is `{from, to, outcome}` and binds one outcome its
  source node declares. There is no implicit edge and no condition field.
- **Inputs and joins.** A consumer declares `inputs: [{from, outcome}]`; a
  convergence node declares `join: {strategy: "all" | "any" | "quorum"}`.
- **Loop groups.** A bounded revise cycle is a `loop_groups` entry with `id`,
  `nodes`, a positive `max_traversals`, a `continuation_outcome` that re-enters
  the loop and an `exit_outcome` that leaves it. Both route outcomes must be
  declared by a member node, and every edge carrying the continuation outcome
  must stay inside the group.
- **Accepted-outcome transport.** Only an accepted decision with `verdict`
  `committed` or `replayed` and no refusals settles a node; a refusal writes
  nothing. The declaring session reads `attempts[].accepted` and
  `attempts[].result` with `graph_status` scope `all`, format `json`,
  `include_output` and `include_history`. A result fence does not settle a node.

The declaration grammar, the exact loop-group rules, the tool surface and the
recovery commands are specified in `../graph-protocol.md`.

---

## Retired orchestration keys

`graph:` and `collaboration:` are the retired role-level orchestration keys.
Neither is live configuration under the outcome protocol:

- **`graph:`** — the loader recognizes the key (`parseGraphConfig` in
  `src/loader/role-loader.ts`). A missing or unknown `orchestration` selector is
  warned about and the key is omitted; a valid `graph_v2` selector is surfaced on
  `RoleConfig.graph` and logged verbatim as *"key recognized but not yet wired
  into graph resolution (no runtime effect)"*. It never starts, routes or bounds
  a graph.
- **`collaboration:`** — rolebox has no reader for this key anywhere in
  `src/`, so it is not part of `RoleConfig` and has no runtime effect.

A role that orchestrates declares its topology through `graph_declare` instead.
Whether a role validated against this repository's contract may still declare a
retired key is a policy decision recorded in `validation-catalog.md`, not a
rolebox rule.

---

## PermissionConfig

Controls which tools a role or subagent may access.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `allow` | `string[]` | NO | Tool names explicitly allowed. |
| `deny` | `string[]` | NO | Tool names explicitly denied. |

`permission` is passed through to the role/subagent unchanged; the loader does
not rewrite it. A Graph v3 role lists its declarer tools (or its worker tools) in
`allow` as well as in `tools:` where the host requires an explicit grant.

---

## MemoryConfig

Controls session memory injection for the role's sessions.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `inject` | `boolean` | NO | Inject relevant memories into the system prompt. |
| `max_inject` | `integer` | NO | Maximum memories injected per session. |
| `min_relevance` | `"low" \| "medium" \| "high"` | NO | Relevance floor for injection. |
| `scope` | `"workspace" \| "role" \| "both"` | NO | Memory scope to inject from. |

---

## DispatchRoleConfig

Overrides dispatch subsystem defaults for concurrency, queuing and timeout
behaviour. It is unrelated to Graph v3 graph execution: a run's ceiling is the
declaration's `budget.max_executions` and a node's is its `budget.timeout_ms`.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `maxConcurrent` | `number` | NO | (system default) | Maximum concurrent dispatch tasks. |
| `maxQueueDepth` | `number` | NO | (system default) | Maximum queued tasks before rejection. |
| `syncReservedSlots` | `number` | NO | (system default) | Slots reserved for synchronous dispatch. |
| `maxActivePerParent` | `number` | NO | (system default) | Maximum active tasks per parent session. |
| `maxTotalSessionsPerRequest` | `number` | NO | (system default) | Maximum total sessions spawned per request. |
| `retryAfterMs` | `number` | NO | (system default) | Retry delay in milliseconds when backpressured. |
| `backpressureMaxRetries` | `number` | NO | (system default) | Maximum retry attempts under backpressure. |
| `backpressureMaxDelayMs` | `number` | NO | (system default) | Maximum cumulative backpressure delay. |
| `backgroundStaleTimeoutMs` | `number` | NO | (system default) | Timeout for stale background tasks. |
| `syncAcquireTimeoutMs` | `number` | NO | (system default) | Timeout for acquiring a synchronous slot. |
| `syncPromptTimeoutMs` | `number` | NO | (system default) | Timeout for synchronous prompt completion. |

---

## SkillMetadata (SKILL.md Frontmatter)

YAML frontmatter fields parsed from skill files (`SKILL.md`).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | NO | Skill identifier (used for display and collision detection). |
| `description` | `string` | NO | Brief description of the skill's purpose. |
| `model` | `string` | NO | Recommended model for this skill. |
| `license` | `string` | NO | License identifier (e.g. `"MIT"`, `"Apache-2.0"`). |
| `compatibility` | `string` | NO | Compatible platforms or tools (e.g. `"claude-code opencode"`). |
| `allowed-tools` | `string \| string[]` | NO | Tools this skill is allowed to invoke. |
| `references` | `Record<string, string \| ReferenceEntry>` | NO | Reference declarations scoped to this skill. |

---

## FunctionMetadata (Function Frontmatter)

YAML frontmatter fields parsed from function files. Includes state-machine fields
for orchestration.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | NO | Function display name. |
| `description` | `string` | NO | Brief description of the function's purpose. |
| `params` | `Record<string, string>` | NO | Parameter declarations (name to type/description). |
| `phase` | `string` | NO | Execution phase grouping (e.g. `"planning"`, `"execution"`). |
| `priority` | `number` | NO | Activation priority (higher activates first when multiple candidates). |
| `requires` | `string[]` | NO | Evidence keys that must exist before this function activates. |
| `produces` | `string` | NO | Evidence key this function produces on completion. |
| `consumes` | `string` | NO | Evidence key this function consumes (removes after use). |
| `gate` | `Condition` | NO | Condition that must be true for activation. |
| `continue_until` | `Condition` | NO | Function keeps running until this condition is met. |
| `requires_evidence` | `string[]` | NO | Evidence keys required before the function can proceed. |
| `observe` | `ObserveSpec[]` | NO | Event observation rules for reactive behaviour. |
| `transitions` | `TransitionSpec[]` | NO | State transitions triggered by conditions. |
| `state_schema_version` | `number` | NO | Version of the state schema this function targets. |
| `continue_max` | `number` | NO | Maximum continuation iterations before a forced stop. |
| `handlers` | `string` | NO | Handler identifier for custom function behaviour. |

---

## Condition Type

Conditions are used by `gate`, `continue_until` and other state-machine fields. A
condition is one of:

| Form | Type | Meaning |
|------|------|---------|
| String predicate | `string` | Named condition (e.g. `"user_approval()"`, `"artifact_exists(plan)"`). |
| All combinator | `{ all: Condition[] }` | True when ALL nested conditions are true (AND). |
| Any combinator | `{ any: Condition[] }` | True when ANY nested condition is true (OR). |
| Not combinator | `{ not: Condition }` | True when the nested condition is false (NOT). |

Combinators nest recursively. A string predicate is the leaf node. The installed
named-condition vocabulary is `user_approval()`, `artifact_exists(name)`,
`plan_todos_complete()`, `evidence_met()`, `tool_observed(name)`,
`signal_observed(type)`, `turn_count(n)` and `state_eq(key=value)`. Use one combinator per object; unknown predicates evaluate false unless registered by the host. A prose `{pass, fail}` object is not a condition.

---

## ObserveSpec

Defines reactive observation rules. Functions use these to react to tool calls,
messages or activation events. The built-in events are `tool_after`, `message`
and `activate`; a host extension may register additional event handlers.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `on` | `"tool_after" \| "message" \| "activate"` | YES | Event type to observe. |
| `tool` | `string` | NO | Specific tool name (only relevant when `on: "tool_after"`). |
| `when` | `Condition` | NO | Additional condition that must hold for the observer to fire. |
| `inject` | `string` | NO | Content to inject into context when triggered. |
| `set_evidence` | `string` | NO | Evidence key to set when triggered. |
| `capture_artifact` | `string` | NO | Artifact name to capture from the event. |
| `sync_todos` | `boolean` | NO | Whether to synchronize todo state on trigger. |

---

## TransitionSpec

Defines conditional state transitions between functions.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `when` | `Condition` | YES | Condition that triggers this transition. |
| `activate` | `string[]` | NO | Function names to activate when triggered. |
| `deactivate` | `string[]` | NO | Function names to deactivate when triggered. |

---

## ReferenceEntry

Structured form for reference declarations (alternative to bare path strings).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `path` | `string` | YES | File path to the reference document, relative to role directory. |
| `description` | `string` | NO | Human-readable description of what this reference contains. |

---

## Inheritance Rules

Exactly 7 fields cascade from parent `RoleConfig` to child `SubAgentConfig` when
the child does not define its own value. Inheritance uses nullish-coalescing
semantics: `child_value ?? parent_value`.

### Inheritable Fields (7)

| Field | Inherits |
|-------|----------|
| `model` | YES |
| `color` | YES |
| `variant` | YES |
| `temperature` | YES |
| `top_p` | YES |
| `permission` | YES |
| `tools` | YES |

### Non-Inheritable Fields

| Field | Inherits |
|-------|----------|
| `name` | NO |
| `description` | NO |
| `prompt` | NO |
| `prompt_file` | NO |
| `skills` | NO |
| `opencode_skills` | NO |
| `functions` | NO |
| `disable_functions` | NO |
| `subagents` | NO |
| `auto_activate` | NO |
| `locked` | NO |
