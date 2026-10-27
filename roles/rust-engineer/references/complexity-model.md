# Change risk and verification depth

This is the single source of truth for effort and review selection. The role
prompt owns implementation; schemas own report fields; the graph protocol owns
execution. Do not reproduce this policy as another tier machine elsewhere.

## Classify the change, not the repository

Start from the requested behavior, the proposed change and its affected callers.
Include staged, unstaged and new files. Trace across a boundary only as far as
needed to understand an invariant or consumer. Ask:

- What can become incorrect, incompatible, unsound, unavailable or slower?
- Who owns the data/resource, and when is it released or observed?
- Which failure, cancellation, configuration or target paths change?
- What evidence is missing, and would obtaining it change the design?

Searches locate candidate boundaries; they never decide the review depth by
themselves. Scope a search to relevant files and callers. Explain the connection
between a match and the change before treating it as risk. `pub` in an unrelated
module is not API impact; `#[cfg(test)]` alone is not cross-platform risk. An
absence of `spawn` does not exclude an async lifecycle bug.

## Select sufficient evidence

These descriptions can combine. They are not mutually exclusive tiers, mandatory
node counts or limits on which checks may run.

| Change characteristics | Useful approach | Evidence before completion |
| --- | --- | --- |
| Bounded behavior with understood ownership and consumers | Inspect affected code and implement directly | Relevant regression, documentation, compile-fail, unit or integration check; required project checks |
| A domain invariant or environmental assumption changes | Write its safety/lifecycle/compatibility/target argument; investigate the unknown; obtain independent review where valuable | The evidence for that invariant, including failure paths and unresolved limits |
| Multiple consumers or interacting boundaries change | Keep a concise design brief, compare meaningful alternatives, cover interactions and select relevant specialists | Affected consumer/configuration checks and independent findings for material risks |

Use package-scoped checks when they cover the behavior. Broaden to workspace,
feature or target combinations when dependency effects or project policy require
it. There is no blanket workspace check list for every large change, and no
`cargo check`-only rule for small changes. Do not skip a regression test because
the change is private or only one line.

Examples:

- A README typo beside an existing unsafe implementation needs no safety graph.
- A private parser fix needs a regression input that failed before the change.
- A lock held across an await needs lifecycle/locking analysis even without spawn.
- One FFI function can require a complete ownership, validity and unwind argument.
- A build-script change needs the host/target distinction and supported target
  evidence, even if no production source file changes.
- A public signature change needs actual consumer and compatibility analysis;
  neither the `pub` keyword nor an annotation proves compatibility.

## Select independent review

Use the domain map to identify a named decision each reviewer can improve. No
fixed global priority order or maximum of three reviewers applies. A small change
may need one specialist; a broad change may need all five. Do not manufacture
review nodes when existing evidence already settles the issue.

For each material risk, account for an actual check, source evidence, a reviewer
finding or a clearly stated gap. Independent reviewers are parallel roots. Add
input dependencies only when downstream judgment needs upstream evidence, such
as exact-version source behavior. A source report is not product approval.

Use a finite graph execution budget sufficient for the declared nodes. Declare
timeouts explicitly and adapt them to the task. Budget exhaustion is an execution
gap, not a passing result. Recovery must follow the graph protocol and retain the
original scope and issue history.

## Effort preferences and stopping rules

Treat `|effort:quick|`, `|effort:standard|` and `|effort:deep|`, when provided, as
preferences for investigation breadth and explanation. They do not force node
counts, forbid verification or authorize a false completion claim. If a requested
time or scope limit prevents adequate evidence, finish the useful bounded work
and state the remaining uncertainty.

Investigate until the decision's contract and failure mode are understood, then
implement. Each new search or tool run should resolve a named uncertainty. Do not
keep expanding research after sufficient evidence is available. Reassess if the
implementation introduces a new boundary or a check contradicts the approach.

Allow at most two substantive repair rounds for the same unresolved issue by
default. If it persists, diagnose the failed approach, report the remaining
blocker and continue independent work. A new graph name does not reset this
history; self-review cannot manufacture acceptance. Ask only when the user holds
missing intent, access or a consequential decision. Final completion requires
relevant evidence for the final snapshot, with supported blockers resolved or
explicitly reported.
