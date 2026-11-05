# `gh` command recipes

Reviewed on 2026-11-05 against the official manual and local `gh 2.103.3`
help. Recheck flags on other versions. Examples use placeholders: replace them
with observed values. Commands under write sections require the corresponding
user-authorized action; this document is not a script to run top to bottom.

## Destination and read-only checks

```bash
github_host=github.com
github_path=OWNER/REPO
github_repo="$github_host/$github_path"
github_pr=123

gh --version
gh auth status --hostname "$github_host"
gh api --hostname "$github_host" user --jq .login
gh repo view "$github_repo" --json nameWithOwner,url,defaultBranchRef,isFork,parent
gh pr list --repo "$github_repo" --state open --head feature --base main
gh pr view "$github_pr" --repo "$github_repo" \
  --json url,state,isDraft,baseRefName,headRefName,headRefOid,reviewDecision,mergeable,mergeStateStatus
gh pr diff "$github_pr" --repo "$github_repo"
gh pr view "$github_pr" --repo "$github_repo" --comments
gh pr checks "$github_pr" --repo "$github_repo" --required \
  --json name,state,bucket,link
```

Keep exit code 8 from checks as pending. PR comments alone do not establish that
all review threads are resolved. Inspect server merge requirements separately.

## Create or review a PR (writes)

Prepare `pr-body.md` or `review.md` as a real UTF-8 file. Preserve newlines with
file input instead of interpolating multiline text into a shell command. Verify
that the specified source branch has already been pushed to the correct remote.

```bash
gh pr create --repo "$github_repo" --base main --head feature \
  --title "fix: handle empty responses" --body-file pr-body.md --draft
```

For a fork, use the supported `--head CONTRIBUTOR:feature` form and keep
`--repo` pointing at the base repository. Read the returned PR URL back before
reporting creation. If a create command fails after a partial write, search for
the PR before retrying to avoid duplicates. Do not use create's `--dry-run` as a
no-network-write preview; it can push changes.

Choose exactly the authorized review action after inspecting the current head:

```bash
gh pr review "$github_pr" --repo "$github_repo" --approve --body-file review.md
```

Use `--request-changes` or `--comment` instead of `--approve` when appropriate.
The high-level review command has no merge-style `--match-head-commit` flag.

## Merge or schedule (writes)

`reviewed_head` must be the full SHA actually reviewed, not a newly fetched SHA
accepted without review. Refresh requirements and reject a changed head.

```bash
gh pr merge "$github_pr" --repo "$github_repo" \
  --squash --match-head-commit "$reviewed_head"
```

For authorized auto-merge on a non-queue target, add `--auto` and the allowed
method. For a queue-required target, let the queue choose its method:

```bash
gh pr merge "$github_pr" --repo "$github_repo" \
  --match-head-commit "$reviewed_head"
gh pr view "$github_pr" --repo "$github_repo" \
  --json url,state,headRefOid,mergedAt,mergeCommit,autoMergeRequest,mergeStateStatus
```

These are alternative merge paths. Do not execute both. Confirm merged state
before reporting completion; use queue/timeline evidence for an open queued PR.
Source branch removal is optional and separately scoped.

## Actions and issues

```bash
gh run list --repo "$github_repo" --branch feature \
  --json databaseId,event,headSha,status,conclusion,url
gh run view "$github_run_id" --repo "$github_repo" \
  --json status,conclusion,headSha,jobs,url
gh run view "$github_run_id" --repo "$github_repo" --log-failed
gh issue list --repo "$github_repo" --state open --limit 100
gh issue view "$github_issue" --repo "$github_repo" --json number,title,state,url
```

Run IDs and issue numbers are separate from PR numbers. A list limit is not an
exhaustive search. For an authorized issue write, use `gh issue create` or
`gh issue comment` with `--body-file`, then read back the result.

## Releases (write only after tag/release inspection)

```bash
gh release view "$release_tag" --repo "$github_repo"
gh api --hostname "$github_host" "repos/$github_path/git/ref/tags/$release_tag"
```

Dereference annotated tags to the intended commit as needed. A missing release
is different from an authentication or connectivity failure. After confirming
the tag and user-requested release state:

```bash
gh release create "$release_tag" --repo "$github_repo" \
  --verify-tag --notes-file release-notes.md --draft
gh release view "$release_tag" --repo "$github_repo" \
  --json url,tagName,isDraft,isPrerelease,assets
```

Omit `--draft` only when publication is authorized. Recheck assets after upload;
release creation and asset upload can succeed or fail separately.

## REST and GraphQL

```bash
gh api --hostname "$github_host" "repos/$github_path/pulls/$github_pr"
gh api --hostname "$github_host" --method GET \
  "repos/$github_path/issues" -f state=open --paginate
gh api --hostname "$github_host" graphql \
  -f query='query { viewer { login } }'
```

REST queries use explicit owner/repository paths here, so they do not depend on
the local checkout. For an authorized API write, use an explicit method and
`--input request.json`, inspect the response, then read the changed object back.
GraphQL queries use POST at the transport layer; inspect whether the operation
is a query or mutation. GraphQL pagination needs `$endCursor` and `pageInfo`.

Sources: [gh manual](https://cli.github.com/manual/),
[API](https://cli.github.com/manual/gh_api),
[PR create](https://cli.github.com/manual/gh_pr_create),
[PR merge](https://cli.github.com/manual/gh_pr_merge),
[run view](https://cli.github.com/manual/gh_run_view), and
[release create](https://cli.github.com/manual/gh_release_create).
