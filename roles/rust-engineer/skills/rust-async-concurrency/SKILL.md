---
name: rust-async-concurrency
description: Implement and debug Rust task lifecycles, cancellation, shared state, channels and shutdown. Use when correctness depends on concurrency or suspension, including code without explicit spawn calls.
---

# Async and concurrency implementation

Pin the runtime and resolved crate versions first. Trace the affected operation through
its callers, task owner, shared state and shutdown path. An `async fn`, imported spawn
helper, channel or custom `Future` can carry risk without a recognizable runtime keyword.

## Define lifecycle and suspension behavior

- Name who starts work, owns its handle, observes failure, requests shutdown and waits for
  completion. Detached work is valid only when its lifetime and failure handling are
  intentional. Dropping a Tokio `JoinHandle` detaches its task; it does not abort it.
- Separate a cancellation request from observed termination. Tokio `JoinSet` drop aborts
  its tracked tasks, but resource teardown still needs an appropriate completion strategy.
  Check the runtime's rules for blocking tasks, which may continue after an abort request.
- At each relevant suspension point, determine what happens if the future is dropped:
  ownership transfer, partial writes, queued messages, reserved capacity and external side
  effects. Make the operation resumable, transactional, idempotent or explicitly incomplete
  according to the real contract; a comment alone cannot make cancellation safe.
- In `select!`, inspect the cancellation behavior of losing branches and preserve progress
  that must survive repeated selection. Choose fairness or priority deliberately, including
  a termination condition for a branch that can remain continuously ready.

## Choose coordination from the workload

- A standard mutex can suit short critical sections over plain data when its guard never
  spans `.await` and contention is acceptable. An async mutex supports waiting without
  blocking the executor and holding its guard across suspension; those capabilities do not
  eliminate deadlocks or justify a broad critical section.
- Prefer ending the critical section before awaiting when possible. Consider a resource-owning
  task and messages when serialization and lifecycle belong together. Do not replace every
  lock with an actor or every synchronous operation with `spawn_blocking`.
- Offload blocking I/O or expensive CPU work when it would occupy executor threads for too
  long. Bound concurrent offloaded work and account for shutdown; an extra thread pool is
  not backpressure by itself.
- Select channel semantics before capacity: one result, latest state, broadcast events or a
  work queue. Tokio `oneshot` and `watch` do not take an arbitrary queue-capacity parameter.
  For queues, define admission, overload, loss and receiver-close behavior. Unbounded queues
  need an actual bound on retained work or another defensible resource policy.
- Apply `Send` and `Sync` requirements to the actual boundary. A movable spawned future may
  need `Send`; its captured values are not universally required to be `Sync`. Local tasks
  have different bounds. Avoid unsafe trait implementations as a compiler-error workaround.
- For manual `Future` implementations, verify wake registration, pending-state transitions
  and pinning against the implementation's contract; use a proven projection abstraction
  when it removes an otherwise unnecessary unsafe obligation.

## Verify the lifecycle

Exercise normal completion, cancellation during pending work, receiver closure, overload
and shutdown paths that the change affects. Coordinate tests with explicit signals or
barriers rather than relying on a lucky sleep. A timeout bounds a hang; it does not prove
all possible schedules are safe. Use model checking or stress tests for a named unresolved
concurrency risk, and report the schedules or properties actually covered.

## Sources

- [Tokio JoinHandle](https://docs.rs/tokio/latest/tokio/task/struct.JoinHandle.html): task
  ownership, detachment and abort behavior; select the project's version before applying.
- [Tokio mutex selection](https://docs.rs/tokio/latest/tokio/sync/struct.Mutex.html#which-kind-of-mutex-should-you-use):
  synchronous versus asynchronous locking trade-offs.
