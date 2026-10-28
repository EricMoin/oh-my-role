# Rust expert routing

Route by the actual implementation responsibility or evidence question. The parent
investigates enough to choose experts; every worker loads its own entry skill and
relevant linked guidance before acting. This map sets neither node quotas nor a
mandatory repository scan.

| Concern | Implementation agent / skill | Read-only review agent / gate skill |
| --- | --- | --- |
| Safe logic, ownership, borrowing, traits, errors and consumer contracts | rust-engineer--ownership-api / rust-ownership-and-api | rust-engineer--ownership-api-reviewer / rust-api-gate |
| Futures, tasks, cancellation, synchronization and shutdown | rust-engineer--async-concurrency / rust-async-concurrency | rust-engineer--async-concurrency-reviewer / rust-async-gate |
| Unsafe validity, provenance, initialization, ABI and foreign ownership | rust-engineer--unsafe-ffi / rust-unsafe-ffi | rust-engineer--unsafe-ffi-reviewer / rust-safety-gate |
| Cargo, features, workspaces, build scripts, MSRV, targets and no_std | rust-engineer--cargo-platform / rust-cargo-platform | rust-engineer--cargo-platform-reviewer / rust-platform-gate |
| Workload costs, profiling and measured optimization | rust-engineer--performance / rust-performance | rust-engineer--performance-reviewer / rust-perf-gate |

`rust-engineer--verification` supplies independent general behavior, architecture,
regression review and evidence convergence using rust-verification/rust-testing.
`rust-engineer--source-tracer` supplies exact-version source evidence using
rust-source-tracing. Both stay source-read-only.

The implementation roles only implement and repair. Their separate reviewer counterparts
review or gather independent evidence without changing source. Never assign both duties
to the same node, agent role or session, including by switching modes after implementation.
General safe Rust belongs to ownership-api even without public visibility or special risk
keywords; verification covers general behavior beyond the API-specific gate criteria.

`rust-testing` supports all implementation nodes. For interacting domains, sequence
shared-source writers, forward accepted revision context, and converge dedicated reviewers'
evidence into one repair verdict. Independent read-only questions remain parallel.

## Discovery hints and counterexamples

Scope searches to the change and relevant callers; inspect the surrounding code.
Search terms below are clues, not complete detectors.

| Clues | What to inspect | Why the clue is not a classification |
| --- | --- | --- |
| `unsafe`, raw pointer operations, foreign declarations, representation attributes | Caller preconditions, safe wrappers, allocation provenance, initialization/drop and foreign lifetime | An untouched unsafe module does not make a README edit safety work; macro-expanded or delegated unsafe behavior may need inspection without a local keyword |
| Await points, task handles, custom futures, locks, channels and atomics | Owner, wake/progress conditions, lock scope, cancellation and shutdown | An async operation can be risky without `spawn`; an imported helper can hide task creation |
| Visibility, exports, trait implementations, feature or error changes | Actual reachable consumers, construction/pattern matching and observable guarantees | `pub` in an internal module need not be exported; private changes can still alter public behavior |
| Allocation, copies, loops, syscalls, contention and serialization | Representative workload and measured bottleneck | A `Vec` or loop is not proof of a hot path; allocation count alone is not an end-user performance result |
| Conditional compilation, target dependencies, build scripts and generated code | Supported configuration matrix and host/target boundary | `#[cfg(test)]` alone is not platform risk; absence of cfg does not prove portable behavior |

## Select the verification that can expose failure

- Safety: write the invariant and check every construction, access and destruction
  path. Use focused tests, Miri or sanitizers where supported. Their passing runs
  cover executed paths; they do not replace the safety argument.
- Concurrency: exercise relevant pending/cancel/close/shutdown transitions and
  interleavings. Use deterministic coordination; model checking or stress testing
  needs a named property and recorded limits.
- API: compile affected callers, run doctests or compile-fail cases where relevant,
  and inspect semantic compatibility. A semver tool is supporting evidence, not
  proof of all behavioral contracts.
- Performance: compare a stable baseline and representative workload under the
  same profile, toolchain, features and environment. Report variance and tradeoffs;
  do not invent a universal percentage threshold.
- Platform: separate type checking, linking and execution of affected target and
  feature combinations. Record unavailable toolchains, SDKs or runners precisely.

Use the project's existing tooling first. Do not install every tool in this list
or run a blanket matrix because a keyword matched. A supported claim must retain
its scope, and an unavailable essential check remains an evidence gap.
