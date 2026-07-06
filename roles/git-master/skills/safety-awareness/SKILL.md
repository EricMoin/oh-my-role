---
name: safety-awareness
description: Classifies git operations as safe or destructive and enforces confirm-before-destruct discipline. Load when planning any operation that could lose commits, overwrite uncommitted work, rewrite shared history, or remove files. This is the most important safety skill.
---

# Git Safety Awareness

Every git operation falls into one of three risk tiers. Classify before acting, and never execute a destructive command without explicitly warning the user and confirming intent.

## Risk Tiers

### Tier 1 — Safe (read-only, no state change)

Inspecting the repository never loses data. Run freely.

- `git status`, `git log`, `git show`, `git diff`, `git diff --staged`
- `git branch`, `git branch -v`, `git tag -l`, `git remote -v`
- `git blame`, `git shortlog`, `git reflog`, `git ls-files`
- `git stash list`, `git worktree list`, `git submodule status`
- `git bisect` (read phases: `log`, `view`)

### Tier 2 — Reversible (state changes, but recoverable)

These change the working tree or refs but leave a reflog trail. Recovery is possible via `git reflog` or `ORIG_HEAD`. Proceed after a quick state check, no hard confirmation needed.

- `git add`, `git restore --staged`, `git commit`, `git commit --amend` (local, unpushed)
- `git switch`, `git checkout <branch>`, `git branch <name>`, `git branch -m`
- `git stash push`, `git stash pop`, `git stash apply`
- `git merge` (non-destructive ff), `git rebase` (local branch)
- `git tag`, `git fetch`, `git pull --rebase`
- `git revert` (creates an undo commit — safe even on shared history)

### Tier 3 — DESTRUCTIVE (potential data loss, history rewrite)

These can lose commits, overwrite uncommitted work, rewrite shared history, or remove untracked files. **STOP. Warn explicitly. Confirm intent before running.**

- `git reset --hard` — discards uncommitted changes AND moves branch pointer (uncommitted work lost)
- `git reset --hard <commit>` — moves branch back, commits after `<commit>` become unreachable (recoverable via reflog only)
- `git clean -fd` / `git clean -fdx` — permanently deletes untracked/ignored files (NOT in reflog, often unrecoverable)
- `git branch -D` / `git branch --delete --force` — force-deletes a branch, losing unmerged commits
- `git push --force` / `git push -f` — overwrites remote history, destroys others' work
- `git push --force-with-lease` — safer than `--force` but still rewrites remote history
- `git checkout <commit> -- <file>` / `git restore --source=<commit>` — overwrites local file content
- `git commit --amend` on an **already pushed** commit — rewrites shared history
- `git rebase` on an **already pushed** branch — rewrites shared history
- `git stash drop` / `git stash clear` — removes stash entries (may be unrecoverable)
- `git tag -d` on a pushed tag (then `git push --delete`)

## The Force-Push Rule

`--force` blindly overwrites the remote. Always prefer `--force-with-lease`,
which aborts if the remote has moved since your last fetch:

```bash
# GOOD — fails safely if someone else pushed
git push --force-with-lease <remote> <branch>

# BAD — silently destroys others' work
git push --force <remote> <branch>
```

`--force-with-lease` is still Tier 3: it rewrites remote history. Confirm first.

## Confirmation Protocol

Before any Tier 3 operation:

1. **State check**: run `git status` and `git log --oneline -5` to ground the decision.
2. **Warn explicitly**: name the command, state what it destroys, and that it may be unrecoverable.
3. **Confirm intent**: get explicit user confirmation before executing.
4. **Offer the safer alternative** when one exists (e.g. `revert` over `reset --hard`; `--force-with-lease` over `--force`; `reset --soft`/`--mixed` over `--hard`).

## Safer Alternatives Cheat Sheet

| Destructive intent | Prefer this instead |
|---|---|
| Undo a pushed commit | `git revert <commit>` (new undo commit, history preserved) |
| Unstage everything, keep work | `git reset` (mixed, default) not `--hard` |
| Undo last commit, keep changes | `git reset --soft HEAD~1` not `--hard` |
| Remove untracked files | `git clean -nd` (dry-run) first, then `-fd` only after review |
| Rewrite pushed history | Don't, unless coordinating with all collaborators |
| Force push | `git push --force-with-lease` (never bare `--force`) |

## Recovery Last Resort

If a destructive op already ran, check the reflog before assuming loss:

```bash
git reflog                  # find the SHA before the destructive op
git reset --hard <sha>      # restore (still Tier 3 — confirm)
```

Reflog covers ref-moves (reset, rebase, amend, branch -D within reflog expiry). It does NOT cover `git clean` or stash `drop`/`clear` — those are often truly gone.
