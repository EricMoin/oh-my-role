# Specialist node contract

Every node prompt identifies the following facts. Keep it concise and task-specific;
unknown facts remain explicit rather than being guessed.

- Mode: implement, review or evidence; source-tracer uses investigation and verification
  also supports synthesis. Bind the mode to the outcomes declared for this node.
- Goal, expected behavior, compatibility constraints and existing user authorization.
- Workspace, affected source/callers, write or read-only scope and allowed scratch outputs.
- Snapshot including dirty and new files; baseline observations when available. HEAD alone
  does not identify an uncommitted implementation.
- Ownership/lifecycle invariants, actual dependency versions, targets and features as needed.
- Relevant implementation/review skill paths and required checks or criteria for deriving them.
- Declared upstream inputs, prior issue ids and repair context where applicable.

## Modes and ownership

| Mode | Writes | Outcome / report |
| --- | --- | --- |
| implement | Only assigned source/test/config scope and permitted check outputs | done, failed, blocked or clarification_required / Implementation report |
| review | Source, tests, manifests, lockfiles and git state stay read-only | pass, revise or escalate / Gate report |
| evidence / investigation | Source stays read-only; assigned scratch probes and check artifacts permitted | report / Domain evidence or Source evidence report |
| synthesis | Inspect all declared evidence and the actual final source without editing | pass, revise or escalate for implementation acceptance; report for an investigation |

Domain experts have write tools so implementation nodes can work. Their review/evidence
modes are operating contracts, not a graph-enforced sandbox. The parent must assign
exclusive write scopes, sequence dependent writers and freeze the snapshot for review.
The verification and source-tracer roles are always source-read-only.

Serial implementation reports identify intermediate snapshots. The final reviewer
checks that their scoped contracts and evidence still hold after later stages;
intermediate snapshots need not equal the integrated snapshot. Final acceptance
must cover the integrated source, and invalidated checks must be rerun.

## Skill loading

The specialist's entry skill links to shared implementation guidance and its own review
criteria. Read the implementation skill before changing that domain; read gate criteria
before reviewing it. In evidence mode, load whichever guidance is needed to answer the
assigned question. Read only applicable sections, and record the actual guidance used
in the report's `loaded_skills`. A missing required resource is a gap to resolve, never
permission to claim that the guidance was read. Catalog visibility is not skill loading.

## Repairs and checks

Consume the exact accepted revision input before repairing. Retain stable issue ids and
report resolved and unresolved items. In serial specialist stages, the first stage carries
the full accepted review feedback forward in `revision_context`, with its source attempt
and each issue's current state, so later owners can address their items without guessing.
Do not edit unrelated stages solely because the loop revisits them.

Derive checks from repository policy and affected failure modes. Preserve existing user
changes. Review/evidence commands must preserve lockfiles and source; use locked Cargo
resolution where applicable and isolate shared build outputs. Required missing evidence
cannot become a pass, while optional unavailable tools do not automatically block a
narrower supported claim. Distinguish observed results, proposed checks and inference.
