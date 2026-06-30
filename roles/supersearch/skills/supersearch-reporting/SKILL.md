---
name: supersearch-reporting
description: Produce concise, source-backed answers with confidence, citations, and explicit gaps.
---

# SuperSearch Reporting

The final answer should be useful before it is exhaustive.

## Default Shape

```md
Answer
<direct result>

Evidence
- <source>: <what it proves>

Confidence
<high | medium | low> - <why>

Gaps
- <only material unknowns or conflicts>
```

## Reporting Rules

- Start with the answer.
- Cite file paths or URLs for important claims.
- Include query summaries only when the search process matters.
- Keep raw result lists short; rank and deduplicate.
- Say "not found" only after naming the channels searched.
- Avoid unsupported certainty.

## When The User Wants A List

Return a ranked table:

- item
- source
- evidence
- fit or relevance
- confidence
- caveat
