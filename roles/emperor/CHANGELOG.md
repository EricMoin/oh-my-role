# Changelog

All notable changes to the Emperor role. Versioning follows semantic versioning; releases are tracked via git tags.

## [2.9.0]

### Changed

- **Graph-native decomposition replaces the coarse-granularity bias.** The 2.8.0 budget cleanup had over-corrected: "decompose to the coarsest granularity / prefer fewer, larger subtasks / merge related steps" biased the chancellor toward monolithic single-node strategies, defeating the rolebox graph engine's per-node scheduling, parallelism, retry, and validation. Replaced across `subagents/chancellor/functions/plan.md`, `subagents/chancellor/subagents/drafter/skills/draft-methodology/SKILL.md`, `subagents/chancellor/subagents/finalizer/skills/finalization-criteria/SKILL.md`, `subagents/chancellor/skills/dependency-ordering/SKILL.md`, `subagents/chancellor/skills/task-decomposition/SKILL.md`, and `evals/evals.json` with a graph-native criterion: one concern per node with its own tool-checkable acceptance; independent work split into parallel depth-0 nodes; split for failure isolation (the revise loop re-runs per node); merge ONLY trivial same-concern fragments that share one verification and could never run in parallel. Dispatch cost is the engine's problem, not the planner's — when in doubt between merging and splitting distinct concerns, split. Single-node strategies are valid only for genuinely atomic tasks. `task-decomposition` now names over-merging as the graph-engine anti-pattern alongside over-splitting.

## [2.8.0]

### Removed

- **Prompt-level session-budget self-accounting.** Removed the `emperor_sessions_used` manual session counter and all its arithmetic from `functions/synthesize.md`, along with the "Per-parent budget | 20 maximum (HARD)" cap, the `graph_create(..., budget={ max_total_sessions: 20 })` declaration, the `include_budget` advisory notes, the budget-cap termination condition, and the budget-cap verdict/rows. The single termination condition for budget/capacity is now engine rejection: if the engine rejects a `graph_run`/`graph_add_node` for budget, capacity, or queue-full, the emperor records it and reports affected items as "unresolved (engine rejection)". Session/budget blocking is owned and enforced by the rolebox plugin/engine — prompt-level ceilings are not configurable and pollute the context window.
- **Per-parent budget documentation.** Deleted the "Closed-Loop Validate Budget", "Per-Parent Budget", and "Cost Intuition" sections plus Cost Defense layer 3 from `references/model-pool.md`, replacing them with a single neutral sentence that resource ceilings are owned/enforced by the rolebox plugin/engine. Model-pool topology, tier tables, 5-slot semaphores, and the procedural caps table were preserved.
- **Legacy dispatch config.** Removed the stale `maxActivePerParent: 3` and `maxTotalSessionsPerRequest: 20` dispatch config from `subagents/jinyiwei/skills/domain-routing/SKILL.md`; concurrency is now described as engine-managed with engine-rejection fallback. Cleaned the same vocabulary from the chancellor subtree (`subagents/chancellor/functions/plan.md`, `subagents/chancellor/skills/dependency-ordering/SKILL.md`, `subagents/chancellor/subagents/drafter/skills/draft-methodology/SKILL.md`), `role.yaml`, `README.md`, and `references/departments.md`.
- **Subtask-count ceiling removed.** The hardcoded ≤10 (recommended ≤8) subtask-count cap and its "no more than N subtasks" phrasing were removed from `subagents/chancellor/functions/plan.md`, `subagents/chancellor/subagents/drafter/skills/draft-methodology/SKILL.md`, `subagents/chancellor/subagents/finalizer/skills/finalization-criteria/SKILL.md`, and `references/schemas.md`, replaced by a qualitative granularity criterion: decompose until each unit is independently verifiable and merge over-split clusters. `subagents/chancellor/skills/task-decomposition/SKILL.md` now prefers merging near-trivial subtasks into one cohesive unit over a hard count. Granularity is a judgment criterion, not a numeric policy ceiling.
- **Loop-bound digits removed.** The fixed review/revise round caps and the literal `max_traversals: 2` / `: 3` constants were removed from prose and from the `graph_add_loop` call sites in `subagents/chancellor/functions/orchestrate.md` and `functions/synthesize.md`. The agent now picks a task-appropriate bound at runtime (`max_traversals: <a small bound you choose for this task>`); the parameter remains required and engine-enforced. Fixed round counts are not configurable, not auditable, and make root-causing behavior harder — limits belong to the plugin/engine.

### Changed

- **Semantic caps removed.** The fixed 2-round revise cap, `max_traversals: 2` (revise) / `: 3` (review), and the ≤10 (recommended ≤8) subtask cap were removed in favor of qualitative criteria (see the removal entries above). Only the one-jinyiwei-node-per-subtask fan-out and dependency-root re-run ordering remain. `functions/synthesize.md`, `references/model-pool.md`, and `README.md` now phrase the revise loop and subtask granularity without fixed round counts or numeric ceilings.
- **Model-pool reference renamed.** `references/model-pool-and-budget.md` → `references/model-pool.md`, with the `role.yaml` reference key `model-pool-and-budget` → `model-pool` and updated pointers in `README.md` and `references/departments.md`.
- **Vocabulary rename: "budget" → "cap" for the subtask-count ceiling.** The ≤10 (recommended ≤8) subtask-count cap is no longer called a "budget" anywhere, so the preserved semantic cap can no longer be confused with the removed session-budget quota. Budget/session enforcement is owned by the rolebox plugin/engine, and prompt-level ceilings were removed because they are not configurable and consume context. The subtask-count cap itself was subsequently removed in favor of a qualitative granularity criterion (see the removal entries above). Renamed in `subagents/chancellor/functions/plan.md`, `subagents/chancellor/subagents/drafter/skills/draft-methodology/SKILL.md`, and `subagents/chancellor/subagents/finalizer/skills/finalization-criteria/SKILL.md`.
- **Minor residual fixes.** "wastes budget" → token-cost wording in `references/model-pool.md`; "concurrency budget" → "concurrency limits" in `references/terminology-and-style.md`.
- **Retry-once → qualitative retry discipline.** The "retry exactly once" / "one retry maximum" rules were replaced with qualitative retry discipline across `PROMPT.md`, `references/terminology-and-style.md`, `skills/escalate-recovery/SKILL.md`, `subagents/jinyiwei/functions/route.md`, and `subagents/chancellor/functions/orchestrate.md`: retry a transient or uncertain failure; never blind-retry an unchanged failing input; on repeated failure stop and escalate honestly with what was attempted and what remains incomplete. The "no retry loops / no silent error swallowing" anti-pattern is preserved verbatim.
- **`collaboration.max_iterations` comment corrected.** The comment in `role.yaml` now states that `max_iterations` is legacy v1 config feeding only the `rolebox/src/graph/collaboration-bridge.ts` bridge and does NOT bound the imperative `graph_add_loop` revise/review cycles; the field and its value are kept for schema compatibility. It previously misdescribed the field as bounding the closed-loop revise cycle.

### Evals

- Removed 2 budget-bound eval cases from `evals/evals.json` (64 → 62): `revise-rounds-bounded-by-budget` and `budget-aware-wide-plan-truncation`.
- Reworded budget phrasing in 4 eval cases: `revise-rounds-capped-at-2` (dropped the `budget` tag), `per-item-redispatch-one-per-session` (removed "within budget" and the per-parent-budget expectations), `drafter-schema-and-budget-conformance` (now asserts no numeric ceiling; dropped the `budget` tag), and `review-round-cap-3` (dropped the stray `budget` tag).
- **Loop-bound and subtask-cap eval realignment.** `evals/evals.json` now expresses loop termination qualitatively (a `pass` verdict, stalled progress, engine rejection, or validate failure, with the engine-side `max_traversals` as backstop) rather than a fixed round count, and subtask decomposition as a qualitative granularity criterion with no numeric ceiling. Updated: `revise-rounds-capped-at-2`, `review-round-cap-3`, `drafter-schema-and-budget-conformance`, and `chancellor-round3-best-effort-surfaced`.

## [2.6.0]

### Added

- **Checkpoint and progress discipline for department workers.** All 8 department `execute.md` files now guide workers to call `dispatch_checkpoint(task_id, phase, completed_items, remaining_items)` and `dispatch_progress(task_id, stage, percentage, message)` at phase boundaries during long multi-phase tasks, enabling mid-execution visibility and retry-with-context recovery.
- **`dispatch_budget()` secondary quota check.** `functions/synthesize.md` and `PROMPT.md` now call `dispatch_budget()` before dispatch batches as a token/cost sanity check; `emperor_sessions_used` remains the authoritative session counter for budget enforcement.
- **Stale-task detection via `dispatch_status()` and `dispatch_stream()`.** Beyond the existing 5-minute timeout, `skills/escalate-recovery/SKILL.md` now also probes liveness with `dispatch_status(task_id)` and inspects progress events with `dispatch_stream(task_id)` to distinguish hung tasks from slow-but-alive ones.

### Changed

- **Execution-time destructive discovery now uses `signal("need_approval")` + `dispatch_approve`/`dispatch_reject`.** Previously a department worker detecting a required-but-unauthorized destructive operation would HALT and flag the operation in its execution report; the orchestrator would then re-dispatch a new session to perform it. The new pattern: the worker emits `signal(type="need_approval")`, which suspends its task kernel-natively in `awaiting_approval` state; the orchestrator resolves via `dispatch_approve(task_id)` (resumes the *original* worker session) or `dispatch_reject(task_id, reason)`. Pre-planned destructive operations retain the existing chancellor→user-approval→execute `risk:high` gate (execution-time-only scope; plan-time approval is unchanged). Affected: `PROMPT.md`, `functions/triage.md`, `references/schemas.md`, all 8 department `execute.md` files.
- **Closed-loop revise rounds use `dispatch_retry()` as the primary path.** Previously each failed item was re-dispatched to a fresh `jinyiwei` session. Now `dispatch_retry(task_id, modify_prompt, reset_budget=false)` reopens the failed item's original session with checkpoint context auto-injected, satisfying the Revision Dispatch contract (edit-in-place) natively. Fresh jinyiwei dispatch is retained as documented fallback when the original `task_id` is unavailable. Budget math unchanged (`reset_budget=false` counts against the same parent budget). Affected: `functions/synthesize.md`, `references/schemas.md`, `references/model-pool-and-budget.md`, `PROMPT.md`, `README.md`.
- **Kernel compatibility bumped to rolebox v0.23.2+dev.** Tool-name migration from `task_*` → `dispatch_*` per rolebox commit 18e3f68 confirmed complete — no stale references found across emperor assets. (`README.md`)

### Fixed

- **Priority scheduling NOT adopted.** `DispatchInput.priority` exists in the kernel but the opencode-facing `dispatch` tool schema does not expose a `priority` argument; dependency-root ordering for revised items remains a prompt convention.

### Evals

- Updated 5 eval cases in `evals/evals.json` to signal-and-suspend / dispatch_retry semantics (rolebox v0.23.2+dev alignment):
  - `execution-time-destructive-halt-routes-to-approval` → `execution-time-destructive-signal-suspend` — worker emits `signal("need_approval")`, task suspends in `awaiting_approval`, orchestrator uses `dispatch_approve`/`dispatch_reject` (no re-dispatch of a new session)
  - `per-item-redispatch-one-per-session` — `dispatch_retry(task_id, modify_prompt, reset_budget=false)` per failed item; fresh dispatch retained as fallback only
  - `jinyiwei-revision-edits-in-place` — checkpoint context auto-injected via dispatch_retry; modify_prompt carries only validator note + fix direction
  - `data-scope-halts-unauthorized-destructive-migration` — `signal("need_approval")` suspension instead of terminate-and-report
  - `closed-loop-validate-revise-synthesize` — `dispatch_retry` semantics in scenario output_hint

## [2.4.0] — 2026-07-03

- **Budget caps relaxed to aggressive tier.** Subtask count cap raised from 5 to 10 (recommended ≤8). Per-parent session budget (`maxTotalSessionsPerRequest`) raised from 8 to 20 across emperor, chancellor, and jinyiwei. Concurrency (`maxActivePerParent`) raised from 2 to 3 across all three dispatch parents. This allows emperor to complete larger, more complete tasks without hitting budget walls mid-execution. Updated all worst-case session tables, budget expressions, and verification greps across 14 files.

## [2.2.0]

### Added

- **Read-only research capability on the DIRECT path.** The orchestrator now holds `WebFetch`, `websearch_web_search_exa`, and Context7 doc tools, so external/library questions and investigation can be answered directly without spawning a subagent. Closes the gap where the DIRECT path could only read local files.
- **Pending Approval Protocol (`PROMPT.md`).** The two-turn approval handshake for `risk: high` and destructive strategies is now specified. The orchestrator re-prints the full strategy, recovers it from its own conversation history on the next turn (it is a primary session, so no KV/state is needed), and handles approve / reject (with `dispatch_cancel` of running tasks) / partial approval ("skip subtask 3", which drops dependents of the skipped subtask) / ambiguous replies. A matching `triage` rule classifies a reply to a pending strategy as an approval response, evaluated before the destructive check.
- **Execution-time destructive gate.** The executor/router and all six department workers now HALT and report a required-but-unauthorized destructive operation instead of performing it; the orchestrator routes the flagged operation back through the user-approval gate. Previously the destructive gate only fired at plan time, so a destructive operation the planner did not foresee could execute unapproved.
- **Validator independent cross-check.** The validator may now use its read-only tools to confirm a report's claims against the codebase on disk; when the report and the codebase diverge, the codebase wins and the item is marked revise. Resolves the prior contradiction where the validator held read tools but was instructed to judge from the report text only.
- **Revision Dispatch contract (`references/schemas.md`).** Re-execution of a failed subtask now carries the prior execution report, the validator note, a fix direction, and an explicit revision flag, so the new (isolated) worker edits existing files in place instead of recreating or duplicating them.
- **DIRECT-path escalation.** If the orchestrator discovers mid-answer that a request needs execution or planning, it stops and re-routes rather than emitting a half-answer or self-editing.
- Expanded eval coverage: new-behavior cases (DIRECT escalation, semantic destructive detection, execution-time halt, per-item re-dispatch, DIRECT research, cross-producer schema conformance), validator cross-check, revision idempotency, backend/UI/data/quality department scope, finalizer conformance, chancellor orchestrate failure handling, and two pending-approval multi-turn scenarios.

### Changed

- **Closed-loop re-dispatch is now one failed item per `jinyiwei` session** (previously a single batched call for all failed items). Each failed item is re-dispatched in its own isolated session in dependency-root order, improving fix focus and per-item verification. Budget recomputed accordingly: a revise round now costs `F + 1` sessions (F failed items + one revalidate), so wider plans afford fewer re-dispatches. The worst-case session tables in `references/model-pool-and-budget.md`, the caps in `functions/synthesize.md`, `PROMPT.md`, and the `README.md` closed-loop section were all updated to match.
- **Destructive detection matches by effect, not vocabulary.** `triage.md` and `PROMPT.md` now classify any operation that deletes, overwrites, truncates, drops, force-pushes, resets, or irreversibly mutates state as destructive regardless of the exact verb (catching synonyms like "nuke", "wipe", "purge", "blow away"), backed by an expanded keyword seed list.

### Fixed

- **Chancellor now declares `dispatch.maxTotalSessionsPerRequest: 8`.** The three-stage planning loop's round-3 convergence cap was previously bounded only by prompt instructions; it is now system-enforced at the kernel level, closing a potential runaway-loop path.
- **Removed `single-file edit` from the DIRECT path.** The orchestrator has no Write/Edit/Bash, so DIRECT claiming to handle single-file edits contradicted the no-code-authoring constraint and the `out-of-scope-self-execution-rejection` eval. All file modifications, even one line, now dispatch to the executor/router.
- **`verification-discipline` no longer references tools no worker has.** Its research-task guidance previously told workers to use `websearch`/`webfetch`, which are in no department's permission set; it now points to the read-only tools workers actually hold (Bash `curl`/`gh`, `Read`/`Grep`/`Glob`) and treats dedicated web tools as available only where the role grants them.
- Aligned the data department's "schema changes are destructive" guideline with the new execution-time HALT rule.

## [2.1.0]

### Fixed

- **Closed-loop validation now actually runs.** Validation was an inert `validate` function on the chancellor, but the chancellor auto-activates `plan` (locked), so a validation dispatch never ran the validate logic — the session tried to plan instead. Validation is now handled by a dedicated first-level `emperor--validator` subagent that auto-activates its `validate` function, giving it a clean session where validation is the only active function.
- `validate` now declares the lifecycle fields it was missing (`produces: result`, `continue_until: artifact_exists(result)`, `continue_max: 5`) so its verdict is reliably produced and captured. It also handles missing/unverified/unparseable reports explicitly.
- Corrected stale prose in `references/model-pool-and-budget.md`: the reviewer runs on `tier-1-flagship`; the text previously framed the move as pending while the config already used tier-1-flagship, and contradicted the pool table in the same document.
- Removed the stale "(placeholder)" labels for the data/docs/quality departments in `references/terminology-and-style.md` — all six departments are live.
- Fixed a dangling `escalate-recovery` skill pointer in the jinyiwei `route` function. The recovery pattern is already inlined there; the emperor-level skill targets a `final_answer` fence, which would mislead the router (which returns a `result` fence).
- Added the required `build/tests: N/A` line to the docs execution report and fixed a `<=80` vs `≤80` inconsistency in the quality report.
- Normalized department escalation wording to the canonical "executor/router" term for jinyiwei (previously split between "orchestrator" and "executor/router").
- Removed a vestigial `state_schema_version` from `orchestrate` (the function explicitly disclaims state usage and references no state conditions).

### Added

- Dedicated `emperor--validator` subagent (tier-2-reasoning pool). Keeping validation in the tier-2-reasoning pool means the closed-loop validate step never consumes the tier-1-flagship pool, which simplifies the reviewer budget: worst-case reviewer sessions are now 3 (chancellor convergence loop only).
- Failure handling in the chancellor `orchestrate` loop for drafter/reviewer/finalizer dispatch failures (one retry, then graceful degradation).
- Stale/hung dispatch handling (cancel + one retry) in the jinyiwei `route` function.
- A dependency-context-passing rule in the orchestrator (`PROMPT.md`): dependent subtasks are dispatched with their prerequisites' execution reports embedded.
- Evals for the new validator, department scope discipline (test, docs), a regression case pinning the validation dispatch target to `emperor--validator`, and a full plan-execute-validate-synthesize scenario.

### Changed

- Documented the `result` fence as the universal dispatch-return envelope in `references/schemas.md`; the payload schema is determined by the producer (Strategy, Validate Result, or Execution Report).

## [2.0.0]

- Initial de-themed orchestrator release: functional terminology, English-only prompts, three independent model pools, budget-aware scheduling, six live departments, and the closed-loop validation design.
