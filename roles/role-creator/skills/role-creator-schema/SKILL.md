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

When no `functions:` field is present in `role.yaml`, the role receives:

```yaml
functions: ["plan", "execute"]
```

Specifying `functions:` explicitly replaces this default entirely. Use `disable_functions:` to selectively remove from whatever set resolves.

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
    - { not: "skipped" }

gate:
  any:
    - "fast_path"
    - "user_override"
```

### ObserveSpec

```yaml
observe:
  - on: tool_after        # tool_after | message | activate
    tool: "dispatch"      # filter to specific tool (optional)
    when: "in_review"     # additional condition (optional)
    inject: "Check quality gates"
    set_evidence: "reviewed"
```

### TransitionSpec

```yaml
transitions:
  - when: "plan_approved"
    activate: ["execute"]
    deactivate: ["plan"]
```

## Inheritance

Seven fields cascade from parent role to child subagents. Child value wins if defined; otherwise the parent's value applies.

**Inheritable:** `model`, `color`, `variant`, `temperature`, `top_p`, `permission`, `tools`

All other fields (name, prompt, skills, functions, subagents, etc.) do not inherit.

---

Full schema reference: `references/schema/role-yaml-schema.md`
