# Device Verification — HarmonyOS and OpenHarmony Targets through `hdc`

This reference is the `hdc` playbook for the `device-verifier` specialist and for the lead who prepares a
device-verification dispatch: transport selection, tool bootstrap, build and install of a HAP, driving the app with the
on-device tooling, journey evaluation, failure classification and the mapping to the same `device-verification` gate the
Android playbook settles. It names relative tool locations and values read at run time, never a local path, a device serial,
a bundle name or a version; the Android side is `references/device-verification.md`.

---

## 1. Transport selection

A target is verified over exactly one transport; the device and the artifact decide it, not the product name.

| Target | Transport | Artifact | Playbook |
|--------|-----------|----------|----------|
| Android device or emulator | `adb` and the `android` CLI | `.apk` | `references/device-verification.md` |
| HarmonyOS NEXT or OpenHarmony device or emulator | `hdc` | `.hap`, `.hsp`, `.app` | this file |
| Legacy Android-compatible HarmonyOS build that accepts `adb` and installs an APK | `adb` | `.apk` | `references/device-verification.md` |

Decide in this order: first, what the artifact is — an APK is an Android artifact, a HAP or an APP package is a HarmonyOS
artifact; second, what the device answers — `hdc list targets` for an `hdc` target, `adb devices` for an Android target.
When the two disagree, stop and escalate.

The consequence of guessing wrong is that the wrong transport sees nothing, or sees a target it cannot install onto: `hdc
list targets` returns an empty result (`[Empty]`) when no `hdc` target is attached, and an adb-only tool reports no device
for a target reachable only over `hdc`. A transport mismatch is an environment finding (`escalate`), never an app defect and
never a pass.

## 2. Environment and bootstrap

`hdc` ships inside the HarmonyOS SDK: DevEco Studio bundles it, and the standalone Command Line Tools ship it at the same
relative location, `sdk/default/openharmony/toolchains`; either source is sufficient, and the Command Line Tools are enough
for headless verification.

1. **Detect.** `command -v hdc` must succeed before any device step; when it fails, the tool is absent and every
   step below is inapplicable.
2. **Put it on `PATH`.** Add that `toolchains` directory to `PATH` in the shell profile and re-detect in a fresh
   shell. `hdc` is a client that starts or reaches a server process and needs its companion shared library; copy the whole
   directory, not the executable alone, when relocating it.
3. **Prove the toolchain.** `hdc -v` prints the client version, `hdc version` the server version and `hdc
   checkserver` both; record what they print and never assume a version.
4. **Connect, then authorize.** USB debugging is switched on by the user in the device's developer options, not
   by the verifier. Over USB, attaching the cable is enough for `hdc list targets` to show the target; over the network,
   `hdc tconn <ip>:<port>` connects it and `-remove` drops it. `hdc wait` blocks until a target is available, and with more
   than one target every command needs `hdc -t <connect-key>`, the serial over USB and `ip:port` over TCP. The first
   connection raises a trust prompt on the device that the user must accept; until then `hdc list targets -v` reports the
   target as `Unauthorized`. If the prompt was dismissed, declined or timed out, re-trigger it by toggling the device's
   debug switch or reconnecting.
5. **Recover a wedged server.** `hdc kill -r` terminates and restarts the server process, while `hdc kill` only
   terminates it; it is the documented recovery for a pending authorization and for a stuck server.
6. **Emulator caveat.** A DevEco Studio emulator works with `hdc`, but not with the `hdc tmode` command family,
   which fails with the documented `E001300` error.

Two `hdc` instances over the same server port conflict, with the documented symptom `[Fail]Failed to communicate with
daemon`; stop the duplicate or set `OHOS_HDC_SERVER_PORT`. Host-changing setup — installing a toolchain, editing the shell
profile, enabling device debugging, authorizing the host — follows the Android playbook's authority rule: the verifier never
performs it silently, and settles `escalate` with the exact missing prerequisite and the exact command so the lead can
obtain the user's authorization.

## 3. Build and artifact

Build with the project's own `hvigorw` wrapper, from the project root; do not substitute a global tool, and do not
hand-assemble a package. An artifact that does not build is `escalate` with the failing command and its output; it is not an
app defect and not a pass.

1. Task names and the output directory are project-specific: read them from the project's wrapper help output and
   its build profile, and record the exact command and its exit code.
2. The deployable package is `.hap` for an application module, `.hsp` for a shared module and `.app` for a
   multi-package bundle. Locate the produced file from the project's own configuration; never hardcode an output path.
3. The artifact must carry a **debug** signature. The device-side test and debug entry points refuse a
   release-signed application: `aa test` fails with the documented `10106002`, and `hdc shell -b <bundleName>` and `hdc file
   send|recv -b <bundleName>` require an installed application that is signed with a debug certificate and already started
   on the device.

## 4. Install and launch

### 4.1 Install

```shell
hdc install [-r|-s|-cwd <path>|-w <waitingTime>|-u <userId>|-p|-g|-h] <src>
```

`src` is a `.hap`, `.hsp` or `.app` path. A plain re-install already replaces an existing application; `-r` replaces it,
`-s` is required for a shared package, `-cwd` resolves `src` against a working directory, `-w` sets the device-side wait
time (documented range 180 to 600 seconds), `-u` selects the user, `-p` names a directory holding the packages, `-g`
additionally grants a debug application its user-granted and manually set permissions, and `-h` prints the device-side
install help instead of installing. An option and its value must travel together inside one pair of double quotes — `hdc
install "-w 180" <src>` — or the device-side parser rejects the argument. Success prints an install confirmation; failure
prints the reason.

### 4.2 Confirm the install

| Check | Command | Reading |
|-------|---------|---------|
| The bundle is present | `hdc shell "bm dump -a \| grep <bundleName>"` | The bundle name is echoed back |
| One bundle in detail | `hdc shell "bm dump -n <bundleName>"` | The full record; confirm the installed ability and module |
| Debug-signed bundles | `hdc shell bm dump -g` | Only bundles whose signing certificate type is debug |
| Signature type of one bundle | `hdc shell "bm dump -n <bundleName> \| grep appProvisionType"` | `"appProvisionType": "debug"` when the app is debuggable |

Wrap every non-interactive `hdc shell` command that carries arguments or a pipe in double quotes, as the documentation does;
the device-side shell would otherwise consume the arguments.

### 4.3 Launch and stop

| Intent | Command |
|--------|---------|
| Start an ability | `hdc shell aa start -b <bundleName> -a <abilityName>` |
| Start with start-up timing | `hdc shell aa start -b <bundleName> -a <abilityName> -W` |
| Start an implicit want | `hdc shell aa start -A <action> -U <uri>` |
| Stop for a clean restart | `hdc shell aa force-stop <bundleName>` |

`aa start` returns a start confirmation, or a failure message with the reason. `-W` reports the start mode (cold or hot),
the bundle, the ability and the elapsed times, and it works only for an explicit launch of a UI ability, with both `-b` and
`-a` given. Recurring `aa` failures worth diagnosing in a report, with their documented numbers:

| Code | Meaning | Action |
|------|---------|--------|
| `10103001` | Target ability visibility check failed — the ability is not exported | Not a device fault; report it against the artifact |
| `10104001` | The specified ability does not exist | Re-check the ability and bundle names; confirm the bundle, and for a multi-HAP app the owning HAP, are installed |
| `10106002` | Release-signature application is not supported by `aa test` or the `aa start` window options | Re-sign as debug and reinstall |
| `10106102` | The device screen is locked during launch | An environment condition, not an app defect; unlock and retry |
| `10106001` | The device is not in developer mode | Environment finding; the user enables developer mode |

Confirm the launch from the app's own output — a control-tree dump or a screenshot of the expected start screen — not from
the absence of an error.

## 5. Inspect and interact

Interaction is driven by `uitest` on the device, reached through `hdc shell uitest ...`. Its command surface is
version-dependent; `hdc shell uitest help` and `hdc shell uitest uiInput help` are the authority for the target in front of
you and win over the documentation when they differ.

| Capture | Command |
|---------|---------|
| Control tree | `hdc shell uitest dumpLayout -p /data/local/tmp/<name>.json` |
| Tree with no window merging or invisible-control filtering, or with colour, content, font and extra attributes | `hdc shell uitest dumpLayout -i\|-a -p /data/local/tmp/<name>.json` |
| Tree of one bundle's window | `hdc shell uitest dumpLayout -b <bundleName> -p /data/local/tmp/<name>.json` |
| Screenshot | `hdc shell uitest screenCap -p /data/local/tmp/<name>.png` |

`-i` and `-a` cannot be combined. `dumpLayout` also accepts a window id, a merge flag and a display id; a window or display
id must come from the device's own window information, never from a guess. The `-p` path is restricted to `/data/local/tmp/`
for both commands, and without `-p` each writes a timestamped file there. Bring the artifact host-side before reading it,
remote path first:

```shell
hdc file recv /data/local/tmp/<name>.json <hostTempDir>/<name>.json
hdc file recv /data/local/tmp/<name>.png <hostTempDir>/<name>.png
```

| Input | Command |
|-------|---------|
| Tap, double tap, long press | `hdc shell uitest uiInput click\|doubleClick\|longClick <x> <y>` |
| Slow swipe, drag | `hdc shell uitest uiInput swipe\|drag <fromX> <fromY> <toX> <toY> [velocity]` |
| Fling with inertia | `hdc shell uitest uiInput fling <fromX> <fromY> <toX> <toY> [velocity]` |
| Directional fling | `hdc shell uitest uiInput dircFling <0\|1\|2\|3> [velocity]` |
| Type at a point, or into the focused field | `hdc shell uitest uiInput inputText <x> <y> <text>`, or `text <text>` |
| Key event | `hdc shell uitest uiInput keyEvent <Back\|Home\|Power\|keyCode> [k2] [k3]` |

`hdc shell uitest uiInput help` prints these forms for the installed release. Velocity is pixels per second and is clamped
to a documented range, so an out-of-range value falls back to the default. `dircFling` takes the direction first: `0` left,
`1` right, `2` up, `3` down. `keyEvent` accepts the named keys `Back`, `Home` and `Power` or numeric key codes, plus up to
two further codes for a combination, and a named key cannot be combined. `text` targets the focused field and is
version-gated: when it is absent from the help output on the target, click the field and use `inputText` instead.

Interaction rules:

- Drive interaction from a **fresh** dump: find the element, read its bounds, click its centre; never reuse
  coordinates from an earlier screen and never guess a coordinate.
- Re-dump after every action that changes the screen; a dump taken after a wait is the evidence that the screen
  changed, and a stale dump is not.
- Treat a missing element as a failed step, not as a reason to try another element, and examine a pulled
  screenshot visually before drawing a conclusion from it.
- Wait and dump again before declaring an element absent, and say which method produced the evidence when a web
  view, a video or an animation makes a surface dump incompletely.

## 6. Journey evaluation

A journey is the declared list of actions device verification executes. The contract is the one
`references/device-verification.md` defines, and it binds this transport identically: evaluate the actions in declared
order, each independently and exactly as written; a `check` or `verify` action inspects the current screen without
interacting, so no scroll, tap or navigation may satisfy it, and it fails when the expected state is not currently visible;
an app exit, crash or freeze stops evaluation and fails the journey; a step that cannot be performed as specified fails that
step and is not reinterpreted; a malformed action stops the run and escalates; and a step is repeated only to measure
flakiness, bounded to three attempts with the rate recorded, never until green.

| Step shape | Primitive | Evidence the step must produce |
|------------|-----------|--------------------------------|
| A screen is reachable | `aa start` when not yet launched, then a dump | The launch command; the dump element marking the screen, with its text or type and bounds; the pulled layout path |
| Tap `<control>` | `uiInput click <x> <y>` at the element centre from a fresh dump | The click command; the dump element and bounds it came from |
| Type into a field | `uiInput inputText <x> <y> <text>`, or `text` | The dump element proving the field exists and is focused; the input command; the dump element carrying the value afterwards |
| Scroll to reveal | `uiInput swipe` or `dircFling` from the centre of the scrollable area | The scroll command; the post-scroll dump showing the revealed element |
| Verify a state | A dump, and a screenshot when the state is visual | The dump element with its text or type and bounds; the pulled screenshot path when used |
| A dialog decision, or Back/Home | A dump to find the control where one is needed, then `uiInput click` on its centre or `uiInput keyEvent Back` | The dump element for the control when one was used; the click or key command; the post-action dump showing the dialog resolved or the previous screen restored |
| Suspected app-level failure | `hdc hilog` filtered to the app, plus the on-screen symptom | The filtered log lines; the dump or screenshot showing the app gone or frozen |

Write the per-step report as markdown outside the repository, one section per action, marked `[evaluated]` or `[failed]`:

```markdown
# Journey: <name of the journey>

### Action: Tap the blue button [evaluated]
- **Commands**: `hdc shell uitest uiInput click 540 1180`
- **Layout**: [after_tap.json](<temp dir>/after_tap.json)
- **Comment**: The element was found in a fresh dump with bounds around that centre

### Action: The home screen is shown [failed]
- **Comment**: The settings page was shown; the dump element for the home marker is absent
```

Actions not evaluated because evaluation ended early carry no marker.

## 7. Automated tests

Prefer a scripted UI test over a manually driven journey when the flow is repeatable, must regress on every change, must
produce a machine-readable pass or fail, or will run in CI. Keep the manual journey for a one-off acceptance question and
for exploration whose steps are not yet stable.

1. **Where tests live.** Test sources live in the test source set of the tested module (`src/ohosTest/ets/test`
   in a standard layout); read the project's own layout instead of assuming it.
2. **Unit and UI tests share one framework.** Tests are written with Hypium (`@ohos/hypium`: `describe`, `it`,
   `expect`, and the level, size and type markers). A UI test adds the UI test API imported from `@kit.TestKit` (`Driver`,
   `ON`, `Component`, `On`, `MouseButton`, the ability delegator registry) and drives the app through it: `Driver.create()`,
   `ON.text(...)` and `ON.type(...)` matchers, optionally narrowed with `within(...)`, `findComponent`, `findComponents`,
   `waitForComponent`, `waitForIdle`, `delayMs`, `assertComponentExist`, `pressBack`, `triggerKey`, `triggerCombineKeys`,
   `mouseClick` and `screenCapture` — a test screenshot lands in the test application's own sandbox path, not in
   `/data/local/tmp/`.
3. **How they run.** Install the test-signed application, then start the test framework on the device with `hdc
   shell aa test -b <bundleName> -m <moduleName> -s unittest <testRunner>`. `-b` and `-s unittest` are required; `-m` names
   the runner's module for a stage-model app and `-p` its package for a legacy FA-model app. The runner value is
   `OpenHarmonyTestRunner` or the project's own runner name, read from the project's test module and never from memory.
   Success prints a start confirmation; failure prints the reason.
4. **Filters.** Narrow a run with repeated `-s <key> <value>` pairs: `class` (a suite name or `suite#case`,
   comma-separated), `notClass` (the same form, excluded), `itName` (a case name), `level` (`0` to `4`), `size` (`small`,
   `medium`, `large`), `testType` (the framework's case types), `timeout` (milliseconds, with a framework default),
   `breakOnError` (`true` stops at the first failure) and `stress` (a positive repeat count). `-w <waitTime>` bounds the
   whole run in milliseconds.
5. **Reading a result.** The framework prints per-case status lines and a final summary to the command output: a
   case status code is `1` when the case starts, `0` when it passes, `-1` on error and `-2` on failure, and the summary
   reports the totals for run, failure, error, pass and ignore followed by the task exit code and elapsed time. A nonzero
   error or failure count is a failing run. Read the same lines from `hdc hilog` when the command output is truncated.
6. **Prerequisites.** The application must be debug-signed (`10106002` otherwise). The device entry points that
   serve ArkTS UI tests are available only to a test package started through `aa test`; the CLI `uitest` commands in section
   5 do not have that restriction. An unbuildable or uninstallable test package is `escalate`, not a test failure.

## 8. Logs and diagnosis

```shell
hdc hilog                   # stream device logs; -x dumps the buffer and exits; -r clears it
hdc hilog -a <n> | -z <n>   # head or tail of the buffer
hdc hilog -L <D|I|W|E|F>    # filter by level; -T <tag>, -D <domain>, -P <pid> filter further
hdc hilog -e <expr>         # filter by regular expression
hdc hilog -t <type>         # filter by log type: app, core, init, kmsg, only_prerelease
hdc hilog -v <format>       # timestamp, colour and accuracy format
hdc bugreport [FILE]        # full system information      hdc jpid: debuggable process ids
hdc track-jpid [-a|-p]      # track those pids, with bundle names
```

`hdc hilog -h` prints the full option set for the installed release, including the buffer, stats, persistence and
flow-control subcommands; read it before relying on an option. Levels and tags accept comma-separated lists, and a leading
`^` negates a list.

Attribute a failure before reporting it. Probe the transport first: `hdc list targets -v` shows whether the target is
present and authorized, and `hdc checkserver` whether client and server agree, so a failure there is a harness or
environment finding. Check the artifact next: `hdc shell "bm dump -n <bundleName>"` plus the signature check in section 4.2
separates "the wrong package is installed" from "the app misbehaves". A locked screen, a device outside developer mode or a
pending authorization prompt explains a launch failure with no app involvement, and the documented `aa` codes in section 4.3
name those cases. Attribute a crash or freeze to the app only when the app's own process failed: filter `hdc hilog` by its
pid from `hdc jpid` or `track-jpid -p`, and quote the lines naming the app process together with the on-screen symptom. A
step that could not be driven because this target's tool surface differs — a missing `uiInput` subcommand, an unsupported
dump option — is a harness finding; record the help output that proves it.

## 9. Evidence, failure classification and outcome mapping

Every claim in the gate report carries the command that produced it and the artifact it produced: the executed `hdc` command
line, the dump element with its text or type and bounds as printed, the pulled layout path, the pulled screenshot path, and
the log lines with their filter. Record the transport and the toolchain versions read at run time (`hdc -v`, `hdc
checkserver`, `hdc shell uitest --version`); a version read elsewhere is not evidence about the device under verification.

| Classification | Signal | Gate report status | Settled outcome |
|----------------|--------|--------------------|-----------------|
| Verified journey | Every declared step evaluated with cited evidence | `pass` | `pass` |
| `app_defect` | A named step fails with the observed state and evidence | `fail` | `revise` with stable `required_revisions` |
| Harness or environment defect | Malformed journey, wrong target, transport mismatch, missing tool capability, unsupported option on this target | `needs-user-input` | `escalate` |
| `environment_unavailable` | No device, no `hdc`, no SDK, no debug signature, an unbuildable or uninstallable artifact, missing user intent | `needs-user-input` | `escalate` |
| Flaky behavior | The same step passes and fails across bounded repetitions; the observed rate is recorded | `fail` | `revise` with the recorded rate |

Bounded repetition means at most three attempts per verification round with the failure rate and the command recorded. A
compilation or install result is not runtime verification: never report a pass for a journey that did not run.

## 10. Boundaries

- Read-only with respect to the repository: this role writes no project file, fixes no defect it finds and
  reviews nothing it was not dispatched to review.
- Never silently install anything on the host or the device beyond the artifact under test: no SDK install or
  upgrade, no emulator creation or boot, no change to device settings, debug switches or partitions.
- Do not use the device-changing commands as part of verification: `hdc target boot`, `hdc smode`, `hdc tmode`,
  `hdc target mount`, `hdc uninstall` of anything but the artifact the run installed, and any write to a device path outside
  `/data/local/tmp/`.
- State the disposition of the installed artifact: when the dispatch asks for a restored device, remove the
  artifact the run installed with `hdc uninstall` and say so, and never leave a device or emulator in a changed state
  without reporting it.
- Keep every pulled artifact — screenshots, layout dumps, journey reports, logs — in a temporary directory
  outside the repository, and never copy a device serial, a device model or unrelated installed-bundle names into a report
  or into a role file; refer to the target by its role in the run, not by its identifier.
- What this reference does not cover: ArkTS and ArkUI production engineering, HarmonyOS product architecture,
  packaging and signing configuration, and native or cross-platform HarmonyOS work are out of scope for this Android and
  Compose role. Escalate that work rather than performing it here.

## 11. Sources

| Source | Authoritative for |
|--------|-------------------|
| hdc tool guide: `https://gitee.com/openharmony/docs/blob/master/zh-cn/application-dev/dfx/hdc.md` (raw mirror: `https://raw.giteeusercontent.com/openharmony/docs/raw/master/zh-cn/application-dev/dfx/hdc.md`) | Where `hdc` comes from, connection and authorization, `list targets`, `tconn`, `wait`, `shell`, `install` and its flags, `file send`/`recv`, `hilog`, `bugreport`, `jpid`, `track-jpid`, `kill -r`, `checkserver`, the `appProvisionType` signature check, the emulator `tmode` limitation, and the `E000002`, `E000003`, `E001300` error codes |
| UI test framework guide: `https://gitee.com/openharmony/docs/blob/master/zh-cn/application-dev/application-test/uitest-guidelines.md` | The `uitest` command surface (`screenCap`, `dumpLayout`, `uiRecord`, `uiInput`, `start-daemon`), the `/data/local/tmp/` path restriction, every `uiInput` argument form, and the ArkTS UI test API examples |
| `aa` tool guide: `https://gitee.com/openharmony/docs/blob/master/zh-cn/application-dev/tools/aa-tool.md` | `aa start` and its options, `aa force-stop`, `aa test` and its parameters, and the `10103001`, `10104001`, `10104002`, `10106001`, `10106002`, `10106102` error codes |
| Unit test framework guide: `https://gitee.com/openharmony/docs/blob/master/zh-cn/application-dev/application-test/unittest-guidelines.md` | How tests are written with Hypium, the `aa test -s unittest` command form, the `class`, `notClass`, `itName`, `level`, `size`, `testType`, `timeout`, `breakOnError` and `stress` filters, and the `OHOS_REPORT_STATUS` and `OHOS_REPORT_RESULT` result lines |
| `bm` tool guide: `https://gitee.com/openharmony/docs/blob/master/zh-cn/application-dev/tools/bm-tool.md` | `bm dump` and its flags, `bm dump -a` and `bm dump -n <bundleName>` for install verification, and `bm dump -g` for debug-signed bundles |

Local help output is the second authority, read on the machine and target under verification: `hdc -h`, `hdc help verbose`,
`hdc shell uitest help`, `hdc shell uitest uiInput help`, `hdc shell aa help`, `hdc shell bm help` and `hdc hilog -h`. When
the on-device help disagrees with the documentation, **the on-device output wins**, because the tool surface changes between
releases. Read the version at run time; never state a version from this file.
