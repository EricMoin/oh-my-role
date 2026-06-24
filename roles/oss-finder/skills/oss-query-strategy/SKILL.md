---
name: oss-query-strategy
description: "Generate channel-specific queries for GitHub code search, Exa semantic search, and Context7 documentation lookup."
---

# OSS Query Strategy

Different search channels require different query shapes. Do not reuse one generic keyword query everywhere.

## GitHub Code Search

Use literal code patterns. Search for things that would appear in real source files:

- Imports: `from fastapi import`, `import { rateLimit }`, `use tokio::`
- Declarations: `class TokenBucket`, `func (l *Limiter) Allow(`, `interface CacheStore`
- Constructor/config patterns: `new RateLimiter(`, `rateLimit({`, `Cache::builder()`
- Framework hooks: decorators, middleware calls, plugin registration, CLI command declarations

Rules:

- Use the user's language/framework filter when known.
- Generate 3-5 distinct patterns.
- Use regexp only when needed for cross-line structure.
- Do not send natural language such as "best Rust cache library" to code search.

## Semantic Web Search

Use natural-language page descriptions:

- "GitHub repository implementing {capability} in {language/framework}"
- "open source {domain} library with {constraint}"
- "comparison of {approaches} for {problem}"

Use 2-3 queries with `numResults: 10`.

## Context7

Use when the user names a library or discovery identifies a well-known library worth checking.

Workflow:

1. Resolve the library ID using the library name and use case.
2. Query docs for the integration pattern, configuration, and limitations.
3. Limit to 2 library lookups during discovery unless the user requested a focused comparison.

## Query Plan Output

```md
Query Plan
- Code Patterns:
- Semantic Queries:
- Context7 Lookups:
- Filters:
- Expected Evidence:
```
