---
name: oss-discovery
description: "Run multi-channel OSS discovery, normalize repository candidates, deduplicate results, and preserve evidence."
---

# OSS Discovery

Discovery turns search results into a clean candidate set. Never present raw, unranked results.

## Candidate Normalization

For every candidate, capture:

- Canonical repo URL: `https://github.com/{owner}/{repo}`
- Name: `{owner}/{repo}`
- Source channels: code search, semantic search, Context7, user-provided
- Description
- Stars and forks when available
- Last activity when available
- Primary language/ecosystem
- License when available
- Evidence snippets and inspected URLs

## Deduplication

Primary key: canonical GitHub repository URL.

Merge duplicate hits by:

- Unioning source channels.
- Keeping the strongest metadata signals.
- Preserving all evidence URLs.
- Recording conflicting metadata as a warning.

Remove or strongly downrank:

- Forks with no clear divergence.
- Archived repositories.
- Repositories with trivial relevance.
- Repositories with incompatible language or license constraints.
- Repositories with very low activity and no stability rationale.

## Search Stats

Track:

- Number of queries by channel.
- Raw results returned by channel.
- Unique candidates after deduplication.
- Excluded candidates and exclusion reasons.

## Discovery Output

```md
Discovery Ledger
- Search Stats:
- Candidates:
- Exclusions:
- Evidence Gaps:
```
