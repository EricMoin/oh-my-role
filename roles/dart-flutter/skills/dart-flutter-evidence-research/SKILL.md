---
name: dart-flutter-evidence-research
description: Evidence-first research discipline for Flutter/Dart — triggers documentation lookup via Context7, api.flutter.dev, pub.dev, and SDK source when encountering unfamiliar or version-sensitive behavior.
---

# Dart/Flutter Evidence-First Research

## Purpose

Activate this skill when you need to verify Flutter widget behavior, Dart API semantics, pub.dev package contracts, platform-specific differences, or version-sensitive decisions. It enforces an evidence-first workflow: research before code, cite or flag every external claim, and never rely on training-data memory alone for SDK behavior. Designed for every dart-flutter subagent (ui-layout-reviewer, architecture-reviewer, test-quality-reviewer, performance-platform-reviewer, release-engineer).

## Load References

- Read `references/evidence-first-research.md` for the full evidence tiers, citation formats, and core principles.
- Read `references/` for architecture, testing, performance, state management, networking/data, and platform-release domain-specific knowledge.

## Research Channels (Flutter/Dart Specific)

Use channels in priority order. Lower-numbered channels are more authoritative.

| Priority | Channel | How to Use | Best For |
|----------|---------|------------|----------|
| 1 | **Context7** | `context7_resolve-library-id` → `context7_query-docs` | Complex widget usage, API patterns, package version-specific behavior |
| 2 | **api.flutter.dev** | `webfetch` the API reference URL directly (`https://api.flutter.dev/flutter/{package}/{class}-class.html`) | Confirming class constructors, parameters, named arguments, return types |
| 3 | **api.dart.dev** | `webfetch` the Dart SDK reference (`https://api.dart.dev/stable/{version}/dart-{library}/`) | `dart:core`, `dart:async`, `dart:io`, `dart:convert`, `dart:ui` — parameter semantics and edge cases |
| 4 | **pub.dev documentation tab** | `webfetch` `https://pub.dev/packages/{name}` and append `/#-readme-tab-` or navigate to documentation | Third-party package API contracts, README examples, changelogs |
| 5 | **SDK source grep** | `grep` in local Flutter SDK cache (`~/flutter/packages/flutter/lib/src/`), `.dart_tool/` build cache, or search GitHub source | Internal behavior not documented in API reference, private methods, render object logic |
| 6 | **Flutter release notes / breaking changes** | `webfetch` `https://docs.flutter.dev/release/breaking-changes` or `https://docs.flutter.dev/release/release-notes` | Migration between major versions, deprecation timelines, breaking change rationale |
| 7 | **Dart language changelog** | `webfetch` `https://dart.dev/guides/language/evolution` | Language feature version gating (records in Dart 3.0, patterns in Dart 3.0, enhanced enums) |

## Activation Triggers

Load this skill when any of the following conditions are true:

- **Unfamiliar widget or API**: You are about to write code using a Flutter widget, RenderObject, or Dart API you have not used before in this project.
- **Platform-specific code**: Your task touches `dart:io` on web, `MethodChannel`, `Platform` checks, or conditional imports.
- **Version-sensitive behavior**: You need to know whether an API is available in the project's SDK constraints (check `pubspec.yaml` environment section), or whether behavior changed across major versions.
- **Performance claims**: You find yourself asserting "X is faster than Y" or recommending a pattern for performance reasons without a documentation citation.
- **Package internals**: You plan to access private fields, hook into undocumented streams, or rely on behavior not in the package's public API docs.
- **Contradicting documentation**: Your training-data memory and an observed behavior disagree — you need to verify which is correct.
- **Asserting convention**: You want to say "the standard Flutter way to do this is..." — verify that claim against official documentation first.
- **Build system questions**: Gradle config, Xcode entitlements, podfile setup, plugin registration, build mode effects.

Do NOT load this skill for:

- Reading local project files and following established patterns.
- Standard Dart syntax (nullable types, async/await, collection literals, imports).
- Conceptual architecture reasoning with no external API dependency.

## Workflow Steps

Follow these steps whenever research is triggered. Each step produces a recordable citation.

### Step 1: Identify the uncertain claim

State what you need to verify in a single sentence. This becomes the query to your research channel.

> *"I need to verify whether `AnimatedList.removeItem` triggers a rebuild of all remaining items, or only the removed item."*

### Step 2: Choose the research channel

Select the highest-priority channel that fits the claim type:

- Widget class API → Context7 or api.flutter.dev
- Dart `dart:io` behavior → api.dart.dev or SDK source
- Third-party package → Context7 or pub.dev docs
- Internal SDK mechanism → SDK source grep
- Breaking change → release notes / breaking changes page

### Step 3: Execute the lookup

- For **Context7**: call `context7_resolve-library-id` with the library name, then `context7_query-docs` with the specific question.
- For **api.flutter.dev**: construct the URL `https://api.flutter.dev/flutter/{package}/{Class}-class.html` and call `webfetch`.
- For **pub.dev**: construct `https://pub.dev/packages/{name}` and call `webfetch`.
- For **SDK source**: use `grep` in the local Flutter SDK path or search `source/flutter` on GitHub.
- For **release notes**: call `webfetch` on the relevant docs.flutter.dev page.

### Step 4: Record the citation

Write the finding in the execution report using the citation format:

- Primary evidence: `[source: <URL or filepath> — what was verified]`
- Not found: `[assumption: not verified — <reason>]`

### Step 5: If not found — flag as assumption

If you have exhausted the appropriate channels and still cannot find the answer, do NOT make up a citation. Record:

```
[assumption: not verified — could not find documentation for X in Context7, api.flutter.dev, or SDK source]
```

Then decide:
- **Proceed with caution**: note the assumption in the result report as an open item.
- **Escalate**: if the assumption is critical (crash risk, data loss, platform breakage), flag it as a blocker in the execution report.

## Verification

After completing research:

- [ ] Every external claim in the execution has a citation or `[assumption]` flag.
- [ ] No training-data-only claims are present.
- [ ] Citations include the accessed date for web sources.
- [ ] Research was completed BEFORE writing implementation code.
- [ ] The channel priority order was respected (Context7 > api.flutter.dev > pub.dev > SDK source > release notes).
