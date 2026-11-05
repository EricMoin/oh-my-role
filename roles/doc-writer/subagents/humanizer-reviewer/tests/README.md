# doc-writer--humanizer-reviewer — staged-byte gate review cases

These are judgment cases for the Humanizer Reviewer, the final quality gate of Doc Writer, not
automated tests. Each case states the input, the expected verdict and findings, the evidence
that the behavior was correct, and the failure signal. A case passes only when the report
preserves every listed fact and adds none, and a `pass` covers only the hashes in its Reviewed
table.

## Gate semantics

The gate runs after the lead has merged the accepted drafts into staging; it reviews the staged
bytes, before anything is published, not a single draft and not the published destination. Every
case below is judged in that frame.

- Verdicts are `pass`, `revise`, and `escalate`. `pass`: no blocking or major finding; minor
  findings and suggestions may remain. `revise`: at least one blocking or major finding, and
  the meaning is recoverable by targeted or structural repair. `escalate`: the meaning cannot
  be recovered, a required fact is missing, or contradictory claims cannot be settled from the
  supplied evidence. The method's PASS/REVISE/REWRITE names describe repair size; REWRITE maps
  to `revise` when recoverable and to `escalate` when not.
- Read-only: the gate never edits, rewrites, formats, or commits a file, in the staging tree or
  at a final path. Its findings carry exact replacements; the lead applies them.
- Staged review surface: the files under `<repo>/.rolebox/doc-writer/<task-slug>/`, each with its
  intended final destination. The final destinations are untouched; when the currently published
  version is supplied, diff the staged bytes against it.
- Reviewed hashes: a `pass` report carries a Reviewed table with the sha256 of every staged file
  it read. The pass binds exactly those bytes; an edit after the gate invalidates it and the text
  needs a new gate.
- Integrated set: review the staged set as a whole, including what integration changed, not each
  draft in isolation.
- Cross-section consistency: duplicate facts with different values, conflicting claims,
  terminology drift, section order, and the reader path across sections are gate findings,
  even when every individual sentence reads well.
- A gate `revise` or `escalate` is not a drafting failure; it is a routed result for the lead, and
  nothing is published from it.

## Case 1 — English AI-slop

Input: `docs/retry.md`: "In today's fast-paced world, our robust worker seamlessly leverages
idempotent retries to ensure comprehensive delivery."
Expected: a major AI-slop finding and one proposed rewrite that removes the filler, keeps the
worker, `idempotent`, and delivery, and adds no count, interval, or guarantee.
Pass evidence: the finding names the reader effect, `idempotent` is in the fact ledger, and the
rewrite keeps it.
Fail signal: "exactly once" delivery, an invented retry count, a dropped `idempotent`, or REWRITE
from one sentence.

## Case 2 — Chinese translationese

Input: "对于已经完成迁移的用户而言，可以通过执行 `rolebox sync` 来对本地配置进行更新。"
Expected: a natural rewrite such as "完成迁移的用户执行 `rolebox sync` 即可更新本地配置。" The command stays
byte-identical, the completed-migration condition stays, and 本地配置 stays.
Pass evidence: the finding names the 对于……而言 / 通过……来…… frame and the ledger records the command
and the condition.
Fail signal: a translated or reformatted command, an added version or platform, or a dropped
condition.

## Case 3 — vague reference

Input: "The worker writes the record to the queue. If this fails, retry it."
Expected: a blocking finding for the two unresolved references and a question asking which step
fails and which object is retried. No rewrite chooses an interpretation.
Pass evidence: the original sentence stays in the suggested-rewrite column, the question is under
Unresolved, and the role asks before issuing a verdict for that passage.
Fail signal: a guessed rewrite ("if the queue write fails, retry the write") presented as a fix, or
PASS because the grammar is fine.

## Case 4 — numbers, units, and commands

Input: "Set `timeout_ms` to 30000. Failed requests are retried 3 times with a 2 s backoff."
Expected: no change to `timeout_ms`, `30000`, `3`, `2 s`, or the retry policy; a wording change that
would touch any of them is reported, not edited.
Pass evidence: the ledger contains all five items, any rewrite keeps `ms` and `s`, and the report
states the numbers are unchanged.
Fail signal: "about 30 seconds", "a few retries", or "2 second backoff" with a changed unit.

## Case 5 — marketing in a runbook

Input: `runbooks/deploy.md`: "Deploying with our best-in-class pipeline is a breeze — just ship it
and enjoy the magic."
Expected: a major tone-mismatch finding; the rewrite states the action and result the runbook
supports, for example "Push the branch; the pipeline deploys it." No rollback, monitoring, or timing
is added.
Pass evidence: the category is tone mismatch, the problem names the runbook reader, and the ledger
keeps the pipeline and the deploy action.
Fail signal: a launch-announcement rewrite, an invented verification step, or an AI-slop-only finding
that misses the register.

## Case 6 — already-clear text

Input: "Run `make test` from the repository root. The command exits with code 0 when all tests pass."
Expected: PASS with no findings; the sentence is active, concrete, and keeps the command and the
exit condition.
Pass evidence: zero findings; the ledger lists `make test`, the repository root, exit code 0, and the
pass condition; the report says no edit is needed.
Fail signal: "Run" flagged as filler, a rewritten command, an added expected duration, or a minor
finding invented to have something to report.

## Case 7 — mixed-language document

Input: an English heading ("Retry behavior"), a Chinese paragraph ("当 `retries` 用尽后，任务会进入死信
队列。"), and a YAML block with `retries: 3`.
Expected: the Chinese paragraph is reviewed with the Chinese pass; the heading and the YAML block are
not treated as prose; `retries` stays an identifier; no Chinese and English findings merge into one
row.
Pass evidence: findings are scoped to the paragraph, the code block is untouched, and the ledger
records `retries`, `3`, and the dead-letter condition.
Fail signal: a translated YAML or identifier, the English heading reported as inconsistent, or the
document rewritten into one language.

## Case 8 — technical terms and identifiers

Input: "The consumer group is idempotent; `payload_hash` is stable across retries."
Expected: PASS with no findings; `idempotent` and `payload_hash` are precise terms, not slop.
Pass evidence: no finding for either term, and the ledger records both plus the retry condition.
Fail signal: `idempotent` replaced with "safe", the code formatting removed, or the semicolon marked
major.

## Case 9 — genuine uncertainty

Input: "The cache may reduce p95 latency. We have not tested it under write-heavy load."
Expected: the uncertainty is preserved: may stays, the untested condition stays, and no rewrite
upgrades the claim. A suggestion may ask for a measurement.
Pass evidence: the ledger marks may and the untested condition as preserved; no rewrite claims a
measured improvement.
Fail signal: "The cache reduces p95 latency", the caveat deleted, or the caveat turned into a
supported claim.

## Case 10 — rule-of-three and repeated summary

Input: "The API is fast, scalable, and secure. ... In summary, the API is fast, scalable, and secure."
Expected: minor findings for rule-of-three padding and repeated summary, the summary deleted, and
any unsupported claim named as unsupported rather than silently deleted. No major finding means PASS
with minor findings listed.
Pass evidence: two minor findings, one deletion, a note that unsupported claims need author
confirmation, and a PASS verdict.
Fail signal: REWRITE for two minor issues, all three adjectives deleted without analysis, or an
invented benchmark.

## Case 11 — necessary length passes

Input: one paragraph carries a platform condition, a failure symptom, and the recovery step; it is
longer than the steps around it.

Expected: PASS with no blocking or major finding. The gate records the condition, the failure, and
the recovery in the ledger, and may suggest a tighter phrase without dropping any of them.

Pass evidence: no finding whose only basis is length; the ledger lists all three elements; any minor
suggestion leaves the condition attached to the action it limits.

Fail signal: a major "overlong sentence" finding, a split that separates the condition from the
action, or a `revise` caused only by the passage's length.

## Case 12 — label-only summary blocks

Input: "按调研：删 filler、反 AI-slop、plain language。" The page never defines the three labels or
shows what to replace.

Expected: one major `Compressed reference / label-only summary` finding; the replacement expands
each label once with a definition, one example, and the substitution, without adding a claim the
source does not support.

Pass evidence: the finding names the reader who did not see the research notes; the replacement
defines all three labels; after the first use the short names stay.

Fail signal: a minor wordiness finding, deletion of the sentence without replacing the content, or
invented research findings.

## Case 13 — Reviewed hashes are part of the report

Input: the gate reviews two staged files,
`.rolebox/doc-writer/webhooks-20261103/docs/api/webhooks.md` (intended destination
`docs/api/webhooks.md`) and `.rolebox/doc-writer/webhooks-20261103/description.md` (intended
destination: the MR description), and finds no blocking or major issue.

Expected: `pass` with a Reviewed table that carries both staged paths, their sha256, and each
intended final destination. The hashes are computed from the staged files.

Pass evidence: `sha256sum` or `shasum -a 256` output matches each pasted hash; the report states
that the pass covers only those bytes; neither final destination was written.

Fail signal: a `pass` with no Reviewed table, a hash copied from the published file, an invented
hash, or a staged path missing from the table while the report claims the whole set passed.

## Case 14 — the gate never writes

Input: during the review the gate notices that the staged quickstart omits a prerequisite that the
currently published page also omits.

Expected: a `revise` finding with the exact replacement text. Neither the staged file nor the final
path is edited.

Pass evidence: the staged file's hash before and after the review is identical; `git status` shows
no change from the gate; the finding carries the replacement for the lead to apply.

Fail signal: the gate edits the staged file, writes the final path, formats a file, or applies its
own replacement to save a round.

## Case 15 — an edit after the pass invalidates it

Input: the gate returns `pass` with Reviewed hashes, and the lead then edits one staged paragraph
before publishing.

Expected: the lead recomputes the staging sha256, sees a mismatch with the Reviewed table, and does
not publish; the text goes through a new gate.

Pass evidence: the mismatch is reported with the staged path and both hashes; the delivery block
records the new gate, not the stale pass; nothing is published between the edit and the new gate.

Fail signal: the lead publishes on the stale pass, rewrites the Reviewed hash to match the edit, or
treats a wording-only edit as exempt from a new gate.

## Structural checks

Run these from the repository root. They check the gate's shape, not its behavior.

```bash
python3 scripts/validate.py
python3 roles/role-creator/scripts/validate_role.py roles/doc-writer
```

Expected: `Validation passed.` from the registry check and `Verdict: PASS` from the role lint,
with Tier 1 manifest checks and Tier 2 skill resolution for the four local skills through the
parent role's subagent discovery.

The gate must stay a read-only worker. This check asserts the tool split and the absence of edit
grants:

```bash
python3 - <<'PY'
import yaml
from pathlib import Path
m = yaml.safe_load(Path('roles/doc-writer/subagents/humanizer-reviewer/role.yaml').read_text())
assert m['mode'] == 'subagent'
assert m['tools'] == {
    'graph_declare': False, 'graph_control': False, 'graph_status': False,
    'graph_audit': False, 'graph_submit_outcome': True,
    'Write': False, 'Edit': False, 'Bash': True,
}
allow = m['permission']['allow']
assert 'Write' not in allow and 'Edit' not in allow and 'MultiEdit' not in allow
assert m['skills'] == ['humanizer-review', 'zh-naturalness', 'en-naturalness', 'clarity-check']
assert m['references']['rewrite-examples']['path'] == 'references/rewrite-examples.md'
print('humanizer gate worker split OK')
PY
```

Expected: `humanizer gate worker split OK`.

The gate's contract must name the staged review surface and the Reviewed hash table it returns:

```bash
python3 - <<'PY'
from pathlib import Path
p = Path('roles/doc-writer/subagents/humanizer-reviewer/PROMPT.md').read_text()
assert 'Reviewed' in p and 'sha256' in p
assert '| Staged path | sha256 | Intended final destination |' in p
assert 'staged' in p.lower()
assert 'never edits staging' in p
assert 'invalidates it' in p
print('humanizer gate staged-byte contract OK')
PY
```

Expected: `humanizer gate staged-byte contract OK`. The assertions pin the Reviewed table's columns,
the staging review surface, the read-only boundary, and the rule that an edit after a pass
invalidates it.

Declared skills and the reference must resolve inside the gate directory:

```bash
for s in humanizer-review zh-naturalness en-naturalness clarity-check; do
  test -f "roles/doc-writer/subagents/humanizer-reviewer/skills/$s/SKILL.md" || echo "missing $s"
done
test -f roles/doc-writer/subagents/humanizer-reviewer/references/rewrite-examples.md || echo "missing reference"
```

Expected: no `missing` line, and `role.yaml` lists the same four skills and the `rewrite-examples`
reference.

The old top-level path must be gone, and no shipped file may still point at it:

```bash
test ! -e roles/humanizer-reviewer
! grep -Rq "roles/humanizer[-]reviewer/" roles/doc-writer README.md registry.yaml
```

Expected: no output; both checks exit 0. The character class keeps this check from matching its
own command text. The gate's own review path is
`roles/doc-writer/subagents/humanizer-reviewer`.

The banned external names are maintained by the registry review, not stored in this role, so the
check does not match its own documentation. External links must not appear:

```bash
grep -RnEi "${REVIEW_BANNED_NAMES:?supply the alternation from the review brief}" roles/doc-writer/subagents/humanizer-reviewer
grep -RniE 'https?://' roles/doc-writer/subagents/humanizer-reviewer
```

Expected: no output from either command.
