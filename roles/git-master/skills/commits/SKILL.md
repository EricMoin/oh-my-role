---
name: commits
description: Creating and editing commits — conventional commit messages, amend, and fixup. Load when writing commit messages or modifying existing commits.
---

# Commits & Conventional Commits

## Create a Commit

```bash
git commit -m "<message>"
git commit -m "<subject>" -m "<body>"   # subject + body as separate -m flags
git commit                            # opens editor for multi-line message
git commit -a                          # stage tracked modifications AND commit (skip add)
git commit -am "<message>"             # combined: stage tracked + commit
```

`git commit -a` skips `git add` for already-tracked files. It does NOT stage new (untracked) files. Prefer explicit `git add` for clarity.

## Conventional Commits Format

Default to this format. It enables changelogs, semantic versioning, and readable history.

```
<type>(<optional scope>): <subject>

<body>

<footer(s)>
```

### Types

| Type | When to use |
|------|-------------|
| `feat` | A new feature (user-visible) |
| `fix` | A bug fix (user-visible) |
| `docs` | Documentation only |
| `style` | Formatting, whitespace, no code change |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `test` | Adding or correcting tests |
| `build` | Build system, dependencies, tooling |
| `ci` | CI configuration and scripts |
| `chore` | Routine tasks, no production code change |
| `revert` | Reverting a previous commit |

### Rules

- **Subject**: imperative mood ("add" not "added"), lowercase, no trailing period, ≤50 chars ideally.
- **Scope** (optional): `feat(api): ...`, `fix(auth): ...`.
- **Body**: explain *why*, not *what* (the diff shows what). Wrap at ~72 chars.
- **Breaking change**: append `!` to type/scope (`feat!:`) or use `BREAKING CHANGE:` footer.
- **Reference issues**: footer `Closes #123`, `Refs #456`.

### Examples

```
feat(auth): add OAuth2 login flow

Adds Google and GitHub providers via passport-oauth2. Token refresh
handled by a background timer. Falls back to session cookie when OAuth
is unavailable.

Closes #142
```

```
fix(parser): handle empty input without crashing

Guard against null token stream before the reduce step. Previously an
empty file triggered a TypeError at line 87.

Fixes #203
```

```
refactor!: rename config.load to config.parse

Breaking change: callers must update import name. Migration is
mechanical — see MIGRATION.md.

BREAKING CHANGE: config.load renamed to config.parse
```

## Amend (Tier 2 if local, Tier 3 if pushed)

`git commit --amend` rewrites the most recent commit. Use it to fix the last commit's message or add a forgotten file.

```bash
git commit --amend                       # edit last commit message
git commit --amend --no-edit             # keep message, fold in staged changes
git add <forgotten-file> && git commit --amend --no-edit
git commit --amend -m "new message"       # replace message
git commit --amend --author="Name <e>"    # fix author
```

**Amend rules:**
- Local/unpushed branch → safe, Tier 2.
- Already pushed → Tier 3: rewrites shared history, requires `--force-with-lease` to push. Coordinate with collaborators.

Never amend a merge commit or a commit others have built on.

## Fixup & Autosquash

Tidy history by squashing a follow-up into an earlier commit:

```bash
git commit --fixup=<target-sha>          # create a fixup commit
git commit --fixup=:/<subject>           # fixup matching a commit by subject
git rebase -i --autosquash <base>        # reorder fixups next to targets, squash them
```

`--autosquash` automatically moves `fixup!` commits adjacent to their target and marks them `fixup` in the todo list.

## Empty / Trivial Commits

```bash
git commit --allow-empty -m "chore: trigger deploy"   # empty commit (e.g. CI trigger)
git commit --allow-empty-message -m ""                # rarely needed
```

## Amend Gotchas

- `--amend` only touches the **last** commit. For older commits, use interactive rebase.
- Amending after pushing rewrote history → next push needs `--force-with-lease` (Tier 3, confirm).
- If unsure whether the commit was pushed, check `git status` (shows ahead/behind) and `git log @{u}..`.
