# Rust Engineer design

## Responsibility boundaries

The lead owns production edits, integration and the final claim of completion.
Five read-only specialists review named risks on a stable snapshot. An optional
source tracer supplies version-matched evidence to the lead or a consuming gate.

| Asset | Responsibility |
| --- | --- |
| `PROMPT.md` | Engineering judgment, ownership, verification and user communication |
| `functions/engineer.md` | Short reminder that preserves those responsibilities across messages |
| `functions/research.md` | Question-driven evidence lookup and version applicability |
| `references/complexity-model.md` | Single effort, review-selection and stopping policy |
| `references/rust-domains.md` | Domain questions and skill/reviewer routing |
| `references/schemas.md` | Brief, gate report and source-evidence contracts |
| `references/graph-protocol.md` | Executable declarations, accepted results, snapshots and recovery |
| `skills/adaptive-rust-engineering` | Applying effort and evidence decisions to a task |
| Six domain implementation skills | How to implement and verify Rust behavior |
| Five reviewer skills | Independent domain judgment and supported findings |
| `subagents/source-tracer` | Bounded evidence investigation, never product approval |

Keep implementation guidance out of graph mechanics and report definitions out
of individual checklists. Load domain skills on demand. Shared contracts live in
references so new skills do not expand the always-active engineer function.

## Graph architecture

Independent risks remain independent review roots. A single gate is valid and
all five can be selected when justified. The evidence example demonstrates two
source reports joining an async gate through explicit inputs and outcome edges;
it is optional and adapts to other consumers. Do not manufacture dependencies.

Workers submit their own outcomes. `pass`, `revise` and `escalate` terminate a
gate; `report` terminates evidence collection with `complete` or `partial` data.
Neither graph completion nor a source report approves the implementation. The
lead checks content and applicability before repairing or accepting the result.

The runtime enforces declared outcome identity and dependency delivery. Report
schemas and read-only scope remain role contracts, not automatic JSON validation
or filesystem isolation. Host permissions provide actual enforcement.

## Version 4 changes

Version 4 replaces keyword-count tiers and fixed review caps with analysis of the
actual change and consumers. Effort prefixes remain preferences. Small fixes may
need tests, documentation may need rustdoc, and missing evidence remains explicit.
Six implementation skills complement the five existing gates. A source-evidence
role and contract support real dependencies without serializing ordinary review.

Gate identities and the existing schema version 1 status/outcome mapping remain
compatible. The source report is a new contract. The old weighted eval rubric is
replaced by explicit manual/session scenarios; it was not a supported native
benchmark suite. A repository upgrade does not itself install or publish the role.

## Verification boundaries

`tests/graph-contract.test.js` uses the real rolebox loader, resolver, compiler and
runtime. It reads the shipped declarations, resolves all children and skills,
tests each gate independently, and exercises report fan-in, partial evidence,
outcome refusal and completed runs with non-passing reports. Dispatch decisions
are stubbed: these tests do not measure model judgment or validate report content.

`evals/README.md` describes behavioral scenarios and their observation limits.
Use isolated task fixtures and inspect actual artifacts/checks when probing
implementation behavior. Do not turn static validation or one successful session
into a benchmark score or a claim about deployment.
