---
name: compose-layout-material-adaptive
description: Guides Compose constraints, modifiers, lazy layouts, Material themes, adaptive sizing, insets, semantics and focus. Use when building screens or fixing sizing, accessibility and layout-state problems.
---
# Compose Layout, Material, and Adaptive UI

Inspect the existing design system, available constraints and target configurations first.
Use standard layouts before custom `Layout` or subcomposition. Preserve content, state and
interaction while changing size; smaller proportional columns alone do not make a screen usable.

## Worked patterns

- [Layout and theme recipes](references/layout-recipes.md): dynamic-color fallback, theme
  tokens, lazy keys/content types with Scaffold insets, and local adaptive layout policy.
- [Accessibility and forms](references/accessibility-recipes.md): a labeled single-action
  toggle, custom progress semantics, validation/focus and checks that need a real device.

Load the applicable recipe when implementing these patterns; use the rules below for review.

## Constraints, modifiers and scrolling

- Constraints flow down; measured sizes flow up. Inspect the parent before adding fixed
  dimensions, `fillMaxSize`, `weight` or intrinsic queries. `weight` is scope-specific.
- Modifier order changes bounds, drawing and interaction. `clickable().padding(...)` makes
  that padding part of the clickable area; `padding(...).clickable()` puts it outside.
  Compose may expand small touch targets, so validate actual hit regions and overlaps.
- Intrinsic queries obtain sizing information before measurement; they do **not** measure
  children twice. `height(IntrinsicSize.Min)` can correctly constrain a divider to sibling
  text height. Removing it changes behavior; use it deliberately and measure cost if relevant.
- Same-axis nested scrollers need bounded constraints. Flatten sectioned content into one
  lazy container when appropriate; do not prohibit intentional bounded nested scrolling.
- Lazy item keys default to position. Use unique stable IDs when insertion/reordering must
  preserve item identity and state. For Android saved state, keys must be Bundle-compatible.
  Use `contentType` for reusable item shapes, not a distinct type for every item ID.
- Keep expensive mapping outside item rendering; use the project's paging/data boundary.

## Theme and insets

Use the project's theme and component family consistently. Prefer Material 3 for a new
Material 3 surface; do not mix Material 2 and 3 imports or force a whole-app migration.
Material 3 uses `MaterialTheme.colorScheme`; typography and shapes remain theme properties.
Define custom semantic tokens in the theme instead of scattering screen color literals.

Dynamic color uses `dynamicDarkColorScheme(context)` or `dynamicLightColorScheme(context)`
on Android 12/API 31 and later, selected by the active theme. Supply a normal dark/light
scheme below that API level or when the product disables dynamic color.

Apply `Scaffold`'s content padding to the content root or the appropriate lazy content
padding. Coordinate consumed insets to avoid double application. Check system bars, cutouts
and IME against the project's target SDK and edge-to-edge setup; do not hard-code bar heights.

## Adaptive sizing and state

Use window-level size/posture information for screen navigation and pane policy. Use
`BoxWithConstraints` when a component needs its own allocated constraints, which may differ
from the window. Subcomposition has a cost, but a constraint change does not inherently
forget remembered state. State loss depends on identity, keys and leaving/moving composition
locations. Preserve shared state above changing branches or use the project's supported
state-preserving layout facilities.

- Choose usable compact/medium/expanded layouts from content needs, not device names.
  Hide or stack secondary panes when proportional widths would make them unusable.
- Recompute policy when the window changes; it must not be calculated only once.
- Keep business state/navigation consistent through resize, rotation and fold changes.
- Keep reusable leaves parameter-based; pass resolved layout choices when the leaf does
  not need to observe its own constraints.
- Inspect resolved adaptive/window artifacts and imports before writing code. Legacy
  Material 3 window-size classes and AndroidX Window/adaptive types are different APIs.
  Do not mix their constants, invent `currentWindowSizeClass()`, copy unverified BOM maps,
  or add opt-ins merely to suppress errors. Check current docs for the project's version.

## Accessibility, forms and focus

Prefer standard controls, whose semantics and interaction are already implemented.
For custom controls expose the meaningful action, role, value and state; a semantics-only
click action does not implement touch/keyboard interaction. Use `clickable`, `toggleable`
or the appropriate control for those inputs.

- Labels should describe meaning without redundant prefixes such as “Button:”. Visible
  text often supplies the label already. Informative icons/images need a description;
  decorative or already-described imagery uses `contentDescription = null`.
- Merge descendants only for a logical accessibility unit; preserve independently
  actionable children. Use `clearAndSetSemantics` only when replacement semantics are complete.
- Progress uses `progressBarRangeInfo`; do not invent `Role.ProgressBar`. Use live regions
  for relevant announcements, not continuously changing timers.
- Provide at least a 48 dp interactive target under Android guidance, adequate contrast,
  and a non-color state/error cue. Do not equate dp directly with web CSS-pixel standards.
- `sp` respects font scale when converted with the current density/font scaling. Custom
  drawing must use the current conversion and expose semantics; `sp` itself does not
  disable scaling. Verify long text, large font settings and RTL without hiding essential text.
- Forms need labels, visible recovery messages and a discoverable validation path. Request
  focus from an event/effect after the field exists, not during composition.
- Prefer natural keyboard traversal. When overriding it, use `FocusRequester` with
  `focusProperties { next = ...; previous = ... }`; `focusOrder(1)` is not an ordering API.
  Keyboard focus and accessibility traversal are distinct; check both when affected.

## Verification and sources

Exercise the affected dimensions: narrow/resized window, font scale, long/RTL content,
IME, scrolling, keyboard and TalkBack where applicable. Use existing previews/UI tests
and a device for platform-dependent acceptance; no fixed matrix is required for every edit.

Checked 2026-10-27:

- [Intrinsic measurement](https://developer.android.com/develop/ui/compose/layouts/intrinsic-measurements)
- [Adaptive state lifespans](https://developer.android.com/develop/ui/compose/state-lifespans)
- [Local sizing and subcomposition](https://developer.android.com/develop/ui/compose/performance/backwards-write)
- [Material 3 theme and dynamic colors](https://developer.android.com/codelabs/jetpack-compose-theming)
- [Scaffold padding](https://developer.android.com/develop/ui/compose/components/scaffold)
- [Semantics](https://developer.android.com/develop/ui/compose/accessibility/semantics)
- [Focus traversal](https://developer.android.com/develop/ui/compose/touch-input/focus/focus-traversal)
