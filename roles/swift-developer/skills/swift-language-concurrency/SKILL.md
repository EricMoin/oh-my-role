---
name: swift-language-concurrency
description: Trace Swift reference and task lifetimes, actor reentrancy, cancellation, Sendable or protocol-isolation diagnostics, and Swift concurrency migration in an iOS app or its packages.
---

# Swift language and concurrency

For a compiler diagnostic, capture its full text, emitting target, offending declaration and first caller. For “main actor-isolated method cannot satisfy nonisolated requirement,” compare the imported protocol requirement in the selected SDK with the witness, then inspect who can invoke it. A synchronous delegate returning a decision must return it to that invocation. Wrapping the body in an asynchronous main-actor task changes timing and cannot supply that return value. If the protocol belongs to the app and every caller has the same isolation guarantee, express it on the contract. For a framework-owned requirement, preserve its contract and separate transferable data from actor-owned state. Build both the conformance and its actual consumer. [Swift migration guide on common problems](https://www.swift.org/migration/documentation/swift-6-concurrency-migration-guide/commonproblems/)

## Establish the contract

Read a real call site, its caller's isolation, and the target's resolved build settings. Record the Swift compiler version, language mode, default actor isolation, upcoming features and iOS deployment target separately. Swift 6 language mode enables full concurrency checking. A project using a Swift 6 compiler can still have targets in Swift 5 mode. Swift 6.2 introduced opt-in default main-actor isolation and changes to the execution of nonisolated async functions. Consult the active settings before assigning costly work to an executor. [Swift migration guide](https://www.swift.org/migration/documentation/swift-6-concurrency-migration-guide/enabledataracesafety/) · [Swift 6.2 concurrency changes](https://www.swift.org/blog/swift-6.2-released/)

- Before transferring a value across isolation, trace what it holds. A struct containing a shared mutable class can still expose aliases to the same storage.
- Trace delegates, retained closures and tasks to the owner that can end the work. A weak capture followed by `await self?.observeForever()` can retain the receiver for the whole method call. For a subscription, stop it at its actual owner boundary or acquire the owner only while handling an event. Verify release after exit even when the stream never emits again. A finite save may legitimately need to finish after the screen closes. [Swift automatic reference counting](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/automaticreferencecounting/)

## Diagnose a concurrency failure

For repeated requests with identical inputs, see the [search implementation and completion-order tests](references/stale-search.md).

| Symptom | Decision and proof |
| --- | --- |
| An earlier search overwrites a newer result | Capture the request identity in its owner's isolation domain. After the suspension, recheck identity and cancellation immediately before committing the result. Exercise A then B, deliver B then A, and assert that B is still visible. |
| Two tasks take the last slot in a process-local pool | If both use the same actor instance, check and reserve together before suspending. Release the slot on failure according to its lifetime. A second process or another device has its own memory. For shared inventory use the existing store transaction or server's atomic reservation and exercise two independent clients. |
| A spinner halts during image processing | Inspect the task's inherited isolation and profile the synchronous part of the work. An unstructured `Task` created on the main actor can still execute expensive code there. Keep UI mutations on their owner and choose an explicit execution boundary supported by this target. |
| The compiler flags a value crossing an actor | Identify every writer. Transfer an immutable representation, transfer exclusive ownership where supported, or perform the mutation on the owning actor. An `@unchecked Sendable` conformance requires an auditable synchronization invariant for *all* mutable fields and callers. |
| Work continues after dismissal | Determine which work should end with the screen. Structured children follow their parent task. If a button launched an unstructured root task, its children can outlive the screen too. Attach cancellation to the feature's actual lifetime, then check loops and callback bridges for cooperative cancellation. |

The isolation guide explains interleaving around suspension points. The structured concurrency proposal describes task inheritance, cancellation and parent-child lifetimes. [Data race safety](https://www.swift.org/migration/documentation/swift-6-concurrency-migration-guide/dataracesafety/) · [Structured concurrency](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0304-structured-concurrency.md)

## Verify an incremental migration

Enable complete checking as warnings in the affected Swift 5 language-mode target when planning an upgrade. Repair ownership at the declaration that owns it, then build both the target and representative callers before switching its mode. For a callback bridge, test successful completion, cancellation before registration, cancellation during the request and a late callback. Account for exactly one continuation resume on every terminal path. A clean build establishes compiler-checked isolation. Exercise the observed ordering bug separately. [CheckedContinuation](https://developer.apple.com/documentation/swift/checkedcontinuation)
