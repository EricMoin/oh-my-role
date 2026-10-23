---
name: deploy
description: Validate and deploy a role working copy to an explicitly selected host, preserving existing entries as backups and reporting runtime verification separately. Params: role=<name or path>, host=<opencode|pi|dsh|codex>, target=<optional directory>.
---

# Deploy

Resolve a role name under this repository's `roles/` directory, or accept an explicit
role directory. Locate the repository by its `registry.yaml` and `roles/` layout;
the parent of this function directory is the role directory, not the repository root.
A role needs `role.yaml` and a readable configured prompt; an inline prompt is valid.

Determine the host from user intent/session context before choosing a destination.
Use the configured home from the host or explicit `target=`; see
`references/deploy-to-harness.md`. Never default a Codex/Pi/dsh session to OpenCode.
If required host information is unavailable, ask for the target rather than guessing.

Resolve this role's `scripts/deploy_role.py` and run:

```bash
python3 /path/to/role-creator/scripts/deploy_role.py /path/to/generated-role --target-dir /path/to/host/rolebox
```

The target directory must exist. The script copies into staging beside the target,
validates the staged package, then renames it into place. It excludes test/eval/cache
files. Existing real directories and symlinks, including broken symlinks, require
replacement authorization. If the current user request already explicitly authorizes
replacement, use `--replace`; otherwise present the exact destination and ask first.
The script moves the old entry into `.role-creator-backups/` beside the host's rolebox
directory. A symlink is moved as a link; its release-store target is never written.
A failed final rename restores the prior entry. Report the backup path.

After installation, verify using the selected host's capabilities:

- OpenCode: if `asset_hot_reload` is available, invoke it and inspect the resulting
  role snapshot. It is not a portable cross-host API.
- Pi/dsh: use the host's actual role reload/restart mechanism. Do not call a tool that
  is absent from the installed tool surface. State when a restart remains necessary.
- Codex: current rolebox MCP has no hot reload or graph execution. Refresh its running
  integration using the host-supported restart flow. Do not call graph tools or claim
  a graph role works on this adapter.

Inspect actual declared asset names with `asset_search(query=<asset>, role_id=<roleId>)`
and `asset_inspect(name=<asset>, type=<skill|function|reference>)`; confirm the owner in
the result. Those tools index assets, not roles. A prompt-only role requires actual
role discovery/activation evidence. Copying a directory alone does not prove activation.

Report deployed path, staging validation, replacement/backup, host, reload result,
and VERIFIED or UNVERIFIED runtime discovery. Do not publish or update the registry
as part of local deployment. See the deployment reference for target paths and limits.
