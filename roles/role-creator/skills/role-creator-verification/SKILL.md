---
name: role-creator-verification
description: The 4-tier verification methodology for rolebox roles. Covers what each tier checks, which script runs it, pass thresholds, when to require user confirmation, and how to map results to "skill/role/sub-function works." Load when verifying a generated role.
---

# 4-Tier Verification Methodology

Verification answers one question: does this role actually work? Four tiers answer it at increasing depth and cost.

| Tier | What | Self-Contained? | Needs Confirmation? |
|------|------|:---:|:---:|
| 1 | Structural validity | Yes | No |
| 2 | Resolution simulation | Yes | No |
| 3 | Deploy/health check | No (rolebox CLI) | Yes |
| 4 | Behavioral eval | No (separate opencode) | Yes (opt-in, costs money) |

Tiers 1 and 2 run automatically after generation. Tiers 3 and 4 require explicit user consent.

---

## Tier 1: Structural Validation

**Script:** `validate_role.py <roleDir> --json`

**Self-contained:** Pure Python. No subprocess calls, no rolebox imports, no network access.

**Checks performed:**

- YAML parse succeeds on `role.yaml`
- Required fields present: `name` (non-empty string), `prompt` or `prompt_file` (at least one)
- `prompt`/`prompt_file` exclusivity: if `prompt_file` is set and resolves to a readable file, `prompt` is ignored; if `prompt_file` is set but unresolvable, that's fatal
- Role ID does not contain the reserved `--` separator
- Subagent names do not contain `--`
- Skill files have valid YAML frontmatter (`name` and `description` fields)
- Function files have non-empty body content after frontmatter stripping
- Reference `.md` files are parseable

**Output:**

```json
{ "tier1": { "checks": [...], "passed": 12, "failed": 0 }, "verdict": "PASS" }
```

Verdict is PASS only when zero fatal errors exist. Any single fatal check fails the entire tier.

---

## Tier 2: Resolution Simulation

**Script:** `validate_role.py <roleDir> --json` (same script, results accumulate across both tiers)

**Self-contained:** Pure Python. All resolution logic reimplements the rules from the validation catalog without importing rolebox.

**Checks performed:**

- **Skill 4-candidate resolution:** For each declared skill name, verify at least one candidate path exists on disk following the priority order (role-local directory, role-local single-file, global directory, global single-file)
- **Function 3-candidate resolution:** For each declared function name, verify at least one candidate exists (role-local, global, built-in)
- **Reference auto-discovery:** All `.md` files under `references/` are discoverable and parseable
- **Subagent discovery:** File-based subagents at `subagents/*/role.yaml` resolve correctly; inline subagents parse successfully
- **Legacy v1 graph validation (6 checks, legacy-compat):** validates the declarative `collaboration:` flow-graph block only — retained for schema compatibility; does not gate graph_v2 runtime wiring
  1. Unknown agent reference (FATAL)
  2. No exit edge (FATAL)
  3. No entry point from parent (FATAL)
  4. Orphan agent never referenced in edges (WARN)
  5. Disconnected node unreachable from parent (WARN)
  6. Cycle without `max_iterations` (WARN, defaults to 3)
- **Graph engine v2 checks:**
  - `graph.orchestration` must equal `graph_v2` whenever a `graph:` block is present (FATAL otherwise)
  - `memory` config shape: `inject` boolean, `max_inject` integer, `min_relevance` in low/medium/high, `scope` in workspace/role/both (WARN on malformed)
  - `collaboration.termination.any_of` entries must be `{max_iterations: int}` or `{result_matches: {agent, contains}}` (WARN on unknown shapes)
  - Legacy-tool denial: `Dispatch`, `dispatch_output`, `dispatch_cancel` in `permission.allow` is an ERROR (removed Phase C)
  - `functions` entry named `loop` warns (deprecated Phase C — bounded cycles run via `graph_add_loop`)
- **Skill-name-collision detection:** Warns if a role-local skill name collides with a known-names set (global skills + built-in functions `plan`, `execute`)
- **Collaboration-target existence:** If the role references collaboration targets, warns when those targets can't be found on disk

**Output:**

```json
{
  "tier2": { "checks": [...], "passed": 13, "failed": 0 },
  "errors": [],
  "warnings": ["skill 'foo' collides with global skill", "functions entry named 'loop' is deprecated; use graph_add_loop"],
  "verdict": "PASS"
}
```

Verdict is PASS when zero errors exist. Warnings do not block but are surfaced to the user.

---

## Tier 3: Deploy/Health Check

**Script:** `sync_check.py <roleDir>`

**Requires confirmation before running.** This tier invokes the rolebox CLI as a black box.

**What it does:**

1. Creates a throwaway `XDG_CONFIG_HOME` directory
2. Places the role into that config location
3. Runs `rolebox status --json`
4. Inspects the output for health signals

**Checks performed:**

- Plugin registered: rolebox recognizes the role as installed
- Role synced: the role appears in the active configuration
- Skill symlinks valid: all skill paths resolve correctly after sync

**Graceful skip:** If `rolebox` is not installed or not on PATH, Tier 3 reports "skipped (rolebox not available)" rather than failing. This is not a verification failure.

**Failure reporting:** If rolebox IS installed but sync fails, the script captures the precise error message from `rolebox status --json` and reports it verbatim.

**Deploy-to-harness check (Tier 2/Tier 3 note):** a later subtask adds a deploy feature that installs a generated role into the local rolebox harness directory `~/.config/opencode/rolebox/`, then runs `asset_hot_reload`. Verification for that capability:

- Tier 2 (static): the deployed role directory MUST contain both `role.yaml` and `PROMPT.md`. Missing either file is an ERROR.
- Tier 3 (dynamic): after `asset_hot_reload`, the deployed role MUST appear in hot-reload discovery (asset discovery finds the role under the harness dir). A deployed-but-undiscovered role means the hot-reload step failed or the directory layout is wrong.

---

## Tier 4: Behavioral Eval

**Script:** `run_eval.py <roleDir> --confirm`

**Opt-in only.** Prints a cost estimate and exits unless `--confirm` is passed. This tier spawns a separate opencode instance (NOT an in-session dispatch).

**What it does:**

1. Reads `evals.json` from the role directory
2. Builds a throwaway opencode config without the target role/skill (baseline)
3. Runs each eval case against baseline (minimum 3 runs per case)
4. Builds a config WITH the target role/skill
5. Runs each eval case against the with-target config (minimum 3 runs per case)
6. A grader subagent scores each transcript independently

**Pass threshold (defaults, all configurable):**

| Parameter | Default |
|-----------|---------|
| Grader score per case | >= 7/10 |
| Cases that must pass | >= 60% of cases |
| Runs per case | >= 3 |
| Scoring method | Majority vote across runs |

**Spot-check mode:** For quick iteration during development: 1 case, 1 run, no baseline. Verifies the agent doesn't completely break. Not sufficient for final validation.

**Deterministic checks** (for state-machine functions) — *specified below but not yet automated by `run_eval.py` (`run_state_machine_checks()` is a stub); verify these manually until implemented*:

- Gate blocks when condition is false, passes when true
- Observe reactions are non-mutating (active function set unchanged)
- Transitions are deterministic (same conditions produce same result across runs)
- `continue_until` terminates (normal exit on condition met, cap exit at `continue_max`)

---

## The "Works" Mapping

Verification results map to three claims about what "works."

### Skill Works

A skill is verified working when:

1. **Tier 2** resolves it via the 4-candidate priority search (file exists on disk)
2. **Tier 3** shows it registered and symlinked after sync
3. **Tier 4** with/without baseline comparison shows measurable improvement when the skill is loaded

### Role Works

A role is verified working when:

1. **Tier 2** produces a full-resolution PASS verdict (all fields, all subagents, legacy v1 6-check graph block valid, graph_v2/memory/termination shapes valid, no legacy removed tools in `permission.allow`)
2. **Tier 3** reports sync:true with no warnings
3. **Tier 4** persona and boundary eval cases pass on diverse prompts, including out-of-scope rejection cases

### Each Sub-Function Works

A function is verified working when:

1. It's callable via its declared name (`|function-name|` syntax)
2. Its name is not a removed/deprecated legacy token: `Dispatch`/`dispatch_output`/`dispatch_cancel` (ERROR at Tier 2), `loop` (WARN at Tier 2 — bounded cycles run via `graph_add_loop`)
3. It produces the behavior declared in its definition (verified at Tier 4)
4. State-machine functions pass deterministic checks: gate blocks/passes correctly, observe doesn't mutate state, transitions repeat identically, continue_until terminates

---

## Guidance for the Agent

- Always run Tiers 1 and 2 after generating or modifying a role. They're free and fast.
- Never run Tier 3 or 4 without asking the user first.
- If Tier 1 fails, fix structural issues before attempting Tier 2.
- If Tier 2 warns about skill collisions, missing collaboration targets, malformed memory/termination shapes, or a `loop` function entry, inform the user but don't treat these as blockers. Treat a non-`graph_v2` `graph.orchestration` or a legacy removed tool (`Dispatch`, `dispatch_output`, `dispatch_cancel`) in `permission.allow` as a hard error — fix before proceeding.
- For Tier 4, present the cost estimate and let the user decide. One spot-check run is a reasonable middle ground when full eval feels excessive.
- When eval cases fail, fix the role, not the eval prompts. Generalize, don't overfit.

---

## References

- Complete rule definitions: `references/schema/validation-catalog.md`
- Eval format and thresholds: `references/templates/eval-set.md`
