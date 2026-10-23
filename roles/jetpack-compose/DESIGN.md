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
- `references/device-test-memory.md`: project-local device pitfalls, reusable cases,
  per-run evidence and lead-owned archival under `.rolebox/jetpack-compose/device-testing/`.
- `references/device-video-debugging.md`: when transient paths need recording, how to
  inspect source-timestamped frames and correlate actions/logs, and how to compare repairs.
- Domain skills: contextual guidance loaded for the current decision.

Device verification begins with a history lookup and ends with durable records, including
setup failures and unexecuted steps. Case identity follows behavior and preconditions;
regression re-runs keep that identity and add execution records. Independent workers keep
their repository read-only boundary and return temporary evidence for the lead to archive.
Historical evidence helps plan coverage but never certifies a changed build or environment.

Validation should distinguish loader/protocol compatibility from model behavior. Real
rolebox loader and graph-engine tests can establish the former; realistic task trials
are needed to establish whether code quality improves. Do not claim a prompt change
proves that future generated code is correct.
