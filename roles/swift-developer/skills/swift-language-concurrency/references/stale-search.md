---
description: Use per-request identity to preserve the latest search state across same-query retries, cancellation and late errors.
---

# Keep the latest search visible

A user searches for “tea” and taps Retry. Both requests use the same text. If the retry succeeds first, a slow response or error from the first attempt can still replace the visible results. Give each invocation its own identity.

In an app, put the identity check in the existing owner that publishes the search state. This small model demonstrates ordering and uses a display string for failure. Keep the app’s existing observation mechanism and typed errors when its callers offer distinct recovery actions.

```swift
import Foundation

@MainActor
final class SearchModel {
    enum State: Equatable {
        case idle
        case loading
        case results([String])
        case failed(String)
    }

    typealias Loader = @Sendable (String) async throws -> [String]

    private let load: Loader
    private var latestRequest: UUID?
    private(set) var state: State = .idle

    init(load: @escaping Loader) {
        self.load = load
    }

    func search(_ query: String) async {
        guard !Task.isCancelled else { return }
        let request = UUID()
        latestRequest = request
        state = .loading

        let completion: State
        do {
            completion = .results(try await load(query))
        } catch is CancellationError {
            completion = .idle
        } catch {
            completion = .failed(error.localizedDescription)
        }

        guard latestRequest == request else { return }
        state = Task.isCancelled ? .idle : completion
    }
}
```

The main actor can start another search while `load` is suspended. On return, both success and failure pass through the same identity check. That check and the assignment run together without a suspension. The model defines “latest” by the order calls enter `search`. If a UI launches independent tasks whose scheduling can reorder user actions, issue the identity synchronously in the UI action and carry it into the async work.

The view or controller owns the calling task and can cancel it on dismissal. A loader may return normally after cancellation, or translate cancellation into a transport-specific error. The final task check handles both when the caller cancelled. A loader that independently cancels a request can map that event to `CancellationError`. If a cancelled loader takes time to finish, `.idle` appears when it returns. A screen requiring immediate reset can invalidate the request and reset state in its dismissal action.

## Prove the ordering

Use a fake loader that signals when each invocation has started and holds its continuation until the test chooses a result. Use two attempts at the **same** query. Wait for A to enter the loader before starting B, then wait for B to enter. After each chosen completion, await the corresponding task before reading `state`.

| Completion order | Expected outcome |
| --- | --- |
| B returns fresh results, then A returns old results | The fresh results remain visible. |
| B returns fresh results, then A throws an error | The fresh results remain visible. |
| A throws while B is pending | B's loading state remains visible until B completes. |
| The caller cancels the current search and its loader later returns results | The current search ends idle. A cancellation of an older attempt cannot reset a newer result. |

[Swift data isolation and suspension points](https://www.swift.org/migration/documentation/swift-6-concurrency-migration-guide/dataracesafety/) · [Swift task cancellation](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0304-structured-concurrency.md)
