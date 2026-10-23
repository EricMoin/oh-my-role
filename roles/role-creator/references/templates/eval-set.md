# Native benchmark suites

Tier 4 delegates to `rolebox bench`. A suite selects an explicit role, provider,
model and dataset. Current native execution supports **dsh and self-contained
roles**. Global skills, cross-role `open_roles`, symlinks and environment-dependent
role assets are unsupported by the benchmark snapshot. Native validation reports
these constraints; a normal harness installation is not proof of benchmark support.

The implementation contract is rolebox's `docs/benchmarks.md`,
`src/benchmark/spec.ts`, `snapshot.ts` and `src/cli/commands/bench.ts`.

## Create a suite

Use the installed CLI (no model requests):

```sh
rolebox bench init ./output-quality
```

For a local source checkout use `bun /path/to/rolebox/src/cli/main.ts bench init
./output-quality`. The new directory contains `suite.yaml`, `cases.jsonl`, a
starter `role/role.yaml`, and a README. Choose `--template code-fix` for a workspace
fixture with executable checks. Replace the starter role or point `target.role`
at the role under review; always pass that same directory to the adapter.

Minimal suite, with illustrative names that must be configured for a live run:

```yaml
schemaVersion: 1
id: output-quality
target:
  host: dsh
  role: ../roles/example-role
  provider: example-provider
  model: model-name
host:
  # Optional: package directory of a complete, compatible dsh installation.
  # moduleRoot: ../dsh-runtime
  plugins:
    - module: example-provider-plugin
      config:
        apiKey:
          $env: EXAMPLE_API_KEY
  env: [EXAMPLE_API_KEY]
dataset: cases.jsonl
run:
  repetitions: 3
  concurrency: 1
  timeoutMs: 120000
```

Paths resolve relative to `suite.yaml`. Credentials are supplied through the
named environment variable, never literal values in suite files. Provider/model
are explicit experimental conditions, not inferred from a default harness
profile. Choose a trusted installed provider plugin and its actual config shape.

Each nonblank line of `cases.jsonl` is one JSON object:

```jsonl
{"id":"ready","prompt":"Reply with exactly READY and no other text.","assertions":[{"kind":"equals","value":"READY"}]}
{"id":"explanation","prompt":"Explain a benchmark in one sentence including the words benchmark and task.","assertions":[{"kind":"contains","value":"benchmark"},{"kind":"contains","value":"task"}]}
```

These starter cases verify response plumbing only. Replace them with meaningful
cases for the role. Assertions are literal and case-sensitive; every assertion
must pass. Native response assertions currently support `equals` and `contains`.
There are no automatic weighted rubrics, 0–10 graders, LLM judges, regex assertions
or multi-turn scenario drivers. Each repetition is an independent trial.

For a role that edits files, use a workspace case instead of treating a convincing
explanation as proof of a correct change:

```jsonl
{"id":"sum-empty","prompt":"Fix src/sum.mjs so sum([]) returns 0; preserve other numeric behavior. Edit the file.","workspace":{"fixture":"./fixtures/sum","checks":"./checks/sum"},"assertions":[{"kind":"file_exists","path":"src/sum.mjs"},{"kind":"command","argv":["bun","{checks}/check.mjs","{workspace}"],"timeoutMs":10000,"expectedExitCode":0}]}
```

Fixtures and checks must be self-contained directories inside the suite. Verify
the checker fails on the defective fixture and passes on a corrected temporary
copy before running a model. File assertions also support `file_equals` and
`file_contains`. Native command checks run after model termination against the
captured workspace. The native isolation mode is `trusted-process`, not an OS
security sandbox; use trusted roles, plugins and checks.

## Adapter commands

Run from the repository root; adapt paths for the actual suite and role:

```sh
python3 roles/role-creator/scripts/run_eval.py roles/example-role --suite output-quality --json
python3 roles/role-creator/scripts/run_eval.py roles/example-role --suite output-quality --action doctor --json
python3 roles/role-creator/scripts/run_eval.py roles/example-role --suite output-quality --action run --confirm --output-dir benchmark-results --json
```

The default action is `validate`. `doctor` adds static installed-runtime checks.
Neither makes model requests or establishes authentication or live execution.
`run` performs both checks, then requires explicit `--confirm` to start models.
Use `--rolebox-root /path/to/rolebox` or `ROLEBOX_ROOT` for a local source checkout;
otherwise the adapter requires `rolebox` on PATH. It never installs or fetches a
runtime. A missing CLI is an error, not a successful skipped evaluation.

There is no assumed dollar estimate: model prices and actual usage may be unknown.
Native validate output records case/trial counts; configure repetitions and
timeouts deliberately. A small trial uses a separate one-case suite with
`repetitions: 1`, still with `--action run --confirm`. It is not sufficient
evidence of full behavioral coverage.

Each invocation keeps a unique evidence directory under `--output-dir`, defaulting
to `.rolebox/role-creator-evals` under the current working directory. Put outputs
outside role, fixture and checks directories. It retains command stdout/stderr,
`adapter-result.json`, the native run directory, and native JSON/HTML reports.
Failed and incomplete runs keep their evidence. The native store is authoritative;
the adapter does not reconstruct scores from transcripts.

To report an existing run without inference:

```sh
python3 roles/role-creator/scripts/run_eval.py roles/example-role --suite output-quality --action report --run-dir benchmark-results/eval-ID/runs/RUN_ID --json
```

The adapter returns `0` only for successful static checks or a complete passing
run/report; `1` for complete task failures; `2` for incomplete evidence or missing
confirmation; `130` for cancellation. Native command failures retain their
nonzero code. Report creation alone is not a passing evaluation: missing or
unscored trials remain incomplete even when the native report command succeeds.

## Historical baseline

Native baselines capture completed scored runs. They do not automatically run
the same task without the role:

```sh
rolebox bench baseline set main benchmark-results/eval-ID/runs/RUN_ID
python3 roles/role-creator/scripts/run_eval.py roles/example-role --suite output-quality --action run --confirm --baseline main --json
rolebox bench compare benchmark-results/eval-ID/runs/RUN_ID --baseline main
```

`--baseline` forwards the saved name to native `bench run`; comparison output is
retained in `run.stdout.txt`. Use native `bench compare --format html --output
comparison.html` to export a historical comparison. Comparability depends on
suite identity and recorded execution conditions. Incompatible or unverified
conditions must not be reported as improvement. Baseline creation is explicit;
the adapter never creates or updates one automatically.

## Legacy migration

`evals/evals.json` is a legacy manual rubric reference. Passing it via `--evals`
or `--suite` fails with a migration diagnostic. The old `--spot-check` flag also
fails, including without confirmation. Nested `evals`, weighted expectations,
scenarios and majority-vote scores are **not** native cases and are never silently
translated. Port each intended capability to meaningful native assertions or
workspace checks; retain anything that cannot be automated as a separately
labeled manual evaluation. Native loop integration has known limitations, so
do not infer multi-round state-machine correctness from a simple passing suite.
