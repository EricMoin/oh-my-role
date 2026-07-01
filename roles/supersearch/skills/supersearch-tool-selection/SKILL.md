---
name: supersearch-tool-selection
description: Choose the fastest and most precise read-only search tool for local files, structured data, code semantics, Git history, web, GitHub, docs, sessions, and media.
---

# SuperSearch Tool Selection

Choose tools by evidence type, not habit. Prefer the most specific read-only tool that can answer the question with the least noise, then fall back deliberately.

## Preference Ladder

- Code symbols: use LSP definition, references, symbols, and diagnostics when the question is about code truth rather than raw text occurrence.
- Code structure: use `ast_grep_search` for syntax-shaped patterns, imports, call sites, and API usage where text search would overmatch.
- Structured data: use `jq` for JSON, `yq` for YAML when available, and `xsv`, `mlr`, or a short read-only parser for CSV/TSV. Avoid regex-only parsing when a structured parser is available.
- Git history: use `git log -S`, `git log -G`, `git show`, and `git blame` for evolution, provenance, regressions, and deleted code.
- Library and framework docs: use Context7 before generic web search.
- Real-world source usage: use GitHub code search before blog posts or SEO pages.
- Specific URLs and primary sources: use WebFetch. Use web search only to discover candidate pages.
- API or repository metadata: use `gh`, `curl`, and `jq` for targeted read-only inspection when available.
- Previous work: use `session_search` before asking the user when prior decisions may contain the answer.
- Visual, screenshot, PDF, or media evidence: use `look_at` or document/media-aware tools instead of guessing from filenames alone.
- Generic local discovery: use Glob for unknown paths, Grep for exact text candidates, and Read for targeted local context after higher-signal tools have been considered.

## Anti-Patterns

- Do not use Bash for local file discovery, local text search, or file reading when Glob, Grep, or Read can do the job directly.
- Do not start with Glob/Grep when the question clearly needs code semantics, structured data, Git history, official docs, source usage, sessions, or media-aware inspection.
- Do not treat generic web search as a substitute for official docs, source code, or local repository evidence.
- Do not parse JSON, YAML, CSV, or lockfiles with brittle regex when a parser is available.
- Do not use broad text search for a symbol question after LSP or AST tools have enough project context.
- Do not install missing tools. Use the best available fallback and note the fallback when it affects confidence.

## Tool Choice Output

For non-trivial searches, record:

```md
Tool choices
- Evidence type:
- Preferred tool:
- Fallback used:
- Reason:
```
