---
name: jetpack-compose-source-tracing-gate
description: Source tracing gate for Jetpack Compose Source Tracer. Investigates AOSP/AndroidX source code, third-party library internals, undocumented Compose behavior, version-specific bugs, and documentation accuracy through source-level tracing, dependency insight, and reproducible experiments.
---
# Jetpack Compose Source Tracing Gate

## Mission

Verify the correctness of claimed Compose or Android platform behavior by tracing the actual implementation in AOSP source, the AndroidX monorepo on GitHub, or third-party library source trees. Resolve ambiguity between documentation and observed behavior. When authoritative source is found, record evidence with full provenance including repository, tag, file, and line number. When source cannot be located, clearly document the assumption as unverified.

This gate is a novel capability unique to the Android Compose role. When official documentation is insufficient, ambiguous, or missing — which is common for Compose internals, recent API additions, and edge cases — this gate provides the highest tier of evidence by reading the actual source code that runs on the device. It also detects documentation gaps that should be filed as issues.

## Inputs

- Engineering State block from the Engineering Lead containing: compose_bom_version, agp_version, kotlin_version, and relevant library dependency versions from the project's `build.gradle.kts` or `libs.versions.toml`.
- Specific behavioral questions, claims, or code patterns requiring source-level investigation.
- Code diff referencing APIs whose behavior is under question.
- Reference documents: `references/source-research.md` for the evidence hierarchy, AndroidX monorepo navigation guide, cs.android.com navigation guide, and citation format; `references/evidence-first-research.md` for citation discipline and escalation rules; `references/schemas.md` for the gate report contract.

## Required Checks

- Identify the exact source file and line number in AOSP or AndroidX that governs the API behavior in question. Use the repository tag or branch matching the project's resolved dependency version (e.g., `androidx.compose-1.6.0` for Compose 1.6.0, `androidx.lifecycle-2.8.0` for Lifecycle 2.8.0).
- Trace the call chain from the public API entrypoint to the internal implementation. Note key delegation points, compatibility wrappers (`ApiHelpers`, `ViewCompat`, `*Impl` classes), and any platform version checks (`Build.VERSION.SDK_INT >= ...`) that branch the behavior.
- Check behavior differences across multiple Android API levels or Compose BOM versions by comparing source between release branches and tags. Document the version range where the observed behavior applies.
- Verify the observed or claimed behavior against official documentation at developer.android.com. When documentation is absent, incomplete, or misleading, document the gap explicitly in advisory_notes.
- Record every finding with full citations in `source: <path/URL>:<line> — <what was verified>` format. Follow the citation examples in references/source-research.md Section 7. Every citation must include a concrete what-was-verified statement.
- For third-party libraries, trace from Maven coordinate to GitHub repository to source tag to the exact source file and line. Extract SCM tag from the POM file when the GitHub URL is not obvious from the library name.
- Run local Gradle dependency insight commands (`./gradlew :app:dependencyInsight --dependency <artifact>`) to confirm the resolved dependency version matches the source tag under examination.
- Design a minimal reproducible experiment (a standalone Compose project or test file) when source inspection and documentation disagree, or when the behavior remains ambiguous after thorough source examination. Document the experiment setup and expected outcome.
- Document unresolved assumptions explicitly as `[assumption: not verified — could not locate the source for this internal Compose behavior in any public repository]`. Do NOT fabricate citations for unverified behavior.

## Pass Criteria

- **Pass**: All behavioral claims are verified against authoritative source with full citations (repository, tag, file, line). Documentation gaps are noted in advisory_notes. No assumptions are presented as verified facts. Citations follow the required format.
- **Fail**: Claims are contradicted by source inspection but not corrected in the report. Source is claimed without a verifiable citation (missing file/line/tag). An assumption is presented as a verified fact. No reproducible experiment was conducted when source and docs disagree.
- **Conditional Pass**: Source is located but some behavior remains ambiguous (e.g., the code branches based on a runtime flag not present in the project configuration). A reproducible experiment is designed or recommended in advisory_notes to resolve the ambiguity.

## Output Format

Return a `gate_report` inside a ```result fence with these fields:

```yaml
gate: source-tracing
status: pass | fail | needs-user-input
evidence:
  - "source: github.com/androidx/androidx/blob/androidx.compose-1.6.0/compose/foundation/.../LazyColumn.kt:285 — confirmed default key generation uses content identity, not index"
  - "source: developer.android.com/develop/ui/compose/layouts/lazy-column — confirms stable key requirement"
  - "issue: issuetracker.google.com/123456789 — confirmed BOM 2024.02 HorizontalPager scroll regression"
blocking_issues:
  - "Claim that 'LazyColumn keys default to index' directly contradicts source at LazyColumn.kt:285"
required_revisions:
  - "Add explicit key parameter to LazyColumn items — use content identity, not index"
advisory_notes:
  - "Documentation gap: official docs do not specify behavior when LazyColumn key parameter is omitted"
  - "Behavior confirmed for Compose BOM 2024.06 only — earlier versions may differ"
verification: "Minimal Compose test confirming key behavior — see /tmp/compose-key-test/"
```

## Review Flow

1. Pin the exact dependency versions from the Engineering State or project build files (Compose BOM, AGP, Kotlin, library versions).
2. Define one specific, falsifiable question about the API behavior under investigation.
3. Search the evidence hierarchy in order: project source → official docs (developer.android.com, Context7) → AndroidX GitHub source (tag matching pinned version) → AOSP cs.android.com → issue tracker → local Gradle cache.
4. For AndroidX source, navigate to the correct module directory under `github.com/androidx/androidx/tree/{tag}/compose/{module}/src/`.
5. Trace the call chain from public API entrypoint to internal implementation, documenting each delegation point.
6. Record findings with full citations in `source: <URL/Path>:<line>` format.
7. If behavior is ambiguous after source inspection, design a minimal reproducible experiment.
8. Compile findings into a gate report with evidence citations and any assumptions marked as unverified.

## Antipatterns to Detect

- **Version mismatch**: Tracing source from the wrong library version (e.g., Compose 1.7 source for a project using Compose 1.6).
- **Incomplete call chain**: Stopping at the first public API entrypoint without tracing through internal delegation to the actual implementation.
- **Citation without file:line**: Claiming source supports a behavior without providing the exact file path and line number.
- **Fabricated citation**: Asserting source existence without actually visiting the file — detectable when the citation URL does not resolve.
- **Ignoring version guard**: Overlooking a `Build.VERSION.SDK_INT >= ...` branch that makes behavior conditional on API level.
- **Docs-only reliance**: Accepting official documentation as sufficient without verifying against actual source for edge cases.
- **Unverified assumption presented as fact**: Using phrases like "this is how it works" for behavior that was not actually traced.
- **No experiment when source is ambiguous**: Declaring failure instead of designing a minimal test to resolve source ambiguity.

