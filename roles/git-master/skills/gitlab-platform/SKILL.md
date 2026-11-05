---
name: gitlab-platform
description: GitLab.com, Dedicated, and Self-Managed workflows — projects and subgroups, merge requests, approvals, protected branches, CI/CD, merged results pipelines, merge trains, issues, releases, and API identities. Pair with gitlab-cli when using glab.
---

# GitLab Platform

Use Git for local history and refs, and a suitable connected tool or `glab` for
GitLab objects. Load `gitlab-cli` before using `glab`. Check the instance version,
available tier/features, and current official documentation for behavior that
depends on the server or CLI version.

## Resolve host, project, and identity

Inspect the request and remotes. Record the web/API host, active API account,
complete project path, source project/branch, target project/branch, and default
branch. Preserve every subgroup: `group/subgroup/project` is not `group/project`.
SSH aliases, separate API hosts, custom ports, and installations under a URL
subpath need explicit mapping to the web/API destination.

GitLab API project IDs and project-local issue/MR IIDs are different identifiers.
`!42` is an MR reference in a project; it is not the globally unique MR `id`.
For REST paths, use a numeric project ID or URL-encode the entire namespaced
project path as one segment (`group%2Fsubgroup%2Fproject`). Keep the host with the
project identity; numeric IDs are not portable between instances.

Git transport and API credentials are separate. Read-only API access, repository
access, and write access have different token scopes. Check endpoint permissions
and the account's project role rather than assuming a valid token permits every
operation. `CI_JOB_TOKEN` has endpoint and cross-project restrictions; verify
support and allowlists instead of treating it as a personal access token.

## Merge request workflow

1. Read project instructions and `.gitlab/merge_request_templates/`. Inspect
   source/target branches and the complete diff, including fork provenance.
2. Look for an existing MR for that source and target. Prepare the description,
   validation evidence, labels/reviewers when requested, and draft state.
   Specify both branches and projects rather than inheriting an ambiguous remote.
3. For review, read the current source SHA, changed files/callers, pipeline
   evidence, approvals, and unresolved discussions. Reviewer assignment,
   approval, a comment, and resolving a discussion are separate actions.
4. Refresh source SHA before an approved write. Supported approval and merge
   commands can reject a changed SHA; use those preconditions. After new commits
   or a rebase, reassess the review and CI instead of reusing stale evidence.
5. Read server state after creation, approval, merge scheduling, or merge.
   A successful API request can schedule work without completing the merge.

Act within the user's authorization and reuse approval already given. Reviewing
locally does not itself authorize posting an approval, triggering a pipeline,
merging, deleting a source branch, publishing a release, or changing settings.
Prepare the concrete change before seeking any approval still required.

## Branch rules, approvals, and mergeability

Read the effective branch rules, including inherited group rules, and the MR's
current merge checks. Permission to push and permission to merge are distinct.
Overlapping GitLab protected-branch rules can have permissive resolution for
many settings; do not import GitHub's most-restrictive ruleset model.

Approvals depend on tier and project rules: optional approvals are not the same
as enforced required approval rules. Code Owner requirements, eligible approvers,
approval reset behavior, unresolved discussions, draft status, conflicts,
external checks, policies, and project pipeline settings can all affect merging.
Check actual requirements instead of hard-coding a review count.

Prefer the API's `detailed_merge_status` over deprecated `merge_status`. Transient
or unavailable status requires a bounded refresh or a precise report of missing
evidence. A green pipeline alone does not establish mergeability.

## CI/CD evidence

| Pipeline type | What its result covers |
| --- | --- |
| Branch pipeline | A branch/ref; it may not be the MR's gating pipeline. |
| Merge request pipeline | Source branch content, without integrating the target. |
| Merged results pipeline | A synthetic merge of source and target. |
| Merge train pipeline | The target plus the MR and earlier train entries. |

Read the MR-associated pipeline and its ID, source, ref, SHA, and jobs. A synthetic
merge SHA can legitimately differ from the source SHA. Associate it with the MR
and its current revision before relying on it. When branch and MR pipelines both
exist, inspect which one GitLab uses for the merge check; do not select whichever
one happens to be green. Check `.gitlab-ci.yml` rules/workflow and included
configuration when diagnosing missing, duplicate, skipped, or manual jobs.

A fork MR normally runs pipelines in the fork. A parent-project pipeline can use
the contributor's CI configuration with the parent's resources and permissions.
Review that context before an authorized run. Retries and manual jobs can deploy
or publish; a request to inspect CI does not authorize those effects.

## Merge methods, auto-merge, and trains

Read the project's merge method: merge commit, merge commit with semi-linear
history, or fast-forward. Squash policy is a separate setting; squashing with a
merge-commit policy can create both a squash commit and a merge commit. GitLab's
rebase operation is not interchangeable with GitHub's rebase-and-merge method.

Semi-linear and fast-forward methods depend on an up-to-date source or the
instance's supported automatic rebase behavior. Where automatic rebase before
merge is enabled, GitLab can rebase without rerunning CI on the result; use train
evidence when validation of the combined result is required. Check version and
signing requirements rather than assuming signatures or SHAs survive rebasing.

Auto-merge waits for applicable merge checks. Merge trains additionally validate
queued changes together. Distinguish auto-merge requested, on train, removed from
train, and actually merged. Report the merged state, time, and commit evidence
only after reading them back. Do not disable pipeline/approval requirements,
force-push a protected branch, or skip a train to work around a blocker.

## Issues and releases

Use project-qualified issue references when needed. Check default-branch and
project auto-close settings before promising that an MR will close an issue.
A GitLab release is separate from its tag and assets. Verify tag target, existing
release, notes, and asset links before writing. A release command can create a
missing tag or update an existing release; read back both tag and release state.

## Official sources

- [Protected branches and effective rules](https://docs.gitlab.com/user/project/repository/branches/protected/)
- [MR approvals and tier differences](https://docs.gitlab.com/user/project/merge_requests/approvals/)
- [Merge methods and automatic rebase](https://docs.gitlab.com/user/project/merge_requests/methods/)
- [Auto-merge checks](https://docs.gitlab.com/user/project/merge_requests/auto_merge/)
- [Merge request pipelines and forks](https://docs.gitlab.com/ci/pipelines/merge_request_pipelines/)
- [Merge trains](https://docs.gitlab.com/ci/pipelines/merge_trains/)
- [Merge requests API](https://docs.gitlab.com/api/merge_requests/)
- [CI job token access](https://docs.gitlab.com/ci/jobs/ci_job_token/)

See [the documentation index](../../references/forge-documentation.md) for
research provenance and refresh guidance.
