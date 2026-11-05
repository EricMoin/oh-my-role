---
name: clarity-check
description: Language-neutral clarity review for technical prose — reader and promise, buried lede, references, actor and action, scope, structure, terminology, ambiguity, completeness, and severity mapping. Load when the problem is comprehension rather than diction.
---

# Clarity Check

## 1. What this pass judges

Diction is not clarity. A sentence can be plain, natural English or Chinese and still fail because
the reader cannot tell what it refers to, what condition applies, or what to do next. This pass asks
one question at every level: can the intended reader act on this without asking a follow-up?

Clarity review may reorder, split, name, and delete. It may not add a fact, a step, a number, or a
decision the text does not contain. When the missing information is factual, report it; do not fill
it in.

## 2. Reader, job, and promise

Before judging a sentence, name three things:

- Reader: who they are, what they know, which language they read.
- Job: the task they came to finish.
- Promise: what the text lets them do that they could not do before.

- ❌ Tokens
- ✅ After this page you can rotate an API token without downtime.

If the promise is missing, the finding is major even when every sentence is grammatical: the reader
cannot tell whether this page is for them or what success looks like.

## 3. Buried lede

The action, result, or decision arrives after context the reader did not ask for.

- ❌ We started with a single team in 2021, then three teams joined, the scripts drifted, and we
  reviewed the options, so the shared pipeline is now the default for deploys.
- ✅ Use the shared pipeline for deploys. It replaced the older scripts, which drifted as three
  teams adopted them.

Move the result or instruction first. Keep the history only if it changes what the reader does.

## 4. Reference

A pronoun or determiner without a recoverable antecedent forces the reader to guess.

- ❌ The worker sends the result to the queue. If it fails, retry it.
- ✅ The worker sends the result to the queue. If the send fails, retry the send.

Watch for: this, that, it, they, the former, the latter, 它, 该, 其, 后者. A reference is acceptable
when the preceding sentence names exactly one candidate; otherwise it is a defect.

- ❌ Set the limit in the config. It must be lower than this.
- ✅ Set `max_workers` in the config. It must be lower than `max_jobs`.

If no candidate can be recovered from the text, the reference is blocking: ask which object is
meant instead of choosing one.

### 4.1 Unearned shorthand

A label, line count, internal project name, or back-reference is shorthand the author earned by
working on the source, not by reading this page. Examples: "the 45-line skill", "the 66-line main
file plus its deep references", "the usual gate". Expand it at first use: what the thing is, what it
covers, and what the reader should do with it. After the expansion the short name is safe.

- ❌ Apply the 45-line checklist skill.
- ✅ Apply the review checklist: 45 lines covering the five passes, from meaning to word choice. Use
  its reference file when a finding needs an example.

Test: could a reader who starts at this page act on it without opening another file? If not, the
shorthand is unearned; expand it once.

## 5. Actor and action

Every instruction or claim should make it clear who does what. Passive voice is not the enemy; a
missing actor is.

- ❌ The cache is cleared before the migration runs.
- ✅ The migration script clears the cache before it runs.
- ✅ The cache was cleared at 03:00 by the maintenance job. (actor named, even in passive)
- ❌ It is recommended to increase the timeout.
- ✅ Increase the timeout to 30 s.

For a warning, the actor is part of the safety: say who must act and who must not.

## 6. Scope: conditions, exceptions, prerequisites

The reader needs to know when a statement applies and when it does not.

- ❌ This works on Linux.
- ✅ This works on Linux 5.15 and later; earlier kernels lack `io_uring` support.
- ❌ Retries stop after the limit.
- ✅ Retries stop after three attempts or 30 s, whichever comes first.

Check for missing if/when/unless/only/except clauses, and for prerequisites stated after the step
that needs them. A condition that limits an instruction is a fact; deleting it for flow is a defect.

## 7. Structure

- Put the main path first; move edge cases below or behind a link.
- Write headings as tasks or questions: "Configure a token", "What happens on timeout?", not
  "Configuration" or "Misc".
- One fact, one home. If the same limit appears on three pages, link to one canonical statement.
- Use a list for steps, options, or parallel items; use prose for reasoning and trade-offs. Do not
  turn a list into a paragraph or a paragraph into fragments.
- Number steps in execution order, and state the expected result for each step that can fail.
- Put recovery next to the step that can fail: symptom, cause, action.

## 8. Terminology

- One concept, one name, across the whole document. Do not alternate token/key/credential, or host/
  node/server, for the same thing.
- Define an acronym or internal term at first use in this document, even if another page defines it.
- Keep the spelling and capitalization of product names and identifiers stable.
- Do not rename a field to make a sentence smoother; the field name is the interface.

Terminology drift is major, not minor: the reader cannot tell whether two names mean two things.

## 9. Ambiguity

Words that hide a missing number, condition, or definition:

| Word | Ask | Fix only with evidence |
|---|---|---|
| may / should | Under what condition? Who decides? | State the condition or keep the hedge |
| support | Which versions, modes, platforms? | Name the supported set |
| fast / slow | Compared with what, measured how? | Give the number and the method |
| several / most / some | How many? Which ones? | Give the count or the rule |
| soon / shortly | When? | Give the time or the trigger |
| automatically | Triggered by what? | Name the trigger |

If the text does not contain the answer, ask. Do not resolve ambiguity by picking the more likely
reading.

## 10. Completeness

The reader can start and finish only when the text supplies:

- A prerequisite for every step that needs one: version, permission, account, file, state.
- A visible result for every step: output, status, state change, or a check.
- A failure path for every step that can fail: symptom, cause, recovery, escalation.
- A next step or a stopping point.

A missing prerequisite or failure path is blocking when the reader would otherwise act wrongly; it
is major when the reader can recover by asking.

## 11. Checklist and severity

Run the checklist in order and record one line per item.

| # | Question | If no |
|---|---|---|
| 1 | Is the reader and job named? | major |
| 2 | Is the promise stated or obvious? | major |
| 3 | Is the result or instruction before the background? | major |
| 4 | Does every it/this/该 resolve to one candidate? | blocking if unrecoverable, else major |
| 5 | Is the actor named where action or responsibility matters? | major |
| 6 | Are conditions, exceptions, and prerequisites stated before use? | blocking if scope changes action, else major |
| 7 | Do headings and order follow the reader's task? | minor |
| 8 | Is one fact in one home? | minor |
| 9 | Is one concept named one way? | major |
| 10 | Is every acronym defined here at first use? | major |
| 11 | Does every vague word hide a number or condition the text should give? | major or blocking |
| 12 | Can the reader verify completion? | major |
| 13 | Is the failure path present where failure is possible? | blocking if unsafe, else major |

## 12. Output

Report clarity findings by location, question number, effect on the reader, and the exact rewrite.
Group findings that share one cause, such as three unresolved references in one paragraph. Do not
report a vague word as clarity when it is really a missing fact: those belong under Unresolved.
