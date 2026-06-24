---
name: android-source-research
description: Establishes an evidence-first workflow for uncertain Android and Jetpack Compose behavior using official docs, AndroidX/AOSP source, release notes, issue trackers, local dependency source, and reproducible experiments.
---
# Android Source Research

When Android or Compose behavior is version-specific, surprising, or undocumented, do not guess. Build an evidence trail from docs, source, release notes, and reproduction.

## When To Use

Use this skill when:

- A behavior depends on Android API level, target SDK, OEM behavior, or AndroidX version.
- Compose runtime, compiler, lifecycle, navigation, or Material behavior is uncertain.
- A fix depends on internal implementation details.
- Documentation and observed behavior appear to conflict.
- You need to justify a recommendation that affects architecture, migration, or performance.

## Evidence Hierarchy

Prefer evidence in this order:

1. Local project source and dependency versions.
2. Official Android and AndroidX documentation.
3. AndroidX source for Jetpack libraries.
4. AOSP source for platform behavior.
5. Official release notes, migration guides, and issue tracker comments.
6. Reproducible local experiment or minimal sample.
7. Community posts only as hints, never as the final authority.

## Research Workflow

1. Pin the exact versions: Android Gradle Plugin, Kotlin, Compose compiler/plugin, Compose BOM or individual artifacts, lifecycle/navigation/material libraries, min/target SDK.
2. Reproduce or describe the observed behavior precisely.
3. Search local dependency source first when available in IDE caches or Gradle sources.
4. Check official docs and release notes for the relevant version.
5. Trace AndroidX or AOSP source for the implementation path.
6. Run a minimal experiment if source/docs are ambiguous.
7. Report the answer with evidence, version scope, and confidence level.

## Source Tracing Tips

- Start from the public API used by the app.
- Follow overloads and default parameters to the actual implementation.
- Check annotations, API-level guards, and compatibility shims.
- For Compose, inspect runtime/material/foundation versions that match the app, not latest main branch by default.
- For platform behavior, distinguish framework API behavior from AndroidX compatibility wrappers.
- Record file/class/method names and version/source branch when citing source.

## Local Commands

Adapt commands to the project:

```bash
./gradlew :app:dependencies
./gradlew :app:androidDependencies
./gradlew :app:dependencyInsight --dependency androidx.compose.runtime
./gradlew :app:dependencyInsight --dependency androidx.lifecycle
```

Use existing version catalogs or Gradle convention plugins as the source of truth when present.

## Reporting Format

When presenting researched findings, include:

- **Observed behavior**: what happens and where.
- **Version scope**: library/API versions involved.
- **Evidence**: docs/source/release notes/experiment used.
- **Conclusion**: what is true for this project.
- **Action**: the smallest recommended implementation or mitigation.
- **Unknowns**: any remaining uncertainty, especially OEM or API-level variation.

## Validation Checklist

- [ ] Exact dependency and SDK versions are known.
- [ ] Claims are grounded in official docs, AndroidX/AOSP source, release notes, or a reproducible experiment.
- [ ] Version-specific conclusions are not generalized beyond the evidence.
- [ ] Community sources are treated as secondary hints.
- [ ] The final recommendation includes confidence and implementation impact.
