# Compose Architecture Review Map

Implementation guidance has one owner:
[compose-ui-architecture](../skills/compose-ui-architecture/SKILL.md).
Read [compose-runtime-state](../skills/compose-runtime-state/SKILL.md) only for state/effect
lifetime, restoration or stability questions, and
[compose-interop-migration](../skills/compose-interop-migration/SKILL.md) for View boundaries.

For a concrete implementation or ownership decision, follow the skill's
[screen-state patterns](../skills/compose-ui-architecture/references/screen-state-patterns.md)
and [UI coordination cases](../skills/compose-ui-architecture/references/ui-coordination.md).

Review the affected contract rather than checking a preferred pattern name:

| Question | Evidence to inspect |
| --- | --- |
| Who owns each state and action, and for how long? | Callers, state holders, DI/navigation owners |
| Can a result be missed or replayed after leaving/returning? | State/event delivery, acknowledgement and cancellation |
| Can an older request overwrite newer input? | Latest-request policy and failure paths |
| What survives recreation? | SavedStateHandle, saved UI input and repository reconstruction |
| Does a layer own useful behavior? | Production consumers and responsibility, not test convenience |
| Do shared peers arbitrate correctly? | Participant identity, ordering, eligibility and cleanup |
| Are navigation and module boundaries coherent? | Back/deep links, arguments, dependency direction |

A shared ViewModel, ViewModel initialization or a larger state class can be legitimate.
File/field counts and a universal one-ViewModel-per-screen rule are not acceptance criteria.
Report concrete violations and observable consequences using the gate schema; do not copy
implementation tutorials or restate the graph protocol here.
