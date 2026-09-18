---
name: typescript-engineering-gate
description: Debug TypeScript changes, design regression and type tests, verify refactors, and distinguish new failures from existing ones. Use when choosing or investigating checks; a routine edit does not require a separate audit pipeline.
---

# Debugging and verification

## Find checks that answer the actual question

Inspect package scripts, CI and existing test configuration. Use the pinned package manager
and installed tools. Prefer project commands; when none fits, derive a focused invocation
from the tool's documented options and the target configuration. Do not download a new
compiler or test runner implicitly, invent a script name, or replace a required check with
an easier one.

| Changed contract | Evidence to seek |
|---|---|
| Runtime behavior | Regression test at the observable seam, including relevant failure paths |
| Inference or allowed inputs | Type tests actually checked by the compiler |
| Import/build configuration | Build plus execution through the affected loader |
| Published package boundary | Packed artifact consumed outside workspace aliases |
| Workspace dependency/API | Affected consumers checked after their dependencies |
| Performance | Comparable before/after workload with cache state recorded |

Run the fastest useful check while iterating, then the relevant project-required checks.
Independent checks can run concurrently if they do not write the same output or contend
for shared test state. There is no universal typecheck/lint/format ordering requirement.

## Reproduce and isolate

Start with the concrete failure: input, expected result, actual result, diagnostic/stack
and relevant environment. Trace the cause across callers and boundaries. Test one useful
hypothesis at a time instead of making unrelated configuration changes until output clears.

For intermittent bugs, capture the conditions or add focused diagnostics. A missing local
reproduction is a limitation to report; strong source evidence may still support a fix.
Do not present that fix as runtime-verified until it has been exercised.

## Tests that constrain behavior

Use the existing test framework. Assert observable results and important side effects;
avoid tests that merely mirror branches or confirm a mocked implementation returns its
own configured value. Select cases from the changed contract: normal use, the regression,
and relevant invalid input, cancellation or boundary conditions.

Keep external services, clocks and randomness deterministic using established fixtures or
doubles. If the defect is in an integration, exercise that real integration with a suitable
local fixture. Do not require live services for unrelated unit tests.

For a bug fix, prefer a regression test observed failing before the correction and passing
after. When the test is written later, check it against a safely isolated original or use a
focused counterexample when practical. Do not revert files in a dirty working tree for this
purpose. Mutation/revert testing is useful evidence, not a mandatory ritual for every test.

Type tests must be included by a real type-check command. Check inferred results when
widening would defeat the API, and rejected calls when invalid inputs must remain invalid.
Do not execute deliberately invalid type-only examples as ordinary runtime tests.

A retry can diagnose a flake; it cannot erase the failure. Do not skip, delete, weaken or
quarantine a test solely to produce a green report. Fix its cause or report the limitation.
Coverage helps find missing paths, but a percentage does not establish assertion quality.

For practical selection of runtime, type, async and integration evidence, use
[test evidence](references/test-evidence.md). It includes version-aware Vitest guidance
when that runner is present, while retaining existing Bun/Jest/Node workflows.

## Baselines and refactors

Capture a relevant baseline before editing when cheap or when existing failures are likely.
If attribution later requires an old revision, use an isolated copy/worktree with a
comparable toolchain. HEAD is not the pre-edit state when the user has uncommitted changes.

Match diagnostics by cause and code location accounting for moved lines. An unchanged
consumer can be newly broken by an upstream edit; do not classify a failure as pre-existing
just because its file was untouched. When dependencies or setup differ, report attribution
as uncertain rather than comparing raw error counts.

For refactors, identify the behavior to preserve. Add characterization tests where valuable,
keep mechanical churn separable from semantic edits, and check callers affected by moves
or renames. A requested behavior change may include necessary restructuring in the same
patch; avoid unrelated rewrites.

## Completion

Re-run the checks affected by the final edit and inspect the final diff for accidental
changes, debug code, stale tests and generated artifacts. Summarize commands, scope and
results. Distinguish failed from unavailable and unexecuted. Do not claim a full-suite pass
from a filtered run, or claim type safety from a successful transpile-only build.
