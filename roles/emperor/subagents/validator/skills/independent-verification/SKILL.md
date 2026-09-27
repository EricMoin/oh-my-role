---
name: independent-verification
description: Independently verify current workspace acceptance and regression coverage after Emperor execution or revision
---
# Independent verification

Read repository instructions first. Use the supplied verification plan and installed
runtime. Respect module slices and explicit bans on full test suites. Do not choose
npm or run all tests solely from the presence of package.json.
Find supported commands in repository scripts, lockfiles, build configuration and
CI. An equivalent scoped check may replace a missing preferred tool only when it
establishes the same condition; document the substitution and remaining gaps.

Inspect actual changes, then independently execute required relevant checks. Confirm
command scope and exit status. Inspect claimed structural results directly. No file
editing, auto-fix linting, deployments or unrelated commands during verification.

Give every approved item a current verdict on every round. Use cumulative changed
paths, callers and shared configuration to select checks. Deduplicate shared checks
while mapping the evidence to every affected item. Run a scoped integration check
where warranted.

Each item declares a basis of rerun or carried, following graph-protocol.md. Reuse a
prior independent Validator check only when its command, resolved tool path, reported
tool version, exit code, input digest and graph/node/check identity are recorded, its
recorded exit code is 0 and the prior Validate Result marked that item pass, and every
path in its check input set is provably outside the changed-path set. Cite that prior
check in carried_from; do not call it a new run. Recompute the workspace and
check-input digests yourself; a recomputed digest that differs from the recorded one, a
missing record, an input set you cannot enumerate or an uncertain impact forces a rerun
with a one-line rerun_reason.

A disposable worker sandbox is not a changed input. Differences in HOME, TMPDIR,
scratch-copy location, session identity, prompt text, step count or tool path do not
make a check's inputs unstable and are NOT by themselves a reason to rerun a check; a
changed tool version is a changed input and forces a rerun. The stable inputs are the
source, callers, fixtures, dependency manifests, lockfiles and configuration inside
the repository. Worker self-reports alone cannot substitute for independent evidence.

Unavailable tools, not_run checks, missing required research and failures cannot
produce pass. Explain the exact gap and remedy. not_applicable needs a substantive
reason consistent with acceptance; it cannot erase a required failed check. Repeat a
nondeterministic check only under the bounded flakiness protocol in graph-protocol.md;
repetition measures a failure, it never obtains a pass.
Return the canonical Validate Result, not an unstructured claim of success.
