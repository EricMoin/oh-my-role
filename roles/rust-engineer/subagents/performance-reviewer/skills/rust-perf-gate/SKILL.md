---
name: rust-perf-gate
description: Review Rust performance changes and claims against representative workloads, measured bottlenecks, resource budgets and reproducible comparison evidence.
---
# Rust Performance Gate

This skill belongs to the dedicated read-only performance-reviewer. Follow the
[node contract](../../../../references/node-contract.md) and
[report contract](../../../../references/schemas.md). Review mode returns a gate
verdict; evidence mode returns complete/partial findings without repair routing
and does not issue a gate verdict.
Never implement or repair code under review. Read
[rust-testing](../../../../skills/rust-testing/SKILL.md) when judging regression
coverage, and derive expectations independently from requirements and actual code.

## Establish what matters

Identify the affected workload, data scale, operating conditions and accepted cost: latency distribution, throughput, memory, CPU, binary size or build time. Locate the existing baseline and any claimed improvement. Ordinary code containing a `Vec`, `clone` or loop does not automatically need profiling. Read `references/schemas.md` for the report contract.

## Review decisions

- Follow measurement to the relevant hot path or resource growth mechanism. Distinguish observed cost from a hypothesis, and separate algorithmic growth from a small constant cost. Check whether representative large, empty or skewed inputs change the conclusion.
- Compare equivalent work and outputs using the same workload, build profile, features, target and measurement method. Account for warmup, process startup, allocator state, I/O, contention and variance when they affect the claim. Use the project's acceptance budget and meaningful effect size; do not invent a universal improvement percentage, benchmark duration or loop-count threshold.
- Attribute allocations accurately. `Vec::push` does not allocate on every call when capacity remains; zero-sized elements need no storage allocation. Distinguish capacity growth from reuse, payload cloning from reference-count increments, and owned conversion from borrowing. Removing ownership may complicate lifetimes or retain larger objects; consider the total cost.
- Evaluate collection choice using actual operations and data distribution. Look for evidenced quadratic work, repeated parsing, redundant copies, unnecessary retention or contention before proposing a replacement structure. A plausible optimization is a hypothesis until evidence supports its benefit.
- Treat generics, trait objects, inlining, batching and caching as tradeoffs among runtime cost, compile time, binary size, memory and invalidation complexity. Cache locality and false sharing depend on layout and hardware; do not assume one cache-line width for every target.
- Preserve correctness and safety constraints under optimization. If a benchmark avoids the real synchronization, cancellation, parsing or validation work, it may not support the production claim. Unsafe speedups require a separate soundness argument; faster measurements do not supply one.

## Evidence and verification

Prefer the project's existing benchmark or profiler appropriate to the suspected mechanism. Record the compared snapshots, commands, workload and relevant environment, with measured values and uncertainty. Inspect whether setup, dead-code elimination, sample independence or changed outputs invalidate the comparison. A focused allocation count or structural cost argument may settle a narrow resource issue without a full profiling suite.

Execute assigned checks without changing source, fixtures, manifests or lockfiles. A missing optional profiler is not a defect. When essential comparison data cannot be obtained, state what conclusion remains unsupported; do not label unmeasured code faster or slower. A reproducible workload-driven resource failure can justify revision even when a particular benchmark tool is unavailable.

## Verdict

In review mode, return gate `performance` using `references/schemas.md` and stable issue ids. Block on an evidenced regression, violated resource budget, concrete resource growth defect or invalid evidence underlying an acceptance-critical claim. State the workload and consequence. Pass for the resolved assigned risk; revise demonstrated defects; escalate an essential unverified performance claim. Unmeasured tuning ideas belong in advisory notes and must remain labeled as hypotheses.

## Authoritative references

Use the project's tool versions and workload when interpreting these references:

- [Vec guarantees](https://doc.rust-lang.org/std/vec/struct.Vec.html#guarantees): capacity, allocation and growth behavior.
- [Arc](https://doc.rust-lang.org/std/sync/struct.Arc.html): shared ownership and cloning semantics.
- [Cargo profiles](https://doc.rust-lang.org/cargo/reference/profiles.html): optimization and build-profile settings that affect comparisons.
- [black_box](https://doc.rust-lang.org/std/hint/fn.black_box.html): best-effort optimization barriers and their limits.
