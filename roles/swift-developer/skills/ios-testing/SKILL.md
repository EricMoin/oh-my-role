---
name: ios-testing
description: Choose and interpret a regression check for an iOS feature or its Swift package, including isolation of flaky tests, Swift Testing, XCTest, XCUITest and migration fixtures.
---

# iOS testing

Name the behavior that a regression would break. Read the nearest existing test and how the project runs it. For a host-compatible package, run `swift test` at its manifest when that test exercises the contract. Choose an iOS destination for package code that needs an iOS framework. For an app-hosted test or UI journey, identify its actual scheme and test plan. [Swift Package Manager](https://www.swift.org/documentation/package-manager/)

For a failure **only in the full suite**, look for a shared resource the tests can mutate. Isolate that fixture and rerun the cases together under the original parallel configuration. For **zero selected tests**, check the filter against discovered tests, the package test target or the Xcode scheme and test plan. For **framework migration**, keep XCUIAutomation journeys and XCTest performance measurements in XCTest, and migrate compatible unit cases independently. [Swift Testing migration](https://developer.apple.com/documentation/testing/migratingfromxctest)

| Claim | Smallest useful check |
| --- | --- |
| A parser, validation rule or state transition accepts particular inputs | Use the project's unit framework. With Swift Testing, `@Test(arguments:)` can enumerate boundary cases, `#require` can establish a prerequisite, and `#expect` can check the resulting public value. Xcode 16 introduced bundled Swift Testing. Keep compatible XCTest suites running alongside it. [Migrating tests from XCTest](https://developer.apple.com/documentation/testing/migratingfromxctest) · [Meet Swift Testing](https://developer.apple.com/videos/play/wwdc2024/10179/) |
| A dismissed search can still update the result | Inject the transport or clock at the existing boundary. Hold request A, finish B, release A, and assert the observable screen model. Await completion before inspecting the result. A wall-clock sleep makes the failure depend on the test runner. [Testing asynchronous code](https://developer.apple.com/documentation/testing/testing-asynchronous-code) |
| A migration preserves a user's draft | Open a disposable copy of a prior-version disk fixture with the production migration, then reopen it and verify identity, relationships and subsequent edits. Use an in-memory store for model logic where disk behavior is irrelevant. |
| An edit survives navigation and relaunch | Drive the app with XCTest and XCUIAutomation. Start with isolated app data, enter a draft, navigate back, terminate, relaunch, and find the same draft. Use accessible element identities and bounded waits for visible conditions. Place assertions on the user-visible outcome. [XCTest](https://developer.apple.com/documentation/xctest/) |
| Scrolling or startup regresses | Choose the relevant XCTest performance metric or Instruments trace. Repeat a fixed fixture and interaction on the same device, OS and configuration for baseline and candidate. Include observed variability. [XCTest performance testing](https://developer.apple.com/documentation/xctest/performance-tests) |

## Avoid hidden dependencies

- Swift Testing runs tests in parallel by default. Give each case its own temporary directory, preferences suite, store and transport state as applicable. A suite's `.serialized` trait orders cases within that scope. Other suites can still run concurrently. [Running tests serially or in parallel](https://developer.apple.com/documentation/testing/parallelization)
- For callback or delegate APIs, a Swift Testing confirmation counts events during its body. Arrange for the body to await the operation that delivers the event. Simply registering a callback lets the body exit before delivery. [Testing asynchronous code](https://developer.apple.com/documentation/testing/testing-asynchronous-code)
- Inject only dependencies that control input, timing or effects. Prefer asserting saved data, a visible error or a delivered event over counting private helper invocations. A preview demonstrates a supplied visual state. Use a running app for interaction, persistence or accessibility acceptance.

## Report what ran

Report the command, target, execution platform and tests that actually ran. Inspect skips, expected failures and retries. For Xcode, name the scheme, test plan when used and decisive result in the `.xcresult`. A host package run establishes the package behavior exercised on that host. Record outstanding app or device evidence when it is part of the requested claim. [Xcode test plans](https://developer.apple.com/documentation/xcode/organizing-tests-to-improve-feedback)
