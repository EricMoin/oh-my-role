---
name: test-design
description: Design regression and integration tests that detect changed behavior, then run the affected test scope
---
# Behavior-focused testing

## Choose coverage from the change

Read repository instructions, the implementation diff, relevant callers and nearby
tests. Identify the behavior promised by acceptance criteria and what could regress.
Map each material behavior to an existing test or a missing case before adding files.
Do not duplicate adequate coverage or create tests for trivial prose/mechanical edits
solely to show activity. Reuse the repository's runner, fixtures and conventions.

Choose cases for the actual risk: normal use, a meaningful boundary or invalid input,
state transitions, error propagation, cleanup or interaction between components when
the change affects them. Do not add an exhaustive generic matrix unrelated to the
change. For a behavior change, update obsolete expectations to the new requirement;
for a refactor, preserve observable behavior. Explain intentional expectation changes.

## Make tests detect defects

Assert externally observable results, state or necessary effects, using explicit
expected values independent of the implementation. A useful test fails under a
plausible wrong implementation. Avoid assertions that only check truthiness, snapshots
of incidental structure, private helper call sequences or an expected value computed
by repeating the algorithm under test. Use public APIs unless an internal invariant
cannot be exercised meaningfully through them. Add tests, not production test hooks.

For a bug fix, try the regression on pre-fix code in an isolated copy or with a safe,
localized fault injection, then on the fixed code. Confirm the first failure is the
intended assertion, not a broken import, setup or unavailable dependency. Never undo
shared workspace changes to produce a red result. Record the observed failure and
success; if reproduction is unavailable, say why and describe what defect the new
assertion detects. Do not claim a red/green run that did not happen.

Use the lowest test layer that exercises the requirement. For cross-module behavior,
keep real in-process collaborators and add a focused integration case rather than
mocking away the interaction. Replace slow or uncontrolled external services with
existing fakes at their interface; mock only dependencies outside the behavior under
test. Assert failure handling when that path changes. Use unique temporary resources,
controlled clocks/randomness and explicit cleanup; avoid sleeps, shared global state,
real credentials and incidental network access unless the assigned test requires them.

## Select and run affected tests

Start with named cases or test files, then the affected package or integration slice
when needed. Include tests of affected consumers and shared fixtures/configuration;
a test adjacent to the edited file may not cover its callers. Use supported runner
filters rather than assuming a generic command. Inspect collected/selected tests and
counts: a zero-test run, skipped new regression or filter miss does not establish pass.
Run relevant existing tests as well as the new cases to detect local regressions.

Expand only when the diff, a diagnosed failure, runner limitations or an explicit
repository gate/user request warrants it. State the affected behavior the wider scope
covers and why the narrower command cannot. A monorepo, many unchanged tests, coverage
availability or the end of a task is not a reason for a full suite. Shared code changes
usually call for mapped consumer/package slices first. Do not add a global build,
typecheck or coverage gate automatically; follow repository policy for required gates.

Reuse successful current results under graph-protocol.md. After changing a relevant
input, rerun affected checks. No fresh full-suite run is needed merely because Test
is a new session or another worker already completed implementation. Diagnose failures
before repetition, and follow the bounded flakiness rules; a later pass does not erase
a failure. Do not lower thresholds, skip the regression, broaden normalization or
weaken assertions to make the change pass.

## Report the evidence

Use the normal Execution Report. Summarize changed behaviors covered, test locations,
why the selected commands cover the impact, and deliberate gaps. Each check records
the command, scope, status and exit result; include the selected tests/count when
available. Distinguish original regression reproduction, fixed-state checks, reused
results and unexecuted checks. A missing required check or unresolved regression is
incomplete work. Report out-of-scope production defects to Emperor with a reproducible
case and the needed correction; Test owns test improvements, not a separate verdict
on every approved implementation item.
