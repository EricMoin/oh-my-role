---
name: en-naturalness
description: English naturalness pass for technical prose — AI-slop vocabulary, nominalization, passive and modifier stacks, throat-clearing, hedging, meta-commentary, rhythm, before/after examples, and false positives. Load when reviewing English paragraphs.
---

# English Naturalness

## 1. What this pass judges

This pass covers English paragraphs. The question is not "is the grammar correct?" but "would an
experienced engineer write it this way, and does the reader get the point on the first pass?"

- Change expression, never fact, number, condition, or identifier.
- A plain sentence is not a defect. Vary rhythm only where the text is genuinely monotonous.
- Do not import a voice from another document. The author's register stays.

## 2. AI-slop vocabulary

Words that signal effort without content: delve, seamless, robust, leverage, utilize, facilitate,
comprehensive, cutting-edge, game-changing, best-in-class, holistic, elevate.

Also strip these phrases outright:

- In today's fast-paced world...
- It's important to note that...
- It's worth mentioning that...
- Hope this helps!
- Let's dive in.
- Not only ... but also ... twice for one point, when one clause would do.
- Rule-of-three padding: three adjectives or examples where one carries the claim.

Replacements are not synonyms from a shorter list. Say what the thing does:

- ❌ This comprehensive guide delves into the platform's capabilities.
- ✅ This guide explains what the platform can do.
- ❌ The service seamlessly handles retries.
- ✅ The service retries failed requests.
- ❌ We utilize caching to facilitate faster reads.
- ✅ We cache reads so repeated requests skip the database.

## 3. Nominalization

A verb turned into a noun pushes the action away from the actor and adds prepositions.

- ❌ The implementation of the retry policy requires the configuration of a timeout.
- ✅ To add the retry policy, set a timeout.
- ❌ We performed an analysis of the logs.
- ✅ We analyzed the logs.
- ❌ The team made a decision to deprecate the endpoint.
- ✅ The team decided to deprecate the endpoint.

Watch for: implementation, configuration, verification, utilization, optimization, analysis,
decision, provision. If the sentence has "of" after one of these, try the verb form.

## 4. Passive voice

Passive is correct when the actor is unknown, irrelevant, or deliberately unnamed. It is a defect
when it hides who is responsible for an action the reader must take or trust.

- ❌ The request is validated by the gateway, and then it is forwarded by the proxy.
- ✅ The gateway validates the request, then the proxy forwards it.
- ✅ The certificate was rotated at 02:00. (actor unknown or irrelevant; keep the passive)
- ❌ The configuration must be updated before the service is restarted by the operator.
- ✅ The operator must update the configuration before restarting the service.

## 5. Stacked modifiers

Three or four modifiers before a noun force the reader to unpack a clause in the wrong order.

- ❌ a highly available multi-region read-optimized replica
- ✅ a read replica that serves three regions and fails over when one is unavailable
- ❌ a simple, flexible, extensible configuration format
- ✅ a configuration format with one key per option

If the rewrite needs facts the text does not supply, keep the modifier and flag the missing evidence.

## 6. Throat-clearing

Delete the sentence before the sentence.

- ❌ Before we begin, it's worth taking a step back to understand the context.
- ✅ (delete; start with the context)
- ❌ In order to be able to configure the client, you will need to first open the settings page.
- ✅ To configure the client, open the settings page.

Also cut "what this means is", "the fact of the matter is", "needless to say".

## 7. Hedging and false certainty

Empty hedges weaken a claim the writer can support; false certainty strengthens one they cannot.

- ❌ It could be argued that the flag might possibly be useful in some cases.
- ✅ Enable the flag when the queue depth exceeds 1,000 jobs.
- ❌ The service never loses a message.
- ✅ The service acknowledges a message only after it is written to disk.

The rewrites are valid only when the source supports the condition or mechanism. If it does not, the
finding is "the claim is unsupported", not "delete the hedge". Real uncertainty stays: "may fail on
ARM" is honest until someone tests it.

## 8. Meta-commentary

- ❌ In this section, we will explore how retries work.
- ✅ (delete; begin with the retry behavior)
- ❌ As we saw earlier, the worker polls the queue.
- ✅ The worker polls the queue. (repeat the fact or link to it; do not gesture at it)
- ❌ This is a tricky part, so pay attention.
- ✅ State why it is tricky: two flags interact and only one may be set.

## 9. Rhythm

- Vary sentence length. Three long sentences in a row read as a wall; three short ones read as a
  list without structure.
- One idea per sentence. If two clauses fight, split them.
- Prefer a concrete verb to "is" plus an adjective: "the worker retries" beats "retries are
  performed".
- Read the paragraph aloud. Where you run out of breath, the reader will too.
- Keep parallel items parallel: "reads, writes, and deletes" not "reads, writing, and deletion".

## 10. Before/after examples

- ❌ Not only does the worker retry the request, but it also logs the failure.
- ✅ The worker retries the request and logs each failure.
- ❌ The API is fast, simple, and reliable.
- ✅ The API returns a cached response in under 10 ms.
- ❌ Please note that the timeout should probably be increased if requests are slow.
- ✅ Increase the timeout when requests exceed 30 seconds.
- ❌ Our robust platform leverages a comprehensive set of tools to facilitate deployment.
- ✅ The platform deploys a build to staging in one command.
- ❌ The cache is utilized in order to facilitate a reduction in database load.
- ✅ The cache reduces database load.

## 11. False positives

Do not flag:

- Technical terms with a precise meaning: idempotent, backoff, mutex, quorum, eventual consistency.
- A necessary passive whose actor is unknown or irrelevant.
- Clear prose written by a non-native speaker. Accent is not a defect; ambiguity is.
- Legal, security, and safety wording, including a warning repeated near the risk.
- may, might, can, and should that carry real uncertainty or optionality.
- Deliberately terse UI strings, CLI help, and error messages where space is constrained.
- A single long sentence built around one long condition; split it only if the condition survives.

When a word or construction might be a term of art, check how the repository uses it before calling
it slop. The repository's usage outranks a general word list.
