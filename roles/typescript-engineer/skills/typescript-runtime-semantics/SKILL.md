---
name: typescript-runtime-semantics
description: Implement and debug async control flow, cancellation, streams, resource cleanup and I/O in TypeScript. Use when correctness depends on JavaScript execution or differences among the project's supported runtimes.
---

# Runtime behavior

Identify the runtime and execution path the project supports: built JavaScript, a TS loader,
a bundler or native TypeScript execution. Compiler `target`, declaration libraries and
runtime API availability are separate. Limit portability work to the promised environments.
Use [runtime checks](references/runtime-portability-matrix.md) when crossing runtimes.

## Async work has an owner

Every started task should have an owner that awaits it, handles its rejection, or deliberately
supervises its lifetime. `void promise` expresses discarded return value; it does not catch
rejections. Preserve intentional background work and give it an error/shutdown policy.

- Await serially when operations depend on order. Parallelize independent I/O only within
  the concurrency and memory bounds the workload allows.
- `Promise.all` fails on a rejection but does not cancel sibling operations. Decide whether
  siblings should finish, be cancelled, or have their outcomes collected.
- A timeout implemented with `Promise.race` stops waiting; it does not stop the underlying
  operation. Propagate an `AbortSignal` to operations that support cancellation.
- Handle already-aborted signals as well as later aborts. Remove listeners and clear timers
  on completion; release resources in failure and cancellation paths too.
- Retrying a non-idempotent operation can duplicate effects. Follow the API's retry contract,
  use bounded attempts/backoff where appropriate, and do not retry cancellation blindly.
- `async` does not make CPU-bound computation parallel. Use workers only when measured cost
  justifies serialization, startup and coordination overhead.

## Streams and bounded resources

Respect backpressure. For Node writable streams, a false `write` result means wait for
capacity before producing more. Prefer the existing pipeline utilities for coordinating
errors and cleanup. For Web Streams, use the writer/reader contracts; bridges between the
two stream families can change buffering, errors and cancellation behavior.

Avoid accumulating an unbounded input with `readFile`, `arrayBuffer`, `text` or an array of
promises. Choose whole-input processing when size is bounded and streaming when it matters.
Decode chunked text incrementally so multibyte characters split across chunks survive.

Check HTTP status separately from transport success. Consume or cancel response bodies as
appropriate. Do not assume every body can be replayed for retries. Close files, sockets,
workers and child processes according to the owning API's contract.

## Errors and lifecycle

Preserve useful error context and causes. Narrow caught values before accessing properties;
JavaScript can throw values that are not `Error` instances. Use the project's established
throw/result convention instead of introducing a universal replacement.

`instanceof` can fail across realms or duplicate package instances. At serialized boundaries,
validate an intentional error shape and stable code; a string `name` alone is not proof of
origin. Keep secrets and sensitive payloads out of error messages and logs.

For a service or CLI, stop accepting work, drain or cancel in-flight operations, release
resources and enforce a bounded shutdown where needed. Immediate process exit can truncate
output and skip cleanup; use the project's normal exit path. A global uncaught-error hook
is not evidence that continuing after a corrupted state is safe.

## Verify failure paths

Exercise the behavior changed: rejection, cancellation before/during work, partial failure,
resource release, concurrency bounds or exit status. Prefer controlled deferred operations
and observable cleanup over arbitrary sleeps and exact timing assertions. Use child-process
fixtures for exit behavior. A symbol-presence probe proves availability, not correctness;
run the relevant behavior in supported environments that are available and state gaps.
