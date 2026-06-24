# Flutter Platform and Release Guide

Use this guide for platform setup, permissions, plugins, flavors, signing, packaging, and release workflows.

## Checks

- Confirm target platforms before changing platform directories.
- Keep permissions minimal and explain why each is needed.
- Configure debug/profile/release and flavors consistently.
- Verify Android package name, signing config, manifest, min/target SDK, and ProGuard/R8 impact.
- Verify iOS bundle ID, entitlements, signing team, capabilities, privacy manifests, and Info.plist entries.
- Verify web base href, renderer assumptions, CORS, and deployment path.
- Verify desktop entitlements, sandboxing, packaging, and native plugin support.
- Run platform builds or document why they cannot run locally.
