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

Report changed paths, contract decisions, actual check commands/results, baseline limits
and any remaining issue. Keep commands/results available to the reviewer without dumping
unrelated logs. State artifact paths if another node needs the build or reproduction.

- Emit `signal({type: "answer", payload: {summary, changed_files, checks, limitations}})`
  when the assigned implementation is ready for review. Do not declare independent review
  passed. Fix local failures you can resolve before handing off.
- Emit `signal({type: "escalate", payload: {reason, evidence, required_next_step}})` when
  the implementation cannot be completed within scope or required resources are missing.
- Do not emit revise_needed; the reviewer owns that back-edge. Do not use top-level
  `items`/`findings` in a successful answer payload to carry completed work.

If assigned an external action, execute only the exact authorized operation, verify its
artifact/target still matches the decision and report the actual result. Do not publish
from an ordinary implementation assignment. If authorization is absent or the outcome of
an earlier attempt is unknown, stop before mutation and escalate. Approval gates use a
separate proposal node; this worker does not wait inside an action node for approval.
