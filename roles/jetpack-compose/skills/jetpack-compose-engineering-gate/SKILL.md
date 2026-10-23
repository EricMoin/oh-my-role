---
name: jetpack-compose-engineering-gate
description: Design and verify consequential Compose changes using invariants, ownership, encapsulation, and targeted specialist evidence. Use for shared behavior, lifecycle changes, significant architecture and platform risks, or on-device and emulator verification of a built app over the target's own transport — the `android` CLI and `adb` for Android, `hdc` for HarmonyOS/OpenHarmony.
---
# Compose engineering judgment

Read `PROMPT.md` for the design and encapsulation policy and `references/schemas.md`
for the concise design brief. Read `references/graph-protocol.md` only when independent
specialist review or background recording is useful. Work directly on ordinary bounded
changes: target, expected behavior, failure mechanism, smallest change and completion checks
are sufficient. Ask early if multiple targets require different fixes; clear intent needs
no approval ritual. Apply PROMPT.md's focused/runtime/extended tiers, not every gate.

Before implementation, trace the affected behavior across its callers and owners. State
invariants and lifecycle responsibilities. Compare alternatives only where the decision
is consequential; choose the least complex coherent solution. An abstraction needs a
production responsibility, not a checklist or a desire to unit-test a private helper.

Choose verification by plausible regressions and observable contracts. Keep private
members private. Tests may motivate discovery of a misplaced responsibility, but do not
justify visibility widening or a test-only wrapper. Inspect the resulting call chain and
remove obsolete mechanisms after replacing a design.

An early consultation resolves a named uncertainty. Acceptance review requires an actual
diff and recorded check results. Declare one review batch per stable snapshot: the lead
declares the graph and remains the sole production-code writer, while the specialists are
read-only evidence nodes on that snapshot. Each worker settles its own node by submitting
the declared outcome its dispatch names with the attempt credential it carried, and only
an accepted decision settles a node. Read the accepted results before integrating
findings; repairs stay parent-owned and bounded, and the lead owns the final decision.
Require concrete failure mechanisms for blocking findings; do not obey unsupported
pattern prescriptions.

When acceptance depends on runtime behavior only a running app can show — navigation and
back-stack flows, runtime permissions and dialogs, text entry/IME, lifecycle or process
recreation, notifications or deep links, crash/ANR, or user-visible jank — verify the
built app on a real device or an emulator over the target's own transport. Declare a
`jetpack-compose--device-verifier` node only when independent on-device evidence is needed;
an inline targeted runtime check is sufficient otherwise. An `.apk` on a
HarmonyOS NEXT or OpenHarmony target with no `adb` is transferred over `hdc` and installed on
the device by opening the local APK in 文件管理 and choosing 直接安装. 卓易通安装 opens the 卓易通
application store instead of installing that file; never use it for this step or run `hdc install <apk>`. Read
`references/device-verification.md` for an Android target and
`references/harmonyos-device-verification.md` for a HarmonyOS or OpenHarmony target — both
are always available and cover bootstrap on a machine with no CLI or `hdc` — and load the
`android-cli` skill when the harness provides it, as optional enrichment. That gate is read-only
like the other review gates: it settles `pass` when the declared journey and its acceptance
criteria hold with cited evidence, `revise` for a concrete app defect reproduced on the device,
and `escalate` when a required tool capability, device, emulator or SDK is unavailable or the artifact cannot be
built or installed. An unavailable prerequisite is a recorded limitation, never a pass.

Each investigation must resolve a named uncertainty that affects the fix or acceptance.
Use at most three attempts per unchanged hypothesis/build/setup, including exploration and
capture retries; stop sooner when evidence does not improve. Reassess after roughly ten
minutes without diagnosis or implementation progress. A new tool, graph or take name is not
a fresh budget. Begin the repair once adequate evidence supports it. After two unsuccessful
substantive repairs of the same mechanism, diagnose the blocker rather than adding mechanisms.

Use `references/device-test-memory.md` for compact run facts, relevant history and essential
evidence. Reusable cases, full journey versioning and profiles are conditional, not a
completion tax for every fix. Noncritical enrichment can be dispatched to a separate
`jetpack-compose--journey-recorder` graph per `references/background-recording.md`; continue
repair immediately on a new source snapshot while it organizes sealed evidence. The lead
alone merges shared records. Old passes do not verify new builds; failed/blocked outcomes
and not-run steps survive both inline and delegated recording.

For transient UI paths, use a short capture and decisive frames first. Full-frame analysis
and clock correlation are needed only for unresolved timing/order claims; use
`references/device-video-debugging.md`. Missing required temporal evidence remains unverified.
Finish when selected checks establish the requested behavior on final code and no blocking
defect remains. Optional archival can remain pending and never justifies another app run.
