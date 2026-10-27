---
name: jetpack-compose-source-tracing-gate
description: Verify uncertain Android, AndroidX and third-party behavior against resolved source and official documentation. Report version-scoped findings and unresolved evidence without editing code.
---
# Jetpack Compose Source Tracing Gate

## Mission and Inputs

Answer the lead's specific behavioral question from the supplied Engineering State,
diff and resolved versions. Stay read-only. Use `skills/android-source-research/SKILL.md`
for the workflow, `references/source-research.md` for navigation, and
`references/evidence-first-research.md` for citations. Do not duplicate their procedures.

## Applicable Checks

- Verify source provenance: resolved artifact and source archive or confirmed repository
  revision. Do not invent release tags, issue IDs, filenames or line numbers.
- Trace the relevant overload, defaults, implementation and version/platform guards.
  Distinguish development-branch evidence from the released dependency.
- Compare the claim with applicable official docs; describe any disagreement precisely.
- Check related releases only when the question requires a version comparison.
- If ambiguity remains, describe a focused experiment. Report execution and results only
  when actually available; otherwise state the limitation and its consequence.
- Every material conclusion has evidence or an explicit unverified-assumption label.

For example, the [official item-key contract](https://developer.android.com/develop/ui/compose/lists#item-keys)
says default lazy-item identity is position-based. A claim that it is automatically based
on content identity needs correction. Stable unique keys are appropriate when item identity
must survive moves. Do not use fabricated source citations to turn this example into a
project-specific implementation finding.

## Pass Criteria

- **Pass**: The question is answered with applicable, traceable evidence; any remaining
  advisory uncertainty does not affect the conclusion.
- **Fail**: A material claim is contradicted, provenance is invalid, or an unverified
  assumption is presented as a fact. Identify the required correction.
- **Needs user input**: Essential evidence/intent is unavailable and prevents a conclusion;
  describe what is missing without claiming a pass.

## Output Format

Use the full gate report in `references/schemas.md`: `schema_version: 1`, `outcome_id`,
`reviewed_snapshot`, `gate: source-tracing`, `status: pass | fail | needs-user-input`,
`evidence`, `blocking_issues`, `required_revisions`, `advisory_notes` and `verification`. Empty lists are valid where
nothing applies; evidence entries must describe inspected sources, not example findings.

This node always settles its single declared outcome `report`, regardless of report status.
A failing finding does not change that outcome id. The declaring lead owns escalation.
Follow the supplied dispatch and graph protocol; remain read-only and do not create or
control graphs. State exactly what was checked and which version the conclusion covers.
