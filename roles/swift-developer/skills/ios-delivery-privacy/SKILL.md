---
name: ios-delivery-privacy
description: Inspect iOS signing and export failures, distribution-specific capability loss, missing archive symbols, privacy manifests and App Store disclosures.
---

# iOS delivery and privacy

## Locate the failing distribution stage

| Observation | First evidence and next step |
| --- | --- |
| Archive stops at a compiler or linker command | Inspect the first failing task and its consuming target with `ios-project-tooling`. A missing archive leaves its final signature unobserved. |
| Signing or export fails | Use the diagnostic to identify the app or extension, the archive/export configuration, bundle ID, requested capability and selected profile. Trace that specific mismatch to its owning target or export settings. |
| Debug symbols are missing from an archive or upload | Identify which binary's UUID is missing and who produced it. Check debug-information settings for that target's archive configuration or obtain the vendor's matching symbols for a prebuilt framework. Verify the UUIDs before associating the symbols with a distributed build. [Including debugging information](https://developer.apple.com/documentation/xcode/building-your-app-to-include-debugging-information) |
| A distributed widget shows placeholders while the app reads saved items | Start with the exact build and distribution stage. Use the [signed extension walkthrough](references/signed-extension.md) to inspect both bundles and decide whether to investigate entitlement configuration, export, or widget data and refresh. |
| The question concerns submission or availability | Check current SDK requirements and the actual validation, upload, processing or tester status for this build. An upload receipt establishes only receipt. [Current submission requirements](https://developer.apple.com/news/upcoming-requirements/) · [Distribution through Xcode](https://developer.apple.com/documentation/xcode/distributing-your-app-for-beta-testing-and-releases) |

## Trace privacy to behavior

| Change | What to inspect and exercise |
| --- | --- |
| A protected resource needs a purpose string in the shipped app | Inspect the effective usage description in the requesting product and compare it with the actual feature. For handling denial, limited access or Settings changes at runtime, follow `ios-platform-lifecycle`. [Requesting media authorization](https://developer.apple.com/documentation/avfoundation/requesting-authorization-to-capture-and-save-media) |
| An analytics SDK or another dependency changes | Inventory actual data collection, recipients, purpose and tracking behavior, including code supplied by partners. Check the currently listed SDKs for manifest and binary-signature requirements. Inspect the shipping product and generated privacy report. Reconcile findings with App Store Connect privacy answers. [Third-party SDK requirements](https://developer.apple.com/support/third-party-SDK-requirements/) · [App privacy details](https://developer.apple.com/app-store/app-privacy-details/) |
| A required-reason API is used | Find each app or SDK use, match its real purpose to Apple's current approved reasons, and verify the appropriate `PrivacyInfo.xcprivacy` is embedded. Revisit the implementation if its purpose has no matching reason. [Privacy manifest files](https://developer.apple.com/documentation/bundleresources/privacy-manifest-files) · [Adding required-reason API entries](https://developer.apple.com/documentation/technotes/tn3183-adding-required-reason-api-entries-to-your-privacy-manifest) |
| Data is used for tracking | Compare the data flow with Apple's definition and use App Tracking Transparency when required. Exercise authorization and denial, including SDK initialization before the decision. Keep restricted flows disabled while their required permission is absent. [User privacy and data use](https://developer.apple.com/app-store/user-privacy-and-data-use/) |

For a TestFlight app or extension that disappears, begin in `ios-runtime-diagnostics` with the incident class and affected process. An identified gap in that build's symbol artifacts brings the investigation back to the archive.
