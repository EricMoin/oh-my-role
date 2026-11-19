---
name: ios-platform-lifecycle
description: Diagnose iOS scene routing, restoration, authorization and background execution through the app's actual system entry points.
---

# Scene, process and system events

## The link works only when the app is already open

Identify the ingress first. A custom URL scheme, a universal link, a notification action and scene restoration are different inputs. For universal links in a UIKit scene app, inspect the user activities in `scene(_:willConnectTo:options:)` during connection and `scene(_:continue:)` on continuation. For a custom URL scheme, read `connectionOptions.urlContexts` when connecting the scene and handle `scene(_:openURLContexts:)` on an existing scene. For SwiftUI, locate the handler in the scene hierarchy and check which scene owns the navigation path. [Supporting universal links](https://developer.apple.com/documentation/xcode/supporting-universal-links-in-your-app) · [Custom URL entry points](https://developer.apple.com/documentation/xcode/defining-a-custom-url-scheme-for-your-app) · [SwiftUI navigation sample](https://developer.apple.com/documentation/swiftui/bringing-robust-navigation-structure-to-your-swiftui-app)

Validate the host, path and identifier when parsing the destination. If navigation must wait, keep the pending route with its receiving scene. For a link to order 42 in workspace A, retain both identifiers. After sign-in, resolve the order in A and check the current account's access before presenting it. When access fails, use the existing unavailable or account-selection flow. Test with a different order 42 in workspace B. Public and shared links follow their own access rules even if the signed-in account changes.

Have the receiving scene consume the pending route once its prerequisites succeed. Keep restored navigation and a new explicit destination from pushing duplicates. Exercise cold launch, active scene, foreground return and an invalid link. For multiple windows, check which window changes. On a universal-link failure, inspect the **signed** associated-domains entitlement, site association file and tapping context. A same-domain tap in Safari can remain in the browser. Passing a URL directly to the app only tests the router. [Apple technote TN3155](https://developer.apple.com/documentation/technotes/tn3155-debugging-universal-links)

## The user returns to a blank or incorrect screen

Separate presentation state from durable user data. Save stable identifiers sufficient to reconstruct the route. Resolve them against the current store and handle deleted records, signed-out accounts and old restoration payloads. Start a new scene and restore an existing session independently. For a restoration check, send the scene to the background, stop the app from Xcode and launch again. Swiping the app away in the switcher can discard the preserved session. Verify both the restored route and its current record. [Restoring a UIKit scene](https://developer.apple.com/documentation/uikit/restoring-your-app-s-state)

## A background refresh works under the debugger but misses its deadline

Choose the mechanism from the result required. Finish brief foreground work using its bounded background assertion, schedule deferrable refresh with BackgroundTasks, or transfer files using a background URLSession where appropriate. Register handlers for BGAppRefreshTask and BGProcessingTask identifiers by the end of app launch. On iOS 26 and later, a user-initiated BGContinuedProcessingTask can register its handler when that work begins. Connect expiration to cooperative cancellation and deliver one completion after the task finishes or unwinds. Save checkpoints so repeated runs can continue safely. The scheduler controls when a task runs after its earliest start date. Expose cached content and freshness to the foreground UI if timely scheduling is essential to the experience. [Choosing a background strategy](https://developer.apple.com/documentation/backgroundtasks/choosing-background-strategies-for-your-app) · [Continued processing · WWDC25](https://developer.apple.com/videos/play/wwdc2025/227/?time=841) · [Earliest start date](https://developer.apple.com/documentation/backgroundtasks/bgtaskrequest/earliestbegindate) · [Background URLSession transfers](https://developer.apple.com/documentation/foundation/downloading-files-in-the-background)

Test successful work, injected expiration halfway through, retry after relaunch and user cancellation. A simulated trigger can prove the handling path. To establish real delivery, observe a device under the intended configuration and report what arrived.

## A permission is granted in development only

Tie the request to the feature the user just invoked. Inspect the purpose string in the actual app target, capability or entitlement where relevant, current authorization and the callback or change notification. Handle limited, reduced-accuracy, denied or restricted access where the specific API exposes it. Re-read status after returning from Settings. Use a system picker when the feature only needs items the user selects. Exercise first request, acceptance, denial and a later status change with a dedicated test account or destination. [Requesting protected resources](https://developer.apple.com/documentation/uikit/requesting-access-to-protected-resources) · [Location authorization](https://developer.apple.com/documentation/corelocation/requesting-authorization-to-use-location-services) · [Photo picker](https://developer.apple.com/documentation/photokit/selecting-photos-and-videos-in-ios)
