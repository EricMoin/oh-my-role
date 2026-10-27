---
name: android-source-research
description: Verify uncertain, version-specific Android and Jetpack Compose behavior using current official docs, resolved dependency source, and focused experiments. Use when APIs, implementation details, migration behavior, or platform differences need evidence.
---
# Android Source Research

Own the investigation workflow here. Use `references/evidence-first-research.md` for
citation policy and `references/source-research.md` for source navigation and commands.
Read those references only when their detail is needed.

## Workflow

1. Define one falsifiable question and the smallest observation that would answer it.
2. Inspect project files and, when resolution matters, the relevant Gradle dependency
   configuration. Record Kotlin/compiler plugin, AndroidX artifact versions, SDK levels,
   build variant and device facts relevant to the question. A BOM declaration alone
   does not prove the resolved version of each artifact.
3. For library/API documentation, use Context7: resolve the actual library name, choose
   the relevant authoritative result, then query one concept with its returned ID.
   If Context7 lacks coverage, open official docs or release notes directly. Do not
   invent a library ID or treat a search result as verified source.
4. If documentation answers the question for this version, stop researching. Otherwise
   inspect the matching published source artifact or a verified repository revision.
   Prefer exact local dependency sources to unrelated development-branch code.
5. Trace the relevant overload, defaults, implementation and platform/version guards.
   Compare versions only when the question depends on a difference.
6. If behavior remains ambiguous, run a focused reproduction when feasible. Record its
   build/device conditions and observed result; a proposed experiment is not executed
   evidence. If execution is unavailable, state the remaining uncertainty.
7. Report the conclusion, version scope, evidence and smallest justified action. Mark
   assumptions explicitly and avoid extending a finding beyond the inspected version.

## Scope and Stop Conditions

Use source tracing for undocumented internals, contradictory evidence or version bugs;
ordinary documented API use does not require reading an entire call graph. Community
articles can locate a lead but cannot establish the final behavior claim. Reuse evidence
within its verified scope instead of retrieving the same fact for each consumer.

Keep investigation bounded by the lead's hypothesis and diagnostic budget. Escalate only
missing intent or essential evidence that cannot be obtained; lack of a convenient tag is
not itself a reason to stop when the published sources are available.
