---
name: jetpack-compose-ui-layout-gate
description: UI/Layout gate for Jetpack Compose UI Layout Reviewer. Reviews Modifier composition, layout constraints, Material 3 theming, adaptive/responsive behavior, accessibility (Semantics, focus, TalkBack), touch targets, and form interaction patterns for Android Compose projects.
---
# Jetpack Compose UI Layout Gate

## Mission

Confirm that the proposed Compose UI change produces correct layout across screen sizes and orientations, follows Material 3 theming conventions consistently, meets accessibility requirements for screen readers and keyboard navigation, avoids common modifier ordering and constraint bugs, and handles form interactions with proper error recovery and focus management.

This gate is critical when the change creates new screens or composables, modifies theming or typography, adds interactive elements, rearranges layout structure, or introduces adaptive behavior for foldables, tablets, or landscape orientations. Accessibility violations are the most common cause of late-stage rework — this gate catches them before implementation is complete.

## Inputs

- Engineering State block from the Engineering Lead containing: scope (screen files), project_facts, and any accessibility or theming requirements.
- Code diff or file list for the composable changes under review.
- Optional: Accessibility Scanner output, Layout Inspector frame capture, or design mockup for visual comparison.
- Reference documents: `references/compose-ui-and-accessibility.md` for theming patterns, modifier ordering rules, adaptive layout strategies, and accessibility guidelines; `references/schemas.md` for the gate report contract.

## Required Checks

- ColorScheme, Typography, and Shapes are sourced from the project's MaterialTheme — no hardcoded color values (Color(0xFF...)), hardcoded font sizes, or raw shape radii in composable code.
- Modifier chain ordering produces the correct interaction and layout behavior. Common mistakes: padding applied after clickable reduces the touch target; clip applied before size clips to wrong bounds; background applied inside padding leaves gaps around the background.
- No unbounded constraint or overflow errors. LazyList containers use `Modifier.fillMaxSize()` or `Modifier.weight()` within a parent that provides constraints. Row/Column widths do not cause RenderBox overflow warnings.
- LazyColumn/LazyRow items are keyed with stable, unique keys via the `key` parameter. Using `index` as a key is acceptable only for static lists; content-based keys are preferred for dynamic, filterable, or reorderable lists.
- Adaptive layout uses WindowSizeClass (Compact/Medium/Expanded) or BoxWithConstraints for foldable, tablet, and landscape configurations. Content rearranges into multi-pane layouts rather than simply scaling fonts.
- Interactive elements (buttons, switches, clickable rows, icon buttons) have accessible Semantics content descriptions. Form labels use `semantics { contentDescription = ... }` or the component's `label` parameter.
- Touch targets are at least 48dp in both height and width (Material 3 minimum touch target guideline). Icon-only buttons are wrapped in a 48dp box via `Modifier.size(48.dp).clickable {}`.
- Focus order is logical for TalkBack swipe navigation and DPAD/Tab key navigation. No focusable element is unreachable. `focusRequester` and `focusProperties` are used deliberately for custom focus behavior.
- Form validation errors appear adjacent to the offending field and are communicated via `semantics { liveRegion = LiveRegion.Assertive }` for screen reader announcements. Input field values are preserved on validation failure.
- Dynamic color support via `dynamicColorScheme()` is considered when targeting Android 12+ (API 31) and the project's design direction allows it.

## Pass Criteria

- **Pass**: All required checks pass. The UI renders correctly on reference screen sizes. Accessibility scans show no violations. Theming is consistent with project conventions.
- **Fail**: One or more blocking issues found — accessibility violations (missing semantics, insufficient touch targets), layout overflow or constraint errors, broken theming inconsistency, or missing adaptive support for a required device configuration.
- **Conditional Pass**: Layout and theming are correct but minor improvements are available (additional @Preview annotations, more granular WindowSizeClass breakpoints, additional accessibility hints).

## Output Format

Return a `gate_report` inside a ```result fence with these fields:

```yaml
gate: ui-layout
status: pass | fail | needs-user-input
evidence:
  - "path/SettingsScreen.kt:88 — Switch toggle without contentDescription"
  - "Accessibility Scanner output: 'Switch has no contentDescription'"
  - "Layout Inspector: ProfileHeader overflows on 320dp width"
blocking_issues:
  - "Dark mode toggle lacks Semantics contentDescription"
  - "Settings list overflows on 320dp width screens"
required_revisions:
  - "Add semantics { contentDescription = 'Toggle dark mode' } to Switch"
  - "Wrap settings rows in horizontalScroll or use weight-based sizing"
advisory_notes:
  - "Theme uses hardcoded colors in three places — consider adding to ColorScheme tokens"
verification: "./gradlew :app:testDebugUnitTest && Accessibility Scanner scan on 320dp device and 600dp tablet"
```

## Review Flow

1. Load the Engineering State and identify the scope of screen files, theming conventions, and device support requirements.
2. Review the code diff against each Required Check, inspecting modifier chains, layout constraints, and Semantics blocks.
3. Cross-check theming usage against the project's MaterialTheme — flag any hardcoded color, typography, or shape values.
4. Identify accessibility gaps: missing contentDescription, insufficient touch targets, broken focus ordering.
5. Check adaptive layout: does the UI handle compact, medium, and expanded window size classes?
6. Compile findings into a gate report with file:line citations. For accessibility violations, reference Accessibility Scanner output if available.

## Antipatterns to Detect

- **Wrong modifier order**: `Modifier.clickable { }.padding()` reduces the clickable area to the pre-padding bounds.
- **Hardcoded color values**: `Color(0xFF...)` scattered in composables instead of sourcing from ColorScheme.
- **Index-as-key in dynamic list**: Using `index` as LazyColumn key when items can be filtered, sorted, or reordered.
- **No adaptive layout**: A list that works on phones but wastes space on tablets because WindowSizeClass is not checked.
- **Missing semantics on icon-only button**: A close button with an X icon but no `contentDescription` — invisible to TalkBack.
- **Touch target too small**: A 32dp icon button without the 48dp minimum touch target expansion.
- **No dynamic color fallback**: Targeting API 31+ without `dynamicColorScheme()` when the project already uses Material 3.
- **Form error without live region**: Validation errors that appear visually but are not announced by screen readers.

