---
name: typescript-type-system
description: Diagnose TypeScript assignability and inference errors, model correlated data and generics, and change strictness or declaration-related types. Use for type-system problems; runtime validation and behavior require separate evidence.
---

# TypeScript type system

## Diagnose before redesigning

Read the full diagnostic and follow the value from its origin to the rejected use. Locate
where information was widened, lost or asserted. Inspect the effective tsconfig and local
compiler version when the answer depends on flags or language support. An editor may be
using a different compiler/configuration from CI.

Distinguish an incorrect value, an incorrect declared contract, an inference limitation,
and a configuration mismatch. Correct that layer rather than casting at every caller.
For difficult inference, make a small reproduction under the same options; keep the
original project check as the integration check.

## Choose the simplest model that preserves the relationship

| Need | Useful starting point | Watch for |
|---|---|---|
| Finite states with different fields | Discriminated union | Parallel optional properties allow impossible states |
| A result determined by an input | Generic relating input and output | Unused type parameters or constraints that erase caller detail |
| Known property selection | `keyof`, indexed access, mapped type | Dynamic keys need a runtime check or an optional result |
| Validate an authored literal's shape | `satisfies` | It is not runtime validation; contextual typing can affect inference |
| Preserve literal/tuple information | `as const`, or supported const type parameters | Readonly types do not freeze runtime objects |
| Unknown input from outside | `unknown` plus validation/narrowing | A type predicate's annotation does not prove its implementation |
| Distinguish same-shaped domain values | Brand at a validated construction boundary | A brand is erased; casting arbitrary strings is not validation |

Prefer inference for local variables. Use an annotation when it defines a stable contract,
bounds inference cost or improves errors. Use `satisfies` when checking an expression
against a shape while retaining useful specificity; do not promise that it never affects
inference. `as T` bypasses part of checking and provides no runtime conversion.

For reusable examples and their limits, read [type-level recipes](references/type-level-recipes.md).
When inputs lose precision or a generic accepts mismatched combinations, use
[inference diagnostics](references/inference-diagnostics.md) and its compile-only contract
fixture to choose inference sources and preserve correlations.

## Narrowing and strictness

- Separate missing, `undefined`, `null` and falsy values according to the domain. A truthy
  check can discard valid `0`, `false` or empty strings.
- Check the discriminant before accessing variant-specific fields. Exhaustive `never`
  checks help with closed unions; they do not make unvalidated input impossible at runtime.
- A user-defined predicate must actually check the claimed fields, including nullability
  and nested structures. Reuse an existing schema/validator when one already owns the data.
- `strict` is a family of checks, not every safety option. Check effective values;
  `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` are separate opt-ins.
- With exact optional properties, omission and explicit `undefined` can have different
  assignment contracts. Reading an optional property still requires handling absence.
- Enable stricter flags as a scoped migration when requested. Do not weaken them, turn on
  `skipLibCheck`, or scatter suppressions just to silence a local diagnostic.

## Advanced types only where they pay off

Conditional types over a naked type parameter distribute over unions; tuple wrapping can
suppress distribution. Decide which behavior the API needs. Check `never`, unions and broad
inputs when they are realistic callers. Limit recursive type machinery to bounded use cases;
measure instantiation cost if a public helper operates over large generated unions.

Function parameter variance depends on syntax and compiler settings; method bivariance can
hide a callback mismatch under strict function checks. Readonly inputs can prevent mutation
through that reference, but do not guarantee global immutability. Avoid universal rules
based solely on structural similarity.

For declarations, inspect emitted types when consumers use them. Add public annotations
where they protect a contract without severing generic relationships. `isolatedDeclarations`
restricts inference needed for declaration generation; it neither emits declarations by
itself nor replaces type checking. Verify its exact restrictions with the local compiler.

## Verify the promised type

Use the existing type-test mechanism, or a small file included by the actual checker. Cover
valid callers, invalid callers and inferred results where precision is the feature.
`@ts-expect-error` detects when a line stops reporting an error, but can also hide a different
error on that line: keep negative examples small and inspect the diagnostic when uncertain.
A test runner that only transpiles these files has not checked the type assertions.
