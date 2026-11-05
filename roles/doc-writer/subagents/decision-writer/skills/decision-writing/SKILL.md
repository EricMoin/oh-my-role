---
name: decision-writing
description: Decision-record method — when to write one, convention-first placement, ADR and RFC outlines, evidence discipline, review checklist, and anti-patterns. Load before writing an ADR, RFC, or design decision note.
---

# Decision Writing

## 1. When to write a decision record

Write one when the decision is expensive to reverse, shapes interfaces or data, constrains future
teams, or keeps being re-litigated.

- A choice between two viable designs with real trade-offs.
- A constraint accepted for a concrete reason: compatibility, latency, cost, regulation.
- A deliberate deviation from an obvious approach that a future reader would otherwise "fix".
- A supersession: an old decision no longer holds and must be replaced visibly.

Do not write one for:

- A decision already recorded elsewhere; link or supersede it instead.
- A trivial reversible choice with no meaningful alternatives.
- A decision nobody has made yet. That is an RFC or a question, not a record.
- A restatement of a design document's conclusion without context.

## 2. Convention first

Before writing a single line:

1. Find the existing decision directory and read its newest entries.
2. Match its numbering, filename pattern, metadata block, headings, and tone.
3. Reuse the repository's template if one exists; do not import an outside format.
4. If no convention exists, say so in the report and use the ADR outline below.
5. Check for an existing record on the same subject. Supersede it explicitly rather than editing
   history away.

Preserve old records. A decision record is a timestamp, not a wiki page. When a decision changes,
write a new record that names the old one and its replacement.

## 3. ADR outline

```text
# ADR-NNN: Decision title (imperative, specific)

Status: proposed | accepted | rejected | superseded by ADR-NNN
Date: YYYY-MM-DD
Decision owner: person or team
Related: issues, pull requests, previous ADRs

## Context
The forces at play: requirements, constraints, scale, team, timeline, existing system.

## Decision
The choice, stated in one paragraph, then the concrete consequences that follow.

## Alternatives considered
### Option A — name
What it is, pros, cons, why rejected.

### Option B — name
Same fields.

## Consequences
What becomes easier, what becomes harder, what must now stay true.

## Verification
How the team will know the decision works: metrics, tests, fitness functions, review points.
```

Rules:

- Alternatives must include the rejected options and the actual reason for rejection.
- Consequences include costs, not just benefits.
- Verification is a signal, not "it works".
- Status and date are facts, not guesses.

## 4. RFC outline

An RFC proposes and debates before a decision exists:

```text
# RFC: Title
Status: draft | under review | accepted | rejected
Author: name
Reviewers: names or roles
Decision date:

## Problem
The situation and why it needs a decision now.

## Goals and non-goals
What this must achieve; what it explicitly will not.

## Constraints
Compatibility, performance, security, cost, team, deadlines.

## Options
Each option with a short mechanism, pros, cons, and risk.

## Recommendation
The proposed option and the reasoning, including the strongest objection.

## Risks and mitigations
What could go wrong and how it will be detected or reduced.

## Rollout
Stages, flags, migration, observability, rollback.

## Open questions
Questions that must be answered before acceptance.
```

Do not mark an RFC accepted unless the repository records that decision. "Recommended" is not
"decided".

## 5. Evidence

- Link each factual claim to a code path, pull request, issue, dashboard, benchmark, or incident.
- Use repository-relative paths and stable identifiers; avoid rotting external links.
- Mark assumptions as assumptions: "we assume 10k requests/day; not measured".
- Distinguish the decision from its justification: the decision is one sentence; the context may
  be long.
- If two sources disagree, state both and who owns the resolution.
- Never invent a benchmark result, a metric, a date, or a participant.

## 6. Review checklist

- [ ] The record states a decision someone actually made, with the owner and date.
- [ ] The context would let a new engineer understand the forces without asking.
- [ ] At least one real alternative is described with pros, cons, and the reject reason.
- [ ] Consequences include costs and obligations, not only benefits.
- [ ] Verification names an observable signal.
- [ ] Status and supersession links are correct.
- [ ] The format matches the repository's existing records.
- [ ] Every factual claim has evidence, and assumptions are labeled.
- [ ] Old records are preserved, not rewritten.

## 7. Anti-patterns

- A decision record that reads like a sales pitch and lists no rejected option.
- "We chose X because it is better" with no criterion for "better".
- Editing an accepted ADR to describe a new decision; write a superseding record instead.
- An RFC presented as accepted before review.
- Consequences that ignore migration cost, operational load, or team learning.
- A status field that stays "proposed" after the decision shipped.
- Dates, owners, or metrics filled from memory.
- Mixing several unrelated decisions into one record.
- Linking to a private chat as the only evidence.
