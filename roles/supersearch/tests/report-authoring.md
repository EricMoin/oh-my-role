# SuperSearch report authoring cases

These are behavioral acceptance cases for a human or an authorized agent run.
They are authored cases, **NOT RUN** results. Structural role lint, matching class
names, and a passing scout audit do not establish that a generated report follows
these rules. Record the actual report path, observations and outcome for each run;
do not mark a case passed from the presence of prompt wording alone.

## Local evidence fixture

Use only the following fictional records as research evidence for these cases.
Read this file in the test workspace and cite its actual absolute path and the
relevant lines. The fixture describes an invented service named Cedar; it makes
no claim about a real product. No web search or model benchmark is needed to
prepare the cases. The tester supplies candidate text separately from evidence.

### Record A — Cedar v2 retry policy

> Cedar v2 只对连接建立前失败的只读请求自动重试。首次请求失败后，最多额外重试 2 次，每次间隔 500 ms。写请求不自动重试。

### Record B — Cedar v2 migration note

> 迁移前必须停止写入进程。迁移后比较迁移前后的记录数；只有记录数一致，才能恢复写入。恢复写入后应检查失败日志。

### Record C — Cedar v2 measurement note

> 目前没有 Cedar v2 的延迟、吞吐量、成功率或与其他方案的对照测试结果。重试等待时间不包括建立连接和处理请求所花的时间。

The records supply no figures, performance ranking, adoption count, safety
guarantee or recommendation for write-heavy workloads. Components and demo text
are presentation assets, not additional research evidence.

## Running and judging

Use the current SuperSearch role and its bundled component library in a disposable
workspace. For authoring cases, supply the records as inspected evidence and make
an explicit HTML report request. For review cases, supply the candidate together
with the same records. Keep the report output under `.rolebox/reports/`; the
tester, not SuperSearch, prepares missing-asset or deliberately broken candidates.

Inspect the saved HTML, its reader-visible text, source links, selected component
markup and CSS. Judge factual support before visual polish. For browser checks,
record which viewport, control or behavior was exercised; an unavailable browser
means that portion is unverified. Never substitute a string search for reading
the argument or using an interaction. No particular title, section count or
verbatim preferred rewrite is required by these cases.

## Case 1 — the same components serve different reader questions

**Input:** Run two independent requests with Records A–C: “写一份报告，解释 Cedar
v2 哪些请求会重试，额外等待怎样产生。” and “写一份报告，帮助维护者安排 Cedar
v2 迁移，并说明迁移后排查失败时需要了解的重试边界。”

**Pass evidence:** Both artifacts reuse the bundled typography, shell and selected
component structures. The first develops eligibility, retry count and waiting;
the second puts the migration prerequisite and verification before recovery and
retry behavior. Each section advances its own question. Sections and component
combinations may differ; shared evidence need not force different wording.

**Fail signal:** Either report copies the component-demo headings or fills the
same quotation/table/note/figure bundle in every section. Different section
counts alone are neither a pass nor a failure.

## Case 2 — attractive redesign is still a component violation

**Input:** Request a Cedar retry report without a design-change instruction. For
review, supply a factually correct candidate that replaces the bundled reading
layout with a hero banner, KPI cards, gradients and newly invented card styles;
leave `.citation` on its links so token reuse cannot satisfy the test.

**Pass evidence:** The lead identifies the replacement visual system, retains the
useful prose and rebuilds it with the provided shell, styles and appropriate
components. It does not add cards to the component library or rename invented
markup merely to disguise the redesign.

**Fail signal:** The candidate passes because it looks polished, contains a few
recognized classes, or has valid HTML. This case does not cover a user explicitly
requesting a different design.

## Case 3 — numbers, rankings and deductions need separate support

**Input:** Candidate: “Cedar v2 重试 2 次后，成功率提升 30%，性能排名第一，所有请求
都能在 1 秒内完成。” Ask for a source-backed report using Records A–C.

**Pass evidence:** The unsupported improvement, ranking, universal eligibility
and completion bound are removed or identified as unsupported. If the report
derives 1,000 ms, it explains that two additional waits of 500 ms yield at most
1,000 ms of configured waiting, labels this as a calculation, cites A and C, and
keeps connection and processing time outside that bound.

**Fail signal:** A nearby citation is treated as support for all four claims,
“可能” is added to preserve an invented ranking, or the waiting calculation is
presented as a measured latency result.

## Case 4 — natural Chinese preserves the factual contract

**Input:** Rewrite: “对于连接建立前发生失败的只读请求而言，Cedar v2 可以通过最多
额外重试 2 次、每次间隔 500 ms 的方式来形成稳定性保障闭环。写请求不自动重试。”

**Pass evidence:** The rewrite states the request type, failure condition and
retry action plainly. It preserves “额外”, `2`, `500 ms`, Cedar v2 and the negative
rule for writes, and removes the unsupported stability guarantee. One acceptable
result is: “Cedar v2 会自动重试连接建立前失败的只读请求：最多额外重试 2 次，每次间隔
500 ms。写请求不自动重试。” The supported passage has a direct citation.

**Fail signal:** A smoother sentence changes two retries into two total attempts,
drops the connection condition, changes the time unit or guarantees success.

## Case 5 — quotation and paraphrase are different components

**Input:** Explain Record A and quote its restriction on writes. Supply a candidate
blockquote saying “Cedar v2 会安全地重试写请求。” with only a `cite` attribute.

**Pass evidence:** The false quotation is rejected. If retained as a quotation,
the visible words match the record (“写请求不自动重试。”), use the supplied quotation
structure and have visible source attribution beside them. Explanatory paraphrase
appears as prose with a citation, without quotation marks implying verbatim text.

**Fail signal:** The quote is silently “improved”, the `cite` attribute alone is
accepted as attribution, or a body citation only jumps to a bibliography entry.

## Case 6 — remove repetition without losing a condition

**Input:** A migration candidate repeats “迁移前必须停止写入进程” in its opening,
main explanation, table and callout, but puts “只有记录数一致，才能恢复写入” only
in the final evidence note. Ask for clearer prose without losing operational detail.

**Pass evidence:** One main explanation develops the stop, migrate, compare and
resume sequence. The record-count condition sits beside the resume action; the
failure-log check remains. A brief opening can summarize the answer without
repeating the whole sequence. Necessary detail is not removed to meet a length
target, and the closing note is not used to hide the decisive prerequisite.

**Fail signal:** The result says simply “迁移后恢复写入”, keeps all duplicate blocks
because they use different components, or puts the prerequisite only at the end.

## Case 7 — no compulsory table, quotation or figure

**Input:** “用报告解释 Cedar v2 的重试等待和请求耗时有什么区别。” Supply A and C,
with no image candidates and no requirement for a comparison table.

**Pass evidence:** The report develops the distinction through sourced prose and,
if useful, a clearly identified calculation. It may omit tables, figures and
blockquotes entirely while using the report shell, citations, source list and
closing evidence note. No sample URLs or demo instructions enter the output.

**Fail signal:** A table repeats every paragraph, an invented diagram or image URL
fills a figure slot, or the report is considered incomplete solely because it
does not use every component.

## Case 8 — review the assembled artifact, then recheck edits

**Input:** Supply a passing evidence audit of A–C and a later HTML candidate that
says “记录数不一致也可恢复写入” and drops the negation in “写请求不自动重试”. In a
second candidate revision, restore those sentences but leave one table cell saying
that writes retry automatically.

**Pass evidence:** The lead reads the actual file against the records and catches
both first-draft errors. Its next review catches the inconsistent table cell;
delivery follows the repaired artifact review. The observations identify the
affected passages and supporting record, not merely “audit passed”.

**Fail signal:** The earlier scout audit certifies either later candidate, only
paragraphs are checked, or a change after review is assumed to inherit that review.
Lead review must not be described as an independent reviewer or a new graph run.

## Case 9 — missing components do not authorize free-form HTML

**Input:** In a disposable role copy, the tester makes `components.html` unavailable
and provides no substitute design asset. Request a Cedar report using A–C.

**Pass evidence:** The agent tries the documented asset location and available
role asset lookup, reports the concrete missing prerequisite if unresolved, and
retains the supported synthesis without claiming delivery of a conforming HTML
report. It does not invent a replacement stylesheet from memory.

**Fail signal:** A generic HTML page is delivered as component-compliant, the
missing file is ignored, or the agent fabricates a component inspection result.

## Case 10 — component dependencies survive assembly

**Input:** Assemble a report with the supplied TOC, search and theme controls,
real section IDs and a comparison table about A and B. Prepare one broken copy
with `searchInput` renamed but its JavaScript selector unchanged, and another
with a TOC target absent. The tester supplies those copies for review.

**Pass evidence:** Review catches the missing selector dependency and broken
anchor. In a repaired artifact, inspect a wide viewport (1280 px) and a narrow
one (390 px): TOC navigation reaches the intended section, search opens and
finds a fixture term with keyboard controls, theme switching remains readable,
and the table does not force page-wide horizontal overflow. With JavaScript
disabled, prose, direct citations and navigation remain usable. Any deliberately
omitted interaction has its whole dependent control/script bundle removed.

**Fail signal:** Broken controls remain, markup changes without matching
selectors, or a visual/interaction pass is claimed without opening the artifact.
An honestly unverified browser check remains unverified, not an automatic pass.
