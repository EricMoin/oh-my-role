# Rust domain map

Use this map to locate expertise for a concrete invariant or uncertainty. Effort
and review selection are defined only in [complexity-model.md](complexity-model.md).
This is not a mandatory repository scan, priority order or gate-count policy.

## Questions, implementation guidance and review

| Domain | Question that warrants attention | Implementation skill | Reviewer / report gate |
| --- | --- | --- | --- |
| `unsafe-ffi` | Can a safe caller violate validity, aliasing, lifetime, ownership, layout or foreign ABI/unwind obligations? | `rust-unsafe-ffi` | `rust-engineer--safety-reviewer` / `safety` |
| `async-concurrency` | Can suspension, interleaving, cancellation, overload or shutdown lose work, leak resources, deadlock or violate ordering? | `rust-async-concurrency` | `rust-engineer--async-auditor` / `async-audit` |
| `public-api` | Does an affected consumer observe a changed signature, bound, error, feature, MSRV or behavioral contract? | `rust-ownership-and-api` | `rust-engineer--api-reviewer` / `api` |
| `performance-hotpath` | Is there a workload-specific regression or optimization claim with a plausible cost mechanism and baseline? | `rust-performance` | `rust-engineer--perf-profiler` / `perf` |
| `cross-platform` | Does behavior depend on target, feature selection, host tools, native libraries, pointer width, no_std or compiler support? | `rust-cargo-platform` | `rust-engineer--cross-platform-checker` / `cross-platform` |

`rust-testing` supports every domain. Ownership and error contracts also matter in
private code; public visibility is not a prerequisite for implementation guidance.
The source tracer (`rust-engineer--source-tracer`, skill `rust-source-tracing`)
resolves a specific external behavior question for any domain. It returns evidence,
not another review verdict.

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
