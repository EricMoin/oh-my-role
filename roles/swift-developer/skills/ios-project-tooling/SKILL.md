---
name: ios-project-tooling
description: Diagnose missing modules, unresolved SwiftPM dependencies, undefined symbols, absent bundled resources and Swift/Objective-C import failures in an iOS product or its Swift packages.
---

# iOS project tooling

Read the first actionable diagnostic from the failing invocation. An unavailable module or link symbol calls for the consuming target's inputs. A Sendable or actor-isolation diagnostic on a resolved declaration calls for its language contract in `swift-language-concurrency`. A widget that installs and then loses a capability only in distribution calls for its signed bundle in `ios-delivery-privacy`.

When one target, configuration or destination fails while another succeeds, use the [target comparison walkthrough](references/target-build-failure.md). Keep the resolved settings, build task and source of the setting distinct.

## Locate the fault

| Symptom | Inspect | Prove the fix |
| --- | --- | --- |
| An extension cannot find a Swift type used by the app | Identify the module that owns the declaration. Check the consuming target's product dependency, import, access level, source membership and compilation conditions. For synchronized folders, inspect target membership exceptions. | Build the extension through its containing app. Confirm its compile inputs or imported module in the build log. |
| A declaration compiles but the linker reports an undefined or duplicate symbol | Identify the binary expected to define it. Check the implementation's Compile Sources membership and the consumer's linked products. For duplicates, identify both object files in the linker output and fix the redundant inclusion. | Relink the failing target for the original destination. For a binary XCFramework, inspect the supported device/simulator platform variant as well as CPU architecture. [Target build phases](https://developer.apple.com/documentation/xcode/customizing-the-build-phases-of-a-target) · [XCFramework variants](https://developer.apple.com/documentation/xcode/creating-a-multi-platform-binary-framework-bundle) |
| The app links but fails on launch with a missing dynamic library | Inspect the loaded image named in the error, the app's embedded frameworks, and the consumer's runpath settings. Distinguish a dynamic product requiring embedding from a static one resolved at link time. | Launch the built app or invoke the embedded extension on the failing destination. |
| An image exists in the app but disappears inside a package or widget | Identify the bundle that owns the resource. For a SwiftPM target, declare its resources as needed and provide a package accessor using its own `Bundle.module`. Verify the expected file hierarchy when choosing `.copy` or `.process`. | Use the production accessor from the affected product and check the actual packaged asset. A test bundle may supply its own fixture under the same name. [Swift package resources](https://developer.apple.com/documentation/xcode/bundling-resources-with-a-swift-package) |

## Resolve an incompatible dependency

Trace the incompatible requirements to their owning manifests or Xcode dependency rules. If two consumers require different major versions of the same package identity, find compatible versions or adapt a consumer to a supported release. Resolve from the root that produced the diagnostic: the root manifest for a standalone package build or the project's workspace for app integration. Review any resulting `Package.resolved` change at that root. A dependency's own lockfile governs its standalone build. [SwiftPM dependency failures](https://github.com/swiftlang/swift-package-manager/blob/main/Sources/PackageManagerDocs/Documentation.docc/Dependencies/ResolvingDependencyFailures.md) · [Resolution and lockfile behavior](https://github.com/swiftlang/swift-package-manager/blob/main/Sources/PackageManagerDocs/Documentation.docc/ResolvingPackageVersions.md)

## Migrate a mixed-language target incrementally

- When Swift needs an Objective-C declaration in the same app target, inspect its bridging header and the resolved `SWIFT_OBJC_BRIDGING_HEADER` path. In a framework target, expose the intended headers through the module's umbrella header and check module configuration and header visibility. [Importing Objective-C into Swift](https://developer.apple.com/documentation/swift/importing-objective-c-into-swift)
- When Objective-C needs Swift, inspect the generated `ProductModuleName-Swift.h` and the Swift declaration's Objective-C representability and visibility. Import the generated interface in the consuming implementation. A forward declaration can break a header cycle when the header only refers to the class by pointer. [Importing Swift into Objective-C](https://developer.apple.com/documentation/swift/importing-swift-into-objective-c)
- Migrate one leaf type with known callers. Preserve selectors, nullability, error conventions, callbacks and any storyboard or runtime class lookup used by those callers. Remove the replaced implementation from its target as the replacement takes ownership. Compile a real consumer in each language and exercise a runtime selector or decoded storyboard when applicable. [Migrating Objective-C to Swift](https://developer.apple.com/documentation/swift/migrating-your-objective-c-code-to-swift)

## Check the affected configurations

Rerun the original failing build. A host-compatible library can build and run its tests at the package root. For an iOS-only framework import, build the package scheme for a supported iOS destination. For an embedding or resource-bundle failure, exercise the actual app or extension that consumes it. Compare effective conditions, paths, linked products or optimization settings when Debug works and Release fails. Rebuild for the archive's device SDK when packaging or binary slices are involved.
