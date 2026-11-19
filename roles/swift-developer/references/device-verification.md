# Verify an iOS journey on a simulator or device

Write down the build under test, the initial state, the user action and the observable outcome. A useful criterion is “Open an existing draft from the list, change its title, save, relaunch, and see the new title on that same draft.” Use a test account or fixture that can be changed for the journey.

## Find a runnable target

Read the app's build instructions and CI configuration for its workspace or project, shared scheme, test plan, deployment target and dependencies. Discover the local tools and destinations on a Mac with Xcode selected. The standalone Command Line Tools package can build some Swift packages, while the iOS SDK, simctl and device tooling ship with Xcode. [Xcode command-line tools](https://developer.apple.com/documentation/xcode/xcode-command-line-tool-reference)

```sh
xcode-select -p
xcodebuild -version
xcrun --sdk iphonesimulator --show-sdk-version
xcrun simctl list devices available
```

The following snippets share one Bash or Zsh session. Set `IOS_CONTAINER` to the actual workspace or project path. This example uses a workspace.

```sh
IOS_CONTAINER='Example.xcworkspace'
container_args=(-workspace "$IOS_CONTAINER")
xcodebuild "${container_args[@]}" -list
```

For a standalone `.xcodeproj`, set `IOS_CONTAINER` to that path and use `container_args=(-project "$IOS_CONTAINER")`. Use the workspace when its scheme integrates the app's dependencies. Set `IOS_SCHEME` from the list, then check its eligible destinations.

```sh
IOS_SCHEME='Example'
xcodebuild "${container_args[@]}" -scheme "$IOS_SCHEME" -showdestinations
```

Choose a concrete available iOS Simulator UUID that also appears as an eligible destination for the scheme. A generic build destination cannot run a journey. Set `IOS_SIM_UDID` to that UUID in the current shell. Note whether the simulator was already booted. The command below boots it if necessary and waits for readiness. Keep the result bundle and diagnostic files outside the checkout.

```sh
: "${IOS_SIM_UDID:?Set the discovered simulator UUID first}"
ios_destination="platform=iOS Simulator,id=$IOS_SIM_UDID"
ios_run_dir=$(mktemp -d "${TMPDIR:-/tmp}/ios-verify.XXXXXXXX")
xcrun simctl bootstatus "$IOS_SIM_UDID" -b
```

If simulator inventory fails, distinguish service access, a missing runtime, and a target that requires a higher OS. Check the active developer directory and the destination diagnostics before claiming no device exists. Where necessary, select an already installed Xcode for the current shell with `DEVELOPER_DIR`. Keep any pre-existing device and app data intact.

## Run a targeted XCUITest

Find an existing UI test identifier and the scheme or test plan that includes it. An identifier such as `ExampleUITests/DraftTests/testRenamedDraftSurvivesRelaunch` is illustrative. Set `IOS_UI_TEST` to the actual identifier. If the project uses multiple test plans, select the relevant plan with `-testPlan` and its name. Each run needs a new result bundle path.

```sh
: "${IOS_UI_TEST:?Set the existing UI test identifier first}"
xcodebuild test "${container_args[@]}" -scheme "$IOS_SCHEME" \
  -destination "$ios_destination" -derivedDataPath "$ios_run_dir/DerivedData" \
  -only-testing:"$IOS_UI_TEST" -parallel-testing-enabled NO \
  -resultBundlePath "$ios_run_dir/Journey.xcresult"
```

Inspect the bundle even when the command fails, if it was created. Confirm that the named test actually ran on the selected OS and reached the relevant assertions. A skipped test or an empty test selection leaves the behavior unverified. Read the summary and the list of executed tests with these subcommands when the installed Xcode supports them.

```sh
xcrun xcresulttool get test-results summary --path "$ios_run_dir/Journey.xcresult"
xcrun xcresulttool get test-results tests --path "$ios_run_dir/Journey.xcresult"
```

Open the bundle in Xcode to inspect assertion failures, screenshots and activity logs, or discover installed commands with `xcrun xcresulttool help`. Confirm the fixture, wait on an observable state, perform the actual action and assert the postcondition. For a persistence claim, terminate and relaunch the app within the UI test and assert the saved value. Reuse the project's accessibility identifiers. [Running tests and interpreting results](https://developer.apple.com/documentation/xcode/running-tests-and-interpreting-results) · [Xcode testing](https://developer.apple.com/documentation/xcode/testing)

## Observe a journey directly

If there is no matching UI test, run the actual screen in Xcode or use existing simulator interaction tools. With the variables above, build the same scheme and retrieve the settings for its **app target**.

```sh
xcodebuild build "${container_args[@]}" -scheme "$IOS_SCHEME" \
  -destination "$ios_destination" -derivedDataPath "$ios_run_dir/DerivedData"
xcodebuild "${container_args[@]}" -scheme "$IOS_SCHEME" \
  -destination "$ios_destination" -derivedDataPath "$ios_run_dir/DerivedData" \
  -showBuildSettings
```

Set `IOS_APP_PATH` from that target's `TARGET_BUILD_DIR` and `FULL_PRODUCT_NAME`, and `IOS_BUNDLE_ID` from its `PRODUCT_BUNDLE_IDENTIFIER`. Keep the build configuration consistent between commands. Install the resulting simulator application and launch it.

```sh
: "${IOS_APP_PATH:?Set the built simulator app path}"
: "${IOS_BUNDLE_ID:?Set the app target bundle identifier}"
xcrun simctl install "$IOS_SIM_UDID" "$IOS_APP_PATH"
xcrun simctl launch "$IOS_SIM_UDID" "$IOS_BUNDLE_ID"
```

Inspect the current screen and identify the control from its accessibility element or observable state. Perform one semantic action using the available UI automation or Simulator interface, then inspect the resulting state before choosing the next action. Refresh the hierarchy after transitions. For a cancelled swipe, capture both the surviving screen and its next functional update. If state diverges, correlate the action time with logs from the app or extension process involved. Capture visual evidence at the acceptance point when helpful.

```sh
xcrun simctl io "$IOS_SIM_UDID" screenshot "$ios_run_dir/accepted-state.png"
```

A launch result establishes that the process started. A screenshot can demonstrate layout at the captured instant. Use the accessibility tree or real VoiceOver interaction when traversal is the question, and Instruments on a representative device when timing or energy is the question.

## When the criterion needs hardware

Pair and unlock an authorized device. Check Developer Mode, the installed SDK, signing, entitlements and the app's deployment target. On supported Xcode versions, `xcrun devicectl list devices` identifies connected devices. Use the physical iOS destination ID from the scheme's `-showdestinations` output with `-destination "platform=iOS,id=$IOS_DEVICE_ID"` in the test command and a fresh result path. Use the app built for the device SDK. [Running on simulated or physical devices](https://developer.apple.com/documentation/xcode/running-your-app-on-simulated-or-physical-devices)

Select hardware for actual camera capture, sensor or accessory events, power usage and representative performance. A simulated permission response or notification payload can exercise app handling. Production push delivery requires an end-to-end delivery test with the intended environment. Record which part ran and on which destination.

## Record the result

| Observation | Report |
| --- | --- |
| All selected acceptance steps reached their expected outcome | Record the revision/build, destination model and OS, scheme/configuration, actions, observed result, and decisive attachment or test identifier. |
| The app behaved incorrectly | Identify the first failing step, actual behavior and reproduction conditions. Preserve the failure and compare against the corrected build. |
| An assertion was skipped, the runner failed to start, signing is unavailable, or the required device cannot be accessed | Record the failing command or setup step and its diagnostic, completed independent checks and the precise behavior still unverified. Escalate a required evidence gap through the role's review protocol. |

For example, if a simulator passes the draft workflow but no physical camera is accessible, report the draft test with its result bundle and camera capture as unverified. Save only evidence relevant to the journey, remove sensitive content from shared attachments, and release only resources this run started.
