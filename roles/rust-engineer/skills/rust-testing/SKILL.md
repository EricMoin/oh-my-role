---
name: rust-testing
description: Select and implement Rust regression, API, feature, safety and concurrency checks from observable contracts. Use when designing tests, reproducing a defect or deciding what evidence establishes a change.
---

# Behavior-driven Rust verification

Start from the behavior that could be wrong: the triggering input or action, expected
result and plausible regression. Read existing test conventions and CI requirements.
Choose the narrowest check that can falsify the failure hypothesis; broaden for shared
behavior or a named remaining risk, not a file count or a fixed coverage quota.

## Choose the appropriate boundary

| Risk | Useful evidence |
| --- | --- |
| Wrong result or error handling | Focused test through the existing operation, including the relevant edge case |
| Public API compatibility or inference | Downstream consumer example, doctest or the project's compile-fail harness |
| Parser/protocol invariants | Known expected outputs, round-trip properties with an independent oracle where needed, or targeted fuzzing |
| Cancellation, wakeups or shutdown | Controlled task interleaving and observed completion/resource behavior |
| Unsafe memory or foreign ownership | Safe-wrapper boundary tests, supported Miri/sanitizer checks and actual foreign integration |
| Feature or platform exclusions | Separate checks of affected supported configurations, with compile/link/run distinguished |
| Performance claim | Equivalent baseline/candidate measurements of the relevant workload |

These are choices, not a requirement to introduce every testing tool. Property tests should
exercise an invariant; a round trip between two mutually incorrect functions can still
pass. A stress test samples schedules, while a model only covers its modeled state space.

## Preserve production design

- Test through the owner's behavior, observable state, outputs or dependency effects.
  Do not make a private item public, add a production test-only accessor, or introduce a
  wrapper with no production responsibility merely to reach a helper.
- Rust unit-test child modules can access their parent module's private items when a local
  implementation test is appropriate. Integration tests exercise the crate's public
  interface. Select deliberately; neither style is universally superior.
- Assert the contract rather than copying the implementation into the expectation. Prefer
  a concrete expected result or independent reference computation. Exact intermediate
  steps matter only when their ordering or visibility is part of the contract.
- Use existing fakes or a small boundary substitute when it makes failure controllable.
  Do not introduce a framework or abstraction solely for a one-off test.
- For a compiler error, first compile the reported example and inspect the failing caller.
  A plausible-sounding diagnostic in a task description is not a reproduced failure.

## Execute and interpret checks

Use actual package and target names. Cargo options precede `--`; test-harness options
follow it. Verify a focused filter ran the intended test rather than accepting a successful
zero-test run. Compilation-only checks and tests with ignored cases do not establish those
cases passed. Documentation changes can need doctests or rustdoc checks, not a full suite.

For concurrency, prefer explicit synchronization, controllable clocks and deterministic
setup over sleep-based ordering. Bound waits to make failures diagnosable, while checking
the actual completion condition. Clean up spawned work and external resources so a passing
assertion does not leave a task or process running.

Record the source/artifact configuration and checks actually executed. Separate existing
failures, new regressions and unavailable prerequisites. Fix regressions and recheck the
affected behavior; do not blindly repeat unrelated passing checks. A compiler success is
insufficient for a logic change, and missing required runtime evidence remains unverified.

## Source

[Cargo test documentation](https://doc.rust-lang.org/cargo/commands/cargo-test.html)
defines target selection, test filters and harness arguments. Resolve any library-specific
test APIs against the versions already used by the project.
