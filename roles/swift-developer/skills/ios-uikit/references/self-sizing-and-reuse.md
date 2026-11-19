---
description: Separate a self-sizing UIKit cell constraint failure from stale reused content or a late image response.
---

# A self-sizing row changes identity on screen

An inbox cell clips its second line at accessibility text sizes. After rapid scrolling, a thumbnail occasionally lands on a different message. The two failures have different observations and can be investigated independently.

## Follow the height

1. Check that the table is configured for self-sizing, including automatic row height and an appropriate nonzero estimate. Inspect any delegate-supplied fixed height. Compare the estimated height with the cell's final fitted height.
2. At the width that fails, walk the constraints from the top of `contentView` through the visible content to the bottom. Multiline text needs a defined width and room to wrap. Inspect compression resistance and fixed heights before changing priorities. For a constraint conflict reproduce at the failing width and examine the first conflicting pair in the log.
3. Configure a short title and a translated multiline title on the same cell type. At an accessibility text size, scroll each offscreen and back. Check that both the final label line and the row action remain reachable. [Auto Layout self-sizing cells](https://developer.apple.com/library/archive/documentation/UserExperience/Conceptual/AutolayoutPG/WorkingwithSelf-SizingTableViewCells.html)

## Follow the content

Configure the full visible state from the current item every time the data source requests it, including the placeholder or absence of an image. An item can be reconfigured in place, so a fix that depends on `prepareForReuse` alone can miss visible updates. Capture the stable item or request identity at load time. Before publishing an image verify that it still belongs to the currently represented item and asset revision, or update the data source by identity and reconfigure that item. An index path can point to a different message after a snapshot change. [Diffable data sources](https://developer.apple.com/documentation/uikit/updating-collection-views-using-diffable-data-sources) · [Cell reuse](https://developer.apple.com/documentation/uikit/uitableviewcell/prepareforreuse%28%29)

Two revealing sequences are to reorder rows while a thumbnail is pending, and to change a visible item from “has image” to “no image” without scrolling. Observe which row changes when the original request completes. Include a reuse pass if the original failure required scrolling.
