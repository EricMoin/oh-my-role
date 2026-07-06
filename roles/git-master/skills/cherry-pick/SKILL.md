---
name: cherry-pick
description: Apply specific commits from one branch onto another. Load when porting an individual commit (or range) without merging the whole branch.
---

# Cherry-Pick

Cherry-pick applies the changes from an existing commit (or range of commits) onto your current branch, creating new commits with the same changes.

## Basic

```bash
git cherry-pick <commit>                 # apply one commit
git cherry-pick <c1> <c2> <c3>           # apply several, in order
git cherry-pick <start>..<end>           # apply a range (start exclusive, end inclusive)
git cherry-pick <start>^..<end>          # range including the start commit
```

## Options

```bash
git cherry-pick -x <commit>             # record "(cherry picked from <sha>)" in message
git cherry-pick -s <commit>             # add Signed-off-by trailer
git cherry-pick --no-commit <commit>     # apply changes to index, don't commit (stage for editing)
git cherry-pick -n <c1> <c2>             # --no-commit, combine multiple into staged changes
git cherry-pick --edit <commit>         # edit the commit message before committing
git cherry-pick --continue               # after resolving conflicts
git cherry-pick --skip                   # skip the current conflicted commit
git cherry-pick --abort                  # abandon, return to pre-cherry-pick state
git cherry-pick --quit                   # stop but keep current state (don't reset)
```

## Conflict Resolution

Cherry-pick applies commits one at a time; conflicts halt the sequence:

1. `git status` — see conflicted files.
2. Edit each file, remove conflict markers, keep the correct resolution.
3. `git add <resolved-files>`.
4. `git cherry-pick --continue` — moves to the next commit (or finishes).
5. To skip a commit entirely: `git cherry-pick --skip`. To abandon: `git cherry-pick --abort`.

## When to Use Cherry-Pick

- **Backport a fix**: apply a bug-fix commit from `main` onto a `release-1.x` branch.
- **Port a feature**: move one commit from an abandoned branch onto a fresh branch.
- **Selective merge**: take a couple of commits without pulling an entire branch's history.

## Cautions

- Cherry-picked commits get **new SHAs** — they are not the same commit objects. If you later merge the source branch, git may detect the duplicate (via patch-id) but conflicts can still occur.
- Avoid cherry-picking merge commits unless you understand parent numbering (`-m <parent>`).
- For moving many commits, consider `git rebase --onto` instead — it's often cleaner.

## Workflow Example

Backport a fix to a release branch:

```bash
git switch release-1.x
git cherry-pick -x <fix-commit-sha>      # -x records origin for traceability
git push -u origin release-1.x
```

Verify:

```bash
git log --oneline -3
git status                               # clean tree expected
```
