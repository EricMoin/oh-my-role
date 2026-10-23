# Optional background journey recording

Use a separate graph when organizing already captured evidence would delay diagnosis or
repair. A few lines of recording are cheaper inline; do not create a graph for every run.
The lead retains acceptance-critical observations and a retrievable minimum record first.
The recorder organizes supplied facts; it does not perform or replace verification.

## Handoff and ownership

1. Seal the input record and essential sanitized evidence: run ID, source/diff identity,
   built artifact identity if relevant, actions, observed results, limitations and evidence
   paths. Persist these outside per-command temporary directories before dispatch. Do not
   rename, overwrite or clean them up while a recorder can still read them. A later repair
   gets new evidence; old observations remain attached to their original snapshot.
2. Assign one unique output directory, normally
   `.rolebox/jetpack-compose/device-testing/runs/<run-id>/archive/<unique-recording-id>/`.
   Input and output directories must be disjoint. Only one worker owns that output directory;
   no concurrent lead or worker writes there. Shared cases, profiles and README/index files
   remain lead-owned. The recorder writes proposed changes inside its own output directory.
3. Supply exact readable inputs, the absolute output directory, desired optional outputs
   and a finite budget. The worker uses `graph_worker_exec` for filesystem commands; direct
   Write/Edit tools stay disabled. Do not grant production, device, build, install, Git,
   network or cleanup work. Resolve actual paths before copying; never follow an output
   symlink outside the assigned directory or rewrite input evidence.
4. This directory restriction is a role/node contract, not a per-node filesystem sandbox
   promised by Graph v3. The installed host sandbox still applies and may be broader. If
   hard filesystem isolation is required, use a host-supported isolated workspace or keep
   the operation inline; never invent a declaration field to claim enforcement.

## Declare, then continue the repair

This is an independent graph with no acceptance edge, review dependency or writer loop.
Replace the name and prompt placeholders with real paths and evidence. The JSON is the
declaration value passed to `graph_declare({declaration: ...})`.

```json
{
  "version": 3,
  "name": "compose-record-sample-r0",
  "budget": { "max_executions": 1 },
  "nodes": [
    {
      "id": "journey-record",
      "agent": "jetpack-compose--journey-recorder",
      "prompt": "Replace this placeholder with run_id, source_snapshot, artifact identity, exact sealed input paths, the retained minimal record, a unique disjoint absolute output directory and the optional outputs to organize. Read only these supplied inputs, preserving failures and not-run steps. Use graph_worker_exec for commands and write only inside the assigned output directory; this is a role scope contract, not a claim of per-node sandbox enforcement. Do not inspect live production code, execute tests, operate devices, recapture media or edit shared indexes/cases/profiles. Return proposals inside your output directory. Submit recorded when the requested organization is complete, or incomplete with actual partial paths and limitations when evidence or capabilities are missing, using graph_submit_outcome with your dispatch credential and the schema_version 1 Recording report from references/schemas.md. No product pass/revise verdict. Stop after accepted submission.",
      "completion": { "mode": "explicit" },
      "budget": { "timeout_ms": 120000 },
      "outcomes": [{ "id": "recorded" }, { "id": "incomplete" }]
    }
  ],
  "edges": []
}
```

Inspect `start.kind`: only `started`/`resumed` establish actual dispatch. Then continue
foreground work immediately; do not poll or await this optional graph before repairing.
A saved/refused/blocked graph is not running. Keep the compact record and mark optional
enrichment deferred if dispatch is unavailable; do not turn the fallback into a full
synchronous archive or rerun the app to satisfy documentation.

On a completion/block notification, read accepted results through `graph_status`. Check
the run/snapshot identity and actual written paths. Merge useful proposals into shared
records only when convenient and after rereading their current contents; preserve newer
case revisions. Reject an obsolete proposal rather than overwriting current state.

Delivery can report product checks as verified while archival is pending, provided those
checks already have retained evidence and no unresolved acceptance defect. Never say
archive work is complete from a start result, graph phase or an unaccepted prose message.
The graph runs under the active host's lifecycle; persistence does not guarantee a worker
survives host shutdown. On interruption, inspect the original graph and retained files on
resume before retrying. If a retry is justified after confirmed termination, use a fresh
output directory and an explicit bounded recovery; never overlap writers or restart by
renaming to evade the budget. No automatic retry is needed for optional enrichment.

`recorded` means supplied evidence was organized, not that the app passed. `incomplete`,
timeout or archive failure leaves the actual product results unchanged. The lead still
owns any concrete unresolved defect already present in the supplied evidence.
