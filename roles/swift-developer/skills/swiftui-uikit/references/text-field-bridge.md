---
description: Bridge a UIKit text field into SwiftUI while preserving marked Pinyin text, selection and the current binding.
---

# Preserve composition in an embedded text field

A person is typing Chinese with Pinyin. A SwiftUI parent updates a validation hint and the candidate disappears or the caret jumps. Trace the write into `UITextField.text` during `updateUIView`. Replacing the whole string can disturb the text system's in-progress edit even when the parent holds the same characters.

This example bridges a UIKit field needed by an existing feature. Its binding holds the raw draft, including provisional input. The editing session has one writer. Apply validation or normalization at the feature's commit boundary. If the product permits concurrent resets or remote edits, define which change wins before using this pattern.

Keep a single UIKit field tied to one logical input session. If the same screen can switch from record A to B during composition, bind the setter to a specific record or draft and key the field by that editing session. For example, `DraftTextField(draft: titleBinding(for: record.id), label: titleLabel).id(record.id)` expects the binding to capture the supplied ID. A setter that looks up the *currently selected* record can send A's final edit to B. Keying the field by the changing text would reset its focus and composition on every keystroke. [View identity](https://developer.apple.com/documentation/swiftui/view/id%28_%3A%29)

```swift
import SwiftUI
import UIKit

struct DraftTextField: UIViewRepresentable {
    @Binding var draft: String
    var label: String

    func makeCoordinator() -> Coordinator {
        Coordinator(draft: $draft)
    }

    func makeUIView(context: Context) -> UITextField {
        let field = UITextField()
        field.addTarget(context.coordinator, action: #selector(Coordinator.didEdit(_:)),
                        for: [.editingChanged, .editingDidEnd])
        return field
    }

    func updateUIView(_ field: UITextField, context: Context) {
        context.coordinator.draft = $draft
        field.accessibilityLabel = label
        if field.markedTextRange == nil, field.text != draft {
            field.text = draft
        }
    }

    @MainActor
    final class Coordinator: NSObject {
        var draft: Binding<String>

        init(draft: Binding<String>) {
            self.draft = draft
        }

        @objc func didEdit(_ field: UITextField) {
            let text = field.text ?? ""
            if text != draft.wrappedValue {
                draft.wrappedValue = text
            }
        }
    }
}
```

The check for marked text protects the input method's provisional selection. Comparing the strings also preserves the selection during ordinary parent updates. Refreshing the coordinator's binding connects future events to the current SwiftUI input when the representable value is recreated. [UIKit marked text](https://developer.apple.com/documentation/uikit/uitextinput/markedtextrange) · [UIViewRepresentable](https://developer.apple.com/documentation/swiftui/uiviewrepresentable)

**Verify on a running app.** Type `nihao` with a Chinese Pinyin keyboard and leave the candidate unconfirmed. Trigger an unrelated parent update while the field remains focused. Confirm that the candidate list and selection survive, select “你好”, and save. Reopen the item and inspect the stored string. Repeat with a selection in ordinary text and one replacement keystroke. If retargeting is supported, switch to B while A still has marked text. After A's editing ends, B must still show its own text. A direct assignment of “你好” inside a test exercises the committed string only.
