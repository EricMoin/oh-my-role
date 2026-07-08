---
name: jetpack-compose-engineering-gate
description: Build a Jetpack Compose Engineering State and route non-trivial work through architecture, UI/layout/accessibility, test-quality, performance, or source-tracing gates. Use before broad feature work, refactors, platform changes, performance work, or source-sensitivity tasks on Android Compose projects.
---
# Jetpack Compose Engineering Gate

## Purpose

Use this skill to keep larger Android/Compose work deliberate without slowing down small edits. It creates a shared Engineering State, selects specialist gates, and records verification requirements.

## Load References

- For state shape, read `references/schemas.md`.
- For gate reports, read `references/schemas.md`.
- For gate-specific checks, read the relevant reference in `references/`:
  - Architecture: `references/compose-architecture.md`
  - UI/Layout/Accessibility: `references/compose-ui-and-accessibility.md`
  - Test Quality: `references/compose-testing-and-quality.md`
  - Performance: `references/compose-performance-and-platform.md`
  - Source Tracing: `references/source-research.md` and `references/evidence-first-research.md`

## Workflow

- [ ] Decide whether the task is trivial. If it is a small focused edit with low blast radius, use the relevant skill and skip subagent dispatch.
- [ ] For non-trivial work, inspect project facts: `build.gradle.kts`, version catalogs, Compose BOM, module layout, architecture style (MVVM/MVI/UDF), DI approach (Hilt/Koin), navigation structure, testing conventions, and CI configuration.
- [ ] Create or update the Jetpack Compose Engineering State.
- [ ] Dispatch only the gates needed by the risk:
  - Architecture: ViewModel boundaries, state ownership, DI, module organization, navigation, or data layer.
  - UI/Layout/Accessibility: screens, composable layouts, Material 3 theming, Modifier chains, adaptive behavior, Semantics, or form interactions.
  - Test Quality: test pyramid, composeTestRule selection, semantics assertions, screenshot tests, ViewModel test coverage, or CI verification.
  - Performance: recomposition stability, compiler reports, Lazy layout optimization, Macrobenchmark, Baseline Profiles, or startup/memory.
  - Source Tracing: AOSP/AndroidX source verification, undocumented API behavior, version-specific differences, or documentation accuracy.
- [ ] If a gate fails, revise the design or implementation plan before proceeding.
- [ ] Finalize with the verification commands that fit the project (e.g., `./gradlew :app:testDebugUnitTest`, `./gradlew :app:connectedCheck`).

## Gate Status Rules

- `pass`: implementation can proceed or final answer can ship.
- `fail`: a correctness, maintainability, platform, accessibility, or verification issue must be fixed first.
- `needs-user-input`: product intent or platform/release facts are missing and cannot be discovered locally.
