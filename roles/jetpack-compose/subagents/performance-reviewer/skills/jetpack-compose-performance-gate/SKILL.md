---
name: jetpack-compose-performance-gate
description: Review measured or credible Compose performance regressions in composition, lazy layouts, startup, images and lifecycle resource use. Validate claims with scoped evidence and avoid mandatory speculative optimizations.
---
# Jetpack Compose Performance Gate

## Mission and Inputs

Review the changed path using the Engineering State, diff and available traces, compiler
reports or benchmarks. Stay read-only. Use `skills/compose-performance/SKILL.md` for
technical guidance and `references/compose-performance-and-platform.md` for evidence
criteria. Read state/platform skills only when those contracts are implicated.

## Applicable Checks

- Identify the actual performance hypothesis and acceptance target before demanding tools.
- Inspect the affected state reads and work. A parent re-execution does not prove its
  entire subtree executes or that frame cost is unacceptable.
- Interpret reports under the project's compiler settings, including strong skipping.
  Do not require every callback to be manually remembered, every state class annotated,
  or every composable to be restartable/skippable. Check annotation contracts for truth.
- For changing lazy data, examine unique stable keys and state identity. Use content types
  for compatible reuse, not as a promise of zero measurement. Respect adaptive item sizes.
- Trace blocking work, image decode size, listener/resource ownership and lifecycle scope
  when relevant. Arbitrary startup delays are not a performance fix.
- Check benchmark/profile setup and packaging when the change or acceptance depends on it.
  Absence of a new benchmark or Baseline Profile module is not automatically a blocker.
- Validate material performance claims using comparable observed metrics and artifacts;
  record build, device, journey and compilation conditions. Missing essential evidence
  cannot be replaced by intuition or a successful build.

## Pass Criteria

- **Pass**: Applicable checks reveal no blocker; material claims have sufficient evidence.
- **Fail**: A concrete regression, incorrect performance contract or unsupported acceptance
  claim requires correction. Explain the affected path and smallest required revision.
- **Pass with advisory notes**: Possible optimizations exist without a blocking defect.
- **Needs user input**: Essential evidence or intent is unavailable; state the limitation.

## Output Format

Use the full gate report in `references/schemas.md`: `schema_version: 1`, `outcome_id`,
`reviewed_snapshot`, `gate: performance`, `status: pass | fail | needs-user-input`,
`evidence`, `blocking_issues`, `required_revisions`, `advisory_notes` and `verification`. Cite actual file locations,
reports and measurement artifacts; do not populate the report with invented benchmark data.

Settle the declared outcome separately: a clean pass or pass with advisory notes settles
`pass`; a fail with concrete blockers settles `revise`; unavailable essential evidence or
intent settles `escalate`. Follow the supplied dispatch and graph protocol, stay read-only,
and do not create or control graphs. Report what was checked and what remains unmeasured.
