---
name: rust-performance
description: Diagnose and improve Rust performance using representative workloads, measured costs and reproducible comparisons. Use for latency, throughput, allocation, contention or binary-size problems and optimization claims.
---

# Performance implementation

Define the workload and metric before choosing an optimization. Capture input sizes,
distribution, concurrency, relevant features, build profile, toolchain and target so the
baseline describes the production concern. If the bottleneck is unknown, measure enough
to locate it before changing representations or introducing unsafe code.

## Choose a change with an attributable effect

- Investigate algorithmic work, repeated I/O and redundant computation before local
  instruction choices. A change that improves a microbenchmark can worsen end-to-end
  latency, memory use or startup.
- Distinguish allocation, reallocation, cloning and reference-count updates. A `Vec::push`
  need not allocate when capacity suffices; reserving excessively can waste memory.
  Measure retained size as well as allocation count when lifetime changes.
- Borrow when the lifetime fits. Clone, copy, reuse buffers or share ownership according to
  the actual ownership contract and measured cost. `Arc` adds synchronization and retention
  costs; it is not an automatic improvement over an owned value.
- Choose collections from lookup/update patterns, ordering, size distribution and memory
  layout. Small fixed-size workloads and large dynamic workloads may favor different
  choices. Avoid universal item-count cutoffs or adding a collection dependency by habit.
- Investigate contention and task scheduling before substituting lock-free structures.
  Padding, sharding and batching trade memory, fairness and latency for throughput; measure
  the relevant distribution rather than only aggregate throughput.
- Evaluate generics, dynamic dispatch, inlining and code size together. Preserve an
  existing abstraction when the evidence does not justify its API or compile-time cost.
  An annotation is not a performance result.
- Keep correctness and safety obligations explicit. An unsafe fast path needs an invariant
  argument as well as representative performance evidence; a benchmark does not supply
  permission to weaken input validation or protocol behavior.

## Design the comparison

Use the project's benchmark/profiling tools where they answer the question. Compare
baseline and candidate under equivalent configurations and realistic inputs. Isolate
setup, I/O or allocation only if the claimed metric excludes that work. Include cold-start
or teardown costs when they matter to the user.

Prevent dead-code elimination or unrealistic constant folding in the measured operation.
`std::hint::black_box` is a best-effort optimization barrier, not a guarantee of correctness,
constant-time behavior or faithful workload simulation. Check toolchain availability.

Record sample variation, outliers and environmental interference. Repeat when uncertainty
could change the decision; do not impose an invented minimum percentage improvement or
benchmark duration. For a regression fix, retain a useful baseline or reproducible scenario
when it fits existing infrastructure.

## Completion

Verify the affected behavior and compare the chosen metric, including material trade-offs.
If measurement is unavailable, describe the structural change and the expected mechanism
as unverified; do not claim a measured speedup. Stop when the requested performance target
is supported or the remaining constraint is identified, rather than optimizing unrelated
code revealed by the profiler.

## Source

[Rust black_box documentation](https://doc.rust-lang.org/std/hint/fn.black_box.html) explains
the optimization-barrier limits relevant to benchmark design. Consult the installed
profiler or benchmark library's versioned documentation for its measurement controls.
