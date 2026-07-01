# Changelog

All notable changes to the Emperor role. Versioning follows semantic versioning; releases are tracked via git tags.

## [2.1.0]

### Fixed

- **Closed-loop validation now actually runs.** Validation was an inert `validate` function on the chancellor, but the chancellor auto-activates `plan` (locked), so a validation dispatch never ran the validate logic — the session tried to plan instead. Validation is now handled by a dedicated first-level `emperor--validator` subagent that auto-activates its `validate` function, giving it a clean session where validation is the only active function.
- `validate` now declares the lifecycle fields it was missing (`produces: result`, `continue_until: artifact_exists(result)`, `continue_max: 5`) so its verdict is reliably produced and captured. It also handles missing/unverified/unparseable reports explicitly.
- Corrected stale prose in `references/model-pool-and-budget.md`: the reviewer runs on `tier-1-flagship`; the text previously framed the move as pending while the config already used opus, and contradicted the pool table in the same document.
- Removed the stale "(placeholder)" labels for the data/docs/quality departments in `references/terminology-and-style.md` — all six departments are live.
- Fixed a dangling `escalate-recovery` skill pointer in the jinyiwei `route` function. The recovery pattern is already inlined there; the emperor-level skill targets a `final_answer` fence, which would mislead the router (which returns a `result` fence).
- Added the required `build/tests: N/A` line to the docs execution report and fixed a `<=80` vs `≤80` inconsistency in the quality report.
- Normalized department escalation wording to the canonical "executor/router" term for jinyiwei (previously split between "orchestrator" and "executor/router").
- Removed a vestigial `state_schema_version` from `orchestrate` (the function explicitly disclaims state usage and references no state conditions).

### Added

- Dedicated `emperor--validator` subagent (tier-2-reasoning pool). Keeping validation in the pro-max pool means the closed-loop validate step never consumes the opus pool, which simplifies the reviewer budget: worst-case reviewer sessions are now 3 (chancellor convergence loop only).
- Failure handling in the chancellor `orchestrate` loop for drafter/reviewer/finalizer dispatch failures (one retry, then graceful degradation).
- Stale/hung dispatch handling (cancel + one retry) in the jinyiwei `route` function.
- A dependency-context-passing rule in the orchestrator (`PROMPT.md`): dependent subtasks are dispatched with their prerequisites' execution reports embedded.
- Evals for the new validator, department scope discipline (test, docs), a regression case pinning the validation dispatch target to `emperor--validator`, and a full plan-execute-validate-synthesize scenario.

### Changed

- Documented the `result` fence as the universal dispatch-return envelope in `references/schemas.md`; the payload schema is determined by the producer (Strategy, Validate Result, or Execution Report).

## [2.0.0]

- Initial de-themed orchestrator release: functional terminology, English-only prompts, three independent model pools, budget-aware scheduling, six live departments, and the closed-loop validation design.
