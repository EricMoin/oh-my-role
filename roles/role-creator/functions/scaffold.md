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
- If **mismatch** or **unknown**: show the warning and ask whether to continue. Sometimes the user knows what they're doing; sometimes they don't. Either way, they should decide.

### Step 2: Capture Intent

Ask these four framing questions. They give the Generator enough context to produce something useful on the first pass:

1. **Domain** — What should this role do? What problem does it solve? (The more specific, the better the output.)
2. **Template** — Simple, director+gated, graph-orchestrated, or nested+state-machine? If the user isn't sure, explain what each looks like and when you'd pick it.
3. **Skills/Functions** — Any specific capabilities the role needs? Existing skills to bundle, or new ones to create?
4. **References** — Any existing roles worth learning from? Similar patterns in the registry?

Look up existing roles in the registry that overlap with the user's domain. This avoids reinventing things and gives the Generator good examples to riff on.

### Step 3: Choose Template

If the user didn't pick a template in step 2, recommend one based on what you learned. Simple roles don't need gated subagents. Complex orchestration roles do. Match the complexity to the problem.

### Step 4: Generate

Author one Graph v3 declaration and start it through `graph_declare` in the same call, with everything you've gathered embedded in the Generator node prompt:

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
      "budget": { "timeout_ms": 600000 },
      "tools": ["Write", "Edit", "Bash"]
    }
  ],
  "edges": []
}
```

Submit the whole object with `graph_declare({declaration: {...}})`. There is no incremental node/edge construction step and no separate run step. Inspect the returned start decision: `started` or `resumed` is real dispatch; `saved`, `blocked` and `refused` are not. After a confirmed start, end your turn and yield for the real completion notification.

The Generator writes all role artifact files: role.yaml, PROMPT.md, skills, functions, subagents. It settles its own attempt by submitting its declared outcome through `graph_submit_outcome`. When the run reports completion, read its accepted result once via `graph_status(graph_id, scope: "all", format: "json", include_output: true, include_history: true)` before moving on.

### Step 5: Draft Eval Cases

Create `evals/evals.json` with basic eval cases for the new role. Aim for 3-5 cases — at minimum:

- 1 positive case (the role handles its core task correctly)
- 1 boundary case (edge of scope, should still work)
- 1 rejection case (out of scope, role should decline or redirect)

These aren't exhaustive. They're smoke tests so `|verify|` has something to run.

### Step 6: Hand Off to Verify

Tell the user the role has been generated and recommend running `|verify|` to validate structure, lint the YAML, and run the eval cases. Don't do the verification yourself.

## Guardrails

These exist because past runs went sideways without them:

- Don't generate beyond the chosen template complexity. If they asked for simple, don't sneak in a state machine.
- Don't create artifacts the user didn't ask for. No bonus skills, no surprise subagents.
- Don't touch other roles. Scope is the new role only.
- Stop after step 5. Verification belongs to the verify function, not here.
