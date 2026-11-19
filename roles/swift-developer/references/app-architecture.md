# Ownership in an iOS feature

Follow the event that motivated the change. Who can start the work, who can replace it and who can still receive its result? A view value, a navigation entry, a scene, an account session and an on-disk record have different lifetimes.

For a write that can be refused, find the owner that can enforce the rule against **every relevant writer**. A draft value can decide whether it is editable. Its store can load the current draft, apply that operation and commit the change atomically when the storage contract requires it. The store need not reimplement the edit rule or know how the screen presents a refusal. When a rule belongs entirely to an existing Swift value, review its constructor, operation and real callers.

| State or decision | Candidate owner | Evidence to check |
| --- | --- | --- |
| Expanded row or draft field | The smallest view/controller that must preserve the interaction | Reorder rows containing drafts. Does text follow the item? |
| Selection, presentation and path | The scene or navigation flow presenting the destination | Open another window or follow a link into an existing stack. Which path changes? |
| Authenticated work | The signed-in session and the services created for it | Sign out during refresh. Can an operation from the expired session still commit after the same person signs in again? |
| Permission or consent | The system controls app authorization. The product may separately record an account's acceptance of a particular agreement. | Switch accounts. Which fact can change, and where can the feature read the current answer? |
| Persisted user edits | The existing storage boundary with a defined commit point | Terminate after save and reopen using an existing user's store. Which data survives? |

Two windows signed into one account may need independent selections and the same saved library. Construct the library at the account boundary and give each window access to it through the project's existing construction path. Each window owns its own selection. Close one window and the other should still see library edits. Open a window for another account and it should see that account's library. This also tells you what to release on dismissal and what should live on. [Managing model data](https://developer.apple.com/documentation/swiftui/managing-model-data-in-your-app) · [UIKit state restoration](https://developer.apple.com/documentation/uikit/preserving-your-app-s-ui-across-launches)

## Worked review: a search result arrives after sign-out

1. Start with the observed ordering. Account A begins a search. The user signs out, signs in to B and starts another search. A's slow response arrives last.
2. Trace each write separately. A's result must not appear on B's screen. Whether it can finish populating A's cache depends on the storage contract. If signing out clears that cache and revokes pending writes, enforce revocation at the store. Account ID alone will match again when A signs back in.
3. Cancel the old operation at the owning boundary to avoid wasted work. A dependency can finish during cancellation. After a suspension, validate the facts needed to commit the result. An actor can serialize writes while still admitting a logically stale response.
4. In a focused test use the existing network seam to control both completions. Complete B first, then A. Inspect the presented results and the persisted record for B. Repeat with a genuine failure from B to verify that stale-error handling preserves actionable errors.

## Worked review: adopting SwiftUI in a UIKit navigation stack

Keep the existing navigation controller as owner if other controllers still push onto that stack. A hosted read-only screen may need just a value and a Done action. An editor observing live changes may borrow the existing model. Let the flow decide how to finish. Cancel an interactive dismissal, then complete one and reopen. Check that the action runs once and that only work owned by the departing screen ends. [Demystify SwiftUI](https://developer.apple.com/videos/play/wwdc2021/10022/) · [Swift ARC](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/automaticreferencecounting/)

## Changing module boundaries

Read the target dependencies and one production caller on either side. Suppose `EpisodeDetails` already imports `EpisodeList` for its episode value. A tap in the list now needs to open details in the receiving window. Importing the details target from the list would close a cycle. The existing window flow already knows both features. It can connect the row's selection to its own open action when it constructs the list. Return the value or ID the flow actually needs. Exercise the original entry and the new entry with two windows open.

Sometimes two products really do need an independently usable capability. For example, the app and its read-only widget might both need to decode yesterday's saved episode snapshot. Place that format and reader at a boundary both products can import. The widget should be able to read a fixture without constructing app navigation, a signed-in network client or a writer. An existing target can supply that boundary. A new target earns its dependency and public API costs when it enforces a concrete separation. Build the actual consumers and check that previously internal details have stayed internal. [Swift API Design Guidelines](https://www.swift.org/documentation/api-design-guidelines/)
