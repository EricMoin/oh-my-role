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

## Code Intelligence

- Use `lsp_goto_definition` and `lsp_find_references` for symbols.
- Use `lsp_symbols` to map large files or unknown entrypoints.
- Use `ast_grep_search` for syntax-aware patterns.
- Use `lsp_diagnostics` only as evidence about code health, not as a general search substitute.

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
