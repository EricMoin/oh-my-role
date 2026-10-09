---
name: jetpack-compose-device-verification-gate
description: Decide when device or emulator verification is warranted and execute it through the `android` CLI with layout, screenshot and command evidence.
---
# Device verification gate

Verify a built Android app on a real device or emulator when acceptance depends on runtime
behavior that a JVM or Robolectric test cannot show. Load `references/device-verification.md`
for the full playbook and `references/schemas.md` for the gate report contract. Read, build,
deploy and interact only through `graph_worker_exec`. Prefer the installed CLI's own
`--help` output over remembered flags.

## When device verification is warranted

Verify on a device or emulator when the acceptance criterion is about behavior that only a
running app produces:

- navigation, back-stack and deep-link routing between screens;
- runtime permissions, system dialogs, notification permission and settings round-trips;
- IME and real text entry, focus order, keyboard-driven submission;
- lifecycle and process recreation: rotation, backgrounding, restore after kill;
- notifications, foreground services, alarms and app-visible system integration;
- crash, ANR or freeze behavior on a real execution path;
- user-visible jank, slow first frame, or scrolling that a benchmark cannot classify.

Do not open this gate for pure logic, parsing, formatting or state math that a JVM test
covers; for layout correctness already covered by a Compose UI test or a screenshot test;
for work with nothing runnable (no artifact, no app module, documentation only); or to
re-prove behavior a cheaper test already establishes. Say so in the report instead of
running a device, and never treat a device run as a substitute for a missing unit test.

## Preflight and device choice

Step 0: confirm the CLI exists. `command -v android` — equivalently a first `android --version` —
must succeed before any step below; when it fails, the CLI is missing and the whole preflight below
is inapplicable. Escalate, and do not attempt installation from the verifier role: installing the
CLI or SDK packages, accepting licenses, creating AVDs and authenticating are host-changing actions
that only the user authorizes. Name the exact missing prerequisite and the exact bootstrap command
from `references/device-verification.md` (section 2) in the escalation.

With the CLI present, run the preflight before touching a device, and record its output:

- `android info` — SDK location, version, connected devices and configuration.
- `android emulator list` (add `--long` for detail) — available AVDs.
- `android emulator start <avd>` — starts an AVD and returns when it is fully booted and
  ready; `--headless` runs it without a window, `--cold` skips the snapshot.
- `android emulator stop [<avd>]` — stops the named AVD, or the only running emulator.
- `android device remote models`, `android device remote create <codename>/<api> [--connect]`,
  `android device remote connect <reservation-id>`, `android device remote list` — physical
  devices; authenticate first with `android auth login`.

Rules:

- Use a device that is already connected or the AVD the dispatch names. Never start a second
  device while one is connected, and never start an emulator for a criterion that needs
  physical hardware (camera, cellular, sensors).
- If `android info` reports no device and no AVD can be started, stop and escalate; do not
  install onto an unknown target and do not report a pass from a host-side check. The same holds
  for a missing SDK package, system image or AVD: report the prerequisite and the bootstrap command
  that would satisfy it, and never install it silently.
- Verify the SDK the CLI actually resolved. A redirected `HOME` moves the SDK and AVD home
  with it, so an empty `android emulator list` means "no AVDs visible here", not "no AVDs
  exist"; re-check before concluding that the environment is unavailable.

## Build and launch

1. Locate the artifact instead of guessing the path: `android describe --project_dir <dir>`
   prints the paths of JSON metadata that name build targets and their output artifact
   locations.
2. Build the debug variant with the project's own Gradle wrapper, for example
   `./gradlew :app:assembleDebug` — use the module names the project actually declares, and
   record the exit code.
3. Deploy: `android install --apks=<apk> --device=<serial>` installs without launching;
   `--apks` takes a comma-separated list. `android run --activity=<component>
   --device=<serial>` builds, deploys and launches in one step.
4. Confirm the launch from the app's own output: a layout dump or screenshot of the expected
   start screen, not from the exit code alone.
5. An artifact that does not build or does not install is `escalate` with the failing
   command and its output; it is not an app defect and not a pass.

## Interaction and evidence

Inspect with `android layout` (add `--flat` for the flat element list, `--full` to include
non-interactive and hidden elements, `--no-idle` to skip the idle wait, `-o <file>` to write
the dump outside the repository). The installed CLI documents `-d/--diff` as a deprecated
no-op, so take full dumps and compare them; do not rely on `--diff` to list changed elements.

Capture with `android screen capture -o <png> [--device=<serial>]`, and
`android screen capture --annotate -o <png>` to label elements with `#1`, `#2`, and so on.
Resolve a label to coordinates with
`android screen resolve --screenshot <png> --string "tap #3"`, which substitutes the center
coordinates of that region. Always examine the PNG visually, including the annotated one.

Interact with `adb shell`:

- `adb shell input tap <x> <y>` — tap the element `center`.
- `adb shell input swipe <x1> <y1> <x2> <y2> <duration-ms>` — scroll or drag; the fifth
  argument is the duration.
- `adb shell input text "<text>"` — type into a focused field; `adb shell input keyevent 66`
  submits.
- `adb shell input keyevent <code>` — back (4), home (3), enter (66).

Interaction rules:

1. A text field must list `focused` in its `state` before you type into it; focus it first.
2. Replace spaces with `%s` — Android ignores text after a raw space: `Hello%sworld`.
   Escape shell metacharacters (`&`, `$`, `(`, `)`, `!`) or quote them.
3. Scroll slowly; a short duration turns a scroll into a fling and loses the target.
4. If a dump looks incomplete after an action, wait a few seconds and dump again.
5. When `layout` fails or omits content — WebView, animation, custom drawing — fall back to
   `android screen capture --annotate` and visual inspection, and say so in the evidence.

## Journey evaluation

Evaluate the declared actions in order, each one independently and exactly as written:

- Perform the interaction an action specifies and confirm only that the app did not crash or
  behave unexpectedly. A missing element or an unperformable interaction fails that step.
- A `check`/`verify` action inspects the current screen without interacting; it fails if any
  of its expectations is false. Scrolling is not allowed to satisfy it.
- If an action names several steps, split and evaluate them individually.
- An action that is not a UI interaction specification makes the journey malformed: stop
  and escalate rather than interpreting it.
- An app exit, crash or freeze stops evaluation and fails the journey.
- Report failures rather than working around them; do not edit the journey to make it pass.

## Evidence and report

Every step carries: the action text with a ✅ (evaluated) or ❌ (failed) marker, the commands
actually executed, the screenshot link when a visual check was needed, and a comment with the
observed state. Produce the journey report as markdown outside the repository, with one
section per action:

```markdown
# Journey: <name>

## Results

### Action: <action text> ✅
- **Commands**:
  - `adb shell input tap 540 1180`
- **Comment**: <observed state, or why the step failed>

### Action: <check/verify action text> ✅
- **Screenshot**: [step.png](<temp path>/step.png)
- **Comment**: Confirmed in the layout dump and visually
```

Map the finished report to exactly one outcome and carry it in the gate report as
`schema_version: 1` data with `gate: device-verification`:

| Finding | Gate report status | Settled outcome |
| --- | --- | --- |
| Every declared step verified with cited evidence | `pass` | `pass` |
| Supported app defect at a named step, with observed state and evidence | `fail` | `revise`, with stable `required_revisions` |
| Missing CLI, no device, no AVD, missing SDK package or system image, unbuildable artifact, malformed journey, missing user intent | `needs-user-input` | `escalate` |

## Failure classification

Classify each failure before reporting it:

- **app_defect** — the journey step that failed, the observed state, and the evidence
  (dump element, screenshot, command output). Settles `revise`. One reproduced blocking
  failure is enough; a cosmetic observation stays advisory.
- **harness or environment defect** — the journey is malformed, the wrong device profile was
  used, the CLI or SDK is missing a flag or package, or the deploy targeted the wrong serial.
  Fix what is yours to fix (re-target the named device, re-issue a correct input) and re-run
  once; anything that requires rewriting the journey or changing the agreed device settles
  `escalate` with the exact defect.
- **environment_unavailable** — no CLI, no device, no bootable AVD, no SDK package, no system
  image, no network for a remote reservation. Settles `escalate`; record what was attempted, what
  is missing and the bootstrap command that would resolve it.
- **flaky behavior** — repeat the step at most three times, then record the observed failure
  rate (failures over attempts) and the exact command. Flakiness settles `revise` with that
  rate; never repeat until green and never convert a flaky step into a pass.

## Cleanup and boundary

- Stop the emulator you started (`android emulator stop <avd>`) and release any remote
  reservation you created; leave pre-existing devices untouched.
- Keep screenshots, layout dumps, journey reports and copied APKs in a temporary directory
  outside the repository. Build output may only land in the project's normal build
  directories; never edit sources, resources, manifests, Gradle files or test code.
- Report only what the commands and captures show. An unverified step is `needs-user-input`
  or a failing step, never an assumed pass.
