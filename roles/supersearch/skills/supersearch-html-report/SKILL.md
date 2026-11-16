---
name: supersearch-html-report
description: Compose evidence-backed research prose with the supplied HTML components and visual system; review the assembled report before delivery.
---

# SuperSearch HTML Report

Turn the evidence ledger into a standalone HTML deliverable. Load
`supersearch-reporting` for the shared writing, depth, direct-citation and closing
evidence-limits rules; this skill governs HTML composition and delivery.

## When to activate

Use for an explicit report request (报告 / 调研报告 / document / HTML deliverable)
or a multi-section research synthesis with at least three substantive sections,
each carrying cited sources. Quick factual lookups, single-answer questions and
short lists stay in chat.

## Authoring boundary

[components.html](components.html) is the required component library and visual
baseline. Read its instructions, stylesheet, relevant markup and script
dependencies before writing HTML. It is not merely visual inspiration. If the
asset cannot be read, locate the installed skill's sibling asset; if still
unavailable, report the missing dependency and keep the supported answer in chat.
Do not silently substitute a newly designed page or claim the HTML is complete.

Keep these three decisions separate:

- **Presentation comes from the library.** Reuse its CSS tokens, typography,
  spacing, colors, reading shell and the markup/class contracts of selected
  components. Preserve the light/dark, narrow-screen, print and focus styles.
  Copying the stylesheet and shell is expected; copying the demo article is not.
- **Composition comes from the question.** Write original headings, choose the
  section order and depth, and combine prose with only the components that carry
  useful information. There is no fixed chapter list, paragraph count, table
  schema or per-section bundle. A section may consist entirely of paragraphs.
- **Claims come from inspected evidence.** The library's sample prose, figures,
  URLs and labels are never research material. Layout needs do not justify new
  facts, scores, examples presented as observations, or stronger conclusions.

Do not replace the supplied design with custom cards, a dashboard, hero panels,
another CSS framework, renamed equivalents or inline style overrides. Ordinary
semantic HTML within a component is allowed. When content needs more room, add
paragraphs, subsections or rows using existing primitives. A necessary local
accessibility or overflow fix may be minimal and documented in working notes;
it is not permission to redesign. An explicit user request for a different
presentation overrides this default; record its scope and preserve the evidence
and writing rules.

## Compose from the content

1. Load `supersearch-reporting` and `supersearch-evidence-synthesis`. In working
   notes, identify the reader's job and map each material question to a supported
   answer, source locators, necessary qualifications and a place in the argument.
   Resolve central evidence gaps before polishing. These notes are not a report
   template and do not appear as workflow metadata in the deliverable.
2. Draft the explanation in prose. Then map its parts to the component vocabulary
   below, recording why each non-prose component helps. Do not plan one of every
   component or compress the reasoning to fit a block.
3. Assemble with the supplied stylesheet and `.wrap` reading shell. Place the
   `.toc-nav` and top-level `section[id]` elements directly inside `.wrap`, as in
   the library; use `h3` for subsections inside them. Retain one `h1`, meaningful
   section headings and unique IDs. Generate TOC labels and links from the actual
   argument, not the demo's headings. The TOC is navigation, not an outline to fill.
4. Preserve selected components' classes and DOM dependencies. Keep the supplied
   navigation, search and theme implementation by default. If an interaction is
   unnecessary, omit its controls and dependent script together; do not leave a
   live listener for a missing element. The library marks separate TOC, theme
   and search script blocks. Search requires `searchToggle`, `searchPanel`,
   `searchInput` and `searchResults`; theme requires its button and head
   initialization script. If omitting the TOC, use the library's `.wrap--prose`
   variant to avoid an empty grid column.
5. Add direct citations in context, a deduplicated `.src-list`, and one closing
   `.evidence-note`. Check the final file with the review below before delivery.

### Component vocabulary

These are available building blocks, not a mandatory sequence. Reuse their
supplied rules instead of creating lookalike components with different classes.

| Need in the argument | Supplied component | Use boundary |
|---|---|---|
| Explain a finding, mechanism or consequence | `section[id]`, `h1`/`h2`/`h3`, `p`, `strong`, `code`, `pre` | Prose is the default; headings describe the subject, not the component |
| Cite a factual passage | `a.citation` with a direct inspected source locator | A bibliography jump alone does not support a body claim |
| Compare the same attributes across items | `table`, `thead`, `tbody`, `th[scope]`, `td` | Choose columns from the question; cite data at the point of use |
| Present steps or parallel items | `ol`/`ul`, `li` | Keep causal reasoning in paragraphs |
| Examine exact source wording | `blockquote` with attributed `footer` and `a.citation` | Faithful short quotation only, never an invented summary dressed as a quote |
| Isolate a consequential exception | `aside.note` (`.warn`/`.neg-box` only when appropriate) | Do not repeat the section's conclusion in a callout |
| Explain with a sourced image | `figure.figure`, `img`, `figcaption`; optional `.figure-grid` | Use only when the inspected image adds information |
| Let readers browse sources | `ol.src-list` | Supplement direct citations; do not duplicate the same source entry |
| State overall evidence coverage and limits | `aside.evidence-note` | Once at the end; claim-specific restrictions stay beside the claim |

Keep text, source links and TOC navigation usable without JavaScript. Preserve
accessible labels and keyboard access for retained controls. Do not shorten a
substantive explanation to fit a component or a size/word quota. Reuse shared
styles and scripts once rather than duplicating them per section.

## Figure collection

Review scout figure candidates and, when useful, make a targeted image pass over
already-inspected official pages. Choose figures that explain a mechanism,
comparison or observation; availability alone is not a reason to insert one.
There is no figure quota per section and no need to use every candidate.

- Use only images actually found on inspected sources. No generated, stock or
  invented images; omit figures that do not add explanatory value.
- Hotlink the direct external http(s) image URL in `img src`. Do not download
  images or embed base64/data URIs. Verify the URL's image content type when
  uncertain.
- Give each image meaningful alt text and each `<figure>` a `figcaption` that
  explains its relevance and links to the source page with attribution. Include
  that page in the source list as well.

## Output and chat contract

Write `.rolebox/reports/<topic-slug>-<YYYYMMDD>.html` in the current workspace.
Never overwrite an existing file; append `-2`, `-3`, etc. until the name is free.
Writing the report stays within this directory.

The HTML is the full deliverable. Keep chat to a concise key result and any
qualification essential to interpreting it, ending with a clickable link whose
target is the absolute report path. Do not echo the report's closing confidence
and gaps assessment as a second boilerplate summary.

## Review the assembled report

The lead reopens the written HTML and reviews its actual reader-visible text
against the question-to-evidence map and the library. Review meaning and facts
first, then structure, sentences and words using `supersearch-reporting`; check
component fidelity and behavior afterward. An earlier scout audit cannot verify
a file that did not yet exist. This is a lead review, not an independent audit.

- **Content:** all material questions are developed to the depth their importance
  warrants; sections add distinct information; no sample prose or unfinished
  authoring placeholders remain. Necessary technical terms are explained, and
  plain language carries the surrounding argument.
- **Evidence:** material claims, quotations and table data have supporting links
  at the point of use, directed to inspected sources, not only to a page-end
  bibliography. Check what each source actually supports, including scope,
  dates, units, negation and uncertainty; a relevant URL is not enough. Reconcile
  newly introduced claims with the evidence ledger or remove them. Quotations
  are faithful and attributed; inference is clear.
- **Limits:** one closing evidence assessment, without repeated confidence
  blocks; claim-specific qualifications remain where needed.
- **Structure:** meaningful title and headings, unique IDs, and all internal
  navigation links resolving to their intended targets. Section order and
  component choices serve this topic rather than reproduce the demo outline.
- **Components:** compare the emitted CSS, shell and selected markup to the
  library, including `.citation`, `.src-list` and `.evidence-note`. Reject
  arbitrary restyling or replacement components even if the HTML renders well.
  Check retained DOM/script dependencies and any documented minimal fix or
  user-requested presentation exception. Do not require every optional component.
- **Figures:** useful and traceable, with alt text, attributed captions and
  external http(s) image URLs; no base64/data image URLs.
- **Rendering:** inspect the report at wide and narrow widths and check retained
  navigation/search/theme controls and print layout when the available tools
  support it. Otherwise state the verification limit without claiming a visual
  check. Check that citations remain visible and usable.
- **Delivery:** the file exists at the intended unused path and the final chat
  links to it. Remove component-demo instructions and unused scaffolding.

Keep findings in working notes as location, reader impact, evidence and required
change. Correct unsupported claims, changed meaning, missing material answers,
component drift and broken controls before delivery. After any edit, reopen the
file and recheck affected claims and components; do not reuse a pre-edit review
as proof. Record which content, component and rendering checks actually ran.
Unavailable rendering tools are a stated verification limit, not a visual pass.
