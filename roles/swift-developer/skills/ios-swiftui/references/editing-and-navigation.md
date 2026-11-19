---
description: Keep the correct SwiftUI draft and route when list order, item identity or dismissal changes during editing.
---

# Edit the intended item after the list changes

A person opens a draft from a sorted list, edits its title, then saves after a background refresh reorders the list. The wrong item changes. Follow three identities independently.

| Identity | Inspect | A revealing transition |
| --- | --- | --- |
| List row | The `ForEach` identifier. Use the model's stable ID when rows represent movable records. Array positions may change and newly generated UUIDs discard identity across updates. | Insert a record ahead of an edited row. Its editor and selection should still belong to the same record. |
| Editing session | The destination's item ID and its draft owner. Initialize the draft at the start of the editing session. Repeated parent body evaluations can recreate the view value while the identified state survives. Reapplying an incoming title can overwrite unsaved typing. | Type a title, update unrelated parent state, then Cancel. The field should keep the typed draft until Cancel and the stored record should retain its old value. |
| Save destination | The ID resolved by the store at commit. Look up that ID again if the list may have changed. Define an explicit outcome when it disappeared or the save failed. | Refresh and reorder, then save. Reopen the chosen record and its former neighbor. Repeat after deleting the chosen record while the editor is open. |

An editor can find the correct record and still overwrite a newer change. If only the title is editable, stage that value and commit the title to the current record through its existing write path. Replacing the stored book with a snapshot taken when the sheet opened can undo a reading-progress update on the same book. If both writers changed the title, follow the product's conflict policy. Exercise that case separately from concurrent edits to different fields.

If the product needs restoration, store durable route values appropriate to the scene and resolve them against current records. Test by backgrounding the app, stopping it in Xcode and relaunching. Verify which item the restored scene shows. A foreground return can leave all in-memory state intact. [SwiftUI identity and lifetime](https://developer.apple.com/videos/play/wwdc2021/10022/) · [Restoring SwiftUI state](https://developer.apple.com/documentation/swiftui/restoring-your-app-s-state-with-swiftui)
