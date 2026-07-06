---
name: working-tree
description: Working tree and staging area operations — status, add (stage), restore/unstage, clean, and diff (staged/unstaged). Load when inspecting or modifying the working tree and index.
---

# Working Tree & Staging Area

The working tree is your checked-out files. The index (staging area) holds the snapshot that the next commit will record. Most day-to-day git work is moving changes between these two.

## Inspect State

```bash
git status                       # full status: staged, unstaged, untracked
git status -sb                    # compact: branch + short status
git status -s                     # short status only
```

## Stage Changes (add)

```bash
git add <file>                    # stage one file
git add <file1> <file2>           # stage multiple
git add .                         # stage all changes in current dir (incl. new)
git add -u                         # stage modifications/deletions, NOT new files
git add -A                         # stage everything (tracked + untracked)
git add -p                         # interactive patch staging — stage hunks selectively
```

`git add -p` is the precision tool: it walks each hunk and asks whether to stage it. Prefer it when a file mixes unrelated changes.

## Unstage / Restore

```bash
# Modern (git 2.23+)
git restore --staged <file>       # unstage a file, keep its content
git restore --staged .            # unstage everything
git restore <file>                # discard working-tree changes (Tier 2)
git restore --source=HEAD~1 <f>   # restore a file from an older commit

# Legacy equivalents
git reset HEAD <file>             # unstage (= restore --staged)
git checkout -- <file>            # discard changes (= restore, without staging flag)
```

`git restore <file>` (discarding working-tree changes) is **Tier 2 → bordering Tier 3**: uncommitted edits are lost. Warn before discarding.

## Clean Untracked Files (Tier 3)

`git clean` permanently deletes untracked files — NOT recoverable via reflog. Always dry-run first.

```bash
git clean -n                      # dry-run: list what WOULD be removed
git clean -nd                     # dry-run + directories
git clean -fd                     # remove untracked files + directories (CONFIRM)
git clean -fdx                    # also remove ignored files (CONFIRM, removes build artifacts)
git clean -i                      # interactive — safest, walks each path
```

Order of operations: `git clean -nd` (review) → confirm with user → `git clean -fd`.

## Diff

```bash
git diff                          # working tree vs index (unstaged changes)
git diff --staged                 # index vs HEAD (staged changes)  [alias: --cached]
git diff HEAD                     # working tree vs HEAD (all changes, staged+unstaged)
git diff <file>                   # diff a single file
git diff --stat                   # summary: files + insertions/deletions
git diff <commit> <commit>        # diff between two commits
git diff <branch>..<branch>       # diff between two branches
git diff --name-only              # just the changed file names
```

## Workflow Patterns

**Review before committing** — never commit blind:

```bash
git status -sb
git diff --staged                 # what WILL be committed
git diff                          # what will be left out
```

**Split a mixed file across two commits** using patch staging:

```bash
git add -p <file>                 # stage the first logical group of hunks
git commit -m "feat: first concern"
git add -p <file>                 # stage the rest
git commit -m "refactor: second concern"
```

**Accidentally staged too much:**

```bash
git restore --staged <file>       # unstage, content preserved
```
