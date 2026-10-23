# Device Verification — Real Devices and Emulators through the `android` CLI

This reference is the working playbook for the `device-verifier` specialist and for the lead
who prepares a device-verification dispatch. It covers what to verify on a device, how to
drive the app with the `android` CLI and `adb`, how to evaluate a journey, and how the
result maps to the gate report and the settled outcome. It names source roles instead of local
paths; section 2 covers capability detection and optional bootstrap.

Use `references/device-test-memory.md` for record levels and reusable device knowledge.
Consult only the matching case or known device pitfall when it can shorten this run; a
simple inline check needs no full history search or new case. Keep a compact account of the
build/device, acceptance checks, outcomes and decisive evidence. A dispatched verifier
returns external temporary evidence; the lead retains the minimum record and essential
evidence before handing noncritical archival to
`jetpack-compose--journey-recorder` in a background graph, then continues repairs immediately.
Neither record formatting nor case/index maintenance blocks a fix or acceptance. Keep source
evidence available until the handoff is complete.

### Scope, verification level and stopping

Before expensive reproduction, identify the affected screen/component, trigger, expected
result and acceptance checks from the request and code. Resolve ambiguity that would change
the repair or its acceptance early; do not inspect every plausible target first or request
ceremonial confirmation when the target is already clear.

- **Focused/local (default):** use the narrowest existing checks that cover a local change.
  Do not start a device or invent a journey merely to satisfy this playbook.
- **Targeted runtime:** when acceptance depends on a running app, verify only the changed
  behavior and directly affected boundary. Inline verification can use a short action and
  outcome list; no XML, case revision or full archive is required.
- **Deep/formal:** use a frozen journey, broader device coverage or detailed temporal
  investigation only for a concrete high risk, an unresolved evidence gap or a user/project
  requirement. A dispatched verifier receives a complete frozen journey even for a short
  path; dispatch does not itself justify broader coverage.

State the question each diagnostic attempt answers. At most three attempts may test the
same hypothesis on the same implementation, counting initial reproduction, setup retries
and flaky checks across tools and graph/run names. Stop sooner when no new evidence is
produced: use the evidence to repair, change to a materially different hypothesis, or report
the specific limitation. After roughly ten minutes without an effective code change or new
decisive evidence, reassess scope and strategy; this is not a timeout for a justified build.
Changing a tool, renaming a journey or opening a graph does not reset the budget.

Finish when the final implementation has passed the selected acceptance checks, required
project checks are satisfied and no blocking defect remains. Additional checks require a
new concrete risk. An unavailable required check remains explicitly unverified; never
convert a limitation, an earlier build's result or a failed attempt into a pass.

This playbook is the **Android transport**: the `android` CLI and `adb`, for an `.apk` on an
Android device or an emulator. A HarmonyOS NEXT or OpenHarmony target is a different
transport: verify it over `hdc` per `references/harmonyos-device-verification.md`, and never
with `adb`.

An `.apk` on a HarmonyOS NEXT or OpenHarmony target with no `adb` is not this transport either:
it is an `hdc` target. Open the local APK in 文件管理 and choose 直接安装; 卓易通安装 opens the
卓易通 application store instead of installing that file. Follow section 5 of
`references/harmonyos-device-verification.md`. `hdc install` never accepts an APK.

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

When using the CLI, read its version at run time — `android --version` and `android info` — and record what those
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

Choose tooling by the capabilities needed for the selected acceptance checks. Prefer an
already installed `android` CLI; an existing `adb`, project Gradle wrapper and supported
capture/input tools are sufficient when they can cover those checks. A missing CLI alone
is not a blocker and does not justify installing one. Bootstrap only a genuinely missing
capability, and treat installation, environment initialization, skill management,
SDK package downloads, AVD creation and authentication as host-changing actions that need the
user's authorization (step 7). Detection (step 1) is read-only and needs no authorization.

1. **Detection.** Confirm the tool is on `PATH` with `command -v android`, equivalently a first
   `android --version`. If absent, inspect the available `adb` and project toolchain and
   record the supported alternative. CLI-specific commands below apply only when installed;
   the acceptance, evidence and stopping rules apply to either route.
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
   silently: when needed capabilities are unavailable, it settles `escalate` and reports
   `needs-user-input`, naming the actual missing capability and proposed bootstrap command.
   The lead checks existing task authorization before asking; do not request permission
   again for setup already authorized. Without that authority, obtain it or hand the command
   to the user, then re-dispatch verification.
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
   is an environment finding, so stop here and settle `escalate` (section 12). An `.apk` on a target
   that has no `adb` but answers `hdc list targets` is neither this branch nor the legacy
   adb-compatible build: it is an `hdc` target whose local APK is opened in 文件管理 and installed
   with 直接安装, never the 卓易通安装 store button (section 5 of `references/harmonyos-device-verification.md`).
1. Detect available capabilities per section 2. Use installed `android` commands or the
   existing `adb`/project toolchain route; escalate only for a capability needed by acceptance.
2. With the CLI, run `android info`; otherwise read `adb version`, `adb devices` and the
   project's SDK configuration. Record the relevant tool version and selected target.
3. Query AVDs only if no suitable device is connected or the dispatch requires one.
   With the CLI use `android emulator list --long`; do not inventory unrelated environments.
4. Choose the target:
   - a device already connected, or the AVD named in the dispatch;
   - start it with `android emulator start <avd>` (add `--headless` when no window is
     needed) and wait for the command to return — it returns only when the emulator is
     ready;
   - use a connected physical device directly; for a required remote reservation use
     `android device remote` with the existing authorization for authentication/reservation.
5. Never start a second device while one is connected, and never replace the agreed device
   profile on your own initiative; a profile change is a lead/user decision.

---

## 5. Build and launch

1. Locate the artifact from the project's build configuration/output metadata or, when
   available, `android describe --project_dir <dir>`. Do not guess `app/build/outputs/...`.
2. Build the debug variant with the project's own wrapper, for example
   `./gradlew :app:assembleDebug` (use the real module path). Record the exact command and
   exit code.
3. Install and launch:
   - `android install --apks=<apk> --device=<serial>`, then launch the entry activity; or
   - `android run --activity=<component> --device=<serial>`, which builds, deploys and
     launches in one step; or
   - the already available `adb`/project deployment route, with the selected serial,
     artifact and actual command recorded. Check the local tool's help for supported flags.
4. Confirm the start screen from the app itself — a layout dump or a screenshot — not from
   the absence of an error. A build or install failure is an environment finding
   (`escalate`), never an app defect and never a pass.

An install may still require an on-device confirmation such as “同意并安装”. Inspect the
current installer before retrying, record its actual text and the agent/user action, and
confirm the original command result and intended installed build before app assertions.
Follow the setup/blocker rules in `references/device-test-memory.md`; do not mistake a
pending prompt or an older installed version for a successful deploy. Scope any learned
workaround to the observed device/ROM/tool versions, not all devices of a brand.

---

## 6. Inspection and interaction

### 6.1 Layout dumps

`android layout` returns the layout tree; `--flat` returns the flat element list. Each
element may carry `text`, `resourceId`, `contentDesc`, `interactions` (`checkable`,
`clickable`, `focusable`, `scrollable`, `long-clickable`, `password`), `state` (`checked`,
`focused`, `selected`), `bounds` (`[min X,min Y][max X,max Y]`), `center` (`[x,y]`) and
`off-screen`. Use `center` or `bounds` for input coordinates.

A layout dump may fail or omit content while a WebView or an animation is on screen. Preserve
the failing state and fall back to annotated screenshots and visual inspection. When the
sequence or transient state matters, use `references/device-video-debugging.md` for bounded
recording and host frame analysis. Do not navigate away merely to make the evidence easier
to collect, and say which method produced it.

### 6.2 Screenshots

`android screen capture -o <png>` writes the PNG; `--annotate` adds numbered bounding boxes
(`#1`, `#2`, ...) that `android screen resolve --screenshot <png> --string "tap #3"` turns
into center coordinates, so the two can be combined in one shell command. Always examine the
PNG visually before drawing a conclusion from it — both the plain and the annotated form.

For temporal behavior that static images cannot establish, start with a short recording and
visually inspected key frames per `references/device-video-debugging.md`. Inspect every
frame in a bounded interval and correlate action/log clocks only for a suspected single-frame
defect, disputed ordering or unresolved timing cause. Retain the original recording and
decisive evidence needed for the claim; a contact sheet or GIF is optional. Missing essential
temporal evidence is never a pass.

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

A formal journey is the frozen XML test of app behavior that a dispatched verifier executes.
This is not required for an inline targeted runtime check, whose declared actions and
observed outcomes may be a compact list. The formal format, from
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
  step hoping for a different result. A lead-planned reproduction for diagnosis or flakiness
  is a separately recorded attempt within the same bounded budget, never a rewrite of failure.
- An action that names a sequence of steps is split and evaluated step by step.

---

## 8. Journey report format

The formal verifier's report is a markdown file written outside the repository. The lead
retains the minimum record and decisive evidence, and may delegate optional enrichment to the background
`jetpack-compose--journey-recorder` per `references/device-test-memory.md`; it does not wait
for that work before fixing an observed defect. An inline check uses a compact record and
needs no separate per-action report unless evidence complexity warrants one. In a formal
report, per action record the verdict
marker (✅ passed, ❌ failed), the commands actually executed, the screenshot link
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
Explicitly label unexecuted actions `not-run` with a reason and setup blockers `blocked`;
include case IDs/revisions and a `device_test_record` in the submitted data for archival.

---

## 9. From acceptance criteria to journey steps

For a formal dispatch, the lead checks an applicable existing case when available and
freezes the complete journey before dispatch; a reusable case is optional, and a short
task-specific journey is sufficient. The verifier executes it and must not rewrite it.
Inline targeted checks may state these actions directly without XML. A criterion becomes one or more
`<action>` elements in execution order:

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

Use an already connected physical device with its selected serial. When the acceptance
requires a remote reservation, the CLI route is:

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

1. If affected instrumented tests already exist and their build is useful, compile them with
   the project's wrapper (for example `./gradlew :app:assembleDebugAndroidTest`) and record
   the exit code. Do not add tests or run unrelated builds merely because runtime is blocked.
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

Bounded repetition means at most three attempts for the same hypothesis and implementation,
including diagnosis, setup recovery and flaky checks across tools, rounds and graph names.
Record the failure rate (failures over attempts) and exact command. Stop earlier when no new
evidence is produced. A changed implementation permits targeted re-verification; repeating
an unchanged check never erases its earlier failure, and running until green is forbidden.

---

## 13. What this role must not do

- No production, test, manifest, resource or Gradle edits, and no fixes for defects it finds.
- No fabricated passes: an unverified step is reported as unverified, never assumed.
- The verifier writes no review artifacts inside the repository; screenshots, dumps, reports
  and copied APKs live in its temporary directory outside it until the lead retains the
  relevant evidence per `references/device-test-memory.md`; optional recorder outputs are separate.
  This does not permit verifier memory writes.
- Stop only devices and release only reservations created by this verification; leave
  pre-existing devices available to the user and lead.
- No journey rewrites, no interpretation of a malformed action, no retry-until-green.
- No verdict outside the submitted `schema_version: 1` gate report, and no attempt credential
  in any output.
