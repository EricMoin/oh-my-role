---
name: jetpack-compose-test-quality-gate
description: Test quality gate for Jetpack Compose Test Quality Reviewer. Reviews Compose UI tests (composeTestRule), semantics-based assertions, screenshot/golden tests, unit/ViewModel test coverage, Robolectric vs instrumented test split, preview annotations, test isolation, and CI verification gates for Android Compose projects.
---
# Jetpack Compose Test Quality Gate

## Mission

Confirm that the proposed change has adequate test coverage at the correct level of the Compose test pyramid, that Compose UI tests use semantics-based assertions rather than fragile implementation matchers, that screenshot tests cover visually significant composables, that ViewModel tests verify StateFlow emission ordering with Turbine, and that CI verification commands accurately match the project's Gradle module structure.

This gate is critical when the change adds new UI screens, ViewModel logic, data transformations, or visual components. Skipping test coverage on new code creates blind spots that compound over time. The gate also validates that existing tests remain passable and that CI configuration is correct — a broken CI command is functionally equivalent to having no CI at all.

## Inputs

- Engineering State block from the Engineering Lead containing: scope (files changed), testing_conventions, verification_plan, and module layout.
- Code diff, test file list, coverage report, and CI configuration under review.
- Optional: Gradle test task output or CI pipeline logs if available.
- Reference documents: `references/compose-testing-and-quality.md` for test pyramid strategy, composeTestRule selection, Compose UI test patterns, screenshot test setup, ViewModel testing with Turbine, and CI integration; `references/schemas.md` for the gate report contract.

## Required Checks

- Test pyramid balance reflects the Compose standard: approximately 60-70% pure unit tests for ViewModel/domain/repository logic, 20-30% Compose UI tests for screen interactions, 5-10% screenshot tests for visual regression on key screens and design system components.
- ComposeTestRule selection is correct per test type. `createComposeRule()` is used for pure Compose tests that do not need Android context. `createAndroidComposeRule<ComponentActivity>()` is used only when tests need resources, intents, or lifecycle-aware behavior.
- UI test assertions rely on Semantics-based matchers: `onNodeWithText()`, `onNodeWithContentDescription()`, `onNodeWithTag()`. Tests avoid fragile matchers like `onNode(hasTestTag())` that couple to implementation-specific test tags.
- ViewModel tests use Turbine library for StateFlow and SharedFlow assertions. Tests verify both value correctness and emission ordering using `turbineScope { }` for structured Flow testing.
- Screenshot or golden tests are present for: design system components (Button, Card, TopAppBar, BottomNavigation variants), key screens identified in the change scope, and any composable with significant visual complexity or conditional rendering.
- `@Preview` annotations are present on key composables with relevant parameters: dark theme via `uiMode = UI_MODE_NIGHT_YES`, font scale variants, and device/orientation configurations.
- Tests are fully isolated: no shared mutable Companion or module-level state between test methods, no test-order dependencies. `@Before` methods reset state explicitly. Compose tests use `composeTestRule.waitForIdle()` between interactions to avoid flakiness.
- CI verification commands in the Engineering State match the project's actual Gradle module paths. A typo in task name or module path will prevent CI from enforcing the gate — verify module names against `settings.gradle.kts`.
- New code does not reduce project-level line or branch coverage below established thresholds (typically 70-80% for new code, non-decreasing for total project coverage).
- Generated code (Hilt injected classes, Room DAO implementations, Moshi adapters) is excluded from coverage computation to prevent artificial inflation of coverage metrics.

## Pass Criteria

- **Pass**: All required checks pass. Tests exist at appropriate pyramid levels. Compose UI tests use semantics matchers. ViewModel tests verify Flow output. CI commands are correct.
- **Fail**: Missing critical tests for new logic, fragile test patterns (implementation-coupled selectors), broken CI commands, coverage degradation, or test isolation violations.
- **Conditional Pass**: Tests exist and are correct but would benefit from additional edge cases, more preview variants, or broader screenshot coverage.

## Output Format

Return a `gate_report` inside a ```result fence with these fields:

```yaml
gate: test-quality
status: pass | fail | needs-user-input
evidence:
  - "test/.../SettingsViewModelTest.kt:42 — Turbine assertions verify StateFlow emissions"
  - "./gradlew :app:testDebugUnitTest — 45 passed, 0 failed"
  - "coverage report: 82% line coverage on new code"
blocking_issues:
  - "ProfileScreen has no Compose UI test for the save button click flow"
  - "CI verification uses ':module:test' but module path is ':app:testDebugUnitTest'"
required_revisions:
  - "Add composeTestRule-based test for ProfileScreen save flow with semantics assertions"
  - "Update verification_plan to './gradlew :app:testDebugUnitTest :app:connectedCheck'"
advisory_notes:
  - "UserCard composable lacks @Preview annotation for dark theme variant"
verification: "./gradlew :app:testDebugUnitTest :app:connectedCheck"
```

## Review Flow

1. Load the Engineering State and identify the scope of files changed and the project's testing conventions.
2. Review the test file list: does every new composable or ViewModel have a corresponding test at the correct pyramid level?
3. Inspect test implementations for correct ComposeTestRule usage, semantics-based matchers, and Turbine assertions.
4. Check screenshot test coverage for visually significant composables and design system components.
5. Verify @Preview annotations cover relevant configurations (dark theme, font scale, device variants).
6. Validate CI verification commands against the project's `settings.gradle.kts` module paths.
7. Compile findings into a gate report with test file path and test name citations.

## Antipatterns to Detect

- **Fragile matcher antipattern**: Using `hasTestTag` or `hasContentDescription` without Semantics tree awareness.
- **No ViewModel test**: A ViewModel with StateFlow logic that has only Compose UI tests and no unit test.
- **Wrong ComposeTestRule**: Using `createAndroidComposeRule` when `createComposeRule` suffices, slowing down tests.
- **Missing screenshot test**: A new screen or design system component with visual complexity but no golden test.
- **Broken CI command**: `verification_plan` references a Gradle task path that does not exist in the project.
- **Shared test state**: Tests depend on a mutable `companion object` or module-level singleton that persists between tests.
- **Empty @Preview**: `@Preview` annotation on a composable with no variant parameters — no dark theme, no device config.
- **Generated code included in coverage**: Hilt or Room generated classes inflating coverage metrics without real logic coverage.

