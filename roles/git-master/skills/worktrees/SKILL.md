---
name: worktrees
description: Git worktrees — add, list, and remove linked working trees sharing one repository. Load when working on multiple branches simultaneously without cloning.
---

# Git Worktrees

A worktree is an extra working directory linked to the same repository. Each can be on a different branch simultaneously, sharing the object database — no extra clone needed.

## add

```bash
git worktree add <path> <branch>             # check out existing branch in a new worktree
git worktree add <path> -b <new-branch>      # create a new branch + worktree
git worktree add <path> <branch> --detach    # detached HEAD (for experimentation)
git worktree add --no-checkout <path> <branch>  # set up worktree without checking out files
git worktree add -B <branch> <path>          # create/reset a branch + worktree
```

The path must not already exist (or be empty). The main repository's working tree is worktree 0 and cannot be removed.

## list

```bash
git worktree list                           # all linked worktrees + their checked-out branches
git worktree list --porcelain               # machine-readable
```

Output example:
```
/path/to/repo            abc1234 [main]
/path/to/repo-hotfix     def5678 [hotfix/urgent]
```

## remove

```bash
git worktree remove <path>                  # remove a worktree (must be clean, or --force)
git worktree remove --force <path>          # remove even with uncommitted changes (Tier 3 — confirm)
git worktree prune                          # clean up stale admin files for deleted worktrees
git worktree prune --dry-run                # preview what would be pruned
```

`remove --force` discards uncommitted changes in that worktree — confirm first.

## lock / unlock

Lock a worktree to prevent it from being pruned (e.g. on a removable/network drive):

```bash
git worktree lock <path> --reason "on external drive"
git worktree unlock <path>
```

## When to Use Worktrees

- **Long-running review** while you keep coding on `main` in the primary worktree.
- **Trying an experimental branch** without disturbing your working directory or stashing.
- **Running tests/CI on one branch while editing another** — each worktree is an independent tree.
- **Sparse/heavy builds**: avoid `clean`/`checkout` churn by keeping builds per-branch.

## Common Workflows

**Quick hotfix without disturbing current work:**
```bash
git worktree add ../repo-hotfix -b hotfix/urgent main
cd ../repo-hotfix
# ... fix, commit, push ...
cd -
git worktree remove ../repo-hotfix
```

**Verify before removing:**
```bash
git worktree list
cd <worktree-path> && git status      # ensure clean before remove
git worktree remove <worktree-path>
git worktree prune
```

## Pitfalls

- A branch can be checked out in **only one worktree at a time**. To work on the same branch elsewhere, use `--detach` or create a new branch.
- Removing a worktree's directory manually (without `git worktree remove`) leaves stale admin files — run `git worktree prune` to clean up.
- Submodules inside a worktree still need `git submodule update --init`.

## Verify

```bash
git worktree list
```
