---
name: ios-runtime-diagnostics
description: Classify an iOS app or extension exit on device or TestFlight from its process, termination reason and diagnostics, including exceptions, watchdog timeouts and jetsam.
---

# When the process disappears

Begin with the reported time, build, OS, device, affected process and last action. Obtain the corresponding device report or Organizer incident. Record what the evidence actually identifies. A widget closing and its containing app crashing are separate events.

| Observation | First discriminator | Next evidence |
| --- | --- | --- |
| Crash with an exception or signal | Read the termination and exception fields, triggered thread, application-specific information and any last exception backtrace. Identify the relevant frame's binary image. | For unsymbolicated frames, match the image UUID and architecture to a dSYM. Follow the first pertinent app or framework frame and reproduce the triggering operation. [Analyzing a crash report](https://developer.apple.com/documentation/xcode/analyzing-a-crash-report) |
| Watchdog termination | The termination description identifies a time allowance the process exceeded, such as creating a scene. Inspect the operation and CPU statistics in that report. | Collect a trace covering the same lifecycle transition on a representative build. A stack at termination can show what was happening at the end while omitting expensive earlier work. [Addressing watchdog terminations](https://developer.apple.com/documentation/xcode/addressing-watchdog-terminations) |
| Jetsam event | Locate the entry for the **jettisoned process**, inspect its reason and footprint, and correlate it with the build and user report. The largest process in the report may be a different process. | Reproduce the workload and measure peak memory/allocation lifetime. A jetsam report describes memory pressure and lacks a crashing thread backtrace. [Reading jetsam event reports](https://developer.apple.com/documentation/xcode/identifying-high-memory-use-with-jetsam-event-reports) |
| Home screen or clean relaunch, no matching report yet | Check the actual bundle and timestamp, scene/session restoration, normal background process removal and the device logs. | Record whether the process exited, the scene reconnected, or UI state was lost while the process remained alive. Tie a cause to additional evidence. [Diagnosing crashes and device logs](https://developer.apple.com/documentation/xcode/diagnosing-issues-using-crash-reports-and-device-logs) |

For a binary UUID from a device report, find the archive for that distributed build and select the dSYM for the named executable or embedded framework. Inspect its architecture slices with `xcrun dwarfdump --uuid "/path/to/Name.app.dSYM"`. A matching bundle version can still correspond to a different binary. Use the matching symbols in Xcode and keep unverified frames explicit until symbols are available. [Matching symbols](https://developer.apple.com/documentation/xcode/adding-identifiable-symbol-names-to-a-crash-report)

Report the incident classification, the observation that supports it, the unknown that still affects diagnosis and the smallest experiment that distinguishes remaining explanations. If the process is alive and responding slowly, begin with a trace around that interaction using the performance skill.
