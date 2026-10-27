---
name: jetpack-compose-device-verification-gate
description: Verify a built app's declared runtime acceptance on Android or HarmonyOS/OpenHarmony, using observed journey evidence and distinguishing app defects from unavailable prerequisites.
---
# Device verification gate

Use this gate when independent evidence must come from a running app: navigation/back,
permissions, IME/focus, recreation, platform integration, crashes or visible jank. Logic
already established by a cheaper check does not need another device journey. Documentation
alone is not a runnable artifact.

## Required inputs and authoritative procedures

The dispatch supplies target, trigger, expected behavior, artifact/build identity, selected
device requirements and a frozen journey. Return material ambiguity before expensive
reproduction. A short journey needs no reusable-case dossier.

| Need | Read |
| --- | --- |
| Android preflight, optional setup, build/deploy, commands and journey evaluation | `references/device-verification.md` |
| HarmonyOS/OpenHarmony transport, HAP and supported local APK installation | `references/harmonyos-device-verification.md` |
| Report and device_test_record fields | `references/schemas.md` |
| Minimal evidence retention and relevant device pitfalls | `references/device-test-memory.md` |
| Transient behavior that stills cannot establish | `references/device-video-debugging.md` |

Read the selected transport playbook before preflight; it contains the executable command
examples and full journey rules. This gate supplies decision criteria, not a replacement
for that procedure. Prefer installed help over remembered flags. The external `android-cli`
skill is optional. Missing it alone is not a capability failure.

## Acceptance checks

1. Select the actual target and transport. Android uses adb; hdc targets use their own
   playbook. An APK on an hdc-only target requires a supported on-device compatibility
   route; `hdc install` does not accept APKs. Do not assume that route exists on every device.
2. Confirm the required capability and built artifact. Escalate missing prerequisites
   with the exact failed command and proposed setup action; the lead handles authority.
   Inspect pending installation prompts before retrying and verify the intended installed
   build and launch before app assertions.
3. Execute the frozen actions in order, independently and exactly as specified. A
   check/verify action observes the current state; do not scroll or otherwise manipulate
   the app to satisfy it. Preserve failures; never rewrite the journey to obtain a pass.
4. Capture decisive commands, layout state and visually inspected screenshots. For a
   temporal claim, inspect adequate video evidence. Captured-only media is unverified.
5. Record setup blockers, failed attempts and not-run actions as well as passes. Apply the
   shared attempt budget from PROMPT.md and the playbook, not a fresh budget per tool or run.
   Report a concrete defect promptly; optional evidence formatting never delays repair.

## Outcome

Return `schema_version: 1`, `gate: device-verification` and `device_test_record` as defined
in `references/schemas.md`. Use this mapping without treating a prerequisite as an app bug:

| Finding | Report status | Outcome |
| --- | --- | --- |
| All declared acceptance verified on the intended build with cited evidence | `pass` | `pass` |
| Supported app defect, including observed intermittent failure | `fail` | `revise` with stable `required_revisions` |
| Missing required capability/device, build/install blocker, malformed journey or essential intent | `needs-user-input` | `escalate` |

Name the failed step, observed state and evidence. Record intermittent failures as failures
with failures/attempts; a later success does not erase them. Distinguish an app defect from
an input/harness mistake; any corrective retry remains within the existing attempt budget.

## Boundary and cleanup

No production, test, manifest or Gradle edits. Build output may use normal build directories;
reports, screenshots, layout dumps and copied artifacts stay in external temporary storage.
Preserve required evidence until the lead retains it. The lead owns durable memory and
shared-record merges; optional journey-recorder work is separate from acceptance. Stop only
devices/reservations you created and leave pre-existing ones untouched. Finish when the
selected checks are adjudicated, with unavailable required evidence explicitly unverified.
