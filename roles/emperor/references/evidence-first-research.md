---
name: evidence-first-research
description: Evidence-first research discipline — citation tiers, triggers, and core principles
---

# Evidence-First Research

This reference defines a technology-agnostic research discipline for every role in the emperor tree. Every executor, router, planner, and department worker MUST follow this discipline when making claims about external systems, APIs, libraries, or platform behavior.

This reference cascades to all sub-agents (chancellor, jinyiwei, validator, and all six departments).


## 1. Evidence Tiers

Classify evidence by reliability. Use the highest tier available.

| Tier | Type | Examples |
|---|---|---|
| **Primary** | Source-level or official definitive reference | Source code file path + line number, official API documentation, commit hash, issue tracker link to a merged fix |
| **Secondary** | First-party authored guidance | Release notes, specification URLs (RFCs, ECMA, W3C), official migration guides, official changelogs |
| **Insufficient** | Unverified or third-party information | Blog posts, Stack Overflow answers, training-data memory, unverified AI-generated content |

**Primary evidence** is the strongest form. A source code path and line number carries more weight than a blog post. An official API doc page carries more weight than a training-data recollection.

**Secondary evidence** is acceptable when primary evidence is not available. Prefer official sources (the project's own release notes, the spec body's own RFC page) over unofficial summaries.

**Insufficient evidence** MUST NOT be cited as fact. When insufficient evidence is the only source available, flag the claim explicitly as an unverified assumption. See Core Principles below.


## 2. Citation Format

Every evidence citation follows one of these formats:

### Web sources

```
URL — accessed YYYY-MM-DD — what was verified
```

Example:
```
https://react.dev/reference/react/useEffect — accessed 2026-07-07 — cleanup function runs on unmount and before re-execution
```

### Source code

```
filepath:lineNumber — what was verified
```

Example:
```
packages/runner/src/engine.rs:142-148 — build_context() filters out expired entries before sorting
```

### Git commits

```
<commit hash> — what was verified
```

Example:
```
a3f2e9c1 — changed sort order from alphabetical to priority-weighted
```

### Issue trackers

```
<issue URL> — what was verified
```

Example:
```
https://github.com/tauri-apps/tauri/issues/1234 — confirmed that the close_requested event fires before window destruction
```

### Assumption flag (no citation)

```
<claim> — assumption, not verified
```

Example:
```
useRef does not trigger re-render on mutation — assumption, not verified
```


## 3. When Research Is Required

Research is REQUIRED before any of the following:

- **Writing code against an unfamiliar external API.** Do not guess parameter types, return shapes, or error semantics. Fetch the API reference first.
- **Asserting platform-specific behavior.** Operating system differences, browser API behavior, file system semantics, concurrency guarantees — these vary by platform. Verify the actual contract.
- **Claiming "this is the standard way to do X."** A claim of standard practice requires evidence: official documentation, widespread community convention backed by primary sources, or an authoritative specification.
- **Using library internals beyond the public interface.** Private methods, undocumented fields, internal modules — these have no stability guarantee. Research whether they are accessible and what the library maintainers intend.
- **Making version-sensitive decisions.** When behavior changed across versions (e.g., React 18 vs 19, Tauri v1 vs v2, Python 3.10 vs 3.12), cite the version-specific documentation.
- **Relying on training-data memory for external behavior.** If you remember how an API works but have not verified it this session, research it.

When research is required, complete it before writing implementation code. Do not code first and backfill citations later.


## 4. When Research Is NOT Required

Research is NOT required in these cases:

- **Reading or writing files in the current codebase.** Use Read, Grep, and Glob tools to examine local files. No external research needed.
- **Standard language syntax.** Python f-strings, Rust ownership rules, TypeScript type annotations — these are part of the language specification and are not external systems.
- **Project-specific conventions documented in-repo.** If the project has a CONTRIBUTING.md, style guide, or code comments that define local conventions, use those directly.
- **Conceptual questions with no external API dependency.** Architecture trade-offs, algorithmic choices, design patterns — these are reasoning tasks, not research tasks.

When in doubt, research. The cost of a quick verification is lower than the cost of a bug caused by an incorrect assumption.


## 5. Core Principles

### No training-data claims without verification

When a claim involves external API behavior, library semantics, or platform characteristics, the claim MUST be backed by a citation to primary evidence or an explicit statement of uncertainty. Unverified training-data recall is insufficient evidence.

### Prefer docs over memory

When documentation contradicts training-data memory, prefer the documentation and report the discrepancy. Training data is stale by definition. Documentation reflects the current release.

### Cite or flag

Every external behavior claim in an execution report MUST carry a citation or be explicitly flagged as an unverified assumption. A bare claim with no citation and no flag is a violation of this discipline.

### Research before code

When research is required, complete it BEFORE writing implementation code. Do not code first and backfill citations later. Research findings inform the implementation. The reverse order produces bugs.

### No fake citations

Do not fabricate URLs, file paths, line numbers, or commit hashes. If you do not have a real citation, use the assumption flag format. A fake citation is worse than no citation — it is actively misleading.
