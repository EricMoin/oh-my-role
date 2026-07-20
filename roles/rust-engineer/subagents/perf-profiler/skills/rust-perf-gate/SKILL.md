---
name: rust-perf-gate
description: Performance gate for Rust Perf Profiler. Reviews allocation patterns, clone() calls, collection selection, cache locality, monomorphization bloat, benchmark methodology, and binary size impact.
---
# Rust Performance Gate

## Mission

Confirm that the proposed change does not introduce performance regressions — excessive allocations, unnecessary clones, suboptimal collection types, cache-unfriendly data layout, monomorphization bloat, or benchmark methodology issues — and that optimization decisions are supported by profiling evidence rather than intuition. Rust's zero-cost abstraction principle means default choices are efficient, but bad patterns (hobby allocations in hot paths, defensive clones) are still easy to introduce.

## Inputs

- Engineering State block from the rust-engineer containing: `performance_context` (baseline measurements, hot path description, allocation/deallocation pattern, I/O boundaries, latency/throughput targets), `cargo_workspace`, and `edition`.
- Code diff for the change under review, with focus on `clone()`/`to_owned()` calls, `Box`/`Vec`/`String`/`HashMap`/`Arc` allocations, `#[inline]` annotations, loop bodies, and collection usage.
- Reference documents: `references/rust-domains.md` for the performance-hotpath domain detection signals and gate scope; `references/schemas.md` for the gate report contract.
- Optional: `cargo criterion` output (against baseline), `dhat-rs` heap profile, `perf` + `flamegraph` output, `cargo bloat` output, or LLVM optimization remarks.

## Required Checks

- Allocations in hot paths are justified and minimized: no `Box::new`, `Vec::push`, `String::push_str`, `Arc::new`, or `HashMap::insert` inside loops that execute more than a few hundred iterations. If present, cite profiling evidence that shows the allocation is not a bottleneck.
- `clone()`/`to_owned()`/`to_string()` calls on potentially large data types in hot paths are justified with a comment explaining why borrowing is not possible. Prefer `Clone::clone_from` for reuse or `mem::take`/`mem::replace` for in-place mutation.
- Collection type selection is appropriate: `SmallVec`/`ArrayVec` for small fixed-capacity collections on the stack, `Vec` for dynamic contiguous storage, `HashMap`/`BTreeMap` based on key ordering requirements, `HashSet`/`BTreeSet` for uniqueness.
- `#[inline]`/`#[inline(always)]` annotations are used sparingly and justified by hot path profiling — not applied speculatively. `#[inline(always)]` in non-hot code can cause code bloat and cache pressure.
- Cache locality is considered for hot structures: array-of-structs (`Vec<Point>`) vs struct-of-arrays (`Points { xs: Vec<f32>, ys: Vec<f32> }`) trade-off is evaluated based on access pattern.
- False sharing of atomic/cell fields is prevented: `#[repr(align(64))]` or padding on hot contended fields in concurrent data structures.
- Benchmarks exist for the hot path and are reproducible: Criterion or Divan with measured warmup iterations, sufficient measurement time (≥5s), and statistical analysis (confidence intervals, noise threshold).
- A benchmark baseline (e.g., `main` branch tag) is established for comparison — `cargo criterion --baseline main` to detect regressions.
- Binary size impact is evaluated: `cargo bloat --crate <name>` is reviewed for unexpected symbol growth, excessive monomorphization, or duplicate instantiations.
- LLVM optimization remarks are reviewed for hot path functions: use `-C llvm-args=--remarks` or `-C llvm-args=--pass-remarks=inline` to surface missed inlining or unrolled loops.
- If `unsafe` optimization is used (unchecked indexing, unchecked arithmetic), the safety justification in the SAFETY comment is verified and a safe fallback exists in test.
- No premature optimization: performance work is driven by profiling evidence, not by speculation. The diff should not include optimization that is not on a verified hot path.

## Pass Criteria

- **Pass**: Hot path allocations are justified and minimal. No defensive clones in hot paths. Collection types are appropriate. Inline annotations are backed by profiling. Binary size is reviewed. Benchmarks are reproducible and baseline-compared.
- **Fail**: Allocation in a hot loop without justification. Defensive clone of large data. `#[inline(always)]` applied speculatively. Benchmark lacking statistical methodology. Binary bloat from excessive monomorphization.
- **Conditional Pass**: Minor clone/alloc inefficiency exists in a non-hot path. Binary size not reviewed for a performance-sensitive crate. Benchmark exists but baseline comparison is not yet set up.

## Output Format

Return a `gate_report` inside a ```result fence with these fields:

```yaml
gate: perf
status: pass | fail | needs-user-input
evidence:
  - "src/parser/hotpath.rs:45 — Vec::reserve(1024) before loop: 0 allocations in loop body"
  - "cargo criterion --baseline main: hotpath latency unchanged (p50: 12.3µs vs 12.1µs baseline)"
  - "cargo bloat --crate parser: total 48KB, no unexpected symbols"
blocking_issues:
  - "src/parser/hotpath.rs:33 — String::clone() on 50KB payload in every iteration (10K iterations/s)"
  - "src/parser/hotpath.rs:12 — #[inline(always)] without profiling evidence — likely code bloat"
required_revisions:
  - "Replace clone() with Cow<str> or Arc<str> to share the payload in src/parser/hotpath.rs:33"
  - "Remove #[inline(always)] or add benchmark evidence showing ≥10% improvement"
advisory_notes:
  - "Consider adding dhat-rs heap profiling to CI for allocation regression detection"
verification: "cargo criterion --baseline main -p <crate> 2>&1 | tail -20 && cargo bloat --crate <name>"
```

## Review Flow

1. Load the Engineering State and identify the `performance_context` — hot paths, baseline, targets.
2. Scan the diff for allocation sites (Box, Vec, String, HashMap, Arc) and clone() calls in loop bodies.
3. Review collection type selection: is SmallVec or ArrayVec more appropriate for small fixed-capacity uses?
4. Check `#[inline]` annotations — are they on hot paths? Are they backed by benchmark evidence?
5. If benchmarks exist, review methodology: warmup, measurement time, sample size, baseline comparison.
6. If binary size is a concern, review `cargo bloat` output for unexpected symbols.
7. Compile findings into a gate report with file:line citations and benchmark output.

## Antipatterns to Detect

- **Defensive clone**: `s.clone()` when `&s` would work — copies large data unnecessarily.
- **Allocation in loop**: `vec.push()` in a hot loop without `Vec::reserve` first — causes repeated reallocation.
- **#[inline(always)] everywhere**: Applied by intuition, not profiling — increases binary size and I-cache pressure.
- **Wrong collection**: `HashMap` when `Vec<(K,V)>` with linear search is faster for <10 items. `Vec` when `SmallVec<[T; N]>` avoids heap allocation.
- **Missing benchmark baseline**: Benchmarks exist but compare against a moving target (no `--baseline`).
- **Array-of-structs on column-access pattern**: Accessing single fields across many structs causes cache-line waste.
- **False sharing**: Two atomics on the same cache line, each written by a different thread — throughput collapses on contention.
- **Premature optimization**: Optimization applied without profiling evidence that the code is a bottleneck.
