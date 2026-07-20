---
name: rust-async-gate
description: Async gate for Rust Async Auditor. Reviews cancellation safety, backpressure, Send/Sync bounds, lock ordering, Pin safety, select! fairness, task lifecycle, and blocking-work prevention in async code.
---
# Rust Async Gate

## Mission

Confirm that every `.await` point in the proposed change is cancellation-safe, that all channels are bounded and provide backpressure, that no blocking work runs on the async executor, that lock ordering prevents deadlocks, and that spawned tasks have correct Send/Sync bounds and clear lifecycle management. Async Rust has unique failure modes (cancellation leaks, silent deadlocks, executor starvation) that are invisible in synchronous code — this gate exists to surface them systematically.

## Inputs

- Engineering State block from the rust-engineer containing: `concurrency_model` (task hierarchy, channel topology, shared-state ownership, lock ordering, cancellation strategy, backpressure design), `async_runtime`, `cargo_workspace`, and `edition`.
- Code diff for the change under review, with focus on `.await` points, `tokio::spawn`, channel creation, `Mutex`/`RwLock` usage, `select!` macros, `JoinHandle`/`JoinSet` usage, and `loop` bodies in async functions.
- Reference documents: `references/rust-domains.md` for the async-concurrency domain detection signals and gate scope; `references/schemas.md` for the gate report contract.
- Optional: loom test output, `tokio-console` captures, or clippy audit results.

## Required Checks

- Every `.await` point is cancellation-safe: if the future is dropped mid-`.await`, resources are cleaned up and shared state is left in a valid (not partially-updated) condition. Non-idempotent operations after `.await` must not be skipped on cancellation.
- All cross-task channels (`tokio::sync::mpsc`, `oneshot`, `watch`, `broadcast`, `crossbeam::channel`, `flume`) have explicit bounded capacity. Unbounded channels (especially `mpsc::unbounded_channel`) are justified with a comment explaining why producer-rate bounds prevent unbounded memory growth.
- No blocking work (`std::thread::sleep`, synchronous `Mutex::lock`, `std::fs` operations, CPU-bound computation) runs directly inside async functions — uses `tokio::task::spawn_blocking` instead, with justification.
- `Send + Sync` bounds are satisfied for all values held across `.await` in spawned tasks (compiler-enforced — verify no `#[allow]` of these warnings).
- No `.await` while holding a `std::sync::MutexGuard` (checked via `clippy::await_holding_lock`). `tokio::sync::Mutex` is used when the lock must be held across `.await`.
- Lock ordering is consistent across the codebase — no A→B / B→A inversion that could cause deadlock. If `loom` models exist, verify deadlock-freedom.
- Every `tokio::spawn`/`JoinHandle` has a clear lifecycle: handles are stored and awaited at shutdown, or cancelled via `AbortHandle`/`CancellationToken`. Detached spawns are intentional and acknowledged.
- `tokio::select!` branches are reviewed for fairness: biased branches are used only when priority is intentional and documented. Equal-priority branches use unbiased `select!` (default behavior).
- `CancellationToken` or `AbortHandle` is used for graceful shutdown of long-lived tasks — not just dropping the JoinHandle (which aborts without cleanup).
- Custom `Future` implementations have correct `poll` semantics: `Poll::Pending` is returned only after the waker is registered, and spurious wakeups are handled without incorrect state transitions.
- `Pin` safety is verified for self-referential async types — `pin-project` or `pin-project-lite` is used for safe projections.
- Backpressure is not an afterthought: bounded queues, throttling mechanisms, or load-shedding strategies exist at system boundaries.

## Pass Criteria

- **Pass**: All `.await` points are cancellation-safe. Channels are bounded. No blocking work on the executor. Lock ordering is consistent and verified. Task lifecycle is clear. `select!` fairness is reviewed. Send/Sync is satisfied.
- **Fail**: `.await` during `std::sync::MutexGuard` (deadlock hazard). Unbounded channel added without justification. Blocking work in async context. Cancellation-unsafe code that leaves state partially updated. Lock ordering violation. Spawned task with no lifecycle management.
- **Conditional Pass**: Cancellation safety is documented in comments but not verified by test. Loom models exist but do not cover all concurrency scenarios. Unbounded channels are justified but could be replaced with bounded ones.

## Output Format

Return a `gate_report` inside a ```result fence with these fields:

```yaml
gate: async-audit
status: pass | fail | needs-user-input
evidence:
  - "src/service/handler.rs:45 — .await in tokio::sync::Mutex scope, correct lock type"
  - "src/service/handler.rs:78 — CancellationToken wired for graceful shutdown"
  - "clippy: no await_holding_lock violations"
blocking_issues:
  - "src/service/handler.rs:33 — std::sync::MutexGuard held across .await at line 34"
  - "src/service/channels.rs:15 — unbounded mpsc channel without backpressure justification"
required_revisions:
  - "Replace std::sync::Mutex with tokio::sync::Mutex or restructure to avoid .await under lock"
  - "Bound mpsc channel capacity to 256 or add backpressure comment explaining why unbounded is safe"
advisory_notes:
  - "Consider adding loom models for the channel topology in handler module"
verification: "cargo check -p <crate> && cargo clippy -p <crate> -- -D clippy::await_holding_lock"
```

## Review Flow

1. Load the Engineering State and identify the `concurrency_model` and `async_runtime`.
2. Review every `.await` point in the diff for: cancellation safety, lock scope, and blocking work violations.
3. Trace channel topology: are all channels bounded? Is backpressure designed or accidental?
4. Identify all `tokio::spawn`/`JoinHandle`/`JoinSet` usage — is the lifecycle (spawn → work → join/cancel) clear?
5. Check `select!` blocks for biased branches that could starve alternatives.
6. If `loom` models are present, review deadlock-freedom. If absent and the change introduces complex concurrency, suggest loom.
7. Compile findings into a gate report with file:line citations.

## Antipatterns to Detect

- **Await-under-lock**: `.await` while holding `std::sync::MutexGuard` — deadlock on contention.
- **Unbounded channel as default**: Receives no backpressure and can OOM on slow consumer.
- **Blocking in async**: `thread::sleep` or synchronous I/O inside an async fn — stalls the entire executor.
- **Detached spawn with no lifecycle**: `tokio::spawn` where the handle is discarded — task runs forever or until abort on drop.
- **select! biased starvation**: Lower-priority branches may never fire on high event rates.
- **Cancellation-unsafe state**: Future dropped mid-`.await` leaves shared state inconsistent.
- **Missing CancellationToken**: Long-lived tasks lack a graceful shutdown signal.
