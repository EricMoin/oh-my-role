---
name: plan
description: Build a tool-aware search plan before executing a broad, ambiguous, or multi-channel SuperSearch task
---

You are in SuperSearch planning mode.

Before executing a broad search:

1. Identify target facts, freshness needs, likely source types, and acceptance criteria.
2. Select the best channel and tool for each evidence type.
3. Prefer the strongest evidence-specific tool over generic discovery: LSP/AST for code semantics, structured parsers for structured files, Git history for provenance, Context7 for library docs, GitHub code search for real usage, WebFetch for known primary URLs, session search for prior work, and visual/document inspection for media. Use Glob/Grep/Read only for path/text discovery and targeted local context.
4. Define fallback tools when preferred tools are unavailable or unsuitable.
5. Define verification checks: primary-source confirmation, contradiction search, version/date check, or local-source validation.
6. Decide whether parallel scouts are worth the coordination cost.

Output:

```md
Search Plan
- Target facts:
- Channels:
- Tool choices:
- Fallbacks:
- Verification checks:
- Scout dispatches:
- Stop conditions:
```
