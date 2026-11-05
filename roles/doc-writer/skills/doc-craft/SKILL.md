---
name: doc-craft
description: Reader-job method for technical documentation — classify the document, gather evidence, structure and phrase the text, verify examples, and review for accuracy and concision. Load before drafting or reviewing any documentation.
---

# Doc Craft

## 1. A document is a promise to a reader with a job

Every document promises a specific reader that they can finish a specific task. If you cannot
name the reader and the task, you are not ready to write.

- Write the promise first: "After this page you can deploy the service and confirm it is healthy."
- Every paragraph pays rent. Delete it and ask what the reader can no longer do. If nothing is
  lost, the paragraph stays deleted.
- A document that cannot keep its promise must change the promise, narrow the scope, or mark the
  gap. It must not bluff.
- Documentation debt is a real defect: a stale command or a wrong field costs more than missing
  prose, because the reader trusts it.

## 2. Reader and job taxonomy

| Job | Reader's question | Shape | Verification question |
|---|---|---|---|
| learn | "How does this workflow fit together?" | tutorial with a buildable result | Did the reader produce the promised artifact? |
| do | "How do I finish this task now?" | quickstart or how-to, numbered steps | Can the reader start from the stated state and reach the result? |
| look up | "What is this field, code, or option?" | reference entry, table, schema | Is the answer findable in one scan and exact? |
| understand | "Why does it work this way?" | concept page with a model and boundaries | Can the reader predict behavior in a new case? |
| decide | "Why was this chosen, and what did it cost?" | ADR or decision record | Are context, alternatives, and consequences explicit? |
| upgrade | "What changes for me, and how do I move?" | release notes or upgrade guide | Can the reader identify impact and verify the new state? |

Rules for the table:

- Give each document one primary job. A tutorial may link to reference; it must not become one.
- A mixed page splits by job: "do" steps stay short, "understand" moves to a concept page.
- The verification question is a test, not a slogan. Answer it before delivery.
- A runbook is a "do" document written for a stressed reader: commands, checks, and rollback in
  execution order.

## 3. Evidence ladder

Use the strongest evidence available and record the rung:

1. Ran the command or exercised the API and saw the result.
2. Read the implementation, tests, types, and schemas.
3. Read configuration, manifests, migrations, and git history.
4. Asked the user for a fact only they can supply.
5. Marked the fact unknown.

Common evidence failures:

- "It should work" — assumption, not evidence. Run it or mark it unverified.
- Copying an older page — the old page is a claim, not a source.
- A schema table typed by hand — check it against the schema file.
- A command that ran once on another platform — record the platform or say it is untested there.

Unknown facts stay visible. A visible gap is honest; a confident invention is a defect.

## 4. Structure

- Lead with the result. State what the reader gets before the background.
- One fact, one home. Link to the canonical page instead of copying its table.
- Expand on demand: put the common path first, edge cases and reference detail below or behind a
  link.
- Write headings as tasks or questions: "Configure the token", "What happens on timeout?" — not
  "Configuration" or "Misc".
- Order steps by the reader's path, not by the code's module layout.
- State prerequisites before step one: version, permissions, accounts, files, prior state.
- Make examples runnable. Show the command, the expected output, and the state it assumes.
- Keep procedure numbering honest. If a step can be skipped, say when.
- Put the failure path next to the step that can fail: symptom, cause, recovery.

## 5. Sentences and words

- Plain words: use, start, stop, send, check. Replace utilize, leverage, facilitate, initiate.
- Active voice: "The worker retries the request", not "the request is retried by the worker".
- Concrete nouns: name the file, field, status code, or limit. "Configure the timeout" beats
  "adjust the settings appropriately".
- Vary sentence length. Split a sentence when it carries more than one idea or condition and the
  reader would lose the thread; do not split to hit a word count. A longer sentence that keeps one
  condition intact is clearer than three fragments.
- One term per concept for the whole document. Do not alternate "token", "key", and "credential"
  for the same thing.
- Keep identifiers, commands, flags, and paths exactly as the system uses them.
- Cut filler and hedging: simply, basically, just, note that, it is worth mentioning, as you can
  see, in order to.
- Cut marketing adjectives: powerful, seamless, robust, comprehensive, world-class.
- Chinese prose: write short clauses in active voice; avoid 翻译腔 such as stacked 的, overused
  被, and "进行/实现/作出" noun padding. Keep identifiers in English.
- Do not alternate languages for the same concept; keep only identifiers, commands, and standard technical terms in English.

### 5.1 Necessary length

Short is the default, not the target. A sentence or passage is the right length when the reader can
act on it without asking a follow-up, guessing a condition, or risking a wrong action. Deleting
filler is always allowed; deleting content the reader needs is a factual edit.

The numbers, service names, and commands in these comparisons are illustrative; replace them with
the project's verified values.

Necessary length includes:

- conditions and exceptions that limit when the instruction applies;
- prerequisites, including order and prior state;
- failure and recovery steps;
- trade-offs and limitations;
- stated uncertainty;
- security or legal wording;
- the rationale for a non-obvious choice;
- examples that prevent a wrong action.

Before shortening, check what would disappear. The comparisons below show the shape: the short
version is not wrong because it is short, but because the reader cannot act on it.

#### Safety warning

Too short: "Do not run the migration against the primary database."

Necessary: "Do not run the migration against the primary database. It holds the only copy of the
rows the migration rewrites, and a failed run leaves the table half-migrated. Run it against the
replica, check the row count, then promote the replica; if the count differs, stop and restore from
the snapshot."

What survives: the prohibition, why the primary is unsafe, the failure mode, the safe sequence, the
verification, and the recovery. The short version keeps the prohibition but not the knowledge
needed to obey it.

#### Migration step

Too short: "Add the new column before backfilling."

Necessary: "Add the `region` column as nullable before backfilling. The running API writes rows
without `region`, so a `NOT NULL` column fails every insert until the backfill finishes. After the
backfill, set `NOT NULL` and add the default; if the backfill is interrupted, resume from the last
`id` instead of restarting, or the rows already written will be skipped."

What survives: the order, the nullability, the reason tied to live writes, the two-phase constraint
change, and the resume rule.

#### Design rationale

Too short: "We chose an idempotency key over a deduplication job."

Necessary: "We chose an idempotency key over a deduplication job because the job only saw duplicates
after they were stored, so a retried payment could be charged twice before the job ran. The key is
checked in the same transaction as the write, so a retry returns the first result. The cost is that
every client must generate and keep the key until the response is confirmed; a client that loses
the key cannot safely retry."

What survives: the rejected alternative, the failure it caused, the mechanism that fixes it, and the
new client obligation. The short version records the choice but not the reason a future maintainer
needs to keep it.

The same test applies in Chinese: 短句是默认，不是目标；条件、例外和恢复步骤可能需要更长的句子。

## 6. Review checklist

Run two passes: a fact pass and a reader pass. Do not merge them.

Accuracy:

- Every command, flag, field, status code, default, version, and date is checked against an
  authoritative source.
- Every claim matches the current code or running behavior, not a previous release.
- Every "known issue" is still open.

Completeness:

- The stated reader can start without a missing prerequisite.
- Every step has an expected result.
- Every failure named in the task has a recovery or an escalation path.

Order:

- Prerequisites precede the step that needs them.
- The first success is reachable before optional material.
- Cross-references point forward, not in circles.

Examples:

- Examples are runnable, complete, and use real values.
- Output shown is actual output, not invented output.
- Error examples use real error codes and messages.

Links:

- Every link resolves and points to the intended target.
- Links are not used as a substitute for a fact the page should state.

Terminology and tone:

- One term per concept; no synonym drift.
- Tone matches the document type; no marketing in a runbook, no jokes in an incident guide.
- Language matches the reader; Chinese is natural Chinese, English is plain English.

Length:

- No paragraph repeats an earlier one.
- No section exists only to summarize the section above.
- The page is as short as the promise allows, and no shorter.

## 7. Anti-patterns

- Restating the code: a comment or sentence that paraphrases the next line adds nothing.
- Empty opening: "In today's fast-paced world" or "Documentation is important." Start with the
  promise.
- Missing prerequisites: the reader hits an error at step three because a token was never
  mentioned.
- Stale commands: a flag removed two releases ago, presented as current.
- Screenshots without a caption, alt text, or explanation of what to notice.
- AI voice: "delve", "seamless", "comprehensive guide", rule-of-three padding, and a summary that
  repeats the introduction.
- Duplicate truth: the same table on three pages, drifting apart.
- Reference by memory: "the usual port" instead of the actual default.
- Wall of text: a dozen paragraphs without headings or a decision point.
- Fake precision: "typically", "usually", "should" where the behavior is deterministic and known.
- Hidden gap: omitting the one unsupported platform instead of saying it is unsupported.
- Label-only summary: a list of terms or line counts that assumes the reader saw the source; expand
  each label once.

## 8. Handoff

A domain writer returns four parts: the draft or findings; evidence for each claim; unverified
facts and why; open questions for the lead or user. The lead integrates, resolves conflicts, and
owns the final tone. A worker node never addresses the user directly and never presents an
unverified claim as settled.
