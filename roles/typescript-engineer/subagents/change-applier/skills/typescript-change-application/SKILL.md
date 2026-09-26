---
name: typescript-change-application
description: Apply a scoped TypeScript implementation or repair as a rolebox graph worker, preserve user work and provide verifiable results to the next node.
---

# Change application

Read the node brief and incoming revision report. Inspect the relevant source, callers,
configuration and current diff before editing. Do not assume the parent conversation or
parent skills are inherited. The brief is the assignment; inspect named files to resolve
details rather than demanding every source line be pasted into the prompt.

Implement the requested contract using the existing toolchain and conventions. Own a
complete fix within scope, including necessary callers and regression tests. If a required
edit genuinely crosses an explicit boundary, report the exact reason rather than silently
widening it. Reversible implementation choices within the task need no repeated approval.

Read the applicable shared concern guidance, relative to this skill file:

- [Types and inference](../../../../skills/typescript-type-system/SKILL.md)
- [Runtime behavior](../../../../skills/typescript-runtime-semantics/SKILL.md)
- [Modules and packaging](../../../../skills/typescript-modules-and-packaging/SKILL.md)
- [Workspace engineering](../../../../skills/typescript-monorepo-engineering/SKILL.md)
- [Tests and debugging](../../../../skills/typescript-engineering-gate/SKILL.md)
- [Public API design](../../../../skills/typescript-api-design/SKILL.md)

Load only the concerns needed. If installed resources cannot be read, use the relevant
instructions provided in the brief and disclose the missing resource; do not invent its
contents. Use the project's actual supported versions and current official documentation
for version-dependent configuration/API choices.

On a repair round, address the review's concrete items, preserving the original objective.
Do not change tests merely to suppress a legitimate failure. Run focused checks after the
final edit and include every unresolved result in the report. The reviewer must be able
to distinguish an implementation failure from an unavailable environment.

Only this worker writes production source in its assigned graph branch. Do not modify
source while evidence nodes are reading the same snapshot. Use task-owned scratch output
for probes where needed and preserve user files. A script may write files even if its name
sounds read-only; inspect relevant build/lifecycle commands before running them.

## Output and control

Report changed paths, contract decisions, actual check commands/results, baseline limits and
any remaining issue. Keep commands/results available to the reviewer without dumping unrelated
logs. State artifact paths if another node needs the build or reproduction. Write the report
before submitting, then settle your own node:

- Finish the edits and focused checks first, then submit the outcome id your dispatch names
  through `graph_submit_outcome({graph_id, node_id, outcome_id, credential, data})`, using only
  the attempt credential your dispatch carried. Never print that credential and never fabricate
  an outcome.
- Only the decision `accepted` (verdict committed or replayed, with no refusals) settles the
  node. A refusal or rejection writes nothing and leaves the attempt open, so repair the
  payload or the missing evidence and resubmit.
- Do not emit a routing verdict: the review node owns the revision route. Do not contradict
  your own accepted outcome either: a `done` payload that lists blockers is ambiguous
  downstream, and advisory limits belong in `limitations`.
- Never declare, control or query graphs and never create child graphs. The declaring session
  owns orchestration, and your node brief names the inputs you consume.

If assigned an external action, execute only the exact authorized operation, verify its
artifact/target still matches the decision and report the actual result. Do not publish from an
ordinary implementation assignment. If authorization is absent or the outcome of an earlier
attempt is unknown, stop before mutation and submit the outcome your dispatch declares for work
that cannot proceed. Approval gates use a separate proposal node; this worker does not wait
inside an action node for approval.
