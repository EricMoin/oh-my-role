# Device test memory

Use this protocol whenever the lead or device-verifier attempts physical-device or emulator
verification, including runs blocked before installation. Read existing records before planning;
persist actual results before closing the task. This is project-local operational memory, not
proof that the current build works and not a replacement for automated regression tests.

## Storage and ownership

Resolve the target project's workspace root once and pass its absolute path in the dispatch.
Use that root, not the role installation, an Android module, the shell's incidental working
directory, or the agent's home. In a monorepo include the app/module and application ID in
every case and run so different apps cannot share results accidentally.

The lead creates this directory lazily on the first device-testing task:

```text
<project-root>/.rolebox/jetpack-compose/device-testing/
  README.md                         # searchable index and project/app identity
  devices/<profile-id>.md            # environment and scoped installation/interaction pitfalls
  cases/<case-id>.md                 # reusable intent, prerequisites, journey and assertions
  runs/<run-id>/report.md            # what this execution actually did and observed
  runs/<run-id>/journeys/<case-id>.xml # exact journey snapshot executed in this run
  runs/<run-id>/evidence/            # retained screenshots, layouts and focused log excerpts
  runs/<run-id>/evidence/video/<take-id>/ # original recording, frame index, key frames and analysis
```

Use descriptive stable slugs for profile and case IDs, and a timestamp with timezone plus a
unique suffix for run IDs. Create a fresh run directory; never overwrite a prior run. Record
the schema version as `1` in the index and record templates below. Keep paths relative to this
memory directory in stored records so they survive moving the checkout.

The lead alone writes the index, device profiles, cases and durable run records. The independent
verifier keeps Write/Edit disabled, reads the relevant records, writes captures and its report
only to its unique temporary directory outside the repository, and returns their paths and
observations in accepted outcome data. It never writes `.rolebox` via a shell to evade its
read-only boundary. The lead archives the needed evidence and reconciles memory after reading
the accepted result; an inline verification by the lead follows the same record contract and
may write directly to the run directory. Normal build output stays in normal build directories.

Do not leave reports, screenshots, logs, helper scripts or copied APKs in the project root.
Put any necessary scratch helpers under the run directory (or the verifier's temporary
directory). Reference the built artifact and its digest rather than retaining APK copies.
Keep this subtree untracked: respect an existing `.rolebox/` ignore; otherwise add only this
subtree to the repository's local exclude file. Do not force-add records or alter shared ignore
policy just to store them. No Git repository is required. Local ignored memory is available to
agents using this checkout; it is not automatically shared across machines or worktrees. If
prior records are elsewhere, import only an explicitly identified project-matching source and
record its origin; never silently merge unrelated projects' histories.

## Before testing: retrieve, compare, extend

1. Read the index, then search `cases/`, relevant device profiles and recent related runs by
   app/module, feature, entry screen, action, assertion and failure symptom. An empty or missing
   directory means no local history, not that the behavior has never been tested.
2. Compare the intended case by **app + goal/assertion + start state + significant environment
   conditions**, not title or literal command sequence. Use the existing case ID for the same
   behavior. Re-running a regression creates a new run, not a duplicate case.
3. Reuse the known setup/navigation prefix and add the uncovered branch or assertion. A distinct
   scenario gets a new case ID with `extends` pointing to the base case ID and revision, plus the
   coverage delta and reason. Each executable journey must still be complete: materialize the
   inherited steps in the run snapshot so the worker never has to improvise them.
4. Validate old prerequisites and selectors against the current UI, OS/ROM build, app variant,
   permissions, account/data fixtures and tooling. Old coordinates are historical evidence,
   never reusable selectors. Use semantic labels/IDs and resolve coordinates from a fresh screen.
   Mark obsolete paths `stale` or `superseded`, with the reason and replacement, rather than
   silently deleting them. Increment a case revision when its steps or expectations change.
5. Explain the selection in the run plan: cases reused, extended, added or skipped and why.
   Risk-based regression re-runs are valid; avoiding duplicate case definitions must not skip
   current-build verification. An old pass is never a current pass, even on the same device.
6. Freeze the journey before dispatch. Include case IDs/revisions, the materialized journey,
   target profile and relevant pitfall excerpts, absolute memory root for read-only lookup,
   artifact identity, and a unique external evidence directory. When multiple workers exist,
   serialize use of the same device and let only the lead merge durable records.
7. Before device operations, the lead creates the run header as `in-progress`, saves the
   frozen journey snapshots and links the run from the index. Persist setup results and
   meaningful execution checkpoints as they become available; do not rely on a final chat
   message to preserve the whole session if it is interrupted. The independent worker keeps
   its own incremental report in the external evidence directory for lead-owned recovery.

## Installation and device pitfalls

Treat installation as its own setup phase, separate from the app journey. Record command
start, completion/exit status (or pending/timeout), the current installer screen, any manual
action, the final install result, and a launch of the intended package/build. The absence of
a terminal error or the presence of an older installed app is not proof of successful deploy.

For example, some devices may show an on-device “同意并安装” or similar confirmation after
an `adb install` attempt. This is a diagnostic possibility, not a universal brand rule or
an observed fact about the current device. When installation waits or appears blocked:

- Inspect the current installer screen before issuing another install command. Capture the
  actual prompt text, package/file being installed and current control location; do not loop
  on installs or blindly tap coordinates remembered from another phone.
- Complete an ordinary confirmation for the requested app when it is within the existing
  authorization and available interaction tools. Record whether the agent or user performed
  it and what was observed afterwards. If a physical action, unlock, credential or policy
  decision is required, identify that exact blocker and request only the missing human action.
- Await/inspect the original install attempt's result with a bounded wait; if it timed out,
  check device/package state before one justified retry. A retry is a separately recorded
  setup attempt. Confirm the installed package/version and the intended artifact's build
  identity where observable, then verify its start screen before beginning app assertions.
- Do not bypass installation security, disable protection, uninstall an existing app or clear
  its data merely to make deployment green. Diagnose the observed signature/version conflict,
  storage failure, connection/trust state or policy restriction and record the recovery tried.
  If recovery needs authority or information not already supplied, leave setup blocked and
  app steps `not-run`; the gate is `escalate`, not an app failure or a pass.

Every pitfall has a stable ID within its device profile, a precise scope (model/OS/ROM/tool
version/install route), symptom and evidence, attempted fixes including failures, confirmed
resolution or unresolved blocker, human-action requirement, and first/last observed run/date.
Separate `observed`, `hypothesis` and `resolved`; never promote a suspected fix without a
successful check. Revalidate after a ROM/tool/route change. Merge another occurrence into the
same pitfall with new run links; preserve conflicting evidence and narrow its applicability.
An app defect belongs in the run with a failing case, not as a device workaround.

For transient or timing-dependent paths that static evidence cannot explain, follow
`references/device-video-debugging.md`: record a bounded attempt and inspect source-timestamped
frames on the host. Record capture/export/tool pitfalls in the scoped profile, reusable capture
triggers in the case, and the original recording, key frames and action/log correlation in
the run. Multiple takes reuse the case ID and preserve each attempt's result.

## Record contract and starter templates

Fill facts from observation; use `unknown`, `not-run` or `not-observed` rather than inventing
values. The following placeholders are templates, not executed tests. Keep short records for
short runs; list only relevant environment conditions, without dropping identity or outcomes.

### Index: `README.md`

```markdown
# Device testing memory
schema_version: 1
Project/app identities: <project, modules, application IDs>

| Case ID | Revision | Goal / coverage | Conditions | State | Latest run |
| --- | --- | --- | --- | --- | --- |
| <case-id linked to cases/...> | <revision> | <assertion> | <conditions> | active/stale/superseded | <run link and result> |

Device profiles: <links to devices/...>
Open pitfalls and blocked runs: <links and next action>
```

### Device: `devices/<profile-id>.md`

```markdown
# <profile-id>
schema_version: 1
Kind: <physical/emulator>; transport: <adb/hdc>; model: <model or unknown>
OS/API/ROM build: <observed versions>; toolchain: <observed versions>
Relevant conditions: <locale, display/font scale, IME, permissions, network as needed>
Last verified: <timestamp with timezone and run link>

## <pitfall-id>: <symptom>
State: <observed/hypothesis/resolved>; applicability: <exact scope>
First observed: <run/date>; last observed: <run/date>
Evidence: <run evidence links, command result and actual prompt text>
Attempted recovery: <ordered actions and results, including failed attempts>
Resolution: <confirmed steps and postcondition, or unresolved blocker>
Human action: <none, completed action by user, or required action>
Recheck when: <OS/ROM/tool/install route change or conflicting observations>
```

### Case: `cases/<case-id>.md`

```markdown
# <case-id>: <goal>
schema_version: 1
Revision: <integer>; state: <active/stale/superseded>
App/module/application ID: <identity>
Coverage: <user-visible assertion and risk>
Extends: <none, or case-id@revision with coverage delta and reason>
Applicable profiles/conditions: <requirements, not an old pass>
Prerequisites: <install route, start screen, permissions, fixture/account alias, data/network state>
Setup/reset: <how to reach start state without assuming a preceding run succeeded>
Steps: <ordered user actions, semantic targets, test inputs and expected visible states>
Journey: <complete XML using the selected transport playbook's journey contract>
Cleanup: <what to restore; avoid destructive resets without existing authorization>
Temporal evidence when needed: <recording trigger, action interval and required frame/log checks; otherwise none>
History: <created/changed reason and run links; replacement if superseded>
```

### Execution: `runs/<run-id>/report.md`

```markdown
# <run-id>
schema_version: 1
Started/finished: <timestamps with timezone>
State: <in-progress/completed/blocked/interrupted>
App/module/application ID: <identity>
Source snapshot: <commit plus local diff identity, or non-Git snapshot identity>
Artifact: <variant, version/build ID, path and digest; unknowns explicit>
Device: <profile link plus actual OS/ROM/tool versions and relevant conditions for THIS run>
Selection: <reused/extended/new/skipped cases and reasons>
Case revisions and journey snapshots: <case-id@revision and local journeys/... links>
Setup/install: <commands, exits/pending/timeout, UI prompts, agent/user actions and final result>

| Case / step | Action / semantic target | Actual command or manual action | Expected | Observed | Result | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| <case-id / step> | <action> | <executed action> | <assertion> | <observation> | pass/fail/blocked/not-run | <relative evidence link> |

Result by case: <pass/fail/blocked/not-run; first failure and remaining unexecuted steps>
Failure classification: <app_defect/harness or environment defect/environment_unavailable/flaky behavior/none>
Gate result if dispatched: <status and outcome_id from accepted data; otherwise inline>
Pitfall observations: <profile/pitfall IDs; new observations, hypotheses, attempted fixes and next action>
Evidence manifest: <retained relative paths; inspected vs captured-only; unavailable/deleted items explicit>
Video analysis when needed: <capture provenance/settings/digest, source PTS interval, frame index/inspected frames, action/log clock alignment and uncertainty, findings vs hypotheses, baseline/fix run links; otherwise not-needed/unavailable with reason>
Cleanup: <device/settings/data/artifact disposition; outstanding restoration>
Limitations/next coverage: <what remains unverified and useful extensions>
```

Record exploration too: keep its actual action trail and observations in the run, labeled
exploratory. The lead may turn it into a new case afterwards; it is not retroactive acceptance
of a journey that was never declared. A failed assertion remains failed even if later actions
succeed. When interruption or a setup blocker ends execution, preserve the partial run and
mark the remaining steps `not-run`. An unfinished `in-progress` record found next session
must be reconciled as interrupted or resumed with explicit new evidence, never assumed passed.

## Closeout and handoff

For a dispatched run, include a `device_test_record` object in the gate data per
`references/schemas.md`: `run_id`, `case_refs` (IDs and revisions), `device_profile`,
`report_path`, `journey_paths`, `evidence_paths`, and `pitfall_observations` (empty if none).
Paths point to the verifier's external temporary files until the lead archives them. If
capture or file output is unavailable, use null/empty paths and include the actual partial
observations and missing evidence in `verification`; do not fabricate a report path. The lead
creates a blocked/interrupted durable record even when no worker report can be retrieved.

After each run, the lead:

1. Reads accepted evidence (or its own inline execution), preserving failures and missing steps.
2. Copies the necessary captures, logs, exact journey snapshots and report into the run
   directory before temporary evidence disappears. Rewrite links to relative durable paths
   and verify that every retained link resolves. Missing evidence remains explicitly missing.
3. Updates profiles/pitfalls and case revisions, then the index. Serialize these merges and
   reread existing files first; never replace another agent's records with an older snapshot.
4. Reports the run path, reused/new case IDs, observed pitfalls and verification limitations
   to the user. A memory write failure is a handoff limitation, not a reason to rerun the app
   or erase a verified result; surface it explicitly and retain retrievable evidence.

Retain only relevant, sanitized evidence. Use profile/account aliases, strip raw device
serials, personal data, secrets and graph credentials from commands/logs, and inspect screenshots
and recordings for sensitive content before retaining them. Technical model and OS/ROM versions belong in
project-local profiles when needed to reproduce a pitfall, never as personal host facts in
the shipped role. Do not archive unrelated logs or installed-app inventories. If bulky evidence
is pruned later, keep the textual result and mark its links unavailable; never leave a broken
link presented as accessible evidence. Promote a frequently repeated case into the project's
existing automated test suite when warranted, and link that test from the case.
