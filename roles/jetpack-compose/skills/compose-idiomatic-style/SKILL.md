---
name: compose-idiomatic-style
description: Review Compose component APIs, naming, modifier ownership, decomposition, and content slots. Use for style-focused refactors and reusable component design; route state, performance, layout, and testing behavior to their dedicated skills.
---
# Compose Idiomatic Style

Keep this skill focused on component contracts. Read the relevant section of
[component examples](references/component-examples.md) only when a concrete example
would help; do not load a second tutorial for topics owned by another skill.

## Route by concern

| Concern | Owner |
| --- | --- |
| Naming, parameters, slots, component boundaries | This skill |
| State ownership, ViewModels, navigation, CompositionLocal | `compose-ui-architecture`; [tree-scoped examples](../compose-ui-architecture/references/ui-coordination.md) |
| Effects, remember keys, snapshot state, lifecycle collection | `compose-runtime-state` |
| Recomposition, stability, lazy-list performance | `compose-performance` |
| Constraints, Material styling, modifier geometry, accessibility | `compose-layout-material-adaptive` |
| Preview fixtures and behavioral tests | `compose-testing-previews` |
| View interoperability or platform lifecycle | `compose-interop-migration` / `android-platform-engineering` |
| Plain Kotlin language choices | `kotlin-idiomatic-style` |

## Review contract

- Name `Unit`-returning composables as PascalCase nouns. Value-returning
  composables use lowerCamelCase; a factory retaining a mutable object conventionally
  starts with `remember`. Do not require every composable to return `Unit`.
- A reusable UI element accepts `modifier: Modifier = Modifier` as its **first
  optional parameter**, after required data and callbacks. Put its primary content
  slot last. Non-UI composables and value factories do not need a modifier.
- Apply the caller's modifier once to the root element. Append intrinsic component
  decoration when appropriate; keep caller-controlled placement customizable.
- Treat one root as a reusable element's API contract, not a compiler restriction
  forbidding every helper from emitting siblings. Preserve the intended parent layout.
- Emit UI or return a value; avoid doing both in one component. Pass control through
  parameters and callbacks. A computation reading composition-scoped values may
  legitimately remain composable.
- Split components at ownership and reuse boundaries, not an arbitrary line count.
  Keep user-triggered actions in event callbacks; extracting a function must not turn
  a Save click into an effect that runs when editing state changes.
- Use content slots when callers need to supply UI. Keep ordinary parameters for
  finite, meaningful options; a slot is not automatically better than a boolean.
- Reuse immutable modifier chains when their captured values and scope are suitable.
  Do not share per-item callbacks or mutable interaction state accidentally. A caller's
  modifier belongs to one component root, which is a different concern from reusing
  a common padding chain among children.
- Preserve modifier order according to intended size, drawing, and input behavior.
  There is no universal layout → draw → interaction ordering rule.

These component conventions follow the
[AndroidX API guidelines](https://github.com/androidx/androidx/blob/androidx-main/compose/docs/compose-api-guidelines.md)
and [modifier documentation](https://developer.android.com/develop/ui/compose/modifiers).

## Verification

1. Inspect the component's call sites before changing its API or moving state.
2. Preserve event timing, modifier placement, semantics, and state lifetime.
3. Run the project's existing compile/lint checks for the changed surface. Use a
   focused preview or interaction test when the refactor changes observable UI behavior.
4. Check uncertain APIs against the project's resolved version through Context7 and
   official documentation; use `android-source-research` for unresolved behavior.
