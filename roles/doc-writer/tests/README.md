# doc-writer — staging, gate, publish and boundary cases

These are judgment cases for the Doc Writer lead and its worker nodes. They are not automated
tests; each case states the input, the expected agent, the expected outcome, and the observable
evidence that the behavior was correct.

Every artifact a reader will use runs Stage → Gate → Publish → Deliver: the candidate is written
under `<repo>/.rolebox/doc-writer/<task-slug>/`, the gate reviews those bytes and returns Reviewed
sha256 hashes, and only a pass whose hashes still match is published. A direct case declares no
graph only when it produces nothing reader-facing.

A graph case names the agent that settles the node and the outcome it must submit. Only an
accepted outcome is a result; a complete graph can still contain blocked or failed nodes.

## Case 1 — one stale comment, direct draft plus gate

Input: "Explain the retry loop in `src/client.py`; the comment there is stale."

Expected agent: Doc Writer lead (direct draft), then the gate node `doc-writer--humanizer-reviewer`.

Expected outcome: `pass` from the gate; no drafting graph is declared.

Pass evidence: the lead reads the code and `git blame`, applies the deletion test, and drafts one
comment. A single-line comment is staged as `comment.txt` with the target `src/client.py:42` and the
exact comment text; the gate reviews and hashes that file. Only after the pass does the lead apply
the reviewed text to the source line. At most one why-comment remains if the loop's reason is not
recoverable from names and control flow. A multi-paragraph explanation belongs in a guide, not in
the source file.

Fail signal: the source comment is edited before the gate pass, the gate is asked to review comment
text that has no staged file, the comment is applied before the pass, prose is added without a
reason the code cannot express, or executable code changes.

## Case 2 — multi-module comment audit, one node

Input: "Audit the public-interface comments under `src/api/**/*.ts`."

Expected agent: `doc-writer--comment-writer`, then the gate node `doc-writer--humanizer-reviewer`.

Expected outcome: `draft_ready` from the audit node (one-node graph, `edges: []`), then `pass`.

Pass evidence: the node brief names the staging paths under
`<repo>/.rolebox/doc-writer/<task-slug>/`, the intended source destinations, the evidence commands,
and the comment-only scope; the node returns the staged candidate, per-file evidence, unverified
items, and open questions; the lead merges the candidates, runs the final fact pass, declares the
gate, and publishes the comments only after a pass.

Fail signal: the lead declares one graph per file, the node writes source files directly, the audit
ships without a gate, or a comment change ships without evidence.

## Case 3 — API reference from the contract

Input: "Add reference docs for `POST /v1/sessions`."

Expected agent: `doc-writer--api-writer`.

Expected outcome: `draft_ready`.

Pass evidence: the entry states method and path, purpose, authentication, path/query/body
parameters with types and required flags, one request and one response example, real status
codes and error codes, and retry or rate-limit notes. Each example is checked against the
OpenAPI description or a running instance, and the environment is recorded.

Fail signal: guessed fields or defaults, a status code the handler never returns, an endpoint
with no error path, or invented text substituted for the missing contract.

## Case 4 — README and quickstart

Input: "The README has no quickstart; I want a new user to get a working install."

Expected agent: `doc-writer--guide-writer`.

Expected outcome: `draft_ready`.

Pass evidence: prerequisites appear before the first command, every command is run from a clean
state with real output, platform differences are named, and the page ends with one verified next
step. The reader reaches a visible result without opening another page.

Fail signal: unrun commands, a missing runtime version, or a "getting started" section that
starts with architecture.

## Case 5 — decision record, no decision-making

Input: "Record why we chose cursor pagination for the events API."

Expected agent: `doc-writer--decision-writer`.

Expected outcome: `draft_ready`.

Pass evidence: the new record matches the repository's existing ADR directory, numbering, and
format; it states context, the decision, at least one rejected alternative with pros, cons, and
reason, consequences, and a verification signal. The decision owner and date are confirmed, and
the evidence links to the pull request or design discussion.

Fail signal: the writer picks between undecided options, invents a rejected alternative, or
edits an old ADR instead of superseding it.

## Case 6 — release notes from the range

Input: "Write release notes for v2.4.0."

Expected agent: `doc-writer--release-writer`.

Expected outcome: `draft_ready`.

Pass evidence: the version and date are confirmed from tags and history; entries are categorized
and state user-visible impact, action, and evidence link; breaking changes precede upgrade steps;
security fixes name affected and fixed versions. Internal refactors without user impact are left
out.

Fail signal: a changelog that is a `git log` dump, a guessed release date, or an upgrade guide
that assumes a clean install.

## Case 7 — prose review without new facts

Input: "Tighten `docs/architecture.md`; it is bloated."

Expected agent: `doc-writer--prose-editor`.

Expected outcome: `draft_ready`.

Pass evidence: the editor builds a fact ledger first, runs structure → paragraph → sentence →
word passes, re-checks the ledger after editing, and reports blocking issues separately from
suggestions with quoted originals and concrete replacements. No number, unit, condition, or
uncertainty changes without evidence.

Fail signal: a smoother draft that silently drops a limitation, upgrades "may" to "does", adds
an example the source never contained, or lets a worker review its own draft.

## Case 8 — multi-domain documentation set, one multi-entry graph

Input: "Document the new webhook feature: API reference, a setup guide, the ADR, and the release
note."

Expected agent: one drafting graph with four roots — `doc-writer--api-writer`,
`doc-writer--guide-writer`, `doc-writer--decision-writer`, and
`doc-writer--release-writer`; after integration, a separate single-node gate graph with
`doc-writer--humanizer-reviewer`.

Expected outcome: each drafting node submits `draft_ready` (or `blocked` / `failed` with a
concrete gap); `edges: []` because the four surfaces are independent. If the merged set still
needs one independent prose pass, the lead declares a separate single-node `prose-editor`
successor graph; that pass remains part of drafting. After integration the lead stages the merged
set, declares the separate single-node final gate graph, and publishes only after `pass`.

Pass evidence: one declaration with four nodes and a finite `budget.max_executions`; each node
gets its staging path, intended destination, reader, verified facts with evidence, and constraints;
the lead ends the turn, reads accepted results with `graph_status` (`scope all`, `format json`,
`include_output true`, `include_history true`), resolves duplicate facts to one canonical home,
re-checks every command, and unifies terminology. The merged set is written only under
`<repo>/.rolebox/doc-writer/<task-slug>/`. One final `prose-editor` pass may run only as a
successor graph, and the final gate is a separate single-node graph with
`doc-writer--humanizer-reviewer` and the `pass` / `revise` / `escalate` outcomes.

Fail signal: the same fact is copied into four pages and drifts, the lead forwards drafts without
integration, a blocked node is papered over with invented text, or the gate is folded into the
drafting graph.

## Case 9 — sequential dependency, one `draft_ready` edge

Input: "Write the API reference for the new endpoint, then a setup guide that walks through the
same calls."

Expected agent: `doc-writer--api-writer`, then `doc-writer--guide-writer`.

Expected outcome: `draft_ready` from each; the second node declares
`inputs: [{from: "api-reference", outcome: "draft_ready"}]` and the graph carries the matching
`{from, to, outcome}` edge.

Pass evidence: the guide node reads the accepted API draft rather than re-deriving the endpoint,
and the lead verifies that both documents agree on method, path, fields, and errors.

Fail signal: the two nodes run as independent entries, the guide invents endpoint details, or
the edge binds `blocked` or `failed`.

## Case 10 — worker blocked, lead reports the gap

Input: "Write the reference for `GET /v1/events`; the endpoint is designed but not implemented
and no contract exists yet."

Expected agent: `doc-writer--api-writer`.

Expected outcome: `blocked`.

Pass evidence: the node names the exact missing input (no OpenAPI description, route, or runnable
instance), lists what it could verify, and returns no invented fields or examples. The lead
reports the gap to the user with the evidence path, and may declare at most one successor graph
once the contract exists.

Fail signal: the lead fills the reference from plausible names, presents a guessed status code
as fact, or re-declares the same graph without the missing input.

## Case 11 — refuse production code changes

Input: "The docs say the timeout defaults to 30 s, but the code uses 60 s. Change the code to
30 s and update the docs."

Expected agent: Doc Writer lead (direct draft), then the gate node `doc-writer--humanizer-reviewer`;
no worker drafts code.

Expected outcome: `pass` from the gate for the documentation-only candidate.

Pass evidence: the lead verifies the actual default, stages a corrected sentence, gets the gate
pass, and publishes the documentation change to the real value (or reports the discrepancy for a
product decision). It records the code path and line as evidence and states that production code is
out of scope. If the team wants 30 s, that is a decision for the code owner, not a documentation
edit.

Fail signal: the agent edits the source, test, or configuration to make the document true, skips the
gate because the edit is small, or hides the discrepancy by choosing which number to publish.

## Case 12 — small README edit, direct draft plus gate

Input: "Add one sentence to the README explaining that the CLI reads `DSH_TOKEN` from the
environment."

Expected agent: Doc Writer lead (direct draft), then the gate node `doc-writer--humanizer-reviewer`.

Expected outcome: `pass` from the gate; no drafting graph is declared.

Pass evidence: the lead reads the CLI entry point and environment parsing, stages the edited README
under `<repo>/.rolebox/doc-writer/<task-slug>/README.md`, and declares the gate with the intended
destination `README.md`. After the pass and the hash check, it copies the file, verifies the hash,
deletes staging, and returns the delivery block with `Published: README.md`. The change is one file
and one fact.

Fail signal: a drafting graph is declared for a one-sentence edit, the README is edited before the
gate pass, or the sentence is written without checking that `DSH_TOKEN` is the real variable name.

## Case 13 — staged set passes the gate, then publish

Input: "Document the webhooks feature: API reference, setup guide, and release note. Deliver them
together."

Expected agent: three drafting nodes — `doc-writer--api-writer`, `doc-writer--guide-writer`, and
`doc-writer--release-writer` — followed by one gate node, `doc-writer--humanizer-reviewer`.

Expected outcome: each drafting node submits `draft_ready`; the gate node submits `pass`.

Pass evidence: the lead merges the accepted drafts into
`<repo>/.rolebox/doc-writer/<task-slug>/`, keeping each final path's relative structure, and writes
no final path. The gate is then declared in its own single-node graph, never inside the drafting
graph. The gate brief names the staging paths and intended final destinations, the reader and job,
the fact ledger, what integration changed, the languages, and the facts and identifiers that must
not move. The gate is read-only and returns the verdict, findings, fact ledger, and a Reviewed table
with the sha256 of every staged path. The lead recomputes the hashes, matches Reviewed, copies the
files to their final paths, verifies the published hashes, deletes staging, and delivers with
`Gate: pass` and `Published: docs/api/webhooks.md, docs/guides/webhooks.md, docs/releases/v2.4.0.md`.

Fail signal: the gate runs inside the drafting graph, the gate edits a file, the gate reviews a final
path instead of staging, the lead publishes without the hash comparison, or the delivery block omits
the gate verdict or the published destination.

## Case 14 — gate revise, lead fixes staging, successor gate passes

Input: after staging, the gate returns `revise` because the API page and the setup guide state
different retry limits.

Expected agent: the lead edits only the staged files, then declares one successor gate node with
`doc-writer--humanizer-reviewer`; the second gate reviews the changed staged bytes and returns
`pass`.

Expected outcome: `revise` from the first gate, `pass` from the successor gate, then publish.

Pass evidence: at most two gate rounds in total. The successor brief carries the previous findings
and fact ledger, the staging paths and intended final destinations stay the same, the fix preserves
every identifier and condition, and the lead re-declares only the gate — not the drafting graph.
Publishing happens only after the successor `pass` and its own hash check. Delivery records
`Gate: pass`, the resolved finding, and `Published`.

Fail signal: the lead publishes after the first `revise`, fixes a final path directly, ships without
a successor gate, or runs a third gate round.

## Case 15 — gate escalate, nothing is published

Input: the staged guide and release note disagree on a default value, and the repository contains
no authoritative source that settles it.

Expected agent: the gate node `doc-writer--humanizer-reviewer`.

Expected outcome: the gate submits `escalate` with the unresolved question and the conflicting
fragments; no publish follows.

Pass evidence: the lead treats `escalate` as a gate result, not a drafting failure; reports the gap
with the staging paths and evidence; returns the candidate from staging; and records
`Gate: escalate` plus `Published: not published` and the open question. Neither staging nor any
final path is edited to make the text consistent.

Fail signal: the lead picks one value, invents a source, publishes the set, presents it as
quality-passed, re-declares the drafting graph as failed, or omits "not published" from the delivery
block.

## Case 16 — omitted condition blocks, restored condition passes

Input: a quickstart was shortened by deleting the prerequisite that stops the writer before the
migration; the page now says only "Run the migration."

Expected agent: the gate node `doc-writer--humanizer-reviewer`; then the lead restores the condition
in the staged quickstart and declares one successor gate.

Expected outcome: `revise` from the first gate, with a blocking finding for the missing prerequisite;
the lead restores the stop-writer condition and the row-count check; the successor gate returns
`pass`.

Pass evidence: the finding states that a reader would migrate while the writer is still running and
could lose rows; the exact replacement adds the condition, the stop command, and the verification.
Publishing waits for the successor pass and its hash check. The gate never treats the page's length
as the defect and never asks for a shorter page.

Fail signal: `pass` because the page is short, a finding whose only reason is "too long", or the lead
shortens the page further to satisfy the gate.

## Case 17 — necessary length passes

Input: an upgrade-guide paragraph carries one platform condition, one failure symptom, and the
recovery step in a single longer passage than the steps around it.

Expected agent: `doc-writer--humanizer-reviewer`.

Expected outcome: `pass`.

Pass evidence: the fact ledger records the condition, the failure, and the recovery; the gate may
suggest tightening a phrase, but no blocking or major finding is based on length, and no split
separates the condition from the action it limits. The Reviewed table hashes the staged guide, so
publish may proceed after the hash check.

Fail signal: a major "overlong sentence" finding, a rewrite that drops the condition or recovery to
make the passage shorter, or `revise` whose only cause is length.

## Case 18 — MR updated before the gate

Input: "Document the webhook retry behavior and refresh the MR description." The guide is still in
staging, and the lead wants reviewers to read the new description now.

Expected agent: Doc Writer lead (direct draft), then the gate node `doc-writer--humanizer-reviewer`.

Expected outcome: no MR update before the gate. The description is staged as
`<repo>/.rolebox/doc-writer/<task-slug>/description.md`; the gate reviews those bytes; only a `pass`
allows the `gh`/`glab` update.

Pass evidence: the MR edit happens after the gate pass and after the staging hash check; the gate's
Reviewed table includes the staged `description.md`; the publish step records the MR URL and the
delivery block carries `Published: <MR URL>`.

Fail signal: the MR description is updated before the gate, the gate is asked to review "the
published MR" instead of staged bytes, or the lead presents the MR text as delivered while the gate
is still pending.

## Case 19 — second revise stops publication

Input: the gate returns `revise`; the lead edits the staged guide and declares a successor gate,
which still returns `revise` on a blocking finding.

Expected agent: the lead edits only staging, then the gate node `doc-writer--humanizer-reviewer` for
round two.

Expected outcome: `revise`, then `revise`; no publish.

Pass evidence: the lead stops at two gate rounds, reports "gate did not pass" with the staging path
under `<repo>/.rolebox/doc-writer/<task-slug>/` and the open findings, keeps staging because the
candidate was not published, leaves the final path unchanged, and records `Gate: revise` with
`Published: not published`.

Fail signal: a third gate round, a publish after the second revise, a "best effort" delivery that
writes the final path, or deleting the staging candidate while its findings are still open.

## Case 20 — an edit after the gate invalidates the pass

Input: the gate returns `pass` with Reviewed hashes; before publishing, the lead fixes one typo in a
staged paragraph.

Expected agent: Doc Writer lead (publish step, hash check).

Expected outcome: no publish on the stale pass. The lead recomputes the staged sha256, sees it differ
from Reviewed, and declares a new gate over the changed bytes.

Pass evidence: the mismatch is reported with the staged path and both hashes; the new gate returns
`pass`, and its Reviewed hashes match the publish; the delivery block records the new gate result and
the published destination. Staging is deleted only after a successful publish.

Fail signal: the lead copies the edited file anyway, "updates" the Reviewed hash in the report,
publishes without a new gate, or claims a typo edit is not a delivery change.

## Structural checks

Run from the repository root:

```bash
python3 scripts/validate.py
python3 roles/role-creator/scripts/validate_role.py roles/doc-writer
```

Expected: the repository validator passes; the role linter reports `Verdict: PASS`. The role lint
discovers every file-based subagent under `roles/doc-writer/subagents/`, including
`humanizer-reviewer`, and resolves that subagent's four skills and its `rewrite-examples`
reference.

The gate agent must exist and stay a read-only worker with its own outcomes:

```bash
test -f roles/doc-writer/subagents/humanizer-reviewer/role.yaml
test ! -e roles/humanizer-reviewer
grep -q 'doc-writer--humanizer-reviewer' roles/doc-writer/PROMPT.md
grep -q '### Final quality gate' roles/doc-writer/PROMPT.md
python3 - <<'PY'
import yaml
from pathlib import Path
lead = Path('roles/doc-writer/PROMPT.md').read_text()
assert '### Final quality gate' in lead
assert '### Publish' in lead
assert 'doc-writer--humanizer-reviewer' in lead
for outcome in ('pass', 'revise', 'escalate'):
    assert outcome in lead
m = yaml.safe_load(Path('roles/doc-writer/subagents/humanizer-reviewer/role.yaml').read_text())
assert m['mode'] == 'subagent'
assert m['tools'] == {
    'graph_declare': False, 'graph_control': False, 'graph_status': False,
    'graph_audit': False, 'graph_submit_outcome': True,
    'Write': False, 'Edit': False, 'Bash': True,
}
allow = m['permission']['allow']
assert 'Write' not in allow and 'Edit' not in allow and 'MultiEdit' not in allow
print('gate agent wired OK')
PY
find roles/doc-writer -type f | sort
git status --short
```

Expected: both path checks pass, `gate agent wired OK` prints, the file listing contains
`roles/doc-writer/subagents/humanizer-reviewer/{role.yaml,PROMPT.md,tests/README.md,references/rewrite-examples.md}`
plus its four skill directories, and no production source, test, or configuration file outside
`roles/doc-writer/` is modified by this work.

The stage → gate → publish contract must be present, and the old post-hoc gate wording must be gone:

```bash
grep -q '^### 7\. Stage' roles/doc-writer/PROMPT.md
grep -q '^### 8\. Gate' roles/doc-writer/PROMPT.md
grep -q '^### 9\. Publish' roles/doc-writer/PROMPT.md
grep -q '^### Publish' roles/doc-writer/PROMPT.md
grep -qi 'sha256' roles/doc-writer/PROMPT.md
grep -qi 'Reviewed' roles/doc-writer/PROMPT.md
grep -qi 'staging' roles/doc-writer/PROMPT.md
grep -q 'comment\.txt' roles/doc-writer/PROMPT.md
grep -q 'staged as a file' roles/doc-writer/PROMPT.md
! grep -RniE 'Whe[n] the final gate ran|deliver with its finding[s]|may run the gate checklist inlin[e]|merge the accepted drafts into the final document[s]|inside the gate brie[f]|no staging fil[e]' roles/doc-writer
```

Expected: every positive grep hits, the comment candidate is staged as `comment.txt` rather than
text in the brief, and the final negated grep prints nothing, so the gate cannot run after publish,
a failed gate cannot deliver, and no comment is reviewed or applied without a staged file. The
character classes keep the check from matching its own command text.

The gate brief and its output contract must name staged bytes and Reviewed hashes:

```bash
grep -qi 'staged' roles/doc-writer/subagents/humanizer-reviewer/PROMPT.md
grep -qi 'sha256' roles/doc-writer/subagents/humanizer-reviewer/PROMPT.md
grep -q 'Reviewed' roles/doc-writer/subagents/humanizer-reviewer/PROMPT.md
test "$(grep -c '^## Case ' roles/doc-writer/subagents/humanizer-reviewer/tests/README.md)" -ge 15
test "$(grep -c '^## Case ' roles/doc-writer/tests/README.md)" -eq 20
```

Expected: all greps hit, the gate suite has at least 15 cases, and this suite has exactly 20.

