---
name: gitlab-cli
description: Use the official GitLab CLI glab for GitLab.com and self-managed hosts, authentication, nested project selection, merge requests and approvals, pipeline/job diagnosis, issues, releases, structured output, and REST/GraphQL APIs. Pair with gitlab-platform.
---

# GitLab CLI (`glab`)

Load `gitlab-platform` for GitLab workflow and merge rules. Read
[command recipes](references/gitlab-cli-recipes.md) for examples. Use the
official GitLab CLI, not the separate python-gitlab `gitlab` command.

## Preflight and host selection

Check `glab --version`, the relevant command's `--help`, local Git state, and
`glab auth status --hostname HOST`. Resolve both source and target projects.
For repository commands, use `--repo` with the complete project path or full URL;
prefer `https://HOST/GROUP/SUBGROUP/PROJECT` for a custom host. Do not substitute
GitHub's `[HOST/]OWNER/REPO` convention without checking how glab parses it.

`GITLAB_REPO` can supply a repository default. `GITLAB_HOST` supplies a host and
can override remote inference; conflicting environment values can cause glab to
reject otherwise valid remotes. Confirm the effective host instead of retrying
on gitlab.com. `glab api` uses `--hostname` and explicit project endpoints, not
the high-level command's `--repo` flag.

For separate SSH/API hosts, custom ports, or a URL subpath, consult instance
connection/configuration docs and map the endpoints explicitly. For private
certificate authorities, configure the appropriate trusted CA; disabling TLS
verification is not the routine solution to a connection failure.

## Authentication

Environment tokens `GITLAB_TOKEN`, `GITLAB_ACCESS_TOKEN`, and `OAUTH_TOKEN`
override stored credentials in that order. Current glab restricts where such
tokens are sent: a host present only in a command argument may receive no token.
For an unconfigured custom host, explicitly scope the command with
`GITLAB_HOST=HOST`, or authenticate that host first. Check the installed version's
behavior when diagnosing an authentication failure. Never print token values.

Use `glab auth login --hostname HOST` for setup; `--stdin` reads a token without
putting it in arguments. Current glab uses an available OS keyring by default
outside CI, with a plaintext configuration fallback. Do not dump configuration
files or use `auth status --show-token` to diagnose ordinary access problems.

OAuth, personal/project/group access tokens, and CI job tokens differ in lifetime,
scope, role, and endpoint support. For CI job tokens, use a documented job-token
flow; do not copy `CI_JOB_TOKEN` into `GITLAB_TOKEN`, which uses a different auth
header. CI auto-login is opt-in with `GLAB_ENABLE_CI_AUTOLOGIN=true` in GitLab CI.
Verify the specific command's support and cross-project permissions.

## Merge requests and approvals

Select an explicit MR IID and target project for each operation. Use
`glab mr view IID --output json`, comments/discussions, and the MR API for data
that the high-level command omits. Do not port gh's `--json FIELDS`/`--jq`
conventions to glab commands. Confirm support per command before filtering output.

Create with explicit source/target branches and, for forks, `--head` selecting
the source project. Prefer `--description-file` for multiline content on versions
that support it. Older versions may need another documented input path; do not
invent a `--body-file` alias. `--fill` pushes by default unless `--push=false`;
inspect push/create-source-branch/auto-merge effects before creation.

`glab mr approve --sha REVIEWED_SHA` guards approval against a changed source
head. `glab mr merge --sha REVIEWED_SHA` provides a similar merge precondition.
`--yes` skips a CLI prompt and does not supply user authorization or bypass
server requirements. Posting a note is different from submitting an approval
or resolving an individual discussion.

## Pipelines and merge completion

Use the MR's pipeline ID and API evidence before relying on `glab ci status`,
which otherwise defaults to the current branch. `glab ci get --pipeline-id ID`
and a job trace/API request avoid accidentally diagnosing a different pipeline.
Keep branch, MR, merged results, and train pipelines distinct. Inspect manual,
blocked, skipped, pending, canceled, and failed jobs rather than reducing all
non-failure states to success. Rerunning CI or starting a manual job is a write.

Current `glab mr merge` defaults `--auto-merge` to true. It can enable auto-merge
while CI runs; a zero exit code is not proof that the MR merged. Read back MR
state, merge time, source SHA, and merge/squash commit evidence. When the MR
remains open, inspect auto-merge and train evidence and report the pending state.
`--auto-merge=false` does not override merge checks. Do not substitute deprecated
`--when-pipeline-succeeds` examples for the installed command's supported flags.

## APIs and releases

Use numeric project IDs or a fully URL-encoded project path with REST API v4.
The MR number in a project endpoint is its `iid`, not its global `id`. For reads
with `-f`/`-F`, specify `--method GET`; adding fields otherwise defaults to POST.
Use `--input` for prepared JSON and check array/nested-field behavior against
current help instead of copying gh syntax. REST `--paginate` fetches additional
pages; GraphQL requires explicit cursor/pageInfo support. Surface partial results.

`glab release create` can update an existing release, or create a missing tag
from the default branch. Inspect both first. It has no assumed gh-equivalent
`--verify-tag` or `--draft` flag: use an explicit verified tag/ref and the
GitLab-supported release workflow. Read back notes, tag target, and assets.

## Official sources

- [CLI overview](https://docs.gitlab.com/cli/), [configuration/environment](https://docs.gitlab.com/cli/configuration/), and [authentication](https://docs.gitlab.com/cli/auth/login/)
- [MR creation](https://docs.gitlab.com/cli/mr/create/), [approval](https://docs.gitlab.com/cli/mr/approve/), and [merge](https://docs.gitlab.com/cli/mr/merge/)
- [API requests](https://docs.gitlab.com/cli/api/)
- [Release create/update behavior](https://docs.gitlab.com/cli/release/create/)
