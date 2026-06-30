---
name: verify
description: Run the full 4-tier verification suite on a role — Tier 1+2 always (structural + resolution), Tier 3 with confirmation (deploy/health), Tier 4 opt-in (behavioral eval). Produces a consolidated pass/fail report.
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
- `graph_validation` — no unknown agent refs, no missing exits, no missing entry points

**Warnings** (non-blocking, surfaced to user):
- Orphan agents never referenced in edges
- Disconnected nodes unreachable from parent
- Cycles without `max_iterations`
- Skill-name collisions with global skills

If any check FAILs: report the specific error, reference the relevant rule from `validation-catalog.md`, explain what it means, and suggest a fix.

---

### Tier 3 (requires user confirmation)

Ask the user:

> Run deploy/health check (Tier 3)? This uses the rolebox CLI in a throwaway config directory. Your real config is untouched.

If confirmed, run:

```bash
python3 scripts/sync_check.py <roleDir> --json
```

Report:
- Plugin registered (rolebox recognizes the role)
- Sync status (role appears in active configuration)
- Skill symlink health (all skill paths resolve after sync)

If `rolebox` is not installed or not on PATH, report: "Tier 3 skipped — rolebox CLI not found." This is not a failure.

---

### Tier 4 (opt-in, cost-intensive)

Ask the user:

> Run behavioral eval (Tier 4)? This spawns a separate opencode instance and costs API tokens. Spot-check mode (1 case, 1 run) available for quick iteration.

If confirmed, run:

```bash
python3 scripts/run_eval.py <roleDir> --evals <evals.json> --confirm --spot-check
```

Report the grader's verdict for each case.

**Pass threshold:** ≥7/10 on ≥3/5 cases (configurable).

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
- Warnings: {list or "none"}

### Tier 3 — Deploy: {PASS/FAIL/SKIP}
- Registered: {✓/✗/—}
- Synced: {✓/✗/—}
- Symlinks: {✓/✗/—}

### Tier 4 — Eval: {PASS/FAIL/SKIP}
- Cases passed: {n}/{total}
- Threshold: ≥7/10 on ≥3/5
- Mode: {full/spot-check}

### Summary
- Verdict: {PASS/FAIL}
- Issues: {list of failures}
- Suggested fixes: {actionable suggestions — do NOT auto-fix}
```

---

## Mapping: What "Works" Means

**Skill works:** Tier 2 resolves it + Tier 3 shows it registered + Tier 4 shows improvement over baseline.

**Role works:** Tier 2 full verdict PASS + Tier 3 sync ok + Tier 4 persona/boundary cases pass.

**Sub-function works:** Tier 4 shows declared behavior fires correctly (gates block/pass, observe is non-mutating, transitions are deterministic, `continue_until` terminates).

---

## Rules

- Never run Tier 3 or 4 without user confirmation.
- Never auto-fix issues. Report them and suggest fixes, then hand off to `|iterate|`.
- Never mark PASS while errors exist.
- If Tier 1 fails, fix structural issues before trusting Tier 2 results.
- Warnings don't block a PASS verdict but must be surfaced.
