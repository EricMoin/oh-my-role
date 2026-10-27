---
name: compose-testing-previews
description: Guides Compose previews, behavior and semantics tests, screenshot assertions, ViewModel tests, and selection of JVM versus device verification. Use when adding or reviewing Compose test coverage.
---
# Compose Testing and Previews

Choose checks from plausible failure modes and existing project requirements. Previews,
compilation, coverage and screenshots without assertions do not establish behavioral acceptance.
Do not introduce a new framework, test ratio or per-composable quota for a small change.

## Load a worked recipe when implementing

- [Behavior testing](references/testing-recipes.md): a callback assertion, semantics selectors,
  clock/idling decisions, subscriber-driven StateFlow test shape and screenshot/CI evidence.
- [Preview fixtures](references/preview-recipes.md): sample providers, theme/width/font-scale
  variants and diagnosing previews without a live DI graph.

The rules below choose the check; these references show how to carry it out. They are
part of the skill and should be read when the corresponding implementation is needed.

## Production boundaries

Test through production entry points and observable state, outputs, semantics or effects.
Keep private helpers private. Do not widen visibility, add test-only accessors, reflect into
internals or add `@VisibleForTesting` solely to reach implementation details. Extract only
a cohesive production responsibility, with visibility determined by real consumers.

## Choose the check

| Risk | Suitable check |
| --- | --- |
| Mapping, validation, reducers, repository/ViewModel transitions | Unit test with deterministic fakes |
| User actions, callbacks, semantics, navigation UI | Compose UI test |
| Meaningful rendering regression | Screenshot comparison using the configured tool |
| IME, permissions, system integration, device rendering | Instrumented/device verification |
| Startup, frame time, performance regression | Benchmark for the relevant scenario |

`createComposeRule()` supplies a Compose test host; it is not automatically a pure JVM test.
Use the project's supported instrumented or Robolectric environment and host dependencies.
`createAndroidComposeRule<Activity>()` adds explicit Activity access. Do not call `setContent`
on an Activity that already owns the screen unless that test host is designed for it.

## Compose UI tests

Prefer meaningful text, content descriptions, roles and state assertions. Use stable test
tags when user-facing semantics cannot identify the target reliably; tags do not replace
accessibility. Inspect merged/unmerged trees deliberately. A click alone does not prove
that its outcome happened: assert the resulting state, visible result or boundary callback.

Use the test rule receiver for selectors (`composeRule.onNodeWithText(...)`). Synchronize
with Compose and explicit idling/wait conditions for external work; do not use fixed sleeps.
For animation tests, distinguish the Compose test clock from unrelated coroutine schedulers.

## ViewModel and Flow tests

- Replace `Dispatchers.Main` when the tested code uses it; restore it after the test.
  Keep test dispatchers on the same scheduler and inject dispatchers where production does.
- Subscribe before triggering work when the contract requires observing a transition.
  `stateIn(WhileSubscribed(...))` needs a subscriber to activate its upstream.
- Assert current state or required transitions. StateFlow conflates values; do not require
  every transient intermediate value unless the production contract guarantees observation.
- Cover relevant failure, cancellation, retry and stale-result races. Do not assume the first
  emitted value after a method call is already the completed result.
- Use Turbine only if present or justified; an assertion library is not an architecture requirement.

## Previews and screenshots

Preview content with deterministic sample data, without DI or live ViewModels when possible.
Choose meaningful loading/empty/content/error, theme, width and font-scale cases for the change.
A fixed 1.0 font scale may stabilize one baseline; it does not cover accessibility scaling.

A screenshot regression test must compare against an approved baseline and fail on a
meaningful mismatch. `captureToImage()` only captures pixels. Fix locale, fonts, clock,
image data, theme, size and animation state; add distinct variants for relevant configurations.
Never invent universal screenshot Gradle tasks: identify the installed plugin and inspect
its documented tasks before updating or verifying baselines. Review baseline diffs before
accepting them.

## Runtime checks and completion

Confirm the component, trigger and expected behavior before expensive reproduction.
Use local checks by default, and a device when acceptance depends on runtime behavior.
The execution and evidence contracts live in
[device-verification](../../references/device-verification.md),
[device-test-memory](../../references/device-test-memory.md), and
[device-video-debugging](../../references/device-video-debugging.md). Read only the relevant
sections. Optional archival can use the journey recorder after minimum evidence is retained;
it cannot defer acceptance checks or turn an old build's result into evidence for current code.

Run the narrowest relevant tasks using actual project/module/variant names. Finish when
selected final-code acceptance and required project checks pass with no blocking defect.
Broaden only for a concrete new risk. Required checks that cannot run remain unverified.
Diagnostic retries share at most three attempts per hypothesis/implementation across tools
and run names; stop earlier without new evidence and reassess after roughly ten minutes
without an effective change or decisive evidence.

## Sources

- [Compose test setup](https://developer.android.com/develop/ui/compose/testing)
- [Synchronization and test clocks](https://developer.android.com/develop/ui/compose/testing/synchronization)
- [Testing Kotlin flows](https://developer.android.com/kotlin/flow/test)
- [Screenshot testing](https://developer.android.com/studio/preview/compose-screenshot-testing)
