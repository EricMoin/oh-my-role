---
name: jetpack-compose-test-quality-gate
description: Review regression detection, test boundaries, encapsulation, deterministic behavior checks, and project verification requirements.
---
# Test quality review

Review the actual behavior contract and the tests that could catch its regressions.
Load `references/schemas.md` and `references/compose-testing-and-quality.md`. Treat
examples as options; use the project’s configured stack and declared requirements.

## Decision criteria

- Map each material risk to an observable scenario, appropriate test level, and meaningful
  assertion. No fixed unit/UI/screenshot percentages, per-composable test quota, mandatory
  Turbine dependency, or role-invented coverage threshold.
- Detect visibility widened solely for tests, test-only production accessors, reflection
  into private members, and extracted wrappers that add no production responsibility.
  Request tests through the existing owner’s behavior. A legitimate collaborator needs
  an independently meaningful contract and the narrowest production visibility.
- Assess assertion quality: would the test fail for a plausible bug, and survive an
  equivalent implementation? Avoid reimplementing the same algorithm in the expectation.
- UI tests act through semantics and observable interactions. Test tags are appropriate
  when needed; `onNodeWithTag` and `onNode(hasTestTag(...))` are not inherently different
  quality levels. Check selector uniqueness and intent, not spelling.
- Select the test rule/environment based on the configured host and needed Activity
  control. Do not assume `createComposeRule` alone provides a plain JVM environment.
- Test state and effects deterministically using the established coroutine utilities,
  fakes and synchronization. Assert intermediate emissions only when they are a contract.
  Do not demand a specific Flow assertion library or unconditional idle waits.
- Previews help inspect relevant states; they are not proof of behavior. Screenshots are
  appropriate for material visual risk when supported or justified. Neither is mandatory
  for every new composable. Missing test infrastructure does not justify API pollution.
- Verify Gradle tasks against actual modules/variants and configured CI requirements.
  Distinguish commands run from proposed commands. Respect existing coverage rules;
  coverage is supporting evidence, not a substitute for a regression assertion.

Block on a concrete untested critical behavior, ineffective/flaky assertion, unjustified
encapsulation damage, broken test command, or an actual project requirement violation.
Cite the file/test, failure mechanism, and required outcome. Improvements without a
material failure remain advisory. During consultation, evaluate the strategy without
claiming unwritten tests pass. Follow `references/schemas.md` for result and signals.
