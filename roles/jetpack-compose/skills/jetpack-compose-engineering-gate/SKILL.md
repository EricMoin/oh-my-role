---
name: jetpack-compose-engineering-gate
description: Apply invariant, ownership and verification judgment to consequential Compose changes. Route targeted specialist review and Android or HarmonyOS runtime acceptance without imposing a fixed phase machine.
---
# Compose engineering judgment

`PROMPT.md` owns design policy, encapsulation, investigation budgets and completion criteria.
Use its focused/runtime/extended tiers. This skill is a decision checkpoint, not another
copy of the lead workflow.

## Before changing a consequential boundary

- Trace the affected behavior through callers, state/resource owners and lifetimes.
- State the invariant, the smallest coherent change and one observable scenario that could
  disprove it. Use the brief in `references/schemas.md` when a handoff needs it.
- Compare alternatives only for consequential decisions. Keep private details private;
  extraction needs a production responsibility, not access from a test.
- Select relevant domain skills through PROMPT.md's routing table. Ordinary bounded fixes
  need neither a full Engineering State nor a graph.

## Select the evidence

| Uncertainty | Next step |
| --- | --- |
| API/version behavior | `android-source-research`; trace source only as needed |
| Local logic or state transition | Existing production entry points and focused checks |
| Runtime-only behavior | The selected transport playbook below |
| Material risk needing independent examination | Relevant reviewer over an actual stable diff and check results; read `references/graph-protocol.md` before dispatch |
| Optional organization of sealed evidence | `references/background-recording.md`; continue repairs while recording runs |

For Android use `references/device-verification.md`; for HarmonyOS/OpenHarmony use
`references/harmonyos-device-verification.md`. Select from the actual target and artifact.
An APK on an `hdc`-only target requires a supported on-device compatibility installation
route; never send it to `hdc install`. A missing optional CLI alone does not block an
existing capable toolchain. Setup follows existing user authorization and the playbook.

## Before completion

Inspect the complete resulting call chain and remove superseded mechanisms. Recheck the
changed risk after repairs; old snapshot evidence cannot approve new code. Read every
required independent result and resolve supported blockers. Report actual checks and any
unavailable evidence. Optional archival is separate from acceptance and never justifies
rerunning the app. Use `references/device-test-memory.md` for minimal retained runtime
facts and `references/device-video-debugging.md` only for temporal evidence needs.
