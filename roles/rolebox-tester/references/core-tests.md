---
description: Core and system-prompt module bodies for rolebox-tester 7.0.0 — host-aware loaders, the parameterized function, auto-activate/locked, and the five markdown prompt blocks.
---

# Core and system-prompt tests

This document owns the `core-prompt` module: tests **1, 2, 3, 17, 107, 110, 111,
112, 113, 114** (10 tests). The executor is the **primary**. The module gate is the
loaded role prompt plus the host-aware loaders: `load_role_skill` (or the host's native
skill tool where absent), `load_reference` and `reference_search`. On Codex MCP the
loaders still answer, so tests 1–3 run there; the role prompt and the function system
are absent, so tests 17, 107 and the prompt-block tests 110–114 SKIP with capability
reasons rather than FAIL.

## Module rules

- Resolve the native loader names in the capability probe. `load_role_skill` is
  registered on Pi, DSH and Codex; opencode 1.x/2.x use the host's native skill tool.
  `load_reference` and `reference_search` are the canonical reference loaders on every
  host. A direct `read` is only the fallback when a loader is absent or fails.
- Prompt-block tests read the rendered prompt blocks in the live system prompt. In
  rolebox 2.2.0 these blocks are **markdown headings**, not angle-bracket elements:
  `## Available functions`, `## Active functions`, `## Available references`,
  `## Available skills`, `## Available sub-agents`, `## Available memory` and a
  `## Function state:` heading per active function. A test that names one of these
  headings asserts the rendered heading and its entry shape.
- A missing capability family is SKIP with a stable reason (for example
  `capability_absent:function_system`). Do not write a memory entry, install a skill or
  alter the role to make a block appear.

---

### Test 1: Skill loading through load_role_skill

Call `load_role_skill({name:"test-skill"})`. On opencode 1.x/2.x, where that loader is
not registered, use the host's native skill mechanism for `test-skill`. Use a direct
read of `skills/test-skill/SKILL.md` only when neither loader is available.

**Pass criteria (all must be true)**:

1. The loader answers for the exact name `test-skill` (a not-found error is a failure
   only when the name is declared in `role.yaml`; otherwise SKIP the test).
2. The returned content contains the marker `SKILL_LOAD_SUCCESS`.
3. The payload carries a non-empty description and a resolved path ending in
   `skills/test-skill/SKILL.md`.
4. The evidence records which loader answered (loader name, or `direct-read` fallback).

**SKIP**: no skill loader and no readable `SKILL.md` — `capability_absent:skill_loader`.

---

### Test 2: Reference loading through load_reference and reference_search

Call `load_reference({name:"test-reference"})`. Then call
`reference_search({query:"REFERENCE_LOAD_SUCCESS"})`. Use a direct read only when both
loaders are absent.

**Pass criteria (all must be true)**:

1. `load_reference` returns the full content of `references/test-reference.md`, the
   resolved path, the scope and a non-empty description.
2. The content contains `REFERENCE_LOAD_SUCCESS`.
3. `reference_search` returns at least one match for the marker and names
   `test-reference` as the owning reference.
4. The evidence records both tool answers. A loader that resolves the name but cannot
   read the file is a FAIL, not a SKIP; a host with neither loader nor direct read is
   SKIP `capability_absent:reference_loader`.

---

### Test 3: Skill-specific reference

Load the skill payload first: `load_role_skill({name:"test-skill"})` must report its
skill-specific reference metadata. Then load that reference with
`load_reference({name:"skill-ref"})`; if the host indexes only role references, read
the resolved path from the skill payload (or use the direct-read fallback).

**Pass criteria (all must be true)**:

1. The skill payload lists a reference named `skill-ref` (or resolves its path under
   `skills/test-skill/references/`).
2. `load_reference({name:"skill-ref"})` returns content containing
   `SKILL_REFERENCE_OK`.
3. The resolved path is `skills/test-skill/references/skill-ref.md`.
4. The evidence names the skill loader, the reference loader and the marker.

**SKIP**: no skill or reference loader and no readable path —
`capability_absent:skill_reference_loader`.

---

### Test 17: Parameterized function

Inspect the `## Available functions` block for `transform`. The function declares
`params: action: uppercase` and `separator: "-"`, and its body contains
`FUNCTION_PARAMS_OK`.

**Pass criteria (all must be true)**:

1. The `transform` section exists with a `params:` line showing
   `action=uppercase, separator=-`.
2. The section body contains `FUNCTION_PARAMS_OK`.
3. If this session activated `transform` with arguments, the `## Active functions`
   section shows the substituted values instead of the `{action}` and `{separator}`
   placeholders (for example `action: lowercase`, `separator: _`). If the session did
   not activate it with arguments, the defaults branch passes on criteria 1 and 2 and
   the substitution sub-check is SKIP `transform_not_activated`.
4. No `{action}` or `{separator}` placeholder is visible in an activated-with-arguments
   render.

**SKIP**: no function system or no `## Available functions` block —
`capability_absent:function_system`.

---

### Test 107: Auto-activate and locked test-all

Verify the primary's auto-activation and lock contract from the rendered prompt and
the manifest.

**Pass criteria (all must be true)**:

1. `role.yaml` declares `auto_activate: [test-all]` and `locked: true`.
2. The `## Active functions` block contains `test-all` at session start, without the
   user having sent `|test-all|` — the auto-activation path is what put it there.
3. Where the host renders function-state injection, a `## Function state: test-all`
   heading exists and reports its phase, gate state, evidence and continuation count as
   markdown items. If the live host renders only `## Active functions`, SKIP this
   sub-check with `capability_absent:function_state` and keep the test PASS on criteria
   1, 2 and 4; do not invent a state block.
4. Locked semantics: the active set still contains `test-all` after later turns and
   after any transition that deactivates another function; a locked function is not
   removable by a transition. rolebox 2.2.0 renders no separate "locked" badge, so the
   manifest value plus the persistent active set are the evidence; do not expect an XML
   lock indicator.
5. The evidence quotes the active block and the manifest lines, plus the function-state
   heading when the host renders it.

**SKIP**: Codex MCP (no role prompt or function system) —
`capability_absent:function_system`.

---

### Test 110: Markdown prompt block — ## Available functions

Inspect the `## Available functions` block. It carries the activation instruction and
one `###` section per enabled function, named after the function, with its description,
an optional `params:` line and its fenced body.

**Pass criteria (all must be true)**:

1. The heading `## Available functions` is present with the activation instruction
   naming `|function_name|` (or `|function_name:params|`) syntax.
2. All seven role functions declared in `role.yaml` appear as sections: `test-all`,
   `transform`, `loop`, `state-machine`, `observe-probe`, `broken-dep`,
   `signal-probe`.
3. Built-in functions (`plan`, `execute`) may appear alongside; they are not part of
   the seven-role-function roster and are not counted with it.
4. `loop` appears exactly once — the rolebox builtin; it is not duplicated by the
   role's `functions:` list.
5. `transform` shows `params: action=uppercase, separator=-`; `loop` shows its
   `iterations`/`mode` params; `broken-dep` carries its unsatisfied
   `requires: [nonexistent-function]` declaration and is never activated.
6. Every listed function has a non-empty description and a rendered body.

**SKIP**: Codex MCP — `capability_absent:function_system`.

---

### Test 111: Markdown prompt block — ## Available references

Inspect the `## Available references` block. It carries the instruction to use
`load_reference` and `reference_search`, then one bullet per reference:
`- \`name\` — description`, with a path continuation line when no single base
directory locates every entry.

**Pass criteria (all must be true)**:

1. The heading `## Available references` is present with the loader instruction (use
   `load_reference`; use `reference_search` for passages; direct read only as fallback).
2. All twelve declared role references appear by name: `test-reference`,
   `test-catalog`, `host-capability-matrix`, `core-tests`, `graph-v3-tests`,
   `team-tests`, `runtime-tests`, `tool-tests`, `session-memory-web-tests`,
   `lsp-tests`, `asset-task-tests`, `computer-browse-tests`.
3. The skill-specific reference `skill-ref` also appears, because role and skill
   references share the block.
4. Every entry has a non-empty description; the evidence quotes the twelve role names
   and `skill-ref`.

**SKIP**: Codex MCP (no role prompt) — `capability_absent:role_prompt`.

---

### Test 112: Markdown prompt block — ## Available skills

Inspect the `## Available skills` block.

**Pass criteria (all must be true)**:

1. The heading `## Available skills` is present with the loader instruction: prefer
   `load_role_skill`; otherwise the host's skill loader; read the file only when no
   loader exists.
2. The `test-skill` entry is present as a bullet with its declared name and a non-empty
   description.
3. No per-entry scope or location field is required in 2.2.0 — the block is an
   id/name-plus-description list; do not fail a missing scope child.
4. The evidence quotes the `test-skill` bullet.

**SKIP**: Codex MCP — `capability_absent:role_prompt`.

---

### Test 113: Markdown prompt block — ## Available sub-agents

Inspect the `## Available sub-agents` block. Its instruction explains graph outcome
protocol delegation: declare a version-3 graph with `graph_declare`, end the turn, and
let each worker settle with `graph_submit_outcome`.

**Pass criteria (all must be true)**:

1. The heading `## Available sub-agents` is present with the graph-outcome delegation
   instruction.
2. Exactly ten top-level sub-agent ids appear: `rolebox-tester--echo`,
   `rolebox-tester--sleeper`, `rolebox-tester--processor`,
   `rolebox-tester--checker`, `rolebox-tester--restricted`,
   `rolebox-tester--validator`, `rolebox-tester--nester`,
   `rolebox-tester--outcome-worker`, `rolebox-tester--runner-statemachine`,
   `rolebox-tester--runner-loop`.
3. The nested `rolebox-tester--nester--grandchild` is not an eleventh top-level bullet;
   it belongs to the nester and is not addressed as a peer sub-agent.
4. Every listed bullet has a non-empty description.
5. The evidence lists the ten top-level ids and records the nested-child exclusion.

**SKIP**: Codex MCP — `capability_absent:role_prompt`.

---

### Test 114: Markdown prompt block — ## Available memory

Inspect the `## Available memory` block. It carries the instruction "Memory entries
from previous sessions. Use memory_recall to search for specific memories." and a
markdown table whose header is `| id | category | relevance | title | updated |`.

**Pass criteria (all must be true)**:

1. The heading `## Available memory` is present with the recall instruction.
2. The table header is exactly the five columns above, in that order.
3. At least one data row is present and every row has non-empty `id`, `category` and
   `title`, a `relevance` value of `high`, `medium` or `low`, and a non-empty
   `updated` timestamp.
4. The evidence quotes the heading, the header and one full row.
5. If `memory_list` shows no entry meeting `role.yaml`'s scope and `min_relevance`
   settings, the block is legitimately omitted (an empty table renders nothing): SKIP
   with `no_memory_entries` and state the injection settings. Do not create an entry
   solely to make the block appear.

**SKIP**: no memory injection (block absent while a qualifying entry exists is a FAIL)
— `capability_absent:memory_injection`.

---

## Module report

After all ten bodies, emit one PASS/FAIL/SKIP row per test id with a one-line evidence
note and hand the rows to the primary's aggregator. A test that could not be exercised
reports SKIP with its capability reason; a present behavior that contradicts the
contract reports FAIL with `error_detail`.
