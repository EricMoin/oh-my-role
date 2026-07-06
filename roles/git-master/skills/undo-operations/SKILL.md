---
name: undo-operations
description: Undoing changes — reset (--soft/--mixed/--hard), revert, and restoring files from older commits. Load when undoing commits or changes. Pay close attention to the destructive reset --hard.
---

# Undo Operations

Three tools, three different intents. Pick by what you want to preserve and whether the commit was already pushed.

## reset — move the branch pointer (local history rewrite)

`git reset` moves the current branch pointer and optionally changes the index/working tree.

| Mode | Branch | Index | Working tree | Effect |
|------|--------|-------|--------------|--------|
| `--soft` | moves | unchanged | unchanged | Undo the commit, changes stay staged |
| `--mixed` (default) | moves | reset to HEAD | unchanged | Undo the commit, changes stay unstaged |
| `--hard` | moves | reset to HEAD | reset to HEAD | **Discard everything** (Tier 3) |

```bash
git reset --soft HEAD~1                 # undo last commit, keep changes staged
git reset HEAD~1                        # = --mixed: undo commit, keep changes unstaged
git reset --hard HEAD~1                 # DESTROY last commit + working changes (Tier 3 — CONFIRM)
git reset --hard ORIG_HEAD              # undo the last destructive reset/merge (safety net)
git reset <file>                         # unstage a file (= restore --staged), no commit undo
git reset                                # unstage everything, mixed, HEAD unchanged
```

**reset rewrites history.** Only use it on local/unpushed commits. For shared (pushed) history, use `revert`.

## revert — add an undo commit (safe for shared history)

`git revert` creates a NEW commit that reverses a given commit. History is preserved, so it's safe on pushed/shared branches.

```bash
git revert <commit>                     # revert one commit, opens editor for message
git revert <c1> <c2>                     # revert multiple
git revert HEAD                         # revert the last commit
git revert --no-commit <commit>         # stage the revert without committing
git revert -n <c1>..<c2>                # revert a range, no commit
git revert --continue                    # after resolving conflicts
git revert --abort                      # abandon a conflicted revert
git revert --skip                       # skip the current conflicted revert, move on
```

Reverting a merge commit needs `-m` (mainline) to say which parent to restore to:

```bash
git revert -m 1 <merge-commit>          # restore to first parent (the branch you merged into)
```

## restore files from an older commit

```bash
# Modern (git 2.23+)
git restore --source=<commit> <file>            # overwrite working tree with old version
git restore --source=<commit> --staged <file>   # overwrite index too
git restore --source=<commit> --worktree --staged <file>  # both (Tier 2 — overwrites local)

# Legacy
git checkout <commit> -- <file>                 # restore file from a commit (overwrites)
git checkout HEAD -- <file>                     # discard working changes to a file
```

Restoring a file from an old commit **overwrites** the current working-tree version of that file (Tier 2/3 if there are uncommitted changes). Warn before overwriting.

## Decision Guide

| Situation | Use |
|-----------|-----|
| Undo last commit, keep work, NOT pushed | `git reset --soft HEAD~1` |
| Undo last commit, keep work, but unstage | `git reset HEAD~1` (mixed) |
| Undo + discard everything (local only) | `git reset --hard HEAD~1` (Tier 3, confirm) |
| Undo a commit that's ALREADY pushed | `git revert <commit>` (safe) |
| Discard working-tree changes to a file | `git restore <file>` (Tier 2) |
| Restore a file from an old commit | `git restore --source=<commit> <file>` |
| Undo the last destructive op | `git reset --hard ORIG_HEAD` (Tier 3) |

## Recovery (if reset --hard ran by mistake)

```bash
git reflog                  # find the SHA before the reset
git reset --hard <sha>      # restore (Tier 3 — confirm)
```

`ORIG_HEAD` is a convenient shortcut for the state just before the last merge/reset/rebase — check it before digging through the reflog.
