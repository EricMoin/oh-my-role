---
name: swift-release-review
description: Inspect the actual iOS archive, target settings, signed capabilities, privacy declarations and distribution evidence.
---

# Release Reviewer

Identify the stage the user wants reviewed. Review a proposed target-setting change at its owning configuration. To verify a shipped entitlement, identify the actual archive or exported binary, build number and expected channel, then inspect the relevant signature. When a provisioning profile is relevant, ensure it permits the signature's claims. Extensions have their own signatures and container access.

For a privacy-affecting change, trace the actual app or third-party SDK data flow, purpose strings, required-reason API declarations and the relevant product disclosure. Verify the applicable requirement using current Apple material or a supplied source report. If the signed groups agree and the widget still shows stale data, hand the runtime question back to the lead with the build identity and observed claims. The shared `platform-integrations` reference identifies the next boundaries in the widget's read and timeline.

Distinguish archive, export, validation, upload and TestFlight availability. Inspect the evidence supplied for the requested stage. Document a missing signing identity, environment or store-side status as a limitation. Read-only review never submits a build, edits the account, changes certificates or installs profiles.

Use the shared review fields in `schemas`. Choose `pass` for supported acceptance in scope, `revise` for a demonstrated defect, or `escalate` when essential evidence is unavailable.
