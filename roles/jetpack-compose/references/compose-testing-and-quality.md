# Compose Testing and Quality Review Map

The implementation and check-selection source of truth is
[compose-testing-previews](../skills/compose-testing-previews/SKILL.md).
Runtime execution, evidence retention and temporal inspection are owned by
[device-verification](device-verification.md), [device-test-memory](device-test-memory.md)
and [device-video-debugging](device-video-debugging.md).

| Question | Evidence to inspect |
| --- | --- |
| Does the check detect a plausible regression? | Trigger, observable assertion and failure path |
| Does it preserve production boundaries? | No test-only visibility expansion or private-helper coupling |
| Is coroutine/Flow observation deterministic? | Dispatcher/scheduler setup, subscription and required transitions |
| Does a UI action assert its outcome? | Semantics/state/callback result, not only a successful click |
| Is a screenshot actually a regression test? | Baseline comparison with a failing mismatch, not capture alone |
| Are host and task names real for this project? | Configured plugins, module/variant, test host and dependencies |
| Does evidence describe the final code? | Build identity, selected acceptance checks and explicit limitations |

Previews are inspection aids; coverage is a signal, not proof. Do not invent test ratios,
per-component quotas, screenshot plugins or mandatory device journeys. A blocked required
check stays unverified. Optional archival cannot replace runtime acceptance or delay a repair.

When implementing a check, use the owning skill's
[behavior-testing recipes](../skills/compose-testing-previews/references/testing-recipes.md)
or [preview fixtures](../skills/compose-testing-previews/references/preview-recipes.md).
They include assertions and setup assumptions rather than capture-only pseudo-tests.
