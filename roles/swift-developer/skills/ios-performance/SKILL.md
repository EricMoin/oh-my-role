---
name: ios-performance
description: Investigate iOS launch delays, hitches, hangs, excess memory and energy use. Use to select Instruments and XCTest evidence, locate the responsible work, and compare representative builds on hardware.
---

# iOS performance

Record the slow action and the condition that triggers it. For example, the first scroll through uncached thumbnails on an older supported iPhone exercises a different path from revisiting a cached list. Specify the observable metric, representative data and device before optimizing.

| Symptom | First evidence | Follow the trace |
| --- | --- | --- |
| Long launch or delayed first interaction | Launch profile and an existing XCTest launch metric. Distinguish cold/warm launch, resume and the first useful content if that arrives after first draw. | Identify startup initializers, synchronous storage or main-thread work in the measured interval. Defer only work the first interaction can safely do without. [Reducing launch time](https://developer.apple.com/documentation/xcode/reducing-your-app-s-launch-time) |
| Hitches while scrolling or animating | Record the gesture with Instruments and locate a missed frame. Correlate the interval with Time Profiler or the SwiftUI instrument supported by the installed tools and runtime. | For long view updates, inspect the expensive stack. For many short updates, trace the dependency that repeatedly invalidates the view. Re-run the same gesture after the change. [Understanding SwiftUI performance](https://developer.apple.com/documentation/xcode/understanding-and-improving-swiftui-performance) · [WWDC Instruments walkthrough](https://developer.apple.com/videos/play/wwdc2025/306/) |
| A tap stalls while CPU use is low | Inspect the main thread during the hang and the worker it waits for. A blocked thread can appear quiet in CPU samples. | Follow a synchronous wait, lock holder, priority inversion or I/O to its caller. After changing the blocking path, confirm both responsiveness and completion of the original operation. [Thread Performance Checker](https://developer.apple.com/documentation/xcode/diagnosing-performance-issues-early) |
| Memory grows each time a screen closes | Repeat the same present/dismiss cycle, allow legitimate work to finish, inspect surviving instances in the memory graph, and compare allocation lifetimes. | Trace references into the retained controller, model or large buffers. Distinguish a bounded cache or peak allocation from a cycle or continuing growth. Verify the same sequence releases the expected instances. [Memory graph debugging](https://developer.apple.com/documentation/xcode/diagnosing-and-resolving-bugs-in-your-running-app) |
| Users report excessive battery use or release-only regressions | Select the affected build/device cohort and matching power, hang, hitch, launch or memory metric in Organizer, when data is available. Reproduce the affected use pattern on a device. | Investigate the observed workload, such as repeated networking or timers after a scene backgrounds. Re-check the workload locally and compare field cohorts when sufficient new data exists. [Performance of a shipping app](https://developer.apple.com/documentation/xcode/analyzing-the-performance-of-your-shipping-app) |

## Make the comparison reproducible

1. Use the same physical device model and OS, build settings, fixtures, network/cache assumptions and action on both revisions. Keep thermal and power conditions comparable. Record them when they could explain the result.
2. For timing baselines, use a representative Release test configuration, with the debugger detached, coverage off and runtime sanitizers off. Use diagnostic runs separately when their instrumentation changes the measurement. [Writing and running performance tests](https://developer.apple.com/documentation/xcode/writing-and-running-performance-tests)
3. Save the metric name, units, run count, representative value and spread, plus the relevant trace interval or result bundle. Verify correctness on the same data. A lower count of SwiftUI body evaluations alone does not show shorter frame times.
4. If only simulator measurements are available, use them to locate expensive code and identify the device measurement still needed. If no baseline exists, report the observed post-change value and its conditions. [Running on simulated or physical devices](https://developer.apple.com/documentation/xcode/running-your-app-on-simulated-or-physical-devices)

## A worked example from a shipping app

Airbnb traced scrolling hitches on its Search screen to expensive SwiftUI updates, split large views and introduced equality comparisons on selected views. The team measured hitch reduction on that screen. To investigate a similar report, first locate a slow frame and identify which row inputs changed. If considering custom equality, verify that changes to every displayed value and interactive behavior still reach the view. Measure the same scroll before adopting that technique elsewhere. [Airbnb Engineering's SwiftUI performance investigation](https://airbnb.tech/mobile/understanding-and-improving-swiftui-performance/)
