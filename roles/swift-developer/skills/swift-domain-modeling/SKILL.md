---
name: swift-domain-modeling
description: Implement feature rules and value-type APIs in Swift when eligibility, state transitions, identity or repeated commands must agree across callers. Use for a shared product decision even when it first appears as a disabled control.
---

# Put a product rule where it can hold

Read a real call site and an example that distinguishes allowed behavior from refused behavior. Use the names the feature already uses. Find the authoritative write path and distinguish the **request**, the **accepted fact**, and the **UI showing that fact**. A button may predict eligibility from a snapshot. Another entry point, such as a swipe action or an app intent, can bypass that button. Check eligibility again at the commit boundary when state may have changed.

| What the evidence shows | Smallest useful design |
| --- | --- |
| The value is derived from other local state, such as whether a text filter has matches. | Compute it from the existing inputs. Keep temporary editing state in its view if it has the same lifetime. |
| Two callers submit the same edit but disagree on whether the draft is editable. | Give the existing value or owner one clearly named query or operation. Have both call it. Preserve established error or return semantics when a caller must explain refusal. |
| The states are mutually exclusive and carry different required data. | An enum with associated values can express the allowable cases. Keep independent facts independent: a document can be both pinned and archived. Preserve existing persistence and wire formats unless the change requires a migration. |
| More than one process or device can accept the same operation. | Enforce the rule at the shared store's atomic write or at the service that owns it. Reconcile a rejection or conflict in the client. In-memory serialization only covers writers that use the same owner. |

**Similar actions.** Removing a downloaded episode frees space on this device. Removing an episode from a shared library edits the collection for everyone. The menu may use the same verb for both, but the first depends on a local copy and the second on editing rights. Keep those decisions with their respective owners. Conversely, a screen and a shortcut that both remove the local copy should reach the same operation.

**Identity and failure.** Keep the existing entity ID when a selection or delayed write must find the same record after it changes. A filter, coordinate or formatting option can travel between screens as a value. Generating a UUID for each filter makes otherwise equal requests compare unequal when using synthesized equality. An empty draft slot and an unreadable saved draft need different recovery. Preserve that difference for callers.

**Mapping incoming data.** Reuse a feature value when its meaning, lifetime and error contract match the payload. Translate at the network or storage boundary where they diverge. For example, an older client may receive a new delivery status that it can display but cannot safely act on. Preserve an explicit unknown or unsupported outcome and the ability to read the record. Mapping it to an actionable status can enable the wrong command. A renamed JSON key alone can use `CodingKeys`. Add a separate representation when it protects a real semantic or compatibility boundary.

## A repeated command is different from a toggle

A reader can mark a book as finished from its detail or a shortcut. An existing record stores the first finish date. Replaying that intent should preserve the date. If the current model already owns that value, a method there is enough:

```swift
import Foundation

struct ReadingEntry {
    private(set) var finishedAt: Date?

    mutating func markFinished(at date: Date) {
        guard finishedAt == nil else { return }
        finishedAt = date
    }
}
```

Inspect the calls: the action supplies the date it observed, and a second invocation preserves the first one. A second Boolean for “finished” would need synchronization with the date. In an existing app, apply this operation to the current record at the write boundary. Two independent copies can both see an empty date, so a shared store needs its own conditional write if first-writer-wins is part of the product contract.

Check one accepted action and one action that must preserve state or report a failure. Include an old stored value, a second caller or a replay when it changes the answer. Keep API visibility and serialized representations compatible. A new protocol, coordinator or repository earns its place when a production boundary needs it. A genuine effect can often be supplied by the dependency the feature already accepts. [Swift API Design Guidelines](https://www.swift.org/documentation/api-design-guidelines/)
