# Inter-agent contracts (schema_version: 1)

Every SuperSearch business payload is a JSON object with `schema_version: 1`. A
worker submits it as the `data` argument of
`graph_submit_outcome({graph_id, node_id, outcome_id, credential, data})` for the
outcome id its dispatch names. Accepted attempt results are the transport
authority: the lead reads them from `attempts[].result` with `graph_status`. A
prose message, a chat update or an inferred completion is not transport and
releases no consumer.

This host registers no validators and no business JSON schemas, so these payload
shapes are a prompt contract, not an engine gate: the declaration carries no
`data` schema and no `acceptance`, and the fields below are inert data the engine
never inspects. Reject unknown schema versions, missing required fields and
unknown ids during synthesis. Never put the attempt credential, the graph id or
host state into business data.

## scout-report (submitted by local, web and source scouts)

The scout settles `evidence_ready` with this report. It is a factual channel
report, not a product verdict: a `no_evidence`, `blocked` or `failed` outcome
carries the non-success payload below instead.

| Field | Content |
| --- | --- |
| schema_version | 1 |
| report | `"scout-report"` |
| outcome_id | The settled outcome id: `evidence_ready`, `no_evidence`, `blocked` or `failed` |
| node | The scout channel: `local-scout`, `web-scout` or `source-scout` |
| objective | The question the channel searched, restated from the node brief |
| queries | Array of `{channel, query, tool, result}`: every query, the channel it targeted, the tool used, and what it returned (including empty or failed) |
| artifacts_inspected | Array of file paths, URLs or documents actually inspected, distinguished from search hits |
| findings | Array of `{claim, evidence}`: each `claim` is one supported statement, and `evidence` is an array of entries described below |
| figure_candidates | Array of `{image_url, source_page, context, section}`: direct external image URL, the page hosting it, alt/context text, and the report section it fits |
| gaps | Array of what was not found, not verified, or unreachable through this channel |
| suggested_next | Array of concrete follow-up searches for other channels or a later round |

### findings[].evidence[] entries

| Field | Content |
| --- | --- |
| source | The source identity: repository, site, document, tool or session |
| url | The external URL when the evidence is on the web; exactly one of `url` or `path` is present |
| path | The repository-relative or absolute file path when the evidence is local; exactly one of `url` or `path` is present |
| quote | The exact supporting text, symbol, line or command output excerpt |
| confidence | `high`, `medium` or `low`, following the evidence-synthesis confidence rules |

## audit-report (submitted by the evidence auditor)

The auditor settles `audit_ready` with this report. It is an audit of the
accepted scout reports, not new broad research and not a product verdict.

| Field | Content |
| --- | --- |
| schema_version | 1 |
| report | `"audit-report"` |
| outcome_id | The settled outcome id: `audit_ready`, `blocked` or `failed` |
| audited_inputs | The accepted upstream results actually read, with their node ids and attempt ids |
| unsupported_claims | Claims whose cited evidence does not support them, each with the claim and the specific gap |
| weak_tool_choices | Places where a stronger tool for the evidence type was skipped, with the recommended tool |
| conflicts_or_stale_evidence | Contradictions between sources and stale or version-scoped evidence, named rather than averaged away |
| missing_primary_checks | Primary sources, contradiction checks or verification passes still missing |
| confidence_adjustments | Per-claim confidence changes with the reason for each change |
| final_answer_risks | Residual risks the final answer must state or hedge |
| html_report_findings | Defects in a produced HTML deliverable: unreplaced `{{ placeholders }}`, a missing `.confidence` source note, an empty `.src-list`, figures without a source attribution in the `figcaption`, `data:` URIs or non-http(s) image `src`, and sections with candidate figures but no figure; empty array when no report was produced |

## Non-success payloads

These settle `no_evidence`, `blocked`, `failed` or `clarification_required` and
are declared exits: they never feed a downstream node.

| Payload | Fields |
| --- | --- |
| blocked | `schema_version`, `report`, `outcome_id`, `reason`, `missing_prerequisite`, `completed`, `remaining` |
| failed | `schema_version`, `report`, `outcome_id`, `reason`, `attempted`, `completed`, `remaining` |
| clarification_required | `schema_version`, `report`, `outcome_id`, `question`, `options`, `why_blocking`, `completed`, `remaining` |

- `report` is `"blocked"`, `"failed"` or `"clarification_required"` accordingly.
- `reason` names the concrete condition; `missing_prerequisite` names the exact
  resource, credential or access that is absent.
- `completed` and `remaining` preserve partial work so a continuation can resume
  without repeating finished effects.
- A `clarification_required` payload asks one material question for a real user
  choice; it is never used to avoid a search that could be attempted.

## Handoff rules

- A scout or auditor submits exactly one outcome for its node; the outcome id in
  the payload must equal the submitted `outcome_id`.
- The lead reads only accepted results, keyed by the producer node and attempt
  identity, and merges them into the evidence ledger before synthesis.
- A missing required report or a result that contradicts its own outcome id is
  incomplete evidence; the lead states the gap rather than treating phase
  completion as research success.
