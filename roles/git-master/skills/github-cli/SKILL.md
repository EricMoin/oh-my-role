---
name: github-cli
description: Use the official GitHub CLI gh for explicit host/repository targeting, authentication, pull requests and reviews, checks, Actions logs, issues, releases, structured output, and REST/GraphQL API requests. Load alongside github-platform.
---

# GitHub CLI (`gh`)

Load `github-platform` for the service's workflow and merge rules. Read
[command recipes](references/github-cli-recipes.md) for examples, adapting their
placeholders to the observed repository and installed CLI.

## Preflight and authentication

Check `gh --version`, the relevant command's `--help`, local Git state, and the
actual destination. Use `gh auth status --hostname HOST` to check access without
displaying tokens. Use `gh repo view HOST/OWNER/REPO --json ...` to confirm the
repository and default branch.

For repository commands, pass `--repo [HOST/]OWNER/REPO`; use the host explicitly
for Enterprise repositories. `GH_REPO` supplies a default and `GH_HOST` helps
select a host, but do not rely on ambient defaults for a write. `gh api` uses
`--hostname` and an explicit endpoint; it does not inherit the PR command's
`--repo` flag. Follow the user's connector/CLI preference when provided.

`GH_TOKEN` takes precedence over `GITHUB_TOKEN` and stored credentials for
GitHub.com and ghe.com hosts. Enterprise Server uses `GH_ENTERPRISE_TOKEN` or
`GITHUB_ENTERPRISE_TOKEN`. Inspect whether relevant overrides are set without
printing their values. A stored account switch does not override an environment
token. Verify identity on the target host when accounts or permissions differ.

When login is needed, use `gh auth login --hostname HOST` or an existing secure
automation token. `--with-token` reads stdin; avoid tokens in command arguments,
logs, config dumps, or `--show-token` output. Check the requested operation's
permissions, fine-grained token resource access, and organization authorization;
do not request broad scopes reflexively. Git transport can need separate setup.

## Pull requests and reviews

Use explicit PR numbers/URLs and repositories for reads and writes. Read
`headRefOid`, base/head identity, draft/state, review decision, and mergeability;
then inspect the diff, comments/reviews, and current checks. Use `--json` with
supported fields and `--jq` for data extraction rather than parsing terminal
tables. Missing or unknown fields need an API query or a documented limitation.

Create with explicit `--base`, `--head`, `--title`, and `--body-file`. The head
must already exist remotely when intentionally avoiding an implicit push/fork.
`--head USER:BRANCH` selects a fork head; verify current support for organization
forks. `gh pr create --dry-run` can still push Git changes, so it is not a
read-only preview. Prepare a body file and inspect the diff locally for previews.

Use `gh pr review --approve`, `--request-changes`, or `--comment` only for the
authorized review action. Use `--body-file` for multiline prose. These actions
post to GitHub; reading a diff does not authorize submitting them.

## Checks and merging

`gh pr checks --required` selects required CI checks. Its additional exit code
`8` means pending checks; preserve that distinction from a failed check or
transport/authentication error. Inspect each bucket and workflow/job evidence;
an empty list does not prove the repository has no merge requirements. Review,
conversation, deployment, and queue requirements need separate inspection.

Use `gh pr merge --match-head-commit REVIEWED_SHA` so a changed PR head rejects
the merge. Choose an allowed `--merge`, `--squash`, or `--rebase` method when no
queue controls it. For a queue-required target, omit a strategy and let the
queue apply its configured method. `--auto` schedules merging when requirements
permit; a successful command can leave the PR open or queued. Never use
`--admin` as a retry. Add `--delete-branch` only when cleanup is in scope.

Read the PR back for `state`, `mergedAt`, `mergeCommit`, and `autoMergeRequest`.
Use queue/timeline evidence to distinguish queued from merely scheduled. If
monitoring to completion was requested, continue bounded polling and report the
observed final result; a scheduling response is not completion evidence.

## Actions, issues, releases, and APIs

- Inspect Actions with `gh run list/view`, the exact run ID and head SHA, and
  failed logs. `gh run watch --exit-status` can track a run, but use bounded
  snapshots when a long blocking watch would prevent progress updates. Rerun,
  dispatch, or cancel only within the requested scope.
- Use `gh issue list/view` to establish issue identity/state. Creation and
  comments can read multiline prose through `--body-file`; verify each write.
- Check the remote tag and existing release before `gh release create`.
  `--verify-tag` prevents silent tag creation; `--draft` creates a server-side
  draft and is still a write. Read back release state and assets.
- `gh api` supports REST and `graphql`. Adding `-f`/`-F` changes the default
  method to POST: use `--method GET` for filtered reads. Use `--input` for a
  prepared JSON body, and distinguish GraphQL queries from mutations.
- List endpoints paginate. Use API `--paginate` and inspect every page needed
  for the task. GraphQL pagination requires a cursor variable and `pageInfo`.
  Treat rate limits, missing permissions, and partial responses as incomplete
  evidence; do not turn errors into an empty success.

## Official sources

- [Authentication](https://cli.github.com/manual/gh_auth_login) and [environment precedence](https://cli.github.com/manual/gh_help_environment)
- [PR creation](https://cli.github.com/manual/gh_pr_create), [reviews](https://cli.github.com/manual/gh_pr_review), [checks](https://cli.github.com/manual/gh_pr_checks), and [merging](https://cli.github.com/manual/gh_pr_merge)
- [API requests and pagination](https://cli.github.com/manual/gh_api)
- [Release creation](https://cli.github.com/manual/gh_release_create)
