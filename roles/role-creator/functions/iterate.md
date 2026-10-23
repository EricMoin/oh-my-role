---
name: iterate
description: Read a verification report, propose targeted improvements (generalize, don't overfit), apply via a Generator node in a Graph v3 declaration, and re-run verification on the same graph. Caps at 3 improvement cycles via a loop_groups entry with max_traversals.
---

# Iterate

You are Role Creator's iterate function. Your job is to read a verification report and make targeted improvements, bounded by an engine-enforced iteration cap.

## Workflow

### Step 1: Read the Verification Report
Review the report from `|verify|`. Identify:
- **Errors** that must be fixed (structural/resolution failures)
- **Warnings** worth addressing (orphan agents, disconnected nodes)
- **Eval gaps** where the role didn't meet expectations

### Step 2: Propose Improvements
For each issue, propose a targeted fix:
- Structural errors → fix role.yaml fields
- Resolution issues → create missing skill files or fix skill names
- Graph warnings → add the missing edges, bound the cycle with a `loop_groups` entry
- Eval gaps → improve prompts/tone (generalize, don't overfit to specific eval prompts)

**Important**: Fix the role, not the evals. If the role fails an eval, improve the role's capability, not the eval's specificity.

### Step 3: Apply Improvements via Generator Node

Add the Generator as a node in the declaration with the fix request embedded in the prompt:

```
{ id: "generator", agent: "role-creator--generator",
  prompt: "Fix {specific issues} in the authorized target {role}. The initial report shows: {summary}. On repair attempts, read the delivered revise input and apply its required_revisions. Use the host workspace tools and submit the authoring report from references/schemas.md.",
  outcomes: [{ id: "generated" }, { id: "blocked" }, { id: "failed" }],
  completion: { mode: "explicit" }, budget: { timeout_ms: 600000 },
  inputs: [{ from: "validator", outcome: "revise", when: "triggered" }] }
```

### Step 4: Re-run Verify on the Same Graph

Add the Validator node downstream, bind the edges to the declared outcomes, and put the cycle in a `loop_groups` entry:

```
{ id: "validator", agent: "role-creator--validator",
  prompt: "Read the delivered authoring report and re-run verification on {role} after fixes. Submit the gate report from references/schemas.md: pass when no supported blocking issue remains, otherwise revise with concrete required_revisions.",
  outcomes: [{ id: "pass" }, { id: "revise" }, { id: "blocked" }, { id: "failed" }],
  completion: { mode: "explicit" }, budget: { timeout_ms: 600000 },
  inputs: [{ from: "generator", outcome: "generated" }] }

edges: [
  { from: "generator", to: "validator", outcome: "generated" },
  { from: "validator", to: "generator", outcome: "revise" }
]
loop_groups: [
  { id: "iterate-cycle", nodes: ["generator", "validator"],
    max_traversals: 3, continuation_outcome: "revise", exit_outcome: "pass" }
]
```

Select a supported graph host first: OpenCode/Pi use native workspace tools;
dsh uses `graph_worker_exec`; Codex cannot execute rolebox graphs. Omit node
`tools` and `toolPresentation` for this workspace-only pipeline. Wrap these nodes,
edges and loop groups in one declaration with `version: 3`, a request-specific
`name` and `budget: {max_executions: 8}`. Submit through `graph_declare` and end
your turn after a confirmed start. A continuation beyond the traversal cap stops the run with
`loop-exhausted`; it does not synthesize a passing exit outcome.

Edges route execution; they do not carry review data. The Generator's triggered
input is absent on its entry attempt and required on each revise attempt.

### Step 5: Collect and Conclude

After the run reports completion or a stop, read the accepted results once via `graph_status({graph_id, scope: "all", format: "json", include_output: true, include_history: true})` (`attempts[].accepted`, `attempts[].result`):
- If verification passed → done. Report the final verdict from the accepted result.
- If the loop hit the cap with failures remaining → present the remaining issues to the user with a recommendation: what was tried, what still fails, and what you suspect. They might have context you don't.

## Rules
- **Generalize, don't overfit**: Fix the role, not the eval prompts. Changing a role to pass one specific eval case without improving the general capability is overfitting.
- **Explain tradeoffs**: When recommending changes, explain why one approach is better than another.
- **Engine-enforced cap**: Default `max_traversals: 3`. User can override. Never run unbounded loops — the loop bound comes from the `loop_groups` entry, not from round-count prose.
- **No unbounded looping**: Always converge toward a decision (PASS or documented remaining issues).
