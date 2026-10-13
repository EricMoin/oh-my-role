---
name: verify
description: Run the full 4-tier verification suite on a role — Tier 1+2 always (structural + resolution + the Graph v3 configuration rules), Tier 3 with confirmation (deploy/health), Tier 4 opt-in (behavioral eval). Produces a consolidated pass/fail report.
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
- `graph_validation` — legacy v1 collaboration block: no unknown agent refs, no missing exits, no missing entry points (legacy-compat)
- `graph_block_retired` — a `graph:` block is retired by the catalog's policy (ERROR; rolebox only warns and ignores it)
- `memory_config` — `inject` is boolean, `max_inject` is integer, `min_relevance` in low/medium/high, `scope` in workspace/role/both (WARN on malformed)
- `termination_any_of` — `collaboration.termination.any_of` entries must be `{max_iterations: int}` or `{result_matches: {agent, contains}}` (WARN on unknown shapes)
- `permission_legacy_tools` — a retired live-contract tool in `permission.allow` or a `tools:` key (ERROR; see `validation-catalog.md` for the denied token list)
- `loop_function` — a `functions` entry named `loop` (WARN — bounded cycles use a `loop_groups` entry with `max_traversals`)
- `graph_tool_split` — the declarer split on a primary role, the exact inverse on a worker subagent (ERROR)

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

- **Host-authorized approval gate.** When the host has installed an approval policy for the exact graph and node, declare the Validator node's outcome with the `principal-approval@1` acceptance primitive (per `references/graph-protocol.md`). The capability preflight refuses a declaration whose graph and node have no installed approval rule. Raise the request with `graph_control(command: "approval-request", graph_id, node_id, attempt_id, reason, approver_session_id, expires_at)`, present the flagged operation to the user, and let the policy-authorized approver session record `approve` or `reject`. A decision records a control decision; it never submits a business outcome or performs the remaining action.

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

The Grader scores the resulting transcripts. Declare it as a node (`agent: "role-creator--grader"`) with the eval cases and transcripts embedded in the prompt, then read its accepted result from `graph_status` (`attempts[].result`). Report the grader's verdict for each case.

**Pass threshold:** ≥7/10 on ≥60% of cases (configurable).

---

## Running Verification as a Declaration

Verification can run directly (scripts above) or as a declared Graph v3 node for isolated, read-only execution. For the declared path, author one declaration per verify request through `graph_declare`:

```
graph_declare({ declaration: {
  version: 3,
  name: "verify-{role}",
  budget: { max_executions: 2 },
  nodes: [
    { id: "validator", agent: "role-creator--validator",
      prompt: "Run Tier 1+2 on {roleDir} and submit the structured gate report. Tier 3: {ask the user; run only if confirmed}. Tier 4: {skip or include evals at {evalsPath}}.",
      outcomes: [{ id: "pass" }, { id: "revise" }, { id: "blocked" }, { id: "failed" }],
      completion: { mode: "explicit" }, budget: { timeout_ms: 600000 } }
  ],
  edges: []
}})
```

- End your turn after a confirmed start (`started` / `resumed`) and yield for the completion, stop or attention notification.
- After the notification, read the Validator's accepted result once via `graph_status({graph_id, scope: "all", format: "json", include_output: true, include_history: true})` (`attempts[].accepted`, `attempts[].result`) and assemble the consolidated report below.
- When Tier 3/4 confirmation must be gated in-graph, declare the node outcome with the `principal-approval@1` acceptance primitive under a host-installed approval policy (see Tier 3 above).

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
- Graph (legacy v1): {valid/invalid}
- graph_block_retired: {valid/invalid} — no `graph:` block may be declared (Rule 1)
- v3 tool split (graph_tool_split): {valid/invalid} — declarer split or exact inverse (Rule 6)
- Memory: {valid/invalid}
- Termination: {valid/invalid}
- Retired live-contract tools (permission_legacy_tools): {none/found}
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

**Role works:** Tier 2 full verdict PASS (including the Graph v3 rules 1-6 valid — no `graph:` block, correct tool split, no retired live-contract tools — and valid memory/termination shapes) + Tier 3 sync ok + Tier 4 persona/boundary cases pass.

**Sub-function works:** Tier 4 shows declared behavior fires correctly (gates block/pass, observe is non-mutating, transitions are deterministic, `continue_until` terminates).

---

## Rules

- Never run Tier 3 or 4 without user confirmation (a chat ask, or a host-installed approval gate declared on the node).
- Never auto-fix issues. Report them and suggest fixes, then hand off to `|iterate|`.
- Never mark PASS while errors exist.
- If Tier 1 fails, fix structural issues before trusting Tier 2 results.
- Warnings don't block a PASS verdict but must be surfaced.
