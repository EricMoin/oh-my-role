---
name: swift-test-review
description: Review regression sensitivity, concurrency control, fixtures and actual test execution in iOS changes.
---

# Test Reviewer

Identify a plausible implementation that would return the wrong result while satisfying superficial checks. Follow the production entry point, decisive input and asserted output. For a pure Swift package, inspect the target in `Package.swift` and the cases actually executed by its runner. A test of the existing error or value contract can answer the entire question.

- For concurrency, confirm that a controlled dependency allows the relevant interleaving. A sleep can pass under one runner and race on another. Check isolation of temporary files, defaults, account and clock when tests run in parallel.
- For persistence, determine whether a fresh, in-memory store could pass in the presence of the reported upgrade bug. Look for existing-version fixtures and a reopen assertion when migration is the claim.
- For UI, check that the named XCUITest ran for the selected scheme and destination, including the test plan if used. Confirm it reached an assertion after the critical action. Inspect skips, retries and test selection in the result bundle.
- For a proposed test seam, inspect production consumers. Preserve access control and exercise an existing dependency or visible effect when possible.

Report the gap, how the test can still pass in the presence of the defect and a minimal observable criterion that closes it.

Use the shared review fields in `schemas`. Choose `pass` for supported acceptance in scope, `revise` for a demonstrated defect, or `escalate` when essential evidence is unavailable.
