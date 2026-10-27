# Role Creator accepted reports

These are application-level outcome data contracts checked by consumers; merely declaring an outcome
does not install a runtime schema validator. The tool's `outcome_id` is the
routing authority. Keep it consistent with the report where present.

## Authoring report

For `generated`, name the authorized role directory and every file written.
For `blocked` or `failed`, keep the same shape, list completed files and add a
`summary` explaining what remains.

```json
{
  "schema_version": 1,
  "report": "authoring-report",
  "role_directory": "roles/example-role",
  "files_written": ["roles/example-role/role.yaml", "roles/example-role/PROMPT.md"]
}
```

## Gate report

`outcome_id` is `pass`, `revise`, `blocked` or `failed`. `tier1` and `tier2` are
`PASS`, `FAIL` or `SKIPPED`. Each blocking issue and required revision must be a
concrete string naming the affected artifact, observed defect and required fix.
`pass` requires both mandatory tiers to pass with no blocking issue or required
revision. Optional tiers can be recorded separately, including skip reasons.

```json
{
  "schema_version": 1,
  "report": "gate-report",
  "outcome_id": "revise",
  "tier1": "PASS",
  "tier2": "FAIL",
  "blocking_issues": ["role.yaml references a missing file"],
  "required_revisions": ["add the missing reference"]
}
```

The Generator's triggered revise input carries this exact accepted report. It
must read `required_revisions` before changing files. A malformed or incomplete
report leads to `blocked` with the missing fields; do not guess the repair.

## Grading report

`outcome_id` is `graded`, `blocked` or `failed`. For `graded`, each supplied case
has `case_id`, boolean `passed` and numeric `score` from 0 to 10. Add evidence and
expectation details where needed. `pass_threshold` is the fraction of cases
required to pass; the default case threshold is 7/10 and aggregate threshold is
0.6. A `graded` outcome means scoring completed, not that the role passed.

```json
{
  "schema_version": 1,
  "report": "grading-report",
  "outcome_id": "graded",
  "cases": [{ "case_id": "case-1", "passed": true, "score": 8 }],
  "pass_threshold": 0.6
}
```

When cases or transcripts are unavailable, submit `blocked`, an empty `cases`
array and a `summary` naming the missing input. A passing gate report alone is
not a behavioral transcript. Consumers select the intended producing attempt
and validate prerequisites before using these fields.
