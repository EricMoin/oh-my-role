# Rust Engineer behavioral regression scenarios

[`scenarios.json`](scenarios.json) contains **manual/session regression scenarios**.
It is not a native rolebox bench suite, an automated grader, or a record of passing
model trials. The old weighted `evals.json` was removed because its fixed tier and
node-count expectations contradicted the role's current policy and its lifetime
example prescribed a repair for the wrong cause.

The role-creator [`run_eval.py`](../../role-creator/scripts/run_eval.py) does not
execute legacy rubrics or translate these scenarios into benchmarks. Do not pass
this file as `--evals` or `--suite`. This directory configures no model provider,
paid run, baseline comparison or aggregate score.

## Run a manual scenario

1. Read the scenario's `setup` and prepare an isolated disposable workspace with
   the described source, pinned versions and diagnostics. Setups are fixture
   specifications, not bundled executable fixtures. Verify that the intended
   failure exists before evaluating the repair.
2. Start a fresh session using the current Rust Engineer role and give it only the
   natural task in `prompt`, along with ordinary repository access. Keep the
   acceptance and failure signals with the evaluator; they are not task hints.
3. For staged cases, deliver `events` only when their `when` condition occurs.
   Prefer actual runtime reports and command results from the fixture. If using
   a recorded exercise transcript, label it as exercise evidence; never impersonate
   a live tool result or claim the simulated graph actually executed.
4. Inspect the final diff, commands and outputs, review declarations, accepted
   reports and final answer. Evaluate the observable behavior in `acceptance`
   and `failure_signals`, not the presence of keywords or a preferred explanation.
5. Record `pass`, `fail`, `inconclusive` or `not-run` for each scenario, with the
   evidence and reason. Missing tools, fixtures or records make the relevant
   observation inconclusive; they are not a pass. Do not average away a concrete
   safety, evidence or acceptance failure with other successes.

Record the role revision/diff, fixture revision/diff, model/host configuration,
tool availability, relevant dependency versions, transcript location, actual
commands and observed result. Preserve a before/after failure for bug fixes.
There is no default result: adding a scenario or parsing this JSON does not run it.

## Coverage and interpretation

The scenarios cover unrelated keyword matches, missed async risk without spawn,
small-change regression evidence, five simultaneous material risks, Tokio handle
lifecycle, Cargo host/target selection, temporary-owner lifetime errors, partial
source evidence, real graph input dependencies, negative terminal outcomes,
stable snapshots, bounded repairs, research stopping and effort preferences.

Review selection follows [`complexity-model.md`](../references/complexity-model.md).
A case can pass with justified inline investigation or relevant specialist review
when either establishes the required evidence. No scenario demands a fixed tier,
reviewer count, global domain priority or blanket workspace test command. The
five-risk case checks coverage of all material risks, not a quota of graph nodes.
Use of the optional source worker is not a universal requirement.

Graph-specific cases require runtime evidence to assess dispatch, input delivery
or accepted outcomes. If the host cannot execute graphs, the role should disclose
that limit and continue useful inline work; graph behavior remains inconclusive.
For protocol regressions independent of model judgment, the real-runtime tests in
[`graph-contract.test.js`](../tests/graph-contract.test.js) exercise the shipped
declarations with stubbed worker decisions:

```sh
ROLEBOX_ROOT=/path/to/rolebox node scripts/test-runtime-contracts.mjs roles/rust-engineer/tests/graph-contract.test.js
```

Run that command from the repository root. Passing those tests verifies the
loader and graph protocol path; it does not prove that a model recognizes a
partial report or makes a sound review decision.

## Technical oracles

- The lifetime case deliberately retains a valid elided function signature and
  an invalid caller that borrows a temporary owner. Check the original diagnostic
  and repaired caller with the fixture's compiler; explicit lifetime annotations
  cannot keep that temporary owner alive.
- For the Tokio case, resolve documentation against the fixture's pinned version.
  The [JoinHandle documentation](https://docs.rs/tokio/latest/tokio/task/struct.JoinHandle.html)
  distinguishes detaching, cancellation requests and observing completion. Do not
  assume that the linked latest release matches a fixture's lockfile.
- The [Cargo build-script inputs documentation](https://doc.rust-lang.org/cargo/reference/build-scripts.html#inputs-to-the-build-script)
  explains host execution and target configuration inputs. A branch simulation,
  cross build and target runtime test establish different facts.

These are behavioral oracles, not mandates to add a dependency, install a tool,
or make an external model call. No full session evaluation has been performed
merely by maintaining these assets; retain actual trial evidence separately.
