---
name: verification-discipline
description: Select scoped checks and record actual verification outcomes for Emperor execution reports
---
# Verification discipline

Read repository instructions and the task's verification array before choosing
commands. Respect the repository's runtime, module slices and forbidden full-suite
commands. Do not infer npm just because package.json exists.

Code: run applicable diagnostics/type checks and relevant existing tests. Docs:
validate structure, links and examples. Configuration/infrastructure: use the
available parser, validator or authorized dry-run. Research: record sources and
which claims they establish. Do not run mutating verification without authorization.

Each check records id, command, scope, status, exit_code and summary. Status is
passed, failed, not_run, unavailable or not_applicable. Only actual successful
execution establishes passed. Unavailable tools and not_run checks cannot satisfy
required acceptance. not_applicable needs a reason and may only exempt a genuinely
irrelevant check, never a failed check.

Keep verification scoped. Revisions require affected callers and integration paths
to be checked as well as the immediate fix. Report the cumulative changed-file set
so Validator can independently check regressions in previously passing work.
