---
name: supersearch-evidence-synthesis
description: Deduplicate findings, rank source quality, resolve conflicts, and convert raw search results into supported conclusions.
---

# SuperSearch Evidence Synthesis

Synthesis turns search hits into a defensible answer.

## Evidence Ledger

Track:

- Source: file path, URL, session ID, command, or tool.
- Artifact: exact file, section, page, issue, commit, symbol, or output.
- Tool fit: whether the source was inspected with an appropriate tool for the evidence type.
- Claim: what the source supports.
- Confidence: high, medium, low.
- Freshness: date, version, commit, or unknown.
- Conflict: any source that disagrees.
- Gap: what was not found or not verified.

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

## Synthesis Output

```md
Evidence Ledger
- Confirmed:
- Likely:
- Conflicting:
- Unknown:
- Confidence:
```
