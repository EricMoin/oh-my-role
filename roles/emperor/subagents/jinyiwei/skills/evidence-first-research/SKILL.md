---
name: evidence-first-research
description: Operational workflow for evidence-first research — trigger rules, research workflow, citation recording, and escalation for technology-agnostic research discipline
---

# Evidence-First Research

Operational workflow for the evidence-first research discipline. The constitutional reference at `references/evidence-first-research.md` defines the *what* and *why* (evidence tiers, when research is required, core principles). This skill defines the *how* — the step-by-step process jinyiwei executes when research triggers fire.

## Trigger Rules

Activate this skill in any of the following situations:

- **Unfamiliar external API or library.** Before writing code against a library, framework, SDK, or service whose API you have not verified this session.
- **Platform-specific behavior claimed from memory.** Before asserting how an API behaves on a specific OS, browser, runtime, or device without checking documentation.
- **"This is the standard way to do X."** Any claim of standard practice requires evidence — official docs, a widely accepted spec, or an authoritative source.
- **Library internals beyond the public interface.** Private methods, undocumented fields, internal modules. Research whether they are accessible and stable.
- **Version-sensitive features.** When behavior differs across versions of a dependency.
- **`research_required: true` flag.** If the incoming subtask strategy explicitly marks research as required.
- **Training-data memory of an external behavior.** If you recall how something works but have not verified it with current documentation, research it.

When any trigger fires, complete the full research workflow before writing implementation code.

## Research Workflow

Execute these steps in order. Stop as soon as you find authoritative evidence at a Primary or Secondary tier (see evidence tiers in the reference). Only proceed to the next step if the current one does not resolve the question.

### Step 1: Resolve the Library

Use `context7_resolve-library-id` with the library name and your specific question:

```
context7_resolve-library-id(libraryName="<official library name>", query="<your question>")
```

Pick the best match by:
- Exact name match to the library you are researching
- Description relevance to your question
- Source reputation (High/Medium preferred)
- Benchmark score (higher is better)
- Version-specific IDs when working with a specific version

### Step 2: Query Documentation

Use `context7_query-docs` with the resolved library ID and your precise question:

```
context7_query-docs(libraryId="<resolved ID>", query="<specific question>")
```

Keep queries focused on a single concept. For questions spanning multiple concepts (e.g., "routing and auth and caching"), make separate calls per concept.

If Context7 does not cover the library, proceed to Step 3.

### Step 3: Search Local Source

If the library's source is available locally in the project, search it directly:

- **Package manager caches:** Check `node_modules/`, `vendor/`, `venv/lib/`, `~/.cargo/registry/`, `.dart_tool/`, or equivalent for the relevant source files.
- **Use `Grep`** to search for function signatures, type definitions, or behavior markers.
- **Use `Glob`** to locate source files by name pattern.

Example: If researching a Rust crate, search `~/.cargo/registry/src/` for the implementation. If researching an npm package, search `node_modules/<package>/`.

### Step 4: Fetch Official Documentation

If Context7 does not cover the library and local source is unavailable, fetch the official documentation directly:

Use `WebFetch` to read the official documentation page. Prefer:
- `https://<project>.dev/docs/` or `<project>.rs` — Rust crate docs
- `https://<project>.com/docs/` — general project docs
- `https://developer.<domain>/` — platform docs (e.g., Apple, Mozilla)
- `https://spec.<domain>/` — specification documents

### Step 5: Verify Version Match

Before using any research finding, confirm the documentation version matches the project's dependency version:

- **npm/Node:** Check `package.json` → `dependencies` or `devDependencies`
- **Rust:** Check `Cargo.toml` → `[dependencies]`
- **Python:** Check `requirements.txt`, `pyproject.toml`, or `Pipfile`
- **Java/Kotlin:** Check `build.gradle` or `pom.xml` (Maven)
- **Go:** Check `go.mod`
- **Dart/Flutter:** Check `pubspec.yaml`
- **Other:** Check the project's standard dependency manifest

If the installed version differs from the documented version, note this discrepancy. Version-specific behavior must cite the correct version's docs.

## Citation Recording

Record every evidence finding using the citation formats from the reference:

### Format

```
{source type}: {path/URL} — {what was verified}
```

Where `{source type}` is one of:

| Source Type | When to Use | Example |
|-------------|-------------|---------|
| `docs` | Official documentation, API reference, specification page | `docs: https://react.dev/reference/react/useEffect — cleanup runs on unmount` |
| `source` | Source code file with line number | `source: packages/runner/src/engine.rs:142-148 — build_context filters expired entries` |
| `commit` | Git commit hash | `commit: a3f2e9c1 — changed sort order to priority-weighted` |
| `issue` | Issue tracker or PR discussion | `issue: https://github.com/org/repo/issues/1234 — confirmed behavior is intentional` |
| `spec` | Formal specification (RFC, ECMA, W3C) | `spec: https://www.rfc-editor.org/rfc/rfc9110 — HTTP caching semantics` |

### Assumption Flag

When no evidence is available at a Primary or Secondary tier:

```
{claim} — assumption, not verified
```

Every external behavior claim in an execution report MUST carry a citation or be explicitly flagged as an unverified assumption. Bare claims with no citation and no flag violate this discipline.

## Escalation

Handle the following situations explicitly:

### Documentation contradicts training-data memory

**Action:** Prefer the documentation. Report the discrepancy in the execution report under a `### Research Evidence` section. Include both the documented behavior and what training data suggested.

### No documentation is accessible

Context7 may not cover the library, official docs may be unavailable, and local source may not exist. In this case:

**Action:** Explicitly flag the claim as `assumption — not verified` in the execution report. Do NOT present it as fact. Do NOT fabricate citations. An honest assumption flag is acceptable. A fake citation is not.

### Research reveals the subtask's assumptions are wrong

If the research findings contradict the assumptions baked into the subtask (e.g., the API signature is different from what the strategy assumed):

**Action:** HALT implementation. Report the finding in the execution report with the evidence that contradicts the assumption. Include the recommended correction. Do NOT proceed with the incorrect assumption — the orchestrator needs this signal to revise the strategy.

### Context7 fails to resolve or query

If `context7_resolve-library-id` or `context7_query-docs` fails or returns no useful results:

**Action:** Fall through to Step 3 (local source) or Step 4 (official docs). Do NOT treat a Context7 failure as "no evidence available" — it is only one of four channels. If all four channels fail, then escalate as "No documentation is accessible" above.
