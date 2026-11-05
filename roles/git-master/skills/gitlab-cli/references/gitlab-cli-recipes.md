# `glab` command recipes

Reviewed on 2026-11-05 against official GitLab documentation and local
`glab 1.126.0` help. Recheck flags on other versions. Replace example values
with the observed host, project ID, MR IID, pipeline ID, and reviewed SHA.
Write sections require the corresponding user-authorized action; these examples
are separate workflows, not a script to run top to bottom.

## Destination and read-only checks

```bash
gitlab_host=gitlab.example.com
gitlab_repo="https://$gitlab_host/group/subgroup/project"
gitlab_project_id=123
gitlab_mr=42

glab --version
glab auth status --hostname "$gitlab_host"
glab api --hostname "$gitlab_host" user
glab api --hostname "$gitlab_host" "projects/group%2Fsubgroup%2Fproject"
glab mr list --repo "$gitlab_repo"
glab mr view "$gitlab_mr" --repo "$gitlab_repo" --output json
glab mr diff "$gitlab_mr" --repo "$gitlab_repo"
glab mr view "$gitlab_mr" --repo "$gitlab_repo" --comments
glab api --hostname "$gitlab_host" \
  "projects/$gitlab_project_id/merge_requests/$gitlab_mr"
```

Read the project's numeric `id` from the project response; MR `iid` 42 is scoped
to that project. Preserve `sha`, `diff_refs`, `head_pipeline`, source/target
project IDs and branches, `detailed_merge_status`, discussion/approval evidence,
and URLs. Availability of fields and approval endpoints depends on the server.

For an environment token on an unconfigured host, explicitly bind the host for
each relevant command, for example:

```bash
GITLAB_HOST="$gitlab_host" glab api --hostname "$gitlab_host" user
```

Or authenticate the host using the documented login flow first. Avoid dumping
user/profile/configuration responses when they contain data unrelated to the task.

## Create a merge request (write)

Prepare a real UTF-8 `mr-description.md`. Verify source/target and existing MRs
before creation. This example uses a source branch already present remotely:

```bash
glab mr create --repo "$gitlab_repo" \
  --source-branch feature --target-branch main --push=false \
  --title "fix: handle empty responses" --description-file mr-description.md --draft
```

For a fork, additionally select the actual source project with `--head`; keep
`--repo` as the target project. `--fill` otherwise enables a push by default.
Do not enable `--auto-merge` or source branch deletion as an incidental create
option. Verify the created MR URL, source/target, and draft state. Search for a
partially created MR before retrying after a timeout or ambiguous error.

## Approval and merge (separate writes)

Set `reviewed_head` from the full source SHA whose content was actually reviewed.
Refreshing that variable without reviewing new commits defeats the precondition.

```bash
glab mr approve "$gitlab_mr" --repo "$gitlab_repo" --sha "$reviewed_head"
```

Merge only when separately authorized. The current command defaults to enabling
auto-merge while a pipeline runs:

```bash
glab mr merge "$gitlab_mr" --repo "$gitlab_repo" --sha "$reviewed_head"
glab api --hostname "$gitlab_host" \
  "projects/$gitlab_project_id/merge_requests/$gitlab_mr"
```

Inspect `state`, `merged_at`, `merge_commit_sha`, `squash_commit_sha`, current
source SHA, and available auto-merge/train evidence. Commit fields vary with the
project's merge method. An open MR with auto-merge set is pending, not merged.
For an authorized immediate attempt, `--auto-merge=false` disables scheduling;
it does not bypass server checks. Add `--squash`, `--remove-source-branch`, or
`--yes` only when their effects match the task. GitLab merge policy still applies.

## Pipeline and job diagnosis

Obtain the pipeline ID from the current MR. Discover jobs within that pipeline
and choose the actual failing job ID, rather than the latest branch run:

```bash
glab ci get --repo "$gitlab_repo" --pipeline-id "$gitlab_pipeline_id" --output json
glab api --hostname "$gitlab_host" \
  "projects/$gitlab_project_id/pipelines/$gitlab_pipeline_id/jobs" --paginate
glab ci trace "$gitlab_job_id" --repo "$gitlab_repo" --pipeline-id "$gitlab_pipeline_id"
```

Check the pipeline's actual project when a fork is involved. Use that project's
ID/URL for its jobs and logs. `glab ci status --branch feature` is a useful branch
snapshot but is not proof that the MR's required pipeline passed. Trace output
can contain secrets or control characters; show only relevant, sanitized failure
details. CI retry, run, play, and cancel commands are mutations.

## Issues and releases

```bash
glab issue list --repo "$gitlab_repo"
glab issue view "$gitlab_issue" --repo "$gitlab_repo"
glab release view "$release_tag" --repo "$gitlab_repo"
glab api --hostname "$gitlab_host" \
  "projects/$gitlab_project_id/repository/tags/$release_tag"
```

Percent-encode a tag containing slashes before using it as a REST path segment.
For an authorized issue creation/comment, check that command's description input
flags; do not assume `--description-file` exists on every glab subcommand.

After verifying the tag points at the intended commit and inspecting any existing
release, an authorized release creation/update can use:

```bash
glab release create "$release_tag" --repo "$gitlab_repo" --notes-file release-notes.md
glab release view "$release_tag" --repo "$gitlab_repo"
```

Unlike gh, create can update an existing release. A missing tag is automatically
created from the default branch unless `--ref` selects the intended ref. When
tag creation is requested, use an explicit full commit SHA for `--ref` and verify
the resulting tag. Do not assume a GitHub-style draft release flag exists.

## REST and GraphQL

```bash
glab api --hostname "$gitlab_host" --method GET \
  "projects/$gitlab_project_id/merge_requests" -f state=opened --paginate
glab api --hostname "$gitlab_host" graphql \
  -f query='query { currentUser { username } }'
```

Use `--input request.json` with an explicit method for authorized JSON writes.
Do not assume gh's nested `-F key[subkey]` payload syntax applies: current glab
supports JSON values, and bracketed field names have method-dependent semantics.
Inspect help or use a complete JSON file. List commands have `--page/--per-page`
on supported subcommands; API `--paginate` fetches subsequent pages. Handle rate
limits and GraphQL errors/partial data explicitly.

Sources: [glab docs](https://docs.gitlab.com/cli/),
[configuration](https://docs.gitlab.com/cli/configuration/),
[MR create](https://docs.gitlab.com/cli/mr/create/),
[MR merge](https://docs.gitlab.com/cli/mr/merge/),
[API](https://docs.gitlab.com/cli/api/), and
[release create](https://docs.gitlab.com/cli/release/create/).
