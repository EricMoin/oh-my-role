# Turn a change into useful test evidence

Use when adding regression tests, testing a generic API, diagnosing flaky async tests or
checking whether a passing suite actually covers the claim. Keep the project's runner and
conventions. A graph evidence branch is a container for checks; it is not a reason to add
a framework or a new testing layer.

## Write the claim before choosing the mechanism

Describe one observable rule and a case that violates it. Then choose the cheapest test
that can distinguish the corrected implementation from that case. For a queue, a useful
claim might be that cancellation prevents a waiting job from starting; merely checking
that cancel was called on a mock proves a different claim.

| Claim | Suitable evidence | Common false positive |
|---|---|---|
| Input/output behavior | Execute through the public seam and assert the result/effects | Test repeats the implementation's calculation |
| Caller type relationship | Compile supported calls and deliberately rejected calls | Test runner transpiles type assertions away |
| Cancellation/cleanup | Control operation completion and observe lifetime/cleanup | Assert only which helper was called |
| Consumer installability | Install the packed artifact into an isolated consumer | Test imports source via a workspace alias |
| Refactor preserves behavior | Keep meaningful caller assertions while changing internals | Rewrite expected values to match the new implementation |

Build focused examples incrementally when that helps expose a bug, then generalize only
when a second case requires it. Do not demand a user-approved testing plan for every small
regression or enforce an arbitrary coverage percentage.

## Compile-time and runtime suites are separate evidence

Find which command type-checks each test file. If Vitest is already installed, its
expectTypeOf/assertType assertions require compiler checking; a normal runtime invocation
alone does not establish their type claims. Inspect typecheck enablement, include patterns
and source-error handling in the installed version. A file may be collected by both
runtime and typecheck configurations, which matters for deliberately invalid calls.

Use the existing typecheck command or runner integration. Keep compile-only negative
examples out of runtime execution. Do not use a cast or a skipped test to silence the
contract the test is supposed to enforce. Existing Bun/Jest/Node test projects can use
their own runtime runner with a separate compiler check; there is no need to migrate.

## Control async causes, not elapsed wall time

Use controllable operations to reach the state under test: a promise the test resolves,
a local response fixture, or the project's clock abstraction. For a deadline test, start
the operation, reach the pending state, advance the chosen clock, then await completion
and inspect cleanup. Check both cancellation before starting and during work when those
are relevant behaviors. Always restore test-owned state in cleanup paths.

When using fake timers, establish which timers are mocked and whether advancing them also
settles the asynchronous work involved. Verify the runner's version-specific APIs rather
than combining real network timeouts with a fake clock and arbitrary sleeps. Global timer,
environment and module-state changes can make concurrently executed tests interfere.

Mock a boundary to control a cause, not to reproduce the behavior being tested. If a module
reads configuration at import time, changing the environment after import may not exercise
that path. Prefer an existing injection seam or a properly isolated import/process fixture.
For ESM mocks, inspect the runner's module loading/hoisting rules before moving imports or
capturing local variables in a mock factory.

## Report enough to judge the result

Name the observable contract, the command that checked it and the relevant source state.
Include the concrete failed assertion or unavailable environment in negative evidence.
The graph review decides acceptance across all reports; an evidence worker can complete
its investigation while discovering a product defect. Preserve that distinction.

## Technical references

Check [Vitest's type-testing documentation](https://vitest.dev/guide/testing-types.html)
for actual runner behavior and the installed version's configuration.
