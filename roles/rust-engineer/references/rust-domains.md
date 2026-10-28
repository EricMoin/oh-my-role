# Rust expert routing

Route by the actual implementation responsibility or evidence question. The parent
investigates enough to choose experts; every worker loads its own entry skill and
relevant linked guidance before acting. This map sets neither node quotas nor a
mandatory repository scan.

| Concern | Agent | Implementation skill | Review criteria |
| --- | --- | --- | --- |
| Safe logic, ownership, borrowing, traits, errors and consumer contracts | rust-engineer--ownership-api | rust-ownership-and-api | rust-api-gate for API concerns; independent verification covers general behavior |
| Futures, tasks, synchronization, cancellation, channels and shutdown | rust-engineer--async-concurrency | rust-async-concurrency | rust-async-gate |
| Unsafe validity, provenance, initialization, ABI and foreign ownership | rust-engineer--unsafe-ffi | rust-unsafe-ffi | rust-safety-gate |
| Cargo, features, workspaces, build scripts, MSRV, targets and no_std | rust-engineer--cargo-platform | rust-cargo-platform | rust-platform-gate |
| Workload costs, profiling and attributable optimization | rust-engineer--performance | rust-performance | rust-perf-gate |
| Independent behavior, architecture, regression checks and evidence fan-in | rust-engineer--verification | Read-only; rust-testing and relevant ownership guidance | rust-verification |
| Exact-version dependency, compiler or platform uncertainty | rust-engineer--source-tracer | Read-only; rust-source-tracing | Source evidence report, never product approval |

Domain experts support implement, evidence and review in separately scoped nodes.
Choose a separate review session for independent judgment; one node must not review
its own implementation. Combine closely related concerns in one expert assignment;
use multiple experts when their responsibilities or evidence differ. General safe
Rust does not require a public API or one of the special risk-domain keywords.

`rust-testing` supports all implementation nodes. For interacting domains, sequence
shared-source writers, forward accepted revision context, and converge evidence into
one repair verdict. Independent read-only questions remain parallel.

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
