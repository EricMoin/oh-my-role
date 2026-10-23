---
name: role-creator-verification
description: Verify rolebox role authoring, runtime contracts, isolated installation metadata and opt-in native dsh benchmarks without overstating evidence.
---

# Verification

| Check | Execution | Supported claim |
|---|---|---|
| Tier 1+2 | `validate_role.py <roleDir> --json` | Local authoring validity; unresolved external assets remain warnings |
| Runtime contract | `ROLEBOX_ROOT=<checkout> bash self-test.sh` | Actual loader/resolver and graph semantics covered by offline regression tests |
| Tier 3 | `sync_check.py <roleDir> --target <host> --json` | Disposable CLI installation and exact role symlink metadata |
| Tier 4 | `run_eval.py <roleDir> --suite <suite> --action run --confirm` | Native dsh benchmark results for the measured cases |

Run authoring checks after creating or changing a role. They recurse through inline
and file children, validate local prompts/assets and apply creator authoring policy.
A PASS with unresolved external assets is not proof the host can load those assets.
It never establishes behavioral correctness.

For runtime contracts set `ROLEBOX_ROOT` to a local rolebox source checkout with its
Bun dependencies installed. CI uses `tests/rolebox-revision.txt`. Update the pin only
after tests pass against the new source. Version equality alone is insufficient.

Tier 3 creates disposable home/config/data directories, installs a local lock record,
runs CLI sync, and checks the requested role and host. It does not start the host,
verify skill symlinks, authenticate a provider or prove role activation. Registration
may be unknown on hosts that cannot expose it. CLI absence is SKIP with exit 2.
Use existing authorization to test installation; otherwise ask before this optional check.

Tier 4 uses rolebox's native benchmark runner. First use `--action validate` and
`--action doctor`, neither of which calls a model. Model execution requires explicit
user authorization and `--action run --confirm`. Explain cases, repetitions, route
and timeout; report cost as unknown when no reliable estimate exists. A spot check is
a suite containing one case and one repetition. Evidence is retained in the output
parent; failed or incomplete execution stays failed/unscored. The current backend is
dsh and requires a self-contained role. Do not silently replace an unsupported host.

`--baseline <name>` is a historical comparison, not paired with/without-role evaluation.
The old `evals.json` format is a manual rubric; migrate explicit assertions or trusted
workspace checks into `suite.yaml`/`cases.jsonl`. Never turn natural-language rubric
sentences into automatic passing scores. See `references/templates/eval-set.md`.

Always distinguish file resolution, installation metadata, host activation, and measured
behavior. Report unperformed checks as NOT RUN or UNVERIFIED. Only specific exercised
gates, transitions, loops and scenarios justify claims that those behaviors work.
