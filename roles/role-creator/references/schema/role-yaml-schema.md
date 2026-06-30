---
description: Complete field reference dictionary for role.yaml (RoleConfig) and SubAgentConfig types
rolebox_version: 0.12.0
---

# role.yaml Field Reference

This document is the definitive field dictionary for `role.yaml` schema types. Every field from `RoleConfig`, `SubAgentConfig`, and related interfaces is listed with its type, required/optional status, default value, and inheritance behavior.

This is a field DICTIONARY. Validation rules live in `validation-catalog.md`.

---

## RoleConfig Fields

| Field | Type | Required | Default | Inheritable | Description |
|-------|------|----------|---------|-------------|-------------|
| `name` | `string` | YES | — | — | Human-readable role name. Used for display and ID derivation. |
| `description` | `string` | NO (strongly recommended) | `""` | — | Brief description of the role's purpose. |
| `prompt` | `string` | YES (xor `prompt_file`) | — | — | Inline system prompt text. Ignored if `prompt_file` is set. |
| `prompt_file` | `string` | NO (xor `prompt`) | — | — | Path to external prompt file, resolved relative to role directory. |
| `model` | `string` | NO | (system default) | YES | LLM model identifier (e.g. `"claude-sonnet-4-20250514"`). |
| `mode` | `"primary" \| "subagent" \| "all"` | NO | `"primary"` | NO | Determines when the role is active. |
| `color` | `string` | NO | — | YES | Display color for the role in terminal/UI. |
| `variant` | `string` | NO | — | YES | Model variant selector. |
| `temperature` | `number` (0.0–2.0) | NO | — | YES | Sampling temperature for the model. |
| `top_p` | `number` (0.0–1.0) | NO | — | YES | Top-p (nucleus) sampling parameter. |
| `permission` | `PermissionConfig` | NO | — | YES | Tool permission controls (allow/deny lists). |
| `tools` | `Record<string, boolean>` | NO | — | YES | Tool enable/disable map. Keys are tool names, values toggle them. |
| `skills` | `string[]` | NO | — | NO | Rolebox-local skill names resolved from role's `skills/` directory. |
| `opencode_skills` | `string[]` | NO | — | NO | Opencode-global skill names resolved from global skills directory. |
| `functions` | `string[]` | NO | `["plan", "execute"]` | NO | Function names to load for this role. |
| `disable_functions` | `string[]` | NO | — | NO | Functions to explicitly disable (removed from resolved set). |
| `subagents` | `SubAgentConfig[]` | NO | — | NO | Inline subagent definitions. |
| `references` | `Record<string, string \| ReferenceEntry>` | NO | — | NO | Named reference declarations. Values are paths or `ReferenceEntry` objects. |
| `collaboration` | `CollaborationConfig` | NO | — | NO | Collaboration graph definition for multi-agent orchestration. |
| `dispatch` | `DispatchRoleConfig` | NO | — | NO | Dispatch subsystem overrides for concurrency and backpressure. |
| `auto_activate` | `string[]` | NO | — | NO | Functions activated automatically on role load. |
| `locked` | `boolean` | NO | `false` | NO | When true, locks auto-activated functions (prevents deactivation). |
| `version` | `string` | NO | — | — | Semantic version string for the role. |

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
| `tools` | `Record<string, boolean>` | NO | inherits from parent | YES | Tools override. Falls back to parent's value. |
| `skills` | `string[]` | NO | — | NO | Rolebox-local skill names for this subagent. |
| `opencode_skills` | `string[]` | NO | — | NO | Opencode-global skill names for this subagent. |
| `functions` | `string[]` | NO | — | NO | Function names to load. |
| `disable_functions` | `string[]` | NO | — | NO | Functions to disable. |
| `auto_activate` | `string[]` | NO | — | NO | Auto-activated functions on subagent load. |
| `locked` | `boolean` | NO | `false` | NO | Locks auto-activated functions. |
| `subagents` | `SubAgentConfig[]` | NO | — | NO | Nested subagent definitions (recursive). |

---

## PermissionConfig

Controls which tools a role or subagent can access.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `allow` | `string[]` | NO | Tool names explicitly allowed. |
| `deny` | `string[]` | NO | Tool names explicitly denied. |

---

## CollaborationConfig

Defines the multi-agent collaboration graph for orchestrated workflows.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `topology` | `"pipeline" \| "review-loop" \| "star"` | NO | Named topology hint. |
| `agents` | `string[]` | NO | List of agent IDs participating in collaboration. |
| `flow` | `FlowEdge[]` | NO | Directed edges defining the collaboration graph. |
| `max_iterations` | `number` | NO | Maximum loop iterations for cyclic graphs. |

### FlowEdge

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `from` | `string` | YES | Source agent ID (or `"parent"` for entry point). |
| `to` | `string` | YES | Target agent ID (or `"parent"` for exit). |
| `label` | `string` | NO | Human-readable label for this edge. |
| `exit` | `boolean` | NO | When true, marks this edge as a terminal exit point. |

---

## DispatchRoleConfig

Overrides dispatch subsystem defaults for concurrency, queuing, and timeout behavior.

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

YAML frontmatter fields parsed from function files. Includes state-machine fields for orchestration.

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
| `requires_evidence` | `string[]` | NO | Evidence keys required before function can proceed. |
| `observe` | `ObserveSpec[]` | NO | Event observation rules for reactive behavior. |
| `transitions` | `TransitionSpec[]` | NO | State transitions triggered by conditions. |
| `state_schema_version` | `number` | NO | Version of the state schema this function targets. |
| `continue_max` | `number` | NO | Maximum continuation iterations before forced stop. |
| `handlers` | `string` | NO | Handler identifier for custom function behavior. |

---

## Condition Type

Conditions are used by `gate`, `continue_until`, and other state-machine fields. A condition is one of:

| Form | Type | Meaning |
|------|------|---------|
| String predicate | `string` | Named condition (e.g. `"user_approval"`, `"artifact_exists(plan)"`). |
| All combinator | `{ all: Condition[] }` | True when ALL nested conditions are true (AND). |
| Any combinator | `{ any: Condition[] }` | True when ANY nested condition is true (OR). |
| Not combinator | `{ not: Condition }` | True when the nested condition is false (NOT). |

Combinators nest recursively. A string predicate is the leaf node.

---

## ObserveSpec

Defines reactive observation rules. Functions use these to react to tool calls, messages, or activation events.

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

Exactly 7 fields cascade from parent `RoleConfig` to child `SubAgentConfig` when the child does not define its own value. Inheritance uses nullish coalescing semantics: `child_value ?? parent_value`.

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
