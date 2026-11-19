---
description: Compare the app and widget signatures in one distribution archive to diagnose missing App Group access.
---

# Does the archived widget claim the shared App Group?

The shipped widget shows placeholder data although the containing app saved an item. Identify the expected App Group string from the production write and read calls and the affected build number. An entitlement in the app target's source file establishes intent. Each executable has its own final signature.

## Inspect the artifact on a Mac

Set `IOS_ARCHIVE` to the observed `.xcarchive`. Locate the containing application and the widget inside its `PlugIns` directory. Use the paths in this artifact, including spaces when present.

```sh
find "$IOS_ARCHIVE/Products/Applications" -type d \( -name '*.app' -o -name '*.appex' \) -print
```

Set `IOS_APP` and `IOS_WIDGET` to those two bundle paths. Inspect their built plists and signed entitlements separately. The commands read the bundles in place.

```sh
for bundle in "$IOS_APP" "$IOS_WIDGET"; do
  printf '\n%s\n' "$bundle"
  plutil -extract CFBundleIdentifier raw -o - "$bundle/Info.plist"
  plutil -extract CFBundleVersion raw -o - "$bundle/Info.plist"
  codesign --display --entitlements - --xml "$bundle"
done
```

Read the exact values under `com.apple.security.application-groups` for each signature. Record an absent key, a different group string, and an unreadable signature as distinct observations. An error reading a signature leaves that claim unknown. [App Groups entitlement](https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.security.application-groups) · [Apple signing and profile inspection](https://developer.apple.com/documentation/technotes/tn3125-inside-code-signing-provisioning-profiles)

When the failure involves provisioning, select the affected app or widget as `IOS_BUNDLE`. If it contains an `embedded.mobileprovision`, read the profile's permitted entitlements. Keep the whole profile and device lists out of the report.

```sh
security cms -D -i "$IOS_BUNDLE/embedded.mobileprovision" |
  plutil -extract Entitlements xml1 -o - -
```

Compare the specific entitlement and authorized value to the signature. A profile is an allowlist and can include wildcard values according to the entitlement. Extra permitted entries do not grant the binary a claim. The App Store re-signs distributed products and the installed store copy can have no embedded profile. [Provisioning profile fundamentals](https://developer.apple.com/documentation/technotes/tn3125-inside-code-signing-provisioning-profiles)

## Follow the result

- **Only the widget lacks the group.** Inspect the widget target's effective `CODE_SIGN_ENTITLEMENTS`, its selected Archive configuration and the signing input that produced this artifact. Verify the provisioning profile when relevant. Correct the widget's owning settings and repeat the inspection on a new archive.
- **The archive matches, but the exported build is affected.** Locate the same two bundles in the exported app, compare their IDs, build numbers and signed claims, and record the export identity. The archive establishes the pre-export state.
- **Both affected signatures claim the expected group.** Follow the actual container URL, saved record and widget timeline. Write a known item in the app on the affected build, then inspect the widget's read and displayed timeline entry. Report the stage, bundle and observation reached. [Widget refresh behavior](https://developer.apple.com/documentation/widgetkit/keeping-a-widget-up-to-date)
