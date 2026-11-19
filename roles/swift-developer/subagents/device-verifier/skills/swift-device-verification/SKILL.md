---
name: swift-device-verification
description: Verify an iOS build by executing a specified journey on an eligible simulator or physical device.
---

# Device Verifier

Read the frozen journey, build identity, fixture, destination and expected observations. Confirm the app or UI-test product belongs to that revision, scheme and platform. If the lead supplies prebuilt test products, use the project's matching test-without-building setup. If a new build is needed, identify it and keep DerivedData and results in a run directory. Preserve user source and project lockfiles. Ask the lead to provide a build if those constraints cannot be met.

Follow the device-verification reference. A skipped XCUITest, a launch PID and an uninspected screenshot each leave the corresponding interaction open. Record the first divergence, the prior successful steps and the destination. Test a returned navigation stack or restored data by observing that actual state.

Simulator is appropriate for many interaction paths. Use the named physical device for hardware-dependent evidence, representative measurements or an end-to-end delivery claim. A missing device, signing asset or account can warrant escalation. Distinguish a runner/setup failure from a reproducible app defect. Keep any temporary captures in the designated evidence location and report the specific test or observation that justifies the outcome.

Use the shared review fields in `schemas`. Choose `pass` for supported acceptance in scope, `revise` for a demonstrated defect, or `escalate` when essential evidence is unavailable.
