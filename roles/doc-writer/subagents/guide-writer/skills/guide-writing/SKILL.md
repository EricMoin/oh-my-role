---
name: guide-writing
description: Guide method for task-driven documentation — document types, reader path, structure, README skeleton, command verification, runbook sections, checklist, and anti-patterns. Load before writing a README, quickstart, tutorial, how-to, or runbook.
---

# Guide Writing

## 1. Types

| Type | Reader state | Promise | Not this |
|---|---|---|---|
| Quickstart | Has access, no working setup | First success along the complete verified path | A feature tour |
| Tutorial | Learning by doing | Build one small, complete thing | A reference dump |
| How-to | Knows the basics, has one task | Finish that task without detours | Teaching the whole system |
| Runbook | On call, under pressure | Diagnose and restore a known system | Background reading |
| Concept | Confused by behavior or a boundary | A model that predicts behavior | Step-by-step instructions |
| README | Deciding whether and how to start | What it is, who it serves, how to run it | Full API reference |

Pick one type. A page that tries to be a tutorial and a reference fails at both. Link out instead.

## 2. Reader path

Write the reader's path before the prose:

1. Entry state: what the reader has, knows, and has installed.
2. First action: the smallest command or click that proves the setup works.
3. Build-up: the complete sequence that reaches the promised result.
4. Proof: the observable output or state that means success.
5. Next: one link, not a menu of ten.

Every prerequisite must appear before the step that needs it. If the reader can fail at step two
because of something mentioned at step eight, the order is wrong.

## 3. Structure

Use this shape unless the document type says otherwise:

1. Promise: what the reader can do at the end.
2. Prerequisites: versions, accounts, permissions, files, prior state.
3. Steps: numbered, one action each, with the command and expected output.
4. Expected result: the state or output that proves success.
5. Failure and recovery: the two or three likely failures and how to get back on track.
6. Next: one verified follow-up.

Rules:

- One action per step. A step that says "configure the database and run the migration" is two
  steps.
- Put the command in a copyable block and state the directory it runs from.
- Show the expected output immediately after the command. Real output, trimmed only at obvious
  noise.
- Keep alternatives out of the main path. Put them in a note or a separate page.
- Do not explain internals in the middle of a procedure. Link to the concept page.
- Do not omit a prerequisite, platform note, or recovery step to shorten the page.

## 4. README skeleton

A project README answers, in this order:

```text
# Project name
One sentence: what it does and who it is for.
## Requirements
Runtime, package manager, versions, platform limits.
## Install
The verified install command.
## Quick start
The smallest complete usage that produces a visible result.
## Configuration
The required settings table; link to the full reference.
## Common tasks
Two or three verified commands for routine work.
## Documentation
Links to guides, reference, and examples.
## Contributing
How to run tests and checks; link to contribution rules.
## License
The actual license.
```

Do not put badges where a sentence should explain the project. Do not claim support that the
repository does not test.

## 5. Command verification

- Run each command from the documented starting state, not from your shell's accumulated state.
- Use a disposable directory, container, or clean checkout when the command writes files.
- Record the exact command, working directory, platform, version, and actual output.
- Check that a documented flag still exists in the current CLI help.
- Check the failure message a reader sees when a prerequisite is missing.
- Test the reset path: after a failed step, can the reader follow the recovery instructions?
- Note platform differences explicitly: shell, path separator, package manager, permissions.
- If a command needs credentials, network, or a paid service you do not have, mark it unverified and
  state what was checked instead.

## 6. Runbook sections

A runbook is read by someone whose system is failing. Optimize for speed and certainty:

1. Trigger: the alert or symptom that means "use this runbook".
2. Impact: what is broken, who is affected, and what is still working.
3. Permissions and access: accounts, roles, dashboards, and who can grant them.
4. Diagnose: commands or queries in order, each with a reading that narrows the cause.
5. Act: the smallest safe operation that restores service; state reversibility.
6. Verify: the check that proves service recovered, not just that the command exited zero.
7. Roll back: how to undo the action and when rollback is safer than continuing.
8. Escalate: who to contact, with what evidence, when the runbook runs out.

Runbook rules:

- Put the command before the explanation.
- Use exact names: service, dashboard, queue, table, flag.
- Give thresholds and expected values, not "check that it looks healthy".
- Never hide a destructive step inside a numbered happy path; mark it and state its blast radius.
- Date the runbook and note the system version it was validated against.

## 7. Checklist

- [ ] The document type matches the reader's job.
- [ ] The promise is stated first and is achievable through the steps.
- [ ] Every prerequisite appears before it is needed.
- [ ] Every command was run, with its output recorded.
- [ ] Each step has one action and an expected result.
- [ ] Success is observable; recovery covers the likely failures.
- [ ] Platform differences and untested paths are explicit.
- [ ] One next step, verified.
- [ ] Headings read as tasks; the page can be skimmed in order.

## 8. Anti-patterns

- "Getting started" that starts with architecture instead of a first result.
- Commands with no working directory, no output, and no version.
- A step that assumes an earlier page was read.
- Copying the full option list into a tutorial.
- Screenshots of terminal output instead of copyable text.
- "Simply", "just", "obviously" on a step that requires privileges or a specific platform.
- Recovery described as "fix the error".
- A runbook with no rollback, no escalation, and no validation date.
- README claims about platforms or versions that CI does not test.
- Ending with ten "next steps" instead of one.
