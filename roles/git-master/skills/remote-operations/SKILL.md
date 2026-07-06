---
name: remote-operations
description: Remote repository management — remote add/remove/rename, fetch, pull (merge/rebase), and push (with --force-with-lease safety). Load when syncing with remotes.
---

# Remote Operations

## Manage Remotes

```bash
git remote -v                           # list remotes with URLs
git remote show origin                  # details: branches, tracking, stale
git remote add <name> <url>             # add a remote
git remote rename <old> <new>           # rename
git remote remove <name>                # remove (does not delete remote repo)
git remote set-url <name> <url>         # change the URL
git remote set-url --push <name> <url>  # set a distinct push URL
```

## fetch (safe — never changes working tree)

```bash
git fetch                               # fetch from upstream of current branch
git fetch <remote>                      # fetch all branches from a remote
git fetch <remote> <branch>             # fetch one branch
git fetch --all                         # fetch from all remotes
git fetch --prune                       # remove stale remote-tracking branches deleted upstream
git fetch --tags                        # fetch tags too
git fetch --prune --tags                # prune + tags, healthy habit
```

`fetch` only updates remote-tracking branches (`origin/main`), never your local branches or working tree. Always safe (Tier 1).

Make prune a default habit:

```bash
git config --global fetch.prune true
```

## pull (fetch + integrate)

```bash
git pull                                # fetch + merge upstream into current
git pull --rebase                       # fetch + rebase (recommended: linear history)
git pull --ff-only                      # only fast-forward, else abort
git pull <remote> <branch>
```

**Prefer `git pull --rebase`** to avoid noisy merge commits when your local branch is behind. Set as default:

```bash
git config --global pull.rebase true
git config --global rebase.autoStash true   # auto-stash dirty tree during rebase
```

## push

```bash
git push                                # push current branch to upstream (if tracking)
git push <remote> <branch>              # push to a specific remote/branch
git push -u <remote> <branch>           # push + set upstream (first time)
git push --tags                         # push tags (see tags skill)
git push --follow-tags                  # push commits + reachable annotated tags
git push --force-with-lease             # SAFER force push (Tier 3 — confirm)
git push --force-with-lease=<branch>:<expect-sha>  # extra-safe: only if remote matches expect
git push --force                        # DESTRUCTIVE — avoid, prefer --force-with-lease
git push --all                          # push all branches
git push --delete <remote> <branch>     # delete a remote branch (Tier 3 — confirm)
```

## The Force-Push Rule (Tier 3 — always confirm)

`--force` blindly overwrites the remote, destroying any commits others pushed. **Always prefer `--force-with-lease`**, which aborts if the remote has advanced since your last fetch:

```bash
# GOOD — refuses to overwrite if someone else pushed
git push --force-with-lease

# BAD — silently destroys collaborators' work
git push --force
```

Even `--force-with-lease` rewrites remote history — confirm with the user first, and coordinate with anyone sharing the branch. **Never** force-push to shared/protected branches like `main`.

## Common Workflows

**First push of a new branch:**
```bash
git push -u origin feat/my-feature
```

**Sync with upstream (clean linear history):**
```bash
git fetch --prune
git pull --rebase
git push
```

**Recover after a force-pushed remote:**
```bash
git fetch
git reset --hard origin/<branch>      # discard local diverged commits (Tier 3 — confirm)
# OR rebase your local commits on top:
git pull --rebase
```

## Verify

```bash
git remote -v
git branch -vv                          # upstream tracking + ahead/behind
git fetch --prune && git status -sb     # current sync state
```
