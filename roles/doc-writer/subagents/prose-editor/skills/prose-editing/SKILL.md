---
name: prose-editing
description: Editing method for existing documentation — fact ledger, four editing passes, cut list, Chinese and English style notes, review output format, and anti-patterns. Load before reviewing or rewriting prose.
---

# Prose Editing

## 1. Fact ledger

Before editing, list every fact the document asserts:

| Kind | What to capture | Why |
|---|---|---|
| Name | Product, service, command, flag, field, file | Renaming or dropping changes meaning |
| Number | Version, limit, timeout, size, count | Silent edits turn 30 s into 30 ms |
| Unit | ms, s, MiB, requests/min | Units are facts, not style |
| Command | Full command, arguments, working directory | Rephrasing can break it |
| Path | Repository or system path | A "cleanup" can point at the wrong file |
| Condition | if/when/unless/only after | Scope changes hide in tidy sentences |
| Trade-off | Cost, risk, limitation, reason | Deleting a downside is a factual change |
| Uncertainty | "may", "experimental", "not verified" | Certainty must not be upgraded |

After every pass, walk the ledger against the edited text. A missing item is a regression; a changed
number, unit, or condition is a factual edit and requires evidence or a revert.

## 2. Passes

Run four passes in order. Do not mix them; each has one question.

### Pass 1 — structure

- Does the document open with its promise and result?
- Are sections in the reader's task order?
- Is one fact in one home, or repeated in three places?
- Are prerequisites before the step that needs them?
- Do headings form a usable outline on their own?

### Pass 2 — paragraph

- Does each paragraph make one point?
- Is the topic sentence first?
- Can the paragraph be cut without losing the task?
- Does the paragraph repeat the one above it?
- Should a list replace a run-on sequence, or prose replace a fragment list?

### Pass 3 — sentence

- Is the actor named, and is the verb active?
- Does the sentence carry more than one idea or condition? Split only where the reader would lose
  the thread; word count is not the test.
- Is the condition at the start where the reader needs it?
- Are there two clauses that should be two sentences?
- Does the sentence still mean what the ledger says?

### Pass 4 — word

- Replace vague verbs: utilize → use, facilitate → help, initiate → start.
- Delete filler: simply, basically, actually, just, very, quite, in order to.
- Delete hedging that hides a known fact: "should", "might", "typically".
- Delete marketing: powerful, seamless, robust, comprehensive, world-class.
- Keep one term per concept; remove synonym drift.
- Preserve identifiers, commands, paths, and code exactly.

## 3. Cut list

Delete on sight:

- Openings that announce the topic instead of stating it: "In this document we will...".
- Summaries that repeat the section just read.
- "It is important to note that", "as you can see", "needless to say".
- Rule-of-three padding and adjective stacks.
- Explanations of why the document is structured this way.
- Apologies, meta-commentary, and promises about future documentation.
- Duplicate warnings; keep the one nearest the risk.
- Passive constructions that hide who acts.
- Empty transitions: "Moreover", "Furthermore", "Additionally" when no addition is needed.

Do not cut:

- A required warning or safety step.
- A condition that limits when the instruction applies.
- An exception or prerequisite, including the order it must happen in.
- A failure or recovery step.
- A trade-off the reader needs to make a decision.
- A stated uncertainty that no one has resolved.
- Security or legal wording.
- The rationale for a non-obvious choice.
- An example that prevents a wrong action.

Compression test: after cutting, would the reader have to ask a follow-up question, guess a
condition, or risk a wrong action? If yes, restore it.

## 4. Chinese and English notes

Chinese:

- Prefer short clauses and active voice: "服务会重试请求" over "请求会被服务进行重试".
- Remove 翻译腔: stacked 的, "进行/实现/作出" noun padding, "对于……而言" chains, and long
  pre-modifier stacks.
- Use 顿号 for short parallel items, commas for clauses; do not copy English punctuation.
- Keep identifiers, commands, and standard terms in English; do not translate `token` as 令牌 and
  `token` in the same page.
- Delete 黑话: 赋能, 助力, 一站式, 闭环, 底层逻辑, 众所周知, 简而言之.
- Read the result aloud: if it cannot be said in one breath, split it.

English:

- Prefer the base verb and the concrete noun.
- Avoid nominalizations: "the implementation of" → "implementing" or "we implemented".
- Avoid stacked modifiers: "highly available multi-region read replica" needs a clause.
- Use sentence case for headings unless the project says otherwise.
- Keep contractions only if the document's existing voice uses them.

## 5. Review output

Return two lists, never one merged list:

Blocking issues — wrong, missing, or misleading; the document cannot ship as is:

```text
path:line — problem — evidence — replacement
```

Suggestions — optional clarity, rhythm, or consistency improvements:

```text
path:line — current sentence — suggested sentence — reason
```

Rules:

- Quote the original sentence before proposing a replacement.
- Give the replacement, not "consider rephrasing".
- Cite the fact ledger or source when a change touches a fact.
- Rank blocking issues by reader impact: wrong fact, broken command, missing prerequisite, then
  ambiguity.
- Never present an uncertain claim as certain; if the source is unknown, keep the hedge and flag it.
- Do not rewrite a decision, a limitation, or a trade-off into something more agreeable.

## 6. Anti-patterns

- Rewriting for rhythm and silently changing a number or unit.
- Deleting a limitation because it reads negatively.
- Turning a verified fact into a stronger claim during "tightening".
- Editing code blocks for style; they are executable facts.
- Adding examples or explanations the source never contained.
- Reporting only suggestions when a command is wrong.
- Marking every stylistic preference as blocking.
- Rewriting the document's decision instead of its prose.
- Making Chinese more formal by adding 的 and 进行, which increases distance from the reader.
- Leaving a duplicated fact in two sections because both "read fine".
