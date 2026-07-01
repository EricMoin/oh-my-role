# Changelog

All notable changes to the Emperor role. Versioning follows semantic versioning; releases are tracked via git tags.

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
- Corrected stale prose in `references/model-pool-and-budget.md`: the reviewer runs on `opus-4.6`; the text previously framed the move as pending while the config already used opus, and contradicted the pool table in the same document.
- Removed the stale "(placeholder)" labels for the data/docs/quality departments in `references/terminology-and-style.md` — all six departments are live.
- Fixed a dangling `escalate-recovery` skill pointer in the jinyiwei `route` function. The recovery pattern is already inlined there; the emperor-level skill targets a `final_answer` fence, which would mislead the router (which returns a `result` fence).
- Added the required `build/tests: N/A` line to the docs execution report and fixed a `<=80` vs `≤80` inconsistency in the quality report.
- Normalized department escalation wording to the canonical "executor/router" term for jinyiwei (previously split between "orchestrator" and "executor/router").
- Removed a vestigial `state_schema_version` from `orchestrate` (the function explicitly disclaims state usage and references no state conditions).

### Added

- Dedicated `emperor--validator` subagent (deepseek-v4-pro-max pool). Keeping validation in the pro-max pool means the closed-loop validate step never consumes the opus pool, which simplifies the reviewer budget: worst-case reviewer sessions are now 3 (chancellor convergence loop only).
- Failure handling in the chancellor `orchestrate` loop for drafter/reviewer/finalizer dispatch failures (one retry, then graceful degradation).
- Stale/hung dispatch handling (cancel + one retry) in the jinyiwei `route` function.
- A dependency-context-passing rule in the orchestrator (`PROMPT.md`): dependent subtasks are dispatched with their prerequisites' execution reports embedded.
- Evals for the new validator, department scope discipline (test, docs), a regression case pinning the validation dispatch target to `emperor--validator`, and a full plan-execute-validate-synthesize scenario.

### Changed

- Documented the `result` fence as the universal dispatch-return envelope in `references/schemas.md`; the payload schema is determined by the producer (Strategy, Validate Result, or Execution Report).

## [2.0.0]

- Initial de-themed orchestrator release: functional terminology, English-only prompts, three independent model pools, budget-aware scheduling, six live departments, and the closed-loop validation design.
