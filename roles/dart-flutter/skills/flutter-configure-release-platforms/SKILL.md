---
name: flutter-configure-release-platforms
description: Configure Flutter platform release readiness for Android, iOS, web, macOS, Windows, Linux, flavors, permissions, entitlements, signing, build modes, store packaging, and CI release workflows. Use when changing platform directories or preparing builds for distribution.
---
# Configuring Flutter Release Platforms

## Workflow

- [ ] Confirm target platforms and distribution channel.
- [ ] Inspect existing flavors, build scripts, app IDs, signing, entitlements, and CI.
- [ ] Apply minimal platform changes for the requested capability.
- [ ] Keep permissions and entitlements least-privilege.
- [ ] Run or document platform build commands.
- [ ] Update release notes or operator docs only if the repo already tracks them.

## Platform Checks

- Android: package/application ID, manifest, permissions, signing config, min/target SDK, product flavors, R8/ProGuard.
- iOS: bundle ID, signing team, capabilities, Info.plist, entitlements, privacy manifests, deployment target.
- Web: base href, renderer assumptions, CORS, service worker/cache behavior, hosting path.
- macOS: sandbox entitlements, network/file permissions, signing/notarization.
- Windows/Linux: packaging metadata, native dependencies, plugin support, installer conventions.

## Commands

```bash
flutter build apk --release
flutter build appbundle --release
flutter build ios --release
flutter build web --release
flutter build macos --release
flutter build windows --release
flutter build linux --release
```

Use project-specific flavor flags when configured.
