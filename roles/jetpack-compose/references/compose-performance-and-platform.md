# Performance Review Reference

Implementation and diagnostics belong to `skills/compose-performance/SKILL.md`; state
contracts to `skills/compose-runtime-state/SKILL.md`; lifecycle, WorkManager and build
integration to `skills/android-platform-engineering/SKILL.md`. Load the relevant skill
instead of maintaining parallel examples here.

For worked diagnostic and benchmark procedures, follow
[measurement recipes](../skills/compose-performance/references/measurement-recipes.md).
For WorkManager status and variant setup, use the platform owner's
[recipes](../skills/android-platform-engineering/references/platform-recipes.md).
The lifecycle-observer pattern lives with
[state/effect cleanup](../skills/compose-runtime-state/references/state-and-effect-recipes.md).

## Review Questions

| Area | Evidence to examine |
| --- | --- |
| Recomposition | Actual state-read scope and measured cost; child skipping and current compiler mode |
| Stability | Truth of mutation/equality contracts; meaningful report changes, not annotation count |
| Lazy layouts | Unique durable identity for moving items, compatible content types, realistic item sizes |
| Startup | Trace of blocking work; target build and compilation/profile state |
| Images/resources | Decode size, allocation/retention evidence, correct listener/resource release |
| Lifecycle | Ownership and collection policy appropriate to UI versus background work |

A missing annotation, unremembered callback, non-restartable composable or absent benchmark
module is not independently a blocker. Block on a demonstrated correctness problem,
credible regression mechanism in the changed path, unmet acceptance or unsupported material
performance claim. Keep speculative optimization opportunities advisory.

## Measurement Record

Record the revision, dependency/compiler versions, build variant, target device/API,
scenario, warmup/iterations, compilation mode, metric units and output artifacts. Compare
baseline and repaired runs under equivalent conditions. Preserve both outcomes and report
noise or unavailable evidence. Use the benchmark's actual emitted metric names and units;
do not reinterpret frame duration as a universal jank percentage or process memory as heap.

A successful build, Layout Inspector count, configured profile or recording alone cannot
prove a timing improvement. Inspect captures and use traces/benchmarks for the claimed cost.
See `references/device-verification.md` for runtime acceptance and
`references/device-video-debugging.md` for transient visual evidence.

## Completion

The smallest measurement that resolves the hypothesis is sufficient. Re-run the affected
journey after the repair and check for lifecycle/state regressions. Add durable benchmarks
when the risk and project practice justify them; avoid making setup a gate for unrelated
local fixes. The review report uses `references/schemas.md` and cites actual evidence.
