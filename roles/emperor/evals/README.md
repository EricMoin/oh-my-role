# Evaluation and decision review

These are behavioral specifications, not recorded model results:
58 cases in 8 target groups and 6 multi-turn scenarios. They cover scope,
authorization, independent validation, repairs, explicit outcomes and current Graph v3
ownership boundaries.

## Automated evidence

`scripts/tests/emperor-rolebox.test.ts` uses the sibling rolebox loader/resolver,
strict v3 compiler, host-bound tools and real SQLite acceptance store with scripted
dispatch. It checks these contracts:

- Every department resolves with its local skills and executable tools.
- All topology templates compile; old grammar and retry fields are rejected.
- Accepted done routes once and carries pinned declared inputs; replay is idempotent.
- Non-success outcomes do not release done-only consumers.
- Approval preparation is context, while host control approval requires its authorized
  session and does not submit a result.
- Workers cannot declare, query or control graphs.
- Execution-budget rejection does not commit an accepted result or successor.
- Function continuation requires an accepted response, not signals, fences or calls.

Python mutation tests detect tree, permission, activation, completion-gate and
shared-copy drift. These checks make no model calls. They do not prove every model
follows the protocol, certify live sandbox integration or measure performance.

The topology templates do not install schemas or trusted command validators for
business reports. Consumer preconditions and independent Validator checks remain
necessary. A structurally accepted done payload can still contain an invalid claim;
do not describe role instructions as an engine-enforced business schema.

## Behavioral comparison (not run)

Use identical disposable fixtures, host/model configuration and budgets for baseline
and candidate runs. Confirm the intended role and assets loaded for each target.
Start with state-unreadable, uncertain-impact-reruns, one-validation-per-batch,
sandbox-difference-does-not-force-rerun and flaky-check-bounded-repetition. Preserve
prompts, graph/run/attempt IDs, accepted data, workspace diffs and check outputs;
never retain worker credentials.

Measure independently verified completion, scope violations, duplicate effects,
stale evidence reuse, carried-item correctness, repair count, validate-round count,
dispatch count, wall time and tokens. Pair and repeat runs to separate model variance
from actual improvements. Quality regressions disqualify latency savings. Distinguish
deterministic tests from live model evidence.
