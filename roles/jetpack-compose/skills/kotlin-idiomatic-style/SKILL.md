---
name: kotlin-idiomatic-style
description: Review plain Kotlin API shape, nullability, data modeling, collections, and coroutine correctness. Use for ViewModels, repositories, domain code, and tests; load focused examples only as needed and route Compose behavior to its own skills.
---
# Kotlin Idiomatic Style

Improve the code's contracts and readability without turning a scoped change into a
language migration. Follow the repository's formatter, lint rules, language version,
and public API compatibility requirements. The compact entry routes to detailed guidance;
load the relevant sections rather than treating a short checklist as the entire language
reference. Keep useful alternatives and boundary conditions when adapting an example.

## Load only the relevant reference

| Concern | Reference or skill |
| --- | --- |
| Nullability contracts, sealed outcomes, aliasing, aggregates and sorting | [Language decisions](references/language-decisions.md) |
| Initialization, objects, collection operators, control flow and strings | [Language patterns](references/language-patterns.md) |
| Callback APIs, extensions, variance/reified, contracts, DSLs and Java interop | [API, types and DSL decisions](references/api-types-and-dsl.md) |
| Cancellation, exception boundaries, dispatchers, Flow | [Coroutine decisions](references/coroutine-decisions.md) |
| Composable naming, modifier parameters, slots | `compose-idiomatic-style` |
| Android UI ownership, ViewModels, navigation | `compose-ui-architecture` |
| Compose state, effects, lifecycle collection | `compose-runtime-state` |
| Stability and recomposition claims | `compose-performance` |

## Review contract

- Preserve behavior before shortening syntax. A guard clause, `if`, `for`, or named
  local is often clearer than a chain of scope functions or collection operators.
- Express optional values with nullable types; validate argument and state invariants
  explicitly. Do not replace a failure with a silent fallback just to remove `!!`.
- Prefer `val` and narrow visibility. A read-only `List` and a `val` reference do not
  guarantee immutable contents; decide whether callers need a live view or a snapshot.
- Use data classes for value semantics and sealed hierarchies for distinct outcomes.
  Nullable absence, enums, exceptions, and named factories remain valid tools.
- Make callback and generic constraints visible. Keep public types explicit when they
  define a contract; use local inference where it improves readability.
- Choose collection operators for intent. Check empty input, duplicate keys, ordering,
  mutation aliases, and short-circuiting behavior; do not promise faster sequences or
  allocation-free value classes without measurement.
- Tie concurrent work to an explicit owner, propagate cancellation, and handle only
  failures the layer can recover from. `suspend` does not automatically move work to
  a background thread or make blocking operations nonblocking.
- Keep style preferences separate from bugs. Do not label `let` with side effects,
  `also` with mutation, named factories, JUnit assertions, or valid explicit loops as
  inherently incorrect.

## Verification and evidence

1. Identify the compiler, coroutine dependency, and lint versions in the target project.
2. Compile the affected source and run existing focused checks. For illustrative code,
   state missing context instead of presenting placeholders as runnable examples.
3. Before introducing a version-sensitive API or opt-in, use Context7 to resolve the
   library and retrieve the relevant current documentation; check the project's version.
4. Link the exact official API or convention supporting a disputed claim. Escalate
   Android framework implementation questions through `android-source-research`.

Sources: [Kotlin conventions](https://kotlinlang.org/docs/coding-conventions.html),
[collection types](https://kotlinlang.org/docs/collections-overview.html), and
[coroutine guide](https://kotlinlang.org/docs/coroutines-guide.html).
