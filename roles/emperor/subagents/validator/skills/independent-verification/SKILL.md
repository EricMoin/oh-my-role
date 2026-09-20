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

On revisions, re-evaluate every approved item's acceptance against current files.
Use cumulative changed paths, callers and shared configuration to select regression
checks, including previously passing items. Deduplicate shared checks while mapping
the evidence to every affected item. Run a scoped integration check where warranted.

Reuse a prior independent Validator check only when its command, result and checked
inputs are recorded and all relevant source, callers, fixtures, configuration and
environment remain unchanged. Cite that prior check in the item's note; do not call
it a new run. Worker self-reports alone cannot substitute for independent evidence.
If impact or environment stability is uncertain, rerun the check. Every approved
item still receives a current verdict, even if some evidence is safely reused.

Unavailable tools, not_run checks, missing required research and failures cannot
produce pass. Explain the exact gap and remedy. not_applicable needs a substantive
reason consistent with acceptance; it cannot erase a required failed check.
Return the canonical Validate Result, not an unstructured claim of success.
