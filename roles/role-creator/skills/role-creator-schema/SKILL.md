---
name: role-creator-schema
description: Quick reference for role.yaml fields, required/exclusive rules, skill/function resolution orders, default functions, and state-machine vocabulary. Load when generating role.yaml to ensure valid syntax.
---

# role.yaml Schema Quick Reference

Field guide for generating valid `role.yaml` files. Covers what's required, what's exclusive, and how resolution works.

## Required Fields

| Field | Rule |
|-------|------|
| `name` | Non-empty string. Human-readable role name. |
| `prompt` XOR `prompt_file` | At least one must be present and non-empty. If both are set, `prompt_file` takes precedence and `prompt` is ignored. |
| `description` | Strongly recommended. Powers discovery, registry listings, and skill descriptions. |

For subagents, the same `name` + `prompt`/`prompt_file` requirements apply.

## The `--` Rule

Role IDs (directory names) must **not** contain `--`.
Subagent names must **not** contain `--`.

The double-dash is reserved as a separator. Rolebox constructs subagent IDs by joining the parent role and the subagent slug:

```
{role}--{subagent-slug}
```

If either side contains `--`, the ID becomes ambiguous and validation fails.

## Resolution Orders

### Skills (4-candidate lookup)

When a skill name appears in the `skills:` array, Rolebox resolves it by checking these paths in order. First match wins:

1. `skills/{name}/SKILL.md` (role-local, directory form)
2. `skills/{name}.md` (role-local, flat file)
3. Global `{name}/SKILL.md` (opencode global skills directory)
4. Global `{name}.md` (opencode global skills, flat)

### Functions (3-candidate lookup)

When a function name appears in the `functions:` array:

1. `functions/{name}.md` (role-local)
2. Global `functions/{name}.md` (opencode global functions directory)
3. Built-in `{name}.md` (rolebox built-in functions)

### References

Auto-discovered from `references/**/*.md` within the role directory. If an explicit `references:` block exists in `role.yaml`, those entries provide stable names and custom descriptions for the discovered files.

## Default Functions

Every role and subagent starts with these default functions:

```yaml
functions: ["plan", "execute", "loop"]
```

The resolved set is `union(defaults, functions) - disable_functions`. Explicit `functions: []` keeps defaults. To expose only a custom function, disable all three defaults explicitly. The built-in `loop` function remains valid; graph revise cycles use `loop_groups`.

## Graph v3 Tool Split

Roles that orchestrate subagents declare no orchestration block in `role.yaml`. The machine-checkable marker is a top-level `tools:` block holding the declarer/worker split:

```yaml
tools:
  graph_declare: true
  graph_control: true
  graph_status: true
  graph_audit: true
  graph_submit_outcome: false
```

A declaring role holds the four declarer tools `true` and `graph_submit_outcome` `false`; a worker holds the inverse. OpenCode/Pi/dsh workers use their authorized native tools and rolebox capabilities; the current Codex adapter cannot execute graphs. Every role that orchestrates also ships a Graph v3 declaration, authored per request through `graph_declare` with per-node outcomes, explicit completion, outcome-bound edges and a `loop_groups` entry for each cycle. The runtime injects the node's declared outcome IDs, data schema identities/versions, acceptance requirements, completion policy and attempt handoff; keep domain report fields and outcome meanings in role resources. The validation catalog retires a `graph:` block (Rule 1, ERROR); `collaboration:` is a legacy schema-compat mirror with no runtime effect.

## Collaboration & Memory Blocks

```yaml
collaboration:
  topology: pipeline                 # pipeline | review-loop | star
  agents: [processor, checker, validator]
  max_iterations: 2                  # legacy v1 schema-compat ONLY — not a live bound
  termination:
    any_of:
      - max_iterations: 2
      - result_matches:
          agent: validator
          contains: "VALIDATED"

memory:
  inject: true
  max_inject: 10
  min_relevance: medium              # low | medium | high
  scope: both                        # workspace | role | both
```

`collaboration.max_iterations` is legacy v1 schema compatibility only — runtime loop bounds are enforced by a `loop_groups` entry's required `max_traversals`, never by this field. `termination.any_of` / `termination.all_of` entries are `{ max_iterations: int }` or `{ result_matches: { agent, contains } }`.

## State-Machine Function Fields

Functions support state-machine orchestration through frontmatter fields. Quick reference:

| Field | Purpose |
|-------|---------|
| `gate` | Condition that blocks activation until met |
| `continue_until` | Condition; function loops until this becomes true |
| `observe` | Array of `ObserveSpec` reactions to lifecycle events (`tool_after`, `message`, `activate`) |
| `transitions` | Array of `TransitionSpec`; activate/deactivate other functions when condition met |
| `auto_activate` | Functions active at session start without explicit `\|name\|` invocation |
| `locked` | Prevents deactivation of auto-activated functions |
| `phase` | Execution phase grouping (e.g. `"planning"`, `"execution"`) |
| `priority` | Numeric; higher activates first when multiple candidates match |
| `requires` | Evidence keys that must exist before activation |
| `produces` | Evidence key this function sets on completion |
| `consumes` | Evidence key removed after use |
| `continue_max` | Maximum continuation iterations before forced stop |
| `state_schema_version` | Version of the state schema targeted |
| `handlers` | Handler identifier for custom function behavior |

### Condition Type

Conditions appear in `gate`, `continue_until`, `observe[].when`, and `transitions[].when`:

```yaml
# String predicate (leaf)
gate: "user_approval"

# Combinators (nest recursively)
gate:
  all:
    - "artifact_exists(plan)"
    - { not: "state_eq(skipped=true)" }

gate:
  any:
    - "state_eq(fast_path=true)"
    - "user_approval()"
```

Use exactly one combinator key per object. Unknown condition names evaluate false unless a host extension registers them. `gate: {pass: ..., fail: ...}` is not a Condition. `user_approval()` means a user message this turn, not scoped authorization for a sensitive action.

### ObserveSpec

```yaml
observe:
  - on: tool_after        # tool_after | message | activate
    tool: "graph_declare"      # filter to specific tool (optional)
    when: "state_eq(phase=review)"     # additional condition (optional)
    inject: "Check quality gates"
    set_evidence: "reviewed"
```

### TransitionSpec

```yaml
transitions:
  - when: "user_approval()"
    activate: ["execute"]
    deactivate: ["plan"]
```

## Inheritance

Seven fields cascade from parent role to child subagents. Child value wins if defined; otherwise the parent's value applies.

**Inheritable:** `model`, `color`, `variant`, `temperature`, `top_p`, `permission`, `tools`

All other fields (name, prompt, skills, functions, subagents, etc.) do not inherit.

---

Full schema reference: `references/schema/role-yaml-schema.md`
