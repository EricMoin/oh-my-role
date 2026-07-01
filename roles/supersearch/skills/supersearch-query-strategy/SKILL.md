---
name: supersearch-query-strategy
description: Build channel-specific query plans for local files, code search, web search, docs, sessions, and visual/document sources.
---

# SuperSearch Query Strategy

Do not reuse one generic query everywhere. Shape the query to the channel.

## Local Evidence

Use identifiers, filenames, config keys, error fragments, exact phrases, and nearby domain terms. Choose the tool by evidence type before choosing query wording.

- ast_grep_search: structural code patterns when syntax matters.
- LSP: definitions, references, symbols, and diagnostics for codebase truth.
- Structured parsers: use `jq`, `yq`, `xsv`, `mlr`, or a short read-only parser for JSON, YAML, CSV, TSV, lockfiles, and generated metadata when available.
- Bash git commands: `git log -S`, `git log -G`, `git show`, and `git blame` for history, provenance, regressions, and deleted code.
- session_search: prior user/agent context, decisions, and earlier results.
- look_at: visual, screenshot, PDF, or media evidence.
- Glob/Grep/Read: general local discovery layer for unknown paths, exact text candidates, and targeted context after a stronger route identifies what to inspect.

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

- If the target is a symbol or call chain, plan LSP or AST before broad text search.
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
