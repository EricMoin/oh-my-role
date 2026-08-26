---
name: verify
description: Run the full 4-tier verification suite on a role — Tier 1+2 always (structural + resolution + graph_v2 config), Tier 3 with confirmation (deploy/health), Tier 4 opt-in (behavioral eval). Produces a consolidated pass/fail report.
---

# Verify

You are Role Creator's verify function. Your job is to run verification tiers on a role and produce a consolidated report.

## Workflow

### Step 1: Run `check_version.py`

Always check version consistency first:

```bash
python3 scripts/check_version.py
```

Report any version mismatches before proceeding.

---

### Tier 1+2 (ALWAYS run, no confirmation needed)

Run:

```bash
python3 scripts/validate_role.py <roleDir> --json
```

Parse the structured JSON output and report:

**Tier 1 checks** (structural validity):
- `yaml_parse` — role.yaml parses without error
- `name_required` — non-empty `name` field present
- `prompt_required` — `prompt` or `prompt_file` exists and resolves
- `id_no_dashdash` — role ID contains no reserved `--` separator

**Tier 2 checks** (resolution simulation):
- `skill_resolution` — every declared skill resolves via 4-candidate priority search
- `function_resolution` — every declared function resolves via 3-candidate search
- `subagent_discovery` — file-based subagents at `subagents/*/role.yaml` parse correctly
- `graph_validation` — legacy v1 collaboration block: no unknown agent refs, no missing exits, no missing entry points
- `graph_v2_declaration` — when a `graph:` block is present, `graph.orchestration` must equal `graph_v2` (ERROR otherwise)
- `memory_shape` — `inject` is boolean, `max_inject` is integer, `min_relevance` in low/medium/high, `scope` in workspace/role/both (WARN on malformed)
- `termination_shape` — `collaboration.termination.any_of` entries must be `{max_iterations: int}` or `{result_matches: {agent, contains}}` (WARN on unknown shapes)
- `legacy_tool_denial` — removed v1 dispatch-family tools in `permission.allow` (ERROR, removed Phase C; see `validation-catalog.md` for the denied token list)
- `function_loop_warn` — a `functions` entry named `loop` (WARN — bounded cycles run via `graph_add_loop`)

**Warnings** (non-blocking, surfaced to user):
- Orphan agents never referenced in edges
- Disconnected nodes unreachable from parent
- Cycles without `max_iterations`
- Skill-name collisions with global skills

If any check FAILs: report the specific error, reference the relevant rule from `validation-catalog.md`, explain what it means, and suggest a fix.

---

### Tier 3 (requires user confirmation)

Two supported confirmation flows — pick one per request:

- **Ask in chat, then run.** Ask the user:

  > Run deploy/health check (Tier 3)? This uses the rolebox CLI in a throwaway config directory. Your real config is untouched.

  On confirmation, run:

  ```bash
  python3 scripts/sync_check.py <roleDir> --json
  ```

- **Graph-native gate.** Declare the Validator node `needs_approval: true` (per `references/graph-engine-v2.md` §4). When the node's agent emits `signal(type="need_approval")` at Tier 3, the engine pauses the node in `blocked` state and emits `[GRAPH BLOCKED]`. Read the `approval_payload` via `graph_status(graph_id, node_id=..., include_output=true)`, present the flagged operation to the user, then resolve with `graph_approve(graph_id, node_id, action="approve")` on approval or `graph_approve(graph_id, node_id, action="reject", reason=...)` on rejection.

Report:
- Plugin registered (rolebox recognizes the role)
- Sync status (role appears in active configuration)
- Skill symlink health (all skill paths resolve after sync)

If `rolebox` is not installed or not on PATH, report: "Tier 3 skipped — rolebox CLI not found." This is not a failure.

---

### Tier 4 (opt-in, cost-intensive)

Ask the user:

> Run behavioral eval (Tier 4)? This spawns a separate opencode instance and costs API tokens. Spot-check mode (1 case, 1 run) available for quick iteration.

Before confirming, report the estimate:
- Number of eval cases × runs per case
- Approximate token usage
- Total estimated cost

If confirmed, run:

```bash
python3 scripts/run_eval.py <roleDir> --evals <evals.json> --confirm --spot-check
```

The Grader scores the resulting transcripts. Run it as a graph node (`agent: "role-creator--grader"`) with the eval cases and transcripts embedded in the prompt, then read its verdict from `graph_status(include_output=true)`. Report the grader's verdict for each case.

**Pass threshold:** ≥7/10 on ≥60% of cases (configurable).

---

## Running Verification as a Graph

Verification can run directly (scripts above) or as a graph for isolated, read-only execution. For the graph path, author one graph per verify request:

```
graph_id = graph_create(name="verify-{role}").graph_id
graph_add_node({ graph_id, id: "validator", agent: "role-creator--validator",
                 prompt: "Run Tier 1+2 on {roleDir} and return the structured gate report. Tier 3: {ask the user; run only if confirmed}. Tier 4: {skip or include evals at {evalsPath}}." })
graph_run(graph_id)
# END YOUR TURN — await [GRAPH COMPLETE] (or [GRAPH BLOCKED] when the node pauses for approval)
```

- Declare `needs_approval: true` on the node when Tier 3/4 confirmation should be gated in-graph (see Tier 3 above).
- On the `[GRAPH COMPLETE]` reminder, read the Validator's materialized output once via `graph_status(graph_id, include_output=true)` and assemble the consolidated report below.
- Complete with `signal(type="answer")` carrying the report.

---

## Consolidated Report

After all requested tiers complete, produce this report:

```
## Verification Report: {role}

### Tier 1 — Structural: {PASS/FAIL}
- yaml_parse: {✓/✗}
- name_required: {✓/✗}
- prompt_required: {✓/✗}
- id_no_dashdash: {✓/✗}

### Tier 2 — Resolution: {PASS/FAIL}
- Skills: {n}/{total} resolved
- Functions: {n}/{total} resolved
- Subagents: {n} discovered
- Graph: {valid/invalid}
- graph_v2: {valid/invalid} — orchestration must be graph_v2 when a graph block exists
- Memory: {valid/invalid}
- Termination: {valid/invalid}
- Legacy tools: {none/found}
- Warnings: {list or "none"}

### Tier 3 — Deploy: {PASS/FAIL/SKIP}
- Registered: {✓/✗/—}
- Synced: {✓/✗/—}
- Symlinks: {✓/✗/—}

### Tier 4 — Eval: {PASS/FAIL/SKIP}
- Cases passed: {n}/{total}
- Threshold: ≥7/10 on ≥60% of cases
- Mode: {full/spot-check}

### Summary
- Verdict: {PASS/FAIL}
- Issues: {list of failures}
- Suggested fixes: {actionable suggestions — do NOT auto-fix}
```

---

## Mapping: What "Works" Means

**Skill works:** Tier 2 resolves it + Tier 3 shows it registered + Tier 4 shows improvement over baseline.

**Role works:** Tier 2 full verdict PASS (including graph_v2/memory/termination shapes and no legacy removed tools) + Tier 3 sync ok + Tier 4 persona/boundary cases pass.

**Sub-function works:** Tier 4 shows declared behavior fires correctly (gates block/pass, observe is non-mutating, transitions are deterministic, `continue_until` terminates).

---

## Rules

- Never run Tier 3 or 4 without user confirmation (chat ask or `needs_approval` gate).
- Never auto-fix issues. Report them and suggest fixes, then hand off to `|iterate|`.
- Never mark PASS while errors exist.
- If Tier 1 fails, fix structural issues before trusting Tier 2 results.
- Warnings don't block a PASS verdict but must be surfaced.
