---
name: android-platform-engineering
description: Applies senior Android platform engineering practices covering lifecycle, resources, configuration changes, permissions, background work, storage, notifications, Gradle, build variants, app startup, and platform compatibility.
---
# Android Platform Engineering

Compose does not remove Android platform constraints. Lifecycle, process death, resources, permissions, background execution, storage, and build configuration still define whether an app behaves correctly.

## Lifecycle and Process

- Treat process death as normal. Recreate screens from saved state, navigation arguments, and repositories.
- Keep Activity/Fragment code thin: platform wiring, navigation host setup, permission launchers, and dependency entry points.
- Use lifecycle-aware collection for UI state.
- Avoid leaking Activity/Fragment references into ViewModels, repositories, or long-lived objects.
- Handle configuration changes through resources, window metrics, and state restoration, not Activity recreation hacks.

## Resources and Configuration

- Use resources for localized strings, plurals, dimensions that are truly resource-driven, and platform configuration variants.
- Use Compose theme tokens for UI styling.
- Verify font scale, locale, layout direction, dark theme, orientation, and screen size.
- Avoid storing localized display text as durable domain state.

## Permissions

- Request runtime permissions at the UI boundary.
- Explain permission need in user terms before launching system prompts when appropriate.
- Handle denied, permanently denied, granted, and revoked-after-grant states.
- Do not assume permissions remain granted.
- Use the minimum platform permission and API needed for the feature.

## Background Work

Choose background execution based on requirements:

| Need | Tool |
| --- | --- |
| Deferrable guaranteed work | WorkManager |
| User-visible ongoing work | Foreground service |
| Exact user-visible alarm | Exact alarm APIs, with policy constraints |
| Short lifecycle-bound work | Coroutine in lifecycle/ViewModel scope |
| Push-driven wakeup | FCM or platform push path |

Respect Android background execution limits and battery policies. Do not use foreground services as a generic escape hatch.

## Storage and Data Access

- Use scoped storage and app-specific directories unless the user must access shared media/documents.
- Use MediaStore or system photo picker for media workflows.
- Use Room/DataStore according to data shape and existing project conventions.
- Do not do disk or network work on the main thread.
- Keep migration and backup/restore behavior in mind for persistent data.

## Notifications

- Create notification channels intentionally.
- Handle runtime notification permission on newer Android versions.
- Use clear pending intent mutability flags.
- Keep notification actions and deep links aligned with navigation.
- Verify behavior on locked screen and after process recreation when relevant.

## Gradle and Build Variants

- Inspect Android Gradle Plugin, Kotlin, Compose compiler, and dependency versions before making build changes.
- Keep version catalogs, convention plugins, and module structure consistent.
- Prefer minimal dependency changes.
- Use build types/flavors for environment differences rather than runtime conditionals scattered through code.
- Check release builds when changing R8/ProGuard, resources, startup, native dependencies, or Baseline Profiles.

## Workflow

1. Identify the platform surface involved: lifecycle, permission, storage, background, resource, notification, build, or startup.
2. Check the app's min/target SDK, dependency versions, manifest, and existing abstraction.
3. Implement using the narrowest Android API that satisfies the requirement.
4. Handle version differences and denied/failure paths explicitly.
5. Test on API levels and form factors relevant to the behavior.
6. Document assumptions when platform policy or OEM behavior affects reliability.

## Validation Checklist

- [ ] Lifecycle and process recreation paths are handled.
- [ ] Runtime permissions include denied/revoked paths.
- [ ] Background work choice matches platform policy and user visibility.
- [ ] Storage APIs respect scoped storage and user expectations.
- [ ] Build changes match existing Gradle conventions.
- [ ] Version/API-level behavior is verified or clearly qualified.
