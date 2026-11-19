---
name: ios-swiftui
description: Build, debug or review a SwiftUI-owned iOS screen. Use for view identity, Observation or ObservableObject ownership, editable drafts, value-based navigation and layout that adapts to its container.
---

# SwiftUI screens

Find the scene or host that constructs the feature, its minimum iOS version and one user action whose outcome matters. Then choose the entry that fits.

- **Build a feature.** Sketch the action, state transition and rendered result. Put transient presentation state at the smallest stable owner that needs it. Pass data and intents into child views using the app's existing conventions.
- **Repair a regression.** Reproduce the ordering, identity change or environment change that breaks the screen. Trace the read and write across that event before changing property wrappers.
- **Review a diff.** Identify which assumption the changed lines affect. Report a concrete failure path and its evidence. Keep unrelated API modernization outside a feature fix. A performance claim needs a measured interval in `ios-performance`.

## Choose the relevant question

| Question | Decision and proof |
| --- | --- |
| Who creates the model and who observes it? | On a compatible iOS 17+ target, a view that owns an `@Observable` instance can keep it in `@State`. A reader can receive the reference directly and use `@Bindable` for two-way controls. In an existing `ObservableObject` design, locate the creating `@StateObject` and the injected `@ObservedObject` readers. Check that editing updates the intended reader and that a parent update preserves the intended owner. [Observation model data](https://developer.apple.com/documentation/swiftui/managing-model-data-in-your-app) · [ObservableObject model data](https://developer.apple.com/documentation/swiftui/monitoring-model-data-changes-in-your-app) |
| Whose lifetime does a draft follow? | Follow the row's stable identifier through sorting, conditional branches and any explicit `.id`. Binding directly to the stored value expresses immediate editing. For Save/Cancel, keep an independent draft until Save succeeds. Diagnose specific transitions with the [editing and navigation exercise](references/editing-and-navigation.md). |
| Which state drives presentation? | In a value-driven stack, let the scene's path or selection choose the destination. For another window, create an independent selection when the product requires that. Decide where a route points after the record is removed. If the route crosses a system event, read `ios-platform-lifecycle`. [Understanding a navigation stack](https://developer.apple.com/documentation/swiftui/understanding-the-navigation-stack) |
| Does an ordinary parent update start work again? | SwiftUI can initialize a new view value, including the default expression of `@State`, while preserving the state for that identity. Keep work such as starting a subscription out of the view's initializer, its state defaults and `body`. Start it at the action or lifecycle boundary that owns it. Verify one subscription during a parent update and the expected cleanup on exit. [State initialization](https://developer.apple.com/documentation/swiftui/state) |
| Can a person finish the same task as the window changes? | Read the proposed space and local environment near the affected subtree. Use a layout that reflows at the actual available width. On supported systems `ViewThatFits` can select between arrangements with the same actions. Try the longest relevant text and a compact window with the keyboard visible. Use `ios-accessibility` for VoiceOver focus and text-size acceptance. [ViewThatFits](https://developer.apple.com/documentation/swiftui/viewthatfits) · [Human Interface Guidelines for layout](https://developer.apple.com/design/human-interface-guidelines/layout) |

For a purely UIKit-owned change, use `ios-uikit`. Use `swiftui-uikit` when a hosting controller, hosted cell or representable introduces a cross-framework lifetime or event.
