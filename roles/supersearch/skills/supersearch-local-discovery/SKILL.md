---
name: supersearch-local-discovery
description: Search local workspace files, code structure, git history, previous sessions, and local media/document artifacts without mutating state.
---

# SuperSearch Local Discovery

Local discovery is the first pass when the answer may be in the workspace or previous work.

## Local Tool Priority

- Use LSP when the question is about definitions, references, symbols, diagnostics, or code truth.
- Use ast_grep_search when syntax shape matters, such as imports, call sites, decorators, JSX, or API usage.
- Use structured parsers for JSON, YAML, CSV, TSV, lockfiles, manifests, and generated metadata.
- Use Git history tools when the question is about when, why, provenance, deleted code, or regressions.
- Use session_search when prior user decisions, previous research, or earlier agent findings may answer the question.
- Use look_at when images, screenshots, PDFs, or media are directly relevant.
- Use Glob for unknown path discovery, Grep for exact text discovery, and Read for targeted context once candidates are known.
- Prefer exact strings from the request before synonyms.
- Search docs, tests, configs, source, scripts, examples, changelogs, and issue notes.
- Read enough surrounding context to avoid quote-mining a match.

## Structured Local Data

- Use `jq` for JSON and JSONL when available.
- Use `yq` for YAML when available.
- Use `xsv`, `mlr`, or a short read-only parser for CSV/TSV when available.
- Use package-manager or lockfile-aware tools only for inspection, never installation.
- If a parser is unavailable, fall back to Grep with tight patterns and mark the evidence as weaker.


- Use `lsp_goto_definition` and `lsp_find_references` for symbol navigation.
- Use `lsp_workspace_symbols` for workspace-wide symbol search (types, functions, variables across files).
- Use `lsp_document_symbols` to list all symbols in a file, useful for mapping large files or unknown entrypoints.
- Use `lsp_hover` to inspect type signatures, documentation, and inferred types at a given position.
- Use `lsp_goto_implementation` to find concrete implementations of interfaces, abstract classes, or traits.
- Use `ast_grep_search` for syntax-aware pattern matching.

## Git And History

Use Bash only for inspection:

- `git log --oneline -- <path>`
- `git log -S '<term>' -- <path>`
- `git log -G '<regex>' -- <path>`
- `git show <rev>:<path>`
- `git blame <path>`
- `gh issue/pr view` or `gh search` when GitHub metadata is needed.

## Session And Media

- Use `session_search` for prior decisions or previous research.
- Use `look_at` when images, screenshots, or PDFs are directly relevant.

## Reference Documents

- Use `reference_search` to search all loaded rolebox reference documents by full-text query.
- Reference documents live under `references/` in each role and cover specialized knowledge: department definitions, schemas, model pool rules, design principles, etc.
- When `reference_search` returns no relevant hits, check whether the query terms match document names or descriptions before declaring the gap unsolvable.
- Only escalate to external search when both local code tools and reference documents have been exhausted.

## Local Discovery Output

```md
Local Discovery
- Queries run:
- Tool choices:
- Files/artifacts inspected:
- Findings:
- Missing local evidence:
- Suggested external searches:
```
