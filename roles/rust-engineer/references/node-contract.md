# Specialist node contract

Every node prompt identifies the following facts. Keep it concise and task-specific;
unknown facts remain explicit rather than being guessed.

- Role and duty: an implementation expert implements/repairs; a dedicated reviewer
  reviews or gathers evidence; source-tracer investigates; verification also synthesizes.
  Modes select work within that role's duty and never change its authority.
- Goal, expected behavior, compatibility constraints and existing user authorization.
- Workspace, affected source/callers, write or read-only scope and allowed scratch outputs.
- Snapshot including dirty and new files; baseline observations when available. HEAD alone
  does not identify an uncommitted implementation.
- Ownership/lifecycle invariants, actual dependency versions, targets and features as needed.
- The assigned role's readable skills and required checks or criteria for deriving them.
- Declared upstream inputs, prior issue ids and repair context where applicable.

## Separate implementation from review

| Role class | Duty and writes | Outcome / report |
| --- | --- | --- |
| Domain implementation expert | Implement/repair only inside assigned source/test/config scope | done, failed, blocked or clarification_required / Implementation report |
| Dedicated domain reviewer | Review or gather evidence; source and git state stay read-only | pass, revise or escalate / Gate report; report / Domain evidence |
| Verification | Independent general review or synthesis; source and git state stay read-only | pass, revise or escalate for acceptance; report for investigation synthesis |
| Source tracer | Exact-version investigation; source and git state stay read-only | report / Source evidence |

Implementation and review must use distinct node IDs, distinct agent roles and separate
sessions. Never convert a writing node/session into a reviewer, give a reviewer a repair
step, or substitute an implementation expert as an independent evidence producer. An
implementer's self-checks belong in its Implementation report and never approve the change.
An out-of-role assignment is invalid even if its prompt asks for another mode.

A review brief supplies requirements, invariants, actual source/diff, snapshot and check
artifacts. It does not inherit the implementation conversation or require agreement with
the author's design rationale. Implementation reports are inspectable claims, not verdicts.
Reviewers establish expectations independently and report findings for implementers to fix.

The parent assigns exclusive write scopes, sequences dependent writers and freezes source
for review. Source-read-only roles disable Write/Edit and prohibit source changes through
Bash. Assigned scratch/check outputs are permitted. Tool policy is not filesystem isolation;
the host supplies actual enforcement. No node-mode label grants implementation authority.

Serial implementation reports identify intermediate snapshots. The final reviewer checks
that scoped contracts/evidence still hold after later stages. Intermediate snapshots need
not equal the integrated snapshot; final acceptance must cover integrated source, with
invalidated checks rerun.

## Skill loading

Implementation entry skills link to domain implementation guidance; dedicated reviewers
own gate skills. Read the assigned role's relevant instructions before acting and record
actual reads in loaded_skills. Verification reads rust-testing. Reading a skill does not
grant another role's duty. Missing required guidance remains a gap to resolve rather than
permission to claim it was read. Catalog visibility is not skill loading.

## Repairs and checks

Only implementation nodes consume the accepted revise feedback to change source. Retain
stable issue ids and report resolved/unresolved items. In serial stages, carry the full
accepted feedback in revision_context with source-attempt provenance and current owners.
The reviewer stays in its review role on every loop traversal and inspects the new snapshot.

Derive checks from repository policy and affected failure modes. Preserve user changes.
Review/evidence commands preserve lockfiles and source; use locked Cargo resolution where
applicable and isolate shared build outputs. Required missing evidence cannot become pass,
while optional unavailable tools do not automatically block a narrower supported claim.
Distinguish actual results, proposed checks and inference.
