---
name: supersearch-reporting
description: Write source-backed answers and detailed research reports with clear prose, direct citations, and consolidated evidence limits.
---

# SuperSearch Reporting

Lead with the answer in the user's language. A quick lookup needs a short answer;
a research report needs a developed explanation. Concision means removing
redundancy, not removing useful detail.

## Fix the reader and the question

Before drafting, record a short working brief: the reader and language, the
question or decision the report must help with, the requested scope and date or
version, and what a sufficient answer would establish. Infer these from the
request and inspected context; ask only when a missing choice changes the work.
This brief is working material, not a required introduction or report template.

Map each material question to the supported claim, inspected evidence, necessary
qualification, explanation still needed, and its place in the argument. Do not
add a survey, ranking, recommendation or roadmap merely to fill a component.
The user's question determines the coverage; the evidence determines what can be
said. Merge sections that would answer the same question.

## Build the explanation

- Organize around the user's questions and decisions, not the order of searches
  or the fields in worker reports. Choose headings that tell the reader which
  question or finding the section develops.
- Give each concept one full explanation where the reader first needs it.
  Elsewhere, use a brief reminder or a section link only when it helps a new
  argument. The opening summarizes the result; the body adds the reasoning and
  evidence. Do not repeat that result as a section lead, table, callout and recap.
- Make paragraphs advance the explanation: connect a finding to why it happens,
  the evidence for it, and what it changes for the reader, to the extent the
  evidence supports those relationships. Do not turn a ledger of fragments into
  a report by adding headings, or invent a cause to connect two observations.
- Keep technical terms when they identify a mechanism, interface, constraint,
  metric, version or distinction that matters. Explain unfamiliar terms on first
  use and keep exact identifiers where needed for verification. Describe actors,
  causes, comparisons and consequences in ordinary language; jargon is not a
  substitute for explaining the relationship.
- Prefer concrete statements: replace “形成治理闭环、提升系统韧性” with an
  account of who detects which failure, what action follows, and what that action
  prevents. Do not invent those details when evidence is missing.

## Keep the evidence boundary while writing

- Distinguish a source's statement, an observed result and your inference. Name
  the premises and uncertainty of an inference; a citation is not permission to
  make a stronger or broader claim than its supporting passage.
- Preserve names, numbers, units, versions, dates, exact identifiers and commands,
  conditions, exceptions, tradeoffs and uncertainty when summarizing or polishing.
  A heading, summary, table cell or caption must not broaden a qualified claim.
  Stylistic changes must not change a recommendation or its strength.
- Do not supply a missing mechanism, measurement, example or comparison from
  plausibility. Inspect further evidence, narrow the claim, or state the gap.
  A hypothetical illustration must be explicitly labeled, must be consistent
  with the supported mechanism, and cannot count as an observation or proof.
- Sample text, numbers and links in component references are design examples,
  never research evidence. Preserve source attribution when moving or merging
  paragraphs; recheck which claim each citation now supports.

## Write natural prose

- Name who does what, and explain the relationship in ordinary words. Define an
  unfamiliar term on first use; keep one name per concept and exact technical
  terms where a simpler word would change the meaning.
- In Chinese, prefer verbs to “进行／实现／作出” noun padding, break stacked 的
  clauses when they hide the action, and avoid unnecessary 被 or English sentence
  order. Remove “赋能、闭环、全面提升” when they replace an actual explanation.
  Keep established terms and identifiers; do not alternate Chinese and English
  names for variety.
- In English, prefer “use”, “check” and concrete verbs to “leverage”, “perform a
  verification” and adjective claims such as “seamless” or “robust”. Passive
  voice is fine when the actor is unknown or irrelevant. Keep real uncertainty.
- Cut “本节将介绍 / in this section we will”, ceremonial openings, decorative
  contrasts and summaries that repeat the previous paragraph. Use lists for
  steps or parallel items, tables for comparisons, and connected prose for
  reasoning. Do not replace a developed explanation with labels or card fragments.
- Keep already-clear sentences. Split when competing ideas obscure the point,
  not to meet a sentence-length rule. Conditions, rationale and costs earn space.

These are hypothetical fixtures for editing practice, not research findings:

| Given evidence | Bad rewrite | Faithful rewrite |
| --- | --- | --- |
| The worker retries timed-out requests; no other failures were checked. | “该方案全面提升系统韧性。” | “worker 会重试超时的请求；其他失败类型尚未验证。” |
| The cache reduced latency in one test; write-heavy load was not tested. | “The cache guarantees faster requests.” | “The cache reduced latency in this test; write-heavy load was not tested.” |

The faithful rewrites still need their actual source links in a report. Never
copy a fixture's facts into a real report or invent a number to make prose concrete.

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

## Lead review of the finished report

After HTML assembly, reopen the candidate file and read the actual reader-facing
text in order, including headings, summaries, tables, callouts and captions. Use
the rendered page when available; otherwise inspect the HTML's text and link
targets and record that rendering was not verified. Draft notes or an earlier
scout audit do not establish what this file now says. This is lead review, not
an independent gate.

Run separate passes in this order:

1. **Meaning:** does the report answer the brief, and can the reader follow each
   central explanation without opening the research notes? Find missing answers,
   invented scope and sections that merely restate other sections.
2. **Facts:** compare material claims and their links with the evidence ledger.
   Recheck quotations, inference, numbers, conditions, recommendation strength
   and limits in every presentation of the claim. Missing facts require evidence
   or a narrower statement, not a smoother guess.
3. **Structure:** put the result before background, keep each concept's full
   explanation in one place, and use prose, lists and components for their actual
   communicative purpose. Give central questions enough explanation.
4. **Sentences, then words:** check actors, references, terminology, natural
   Chinese or English, and filler using the rules above. Preserve the facts and
   necessary length already checked.

Keep a short internal record of the reviewed path, remaining defects and
verification limits. Fix unsupported claims, lost qualifications and passages
that force the reader to guess before delivery. Re-read changed passages and
their related summaries, links and tables after every repair; substantial
restructuring needs another whole-document pass. A review of an older candidate
does not cover later edits. Apply the HTML skill's component and rendering checks
to the finished artifact as well; keep review mechanics out of the report.
