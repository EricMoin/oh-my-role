---
description: Localize a build or missing resource failure to the consuming target, scheme action, configuration and product.
---

# Isolate a target-specific build failure

The app builds, but the widget's Debug simulator compile reports “No such module”. Start at the first diagnostic in the widget's compile task. Capture the invocation's target, configuration, SDK and architecture. A final message reporting a failed app scheme can hide the extension that actually failed.

## Locate one effective difference

Read the scheme action and invocation from the failing build. When you have its workspace, scheme, configuration and destination, inspect their effective settings on the same checkout. Set the four shell variables to those actual values. In a project-only build use `-project "$IOS_PROJECT"` in place of the workspace option.

```sh
xcodebuild -workspace "$IOS_WORKSPACE" -scheme "$IOS_SCHEME" \
  -configuration "$IOS_CONFIGURATION" -destination "$IOS_DESTINATION" \
  -showBuildSettings
```

Read the settings block headed by the target name. If the scheme output only reports the app, open the widget target's Build Settings in Xcode and select **Levels** for that configuration. Check the expanded compile command in the failing log to confirm what actually reached the compiler. Compare a working configuration of the same widget first when one exists. [Xcode build-setting levels](https://developer.apple.com/documentation/xcode/configuring-the-build-settings-of-a-target)

| First observation | Next discriminating check |
| --- | --- |
| The consuming target cannot import a package module | Find the package **product** dependency on the widget target. A package present in the workspace or linked by the containing app can still be unavailable to the extension. If the product is present, inspect the failing module search paths, build ordering, platform variant and deployment target. |
| The module imports, but a type is invisible only in Debug | Compare target source membership, access level and active compilation conditions around the declaration. In a generated project, inspect the manifest or generator that owns the missing input. |
| The declaration compiles and the linker fails for one destination | Read the linker diagnostic for the missing symbol and its expected library. For a binary framework match platform **and** architecture. A device arm64 slice and a Simulator arm64 slice are distinct products. [Apple XCFramework guide](https://developer.apple.com/documentation/xcode/creating-a-multi-platform-binary-framework-bundle) |

Make the smallest edit at the owning level. Rebuild the original scheme action for the failing destination and confirm the previously failed task succeeded. For a shared module, build a representative second consumer. If a subsequently installed widget still fails to display data, carry the working build identity forward into runtime or entitlement diagnosis.
