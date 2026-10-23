# Evaluation assets

`evals.json` is retained as a **legacy manual rubric**, not an executable native
benchmark dataset. Its expectations and scenarios have no automatic native
scoring equivalent. `run_eval.py --evals evals.json` now fails with migration
instructions instead of running an unverified harness configuration.

Create an explicit native `suite.yaml` and `cases.jsonl` for the role being tested,
using [the native suite guide](../references/templates/eval-set.md). Start with
static validation; model execution requires `--action run --confirm`. Do not claim
the retained rubric has passed based on an unrelated native smoke suite.
