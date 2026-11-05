# GitHub, GitLab, `gh`, and `glab` documentation

Research reviewed on **2026-11-05**. This is a curated source map and behavior
summary, not a snapshot of every service feature. Match current documentation
to the installed client and server before depending on changing behavior.

## Loading map

| Task | Load |
| --- | --- |
| Local commits, branches, history, conflicts, transport | Existing Git operation skill(s). |
| GitHub PR/review, protections, Actions, issue, release | `github-platform`; also `github-cli` for gh. |
| GitLab MR/approval, branch rules, CI/CD, issue, release | `gitlab-platform`; also `gitlab-cli` for glab. |
| Host/API/authentication problem | Platform and CLI skills for the actual destination. |
| Mixed hosts or fork into upstream | Resolve both hosts/projects first; select tools per destination. |

Recipes: [gh](../skills/github-cli/references/github-cli-recipes.md) and
[glab](../skills/gitlab-cli/references/gitlab-cli-recipes.md).

## Evidence and version scope

Context7 resolution selected the official manual collections
`/websites/cli_github_manual` and `/websites/gitlab_cli`; the GitLab resolution
also returned `/websites/gitlab`. Queries covered gh PR checks/merging,
glab MR creation/approval/merging, and GitLab pipeline/merge-check interaction.
Direct official documentation supplied the additional platform, authentication,
API, fork CI, and release details below.

Local help was cross-checked with `gh 2.103.3` and `glab 1.126.0`, including PR/MR
creation, SHA merge preconditions, GitLab approval, pipeline selection, JSON
output, and release behavior. These are observed client versions, not minimum
supported versions. Help checks do not establish remote account permissions or
prove that a live hosted workflow completed. No hosted writes were needed to
research this knowledge pack.

GitHub Enterprise Server and GitLab Self-Managed can lag public documentation.
Read the actual server version and use matching documentation; check GitLab tier
and enabled project features as well. Feature availability is not established
by a command being present in local help.

## GitHub sources

| Topic | Official reference |
| --- | --- |
| Required reviews, status checks, signing, conversations | [Protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches) |
| Rules that apply together | [Rulesets and layering](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets) |
| Merge, squash, rebase, and queue method selection | [Merge methods](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/about-merge-methods-on-github) |
| Queue validation and required `merge_group` events | [Managing a merge queue](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue) |
| Fork events, permissions, and base/head context | [Actions events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows) |
| Issue closure and default-branch targeting | [Linking PRs to issues](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/linking-a-pull-request-to-an-issue) |
| API login, host selection, token precedence | [gh auth login](https://cli.github.com/manual/gh_auth_login), [environment](https://cli.github.com/manual/gh_help_environment) |
| Explicit head/base, body files, implicit push, dry-run effects | [gh pr create](https://cli.github.com/manual/gh_pr_create) |
| Review submission, CI buckets, pending exit code 8 | [gh pr review](https://cli.github.com/manual/gh_pr_review), [gh pr checks](https://cli.github.com/manual/gh_pr_checks) |
| SHA guard, auto-merge, queue behavior | [gh pr merge](https://cli.github.com/manual/gh_pr_merge) |
| REST/GraphQL, methods, payloads, pagination | [gh api](https://cli.github.com/manual/gh_api) |
| Tag verification and release state | [gh release create](https://cli.github.com/manual/gh_release_create) |

## GitLab sources

| Topic | Official reference |
| --- | --- |
| Project/group branch rules and merge/push permissions | [Protected branches](https://docs.gitlab.com/user/project/repository/branches/protected/) |
| Optional versus required approval rules and tier | [MR approvals](https://docs.gitlab.com/user/project/merge_requests/approvals/) |
| Merge method, squash policy, automatic rebase | [Merge methods](https://docs.gitlab.com/user/project/merge_requests/methods/) |
| Merge gates and relevant pipeline selection | [Auto-merge](https://docs.gitlab.com/user/project/merge_requests/auto_merge/) |
| Source-only MR pipelines and fork/parent resources | [MR pipelines](https://docs.gitlab.com/ci/pipelines/merge_request_pipelines/) |
| Validation with earlier queued MRs | [Merge trains](https://docs.gitlab.com/ci/pipelines/merge_trains/) |
| Project-local IID, MR state, detailed merge status | [Merge requests API](https://docs.gitlab.com/api/merge_requests/) |
| Job-token restrictions and allowlists | [CI job token](https://docs.gitlab.com/ci/jobs/ci_job_token/) |
| Issue lifecycle and automatic closing | [Manage issues](https://docs.gitlab.com/user/project/issues/managing_issues/) |
| Host/environment precedence, custom API hosts, trusted CAs | [glab configuration](https://docs.gitlab.com/cli/configuration/) |
| Login methods, stdin, keyring, CI authentication | [glab auth login](https://docs.gitlab.com/cli/auth/login/) |
| MR file input, fork head, implicit push | [glab mr create](https://docs.gitlab.com/cli/mr/create/) |
| Approval SHA guard and auto-merge defaults | [glab mr approve](https://docs.gitlab.com/cli/mr/approve/), [glab mr merge](https://docs.gitlab.com/cli/mr/merge/) |
| REST v4/GraphQL, JSON input, pagination | [glab api](https://docs.gitlab.com/cli/api/) |
| Release updates and automatic tag creation | [glab release create](https://docs.gitlab.com/cli/release/create/) |

## Differences to preserve

| Concern | GitHub / gh | GitLab / glab |
| --- | --- | --- |
| Change request identity | Repository PR number | Project MR IID; distinct from global MR ID. |
| Repository CLI selector | `[HOST/]OWNER/REPO` | Complete subgroup path; full URL for an explicit host. |
| Structured view output | `--json FIELDS`, optional `--jq` | Supported commands use `--output json`; inspect each command. |
| Multiline PR/MR creation | `--body-file` | `--description-file` on supported versions. |
| Merge source precondition | `--match-head-commit SHA` | `--sha SHA`; approval also supports `--sha`. |
| Queued integration | Merge queue and merge-group checks | Merge train and its pipeline checks. |
| Merge scheduling | `--auto`, plus queue-specific behavior | Current `mr merge` has auto-merge enabled by default. |
| Release create | Can auto-create a tag; `--verify-tag` can prevent it. | Can auto-create a tag and update an existing release. |

## Refresh procedure

1. Inspect the installed CLI version and affected subcommand's `--help`.
2. With Context7, resolve the product name, select its official collection, and
   query the precise behavior. Use an exact ID directly only when provided by
   the user or already resolved in the current research.
3. Fill coverage gaps from the linked official manual or versioned server docs.
   Verify removed/renamed flags, auth precedence, API fields, and default effects.
4. Update the affected skill/recipe and source date together. Keep examples
   explicit about host, project, reviewed revision, and read versus write effects.
5. Validate YAML, skill/reference links, and shell syntax. Use read-only runtime
   checks where relevant; perform hosted writes only within the user's task.
