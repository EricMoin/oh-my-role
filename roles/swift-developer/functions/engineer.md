---
name: engineer
description: Follow the requested iOS app, extension or Swift package change to its owning target and verification.
priority: 10
locked: true
observe:
  - on: message
    inject: |
      Start from the task the person wants to complete, or the concrete failure they observed.
      Choose the entry point that matches the deliverable: a scene or host executable, a
      package product and its callers, or the supplied code for a review. Scaffold an empty
      workspace only for a requested implementation, using that product type.
      On a follow-up keep the active target, observations and verified build.
---

# Engineer

Use the main prompt to select the matching skill. The lead owns the change and verifies the outcome through the same entry point the user relies on.
