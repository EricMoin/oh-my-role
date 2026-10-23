---
name: supersearch-html-report
description: Compose a detailed HTML research report from inspected evidence, using optional component references and a topic-specific structure.
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

## Compose from the content

1. Build the question-to-evidence outline and write the explanation before
   choosing a layout. Section order, length and nesting follow the subject and
   reader's needs. Resolve gaps in the central argument before styling it.
2. Inspect [components.html](components.html), a sibling component reference.
   It demonstrates typography, navigation, search, themes, tables, quotations and
   source links. It is not a report skeleton or a fill-in template: do not copy
   the whole page and replace its sample text, or duplicate a universal section
   block. Select only components that help communicate this report. The sample
   headings, order, counts and example URLs are not report content or evidence.
3. Compose a fresh document. Reuse and adapt useful CSS/HTML/JavaScript fragments;
   change or omit the layout, styles, chrome and interactions as needed. No class
   name, shell, table shape or per-section component bundle is mandatory. When
   adapting an interaction, update its selectors and markup together and remove
   controls whose implementation you omit.
4. Put direct source links with the claims and quotations they support. Include
   a source list for browsing, and one closing evidence-and-limits note. Source
   links go to the inspected source itself; TOC links go to report sections.
5. Use meaningful headings, readable paragraphs, accessible link labels and
   responsive tables. Add a TOC when it helps navigate a long report. Keep text,
   citations and navigation usable without JavaScript; retained search and theme
   controls should also work with keyboard input and at narrow widths.

Do not shorten a substantive explanation to fit a component or a size/word quota.
Keep the document lightweight by avoiding unused assets and duplicated code.

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

## Self-check

The lead checks the finished artifact after assembly; an earlier scout audit
cannot establish the quality of a file that did not yet exist.

- **Content:** all material questions are developed to the depth their importance
  warrants; sections add distinct information; no sample prose or unfinished
  authoring placeholders remain. Necessary technical terms are explained, and
  plain language carries the surrounding argument.
- **Evidence:** material claims, quotations and table data have supporting links
  at the point of use, directed to inspected sources, not only to a page-end
  bibliography. Quotations are faithful and attributed; inference is clear.
- **Limits:** one closing evidence assessment, without repeated confidence
  blocks; claim-specific qualifications remain where needed.
- **Structure:** meaningful title and headings, unique IDs, and all internal
  navigation links resolving to their intended targets. Validate the chosen
  structure, not the reference page's classes or section count.
- **Figures:** useful and traceable, with alt text, attributed captions and
  external http(s) image URLs; no base64/data image URLs.
- **Rendering:** inspect the report at wide and narrow widths and check retained
  navigation/search/theme controls and print layout when the available tools
  support it. Otherwise state the verification limit without claiming a visual
  check. Check that citations remain visible and usable.
- **Delivery:** the file exists at the intended unused path and the final chat
  links to it. Remove component-demo instructions and unused scaffolding.
