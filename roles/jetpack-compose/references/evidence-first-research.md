# Evidence Policy — Jetpack Compose / Android

The research workflow lives in `skills/android-source-research/SKILL.md`; source lookup
mechanics live in `references/source-research.md`. This reference owns evidence quality
and citation rules for the lead and reviewers.

## Match Evidence to the Claim

| Claim | Appropriate evidence |
| --- | --- |
| Project's resolved dependency | Gradle resolution output for the relevant variant/configuration; declarations establish intent |
| Supported public API or migration | Current official documentation/release notes, checked against the project's version |
| Internal library behavior | Published sources for the resolved artifact or a verified matching repository revision |
| Platform behavior | Framework source for the relevant build/API level, plus compatibility wrappers where applicable |
| Observed runtime/performance result | Executed reproduction or measurement with build, device, scenario and result |
| Known issue | Issue status and affected/fixed versions actually inspected, corroborated when material |

Context7 is a retrieval channel, not an authority by itself: prefer official upstream
content in its results. Use `resolve-library-id` before `query-docs` unless the user gave
an exact library ID. Query one coherent concept at a time, reuse already verified results,
and fall back to official sites when coverage is missing. Do not fabricate IDs.

Repository development branches help navigation but do not prove released behavior.
Release notes are primary evidence of announced changes; an exact source artifact is
better evidence of implementation than a general guide. No fixed tier ordering overrides
version relevance or an observed contradiction. Community posts and model recall are
leads, not final proof.

## Research Triggers

Verify unfamiliar APIs, version-sensitive configuration, platform-specific behavior,
undocumented edge cases, disputed source behavior and performance claims. Use Context7
for library, SDK and CLI documentation questions even when the API seems familiar.
Reading local files, reviewing business logic and applying established project patterns
need no unrelated documentation lookup. A performance improvement requires measurement;
documentation alone cannot establish that a particular app became faster.

## Citation Contract

Record the claim and its scope beside the evidence. These are templates, not findings:

```text
docs: <official URL> — accessed <YYYY-MM-DD> — <verified claim and version scope>
source: <repository URL pinned to verified revision>:<line> — <artifact/version; verified claim>
source: <local source archive path>!/<entry>:<line> — <resolved coordinate; verified claim>
release: <official release-note URL> — <affected version and announced change>
issue: <inspected issue URL> — <status, affected/fixed versions and verified observation>
experiment: <result artifact> — <command, build/device, expected and actual result>
[assumption: not verified — <missing evidence and its consequence>]
```

Use real file paths, line numbers, revisions and issue IDs that were inspected. Do not
turn placeholders into plausible-looking citations. A moving branch URL must be labeled
as such; prefer a commit permalink for a reproducible source finding. A code snippet or
sample in this role is guidance, not proof that it compiles against the user's project.

## Report Quality

- Separate project facts, external behavior claims, observed results and inference.
- Cite material external behavior claims; reuse a citation for related claims it supports.
- State unresolved assumptions instead of inventing certainty or requesting discoverable facts.
- Record a documentation/source mismatch and investigate the applicable version; do not
  automatically prefer the newer page or a different release's implementation.
- Report what was actually executed. A planned test, configured benchmark, build success
  or uninspected capture cannot stand in for observed runtime behavior.
