---
name: history-inspection
description: Inspect commit history — log, show, diff, blame, shortlog, reflog, and bisect. Load when investigating what changed, when, and by whom.
---

# History Inspection

## log

```bash
git log                                  # full history (newest first)
git log --oneline                        # one line per commit
git log --oneline -10                    # last 10 commits
git log --stat                           # + file change stats
git log -p                               # + full patches (diffs)
git log --graph --oneline --all          # ASCII graph of ALL branches
git log --author="Alice"                # filter by author
git log --grep="fix"                     # filter by message (regex)
git log --since="2 weeks ago"           # by date
git log --until="2024-01-01"
git log <file>                           # commits touching a file
git log -S "functionName"               # commits adding/removing a string (pickaxe)
git log -G "regex"                       # commits whose diff matches a regex
git log <branch>..HEAD                  # commits on HEAD not on branch
git log HEAD..origin/main               # incoming commits not yet local
git log --follow <renamed-file>         # follow a file through renames
```

## show

```bash
git show                                 # latest commit: message + diff
git show <commit>                        # a specific commit's details
git show <commit>:<file>                 # a file's contents at a commit
git show <branch>                        # tip of a branch
git show <tag>                           # tag + tagged commit
git show --stat <commit>                 # commit + file stats only
```

## diff (between refs)

```bash
git diff <a> <b>                         # arbitrary refs
git diff <commit>                        # working tree vs commit
git diff --stat                          # summary
git diff --name-only                     # file names only
git diff <branch1>...<branch2>           # triple-dot: changes on branch2 since the merge base
git diff <branch1>..<branch2>            # double-dot: diff of tips
```

Triple-dot `...` is usually what you want when comparing branches (diff since they diverged).

## blame

```bash
git blame <file>                         # who changed each line + commit
git blame -L 10,20 <file>                # restrict to line range
git blame -L 10,+10 <file>               # range by offset
git blame -C <file>                      # detect moves/copies from same commit
git blame -M <file>                      # detect moves within a file
git blame -w <file>                      # ignore whitespace changes
git blame --since="1 month" <file>      # ignore commits older than date
```

`blame` shows the last commit that touched each line. To see why a line looks the way it does,
combine with `git show <sha>` on the blamed commit.

## shortlog

```bash
git shortlog                            # summarize commits by author
git shortlog -sn                        # commit count per author (no messages)
git shortlog -sne                       # count + name + email
git shortlog HEAD..origin/main          # summarize incoming commits
```

## reflog (local history of ref moves)

The reflog records every time a ref (HEAD, branches) moved locally — even operations that "lost"
commits. It's your safety net for recovery.

```bash
git reflog                              # HEAD reflog
git reflog show <branch>                # a specific branch's reflog
git reflog --date=iso                   # with readable timestamps
```

Each entry: `<sha> HEAD@{n}: <action>: <message>`. Recover with `git reset --hard <sha>` (Tier 3 — confirm).

**Reflog scope:** covers reset, rebase, amend, checkout, merge — anything that moved a ref. It does NOT cover `git clean` or `git stash drop`/`clear`. Entries expire (~90 days for reachable, ~30 for unreachable).

## bisect (binary search for a regression)

Find the commit that introduced a bug by binary search between a known-good and known-bad commit.

```bash
git bisect start
git bisect bad                          # current HEAD is bad
git bisect good v1.0.0                  # this tag/commit is known good
# git checks out the midpoint; test it, then:
git bisect good                         # midpoint is good → search later half
git bisect bad                          # midpoint is bad → search earlier half
# ... repeats until the culprit is found ...
git bisect reset                        # return to original branch
```

Automate with a test script:

```bash
git bisect start HEAD v1.0.0
git bisect run ./test.sh               # exit 0=good, 1-124=bad, 125=skip
git bisect reset
```

## Workflow: Investigate a Regression

```bash
git log --oneline -20                   # recent history
git bisect start
git bisect bad                          # current state is broken
git bisect good <last-known-good-tag>
# follow the prompts...
git bisect reset
git show <culprit-sha>                  # inspect the culprit commit
```
