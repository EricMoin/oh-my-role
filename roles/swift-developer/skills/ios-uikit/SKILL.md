---
name: ios-uikit
description: Build or repair a UIKit-owned screen in an iOS app. Use for UIViewController containment and transitions, Auto Layout, self-sizing cells, diffable updates, storyboard or programmatic construction, window traits and responder behavior.
---

# UIKit screens

Start with the controller on screen. Locate its construction path (storyboard, nib, factory, coordinator or scene delegate), its container, and the owner of the navigation or presentation decision. A controller may stay alive while its view is covered or offscreen. Name the point when the feature actually commits, releases, saves or cancels.

## Choose a path

| Task or symptom | First decision | Observable check |
| --- | --- | --- |
| Add a screen to an existing flow | Follow how sibling controllers receive dependencies, push or present, and return their result. Connect view-lifetime setup once in `viewDidLoad`. Refresh appearance-dependent content when that screen needs it. | Open from the real entry point, interact, leave and return. Check that one action produces one transition. |
| A draft disappears after a swipe from the leading edge | Trace appearance callbacks and the navigation stack through **cancellation**. `viewWillDisappear` can run before an interactive pop is cancelled. Defer irreversible pop work until the outcome is known. A transition coordinator completion exposes `isCancelled`; also account for disappearance due to another presentation. | Start the pop and reverse it. Verify the same draft and subscriptions still work. Complete a second pop and confirm teardown happens once. [Transition coordinator](https://developer.apple.com/documentation/uikit/uiviewcontrollertransitioncoordinator) · [Cancellation outcome](https://developer.apple.com/documentation/uikit/uiviewcontrollertransitioncoordinatorcontext/iscancelled) |
| A child renders but rotations, appearance or sizing act inconsistently | For a custom container, inspect `addChild`, embedding and constraining the child's view, and `didMove(toParent:)`. On removal, follow the matching containment callbacks and view removal. Standard containers already manage their children. | Present and remove the child through the actual container. Resize it and check that appearance events and constraints follow the child. [Custom container controllers](https://developer.apple.com/documentation/uikit/creating-a-custom-container-view-controller) |
| A form or cell truncates only in a narrow window or at large text sizes | Inspect the owning view's bounds, safe area, traits and the active constraints. For keyboard overlap inspect the view's keyboard layout guide on supported systems. Use the container's available width when deciding to reflow. | Keep the keyboard visible, resize the window or rotate, and complete the affected action at a larger text size. [Safe areas](https://developer.apple.com/documentation/uikit/uiview/safearealayoutguide) · [Keyboard layout guide](https://developer.apple.com/documentation/uikit/uikeyboardlayoutguide) · [Adaptive UIKit apps](https://developer.apple.com/videos/play/wwdc2026/278/) |
| A reused or updated cell shows old content, or a new multiline label overlaps | Separate sizing, item identity and configuration. Trace the model identifier through diffable snapshots, reusable cells and asynchronous completions. | Use the [self-sizing and reuse exercise](references/self-sizing-and-reuse.md) for a clipped row, reconfiguration without reuse, or out-of-order image delivery. |

For a review, choose the row matching the reported failure, identify the controller or item in the affected hierarchy and give a sequence that would reproduce the issue. For a new feature, retain the existing presentation contract while designing the screen's actions and state. Use `ios-platform-lifecycle` for system delivery to a scene, `ios-accessibility` for assistive technology and `swiftui-uikit` when framework ownership actually crosses a boundary.
