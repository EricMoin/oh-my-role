# Device test memory

Use this protocol for physical-device or emulator verification, including runs blocked before
installation. Preserve enough observed evidence to recover an interrupted task. This is
project-local operational memory, not proof that the current build works and not a replacement
for automated regression tests. Choose the smallest useful record; documentation completeness
must not delay a repair or require another device run.

## Record depth

- **Compact (default):** a run snapshot, incremental outcomes and the essential sanitized raw
  evidence. Include the target/build, declared actions and assertions, actual result, failures,
  blockers and unverified scope. Inline checks do not require a reusable case, device profile,
  XML journey, index entry, frame catalog or narrative report merely to satisfy this protocol.
- **Reusable:** add or revise a case when it represents a recurring regression or a useful new
  branch of an existing journey. Independent dispatch requires a frozen executable journey,
  not a reusable case. Update a device profile only for relevant existing knowledge or a newly
  observed environment pitfall. Reuse the same case for the same behavior; a new run is not a
  new case. Independent device-verifier dispatches retain their complete journey contract.
- **Deep evidence:** retain the additional temporal analysis required to resolve a specific
  timing question, or the broader records required by an explicitly requested audit or
  independently repeatable handoff. Follow `references/device-video-debugging.md` for escalation
  criteria. A simple animation fix does not automatically select this depth.

These levels control record depth, not acceptance truth. A failed assertion remains failed,
required current-build checks still run, and setup failure leaves app steps `not-run` at every
level. Optional enrichment can be skipped or delegated to `jetpack-compose--journey-recorder`.

## Storage and ownership

Resolve the target project's absolute workspace root once. Use that root, not the role
installation, Android module, incidental shell directory or agent home. In a monorepo include
app/module and application ID in each run and reusable case.

Create only the files needed for the selected depth:

```text
<project-root>/.rolebox/jetpack-compose/device-testing/
  runs/<run-id>/snapshot.md          # target/build, plan, evidence directory and record depth
  runs/<run-id>/observations.md      # incremental actual outcomes; sealed at handoff
  runs/<run-id>/evidence/            # essential sanitized captures/logs; video when needed
  runs/<run-id>/report.md            # optional enriched report
  runs/<run-id>/journeys/<case-id>.xml # frozen executable journey when used
  runs/<run-id>/proposals.md         # optional proposed shared-memory changes
  runs/<run-id>/archive/<unique-id>/ # exclusive background recorder output, if dispatched
  README.md                         # optional searchable index
  devices/<profile-id>.md            # relevant environment knowledge/pitfalls
  cases/<case-id>.md                 # reusable intent, journey and assertions
```

Use descriptive stable profile/case IDs and a timestamp with timezone plus a unique suffix
for each run ID. Never overwrite a prior run. Record `schema_version: 1`; keep stored links
relative to the memory directory or run so they survive moving the checkout.

For a short run, snapshot and observations may be one compact file.

The lead owns target selection, execution decisions, acceptance and the minimum durable
snapshot/outcomes. The independent device-verifier keeps Write/Edit disabled and writes its
incremental report and captures only to its unique external temporary evidence directory. It
returns paths and observations in accepted outcome data; it never writes `.rolebox` through a
shell to evade that boundary. Inline lead verification may write directly into its run.

The journey-recorder may write only its assigned run subtree, after the lead seals and hands
off its inputs. Give it exclusive write ownership of that subtree until completion/failure;
the lead and other workers must not edit it concurrently. The recorder may add a report,
relative links and proposals, but must not change sealed snapshots, observations or raw
evidence, rerun a device journey, operate a device, edit product/test code, decide acceptance,
or write shared indexes, profiles or cases. The lead alone merges shared-memory proposals,
serially after rereading current files. This write scope is a dispatch/prompt contract, not a
filesystem sandbox guarantee; follow `references/background-recording.md` for graph details.
A later verification uses a fresh run directory.

Keep scratch helpers inside the run or verifier's temporary directory and normal build output
in normal build directories. Reference the artifact path and digest instead of copying APKs.
Keep this subtree untracked: respect `.rolebox/` ignores, or add only this subtree to the
repository's local exclude file. Do not force-add records or change shared ignore policy.
No Git repository is required. Memory belongs to this checkout; import another history only
from an explicitly identified project-matching source and record its origin.

## Before testing: bound lookup and freeze the target

1. Confirm the app, entry point, behavior and acceptance assertion before device exploration.
   If plausible targets require materially different fixes, resolve that ambiguity first.
   Do not investigate every candidate merely to postpone target confirmation.
2. Perform one focused lookup of an existing index, matching cases/profile and a recent related
   run if available. Match app/module, goal/assertion, start state and relevant environment.
   Missing records mean no local history. Stop lookup when a usable setup/pitfall is found or
   the focused search returns none; exhaustive history reconstruction is not a prerequisite.
3. Reuse relevant setup/navigation, revalidating prerequisites/selectors against the current
   UI, OS/ROM, variant, permissions and fixtures. Old coordinates are historical evidence;
   use semantic targets and fresh screen state. An old pass is never a current pass.
4. Save a compact `in-progress` snapshot before device operations with identity, the short
   action/assertion list, the hypothesis if diagnostic, required evidence and the next stop
   condition. Persist meaningful outcomes as they occur so interruption cannot erase the run.
5. For independent dispatch, also freeze the complete executable journey with existing case
   IDs/revisions when available (an ephemeral run-scoped journey need not create a case).
   Include target profile or observed target facts, relevant pitfalls, absolute memory root,
   artifact identity and unique external evidence directory. Serialize access to the same
   device. The worker persists its own incremental report for lead-owned recovery.
6. Apply one shared per-hypothesis budget of at most three attempts across exploration,
   reproduction, diagnosis and flakiness measurement. Each retry needs a concrete new question
   or changed condition; stop earlier when evidence adds nothing. New take names, tool changes
   or calling a run “exploratory” do not reset the budget. Renaming the same unresolved
   hypothesis does not create a new budget. A code fix permits a new current-build
   validation round, with a stated expected change. Once evidence explains the defect, repair;
   once required current-build assertions pass and no material uncertainty remains, stop.

For reusable cases, compare by **app + goal/assertion + start state + significant conditions**.
A distinct branch may use `extends` with its base case/revision and coverage delta; materialize
all inherited steps in the executed snapshot. Increment revision when steps/expectations
change and mark obsolete cases `stale`/`superseded` with a reason/replacement. The lead can merge
these maintenance changes later; they are not prerequisites for fixing the current defect.

## Installation and device pitfalls

Treat installation as setup, separate from app assertions. Record command start/result
(or pending/timeout), any observed installer prompt/manual action, final install result, and
launch of the intended package/build. An older installed app or absence of terminal error is
not proof that the requested artifact was deployed.

Some devices may show “同意并安装” or a similar confirmation after `adb install`. This is a
diagnostic possibility, not a universal brand rule or an observed fact about this device.
When installation waits or appears blocked:

- Inspect the current installer screen before issuing another install. Record the actual
  prompt, package/file and current control; do not loop installs or blindly reuse coordinates.
- Complete an ordinary confirmation for the requested app within existing authorization and
  available tools, recording agent/user action and the result. If physical action, unlock,
  credentials or a policy decision is required, request only that missing human action.
- Inspect the original attempt with a bounded wait. After timeout check device/package state
  before one justified retry, recorded separately. Confirm package/version and observable
  artifact build identity, then its start screen before app assertions.
- Do not bypass security, disable protection, uninstall an app or clear data just to make
  deployment green. Diagnose the observed conflict, storage, trust or policy restriction.
  If necessary authority/information is missing, setup is blocked and app steps `not-run`;
  a dispatched gate is `escalate`, not an app failure or pass.

Record a novel pitfall compactly in the run first. A reusable profile entry has a stable ID,
precise model/OS/ROM/tool/install-route scope, symptom/evidence, attempted fixes including
failures, confirmed resolution or blocker, human-action requirement and first/last run/date.
Separate `observed`, `hypothesis` and `resolved`; revalidate after scope changes. Merge repeat
occurrences with new run links, preserve conflicting evidence and narrow applicability. An
app defect belongs to the failing assertion, not a device workaround. Updating a profile can
be proposed by the recorder without blocking repair.

For transient paths unresolved by static evidence, follow `references/device-video-debugging.md`.
Use the existing attempt budget, retain each failed take, and add only the capture metadata and
analysis needed for that question. Reusable capture triggers and export pitfalls can be added
to cases/profiles later.

## Minimal record contract

Use `unknown`, `not-run` or `not-observed` rather than inventing facts. The following template
may be split between `snapshot.md` and incremental `observations.md`; a compact record can be
only a few lines. Fields irrelevant to the run may be `none` or omitted with a clear reason.

```markdown
# <run-id>
schema_version: 1
Started/updated: <timestamps with timezone>
Execution state: <in-progress/completed/blocked/interrupted>
Record depth: <compact/reusable/deep>
Archive state: <minimal-saved/not-needed/pending/completed/failed/skipped>
App/module/application ID: <identity>
Source/artifact: <commit + local diff identity or other snapshot; variant, build ID, path, digest; unknowns explicit>
Target: <device alias, observed OS/ROM/tool versions and relevant conditions; profile link if any>
Plan: <entry/start state, ordered actions and required assertions; journey snapshot if dispatched>
Diagnostic budget/stop: <hypothesis, attempts consumed, expected evidence or next stopping condition>
Setup: <actual deploy result, relevant prompt/actions; blocked app steps are not-run>
Outcomes: <assertion → expected/observed → pass/fail/blocked/not-run → essential evidence path>
Failure classification: <app_defect/harness or environment defect/environment_unavailable/flaky behavior/none>
Accepted gate: <status and outcome_id if dispatched; otherwise inline>
Evidence: <retained paths/digests where needed; inspected vs captured-only; missing items explicit>
Limitations/cleanup: <unverified scope, first failure, remaining steps, outstanding restoration>
Enrichment: <none, or graph/node and assigned run root; pending/failed work and recoverable input paths>
```

Record exploratory actions that materially affect the diagnosis, with actual actions and
observations labeled exploratory; do not transcribe every redundant read. They are not
retroactive acceptance of an undeclared journey. A failed assertion stays failed even if a
later action succeeds. Preserve partial runs at interruption/setup failure and mark remaining
steps `not-run`. Reconcile an old `in-progress` record as interrupted or resumed with explicit
new evidence; never infer a pass.

Reusable artifacts need only these additional facts:

- **Index:** project/app identities, case ID/revision/coverage/state/latest run, relevant profile
  links and open blockers. An absent index does not make a compact run invalid.
- **Profile:** environment scope and the pitfall contract above; no generic inventory or new
  profile required merely because a device was used.
- **Case:** app identity, goal/risk, revision/state, prerequisites/start/reset, semantic actions
  and assertions, full executable journey when used, applicable conditions, cleanup, `extends`
  delta if any, temporal capture trigger when necessary, and change/run history.
- **Enriched report:** source/artifact/target snapshot, declared vs executed steps, actual
  command/manual actions, expected vs observed results and evidence, setup/failure classification,
  limitations/cleanup, and only the video analysis needed for the selected depth.

## Closeout and optional background enrichment

For a dispatched verification, return `device_test_record` per `references/schemas.md`:
`run_id`, `case_refs` (IDs/revisions; empty for an ephemeral journey), `device_profile` (null if
none), `report_path`, `journey_paths`, `evidence_paths`, and `pitfall_observations` (empty if
none). Paths initially point to the verifier's external files. If output/capture is unavailable,
use null/empty paths and retain actual partial observations and missing evidence in
`verification`; never fabricate a report. The lead preserves a minimal blocked/interrupted
record even when the worker report cannot be retrieved.

The foreground obligation is small and cannot be delegated away:

1. Read the evidence needed for acceptance, retaining failures and missing steps as such.
2. Save source/artifact/target identity, actual outcomes and essential sanitized raw evidence
   into the unique run directory before temporary inputs disappear. Do not use per-command
   worker scratch as a handoff location: it may be removed after the command. Verify these
   essential durable paths. This can be one compact checkpoint; polished tables, case maintenance, full frame
   catalogs and narrative reports are optional.
3. If optional enrichment adds value, seal the snapshot/observations and raw evidence, set
   archive state `pending`, and declare a separate graph for `jetpack-compose--journey-recorder`
   with exact inputs, a disjoint exclusive archive directory and expected report/proposals. Submit it asynchronously
   before continuing the next repair/build step; do not put it on the device/code verification
   dependency path or wait for it merely to resume fixing the defect. Do not dispatch for a
   trivial record whose enrichment has no reuse value. If asynchronous execution is unavailable,
   leave enrichment pending/skipped explicitly; do not claim a worker is running.
4. The recorder produces only derived run-local documentation and shared-memory proposals.
   Incorporate its result opportunistically; the lead rereads and serially merges useful
   index/profile/case changes. Optional archive failure or a still-running graph is an explicit
   archival limitation, not app failure and not a reason to rerun checks or delay delivery.
   Keep recovery inputs and graph identity; report a background job as running only while the
   runtime supports that status; do not promise survival after the host exits. Do not claim
   completion before accepting its output.
5. Report observed verification, material limitations and the compact record path. Mention
   pending/failed enrichment when applicable; do not present optional bookkeeping as unfinished
   product repair. If the user explicitly requires complete archival for handoff, that output
   becomes required and must be checked before claiming that handoff complete.

Preserve failures and required evidence; never discard them to simplify a report. Retain only
relevant, sanitized material: use device/account aliases, strip raw serials, personal data,
secrets and graph credentials from logs/commands, and inspect captures for sensitive content
before retention. Do not archive unrelated logs or app inventories. Relevant model/OS facts
belong in local records, not personal host facts in the shipped role. If bulky optional
intermediates are pruned later, keep the result and mark unavailable links; never present a
broken link as accessible evidence. Promote frequently repeated cases into the existing
automated suite when warranted, linking the test from the case.
