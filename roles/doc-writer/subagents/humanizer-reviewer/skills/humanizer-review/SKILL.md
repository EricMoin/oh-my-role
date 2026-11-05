---
name: humanizer-review
description: Core review method for technical prose — what natural means, the meaning-first pass order, the defect taxonomy with examples, severity and verdict rules, the fact ledger, and rewrite discipline. Load before reviewing any prose.
---

# Humanizer Review

## 1. What "natural" means here

Natural technical prose is specific, active, rhythmic, honest, and economical.

- Specific: it names the object, file, number, or condition instead of "various factors".
- Active: a person, service, or component does something to something.
- Rhythmic: lengths vary, and each sentence carries one idea.
- Honest: uncertainty is stated once, at the strength the evidence supports.
- Economical: every clause earns its place; deleting it would lose something.

Natural is not slang, filler, or a performed personality. Text does not become human by adding "I",
a joke, or a confession; it becomes human by saying what is true in the order the reader needs it.

The goal is not to defeat an AI-text detector. Detectors are unreliable; the target is that the intended reader understands once and can act.

### 1.1 Necessary length is not verbosity

Short is a default, not a target. A passage is too long when a clause does not help the reader act;
it is not too long because it carries more than one condition. Necessary length includes conditions,
exceptions, prerequisites, failure and recovery, trade-offs, uncertainty, security or legal wording,
the rationale for a non-obvious choice, and examples that prevent a wrong action. Removing any of
these is a factual edit, not a tightening.

The comparison is always the same: the short version is not wrong for being short; it is wrong
because the reader cannot act on it.

The numbers, service names, and commands in these comparisons are illustrative; replace them with
verified project values.

#### Safety warning

Too short: "Never log tokens."

Necessary: "Never log access tokens. Every team with log access can read them, and a logged token
stays valid until it is rotated. If one reaches a log, rotate it and delete the line; deleting the
line alone does not revoke it."

What survives: who can read the log, why deletion is not enough, and the recovery action. Length is
what makes the warning usable.

#### API error

Too short: "On 409, retry."

Necessary: "On `409 Conflict`, retry only after re-reading the resource. The conflict means another
writer changed it; retrying with the old body repeats the rejected update. Back off for 1 s, re-read,
merge the change, and retry once; a second 409 returns to the caller."

What survives: the status code, the cause, the precondition for retry, the backoff, the merge, and
the retry limit.

#### Migration

Too short: "Stop the writer, then migrate."

Necessary: "Stop the `events-writer` and confirm `systemctl is-active events-writer` prints
`inactive` before starting. Rows written during the copy land only in the old table, so the
post-migration count check fails; if the migration fails, restart the writer before retrying."

What survives: the exact service, the stop check, the failure symptom, and the recovery order.

#### Design rationale

Too short: "We use cursor pagination."

Necessary: "We use cursor pagination because offset pagination re-scans every skipped row: at two
million events, page 10,000 took 4.2 s and returned duplicates when new events arrived mid-scan. A
cursor stores the position, so later pages cost the same as the first and do not repeat rows. Clients
cannot jump to an arbitrary page, and the cursor expires after 15 minutes."

What survives: the rejected alternative, the measured failure, the mechanism, and the two costs
accepted with the choice.

#### Uncertainty

Too short: "The cache reduces p95 latency."

Necessary: "The cache reduced p95 latency from 310 ms to 120 ms in one region over a 24-hour test. We
have not tested write-heavy traffic, and the gain may not hold when the working set exceeds the
cache."

What survives: the measurement, its scope, the untested condition, and the hedge the evidence
supports.

#### Conditional configuration

Too short: "Set `verify_tls` to true."

Necessary: "Set `verify_tls` to true when the client connects to a public endpoint. Set it to false
only for the local test harness, whose self-signed certificate has no CA chain; in production, false
lets any intermediary impersonate the server."

What survives: the default, the exception, the reason for the exception, and the risk of widening
it. A shorter sentence would drop the condition that keeps the setting safe.

## 2. Review order

Five passes, the most disruptive change last; do not skip to words while meaning is open.

| Pass | Question | Allowed to change |
|---|---|---|
| 1 Meaning | What is this sentence trying to say? | Nothing. If unclear, ask. |
| 2 Facts | Which fact, number, unit, condition, identifier does it carry? | Nothing. Record it. |
| 3 Structure | Is the point in the right place, and findable? | Paragraphs, headings, lists. |
| 4 Sentence | Who acts, what happens, how many ideas per sentence? | Voice, clause order, splits. |
| 5 Word | Is this the exact word, with no filler or marketing? | Diction only. |

- The order is causal: a word fix on a misread sentence creates a new error; structure before
  sentence, sentence before word. Moving a paragraph removes five awkward sentences.
- If meaning or facts are unresolved, stop. A clean guess is worse than an open question.

## 3. Defect taxonomy

Examples are invented illustrations of the shape of a fix; a real finding quotes the actual sentence.

### 3.1 AI-slop vocabulary

Words that signal polish without content: seamless, robust, comprehensive, leverage, utilize, facilitate, delve, elevate, cutting-edge, best-in-class.

- ❌ This comprehensive guide delves into the robust, seamless pipeline.
- ✅ This guide explains how the pipeline schedules jobs.
- ❌ We leverage a cutting-edge mechanism to facilitate data movement.
- ✅ The importer copies rows from the upload bucket into the warehouse.

The fix is not a shorter synonym: name the behavior the adjective was standing in for.

### 3.2 Empty abstraction

- ❌ The system handles various operations efficiently.
- ✅ The worker retries a failed upload three times, then writes the job to the dead-letter queue.
- ❌ Performance is improved through optimizations.
- ✅ The query planner reuses a cached plan for repeated queries.

Can the reader point at the object, the action, and the result? If not, nothing has been said.

### 3.3 Nominalization

Nouns built from verbs push the action away: implementation, utilization, verification, configuration.

- ❌ The implementation of retry logic requires the configuration of a backoff value.
- ✅ To retry a request, set `backoff_ms` in the job spec.
- ❌ The utilization of the cache reduces the frequency of database queries.
- ✅ The cache answers repeated reads without touching the database.

Replace the noun with its verb, and restore the actor it swallowed: "we configured" beats "the configuration was performed".

### 3.4 Hedging and false certainty

Stacked hedges (may possibly, might perhaps, could potentially) and unmarked certainty (always, never fails, guarantees) are one error in two directions: the sentence does not match evidence.

- ❌ It is important to note that the flag may possibly be required in some cases.
- ✅ Set the flag when the service starts in strict mode.
- ❌ The client always reconnects within five seconds.
- ✅ The client reconnects within five seconds in the soak test.

The second pair works only if the measurement exists. Otherwise the finding is "the claim has no evidence", not "soften the sentence". Never delete a real hedge: "may fail on ARM" stays uncertain until someone tests it.

### 3.5 Meta-commentary and filler

- ❌ In this section, we will take a look at how retries work.
- ✅ (delete it and start with the retry behavior)
- ❌ It is important to note that the cache expires after 10 minutes.
- ✅ The cache expires after 10 minutes.

Also delete simply, basically, just, obviously, needless to say, and notes about the text itself.
Do not write provenance or context hints such as "this is not a research finding, I added it
myself" or "as mentioned earlier"; say directly what was added or where it is defined.

### 3.6 Structural defects

Buried lede: the instruction arrives after history and caveats.
- ❌ After the service grew from one team to three, the deploy process drifted, so we recommend the shared pipeline now.
- ✅ Use the shared pipeline for all deploys. The older scripts drifted as three teams adopted them.

Missing actor: a passive hides who is responsible.
- ❌ The configuration is applied on restart.
- ✅ The service applies the configuration on restart.

Unclear reference: this, that, it, 它, 该 with no recoverable antecedent.
- ❌ The worker sends the job to the queue. It retries it if this fails.
- ✅ The worker sends the job to the queue. If the send fails, the worker retries the job.

Terminology drift: one concept, several names.
- ❌ Set the token. The API key must be at least 32 characters. Pass the credential in the header.
- ✅ Set the token. The token must be at least 32 characters. Pass the token in the header.

Overlong sentence: conditions, exceptions, and results in one breath.
- ❌ When the queue is full and the worker has not acknowledged the job within the lease window it is requeued unless the retry limit is reached, in which case it is discarded.
- ✅ When the queue is full, wait for the lease window. If the job is still unacknowledged and under the retry limit, requeue it; otherwise discard it.

### 3.7 Tone mismatch

- ❌ Runbook: Our world-class deploy pipeline makes shipping a delight — push and watch the magic.
- ✅ Runbook: Push the branch; the pipeline builds and deploys it to staging.
- ❌ UI error: Oops! Something went terribly wrong on our end, sorry about that!
- ✅ UI error: Request failed. Retry, or send the request ID to support.

Register must match the moment: a reader in an incident needs commands and checks, not encouragement.

### 3.8 Redundancy and repeated summary

- ❌ The CLI is fast, reliable, and secure.
- ✅ The CLI returns a cached result in under 50 ms.
- ❌ In summary, this section covered retries, timeouts, and backoff.
- ✅ (delete; the section already said it)

Keep three adjectives only when the page supports all three; otherwise keep the supported claim and report the others as unsupported claims, not as style.

### 3.9 Compressed reference / label-only summary

A label, line count, or internal name replaces the explanation the reader needs, on the assumption
that the reader saw the source.

- ❌ 按调研：删 filler、反 AI-slop、plain language。
- ✅ 根据调研笔记，改写包含三件事：删掉没有信息的 filler（"众所周知"、"值得注意的是"）；把 AI-slop
  词换成它描述的具体行为（"无缝"→"不需要重启"）；把 plain language 当作"读一遍就能行动"，而不是
  "句子越短越好"。

The fix expands each label once with a definition, one example, and what to replace it with. The
test: can a reader who did not see the source act on this? If not, the passage is compressed past
usefulness, and shorter is not clearer.

## 4. Severity and verdict

| Severity | Test | Render |
|---|---|---|
| blocking | Changes or hides a fact, condition, or obligation; leads to a wrong action. | Do not ship as written. |
| major | Clearly machine-made or translated; slows comprehension or damages trust. | Fix before delivery. |
| minor | Wordiness, rhythm, repeated summary, filler; meaning already clear. | Fix while editing. |
| suggestion | Taste about word choice, punctuation, layout. | Author decides. |

- PASS: no blocking or major findings remain.
- REVISE: blocking or major findings are local; targeted edits are enough.
- REWRITE: the same defect runs through most of the text; meaning is still recoverable.

A verdict measures consequence, not volume: ten comma preferences do not make a REWRITE, and one wrong number does not become a suggestion because the sentence around it is elegant.

## 5. Rewrite discipline

- Make the smallest edit that fixes the finding; leave adjacent clear text alone.
- Keep the author's voice and do not homogenize: short declaratives stay short, and two correct sentences may be built differently.
- Do not replace a precise term with a vague simple word; keep the term unless the simple phrase is equally exact.
- One idea per sentence. When two clauses fight, split them instead of inserting a semicolon.
- Say it aloud: if it cannot be said in one breath, it is probably two sentences.
- Prefer concrete verbs over "is" plus an abstract noun: "the worker retries" beats "a retry is performed by the worker".
- Do not add an example, number, or metaphor to make a sentence livelier. Ask for evidence.
- Re-read the rewrite without the original; it must stand alone, not only in contrast.

## 6. Fact ledger

Build the ledger before rewriting and check it after. Every row must survive.

| Kind | Capture | Failure mode |
|---|---|---|
| Name | product, service, command, flag, field, file | renaming or dropping |
| Number | version, limit, timeout, size, count | 30 s becomes 30 ms |
| Unit | ms, s, MiB, requests/min, percent | unit silently dropped |
| Command | full command, arguments, directory | a "cleanup" breaks it |
| Path | repository or system path | rewrite points at another file |
| Condition | if, when, unless, only after | scope quietly widens |
| Trade-off | cost, risk, limitation, reason | negative fact deleted |
| Uncertainty | may, experimental, not verified | hedge upgraded or removed |
| Identifier | API name, error string, code symbol | spelling or case changed |

Write one row per fact with the original fragment, then walk the table after the rewrite. A changed number, unit, or condition is a factual edit: revert it or cite evidence.

## 7. Output contract

- Verdict and scope first: one-line verdict, then paths, lines, languages, and what was not reviewed.
- Findings table: location, severity, category, effect on the reader, ready-to-paste rewrite.
- Fact ledger: extracted facts and their status after review.
- Unresolved: what the text cannot answer; "none" when empty.
- No process diary: do not narrate passes or count the edits you considered.

## 8. False positives and stop rules

Do not flag identifiers, commands, paths, versions, code, deliberate scanning repetition, necessary
legal or security wording, clear non-native prose, or a passive whose actor is unknown or irrelevant.

Stop and ask when:

- the meaning is ambiguous and different readings lead to different actions;
- two passages contradict each other;
- the fix would require a fact, example, or number the text does not contain;
- a term has no equivalent and simplifying it would change the claim;
- the request is to "make it sound human" without saying what the text must help the reader do.

Never answer a stop rule by inventing the missing content. Report the gap and keep the original sentence.
