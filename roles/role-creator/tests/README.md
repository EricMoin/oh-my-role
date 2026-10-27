# Role Creator regression checks

Run offline authoring, deployment and benchmark-adapter tests:

```sh
bash roles/role-creator/self-test.sh
```

With a local rolebox source checkout and its dependencies installed:

```sh
ROLEBOX_ROOT=/path/to/rolebox bash roles/role-creator/self-test.sh
```

The Python differential checks and graph suite use that real runtime. The graph suite
runs with the checkout's Node/Vitest dependencies through `scripts/test-runtime-contracts.mjs`. No model runs,
provider credentials, live host deployment or rolebox full test suite are required.
Deployment tests use temporary directories; native benchmark model execution is stubbed.
The graph tests verify accepted feedback delivery through successive repair attempts,
execution budget exhaustion boundaries and documented function conditions.

`rolebox-revision.txt` records the committed runtime source used by CI. Local checks
use the actual `ROLEBOX_ROOT` working tree, including uncommitted changes; they do
not update that pin. When a role change requires a runtime change, commit and publish
the runtime first, then update the pin before merging the role changes. CI always runs
offline checks, then checks whether that exact revision is accessible on GitHub. It
runs real-runtime checks when accessible; otherwise it emits an explicit NOT RUN
warning and summary. A green offline job is not a runtime compatibility claim. Publish
the rolebox revision (or grant access) and rerun CI to complete remote verification.

When upgrading, test a local checkout first, update the pin and authoring references,
and make the revision accessible to CI. Do not replace the pin with an untested tag
merely to make checkout succeed. Native benchmark execution currently requires the
benchmark-capable dsh runtime from the selected checkout; a matching package version
alone does not prove the CLI has a `bench` command.
