# Flutter Testing Guide

Use this guide when adding tests, reviewing regressions, or choosing test levels.

## Test Level Selection

- Pure logic: Dart unit tests.
- Presentation state: unit tests with fake repositories/services.
- Widgets and interactions: widget tests with stable finders and semantics.
- App flows: `integration_test`.
- Visual stability: golden/screenshot tests when layout, theming, or design regressions matter.

## Review Checks

- Tests cover the behavior changed by the task.
- Bugs get a regression test when practical.
- External dependencies are faked or mocked at stable boundaries.
- Widget tests pump bounded durations when animations do not settle.
- Golden tests use deterministic fonts, theme, device size, and platform configuration.
- CI commands are documented or match existing project scripts.
