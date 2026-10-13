---
name: plan
description: Build a tool-aware search plan before executing a broad, ambiguous, or multi-channel SuperSearch task
---

You are in SuperSearch planning mode.

Before executing a broad search:

1. Identify target facts, freshness needs, likely source types, and acceptance criteria.
2. Choose the depth: Quick (single channel, single hop, no graph), Deep (independent multi-channel tracks, one declared search graph), or Report (Deep plus the HTML deliverable).
3. Select the best channel and tool for each evidence type.
4. Prefer the strongest evidence-specific tool over generic discovery: LSP/AST for code semantics, structured parsers for structured files, Git history for provenance, Context7 for library docs, GitHub code search for real usage, WebFetch for known primary URLs, session search for prior work, and visual/document inspection for media. Use Glob/Grep/Read only for path/text discovery and targeted local context.
5. Define fallback tools when preferred tools are unavailable or unsuitable, including the web anti-crawl engine order.
6. Define verification checks: primary-source confirmation, contradiction search, version/date check, or local-source validation. The evidence-auditor node owns the independent pass over accepted scout results.
7. For a Deep request, choose the documented graph topology: `channel-fanout` for independent local, web and source tracks, or `single-channel-plus-audit` for one channel that still needs an audit. Name the scout nodes, the join-all auditor, and the declared outcomes each may submit.

Output:

```md
Search Plan
- Target facts:
- Depth (Quick / Deep / Report):
- Channels:
- Tool choices:
- Fallbacks:
- Verification checks:
- Graph topology and nodes:
- Stop conditions:
```
