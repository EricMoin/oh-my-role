---
name: supersearch-reporting
description: Write source-backed answers and detailed research reports with clear prose, direct citations, and consolidated evidence limits.
---

# SuperSearch Reporting

Lead with the answer in the user's language. A quick lookup needs a short answer;
a research report needs a developed explanation. Concision means removing
redundancy, not removing useful detail.

## Build the explanation

- Organize around the user's questions and decisions, not the order of searches
  or the fields in worker reports. Before drafting a report, map each material
  question to its evidence, explanation and place in the outline. Merge sections
  that would answer the same question.
- Give each concept one full explanation where the reader first needs it.
  Elsewhere, use a brief reminder or a section link only when it helps a new
  argument. The opening summarizes the result; the body adds the reasoning and
  evidence. Do not repeat that result as a section lead, table, callout and recap.
- Make paragraphs advance the explanation: connect a finding to why it happens,
  the evidence for it, and what it changes for the reader. Do not turn a ledger
  of fragments into a report by adding headings.
- Keep technical terms when they identify a mechanism, interface, constraint,
  metric, version or distinction that matters. Explain unfamiliar terms on first
  use and keep exact identifiers where needed for verification. Describe actors,
  causes, comparisons and consequences in ordinary language; jargon is not a
  substitute for explaining the relationship.
- Prefer concrete statements: replace “形成治理闭环、提升系统韧性” with an
  account of who detects which failure, what action follows, and what that action
  prevents. Do not invent those details when evidence is missing.

## Depth without repetition

For each important point, develop the relevant dimensions: what happens and how,
supporting observations or data, a concrete example, conditions and exceptions,
alternatives and tradeoffs, and practical consequences. Choose the dimensions
that answer this request; these are thinking prompts, not mandatory subheadings
to stamp onto every section.

For example, a recommendation to retry failed requests may need the retryable
failure types, timing and limits, duplicate-write behavior, load effects, and
conditions where retrying makes things worse. Rephrasing “retries improve
reliability” across several sections does not provide that depth.

Allocate space by importance and complexity. A central mechanism can need several
paragraphs and an example; a peripheral fact can need one sentence. Do not impose
a fixed paragraph count, uniform section length or arbitrary word limit on a
detailed report. If a material dimension lacks evidence, investigate it or state
the specific gap rather than padding the report with generalities.

Use tables for genuinely comparable items and prose for causal explanations.
Choose list columns for the user's decision; confidence and caveat columns are
not mandatory. A figure or quotation should contribute information the surrounding
text does not already supply.

## Cite at the point of use

- Place a citation beside the sentence, paragraph or table cell it supports.
  Cover quotations, paraphrases, numbers, comparisons and material factual claims.
  One citation can cover a coherent paragraph from one source; split citations
  when sources or claims differ. Avoid both unsourced sections and redundant
  links after every sentence of the same supported passage.
- Link directly to the inspected source, preferably its relevant heading, page,
  or commit and line range. Do not invent anchors. In HTML use an ordinary
  `<a href="https://…">descriptive source label</a>`; in Markdown use
  `[descriptive source label](URL)`. A numbered citation is fine if it links
  directly to the source. A link to `#sources` or a bibliography entry alone does
  not satisfy a body citation. Internal section links serve navigation instead.
- For local evidence, cite the actual file and line or a verified repository
  permalink. Preserve version/date context when it changes the claim. Do not
  turn a search snippet or an uninspected reference into a verified citation.
- Quote when the original wording matters (a definition, commitment or disputed
  statement). Use quotation marks or `<blockquote>` and put the attributed source
  link immediately with the quote; a `cite` attribute alone is not a visible link.
  Keep excerpts short and faithful, mark omissions and translations, and respect
  quotation limits. Explain what the excerpt establishes. Paraphrases still need
  citations, but must not be presented as verbatim text.
- Cite the premises of an inference and identify the inference in natural prose;
  a nearby source link must not imply that the source made your deduction.
- A deduplicated source list at the end helps readers browse the evidence. It
  supplements direct body citations rather than acting as the only citation path.

## Confidence and limits

Keep per-claim confidence in the internal evidence ledger and audit. In a report,
consolidate the overall assessment, evidence freshness, material conflicts and
unresolved gaps into one closing “Evidence and limits” note. Explain which
conclusions are affected and what evidence could change them; do not repeat
high/medium/low labels, confidence paragraphs or generic disclaimers by section,
table row, opening summary and closing summary.

Keep a qualification next to a claim when it is needed to read that claim
correctly: a version restriction, an inference, a disputed result, or a missing
measurement. State that concrete boundary once in context. Consolidating the
overall assessment must not make uncertain claims sound established or move a
decision-changing limitation out of sight.

For short chat answers, use a brief closing limitation only when material. If an
answer was not found, name the relevant channels searched and the specific
remaining unknown. Include search-process details only when they help assess the
result.

## Report deliverables

For explicit report/document requests, or a multi-section research synthesis
with at least three substantive sections carrying cited sources, load
`supersearch-html-report` and write the HTML deliverable under `.rolebox/reports/`.
Apply this writing contract to the full report; keep the chat response to the key
result and a link with the absolute report path. Do not repeat the report's
confidence-and-gaps section in chat. Preserve any qualification essential to the
key result.

Before delivery, check the question-to-evidence outline for omissions and read
the draft for repeated concepts, unexplained jargon, thin central sections, and
citations that fail to support the adjacent text. Fix those defects before
polishing presentation.
