# Inference diagnostics and contract probes

Read when a reusable generic accepts invalid combinations, loses literal information or
produces an unexpectedly broad result. Start at a concrete failing caller. Do not replace
an ordinary function with a generic framework merely because these techniques exist.

## Find the point where information is lost

Inspect the input expression, the variable holding it, the generic constraint and the
return annotation separately. A literal may already have widened before it reaches the
function. A helper constrained to a broad record can also discard the relationship a
caller expects. Try a local reproduction with the same compiler options before changing
an exported signature.

| Observation | Experiment | Decision |
|---|---|---|
| Literal input becomes string | Compare inline literal, stored variable and annotated variable | Preserve precision at the intended boundary; do not const-assert every value |
| Second argument widens the first argument's inferred union | Remove the second inference source in a scratch signature | Use NoInfer on a checking-only position when the supported compiler provides it |
| Key and payload each type-check but the pair is invalid | Pass union-valued variables and a deliberately mismatched pair | Represent the relationship as a union of complete alternatives |
| Object keys disappear behind an annotation | Compare annotation and satisfies under the actual contextual type | Keep the form that checks shape and preserves the caller-facing information needed |
| Callback accepts a case it cannot handle | Check parameter direction and property/method syntax | Correct the callback contract rather than asserting compatibility |
| Recursive utility overwhelms diagnostics/check time | Replace one derived layer with a named boundary type and measure | Keep the useful guarantee; simplify expansion or bound the supported input |

NoInfer controls where candidates come from; it does not recover literals lost before the
call or validate values. If the compiler floor lacks it, consider separating construction
from later checking rather than copying an undocumented substitute or upgrading silently.

A correlated union keeps a choice and its associated data in one value. A generic indexed
access can be fine for literal callers yet too permissive once the key is explicitly a
union. Test the callers the public API actually allows, including explicit type arguments.

## Write a small contract specimen

The companion [inference contract fixture](inference-contracts.ts) contains independently
written examples for a command queue, an inference-source constraint and optional patch
semantics. It is compile-only and includes deliberately invalid calls. Do not run it or
copy its declarations into production as implementations.

For a real API, select probes that would reveal its likely regression:

- A supported value/call compiles without a cast or a manually supplied type argument.
- The inferred result remains useful; a deliberately incompatible result assignment fails.
- A wrong key/payload combination fails even when values have union types.
- Readonly and mutable callers behave according to the ownership contract.
- Omission and explicit undefined follow the chosen patch/update semantics.
- Special types such as never or any are tested only when exposed by realistic callers;
  do not publish a universal equality-helper claim based on a few examples.

Keep rejection lines small. If an error directive might hide an unrelated error, remove
it in a disposable copy and inspect the diagnostic. Verify representative positive calls
without suppression too. Include the specimen in the real compiler invocation; a passing
transpile-only test run is not type evidence.

## Decide whether the abstraction earns its cost

Prefer an existing built-in utility when it expresses the required operation. Introduce a
new mapped/conditional helper only when its input domain, output promise and error behavior
can be explained at the caller. For deep transformations, specify how arrays, tuples,
functions, built-in objects and optional properties are handled instead of promising that
an arbitrary recursive object mapping works for every JavaScript value.

For public library helpers, inspect emitted declarations and compile supported consumer
shapes. Measure broad or generated unions if the change affects checker performance.
Return the relevant inference observations to the graph's review node; do not start a
separate type-checking agent workflow from inside this concern skill.

## Technical references

Check language semantics against [TypeScript utility types](https://www.typescriptlang.org/docs/handbook/utility-types.html#noinfertype)
and [mapped types](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html).
