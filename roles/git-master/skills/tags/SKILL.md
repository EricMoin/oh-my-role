---
name: tags
description: Tag creation (annotated and lightweight), listing, deletion, and pushing tags to remotes. Load when marking releases or version points.
---

# Git Tags

Tags name a specific commit — typically for releases. Two kinds:

- **Annotated** (recommended): a full git object storing tagger, date, message, and signature. Use for releases.
- **Lightweight**: just a named pointer to a commit. Use for quick private marks.

## Create

```bash
# Annotated (recommended for releases)
git tag -a v1.0.0 -m "Release 1.0.0"
git tag -a v1.0.0 <commit> -m "Release 1.0.0"   # tag a specific commit

# Lightweight
git tag v1.0.0
git tag v1.0.0 <commit>                           # lightweight on a commit

# Signed (GPG)
git tag -s v1.0.0 -m "Release 1.0.0"
git tag -v v1.0.0                                 # verify a signed tag
```

**Always prefer annotated tags for releases** — they carry metadata and can be signed/verified.

## List

```bash
git tag                            # list all tags (alphabetical)
git tag -l 'v1.*'                  # filter by pattern
git tag -n                         # show annotation messages
git tag --sort=-creatordate       # newest first by tag date
git show v1.0.0                   # show tag details + the tagged commit
```

Tags sort alphabetically by default, not semantically (`v1.10` < `v1.2`). Use `--sort=-v:refname` for semver-aware ordering.

## Push Tags

Tags are NOT pushed by `git push` automatically. Push explicitly:

```bash
git push <remote> v1.0.0           # push one tag
git push <remote> --tags           # push ALL tags (annotated + lightweight)
git push <remote> --follow-tags    # push commits + reachable annotated tags together
```

`--follow-tags` is the cleanest habit for releases: set it as the default:

```bash
git config --global push.followTags true
```

## Delete (Tier 3 for pushed tags — confirm)

```bash
git tag -d v1.0.0                       # delete local tag
git push <remote> --delete v1.0.0       # delete remote tag (confirm)
git push <remote> :refs/tags/v1.0.0     # legacy remote-tag-delete syntax
```

## Checkout a Tag (Detached HEAD)

```bash
git checkout v1.0.0                     # detached HEAD at the tag
git switch -c hotfix-1.0.1 v1.0.0       # create a branch from the tag (preferred for changes)
```

Checking out a tag puts you in **detached HEAD** — commits here aren't on any branch and can be lost. Always create a branch if you intend to make changes.

## Verify

```bash
git tag --list
git ls-remote --tags <remote>          # remote tags
```
