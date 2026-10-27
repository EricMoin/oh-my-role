---
name: rust-async-gate
description: Review changed Rust concurrency paths for cancellation, task lifecycle, synchronization, backpressure and executor progress using the selected runtime's contracts.
---
# Rust Async Gate

## Establish the concurrency boundary

Locate the actual runtime and version, task owners, shutdown path, shared state and producer/consumer relationships affected by the change. Follow callers and cancellation points beyond the diff when they determine whether an invariant survives. Read `references/schemas.md` for the report contract; the criteria below apply to the assigned risk, not every async function in the workspace.

## Review decisions

- Trace interruption at relevant suspension points: dropping an in-flight future, timeout, a losing `select!` branch, task abort or runtime shutdown. Determine which state changes already happened and whether retry or cleanup preserves the operation's contract. Some operations deliberately complete in a separate task; cancelling the waiter need not cancel the work.
- Establish who owns task completion and failure. Dropping Tokio's `JoinHandle` **detaches** the task; it does not abort it. Intentional detached work can be valid. Require joining, cancellation or another lifecycle mechanism when failure observation, shutdown or resource ownership requires it. `abort()` is not itself a graceful shutdown protocol, and a running `spawn_blocking` task generally cannot be aborted.
- Match channel semantics to pressure and delivery requirements. Bounded queues can enforce backpressure; unbounded queues can be acceptable when independently bounded work or resource controls justify them. `oneshot` carries one value and `watch` retains the latest value; neither takes an arbitrary queue capacity. Check producer growth, slow receivers, lag or overwrite behavior and closure propagation rather than demanding one channel design everywhere.
- Distinguish `Send` from `Sync`. Tokio `spawn` requires the future and output to satisfy its `Send` and lifetime bounds; it does not require every captured value to be `Sync`. Local-task APIs have different constraints. Investigate actual compiler diagnostics and unsafe trait implementations, not imaginary lint suppression of these type errors.
- A short synchronous critical section using `std::sync::Mutex` can be appropriate when its guard does not cross `.await` and contention is acceptable. Blocking acquisition while another task holds the lock across suspension can deadlock or starve the executor. An async mutex permits suspension with a guard but does not remove lock-order cycles or reentrancy hazards. Trace the dependency cycle before declaring a deadlock.
- Assess synchronous I/O and CPU work by duration, frequency and executor behavior. Offloading can protect progress, but adds its own concurrency and shutdown costs; do not require `spawn_blocking` for every synchronous operation. Check admission control where offloaded work can accumulate.
- For `select!`, examine cancellation semantics and branch priority under the expected load. Biased ordering can be intentional; default fairness is not a universal starvation proof. For custom futures and pin projections, verify wake registration, state transitions and pinning invariants relevant to the change.

## Evidence and verification

Prefer a focused regression or shutdown test that exercises the identified interruption or scheduling case. Compiler checks establish type bounds; lint results highlight possible lock misuse. Existing Loom models, traces or runtime diagnostics can add evidence for their modeled schedules and workload, but neither their absence nor a successful run is a universal concurrency verdict.

Record the runtime, features, reviewed snapshot and actual check outcomes. Preserve repository content while running assigned checks. If a critical lifecycle or cancellation guarantee cannot be established from local code, consult the pinned runtime documentation or source and report the remaining unknown precisely.

## Verdict

Return gate `async-audit` using `references/schemas.md` with stable issue ids. A blocker needs a concrete loss, inconsistent state, unbounded resource path, deadlock, starvation or broken shutdown mechanism and supporting evidence. State the required behavior without mandating a particular token, lock or channel library. Pass when the assigned risk is resolved; revise demonstrated defects; escalate missing essential evidence. Untested optional alternatives and style preferences are advisory.

## Authoritative references

The following are Tokio references; use equivalent contracts for another runtime and resolve the installed version before relying on version-sensitive details:

- [JoinHandle](https://docs.rs/tokio/latest/tokio/task/struct.JoinHandle.html): detachment and completion observation.
- [Mutex](https://docs.rs/tokio/latest/tokio/sync/struct.Mutex.html): synchronous versus asynchronous mutex use.
- [Synchronization primitives](https://docs.rs/tokio/latest/tokio/sync/index.html): channel semantics and backpressure.
- [spawn](https://docs.rs/tokio/latest/tokio/task/fn.spawn.html) and [spawn_blocking](https://docs.rs/tokio/latest/tokio/task/fn.spawn_blocking.html): task bounds and blocking-task cancellation limits.
- [select!](https://docs.rs/tokio/latest/tokio/macro.select.html): fairness and cancellation safety.
