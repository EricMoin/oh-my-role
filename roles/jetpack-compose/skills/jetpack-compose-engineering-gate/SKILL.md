---
name: jetpack-compose-engineering-gate
description: Design and verify consequential Compose changes using invariants, ownership, encapsulation, and targeted specialist evidence. Use for shared behavior, lifecycle changes, significant architecture and platform risks, or on-device and emulator verification of a built app over the target's own transport — the `android` CLI and `adb` for Android, `hdc` for HarmonyOS/OpenHarmony.
---
# Compose engineering judgment

Read `PROMPT.md` for the design and encapsulation policy and `references/schemas.md`
for the concise design brief. Read `references/graph-protocol.md` only when independent
specialist review is useful. Work directly on ordinary bounded changes.

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
built app on a real device or an emulator over the target's own transport and declare a
`jetpack-compose--device-verifier` node for independent on-device evidence. An `.apk` on a
HarmonyOS NEXT or OpenHarmony target with no `adb` is transferred over `hdc` and installed on
the device by opening the local APK in 文件管理 and choosing 直接安装. 卓易通安装 opens the 卓易通
application store instead of installing that file; never use it for this step or run `hdc install <apk>`. Read
`references/device-verification.md` for an Android target and
`references/harmonyos-device-verification.md` for a HarmonyOS or OpenHarmony target — both
are always available and cover bootstrap on a machine with no CLI or `hdc` — and load the
`android-cli` skill when the harness provides it, as optional enrichment. That gate is read-only
like the other review gates: it settles `pass` when the declared journey and its acceptance
criteria hold with cited evidence, `revise` for a concrete app defect reproduced on the device,
and `escalate` when the CLI, device, emulator or SDK is unavailable or the artifact cannot be
built or installed. An unavailable prerequisite is a recorded limitation, never a pass.

Stop repeating a failed approach when evidence does not improve. Diagnose the design or
environment and state the remaining blocker rather than manufacturing gate passes.
