---
name: swiftui-uikit
description: Integrate SwiftUI and UIKit in an iOS feature, or migrate one boundary at a time. Use for UIHostingController, hosted cells, UIViewRepresentable, UIViewControllerRepresentable, coordinators, UIKit delegates, focus and teardown across frameworks.
---

# SwiftUI and UIKit interoperability

Identify who embeds whom, which values the embedded UI reads, where edits go and who owns navigation. For single-framework work, use `ios-swiftui` or `ios-uikit`. During migration keep the existing public entry point usable and move one ownership boundary at a time.

| Boundary | Configure it | Exercise it |
| --- | --- | --- |
| UIKit presents or embeds a SwiftUI screen | A read-only license screen can take its text and an `onDone` callback. A screen observing shared edits can borrow the existing session model. Let the existing flow decide how to dismiss or push. Check child-controller containment, constraints and whether a stored callback retains the host. | For an editor, cancel a pop and continue editing, then finish the flow. Check that the controller receives the expected completion once and screen-owned subscriptions end on departure. A second screen using the same session should still receive updates. [UIHostingController](https://developer.apple.com/documentation/swiftui/uihostingcontroller) · [UIKit containment](https://developer.apple.com/documentation/uikit/creating-a-custom-container-view-controller) |
| SwiftUI embeds a UIKit control or controller | Create persistent UIKit objects in `makeUIView` or `makeUIViewController`. Reconcile changed inputs in the matching update method. Keep delegate or target-action delivery in the coordinator and refresh the binding or callback it uses when inputs change. Release owned observers, delegates or work at teardown. Let the SwiftUI host determine the represented root's size and position. | While the control is focused, update unrelated parent state, then change the bound input. Verify selection, value propagation and event count. Reopen the feature to check for duplicate callbacks. [UIViewRepresentable](https://developer.apple.com/documentation/swiftui/uiviewrepresentable) · [UIViewControllerRepresentable](https://developer.apple.com/documentation/swiftui/uiviewcontrollerrepresentable) |
| A UIKit list hosts SwiftUI cell content | Use `UIHostingConfiguration` where available when UIKit still owns the collection. Give hosted content the current item's identity and data. Decide where each action is handled, including selection or deletion already supplied by the collection. | Reconfigure a visible item and later reuse the cell for a different item. Trigger its action and observe the record that changes. Inspect the rendered size at a larger text size. [UIHostingConfiguration](https://developer.apple.com/documentation/swiftui/uihostingconfiguration) · [Use SwiftUI with UIKit](https://developer.apple.com/videos/play/wwdc2022/10072/) |

## A text field loses its composing text

Replacing the full text on every SwiftUI update can interrupt an input method even when the displayed string looks correct. The [worked text-field bridge](references/text-field-bridge.md) follows UIKit's marked-text range, SwiftUI's latest binding and the owner of validation through a Pinyin composition sequence. Check the candidate list on a running keyboard before claiming that the interaction works.

## Migration checkpoint

State which framework owns presentation and which owns each editable value after this step. Drive one action from the original caller through the new boundary and back. Include cancellation or teardown when the original flow supported it. If a problem is entirely on one side, continue with that framework's skill and keep the bridge contract intact.
