---
name: merging-rebasing
description: Merging (ff/no-ff/squash, abort) and rebasing (interactive/regular, continue/skip/abort) plus full conflict resolution guidance. Load when integrating branches or resolving merge/rebase conflicts.
---

# Merging, Rebasing & Conflict Resolution

## Merge

```bash
git merge <branch>                        # merge <branch> into current (fast-forward if possible)
git merge --no-ff <branch>                # force a merge commit even when ff is possible
git merge --ff-only <branch>              # merge only if it can fast-forward; else abort
git merge --squash <branch>               # stage changes, no merge commit (commit afterward)
git merge --abort                          # abort a conflicted merge, restore pre-merge state
git merge --continue                       # continue after conflicts are resolved & staged
```

**Strategy choice:**
- `--ff` (default): linear history when possible. Clean, but loses the "this was a branch" record.
- `--no-ff`: always creates a merge commit. Preserves branch topology — good for feature branches.
- `--squash`: collapses a branch's commits into one staged change. Use for tidy single-commit features; loses individual commit history.

## Rebase

Replay your commits on top of another base. Rewrites your branch history (Tier 3 if pushed — confirm).

```bash
git rebase <base>                          # replay current branch onto <base>
git rebase -i <base>                       # INTERACTIVE: reorder, squash, reword, edit, drop
git rebase --onto <new-base> <old-base> <branch>  # advanced: move a range of commits
git rebase --abort                          # bail out, restore pre-rebase state
git rebase --continue                       # after resolving a conflict
git rebase --skip                           # drop the commit that conflicts
```

### Interactive Rebase Todo Commands

| Command | Effect |
|---------|--------|
| `pick` / `p` | keep the commit |
| `reword` / `r` | keep, but edit the commit message |
| `edit` / `e` | pause to amend the commit contents |
| `squash` / `s` | combine with previous; edit combined message |
| `fixup` / `f` | combine with previous; discard this message |
| `drop` / `d` | remove the commit |
| `exec` / `x` | run a shell command at this point |

### When to Rebase vs Merge

- **Rebase** your own feature branch onto latest main before opening a PR → linear, clean history. Only when the branch is private (not pushed/shared, or you coordinate force-push).
- **Merge** main into a shared branch, or when you want to preserve branch history. Never rewrite shared history with rebase.

**Golden rule:** Do not rebase commits that others have already pulled. Rebase rewrites SHAs; collaborators will get conflicts and duplicate commits.

## Conflict Resolution

Conflicts occur when two changes touch the same lines. Git marks them:

```
<<<<<<< HEAD
your current change (ours)
=======
the incoming change (theirs)
>>>>>>> <branch-name>
```

### Resolution Steps

1. **See what conflicted:**
   ```bash
   git status                    # lists conflicted files (both modified)
   git diff                       # shows conflict markers
   ```
2. **Edit each conflicted file** — remove the `<<<<<<<`, `=======`, `>>>>>>>` markers, keeping the correct combination of both sides.
3. **Stage the resolved files:**
   ```bash
   git add <resolved-file>
   ```
4. **Continue the operation:**
   ```bash
   git merge --continue          # or: git commit (for merges)
   git rebase --continue          # for rebases
   ```
   Or abort to start over: `git merge --abort` / `git rebase --abort`.

### Inspecting Both Sides

```bash
git diff --ours                   # your side vs the merge base
git diff --theirs                 # incoming side vs the merge base
git diff --base                   # both sides vs the common ancestor
git show :1:<file>                # common ancestor version (stage 1)
git show :2:<file>                # our version (stage 2)
git show :3:<file>                # their version (stage 3)
```

### Taking One Side Wholesale

When you want to keep one side entirely for a file:

```bash
# During a merge conflict
git checkout --ours <file> && git add <file>      # keep ours
git checkout --theirs <file> && git add <file>    # keep theirs

# Modern equivalent
git restore --staged --worktree --ours <file>
git restore --staged --worktree --theirs <file>
```

### Using a Merge Tool

```bash
git mergetool                    # launches configured tool (e.g. meld, vimdiff, VS Code)
git config --global merge.tool <tool>
```

## Rebase Conflict Loop

Rebase replays commits one at a time, so conflicts can recur per commit:

```
conflict → resolve → git add → git rebase --continue
                ↑                              │
                └──── (next commit may conflict) ┘
```

- `git rebase --skip` to drop a commit that should be discarded.
- `git rebase --abort` to abandon and return to the pre-rebase state.

## Verify Before & After

```bash
# Before
git status -sb
git log --oneline -5

# After a successful merge/rebase
git log --oneline --graph -10      # confirm the history shape
git status                          # clean tree expected
```
