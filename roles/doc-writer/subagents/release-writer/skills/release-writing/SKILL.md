---
name: release-writing
description: Release documentation method — sources of truth, change categories, entry format, release-notes outline, upgrade-guide structure, verification, checklist, and anti-patterns. Load before writing a changelog, release notes, or upgrade guide.
---

# Release Writing

## 1. Source of truth

The release document describes a diff, not a feeling. Establish the range first:

- Previous release tag and current tag or commit.
- `git log <prev>..<next>` and `git diff --stat <prev>..<next>` for the full change set.
- Merged pull requests and closed issues in the range, for intent and user impact.
- Version files, manifest versions, and the release date from the tag or release record.
- The previous release notes, to keep structure and terminology consistent.

Rules:

- Confirm the version string and date before writing. Never infer a release date from "today".
- Exclude changes that did not ship in this range: reverted commits, unreleased branches,
  dependency bumps with no user impact.
- When history is a squash or a merge, read the pull request body; the commit subject alone is not
  enough.
- Record the exact commands and tags used. If the tag does not exist, stop and report.

## 2. Categories

Use the project's existing categories when it has them. Otherwise:

| Category | Use for | Reader action |
|---|---|---|
| Added | New capability or endpoint | Adopt if needed |
| Changed | Behavior, default, output, performance | Review impact |
| Fixed | Bug fix the reader could hit | Upgrade if affected |
| Removed | Deleted feature, endpoint, flag, export | Locate and replace usage |
| Deprecated | Still works, scheduled for removal | Plan migration |
| Security | Vulnerability fix or hardening | Upgrade now, assess exposure |

Every entry belongs to exactly one category. A breaking change is not just "Changed"; mark it
breaking and say what breaks. Security entries state affected versions and the fixed version, not
exploit details that the project has not published.

## 3. Entry format

One entry, one reader-visible change:

```text
- <Impact sentence in the past tense>. <Action for the reader>. ([#123](link))
```

Rules:

- Start with the user-visible effect, not the internal refactor: "Session cookies now default to
  `SameSite=Lax`", not "Refactored cookie middleware".
- Name the surface: command, endpoint, config key, package, UI.
- State the action: "no action", "rename X to Y", "set Z before upgrading".
- Link the pull request, issue, or commit that carries the evidence.
- Include the version, date, or range when it is not obvious from the section.
- Keep internal-only changes out unless they change operations: migration steps, permissions,
  resource use.
- Never invent a PR number, an issue, or a contributor.

## 4. Release notes outline

```text
# Release X.Y.Z — YYYY-MM-DD

One paragraph: what this release is for and who should upgrade.

## Highlights
Two to five user-visible changes worth reading first.

## Breaking changes
What breaks, who is affected, and the migration pointer. "None" when true.

## Upgrade steps
The complete verified path from the previous supported version; never omit a migration step to shorten the guide.

## Changes
### Added
### Changed
### Fixed
### Removed
### Deprecated
### Security

## Known issues
Open issues with a workaround or a tracking link.

## Verification
The commands or checks that confirm the new version is running.
```

Highlights do not replace the categorized list. Breaking changes appear before upgrade steps, and
upgrade steps appear before the long change list.

## 5. Upgrade guide

Write for the reader who is already on an older version and cannot read the whole diff:

1. Who is affected: versions, configurations, platforms, integrations.
2. Before and after: the behavior, default, or interface that changes.
3. Prerequisites: backup, maintenance window, permissions, dependency versions.
4. Steps: ordered, copyable, with verification after each risky step.
5. Data and configuration migration: commands, reversibility, and expected duration.
6. Verification: the check that proves the new version works.
7. Rollback: how to return to the previous version and what data may be incompatible.
8. Support: where to report a failed upgrade.

For multi-version jumps, state whether direct upgrade is supported or each intermediate version is
required.

## 6. Verification

- Re-read every entry against the diff; delete or fix anything the diff does not support.
- Check every version, tag, date, and link.
- Run the upgrade steps in a disposable environment when possible.
- Confirm the documented commands exist in the new version.
- Check that "known issues" are still open.
- Record what was verified, what was not, and which range it covers.

## 7. Checklist

- [ ] Version, date, and diff range are confirmed from tags and history.
- [ ] Every entry has a category, user-visible impact, action, and evidence link.
- [ ] Breaking changes are called out before upgrade steps.
- [ ] Security entries name affected and fixed versions.
- [ ] Upgrade steps are ordered, copyable, and verified where possible.
- [ ] Rollback is documented when the upgrade touches data or configuration.
- [ ] Known issues are current and link to tracking.
- [ ] No internal refactor is presented as a user-facing feature.
- [ ] No invented PR, issue, contributor, date, or version.

## 8. Anti-patterns

- A changelog that is a raw `git log` dump with commit subjects.
- "Various bug fixes and improvements" with no specifics.
- Burying a breaking change in a long "Changed" list.
- Release notes written before the tag, with a guessed date.
- Upgrade steps that assume a clean install.
- Security notes that reveal an exploit before disclosure.
- Entries that describe the implementation instead of the effect on the user.
- Copying the previous release's structure but forgetting to replace the version everywhere.
- Claiming compatibility that the test matrix does not cover.
