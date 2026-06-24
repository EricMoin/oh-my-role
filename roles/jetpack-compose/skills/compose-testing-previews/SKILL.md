---
name: compose-testing-previews
description: Adds and reviews Compose previews, UI tests, semantics assertions, screenshot strategy, Robolectric/device test split, ViewModel tests, and Android test coverage.
---
# Compose Testing and Previews

Compose testing should verify behavior through state, semantics, and user actions. Previews should make important UI states easy to inspect without running the full app.

## Test Pyramid

- Unit tests: reducers, mappers, validators, use cases, repositories with fakes, ViewModel state transitions.
- Compose UI tests: semantics, interactions, navigation callbacks, accessibility-relevant behavior.
- Screenshot tests: visual regressions for design-system components and important screen states when the project supports them.
- Instrumented/device tests: real framework behavior, permissions, IME, navigation, rendering, and integration with Android services.
- Macrobenchmarks: performance-sensitive flows.

Follow the project's existing test stack before adding new frameworks.

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
- Assert state sequences, not timing-dependent implementation details.
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
2. Split route/content composables if needed to make UI testable and previewable.
3. Add previews for relevant UI states.
4. Add unit tests for state/business logic and Compose UI tests for user-visible behavior.
5. Use instrumented or screenshot tests only where they answer a risk that unit/UI tests cannot.
6. Run the narrowest relevant test command, then broader checks if the change affects shared UI or architecture.

## Validation Checklist

- [ ] Important UI states have previews.
- [ ] Tests use semantics/user actions rather than private implementation details.
- [ ] ViewModel tests use deterministic fakes and coroutine test utilities.
- [ ] Device/instrumented tests are used for real platform behavior when needed.
- [ ] New test tooling is justified by risk and follows existing project conventions.
