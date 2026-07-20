---
name: evidence-research
description: Evidence-first research discipline for programming mentor scenarios — citation tiers, trigger conditions, research channels, and escalation rules for verifying external API, library, and language behavior
---
# Evidence-First Research for Teaching

## Core Principle

Never assert API behavior, library semantics, or language implementation details from training data alone. When the answer depends on documented, versioned, or implementation-defined behavior, research first.

## Trigger Conditions — Mandatory Research

Research is required when any of these apply:

| Trigger | Example |
|---------|---------|
| Unfamiliar library or framework | "How do I use `tokio::select!` with timeout?" |
| Version-specific behavior | "Does Python 3.12's `pathlib.Path.walk()` support symlinks?" |
| Performance characteristics | "Is `HashMap::entry` faster than `get` then `insert`?" |
| Undocumented edge case | "What happens when `JSON.parse` receives trailing commas?" |
| Implementation-defined behavior | "How does Go's `map` handle concurrent reads during a write?" |
| API deprecation/migration | "What replaced `React.ComponentWillReceiveProps`?" |
| Security-related behavior | "Is `eval()` in Python safe if I restrict the namespace?" |
| Disagreement between sources | "Docs say X, but this blog post says Y — which is correct?" |

## Research Channel Priority

| Priority | Channel | Tool | Use When |
|----------|---------|------|----------|
| 1 | Context7 | `resolve-library-id` → `query-docs` | Libraries with Context7 documentation coverage |
| 2 | Official language/framework docs | `web_fetch` / `webfetch` | Language reference, library guide, API reference |
| 3 | GitHub source | `web_fetch` | Official repository source, tagged to the user's version |
| 4 | Release notes / changelogs | `web_fetch` | Migration, deprecation, breaking changes |
| 5 | RFC / PEP / proposal | `web_fetch` | Language design intent, motivation |
| 6 | Package manager metadata | `bash` (npm info, cargo search, pip show) | Version resolution, dependency constraints |
| 7 | Reproducible experiment | Write a minimal script/test | When all other channels are inconclusive |

## Citation Format

| Source Type | Format |
|-------------|--------|
| Context7 | `[source: Context7/{libraryId} — "{query}"]` |
| Official docs | `[source: {url} — accessed YYYY-MM-DD]` |
| GitHub source | `[source: GitHub — {org}/{repo}/blob/{tag}/{path}:L{line}]` |
| Release notes | `[source: {release-note-url} — {version} release notes]` |
| PEP / RFC | `[source: {url} — {PEP number}: {title}]` |
| Experiment | `[source: experiment — {snippet} — {observed result}]` |
| Unverified assumption | `[assumption: not verified — {reason}]` |

## Escalation

When you cannot find authoritative documentation:

1. Report what channels were tried
2. State what was found (or not found)
3. Give a qualified answer based on general principles, marked clearly as unconfirmed
4. Suggest next steps: "I'd recommend testing this on your target version before relying on it"

### Escalation format

```
⚠️ 未能找到权威文档确认该行为
查询渠道: Context7, 官方文档, GitHub 源码 (tag vX.Y.Z)
结果: 无明确文档说明该边缘情况
建议: 在目标版本上写最小测试验证,或在本仓库提交 issue 确认
```

## Teaching-Specific Adaptations

- **When showing evidence**: Include the source in context, not just a URL. "根据 Python 文档 (docs.python.org/3/library/pathlib.html), `Path.walk()` 默认...这里是对应的文档原文:"
- **When uncertain**: Be honest. Use it as a teaching moment. "这个问题我印象中是这样——但文档才是最终权威,让我查一下。" Then demonstrate the research process. The user learns *how to verify*, not just the answer.
- **Don't overwhelm with citations**: For simple, well-known facts ("Python lists are zero-indexed"), no citation needed. For version-specific or implementation-dependent behavior, always cite.

## Scope

This skill covers:
- Language features (Python, JS/TS, Rust, Go, Java, C++, etc.)
- Standard library APIs
- Popular frameworks (React, Django, Tokio, etc.)
- Package/ecosystem tools (pip, cargo, npm, go modules)
- Compiler and runtime behavior

This skill does NOT cover:
- Business logic design decisions
- Code style preferences (those go to `idiomatic-patterns`)
- Framework architecture guidance (those go to general knowledge)
