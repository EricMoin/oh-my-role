---
name: verify
description: Check local role authoring, real runtime contracts, isolated installation metadata, and opt-in native dsh benchmarks. Report the evidence and limits of each check separately.
---

# Verify

Resolve this role's scripts directory before executing commands. Accept a role path,
target host, optional rolebox checkout, and optional native benchmark suite.

1. Run `check_version.py --rolebox-root <checkout>` when a checkout is supplied;
   otherwise it inspects the installed CLI. Report mismatch or unavailable status.
   Never repair a mismatch merely by changing the catalog's version label.
2. Run `validate_role.py <roleDir> --json`. This is local authoring lint. It checks
   required fields, readable prompts, recursive children, local assets and authoring
   policy. Missing external/global assets are unresolved warnings, not resolved assets.
   Fix errors before deployment. `runtime_contract_verified: false` stays false even
   when the local verdict is PASS.
3. Run the offline tests with `ROLEBOX_ROOT=<checkout> bash self-test.sh` when checking
   role-creator changes against a runtime revision. The real engine tests check loading,
   default functions, executable state conditions and accepted-data transport.
4. Optional Tier 3: when installation checking is authorized, run
   `sync_check.py <roleDir> --target <host> --rolebox-root <checkout> --json`.
   It creates disposable home/config/data directories, a local installation record,
   and a real CLI sync. Require the exact role and target to match, a valid link to the
   staged source, and registration metadata when the host exposes it. This is an
   installation-metadata check, not a running host or skill-loading check. Missing CLI
   is SKIP (exit 2), not PASS. No inference or live-home deployment occurs.
5. Optional Tier 4: use `run_eval.py <roleDir> --suite <suite> --action validate`, then
   `--action doctor`. Explain the case count, repetitions, selected model/provider,
   timeout and any available cost estimate before requesting paid execution. Do not
   invent a token/cost estimate from an unmeasured fixed rate. With user authorization,
   use `--action run --confirm --output-dir <persistent-evidence-parent>`.
   A small suite explicitly declares one case and one repetition for a spot check.
   The native backend supports dsh/self-contained roles; unsupported hosts or unresolved
   dependencies must be reported, not silently substituted.

Use `--action report --run-dir <saved-run>` to read retained results. Optional
`--baseline <name>` compares with a recorded historical baseline; it is not an
experimental without-role control. Legacy rubric JSON requires migration into native
cases/assertions or explicit manual grading. Infrastructure failures are unscored,
and failed/incomplete runs cannot become PASS because a subprocess finished.

## Graph delegation

Use the declaration and report schemas in `references/graph-protocol.md` and
`references/schemas.md`. Every consumer declares `inputs`; revision feedback uses
`when: triggered`. Worker execution tools follow the host matrix. Do not make graders
run before transcripts exist, and do not enable paid execution merely by submitting a
successful validation outcome. The declarer may run the local scripts directly when
a supported graph backend is unavailable.

## Report

Report these independent results:

- Local authoring: PASS/FAIL, errors, unresolved dependencies and checked role path.
- Runtime contract: PASS/FAIL/NOT RUN, rolebox revision and scoped tests performed.
- Installation metadata: PASS/FAIL/SKIP, target, exact role link, registration if known.
- Host activation/skill loading: VERIFIED/UNVERIFIED with actual evidence.
- Behavior: PASS/FAIL/INCOMPLETE/NOT RUN, backend, suite/run identifiers and evidence paths.

A skill's existence, a role's link and a successful model task are different claims.
Only measured cases support behavioral claims; manual state-machine checks must name
which gate/transition/continuation was exercised. Do not call untested functions working.
