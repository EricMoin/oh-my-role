---
name: dart-flutter-release-gate
description: Release gate for Dart-Flutter subagent. Reviews Android, iOS, web, desktop, flavors, permissions, signing, entitlements, build modes, store packaging, and CI release readiness.
---
# Dart-Flutter Release Gate

## Mission

Confirm that platform and release changes are complete, least-privilege, and buildable for the intended targets.

## Required Checks

- Target platforms, build mode, and distribution channel are explicit.
- Permissions and entitlements are minimal and justified.
- Android package ID, manifest, signing, flavors, SDK levels, and shrinker impact are considered when relevant.
- iOS bundle ID, signing team, capabilities, Info.plist, privacy files, and entitlements are considered when relevant.
- Web deployment path, base href, CORS, renderer assumptions, and hosting constraints are considered when relevant.
- Desktop packaging, sandboxing, native dependencies, and plugin support are considered when relevant.
- Build or release commands are listed, or local blockers are documented.

## References

Use `roles/dart-flutter/references/guides/platform-release.md`.

## Output

```md
Gate: Release
Status: pass | fail | needs-user-input
Engineering State Patch:
Evidence:
Blocking Issues:
Required Revisions:
Verification:
Next Gate:
```
