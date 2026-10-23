# Inter-agent contracts (schema_version: 1)

Every role-authored business payload is a JSON object with `schema_version: 1`.
Submit it as the `data` argument of
`graph_submit_outcome({graph_id, node_id, outcome_id, credential, data})` for the
outcome id the node declares. Accepted attempt results are the transport authority:
the lead reads them from `attempts[].result` with `graph_status`. A prose message, a
chat update or an inferred completion is not transport and releases no consumer.
Never put the attempt credential, the graph id or unrelated/private host state into business data.
Device reports may include verification-relevant model/OS/ROM/tool versions and sanitized
artifact paths with profile aliases, per `references/device-test-memory.md`, never raw serials.
Reject unknown schema versions, missing required fields and unknown ids.

The Strategy `plan_revision` is the coordinator's business identifier; the engine's
compiled `plan_revision` is a content digest of the declaration. Track both and
never substitute one for the other.

## Engineering brief (prompt-embedded contract)

The brief is embedded in the node prompt; it is not a graph payload. Include only
project facts relevant to the decision, and leave unknown facts explicitly unknown.

| Field | Content |
| --- | --- |
| goal | User-visible behavior and acceptance criteria |
| scope | Affected files/modules, callers, and explicit non-goals |
| snapshot | Commit plus local diff/artifact identifier; include uncommitted changes |
| project_facts | Relevant versions, established architecture, build/test conventions |
| invariants | Properties that must survive the change |
| ownership | State, decisions, identity, resource lifetimes and dependency direction |
| design_decision | Chosen boundary, alternatives/trade-offs, and why this is sufficient |
| api_surface | Visibility changes and their production justification; otherwise none |
| risks | Concrete possible failures; empty is allowed |
| verification_plan | Scenario to observable assertion to appropriate test/check |
| verification_results | Actual commands/outcomes and checks not run, with reasons |
| verification_tier | focused, runtime or extended, with the concrete reason for escalation |
| stop_condition | Evidence sufficient for implementation/acceptance, remaining uncertainty and reproduction budget |
| open_questions | Optional unresolved intent, environment, or API questions |

An ordinary inline fix needs only target, expected behavior, likely mechanism, smallest
change and completion checks. It does not instantiate every brief field or a plan file.

A source-tracing or review request adds the concrete question, the reviewed object
(the snapshot/diff and artifact paths to inspect) and the read-only scope. A
consultation reports design uncertainty; it cannot certify compilation,
implementation or tests that do not yet exist.

A formal device-verification dispatch also includes the target project's absolute memory
root if present, run ID, existing case IDs/revisions when applicable and complete frozen
journeys, relevant profile/pitfall excerpts, artifact identity, and a unique temporary
evidence directory outside the repository. A new journey may be scoped to this dispatch
without first creating a reusable case/profile/index. Follow
`references/device-test-memory.md`; the verifier reads history but cannot update it.
For a transient/timing-dependent path, include the diagnostic question and capture interval
per `references/device-video-debugging.md`, plus the remaining reproduction budget. The
worker may add observation but cannot rewrite the journey or independently expand its scope.

## Gate report (submitted as accepted outcome data)

Each read-only gate writes this report and submits it as the `data` payload of the
outcome it settles. The report carries `schema_version: 1` and the settled outcome
id, so the accepted result is self-identifying.

| Field | Content |
| --- | --- |
| schema_version | 1 |
| outcome_id | The outcome id this report settles: report, pass, revise or escalate |
| gate | architecture, ui-layout, test-quality, performance, device-verification, or source-tracing |
| status | pass, fail, or needs-user-input |
| reviewed_snapshot | The revision/diff actually inspected |
| evidence | File:line, command output, or source citation; distinguish inspected from executed |
| blocking_issues | Concrete failure mechanisms with stable issue IDs; required for fail |
| required_revisions | Changes needed to address each blocker without prescribing incidental implementation |
| advisory_notes | Optional preferences and non-blocking improvements |
| verification | Checks actually performed and missing evidence; proposed checks labeled as proposed |
| engineering_state_patch | Optional proposed corrections to brief facts, merged only by the lead |
| device_test_record | Required for device-verification, omitted for other gates: run_id, case_refs (IDs/revisions), device_profile, report_path, journey_paths, evidence_paths, pitfall_observations; see references/device-test-memory.md |

The device record links the actual execution and installation observations, including
failed or blocked runs. Paths identify external temporary files; use null/empty paths
when unavailable and carry the partial observations and missing evidence in `verification`.
Empty `case_refs`/`journey_paths` and a null `device_profile` are valid for compact inline
records without reusable cases/profiles; an independently dispatched verifier still supplies
its frozen journey. The lead retains minimal accepted facts/evidence and may delegate
optional organization to a journey-recorder. Only the lead merges shared records. The
verifier's historical lookups never count as current execution. No new gate outcome is added.
For targeted video, retain the inspected clip/decisive frames and name the action and limits.
For detailed timing analysis, include the original recording, frame metadata/index, inspected
source-PTS interval, relevant clock alignment/uncertainty and analysis. Name capture gaps and
uninspected media in either tier.
A captured file alone is not verification; no extra outcome or required video on every run.

`status: pass` means no supported blocking issue exists in the assigned scope, not
proof of the entire feature. Advice with no blocker is a pass with advisory notes;
there is no conditional-pass status. Missing required evidence must be explicit:
never turn inability to assess into a pass. Use `status: needs-user-input` for
unavailable essential evidence or user intent and name who can resolve it; the lead
asks the user only when local investigation cannot resolve it.

The report status maps to the settled outcome as follows:

| Gate report status | Settled outcome |
| --- | --- |
| pass | pass |
| fail with concrete blockers | revise, carrying stable required_revisions |
| needs-user-input | escalate, with the smallest missing question or recovery action |
| source-tracing assessment, any finding | report, including negative findings |

## Outcome vocabulary

| Domain | Declared outcomes | Meaning |
| --- | --- | --- |
| Execution | done, failed, blocked, clarification_required, approval_required | Change applied and its local checks recorded; work incomplete; a concrete prerequisite unavailable; a user decision required; an approval request prepared. None of these is a passing report on its own. |
| Review and validation | pass, revise | Required criteria supported in the assigned scope, or concrete correctable defects with stable `required_revisions` |
| Review escalation | escalate | Essential evidence or user intent is unavailable |
| Evidence | report | The assigned assessment completed, including negative findings; not a product verdict |
| Optional recording | recorded, incomplete | Supplied evidence organized, or partial/unavailable archival; neither decides product acceptance |

This role's mapping:

- `source-behavior` and `source-versions` are source-tracing evidence nodes; each
  settles `report`. A failing check or a negative finding is still `report`: the
  assessment completed, and it is neither a product verdict nor an acceptance.
- `architecture`, `ui-layout`, `test-quality`, `performance` and
  `device-verification` are review gates; each settles `pass` when no supported
  blocking issue exists in its assigned scope, `revise` for concrete blocking
  issues with stable `required_revisions`, and `escalate` when essential evidence
  or user intent is unavailable.
- `device-verification` is the gate over a built artifact: `pass` means the
  declared journey and its acceptance criteria hold on the device with cited
  evidence, `revise` means a concrete app defect was reproduced on the device
  (carrying the failing step and the observed state), and `escalate` means no
  device/emulator/SDK, an unbuildable or uninstallable artifact, or missing user
  intent. The report names the transport and the toolchain actually used for the
  run — the `android` CLI and `adb`, or `hdc`, read at run time — and the install
  route it used: `hdc install` for a HAP, HSP or APP package, or 文件管理 → the local
  `.apk` → 直接安装 on a HarmonyOS NEXT or OpenHarmony target with no `adb` —
  so this one gate serves both transports. Its report keeps
  `gate: device-verification` and the same pass/revise/escalate mapping as the
  other gates.
  For a local APK, cite the target file and the selected 直接安装 control with its
  screen evidence; 卓易通安装 opens the store and is not proof of local installation.
- The six-node sample in `references/graph-protocol.md` illustrates composition, not
  a mandatory batch. Select only nodes needed for a material risk. Declare a
  `device-verification` node only when runtime evidence must be independent;
  ordinary inline runtime verification does not require a graph.
- The optional `journey-record` node lives in a separate graph from acceptance,
  follows the Recording report below and settles `recorded` or `incomplete`.
- This role declares no production execution node, no validation node and no approval
  node, because the lead owns production writes, acceptance and any user approval.
  `done`, `failed`, `blocked`, `clarification_required` and `approval_required`
  are therefore documented for completeness of the engine vocabulary and are never
  submitted by these six read-only specialists.
- `revise` and `escalate` return findings to the lead. The lead owns the repair and
  any fresh review batch for a changed snapshot, and a settled graph is not
  acceptance of the reviewed design.

## Recording report (optional background outcome)

The recorder submits this object as `data`; it is not a gate report and has no product
pass/fail status. Graph acceptance confirms delivery of the payload, not its truth.

| Field | Content |
| --- | --- |
| schema_version | 1 |
| outcome_id | recorded or incomplete; matches the submitted outcome |
| run_id | The supplied run identity |
| source_snapshot | The supplied source/diff identity; never infer from the live checkout |
| input_record | Absolute path to the sealed minimum record |
| output_directory | The exclusive directory assigned in the dispatch |
| written_paths | Actual files written inside that directory; empty if none |
| proposals | Optional case/profile/index proposals, with base identity and path inside the output directory; empty if none |
| limitations | Missing inputs, unavailable paths, unfinished outputs or failed writes; required for incomplete |

`recorded` requires the requested organization to be complete with existing output paths;
it can preserve a failed product run. `incomplete` retains partial paths and limitations
without fabricating a successful archive. A pending graph has no accepted Recording report.
The lead records pending/deferred/failed archival separately from product verification and
does not await optional enrichment before repairs or delivery. See
`references/background-recording.md` for lifetime, ownership and recovery constraints.

## Submission and acceptance

Submitting is the only way an attempt settles, and only the decision `accepted`
with verdict `committed` or `replayed` and no refusals settles it. A rejection or a
refusal writes nothing and leaves the attempt open: repair the payload or the
missing evidence and resubmit. An identical retry after an uncertain delivery is
idempotent; a conflicting submission cannot overwrite a settled attempt. Once
accepted, stop work on that attempt. Never fabricate an outcome, never print the
credential, and never rely on a prose verdict or an inferred completion.
