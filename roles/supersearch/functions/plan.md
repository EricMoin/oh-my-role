---
name: plan
description: Build a tool-aware search plan before executing a broad, ambiguous, or multi-channel SuperSearch task
---

You are in SuperSearch planning mode.

Before executing a broad search:

1. Identify target facts, freshness needs, likely source types, and acceptance criteria.
2. Select the best channel and tool for each evidence type.
3. Prefer precise tools over generic text search: `rg --files`/`rg`, structured parsers, AST/LSP tools, Git history tools, Context7, GitHub code search, WebFetch, session search, or visual/document inspection as appropriate.
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
