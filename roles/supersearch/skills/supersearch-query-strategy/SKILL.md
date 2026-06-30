---
name: supersearch-query-strategy
description: Build channel-specific query plans for local files, code search, web search, docs, sessions, and visual/document sources.
---

# SuperSearch Query Strategy

Do not reuse one generic query everywhere. Shape the query to the channel.

## Local Files

Use identifiers, filenames, config keys, error fragments, exact phrases, and nearby domain terms.

- `rg`: primary tool for exact strings, symbols, CLI flags, error messages, schema keys, and scoped text searches.
- `rg --files`: primary tool for local file discovery and likely file families such as `README*`, `*config*`, `*.md`, and `*test*`.
- Structured parsers: use `jq`, `yq`, `xsv`, `mlr`, or a short read-only parser for JSON, YAML, CSV, TSV, lockfiles, and generated metadata when available.
- Grep/Glob: fallback or host-tool option when `rg` is unavailable or the structured tool API is more useful than shell output.
- ast_grep_search: structural code patterns when syntax matters.
- LSP: definitions, references, symbols, and diagnostics for codebase truth.
- git: `git grep`, `git log --grep`, `git log -S`, `git log -G`, `git show`, `git blame` for tracked content and history.
- session_search: prior user/agent context, decisions, and earlier results.

## Web

Use natural-language queries and source-targeted queries.

- Current facts: include date, version, or release terms.
- Primary sources: add official site, docs, changelog, GitHub, issue, release.
- Contradiction checks: search the opposite claim or known failure mode.

## GitHub And Docs

Use code-like patterns for GitHub code search and library names for docs.

- GitHub code: imports, function names, config keys, error strings.
- Context7: resolve exact library IDs, then query integration, API, options, and limitations.
- Repositories: inspect README, examples, package manifests, issues, releases, and source.

## Tool-Fit Checks

- If the target is a symbol, plan LSP or AST after initial `rg` candidates.
- If the target is a config value or manifest field, plan a parser before regex.
- If the target is "when did this change?", plan Git history before current-file search.
- If the target is a library API, plan Context7 before web search.
- If the target is real-world usage, plan GitHub code search before secondary articles.

## Query Plan Output

```md
Query Plan
- Target facts:
- Tool choices:
- Local queries:
- Web queries:
- GitHub/code queries:
- Docs lookups:
- Session/history queries:
- Verification queries:
```
