---
name: supersearch-web-discovery
description: Search and fetch public web, GitHub, and official documentation sources with source-quality awareness. Includes engine selection, anti-crawl fallback chains, error-specific recovery, and multi-source routing.
---

# SuperSearch Web Discovery

Use web search when the answer depends on current public information, official docs, upstream behavior, package metadata, or broader internet evidence.

## Channel Choice

- `context7_resolve-library-id` and `context7_query-docs`: official library/framework/SDK docs, API syntax, configuration, migration, and integration details. Use this before generic web search for library questions.
- `grep_app_searchgithub`: real source usage, examples, config patterns, error strings, and ecosystem conventions.
- `web_fetch`: inspect a known URL, official page, changelog, release note, issue, pull request, or primary source discovered elsewhere. Supports multiple rendering engines (default/jina/browser/reader) with format, selector, timeout, and metadata options.
- `web_search`: broad semantic discovery and current public pages when the source is not yet known. Supports multi-source routing: auto, wikipedia, npm, hackernews, duckduckgo.
- `web_read`: lightweight URL-to-markdown fetch for quick article extraction via Mozilla Readability.
- Bash with `curl`, `gh`, and `jq`: targeted metadata inspection only, especially API responses, repository metadata, issues, releases, and package manifests.

## Engine Selection Matrix

Choose the `web_fetch` engine based on page type and expected anti-crawl resistance:

| Engine    | Applicable Scenarios                                            | Anti-Crawl Capability            |
|-----------|-----------------------------------------------------------------|----------------------------------|
| default   | Static HTML pages, public API endpoints, known fast sources     | Low — bare HTTP GET, no JS       |
| jina      | Blocked pages (403/429), LLM-friendly structured output, long   | Medium — proxy-based, UA rotation|
|           | content, Chinese-language or non-Western sites                  |                                  |
| browser   | JS-rendered SPA (React/Vue/Angular), dynamic content,           | High — real browser, full JS     |
|           | Cloudflare challenge pages, login redirect detection            |                                  |
| reader    | Article/article-list extraction, lightweight paywall bypass,    | Medium — Readability mode,       |
|           | Mozilla Readability transformation                              | strips non-content cruft         |

**Default engine is `default`.** Switch only when the default fails (see Fallback Chain below).

## Fallback Chain (Anti-Crawl Core)

When a URL fetch fails, walk this chain in order. Stop at the first success.

```
Step 1: engine:default (format:auto)
    → If 403, 429, timeout, or empty body → continue

Step 2: engine:jina (format:auto)
    → If still fails → continue

Step 3: engine:browser
    → Only if Playwright/Crawlee runtime is available in environment
    → If unavailable, skip to Step 4

Step 4: engine:reader (format:auto)
    → Paywalled articles may still yield readable text
    → If fails → continue

Step 5: web_search (query: site/domain + topic keywords)
    → Salvage content from search-result snippets or cached excerpts
    → If search also fails → continue

Step 6: Alternative sources
    → GitHub mirror of the page (raw.githubusercontent.com)
    → archive.org Wayback Machine snapshot
    → Official docs CDN (e.g. unpkg.com, cdn.jsdelivr.net, esm.sh)
    → Google cache (webcache.googleusercontent.com)

Step 7: Honest report
    → "URL {url} is unreachable. Reason: {reason}. Evidence degraded to {salvaged}."
```
Step 8: Custom scraping (last resort)
    → When Steps 1-7 have been fully exhausted and the evidence is materially needed
    → Load the `supersearch-custom-scraping` skill for constraints, decision gate, and safety rules
    → Dispatch web-scout with the skill loaded; scripts are written to `.rolebox/scratch/` only
    → Scripts must respect robots.txt, rate limits, and must not bypass authentication
    → After scraping, integrate the output file into the evidence ledger per supersearch-evidence-synthesis
    → If the target site's robots.txt or ToS prohibits automated access, do NOT proceed; report the gap

**Implementation rule:** Never silently return empty or stale data without a note. If all steps fail, report the URL with the failure reason and which fallback steps were attempted.

## Error-Specific Recovery Table

| Error Condition            | Primary Recovery                                      | Secondary Fallback               |
|----------------------------|-------------------------------------------------------|----------------------------------|
| 403 Forbidden              | `engine:jina` — proxy may bypass server block;        | `engine:browser` with full JS    |
|                            | also try custom `headers` with alternative UA         |                                  |
| 429 Rate Limit             | `engine:jina` (different egress IP) or `engine:reader`| Wait + retry with exponential     |
|                            |                                                       | backoff if repeatable            |
| Cloudflare challenge       | `engine:browser` — real browser passes JS challenge;  | `engine:jina` as secondary       |
|                            | also try `engine:jina` which may handle some          |                                  |
| JS-rendered SPA            | Explicit `engine:browser` — required for React/Vue/   | `engine:jina` if SPA serves      |
|                            | Angular apps without SSR                              | static fallback HTML             |
| Timeout >30s               | Increase `timeout` to 60-120s; or switch to `engine:  | `engine:reader` for article-only  |
|                            | jina` which often responds faster for heavy pages     |                                  |
| Paywall / login wall       | `engine:reader` — extracts visible text via Readability| Report "Content behind paywall,   |
|                            | may bypass soft paywalls                              | body text not accessible"         |
| Binary / non-HTML response | `format:raw` — download raw bytes; treat as attachment | If image, use `format:auto` to   |
|                            | and note content type in evidence                     | render into Markdown              |

## Multi-Source Web Search

`web_search` supports multiple sources via the `source` parameter. Choose based on what kind of evidence you need:

| Source      | Best For                                            | Example Query                 |
|-------------|------------------------------------------------------|-------------------------------|
| auto        | General-purpose — routes based on query content      | `"React 19 new features"`     |
| wikipedia   | Factual/encyclopedic — definitions, history, specs   | `"HTTP status 429 meaning"`   |
| npm         | Package metadata, version, registry info             | `"express rate-limit"`        |
| hackernews  | Technical commentary, real-world experiences,        | `"Tauri v2 migration issues"` |
|             | community sentiment                                  |                               |
| duckduckgo  | Alternative general web search engine                | `"CSS container queries"`     |

**Strategy:** Start with `source:auto`. If results are sparse or low-quality, re-query with an explicit source (e.g., `source:wikipedia` for definitions, `source:npm` for package data). Fetch primary sources before citing search-result snippets as final evidence.

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
- When content was salvaged via an anti-crawl fallback, note which engine and step succeeded (e.g., `evidence recovered via fallback step 2 — engine:jina`).
- For paywalled or blocked pages, document the failure reason and what alternative source was used.

## Web Discovery Output

```md
Web Discovery
- Queries run:
- Tool choices:
- URLs fetched:
- Strongest evidence:
- Contradictions:
- Freshness notes:
- Anti-crawl fallback steps exercised (if any):
- Gaps:
```
