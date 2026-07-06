---
name: branches
description: Branch lifecycle — create, list, switch/checkout, delete, rename, and track upstream. Load when managing branches.
---

# Branch Management

## List Branches

```bash
git branch                       # local branches (* marks current)
git branch -v                    # local + last commit on each
git branch -a                    # all: local + remote-tracking
git branch -r                    # remote-tracking only
git branch -vv                   # verbose: shows upstream tracking + ahead/behind
git branch --merged              # branches merged into HEAD
git branch --no-merged           # branches not yet merged
git branch --list 'feat-*'       # glob filter
```

## Create a Branch

```bash
git branch <name>                        # create from current HEAD (don't switch)
git branch <name> <start-point>          # create from a commit/tag/branch
git switch -c <name>                     # create AND switch (modern, git 2.23+)
git switch -c <name> <start-point>       # create+switch from a base
git checkout -b <name>                   # create+switch (legacy)
```

Prefer `git switch` over `git checkout` for branch switching — it does one thing and is unambiguous.

## Switch Branches

```bash
git switch <branch>                      # switch to existing branch
git switch -                             # switch back to previous branch
git checkout <branch>                     # legacy equivalent
```

**Uncommitted changes block switching.** Options:
- `git stash` then switch (see `stash` skill)
- `git switch <branch>` will carry clean changes forward if they don't conflict; it aborts if they would.
- Commit or discard (Tier 2/3) first.

## Delete Branches

```bash
git branch -d <name>                     # safe delete: refuses if not merged (Tier 2)
git branch -D <name>                     # FORCE delete, even if unmerged (Tier 3 — CONFIRM)
git push <remote> --delete <branch>      # delete remote branch (Tier 3 — confirm)
git push <remote> :<branch>              # legacy syntax for remote delete
```

`-d` (lowercase) protects you: it refuses to delete a branch with unmerged commits.
`-D` (uppercase) overrides that safety. Use `-D` only when you are certain the commits are
unneeded or exist elsewhere (reflog/another branch). Warn explicitly before `-D`.

## Rename a Branch

```bash
git branch -m <new-name>                 # rename current branch
git branch -m <old> <new>                # rename any branch
```

After renaming a branch that has been pushed, the remote still has the old name:

```bash
git push <remote> -u <new-name>           # push the new name + set upstream
git push <remote> --delete <old-name>     # remove the old remote branch (Tier 3)
```

## Track / Set Upstream

```bash
git switch <branch>                      # if a remote-tracking branch matches, auto-tracks it
git branch -u <remote>/<branch>          # set upstream for current branch
git branch --set-upstream-to=<remote>/<branch>
git push -u <remote> <branch>            # push AND set upstream in one step
git branch -vv                           # verify upstream + ahead/behind
```

## Default Branch & HEAD

```bash
git symbolic-ref HEAD                    # current branch ref
git symbolic-ref refs/heads/main        # ... or check a specific default
git init -b main                         # init a new repo with 'main' as default
```

## Common Workflows

**Start a feature off the latest main:**
```bash
git switch main && git pull --rebase
git switch -c feat/my-feature
# ... work, commit ...
git push -u origin feat/my-feature
```

**Clean up merged feature branches:**
```bash
git switch main
git pull --rebase
git branch --merged main | grep -v '^\*\|main\|master'   # list merged (excluding current/main)
git branch -d <merged-branch>                            # safe delete
```

**Recover a just-deleted branch (reflog):**
```bash
git reflog                  # find the SHA the branch pointed to
git branch <name> <sha>     # recreate the branch at that commit
```
