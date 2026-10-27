---
description: Local authoring checks and selected rolebox 2.0.0 rules, backed by separate real-runtime contract tests
rolebox_version: 2.0.0
---

# Validation Catalog

This catalog records role-creator authoring policy and selected rolebox runtime rules.
Tier 1+2 are local authoring lint, not a reimplementation of host resolution. They may
reject an authored file that rolebox would skip, and unresolved external/global assets
remain warnings. PASS does not establish runtime or behavioral compatibility.

The tested source revision is `tests/rolebox-revision.txt`. Real loader/resolver and
graph contract tests run separately in CI. Update this reference and that pin together
after testing a new runtime; changing a version label alone cannot establish compatibility.

## Required Fields

Every role YAML (`role.yaml`) must satisfy:

| Field | Rule | Severity |
|-------|------|----------|
| `name` | Must be a non-empty string | Fatal |
| `prompt` or `prompt_file` | At least one must be present and non-empty | Fatal |

### `prompt_file` takes precedence

If `prompt_file` is set and resolves to a valid, readable file, `prompt` is ignored regardless of its value.

- `prompt_file` resolves relative to the directory containing `role.yaml`
- The file must exist on disk and be readable
- If `prompt_file` is specified but the file does not exist or is unreadable → fatal error (role is skipped)

### Neither `prompt` nor `prompt_file`

If both are absent (or empty string) → the role is skipped (fatal error).

---

## ID Rules

### Role ID derivation

```
Role ID = basename(dirname(yamlPath))
```

The role ID is the directory name containing `role.yaml`. For example, `/path/to/roles/software-architecture/role.yaml` → role ID is `software-architecture`.

### Reserved separator

The string `--` is the `SUBAGENT_ID_SEPARATOR`. It is reserved. The following MUST NOT contain `--`:

- Role IDs
- Subagent names

An empty string is not a valid ID.

### Subagent ID derivation

```
Subagent ID = parent_role_id + "--" + slug
```

Where `slug` is derived from the subagent's `name` field:

1. Lowercase the name
2. Replace all spaces with `-`

**Example:** subagent name `"Intake Strategist"` →
- slug: `"intake-strategist"`
- full subagent ID: `"software-architecture--intake-strategist"`

---

## Prompt Resolution

Resolution order (first non-empty result wins):

### 1. `prompt_file` path

If `prompt_file` is a non-empty string:

- Resolve the path relative to the directory containing `role.yaml`
- Read the file contents
- Apply environment variable substitution via `resolveEnvVars`

### 2. `prompt` inline

Else if `prompt` is a non-empty string:

- Use the string directly
- Apply environment variable substitution via `resolveEnvVars`

### 3. Fatal skip

If neither yields content → fatal error, role is skipped.

### Environment variable syntax

```
{env:VARIABLE_NAME}
```

All occurrences of `{env:VARIABLE_NAME}` in the prompt text are replaced with the value of the corresponding environment variable at resolution time.

---

## Subagent Parsing & Validation

Subagents follow the same validation rules as top-level roles.

### Required fields

| Field | Rule | Severity |
|-------|------|----------|
| `name` | Must be a non-empty string, must NOT contain `--` | Fatal |
| `prompt` or `prompt_file` | At least one required (same precedence rules as top-level) | Fatal |

### Discovery sources

Subagents are discovered from two sources:

1. **File-based:** `subagents/*/role.yaml` relative to the role directory, searched up to max depth 3
2. **Inline:** `subagents:` block within `role.yaml` itself

### Merge: inline wins over file-based

When an inline subagent and a file-based subagent share the same `name`:

- The inline definition wins
- The file-based entry is filtered out (removed)
- The inline entry is added

**Duplicate subagent name** (same source): later definition wins. The earlier entry is filtered out and the new one is added.

### Nested subagents

A subagent entry may itself contain a `subagents:` field, enabling nested subagent definitions. Nesting is supported recursively.

---

## Inheritance (`applyInheritance`)

When a parent `RoleConfig` has subagents (of type `SubAgentConfig`), exactly 7 fields cascade from parent to child when the child does not define its own value:

| Field | Inheritable? |
|-------|:---:|
| `model` | Yes |
| `color` | Yes |
| `variant` | Yes |
| `temperature` | Yes |
| `top_p` | Yes |
| `permission` | Yes |
| `tools` | Yes |
| `name` | No |
| `description` | No |
| `prompt` | No |
| `prompt_file` | No |
| `skills` | No |
| `opencode_skills` | No |
| `functions` | No |
| `disable_functions` | No |
| `subagents` | No |
| `auto_activate` | No |
| `locked` | No |

### Inheritance semantics

```
child_value ?? parent_value
```

If the child defines the field, the child's value is used. Otherwise, the parent's value is inherited. The 7 inheritable fields listed above are the exhaustive set — no other fields cascade.

---

## Default Functions

Every role and subagent receives the default set, combined with explicit functions:

```yaml
functions: ["plan", "execute", "loop"]
```

Resolution is `union(defaults, functions) - disable_functions`; an empty explicit list keeps defaults.

---

## Skill Resolution (4-Candidate Order)

Skills are resolved by name via a 4-candidate priority search. The first match wins.

### Candidate order

| # | Pattern | Scope |
|---|---------|-------|
| 1 | `{roleDir}/skills/{name}/SKILL.md` | rolebox (role-local directory) |
| 2 | `{roleDir}/skills/{name}.md` | rolebox (role-local single-file) |
| 3 | `{globalSkillsDir}/{name}/SKILL.md` | opencode (global directory) |
| 4 | `{globalSkillsDir}/{name}.md` | opencode (global single-file) |

### Matching

- Uses fast-glob with `onlyFiles: true`
- Not found → info-level log only (silently skipped, not an error)
- On match: reads the file, parses YAML frontmatter for `description` and `references`, resolves skill-level references

### Scope tags

| Candidate | Scope |
|-----------|-------|
| 1, 2 | `rolebox` |
| 3, 4 | `opencode` |

---

## Function Resolution (3-Candidate Order)

Functions are resolved by name via a 3-candidate priority search. The first match wins.

### Candidate order

| # | Pattern | Source |
|---|---------|--------|
| 1 | `{roleDir}/functions/{name}.md` | Role-local |
| 2 | `{globalFunctionsDir}/{name}.md` | Global |
| 3 | `{builtinDir}/{name}.md` | Built-in |

### Matching

- Uses `Bun.file().exists()` (not glob) — exact file existence check
- Three gates must all pass:
  1. File must exist on disk
  2. File must be readable
  3. Body content after stripping YAML frontmatter must be non-empty
- Not found → info-level log (not an error)

---

## Reference Auto-Discovery

### Automatic discovery

All `.md` files under a role or skill `references/` directory are automatically discovered.

### Name derivation

The reference name is derived from the relative path. For example:

```
references/schema/foo.md → name: "schema/foo"
```

### Description priority

1. Explicit `references:` block in `role.yaml` or skill frontmatter — if a reference is explicitly declared there, its `description` field overrides the auto-discovered description
2. YAML frontmatter within the discovered `.md` file — if present, its `description` field is used
3. Auto-generated — derived from the filename

### Explicit declarations override auto-discovery

The `references:` block in `role.yaml` can provide stable names and descriptions. If a reference is listed both in the explicit block and auto-discovered, the explicit declaration's metadata takes priority.

---

## Legacy v1 Collaboration-Graph Validation (`validateGraph`) — 6 Checks (legacy-compat only)

> **Legacy-compat only.** These 6 checks validate the declarative v1 `collaboration:` flow-graph block (flow edges, `max_iterations`) kept for schema compatibility. The loader gives `collaboration:` zero runtime effect, so these checks never describe the v3 execution path; they keep legacy declarations well-formed, and the repo-level `scripts/validate.py` independently enforces the same shape. Live orchestration is authored as a Graph v3 declaration through `graph_declare` (see the Graph v3 rules below).

The legacy v1 collaboration flow graph is validated with exactly 6 checks. Checks 1–3 are FATAL (validation fails immediately). Checks 4–6 are WARN (accumulated but do not block).

### Definitions

- **`availableAgents`**: the set of all agent IDs (role + subagents) available in the graph
- **`parent`**: the special node representing the calling context (e.g., the user or parent agent)
- **Edge**: a flow definition with `from` and `to` fields; may optionally have `exit: true`

---

### Check 1: Unknown Agent (FATAL)

**Rule:** Every `from` and `to` value in every flow edge must be present in `availableAgents ∪ {"parent"}`.

**Violation:** An edge references an agent ID that is not in the available set and is not `"parent"`.

**Severity:** FATAL — validation fails immediately.

---

### Check 2: No Exit Edge (FATAL)

**Rule:** At least one edge must be an exit edge. An edge is an exit edge if:

- `to: "parent"` (returns control to the caller), OR
- `exit: true` (explicitly marked as terminal)

**Violation:** No edge in the graph satisfies either condition.

**Severity:** FATAL — validation fails immediately.

---

### Check 3: No Entry Point (FATAL)

**Rule:** At least one edge must have `from: "parent"`.

**Violation:** No edge originates from `parent`. The graph has no entry point from the calling context.

**Severity:** FATAL — validation fails immediately.

---

### Check 4: Orphan Agent (WARN)

**Rule:** Every agent in `availableAgents` should be referenced as either `from` or `to` in at least one edge. The special node `parent` is excluded from this check.

**Violation:** An agent exists in `availableAgents` but is never referenced in any edge's `from` or `to`.

**Severity:** WARN — does not block validation. The orphan warning is accumulated and reported on completion.

---

### Check 5: Disconnected Node (WARN)

**Rule:** Starting from `parent`, all edges should form a connected graph. A BFS starting from `parent` must reach every agent in `availableAgents`.

**Violation:** An agent is not reachable from `parent` via any path of edges.

**Severity:** WARN — does not block validation. The disconnected warning is accumulated and reported on completion.

---

### Check 6: Cycle Without `max_iterations` (WARN → default 3)

**Rule:** Agent-to-agent edges (excluding edges involving `parent`) must not contain cycles unless `max_iterations` is explicitly set.

**Detection:** DFS with recursion-stack (3-color DFS) over non-parent edges only.

Algorithms:
- `parent` edges (`from: "parent"` or `to: "parent"`) are excluded from the adjacency graph
- Back-edges detected via recursion-stack membership constitute a cycle

**Violation:** A cycle is detected and `max_iterations` is unset or ≤ 0.

**Resolution:** This is a historical collaboration authoring diagnostic only. The current loader ignores `collaboration`; no runtime iteration bound or default is established. Graph v3 cycles require explicit `loop_groups.max_traversals`.

**Severity:** WARN — does not block validation.

---

## Graph v3 Validation (Tier 2)

Validates the Graph v3 configuration surface (`graph:`, `memory:`, `collaboration.termination`, `permission.allow`, `tools:`, `functions:`) pinned by this catalog.

### Rule 1: `graph:` block retired by this contract (ERROR, catalog policy)

**Rule:** A `graph:` block is retired by this contract as a role-creator policy decision. Roles validated against this catalog MUST NOT declare it.

**Loader behavior (verbatim):** rolebox never rejects a `graph:` block. `parseGraphConfig` warns and ignores a missing or unknown orchestration selector, and logs the valid case verbatim as:

```
declares "graph.orchestration: graph_v2" - key recognized but not yet wired into graph resolution (no runtime effect)
```

**Violation:** A `graph:` block is present in `role.yaml`.

**Severity:** ERROR — retired by this contract; rolebox only warns and ignores it, and roles validated against this catalog must not declare it. The rejection is this catalog's policy, never a rolebox rule.

---

### Rule 2: `memory` config shape (WARN on malformed)

**Rule:** When a `memory:` block is present, its fields must conform to `MemoryConfig`:

| Field | Allowed shape |
|-------|---------------|
| `inject` | boolean |
| `max_inject` | integer |
| `min_relevance` | `"low"` \| `"medium"` \| `"high"` |
| `scope` | `"workspace"` \| `"role"` \| `"both"` |

Unknown fields are ignored; malformed values (wrong type or out-of-vocabulary enum) are reported.

**Violation:** A `memory:` field has the wrong type, or `min_relevance` / `scope` use a value outside the documented vocabulary.

**Severity:** WARN — does not block validation; accumulated and reported on completion.

---

### Rule 3: `collaboration.termination.any_of` entry shapes (WARN)

**Rule:** Every entry under `collaboration.termination.any_of` MUST be exactly one of:

- `{ max_iterations: int }`
- `{ result_matches: { agent: string, contains: string } }`

**Violation:** An entry matches neither shape (unknown keys, wrong types, or nested combinators inside an entry).

**Severity:** WARN — does not block validation; accumulated and reported on completion.

**Scope:** Legacy-compat only. The loader gives `collaboration:` zero runtime effect, so this shape check never describes the v3 execution path; the repo-level `scripts/validate.py` independently enforces the same shape.

---

### Rule 4: Retired live-contract tools in `permission.allow` or `tools` (ERROR)

**Rule:** The retired live-contract tools below MUST NOT appear in any `permission.allow` list or any `tools:` key (top-level role or subagent). Both surfaces are scanned.

Legacy v1 background-dispatch family removed in Phase C:

- `Dispatch` / `dispatch`
- `dispatch_output`
- `dispatch_cancel`

Retired v2 graph-authoring family (replaced by the Graph v3 declaration path):

- `graph_create`
- `graph_add_node`
- `graph_add_edge`
- `graph_add_loop`
- `graph_run`
- `graph_approve`
- `graph_cancel`

Retired worker execution entry (all graph hosts now use authorized native tools):

- `graph_worker_exec`

`signal` remains a live session-evidence tool. It does not settle Graph v3 attempts; only accepted outcomes do.

These names are removed and are not part of the live contract. Granting any of them is a hard configuration error. This enumeration is the executable mirror's denied list: `scripts/validate_role.py` names these literals — `graph_add_loop` included — because the mirror must name what it denies.

**Violation:** `permission.allow` or a `tools:` key contains `Dispatch`, `dispatch_output`, `dispatch_cancel`, `graph_create`, `graph_add_node`, `graph_add_edge`, `graph_add_loop`, `graph_run`, `graph_approve`, `graph_cancel`, or `graph_worker_exec` (including the v1 case variants of the dispatch family).

**Severity:** ERROR — the role is rejected at validation.

---

### Rule 5: Built-in `loop` function (informational)

`loop` is a valid default function. Graph revise cycles use explicit `loop_groups`
with `max_traversals`; do not confuse those cycle bounds with a function name.

---

### Rule 6: Graph v3 tool split (ERROR)

**Rule:** A manifest that declares any `graph_*` tool MUST hold the correct half of the declarer/worker split in its `tools:` map:

- A **declaring role** (primary) that declares any `graph_*` tool MUST hold `graph_declare`, `graph_control`, `graph_status` and `graph_audit` `true`, and `graph_submit_outcome` `false`.
- A **worker subagent** that declares any `graph_*` tool MUST hold the exact inverse: those four declarer tools `false`, and `graph_submit_outcome` `true`.

OpenCode/Pi/dsh use authorized native worker tools and rolebox capabilities.
The retired worker execution tool is rejected by Rule 4. Codex has no graph backend.

**Violation:** A manifest declares a `graph_*` tool while missing one of the five universal split keys or holding a value that contradicts its side of the split.

**Severity:** ERROR — the role is rejected at validation.

**Enforcement note:** `scripts/validate_role.py` never imports rolebox. It checks the split statically from the manifest alone. A shipped v3 declaration — the compiled plan, the node grants and the accepted-outcome transport — is checked by `tests/graph-contract.test.js`, not by the Python script.

---


### Rule 7: Worker prompt duplicates the runtime handoff (WARN)

The runtime injects the current node's declared outcome IDs, data schema identities
and versions, acceptance requirements, completion policy and attempt handoff.
Author structured outcome/data/acceptance/completion fields once in the declaration.
Worker prompts and skills retain domain responsibilities, outcome meanings, readable
report-field documentation, evidence requirements and acceptance criteria.

The local lint checks effective prompts of subagents with an explicit
`tools.graph_submit_outcome: true`, honoring `prompt_file` precedence and nested
prompt paths. It warns on recognizable credential-passing, settlement, graph-access
or JSON fallback boilerplate. It does not scan parent/director explanations, reference
manuals or arbitrary prose for these patterns, and is not an exhaustive semantic check.
The shipped template regression tests separately check node briefs and example workers.

Schema names are capability identities, not field-level JSON Schema. Preserve report
field documentation and install any schema validators the declaration requires.

**Severity:** WARN — remove duplicated mechanics without deleting business criteria.

---

## Deploy-to-Harness Validation (Tier 2/Tier 3 note)

`deploy_role.py` validates the staged copy, then replaces the destination entry with
backup/rollback and no symlink traversal. Inline prompts are valid; `PROMPT.md` is not
universally required. Target paths and reload capabilities depend on the selected host.
`sync_check.py` verifies disposable CLI installation metadata, not runtime activation
or skill loading. See `../deploy-to-harness.md` for the supported claims.

---

## Registry Schema

The registry manifest (`registry.yaml`) follows this structure:

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `name` | string | Yes | Registry name |
| `description` | string | No | Registry description |
| `url` | string | No | Registry URL |
| `roles` | map | Yes | Map of role-name to role metadata |

### Role metadata in registry

Each entry under `roles:` maps a role name to:

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `version` | string (semver) | Yes | Role version (e.g. `"1.0.0"`) |
| `description` | string | No | Role description |
| `tags` | list of strings | No | Keywords for discovery |

**Example:**

```yaml
name: oh-my-role
roles:
  software-architecture:
    version: "1.2.0"
    description: Architecture design and review role
    tags: ["architecture", "design", "adr"]
```

---

## Known Names (Skill-Name-Collision Policy)

### Built-in function names

The default built-in function names are:

- `plan`
- `execute`
- `loop`

They are included unless disabled; local files may override their implementations.

### Known-names set

The known-names set is used for collision detection. It consists of:

- All skill names present in the opencode global skills directory
- All rolebox built-in function names (`plan`, `execute`, `loop`)

### Collision behavior

When a role-local or inline skill name collides with a name in the known-names set:

- **WARN** (not fatal) — a warning is issued
- The later definition still wins at resolution time (standard priority order applies)
- Collisions do not prevent role loading or execution
