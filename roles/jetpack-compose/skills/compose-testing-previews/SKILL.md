---
name: compose-testing-previews
description: Adds and reviews Compose previews, UI tests, semantics assertions, screenshot strategy, Robolectric/device test split, ViewModel tests, and Android test coverage. Use when writing Compose UI tests, adding multi-state previews, setting up screenshot tests, organizing Robolectric vs. instrumented tests, or reviewing test coverage for Compose features.
---
# Compose Testing and Previews

Compose testing should verify behavior through state, semantics, and user actions. Previews should make important UI states easy to inspect without running the full app.

## Preserve production boundaries

Keep private helpers private. Do not widen to internal/public, add test-only accessors,
use reflection, or add `@VisibleForTesting` solely to call implementation details. Exercise
existing production entry points and observable state, outputs, semantics or effects.
If testing is awkward, distinguish implementation-coupled tests from misplaced
responsibility. Extract only a cohesive production responsibility with its own meaningful
contract; record why it belongs there and keep the narrowest production visibility.
Do not create wrappers or interfaces that exist only to let a test reach a helper.

Select checks by plausible regressions. No mandatory test ratios, per-composable quotas,
screenshot tooling, or Flow assertion library. Respect actual project requirements.

## Test Pyramid

- Unit tests: reducers, mappers, validators, use cases, repositories with fakes, ViewModel state transitions.
- Compose UI tests: semantics, interactions, navigation callbacks, accessibility-relevant behavior.
- Screenshot tests: visual regressions for design-system components and important screen states when the project supports them.
- Instrumented/device tests: real framework behavior, permissions, IME, navigation, rendering, and integration with Android services.
- Macrobenchmarks: performance-sensitive flows.

Follow the project's existing test stack before adding new frameworks.

Confirm the affected component and expected behavior before expensive reproduction; resolve
material ambiguity early. Default to focused local checks. Use targeted device verification
only for acceptance that needs a running app; use deep/formal journeys for a concrete high
risk, an unresolved evidence gap or a user/project requirement. Select additions by risk:
small reversible changes do not automatically need new previews, tests or test tooling.

For device sessions, follow the record levels in `references/device-test-memory.md`. Read
only applicable known cases or pitfalls; inline checks need no complete history search, XML
or new reusable case. Keep a compact outcome with decisive evidence, and distinguish a new
run from a reusable case. A dispatched verifier still executes a frozen journey. The lead
retains the minimum record, then may delegate optional report enrichment and case/index
proposals to `jetpack-compose--journey-recorder` in a background graph and continue fixes
without waiting. Shared-memory merges stay lead-owned. Old results never prove current code.

For temporal behavior, start with short video and inspected key frames per
`references/device-video-debugging.md`; inspect an interval frame by frame and correlate
clocks only when a single-frame defect, disputed ordering or unresolved timing cause needs
it. Keep original and decisive evidence for the repaired-build comparison.

Stop after final-code acceptance and required project checks pass with no blocking defect.
Broaden testing only for a concrete new risk. Share a maximum of three diagnostic attempts
per hypothesis/implementation across tools and run names; stop earlier when no new evidence
is added, and reassess after roughly ten minutes without an effective change or decisive
evidence. Report required checks that could not run as unverified, never passed.

## Previews

Preview stateless content composables, not route composables that require DI or live ViewModels.

```kotlin
@Preview(showBackground = true)
@Composable
private fun ProfileScreenPreview() {
    AppTheme {
        ProfileScreen(
            state = ProfileUiState.Content(
                name = "Ada Lovelace",
                subtitle = "Compose engineer",
            ),
            onAction = {},
            onBack = {},
        )
    }
}
```

Include previews for loading, empty, content, error, long text, dark theme, and expanded layout when those states matter.

## Compose UI Tests

Test through semantics, not implementation details.

```kotlin
@get:Rule
val composeRule = createComposeRule()

@Test
fun clickingRetryInvokesAction() {
    var retried = false

    composeRule.setContent {
        AppTheme {
            ErrorPanel(onRetry = { retried = true })
        }
    }

    composeRule
        .onNodeWithText("Retry")
        .performClick()

    assertThat(retried).isTrue()
}
```

Prefer content descriptions, text, roles, state descriptions, and test tags only where user-facing semantics are insufficient or unstable.

## Semantics

- Make custom controls expose role, state, and action semantics.
- Do not add test tags as a substitute for accessibility semantics.
- Use merged/unmerged tree intentionally.
- Verify important content is discoverable with TalkBack-relevant labels.

## ViewModel Tests

- Use coroutine test dispatchers and deterministic fake repositories.
- Assert observable state/effects. Assert sequences only when ordering is part of the contract; avoid timing-dependent implementation details.
- Cover loading, success, failure, cancellation, retry, and stale data cases.
- Keep Android framework dependencies out of ViewModel tests when possible.

## Robolectric vs Instrumented Tests

Use Robolectric for fast JVM tests when framework behavior is adequately represented and project already supports it. Use instrumented tests for:

- Compose rendering differences that matter.
- IME and focus behavior.
- Permissions and system services.
- Navigation/activity/fragment integration.
- Accessibility checks needing platform behavior.

## Screenshot Strategy

If the project has screenshot tooling:

- Snapshot design-system primitives and high-value screens.
- Use deterministic fonts, clock, locale, and image data.
- Cover light/dark and key width classes.
- Keep screenshots stable by avoiding live network and animation state.

If the project does not have screenshot tooling, do not introduce it for a small change unless visual regression risk justifies the setup cost.

## Workflow

1. Inspect existing test frameworks, rules, fake patterns, and naming.
2. Use the existing production boundary; split route/content only when it improves responsibility separation, not merely test access.
3. Add previews for relevant UI states when they improve inspection of this change.
4. Add unit or Compose UI tests where they protect a plausible regression through behavior.
5. Use instrumented or screenshot tests only where they answer a risk that unit/UI tests cannot.
6. Run the narrowest relevant test command, then broader checks if the change affects shared UI or architecture.

## Validation Checklist

- [ ] Relevant UI states are inspectable; previews are added when useful for this change.
- [ ] Tests use semantics/user actions rather than private implementation details.
- [ ] ViewModel tests use deterministic fakes and coroutine test utilities.
- [ ] Device/instrumented tests are used for real platform behavior when needed.
- [ ] New test tooling is justified by risk and follows existing project conventions.
