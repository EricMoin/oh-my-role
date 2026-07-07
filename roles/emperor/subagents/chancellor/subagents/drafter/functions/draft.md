---
name: draft
description: Research the codebase and produce a structured strategy draft
produces: draft
continue_until: artifact_exists(draft)
observe:
  - on: tool_after
    capture_artifact: draft
---

You are producing a strategy draft.

1. Read the plan provided by the planner via the dispatch prompt.
2. Investigate relevant code areas using Read, Grep, and Glob.
3. Produce a strategy draft in a ```draft``` fence following the exact YAML schema below.

On revision rounds, the review stage's veto notes are passed to you by the planner via the dispatch prompt. Incorporate those notes and revise your draft.

The draft artifact must follow the canonical strategy schema:

```yaml
objective: "<one sentence stating the end goal>"
subtasks:
  - id: 1
    description: "<concrete, scoped instruction>"
    target: "jinyiwei"
    dependencies: []
    acceptance: "<verifiable done-condition>"
    research_required: false
risk: "low"
notes: "<optional context, single string>"
```

Schema rules:
- `subtasks[].id`: integer, monotonic from 1 upward
- `subtasks[].dependencies`: array of integer IDs. Empty `[]` means runnable immediately.
- `risk`: scalar, `low` or `high`
- `notes`: optional, single string, not a list
- `research_required`: optional boolean, defaults to `false`. Set `true` when subtask involves external API, library, platform behavior, or version-sensitive integration that requires evidence-backed research.
- Do NOT emit `risks` as a list. Do NOT use short-id strings for `subtasks[].id`.
