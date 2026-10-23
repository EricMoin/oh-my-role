---
name: supersearch-evidence-synthesis
description: Deduplicate findings, rank source quality, resolve conflicts, and convert raw search results into supported conclusions.
---

# SuperSearch Evidence Synthesis

Synthesis turns search hits into a defensible answer.

## Evidence Ledger

Track:

- Source: file path, URL, session ID, command, or tool.
- Artifact: exact file, section, page, issue, commit, symbol, or output, with a
  direct URL or file/line locator retained for point-of-use citation.
- Tool fit: whether the source was inspected with an appropriate tool for the evidence type.
- Claim: what the source supports, distinguished from the author's inference.
- Supporting passage: the exact short excerpt or observation, preserving enough
  context to check a quotation or paraphrase without changing its meaning.
- Confidence: high, medium, low.
- Freshness: date, version, commit, or unknown.
- Conflict: any source that disagrees.
- Gap: what was not found or not verified.
- Figure candidates: direct image URL, hosting page, alt/context text, intended report section, and license/source type (official docs / repo asset / other).

## Confidence Rules

High confidence:

- Primary source inspected.
- Appropriate specialized tool used when available.
- Local source code or official docs directly support the claim.
- Multiple independent sources agree.

Medium confidence:

- Good source but indirect evidence.
- Strong local pattern but no explicit docs.
- One primary source with unclear freshness.

Low confidence:

- Secondary source only.
- Stale, partial, or ambiguous evidence.
- Conflicting sources unresolved.
- Generic fallback used where a structured, semantic, or primary-source tool would be materially better.

## Conflict Handling

- Do not hide contradictions.
- Prefer newer primary sources over stale secondary sources.
- If versions differ, scope the answer by version.
- If evidence is insufficient, say so.

## From ledger to narrative

Group findings by the question they answer, not by which scout found them. Merge
duplicate claims while retaining distinct supporting sources and qualifications.
Map each material question to a place in the report and identify missing evidence
for its explanation, boundaries, alternatives or consequences before drafting.

Confidence ratings and the ledger categories below are internal synthesis data,
not a reader-facing section template. Use `supersearch-reporting` to write the
explanation, attach source links in context and consolidate the overall evidence
assessment at the end. Do not paste worker summaries into successive sections.

## Internal synthesis output

```md
Evidence Ledger
- Confirmed:
- Likely:
- Conflicting:
- Unknown:
- Confidence:
- Figure candidates:
```
