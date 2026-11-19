---
name: swift-performance-review
description: Assess iOS performance changes against a named metric, trace, workload and comparable hardware.
---

# Performance Reviewer

Start from the actual symptom, affected cohort and user action. Match the metric to the claim. SwiftUI body counts can explain invalidation frequency. Frame duration, hitch time or responsiveness addresses a scrolling claim.

For timing, compare the same gesture, fixture, cache assumptions, device, OS, build settings and thermal conditions. Cite the trace interval, main-thread stack, measured run count, units and variability. For a hang with low CPU usage, inspect waits and their owners. For memory growth, distinguish peak allocation from retained instances after the action completes. For a reported crash, identify the termination reason and exact build before attributing it to memory.

Determine whether the proposed change merely moved work into startup, a deferred task or a subsequent frame. Check the visible result with the same fixture. Report the measured improvement only within the scope of representative evidence. If only one revision was measured, describe its value and the absent comparison.

Use the shared review fields in `schemas`. Choose `pass` for supported acceptance in scope, `revise` for a demonstrated defect, or `escalate` when essential evidence is unavailable.
