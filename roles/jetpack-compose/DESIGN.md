# Jetpack Compose role design

The lead owns design, production edits and acceptance. Six read-only specialists provide
selected evidence; the seventh child, journey-recorder, can organize sealed evidence in a
separate optional graph. Ordinary bounded work stays inline. A completed graph confirms
delivery of reports, not correctness of the app.

## Content ownership and loading

| Owner | Responsibility |
| --- | --- |
| `PROMPT.md` | Design judgment, encapsulation, investigation limits, verification tiers, completion and specialist/skill selection |
| `functions/engineer.md` | Short continuation reminder; no independent phase machine |
| `functions/research.md` | Entry into `android-source-research`, without a second research protocol |
| `references/schemas.md` | Brief, gate report and recording payload contracts |
| `references/graph-protocol.md` | Executable graph declarations, outcomes and bounded recovery |
| Domain skills | Implementation guidance for state, architecture, layout, performance, testing, interop and platform integration |
| Four `references/compose-*.md` indexes | Review questions and links to domain owners, without duplicate code tutorials |
| Style skills | Composable API shape or plain Kotlin idioms; detailed examples in skill-local references |
| Reviewer manifests | Identity, tools, scope and gate routing |
| Gate skills | Domain decision criteria and report mapping, not copies of implementation tutorials |
| Device transport playbooks | Command procedures and journey evaluation for the selected Android or HarmonyOS/OpenHarmony target |
| Device memory/video references | Retention and temporal evidence only when the task needs them |
| `references/background-recording.md` | Sealed inputs, exclusive output ownership and optional recording lifecycle |

Keep skill names and role-relative reference paths stable for callers. Load only the
material needed for the current decision. A source belongs in the primary guidance that
uses it; a style or review document should link there rather than copy the same example.
Keep entry points selective, but keep unique decision rules, constraints and working patterns
in reachable references. A short rule does not replace an example that explains essential
wiring, ownership, cancellation, restoration or an assertion. Moving useful depth out of the
entry point is preferable to deleting it. Do not create a second copy of the same tutorial.

## Review and evidence boundaries

Independent questions can run concurrently over a stable snapshot. Consumer inputs express
real dependencies; reports are evidence, not automatic state patches. The lead integrates
findings, makes bounded repairs and verifies the changed risk. Pattern preferences without
a concrete failure mechanism stay advisory. Tests exercise production contracts and do not
justify visibility widening or a test-only abstraction.

Runtime acceptance uses the actual target and artifact with its matching transport. Keep
minimal build/device/action/outcome evidence, including blockers and not-run steps. Old
passes cannot certify a new build. Device verifiers return temporary evidence; the lead
retains it and alone merges shared records. Optional recording does not block repair or
acceptance, and no worker lifetime beyond the host is promised.

## Maintaining examples

Use current official documentation and the project's resolved artifacts for API claims.
Never invent a source tag, line number, issue, method or successful command result. Identify
version boundaries and omitted application types in snippets. A short example illustrates
one decision; it is not a complete app, dependency catalogue or universal architecture.
Repair a stale example when its underlying pattern remains useful. Remove it only when
the pattern is wrong, duplicated at a named destination, or adds no decision/wiring detail.
For substantial condensation, compare original sections and record each unique capability's
new location or explicit removal rationale. Check that linked resources are discoverable
through the real skill resolver. Reduced line count is a size measurement, not acceptance.

Validation distinguishes loader/protocol compatibility from generated app behavior. Run
the registry validator and the role's existing runtime contract suite after structural
changes; compile self-contained Kotlin examples when changed. These checks do not establish
content completeness: review the original-to-current coverage map separately. An Android snippet needs
its imports, resolved dependencies and host project before a build can verify it. Model
trials and device execution are separate evidence, never implied by documentation checks.
