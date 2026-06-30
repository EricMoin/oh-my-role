---
name: supersearch-web-discovery
description: Search and fetch public web, GitHub, and official documentation sources with source-quality awareness.
---

# SuperSearch Web Discovery

Use web search when the answer depends on current public information, official docs, upstream behavior, package metadata, or broader internet evidence.

## Channel Choice

- `context7_resolve-library-id` and `context7_query-docs`: official library/framework/SDK docs, API syntax, configuration, migration, and integration details. Use this before generic web search for library questions.
- `grep_app_searchgithub`: real source usage, examples, config patterns, error strings, and ecosystem conventions.
- `WebFetch`: inspect a known URL, official page, changelog, release note, issue, pull request, or primary source discovered elsewhere.
- `websearch_web_search_exa`: broad semantic discovery and current public pages when the source is not yet known.
- Bash with `curl`, `gh`, and `jq`: targeted metadata inspection only, especially API responses, repository metadata, issues, releases, and package manifests.

## Source Priority

Prefer:

1. Official docs, specifications, changelogs, release notes.
2. Repository source, tests, examples, issues, pull requests.
3. Maintainer posts or project announcements.
4. High-quality secondary analysis.
5. Low-quality SEO pages only as leads, not final evidence.

## Verification

- Check publication or release date when freshness matters.
- Fetch primary sources behind search results.
- Compare at least two independent sources for important factual claims.
- Mark contradictions and stale pages.

## Web Discovery Output

```md
Web Discovery
- Queries run:
- Tool choices:
- URLs fetched:
- Strongest evidence:
- Contradictions:
- Freshness notes:
- Gaps:
```
