---
name: stash
description: Stashing shelved changes — push, pop, apply, list, drop, clear, and keep-index. Load when temporarily shelving uncommitted work.
---

# Git Stash

Stash shelves uncommitted changes (staged and unstaged) to restore a clean working tree, then reapplies them later. Untracked files are NOT stashed by default.

## Basic

```bash
git stash                           # stash tracked changes (message auto-generated)
git stash push -m "wip: login form" # stash with a descriptive message
git stash list                       # list all stashes (stash@{0} is most recent)
git stash show                       # summary of latest stash
git stash show -p                    # full diff of latest stash
git stash show stash@{2}             # inspect a specific stash
```

## Restore

```bash
git stash pop                        # apply latest + DROP it (conflicts leave it in place)
git stash apply                      # apply latest + KEEP it in the stash list
git stash apply stash@{1}            # apply a specific stash, keep it
git stash pop stash@{1}              # apply + drop a specific stash
```

- **`pop`** = apply then drop. If the apply hits a conflict, the stash is NOT removed (so you can resolve safely).
- **`apply`** = apply but keep the stash. Safer when you want to reuse the stash on multiple branches.

## Stash Everything (incl. Untracked & Ignored)

```bash
git stash -u                         # include untracked files
git stash --include-untracked         # same as -u
git stash -a                         # include untracked AND ignored files
```

## Stash with keep-index

Stash everything EXCEPT what's already staged — useful for committing staged work and stashing the rest:

```bash
git add <files-to-commit>
git stash --keep-index                # stash unstaged work, leave staged intact
git commit -m "..."                   # commit only the staged portion
git stash pop                         # bring back the rest
```

## Partial Stash

```bash
git stash push -p                     # interactively select hunks to stash
git stash push <file1> <file2>         # stash only specific files
git stash push -p -m "partial" <file>  # partial + message + file scope
```

## Drop / Clear (Tier 3)

Dropped stashes are NOT in the reflog and are often unrecoverable. Confirm before dropping.

```bash
git stash drop                       # drop stash@{0}
git stash drop stash@{2}             # drop a specific stash
git stash clear                       # drop ALL stashes (Tier 3 — confirm)
```

## Create a Branch from a Stash

If stashed changes conflict on the original branch, branch off the stash's parent:

```bash
git stash branch <new-branch> [stash@{n}]   # creates branch from stash's base, applies stash, drops it
```

## Workflow Patterns

**Context switch quickly:**
```bash
git stash push -u -m "wip: feature A"
git switch main
# ... fix a bug, commit, push ...
git switch feature-a
git stash pop
```

**Stash, switch, test, restore:**
```bash
git stash --keep-index    # keep staged work, stash the rest
# run tests on the staged snapshot
git stash pop             # bring back the unstaged work
```

## Verify

```bash
git stash list            # what's shelved
git status                # clean tree after stash (unless -u untracked remain)
```

> `git stash` does not stash untracked files by default. New files you `git add`ed but not committed ARE stashed (they're staged). Truly untracked files need `-u`.
