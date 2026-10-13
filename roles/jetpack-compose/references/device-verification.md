# Device Verification — Real Devices and Emulators through the `android` CLI

This reference is the working playbook for the `device-verifier` specialist and for the lead
who prepares a device-verification dispatch. It covers what to verify on a device, how to
drive the app with the `android` CLI and `adb`, how to evaluate a journey, and how the
result maps to the gate report and the settled outcome. It is portable and self-sufficient:
it names source roles instead of local paths, and section 2 bootstraps a machine that has no
CLI yet.

This playbook is the **Android transport**: the `android` CLI and `adb`, for an `.apk` on an
Android device or an emulator. A HarmonyOS NEXT or OpenHarmony target is a different
transport: verify it over `hdc` per `references/harmonyos-device-verification.md`, and never
with `adb`.

---

## 1. Sources of authority

This reference names source roles and how to discover each at run time; it carries no host path,
no personal device name and no version literal, because it ships to environments other than the
one it was written on.

| Source | How to discover it | Role |
|--------|--------------------|------|
| `android-cli` agent skill | Load it through the harness's own skill mechanism when the harness provides it; `android skills list` shows the skills the CLI itself manages | CLI and workflow guidance, including its bundled interaction and journey references |
| Installed CLI | `android --help` and `android <command> --help`; `android info` for the resolved environment | The flag and environment authority for the build that is actually installed |
| Project build conventions | The project's Gradle files, wrapper, version catalogue and CI configuration | Module names, variants, test tasks and artifact locations |
| This reference and the gate skill | Shipped with the role, always available | Working playbook, and the fallback when the harness skill is absent |
| `adb` | Ships in the platform-tools package of the SDK that `android info` resolves | Input primitives and device shell commands |

Precedence when sources disagree: the installed binary's `--help` output wins, then the
`android-cli` skill when it is present, then this file. Re-check a flag before using it, and never
assume a subcommand exists because a document names it.

Read the CLI version at run time — `android --version` and `android info` — and record what those
commands printed in the gate report. Never quote a version from this file: it deliberately carries
none, and a version read somewhere else is not evidence about the machine under verification. A
first invocation on a fresh machine may unpack its payload and print a terms-of-service and metrics
notice before the command output; that notice is not a command failure, and it never belongs in
journey evidence or the gate report.

### Environment caveat

`android info` prints the SDK path the CLI actually resolved. A worker whose `HOME` is
redirected (sandboxed execution) resolves SDK and AVD paths under that redirected home, so
`android emulator list` can be empty even though AVDs exist for the interactive user. Treat
that as an environment problem to report, not as "no AVDs exist", and never invent a device
serial.

---

## 2. Bootstrap: the CLI, its skills and a runnable device

The CLI itself is the hard prerequisite for every later section of this file; the harness
`android-cli` agent skill is optional enrichment and the SDK only matters once the CLI exists.
Bootstrap in this order, and treat installation, environment initialization, skill management,
SDK package downloads, AVD creation and authentication as host-changing actions that need the
user's authorization (step 7). Detection (step 1) is read-only and needs no authorization.

1. **Detection.** Confirm the tool is on `PATH` with `command -v android`, equivalently a first
   `android --version`. If the command is not found, the CLI is absent and every later section of
   this file is inapplicable until bootstrap succeeds. The same check tells the verifier whether
   the machine is already bootstrapped.
2. **Install the CLI.** Use the platform command published by the `android-cli` skill, reproduced
   here so this reference stays self-sufficient:
   - Linux x86_64: `curl -fsSL https://dl.google.com/android/cli/latest/linux_x86_64/install.sh | bash`
   - macOS arm64: `curl -fsSL https://dl.google.com/android/cli/latest/darwin_arm64/install.sh | bash`
   - macOS x86_64: `curl -fsSL https://dl.google.com/android/cli/latest/darwin_x86_64/install.sh | bash`
   - Windows x86_64: `curl -fsSL https://dl.google.com/android/cli/latest/windows_x86_64/install.cmd -o "%TEMP%\i.cmd" && "%TEMP%\i.cmd"`
   The installer writes the launcher into the user's environment, and a shell opened before the
   install may need a fresh `PATH`. Re-run step 1 afterwards.
3. **Initialize the environment.** `android init` sets up the required configuration, directories
   and default skills. Re-check with `android info`, which prints the SDK location, the version and
   the connected devices. Keep the CLI current with `android update`.
4. **CLI-managed skills.** `android skills list` lists installed and available skills, and
   `android skills find <keyword>`, `android skills add <id>`, `android skills update` and
   `android skills remove <id>` manage them. The harness `android-cli` agent skill is optional
   enrichment on top of that: load it when the harness provides it. When it is absent, this
   reference, the local gate skill and the installed CLI's `--help` output are the fallback.
5. **SDK packages.** `android sdk list --all` lists installed and available packages,
   `android sdk install <package>[@<version>]` installs one or more, `android sdk update` updates
   them and `android sdk remove <package>` removes them. A missing platform, build-tool or system
   image is a prerequisite failure, not an app defect.
6. **A runnable device.** `android emulator create [--list-profiles] [<profile>]` creates an AVD
   when none is usable, `android emulator list` shows what exists, and `android emulator start
   <avd>` boots one and returns when it is ready. Physical hardware is reached through
   `android device remote` after `android auth login`.
7. **Authority.** Installing the CLI, downloading SDK packages, accepting licenses, creating AVDs
   and authenticating are host-changing actions. The device-verifier MUST NOT perform them
   silently: it settles `escalate` and reports `needs-user-input`, naming the exact missing
   prerequisite and the exact bootstrap command. The lead asks the user for authorization, runs the
   documented bootstrap only with that authorization or hands the commands to the user, and then
   re-dispatches verification.
8. **Refusal or impossibility.** When bootstrap cannot happen — offline host, license not accepted,
   locked-down machine, no authorization — record the limitation, mark the runtime behavior
   unverified, fall back to compiling the project's instrumented tests where the project supports
   them (section 11), and never report a pass.

---

## 3. Command surface

Every command below is taken from the installed binary's help output. Run
`android <command> --help` before relying on a flag; the surface changes between releases.

| Command | Verified form | Purpose |
|---------|---------------|---------|
| Environment | `android info [<field>]` | SDK location, version, connected devices, configuration |
| Project metadata | `android describe --project_dir <dir>` | Prints paths of JSON metadata naming build targets and their artifact locations |
| Emulators | `android emulator list [--long]` | Lists available AVDs |
| | `android emulator start <avd> [--headless] [--cold]` | Starts an AVD; returns when it is fully started and ready |
| | `android emulator stop [<avd>]` | Stops the named AVD, or the only running emulator |
| | `android emulator create [--list-profiles] [<profile>]` | Creates an AVD when none is usable |
| Devices | `android device remote models` / `list` / `projects` | Physical-device catalogue and reservations |
| | `android device remote create <codename>/<api> [--connect] [--project=<id>]` | Reserves a remote physical device |
| | `android device remote connect <reservation-id>` / `disconnect` / `extend` / `remove` | Manages the reservation |
| | `android auth login [--no-use-keyring]` / `logout` / `status` | Authenticates the CLI for remote devices |
| Deploy | `android install --apks=<apk>[,<apk>] --device=<serial> [--install-options=<flags>] [--use-delta-install]` | Installs without launching |
| | `android run --activity=<component> --device=<serial> [--apks=<apk>] [--type=<type>] [--debug]` | Builds, deploys and launches |
| Inspect | `android layout [--device=<serial>] [--flat] [--full] [--no-idle] [-o <path>] [-p]` | Layout tree or flat element list |
| | `android screen capture [-o <path>] [--device=<serial>] [-a\|--annotate]` | PNG of the current screen, optionally labeled |
| | `android screen resolve --screenshot <png> --string "#N"` | Substitutes label `#N` with the center coordinates of that region |
| Docs | `android docs search "<keywords>"`, `android docs fetch <kb://url>` | Official Android Knowledge Base lookups |
| Skills | `android skills list` / `find <keyword>` / `add <id>` / `update` / `remove <id>` | Installs and inspects Android CLI skills |

Note on `layout`: the installed build documents `-d/--diff` as "Deprecated; no-op flag. Will
be removed in a future release", so it no longer returns the changed-element list that
`references/interact.md` describes. Take full dumps (`--flat` for the flat list, `--full` to
include non-interactive and hidden elements) and compare them yourself.

---

## 4. Preflight and device choice

0. Identify the transport before anything else: this playbook covers an Android target — an
   `.apk` reached with `adb` — while a serial that appears in `hdc list targets` is a
   HarmonyOS or OpenHarmony target, verified over `hdc` per
   `references/harmonyos-device-verification.md` and never with `adb`. A transport mismatch
   is an environment finding, so stop here and settle `escalate` (section 12).
1. Confirm the CLI is present: `command -v android`, equivalently a first
   `android --version`. When it is absent, stop here — section 2 is the bootstrap path
   and none of the steps below applies until it succeeds; settle `escalate` per
   section 2 step 7.
2. Run `android info`; record the SDK path, tool version and connected devices.
3. Run `android emulator list --long`; record available AVDs.
4. Choose the target:
   - a device already connected, or the AVD named in the dispatch;
   - start it with `android emulator start <avd>` (add `--headless` when no window is
     needed) and wait for the command to return — it returns only when the emulator is
     ready;
   - for physical hardware use `android device remote` and authenticate with
     `android auth login` first.
5. Never start a second device while one is connected, and never replace the agreed device
   profile on your own initiative; a profile change is a lead/user decision.

---

## 5. Build and launch

1. Locate the artifact: `android describe --project_dir <dir>` prints the metadata paths that
   name build targets and their output artifacts. Do not guess `app/build/outputs/...`.
2. Build the debug variant with the project's own wrapper, for example
   `./gradlew :app:assembleDebug` (use the real module path). Record the exact command and
   exit code.
3. Install and launch:
   - `android install --apks=<apk> --device=<serial>`, then launch the entry activity; or
   - `android run --activity=<component> --device=<serial>`, which builds, deploys and
     launches in one step.
4. Confirm the start screen from the app itself — a layout dump or a screenshot — not from
   the absence of an error. A build or install failure is an environment finding
   (`escalate`), never an app defect and never a pass.

---

## 6. Inspection and interaction

### 6.1 Layout dumps

`android layout` returns the layout tree; `--flat` returns the flat element list. Each
element may carry `text`, `resourceId`, `contentDesc`, `interactions` (`checkable`,
`clickable`, `focusable`, `scrollable`, `long-clickable`, `password`), `state` (`checked`,
`focused`, `selected`), `bounds` (`[min X,min Y][max X,max Y]`), `center` (`[x,y]`) and
`off-screen`. Use `center` or `bounds` for input coordinates.

A layout dump may fail or omit content while a WebView or an animation is on screen. That is
expected: navigate away, or fall back to an annotated screenshot and visual inspection, and
say which method produced the evidence.

### 6.2 Screenshots

`android screen capture -o <png>` writes the PNG; `--annotate` adds numbered bounding boxes
(`#1`, `#2`, ...) that `android screen resolve --screenshot <png> --string "tap #3"` turns
into center coordinates, so the two can be combined in one shell command. Always examine the
PNG visually before drawing a conclusion from it — both the plain and the annotated form.

### 6.3 Input primitives

| Intent | Command |
|--------|---------|
| Tap an element | `adb shell input tap <x> <y>` using the element `center` |
| Scroll or drag | `adb shell input swipe <x1> <y1> <x2> <y2> <duration-ms>` |
| Type text | `adb shell input text "<text>"` (field focused first) |
| Submit | `adb shell input keyevent 66` |
| Back / Home | `adb shell input keyevent 4` / `adb shell input keyevent 3` |

### 6.4 Interaction rules

Quoted from `references/interact.md` of the android-cli skill:

> 1. Always ensure text input fields have `"focused"` in their `"state"` list before entering text.
> 2. If an element has `"scrollable"` in its `"interactions"` list, try scrolling it when looking for missing UI elements.
> 3. Always scroll slowly when executing scroll inputs. The 5th argument to `adb shell input swipe` controls scroll duration.
> 4. Content may take time to load; if a `layout` is missing information after you take an action, wait a few seconds, then perform `layout --diff` to see if anything changes.

Text entry specifics from the same reference:

> - **Spaces (`%s`):** Replace spaces with `%s` (Android ignores text after raw spaces): `adb shell input text "Hello%sworld"` (enters `"Hello world"`).
> - **Special characters:** Escape shell metacharacters (`&`, `$`, `(`, `)`, `!`): `adb shell input text "AT\&T"` or `adb shell input text 'Price:\$10'`
> - **Submit / Enter:** `adb shell input keyevent 66`

Because `--diff` is a no-op in the installed build (section 3), read rule 4 as "wait, then
take another full dump".

---

## 7. Journey contract

A journey is the XML test of app behavior that device verification executes. The format, from
`references/journeys.md`:

```xml
<journey name="My Journey">
   <description>
      A sample journey to illustrate the format
   </description>
   <actions>
     <action>
       Tap the "Home" icon
     </action>
     <action>
       Verify that the app is on its Home screen
     </action>
   </actions>
</journey>
```

Evaluation rules, quoted from `references/journeys.md`:

> Evaluate a journey by proceeding through the `<actions>` list in sequential order. Evaluate each `<action>` block individually.
> A journey succeeds if all elements in the `<actions>` list succeed.

> A journey is a test case for an app. The journey XML is the source of truth; if the app disagrees with the journey, the app has failed.
> Additionally, if the app exits, crashes, or freezes, journey evaluation stops and the journey fails.

> **IMPORTANT** - Execute each step EXACTLY as written, and independently of other steps! If an action says to `"tap the first search result"`,
> you MUST find the search results and tap the first one. Do this even if you believe you know the intent behind the action.

> If the interaction cannot be performed as specified, the journey fails.

> If an `<action>` contains something that is not a specification for a UI interaction, alert the user that the journey is malformed and exit
> early, specifying the error in question.

For `check`/`verify` actions:

> Determine the current state of the app by inspecting the current screen of the device without interacting with it.
> Example: `<action>Check if "Switch 2" is visible on the screen</action>`
> This requires only inspecting the current screen, not scrolling or interacting. If "Switch 2" is not currently visible, the action fails.

Failure handling, from the same reference:

> When running a journey, evaluate it as a test. Failure is acceptable, and often expected. Proper reporting of failures is the priority.

Practical consequences:

- Perform actions in declared order; never reorder for convenience.
- A missing element, an unperformable interaction, or a false expectation fails that step and
  ends evaluation; a crash, freeze or app exit fails the journey.
- Do not edit the journey, do not interpret a malformed action, and do not retry a failing
  step hoping for a different result. Repeat only to measure flakiness, bounded and recorded.
- An action that names a sequence of steps is split and evaluated step by step.

---

## 8. Journey report format

The report is a markdown file written outside the repository. Per action, record the verdict
marker (✅ evaluated, ❌ not evaluated), the commands actually executed, the screenshot link
when a visual check was needed, and a comment with the observed state:

```markdown
# Journey: <name of the journey>

## Results

### Action: Tap the blue button ✅
- **Commands**:
  - `adb shell input swipe 490 200 500 500 500`
  - `adb shell input tap 45 920`
- **Comment**: The button required scrolling into view; tapped and the app did not crash

### Action: Check if "Switch 2" is visible on the screen ✅
- **Screenshot**: [switch_2_screenshot.png](/tmp/device-verify/switch_2_screenshot.png)
- **Comment**: Confirmed in the layout dump and visually

### Action: The home screen is shown ❌
- **Comment**: The settings page was shown
```

Actions not evaluated because evaluation ended early carry no marker. The report is evidence
for the gate report; the gate report itself is the submitted `schema_version: 1` data.

---

## 9. From acceptance criteria to journey steps

The lead writes the journey before dispatch; the verifier executes it and must not rewrite
it. A criterion becomes one or more `<action>` elements in execution order:

| Criterion shape | Journey steps | Evidence the step must produce |
|-----------------|---------------|--------------------------------|
| A screen is reachable | `Tap <control>` then `Verify that <screen marker> is shown` | The tap command; a layout element (`text`, `resourceId` or `bounds`) or a screenshot |
| Data entered is reflected | `Tap <field>` then `Type <text>` then `Verify that <text> is displayed` | Focused-state dump, the `adb shell input text` command, the element carrying the value |
| A permission or dialog decision | `Tap <grant/deny>` then `Verify that <result>` | The resolved element from the annotated screenshot and the tap coordinates |
| State survives recreation | `Tap <control>` then `Rotate/background and return` then `Verify that <state>` | Commands for the lifecycle action and the post-restore dump |
| A flow completes | One action per user-visible step, in order | Per-step commands and the final state evidence |

Write the criteria as observable screen states. Avoid steps that bundle two screens, name an
element with no on-screen referent, require a scroll inside a `check` step, or describe an
intent ("test the settings flow") instead of an interaction. A journey that cannot be
evaluated as written is a lead-side defect; the verifier escalates it rather than repairing
it.

---

## 10. Physical devices

Physical verification uses the same commands with a physical serial:

1. `android auth login` (add `--no-use-keyring` in a non-interactive environment).
2. `android device remote models` to choose a model, `android device remote create
   <codename>/<api> --connect` to reserve and connect it.
3. `android device remote list` to read the reservation, `extend` to keep it, and
   `disconnect` plus `remove` to release it when the run ends.
4. Use the resulting serial with `android install --device=<serial>`,
   `android run --device=<serial>` and `android layout --device=<serial>`.

Physical devices are required when the criterion depends on hardware the emulator cannot
model (camera, cellular, real sensors). Reservations are metered and may be unavailable; an
unavailable reservation is `environment_unavailable` and settles `escalate`.

---

## 11. When no device is available

If no device can be started and no reservation can be made:

1. Still compile the instrumented tests with the project's wrapper (for example
   `./gradlew :app:assembleDebugAndroidTest`) so the test code is at least known to build,
   and record the exit code.
2. Record the limitation explicitly in the gate report `verification` field: which device was
   attempted, what failed, and which acceptance criteria therefore remain unverified.
3. Settle `escalate` with report status `needs-user-input`. A compilation result is not
   runtime verification: never report a pass, and never let "the tests compile" stand in for
   a journey that did not run.

---

## 12. Failure classification and outcome mapping

| Classification | Signal | Gate report status | Settled outcome |
|----------------|--------|--------------------|-----------------|
| Verified journey | Every declared step evaluated with cited evidence | `pass` | `pass` |
| `app_defect` | A named step fails with observed state and evidence | `fail` | `revise` with stable `required_revisions` |
| Harness or environment defect | Malformed journey, wrong device profile, missing CLI/SDK capability, wrong target serial | `needs-user-input` | `escalate` |
| `environment_unavailable` | No device, no bootable AVD, no SDK, no reservation | `needs-user-input` | `escalate` |
| Flaky behavior | The same step passes and fails across bounded repetitions; observed rate recorded | `fail` | `revise` with the recorded rate |

Bounded repetition means at most three attempts in one verification round, with the failure
rate (failures over attempts) and the exact command recorded. Repeating a check never
converts a failure into a pass, and running until green is forbidden.

---

## 13. What this role must not do

- No production, test, manifest, resource or Gradle edits, and no fixes for defects it finds.
- No fabricated passes: an unverified step is reported as unverified, never assumed.
- No review artifacts inside the repository; screenshots, dumps, reports and copied APKs live
  in a temporary directory outside it.
- No devices left running, and no reservations left open.
- No journey rewrites, no interpretation of a malformed action, no retry-until-green.
- No verdict outside the submitted `schema_version: 1` gate report, and no attempt credential
  in any output.
