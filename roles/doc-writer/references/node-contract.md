# Doc Writer node contract

A Doc Writer node is a domain writer, a prose editor, or the final humanizer gate. A
drafting node drafts one assigned surface into staging and reports its evidence; the gate
reports a verdict on the staged candidates and their hashes. The lead keeps ownership of
scope, integration, publish and final voice. Worker sessions share no conversation with the
lead, so the node brief must stand alone.

## Node brief

Every node prompt contains:

- Target: the document type, its staging path under `<repo>/.rolebox/doc-writer/<task-slug>/`
  for each surface, the intended final destination of each one, and whether the candidate
  updates an existing document or creates one. A drafting brief never names a final path as an
  edit target.
- Reader: who reads it, what they already know and which language they read.
- Job: the single task the document must let the reader finish, and the promise stated
  near the top.
- Verified facts: the facts already established, with repository paths, commands and
  observed output; state which facts remain unknown.
- Scope: the documentation surfaces the node may write in staging, the files and behavior it
  must not change, length and style limits, terminology and voice constraints.
- Expected output: the staging path or body, the evidence record and the required report
  parts. An MR, PR, or issue description is staged as `description.md` in the task directory.
- Gate nodes: the staging paths and intended final destinations to review, the fact ledger and
  identifiers that must not move, and the Reviewed sha256 table the gate must return. A gate
  brief never names a final path as the review target.
- Accepted inputs: for a sequenced node, the upstream staged candidate and evidence it must
  read.
- Open questions: decisions the node must not guess; it reports them instead.
- Budget: the time ceiling and the level of verification expected.

A brief that lacks a required fact does not authorize a guess: the node reports `blocked`
with the missing input, and the lead supplies it in a successor graph.

Do not copy the runtime handoff into the brief. The runtime injects the attempt
identity, credential and settlement instructions; the brief carries only domain work.

## Worker report

Every report contains four parts, in order:

1. Draft or findings: the staging path holding the candidate, or a precise summary of what
   changed and where. A staging path is never a final path.
2. Evidence: for each claim, the path, command, citation or observed output.
3. Unverified: facts the node could not establish, with the reason.
4. Open questions: decisions for the lead or user; write "none" when empty.

A report without evidence is not ready for integration. Do not integrate it; declare a
focused successor node with the missing checks instead of smoothing over the gap in the
staged candidate.

The final gate returns its verdict, scope, findings, fact ledger, Reviewed table and
unresolved items instead. Its brief supplies the staging paths and their intended final
destinations, never a final path as the review target; its Reviewed table records the sha256
of every staged path it read. It is read-only: it reports exact replacements and edits neither
staging nor a final destination; the lead applies every accepted replacement to staging.

## Boundaries

- A drafting node writes only its assigned staging surface. It never writes a final path,
  updates an MR/PR/issue, or commits, and it never changes production code, tests, build
  configuration, dependencies or runtime behavior.
- The gate writes nothing. It reads staging, hashes the staged bytes for its Reviewed table,
  and reports; a `pass` binds only the hashes it recorded.
- A node does not make product, API or architecture decisions. It records or reports
  them.
- A node never addresses the user directly. The lead merges drafts into staging, resolves
  conflicts, re-verifies facts, publishes after a pass and owns the final tone.
- A prose-editor node reports a fact ledger and blocking issues separately from
  suggestions; it does not add a claim it cannot trace.
