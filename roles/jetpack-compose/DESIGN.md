# Jetpack Compose role design

The lead owns design and production edits. Six read-only specialists supply targeted
evidence through the rolebox graph v3 outcome protocol: the five review and evidence
gates plus the `device-verifier`, which exercises a built app on a real device or an
emulator over the target's own transport — the `android` CLI and `adb` for an Android
target, `hdc` for HarmonyOS/OpenHarmony — following
`references/device-verification.md` or `references/harmonyos-device-verification.md`
when acceptance depends on runtime behavior only a running app can show. An `.apk` on a
HarmonyOS NEXT or OpenHarmony target with no `adb` is such an `hdc` target: the APK is
opened in 文件管理 and installed with 直接安装. 卓易通安装 opens the 卓易通 application store
instead of installing that local file; never use `hdc install <apk>`. Ordinary bounded
work stays inline. Significant work starts with
invariants, ownership, lifetime and a minimal coherent boundary; reviews inspect an
actual stable implementation snapshot. Early consultations resolve specific
uncertainties and do not approve unwritten code.

The lead confirms the target before expensive investigation, asking early only when
different interpretations change the fix. A bounded local task starts with a short
target/behavior/mechanism/change/check contract. Verification is focused by default,
adds runtime evidence when the behavior requires it, and expands only for a named risk.
Source evidence plus adequate observation can justify implementation without exhaustive
research. Three attempts per unchanged hypothesis include exploration and capture retries;
ten minutes without diagnosis or implementation progress triggers reassessment, not an
automatic permission request. Final-code evidence covering the selected acceptance criteria
and no remaining blocking defect is the completion condition.

The previous workflow duplicated mandatory phases across the parent prompt, auto-injected
engineer function and gate skills. Tests were judged by ratios, per-component coverage
and framework prescriptions; architecture checks prescribed layers irrespective of need.
This encouraged mechanical compliance and provided no explicit protection against
visibility changes made solely for tests. The revised role tests production behavior,
preserves private details, and permits extraction only for a meaningful responsibility.

Independent reviews run concurrently as root nodes. Edges route on accepted outcomes and
declared consumer inputs express real evidence dependencies; accepted results are data,
not automatic shared-state patches. The lead synthesizes findings and performs bounded
repairs between review batches. There is no imaginary writer in a cycle of read-only
reviewers. A completed graph is not an accepted change.

Sources of truth:

- `PROMPT.md`: design judgment, encapsulation, workflow and specialist selection.
- `functions/engineer.md`: short per-message reminder, including continuation behavior.
- `references/schemas.md`: concise brief and evidence report.
- `references/graph-protocol.md`: engine semantics and recovery.
- `references/background-recording.md`: separate optional recorder graph, sealed inputs,
  exclusive output ownership, accepted recording outcomes and actual host lifecycle limits.
- `references/device-test-memory.md`: project-local device pitfalls, reusable cases,
  compact per-run evidence and optional reusable records under `.rolebox/jetpack-compose/device-testing/`.
- `references/device-video-debugging.md`: when transient paths need recording, how to
  inspect source-timestamped frames and correlate actions/logs, and how to compare repairs.
- Domain skills: contextual guidance loaded for the current decision.

Device verification consults relevant history and retains minimum durable facts/evidence,
including setup failures and unexecuted steps. Cases, profiles and indexes are maintained
when reuse warrants them; full dossiers are not a default completion requirement. Start
temporal checks with short captures and decisive frames; full-frame/clock analysis is for
remaining timing questions. Historical evidence never certifies a changed build/environment.

The seventh child, `journey-recorder`, handles optional evidence organization in a separate
one-node graph. Dispatch it as soon as useful inputs are sealed, then continue foreground
repairs. It cannot inspect changing production code, drive devices, run checks or decide
acceptance. Only its assigned disjoint output directory is writable by contract; the lead
alone merges shared index/profile/case proposals. Graph v3 does not enforce this subtree
as a per-node filesystem sandbox. Optional archive state is separate from product status,
and no promise is made that a worker survives host exit. Minimal evidence is retained before
handoff; required independent review still blocks acceptance when its result is necessary.

Validation should distinguish loader/protocol compatibility from model behavior. Real
rolebox loader and graph-engine tests can establish the former; realistic task trials
are needed to establish whether code quality improves. Do not claim a prompt change
proves that future generated code is correct.
