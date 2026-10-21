---
name: verification-discipline
description: Select scoped checks and record actual verification outcomes for Emperor execution reports
---
# Verification discipline

Read repository instructions and the task's verification array before choosing
commands. Respect the repository's runtime, module slices and forbidden full-suite
commands. Do not infer npm just because package.json exists.

Discover checks from repository instructions, package scripts, lockfiles, build
configuration and CI. If a preferred diagnostic tool is unavailable, use the
repository's equivalent scoped compiler/linter/test command and explain coverage.
If no equivalent establishes a required condition, record unavailable/incomplete;
do not install tooling, change configuration or broaden permissions just to get green.

Code: run applicable diagnostics/type checks and relevant existing tests. Docs:
validate structure, links and examples. Configuration/infrastructure: use the
available parser, validator or authorized dry-run. Research: record sources and
which claims they establish. Do not run mutating verification without authorization.

Each check records id, command, scope, status, exit_code and summary. Status is
passed, failed, not_run, unavailable or not_applicable. Only actual successful
execution establishes passed. Unavailable tools and not_run checks cannot satisfy
required acceptance. not_applicable needs a reason and may only exempt a genuinely
irrelevant check, never a failed check.

Keep verification scoped and proportional to write_scope. Your mandatory set is the
subtask verification array: the narrowest command that establishes the condition for
your changed paths and their direct callers. A whole-project typecheck or full test
suite needs a concrete reason: an explicit repository gate, user request or broad
impact established through affected code/configuration. Assign it once, not once per
node. Prefer a selected case/file/package command; do not expand just to finish a task.
Documentation, configuration and comment-only changes run the checks their own scope
requires and no compiler gate.

Revisions require affected callers and integration paths to be checked as well as the
immediate fix. Report changed paths and relevant shared inputs so later workers can
select affected regression checks. After editing a checked file or one of its inputs,
rerun the affected checks; an earlier pass is stale. Avoid identical
reruns after unrelated changes when inputs and dependencies are demonstrably
unchanged; cite the original accepted graph/node/check with reused_from and explain
freshness in summary. Reused passed results refer to the original run, never a new one.
Do not repeat a nondeterministic check to obtain a pass; follow the bounded flakiness
protocol in graph-protocol.md.
