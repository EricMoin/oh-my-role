---
name: supersearch-html-report
description: Produce an HTML research-report file deliverable from the evidence ledger using the bundled parameterized template. Load when the user requests a report/deliverable document or the answer is a multi-section research synthesis.
---

# SuperSearch HTML Report

Turn the evidence ledger into a standalone HTML deliverable.

## When to activate

TRIGGER: the user explicitly asks for a report (报告 / 调研报告 / document / HTML deliverable), OR the final answer is a multi-section research synthesis (>= 3 sections, each with cited sources).

Do NOT activate for quick factual lookups, single-answer questions, or short lists — those keep the supersearch-reporting default chat shape.

## Template

Load `template.html` from this skill's own directory (a sibling of this SKILL.md). Copy it to the output path, then fill every `{{PLACEHOLDER}}`.

- Fill every placeholder the template's comment block lists (title, subtitle, date, TOC groups, sections, source list, confidence, gaps). Leave none unreplaced.
- Sections: duplicate the exemplar `<section>` block once per topic, numbering from 1; set each `id="{{SECTION_ID}}"`.
- TOC: duplicate the exemplar `.toc-group` once per section. `href="#{{SECTION_ID}}"` MUST equal the matching `<section id>` exactly — otherwise scroll-spy and full-text search break.
- NEVER modify the chrome: the `<head>` theme script, the `<style>` block, `.topbar`, `.search-panel`, the `.toc-nav` shell, or any trailing `<script>`. These are class/id driven and must stay untouched.
- Figures are a core part of report quality: include at least one figure per major section where a legitimate official/primary-source image exists. Reference images by hotlinking the external http(s) URL directly in the img src — do NOT download image files (downloads are easily intercepted; hotlinks are simpler and match the reference template). Never base64. Never fabricate.
- Delete the template's self-describing comment block before delivering.

## Figure collection

Figures come from two sources:

- Figure candidates recorded in the evidence ledger by scouts.
- A targeted image pass over already-fetched official pages at assembly time.

Hotlink procedure:

- Use each candidate's direct external http(s) URL in the img `src` (hotlink). Do NOT download image files to disk.
- Before using a URL, optionally verify it returns an image content-type with `curl -sI` (only when unsure).

Attribution:

- Every `<figure>` has a `figcaption` naming the source, with a link.
- The source page also appears in the src-list (source list).

Honesty rule:

- Only images actually found on inspected sources. No generated, stock, or invented images.
- Omit the figure entirely when none exists.

## Output path

Write the finished report to `.rolebox/reports/<topic-slug>-<YYYYMMDD>.html` in the current workspace.

Never overwrite an existing file. If the path already exists, append `-2`, `-3`, ... until the name is free.

## Chat contract

The chat answer stays a concise markdown summary — Answer + Confidence + Gaps — and ENDS with the absolute path to the HTML file. The HTML file is the full deliverable; the chat message is only the pointer.

## Self-check

Before finishing, confirm all six:

1. File exists at the output path.
2. Size < 500 KB.
3. grep shows zero unreplaced `{{` placeholders.
4. Every TOC `href` resolves to an existing `<section id>`.
5. No base64 images (`data:` in any img src or style).
6. Every `<figure>` has a `figcaption` with source attribution; every img src uses an external http(s) URL; no `data:` URIs.

## Relationship

supersearch-reporting routes report-type requests to this skill; this skill stays in scope of `.rolebox/reports/` only.
