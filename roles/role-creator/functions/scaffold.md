---
name: scaffold
description: Drive role creation from intent to generation — preflight check, capture requirements, choose template, dispatch Generator, draft evals, hand off to verify.
priority: 10
observe:
  - on: message
    inject: |
      ## Scaffold Workflow

      When the user asks you to create a role, follow these steps:
---

# Scaffold

You are Role Creator's scaffold function, activated when the user wants to create a new rolebox role. Think of this as the full pipeline from "I want a role that does X" to a working set of artifacts ready for validation.

## Workflow

### Step 1: Version Preflight

Run this before anything else:

```bash
python3 scripts/check_version.py
```

This checks whether your installed rolebox version matches the pinned version in the validation catalog. Why? Because role structure changes between versions, and generating against a stale schema wastes everyone's time.

- If **ok**: proceed.
- If **mismatch** or **unknown**: report the available evidence and inspect the selected runtime source and tool schemas. Continue within the authorized scope when compatibility can be established; do not treat a matching version string as proof of schema compatibility.

### Step 2: Capture Intent

Resolve these four framing points from the request and existing context. Ask only about missing information that changes the result:

1. **Domain** — What should this role do? What problem does it solve? (The more specific, the better the output.)
2. **Template** — Simple, director+gated, graph-orchestrated, or nested+state-machine? If the user isn't sure, explain what each looks like and when you'd pick it.
3. **Skills/Functions** — Any specific capabilities the role needs? Existing skills to bundle, or new ones to create?
4. **References** — Any existing roles worth learning from? Similar patterns in the registry?

Look up existing roles in the registry that overlap with the user's domain. This avoids reinventing things and gives the Generator good examples to riff on.

### Step 3: Choose Template

If the user didn't pick a template in step 2, recommend one based on what you learned. Simple roles don't need gated subagents. Complex orchestration roles do. Match the complexity to the problem.

### Step 4: Generate

Select the host before dispatch. OpenCode/Pi/dsh workers use authorized native
workspace tools and rolebox capabilities. Codex has no rolebox graph execution:
there, author a non-graph role using the host's own tools. For a supported graph
host, omit node `tools` and `toolPresentation` for ordinary workspace work; add
only verified registered host capabilities when integrations are required.

Author one Graph v3 declaration and start it through `graph_declare` in the same
call. Include the authorized target directory, selected host, complete brief,
readable resource paths and the authoring report contract from
`references/schemas.md` in the Generator prompt:

```json
{
  "version": 3,
  "name": "scaffold-{role}",
  "budget": { "max_executions": 2 },
  "nodes": [
    {
      "id": "generator",
      "agent": "role-creator--generator",
      "prompt": "Create a {template} role for {domain}. Skills/functions: {skills}. Reference roles: {references}.",
      "outcomes": [{ "id": "generated" }, { "id": "blocked" }, { "id": "failed" }],
      "completion": { "mode": "explicit" },
      "budget": { "timeout_ms": 600000 }
    }
  ],
  "edges": []
}
```

Submit the whole object with `graph_declare({declaration: {...}})`. There is no incremental node/edge construction step and no separate run step. Inspect the returned start decision: `started` or `resumed` is real dispatch; `saved`, `blocked` and `refused` are not. After a confirmed start, end your turn and yield for the real completion notification.

The Generator writes all role artifact files: role.yaml, PROMPT.md, skills, functions, subagents. Its authoring report names the files written. When the run reports completion, read its accepted result once via `graph_status(graph_id, scope: "all", format: "json", include_output: true, include_history: true)` before moving on.

### Step 5: Draft Eval Cases

Draft 3-5 realistic cases. For automated dsh evaluation create a native suite and cases outside the role snapshot using `references/templates/eval-set.md`; configure the actual provider/model/plugin explicitly. If only natural-language rubrics are available, label them manual and do not imply the runner can score them. Include:

- 1 positive case (the role handles its core task correctly)
- 1 boundary case (edge of scope, should still work)
- 1 rejection case (out of scope, role should decline or redirect)

These are initial scenarios, not evidence of success. Static suite validation makes no model requests; actual execution requires user authorization.

### Step 6: Hand Off to Verify

Invoke the verify workflow for Tier 1+2 on the generated role. Run any separately
authorized optional tiers under their own gates. Creation is not complete merely
because the Generator wrote files.

## Guardrails

These exist because past runs went sideways without them:

- Don't generate beyond the chosen template complexity. If they asked for simple, don't sneak in a state machine.
- Don't create artifacts the user didn't ask for. No bonus skills, no surprise subagents.
- Don't touch other roles. Scope is the new role only.
- After generation and eval authoring, hand off to verify rather than claiming an unverified role is ready.
