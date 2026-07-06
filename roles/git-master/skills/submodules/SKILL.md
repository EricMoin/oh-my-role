---
name: submodules
description: Git submodules — add, update, init, deinit, and sync nested repositories. Load when managing embedded repositories.
---

# Git Submodules

A submodule embeds one git repository inside another. The parent stores a gitlink (commit pointer) plus a `.gitmodules` file mapping the path to its URL.

## Add a Submodule

```bash
git submodule add <repo-url> <path>          # clone as submodule
git submodule add -b <branch> <url> <path>   # track a branch
git submodule add --depth 1 <url> <path>     # shallow clone
```

This clones the repo at `<path>`, records it in `.gitmodules`, and stages both the gitlink and `.gitmodules`.

## Initialize & Update (after cloning a parent)

Cloning a parent repo does NOT fetch submodule contents by default:

```bash
git submodule init                           # register submodules from .gitmodules
git submodule update                         # checkout the recorded commit in each
git submodule update --init                   # combined: init + update
git submodule update --init --recursive       # recurse into nested submodules
git clone --recurse-submodules <url>         # clone parent + submodules in one step
git clone --recurse-submodules --shallow-submodules <url>
```

Set recurse on clone/update as a habit:

```bash
git config --global submodule.recurse true
```

## Update Submodules to Latest

```bash
git submodule update --remote                # fetch + checkout latest of tracked branch
git submodule update --remote --merge        # merge into checked-out submodule
git submodule update --remote --rebase       # rebase into checked-out submodule
```

After updating, the parent's gitlink changes — commit it:

```bash
git add <submodule-path>
git commit -m "chore: bump submodule <name>"
```

## List & Inspect

```bash
git submodule status                         # path, SHA, tracked-branch flag, dirty marker
git submodule summary                        # changes in submodules since last commit
git config --file=.gitmodules --list         # raw .gitmodules contents
```

## Make Changes Inside a Submodule

```bash
cd <submodule-path>
# ...make changes, commit, push inside the submodule...
cd ..
git add <submodule-path>                     # record the new gitlink in the parent
git commit -m "chore: update submodule pointer"
```

Commits made inside a submodule belong to the submodule repo. The parent only tracks the commit SHA, so you must push from within the submodule, then commit the pointer in the parent.

## sync (after a submodule URL change)

```bash
git submodule sync                           # update local config from .gitmodules
git submodule sync --recursive
git submodule update --init --recursive       # then re-fetch
```

## deinit / Remove (Tier 2/3 — removes the working copy)

```bash
git submodule deinit <path>                  # unregister (keeps .git/modules entry)
git rm <path>                                # remove from index + working tree
rm -rf .git/modules/<name>                    # purge the stored submodule data
git commit -m "chore: remove submodule <name>"
```

`deinit -f` force-removes even with local changes. Removing `.git/modules/<name>` makes the removal permanent — confirm before doing so.

## Common Pitfalls

- **Detached HEAD in submodules** is normal — `update` checks out the recorded commit, not a branch. To develop, `cd` in and `git switch <branch>` first.
- **Forgetting to commit the parent pointer** after changing a submodule leaves the parent tree dirty.
- **Nested submodules** need `--recursive` on init/update/sync.

## Verify

```bash
git submodule status
git submodule summary
```
