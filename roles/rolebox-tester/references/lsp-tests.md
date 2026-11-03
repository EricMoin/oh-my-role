# LSP test module — rolebox-tester 7.0.0

This document is the body of the `lsp` module of the rolebox-tester suite. It owns
**32 tests**, one per registered `lsp_*` tool, and it is **primary-executed**: the
declaring `rolebox-tester` primary runs the bodies itself. No graph worker, runner or
fixture executes a body from this file; a graph-dispatched worker's whole graph face is
`graph_submit_outcome` and it cannot call `graph_control`/`graph_status`/`graph_audit`,
so an LSP body must never be assigned to a dispatched worker. The catalog entry is
`lsp | 32 | 26, 30, 31, 35–57, 250–255 | primary | references/lsp-tests.md`.

The retained ids 26, 30, 31 and 35–57 are the v6 bodies rewritten against the shipped
rolebox 2.2.0 contract; 250–255 are new and close the six tools that v6 left untested.
Each id below names exactly one `lsp_*` tool, and every one of the 32 tools appears
exactly once:

| Id | Tool | Id | Tool |
|---|---|---|---|
| 26 | `lsp_servers` | 45 | `lsp_folding_ranges` |
| 30 | `lsp_diagnostics` | 46 | `lsp_selection_ranges` |
| 31 | `lsp_goto_definition` | 47 | `lsp_semantic_tokens` |
| 35 | `lsp_goto_type_definition` | 48 | `lsp_code_lens` |
| 36 | `lsp_find_references` | 49 | `lsp_inlay_hints` |
| 37 | `lsp_document_highlights` | 50 | `lsp_document_links` |
| 38 | `lsp_document_symbols` | 51 | `lsp_document_colors` |
| 39 | `lsp_workspace_symbols` | 52 | `lsp_goto_implementation` |
| 40 | `lsp_hover` | 53 | `lsp_goto_declaration` |
| 41 | `lsp_signature_help` | 54 | `lsp_type_hierarchy_supertypes` |
| 42 | `lsp_completion` | 55 | `lsp_prepare_call_hierarchy` |
| 43 | `lsp_prepare_rename` | 56 | `lsp_format_document` |
| 44 | `lsp_code_actions` | 57 | `lsp_restart_server` |
| 250 | `lsp_execute_code_action` | 253 | `lsp_outgoing_calls` |
| 251 | `lsp_format_range` | 254 | `lsp_rename` |
| 252 | `lsp_incoming_calls` | 255 | `lsp_type_hierarchy_subtypes` |

## 1. Source map

The bodies assert the shipped contract of rolebox 2.2.0. Read the read-only reference
checkout before changing an expectation; the installed runtime is authoritative if it
differs from these paths.

| Surface | Path | What it fixes |
|---|---|---|
| Tool registry and names | `src/lsp/index.ts` | `createAllLspTools` registers exactly the 32 names asserted here; a name that is absent is not registered. |
| Tool implementations | `src/lsp/tools/*.ts` | Argument schemas, capability checks, result strings, and which tools write files (`format.ts`, `code-actions.ts`). |
| Language detection | `src/lsp/servers.ts` | `LANGUAGE_SERVER_REGISTRY`, extension→language map, `autoDetectServers` (server binary on `PATH` **and** project marker in the workspace root or `cwd`). |
| Server lifecycle | `src/lsp/client-manager.ts` | `startServer` (initialize handshake, `initialized` notification, status transitions), lazy start inside `request`, `notify` refusing a non-running server, `restartServer`, `getRunningServers`. |
| Document sync | `src/lsp/document-manager.ts` | `didOpen`/`didChange`/`didClose`, document versions, URI construction. |
| Notification handling | `src/lsp/rpc-handler.ts` | `textDocument/publishDiagnostics` caching, `resolveLanguageIdFromParams` (only reads `textDocument.uri`). |
| Host registration | `src/core/services/lsp-service.ts` (opencode 1.x/2.x), `src/entries/pi.ts` (Pi) | The family is contributed by these entries only; DSH (`src/platform/adapters/dsh/`) and Codex MCP register none. |
| Documented parity | `docs/compatibility.md` | `lsp_* (32 tools) | ✓ opencode | ✓ Pi | — Codex`, and the host matrix in this role. |

## 2. Module gate, host gate and SKIP contract

The whole module is capability-gated. The primary records the probe in the run
evidence and never turns an absent capability into a FAIL.

1. **Host gate.** The module runs on **opencode 1.x, opencode 2.x and Pi only**. On
   **DSH and Codex** the `lsp_*` family is not registered — the DSH adapter contributes
   no LSP tools and the Codex surface is MCP-only — so all 32 tests report `SKIP` with
   `capability_reason: "capability_absent:lsp"`. A role `tools:` map, a prompt or this
   file never proves registration; the live roster does.
2. **Family gate.** `lsp_servers` must be callable and the requested `lsp_*` name must
   be in the live roster. A tool missing from the roster is an absent capability, not a
   FAIL.
3. **Fixture-language gate.** The fixture language is **TypeScript**
   (`typescript-language-server`), the server this module is written and verified
   against. `lsp_servers` must report `typescript` in its `### Running` table or its
   `### Detected (Not Started)` list. When it reports `No language servers detected or
   running.`, all 32 bodies report `SKIP` with
   `capability_reason: "language_server_absent"`. When it reports other servers but not
   `typescript`, 26 PASSES as the detection probe and the remaining 31 bodies SKIP with
   the same reason. **No language server, or no server for the fixture language, is
   never a FAIL.** Detection requires the server binary on `PATH` *and* a
   `tsconfig.json` or `package.json` in the workspace root or the process `cwd`; record
   that condition in the SKIP evidence so a missing marker is distinguishable from a
   missing binary.
4. **One language server, one restart.** The module exercises exactly one detected
   language (`typescript`). It calls `lsp_restart_server` for that language **once per
   run** (test 57). It never starts a second language, never installs a server, never
   sets environment variables and never sends raw JSON-RPC.
5. **No fabricated state.** The module does not create `package.json`/`tsconfig.json` to
   force detection, does not add a language server to the machine, and does not reuse a
   user's file as a mutation target. Absent prerequisites SKIP.

Per-test SKIP conditions: none beyond the module gate. Every body either executes (all
32 together) or the module SKIPs as a whole for the reason above; a body that returns
its documented refusal still executes and is graded by §5.

## 3. Execution order and the cold-start rule

Run the bodies in this order:

```text
26 (probe) -> 57 (start control) -> 30, 31, 35-56, 250-255 (ascending id)
```

The deviation from pure ascending order is deliberate and evidence-based:

- `LspClientManager.getServerCapabilities()` returns `null` until a server has been
  started, and every capability-gated tool checks the capability **before** it issues
  the request that would lazily start the server (`src/lsp/tools/utils.ts`,
  `checkCapability`). On a cold client every capability-gated tool therefore returns
  `This language server does not support …` even though the server supports it.
- `lsp_servers` and `lsp_diagnostics` never start a server: `ensureSynced` only sends
  `textDocument/didOpen`, and `notify` drops it while the server is not running.
- The only exposed start path is `lsp_restart_server`, whose `restartServer` shuts the
  language down and starts it (`src/lsp/client-manager.ts`).

So 26 proves which servers exist, then 57 starts/restarts exactly one of them and
re-detects it, and only then do the capability bodies run. If the server is already
running when 26 executes, 57 still performs its one restart and asserts a new PID.
Record in the run summary that the module spent its single restart.

## 4. Fixtures

### 4.1 Scratch directory

All files live under `<workspace>/.rolebox/lsp-tests/<run-id>/`. The directory is inside
the workspace because `LspClientManager` is constructed with the session workspace as
its `rootUri` and the server treats an open file inside the project as a project file.
`.rolebox/` is git-ignored in both the role repository and rolebox itself, so the
module is invisible to `git status` while it runs; the module still deletes it (§9).

Names used below: `FIXTURE` = `fixture.ts`, `MESSY` = `messy.ts`, `ACTION` =
`action.ts`, `RENAME` = `rename.ts`. All are ASCII-only, so a byte offset within a line
equals the LSP character offset (UTF-16 code units).

### 4.2 Canonical fixture (`FIXTURE`)

Write exactly this content (30 lines, no trailing blank line beyond the final newline):

```ts
export interface BaseWidget {
  id: string;
}

export interface SpecialWidget extends BaseWidget {
  label: string;
}

export class SpecialWidgetImpl implements SpecialWidget {
  id = "impl";
  label = "impl";
}

export function formatLine(value: string): string {
  return "[widget] " + value;
}

export function computeTotal(items: string[]): number {
  return items.reduce((sum, item) => sum + item.length, 0);
}

export function runReport(items: string[]): string {
  const widget: SpecialWidget = { id: "1", label: "x" };
  const total = computeTotal(items);
  const line = formatLine(String(total));
  return line + widget.id;
}

const unusedValue: number = 1;
const TYPE_ERROR: number = "not a number";
```

Verify the fixture before the bodies run. Each command must print the expected 1-based
line, which fixes the 0-based positions in the table:

```sh
grep -n 'export interface BaseWidget' "$FIXTURE"      # 1
grep -n 'export interface SpecialWidget' "$FIXTURE"   # 5
grep -n 'export class SpecialWidgetImpl' "$FIXTURE"   # 9
grep -n 'export function formatLine' "$FIXTURE"       # 14
grep -n 'export function computeTotal' "$FIXTURE"     # 18
grep -n 'export function runReport' "$FIXTURE"        # 22
grep -n 'const unusedValue' "$FIXTURE"                # 29
grep -n 'const TYPE_ERROR' "$FIXTURE"                 # 30
```

Role positions — 0-based `line:character`, verified against the canonical fixture:

| Role | Token (occurrence) | 0-based position | Meaning |
|---|---|---|---|
| `BASE_TYPE` | `BaseWidget` (1st) | `0:17` | interface declaration |
| `BASE_REF` | `BaseWidget` (2nd) | `4:39` | `extends` reference |
| `SUBTYPE` | `SpecialWidget` (1st) | `4:17` | extending interface declaration |
| `IMPL_CLASS` | `SpecialWidgetImpl` (1st) | `8:13` | class implementing the subtype |
| `HELPER_FN` | `formatLine` (1st) | `13:16` | helper function declaration |
| `ENTRY_FN` | `computeTotal` (1st) | `17:16` | entry function declaration |
| `CALLER_FN` | `runReport` (1st) | `21:16` | caller function declaration |
| `CALL_ENTRY` | `computeTotal` (2nd) | `23:16` | call site of the entry function |
| `CALL_HELPER` | `formatLine` (2nd) | `24:15` | call site of the helper |
| `WIDGET_VAR` | `widget:` (1st) | `22:8` | typed variable of the subtype |
| `UNUSED` | `unusedValue` (1st) | `28:6` | unused declaration, quickfix source |
| `TYPE_ERROR` | `TYPE_ERROR` (1st) | `29:6` | deliberately mistyped constant |
| `STMT_START` | `const total` (1st) | `23:2` | statement where completions are requested |

If the fixture is ever edited, re-derive the position from the token occurrence (line =
0-based line of the occurrence, character = offset of the token within that line) and
record both the token and the derived position in the evidence; the table above is only
valid for the byte-identical fixture.

`CALL_ENTRY + 13` (`23:29`, after `computeTotal(`) is the signature-help position, and
`CALL_ENTRY` itself is the completion position (a call of a known function yields
callable completions).

### 4.3 Messy formatting fixture (`MESSY`)

For 56 and 251 only. Write and snapshot:

```ts
const   x : number   =   42;
function   greet ( name : string )   {
return   "Hello, "   + name ;
}
```

### 4.4 Action-copy fixtures (`ACTION`, `RENAME`)

- `ACTION` is a byte copy of `FIXTURE`, used by 44 and 250.
- `RENAME` is a byte copy of `FIXTURE`, used by 254.

Both exist so no mutating or potentially mutating call touches `FIXTURE` itself, and so
the module can restore a pristine copy for the next body.

## 5. Result classification

Per-test status is exactly `PASS`, `FAIL` or `SKIP` (report vocabulary in
`references/host-capability-matrix.md`). A `PASS` needs the observed form recorded as
evidence; an empty `evidence` is not a pass.

| Observed result | Status | Notes |
|---|---|---|
| A documented success form for the body (a table, list, location, tree or header with rows) | `PASS` | Record the call, the fixture path, the resolved position and the first line plus the key rows/count. |
| A documented empty form: `No … found.`, `No diagnostics found …`, `No completion items available …`, `No hover information available …` | `PASS` for the empty-legal bodies listed below; `FAIL` for a required-positive body | The doc says per body which empties are legal. |
| The named capability refusal `This language server does not support <feature>.` (plus the feature-specific refusals documented in §5.2) | `PASS` — a documented rejection path — unless the body's Required result lists that refusal as a FAIL when the capability is advertised (bodies 31, 36, 37, 38, 40, 42, 44, 45, 46, 47, 55 and 56 do) | Record the exact refusal; add a divergence note when `lsp_servers` advertises the label. |
| `No code action found matching title "<title>". Available actions: …` (250) and `No code actions found matching kind filter: '<kind>'.` (44) | `PASS` | The requested input is not in the execute-time action set; record the available list and the divergence note. |
| `Error: …`, `Error retrieving …:`, `Error preparing …:`, `Error executing …:`, `Error formatting …:`, a bare `Request timed out. The language server may be slow to respond.`, or a thrown exception | `FAIL` | An execution error is a FAIL with `error_detail` naming the observable and expected contract. |
| An unexpected shape, a wrong identifier, the wrong title echoed, or an unexpected on-disk mutation | `FAIL` | Record expected vs observed. |
| Any prerequisite absent at the module gate (§2) | `SKIP` | `capability_absent:lsp` or `language_server_absent`. |

Empty-result and refusal exceptions are deliberate:

- `lsp_diagnostics` (30), `lsp_code_lens` (48), `lsp_inlay_hints` (49), `lsp_document_links`
  (50), `lsp_document_colors` (51) are **list-shaped**: an empty result is a legal
  positive outcome when the feature is reported, because a document need not contain a
  lens, hint, link, colour or diagnostic. 50/51 are also not summarised, so their
  refusal form passes.
- `lsp_rename` (254) and `lsp_prepare_rename` (43) accept the named refusal because the
  tools gate on `textDocument.rename` / `rename.prepareSupport` while `lsp_servers`
  summarises `renameProvider`; on rolebox 2.2.0 the refusal is what every tested server
  produces (§10.2). A refusal here is a PASS with a divergence note, not a FAIL.

### 5.1 Capability summary mapping

The `Capabilities` cell of the `### Running` row returned by `lsp_servers` (for example
`sync, completion, hover, goto-def, references, highlight, symbols, code-action, format,
rename, folding, selection, semantic-tokens, inlay-hints, code-lens, call-hierarchy`) is
the capability gate for the positive form:

| Summary label | Bodies that must produce a positive form when the label is present |
|---|---|
| `goto-def` | 31 |
| `references` | 36 |
| `highlight` | 37 |
| `symbols` | 38 |
| `hover` | 40 |
| `completion` | 42 |
| `code-action` | 44 (non-empty action list), 250 (see §5's title-refusal row) |
| `format` | 56 |
| `folding` | 45 |
| `selection` | 46 |
| `semantic-tokens` | 47 |
| `code-lens` | 48 (empty is legal) |
| `inlay-hints` | 49 (empty is legal) |
| `call-hierarchy` | 55 (at least one item) |
| `rename` | none — 43 and 254 accept the documented refusal (the exception in §5) |
| `type-hierarchy`, `links`, `colors`, `sync` | no body requires a positive form from these labels |

Bodies whose feature is **not summarised** (35 type definition, 39 workspace symbols, 52
implementation, 53 declaration, 251 range formatting, 252/253 call navigation, 255
subtypes) accept either the success form or the documented refusal/empty form: the
summary cannot prove the precondition, so the tool's own answer decides. 252/253 are the
exception that still FAILs on the internal error, because that text is not a documented
answer (§10.4).

### 5.2 Documented feature names in the refusal

The refusal is `This language server does not support <feature>.` with exactly these
feature strings (they come from `capabilityNotSupported` call sites):

| Tool | Feature string |
|---|---|
| 31 definition | `definition` |
| 35 type definition | `type definition` |
| 36 find references | `find references` |
| 37 document highlights | `document highlights` |
| 38 document symbols | `document symbols` |
| 39 workspace symbols | `workspace symbols` |
| 40 hover | `hover` |
| 41 signature help | `signature help` |
| 42 completion | `completion` |
| 43 prepare rename | `rename`, or `This language server does not support prepare rename (the \`rename.prepareSupport\` capability is not enabled). You can still try \`lsp_rename\` directly.` |
| 44/250 code actions | `code actions` |
| 45 folding ranges | `folding ranges` |
| 46 selection ranges | `selection ranges` |
| 47 semantic tokens | `semantic tokens` (or `Semantic tokens legend not available from server capabilities.`) |
| 48 code lenses | `code lenses` |
| 49 inlay hints | `inlay hints` |
| 50 document links | `document links` |
| 51 document colors | `document colors` |
| 52 implementation | `implementation` |
| 53 declaration | `declaration` |
| 54/255 type hierarchy | `type hierarchy` |
| 55 prepare call hierarchy | `call hierarchy` |
| 56 format document | `This language server does not support document formatting.` |
| 251 format range | `This language server does not support range formatting, but supports full document formatting. Use lsp_format_document instead.` or `This language server does not support formatting.` |
| 254 rename | `rename` |

## 6. Mutating operations: temp files and restore

Four tools can change the workspace through the language server: `lsp_format_document`
and `lsp_format_range` write the file with `writeFileSync`, and
`lsp_execute_code_action` writes every file named by the action's workspace edit and may
also run `workspace/executeCommand` (a refactor command can create a file before the
30 s command timeout). `lsp_rename` returns a **preview**: it prints the edits and does
not write; the body asserts that.

Rules for 44, 56, 250, 251 and 254 — every one of them operates on a temp copy and
restores it:

1. Work only under the scratch directory; never point a mutating tool at a user file or
   at `FIXTURE`, which later bodies reuse.
2. Snapshot the target file's bytes before the call (`read` into the report, or copy to
   `<name>.orig`) and snapshot the scratch directory listing.
3. Invoke the tool with the exact arguments from the body.
4. After the call, compare bytes and the directory listing. Restore the snapshot with
   `write` (or `cp <name>.orig <name>`), then delete `<name>.orig`. Delete every path
   that appeared during the call (a code action may create a new file).
5. Verify restoration byte-for-byte and record it. A restore failure is itself a FAIL
   with `error_detail`, and the module cleanup must still delete the scratch directory.
6. Never re-run a mutating call to "make it work"; a second format on an already
   formatted file returns `No formatting changes needed — the document is already
   formatted.` and hides the first result.

## 7. Body format

Every body states: the executor (`primary`), the gate (module gate plus its capability
or summary precondition), the fixture and resolved positions, the exact call with
arguments, the accepted result forms with their exact strings, the evidence to record,
the cleanup, the SKIP condition, and any divergence note. Evidence always includes the
language id, the server PID from 57, the resolved `0-based line:character`, and the
result classification from §5.

## 8. Test bodies

### Test 26 — lsp_servers (detection gate)

- **Executor:** primary (opencode 1.x/2.x, Pi); module SKIP on DSH/Codex.
- **Gate:** `lsp_servers` is in the live roster. This is the module gate test; it runs
  first.
- **Fixture:** none.
- **Call:** `lsp_servers({})` — no arguments.
- **Required result:** the tool's documented form. PASS when `## Language Servers` is
  returned with at least one server under `### Running` or `### Detected (Not Started)`;
  a `### Running` row has the form
  `| typescript | <pid> | running | <uptime> | <capabilities> |` and the detected list
  is bullet lines. Record the full table/list, because the `Capabilities` cell gates
  §5.1.
- **Empty form:** `No language servers detected or running.` — the module gate fails, so
  26 and the other 31 bodies are SKIP with `language_server_absent`; record the empty
  string as the gate evidence.
- **Servers but no typescript:** 26 still PASSES (the detection tool worked and reported
  real servers); bodies 30–255 SKIP with `language_server_absent`, the reported language
  list as evidence, and the module row shows 1 PASS plus 31 SKIPs. Record the
  `typescript` line whenever it is present, and note when it is not.
- **Evidence:** the header, the section names present, the `typescript` line, the
  capability cell, and (if running) the PID that 57 must change.
- **Cleanup:** none.
- **SKIP:** `capability_absent:lsp` (family absent) or `language_server_absent` (no
  server for the fixture language).

### Test 30 — lsp_diagnostics

- **Executor:** primary. **Gate:** module gate; diagnostics are push-based and have no
  capability label, so no positive form is required.
- **Fixture:** `FIXTURE`; warm the document first with one `lsp_hover` at `CALL_ENTRY`
  (its result is graded by 40, not here) so `didOpen` is delivered.
- **Calls:** `lsp_diagnostics({filePath: FIXTURE, severity: "error"})`, polled at most
  five times with ~500 ms between polls; then `lsp_diagnostics({filePath: FIXTURE})`
  (severity defaults to `all`); then `lsp_diagnostics({})` (aggregate).
- **Accepted forms:** `## Diagnostics: \`file://…/fixture.ts\`` with the table header
  `| File | Line | Severity | Message | Source |`; or the file-scoped empty form
  ``No diagnostics found for `<uri>`.``; or the aggregate `No diagnostics found.` The
  empty forms are legal (§5): the fixture contains a type mismatch, but the client
  accepts an empty push cache (§10.1), so requiring a row would fail a legal state.
- **Assertions:** when rows exist, every severity is one of `Error`, `Warning`,
  `Information`, `Hint`, and the `severity: "error"` call returns only `Error` rows;
  when the aggregate is non-empty, its sections name `file://` URIs. Never accept an
  `Error:` text.
- **Evidence:** the exact form observed (table vs empty), row count, the first row or
  the empty string, and the two severity calls.
- **Cleanup:** none. **SKIP:** module gate only.

### Test 31 — lsp_goto_definition

- **Executor:** primary. **Gate:** module gate plus the `goto-def` label in the 57
  summary; with the label present this body requires a positive form.
- **Fixture:** `FIXTURE`; position `CALL_ENTRY` (`23:16`).
- **Call:** `lsp_goto_definition({filePath: FIXTURE, line: 23, character: 16})`.
- **Required result:** `## Definitions` followed by a numbered location
  ``1. `file://…/fixture.ts L17:16-L17:28` `` whose start line is `ENTRY_FN`'s
  declaration line (17). `No results found.` contradicts the advertised provider and
  FAILS; the `This language server does not support definition.` refusal only PASSES
  when the label is absent from the summary.
- **Evidence:** the call, the resolved position, the location line, and the declaration
  line it matched.
- **Cleanup:** none. **SKIP:** module gate only. **Divergence:** if the refusal appears
  while `goto-def` is listed, record the contradiction as a FAIL.

### Test 35 — lsp_goto_type_definition

- **Executor:** primary. **Gate:** module gate; type definition is not summarised, so
  either a positive or the named refusal passes.
- **Fixture:** `FIXTURE`; position `WIDGET_VAR` (`22:8`), a variable declared with the
  `SpecialWidget` type.
- **Call:** `lsp_goto_type_definition({filePath: FIXTURE, line: 22, character: 8})`.
- **Accepted forms:** `## Type Definitions` with a numbered location whose start line is
  `SUBTYPE`'s declaration line (4 — observed on the reference host); `No results found.`;
  or `This language server does not support type definition.`
- **Evidence:** the header and the first location (URI + range) or the exact refusal, and
  which line it resolved to.
- **Cleanup:** none. **SKIP:** module gate only.

### Test 36 — lsp_find_references

- **Executor:** primary. **Gate:** module gate plus the `references` label; positive form
  required.
- **Fixture:** `FIXTURE`; position `BASE_TYPE` (`0:17`).
- **Call:** `lsp_find_references({filePath: FIXTURE, line: 0, character: 17})`
  (`includeDeclaration` defaults to true).
- **Required result:** `## References (N)` with `N ≥ 1`, and at least one numbered entry
  whose location starts on `BASE_REF`'s line (4). The output also prints a surrounding
  code snippet block per reference.
- **Evidence:** `N`, the first reference location, and its match to line 4.
- **Cleanup:** none. **SKIP:** module gate only. `No references found.` FAILS because the
  fixture has a real `extends` reference and the provider is advertised.

### Test 37 — lsp_document_highlights

- **Executor:** primary. **Gate:** module gate plus the `highlight` label; positive form
  required.
- **Fixture:** `FIXTURE`; position `CALL_ENTRY` (`23:16`).
- **Call:** `lsp_document_highlights({filePath: FIXTURE, line: 23, character: 16})`.
- **Required result:** `## Document Highlights (N)` with `N ≥ 1`; each row is
  ``1. `L23:16-L23:28` — **Read** `` with kind `Text`, `Read` or `Write`.
- **Evidence:** `N`, the row list, and the kinds observed.
- **Cleanup:** none. **SKIP:** module gate only.

### Test 38 — lsp_document_symbols

- **Executor:** primary. **Gate:** module gate plus the `symbols` label; positive form
  required.
- **Fixture:** `FIXTURE`; no position.
- **Call:** `lsp_document_symbols({filePath: FIXTURE})`.
- **Required result:** `## Document Symbols` and a tree or flat list that names all six
  fixture symbols: `BaseWidget`, `SpecialWidget`, `SpecialWidgetImpl`,
  `formatLine`, `computeTotal`, `runReport`. A hierarchical server prints
  `- **Interface** \`BaseWidget\` — L0:0-L2:1` with nested children; a flat server prints
  the container name. `No symbols found in the document.` FAILS.
- **Evidence:** the header, the six names found, and two representative rows.
- **Cleanup:** none. **SKIP:** module gate only.

### Test 39 — lsp_workspace_symbols

- **Executor:** primary. **Gate:** module gate; workspace symbols are not summarised, so
  a positive or the named refusal passes.
- **Fixture:** `FIXTURE`; the document must already be open (earlier bodies ensure it).
- **Call:** `lsp_workspace_symbols({query: "runReport"})`.
- **Accepted forms:** `## Workspace Symbols matching "runReport"` with a
  `### <language> (N results)` group; `No workspace symbols found matching your query.`;
  `No language servers are currently running. Open a file first.`; or
  `This language server does not support workspace symbols.` (observed on the reference
  host, §10.3 — PASS with the divergence note).
- **Evidence:** the exact form, and for a success the matching symbol names.
- **Cleanup:** none. **SKIP:** module gate only.

### Test 40 — lsp_hover

- **Executor:** primary. **Gate:** module gate plus the `hover` label; positive form
  required.
- **Fixture:** `FIXTURE`; position `CALL_ENTRY` (`23:16`).
- **Call:** `lsp_hover({filePath: FIXTURE, line: 23, character: 16})`.
- **Required result:** `## Hover` with non-empty content that names the hovered symbol
  and its signature — observed as a `typescript` fenced block containing
  `function computeTotal(items: string[]): number`.
  `No hover information available at this position.` FAILS against the advertised
  provider and a known symbol.
- **Evidence:** the header, the rendered content, and confirmation that the symbol name
  appears.
- **Cleanup:** none. **SKIP:** module gate only.

### Test 41 — lsp_signature_help

- **Executor:** primary. **Gate:** module gate; signature help is not included in the
  `lsp_servers` capability summary, so a positive result and the named refusal both
  pass. The reference host advertises signature help and returns a signature.
- **Fixture:** `FIXTURE`; position `CALL_ENTRY + 13` = `23:29`, inside the
  `computeTotal(` parentheses.
- **Call:** `lsp_signature_help({filePath: FIXTURE, line: 23, character: 29})`.
- **Expected result:** `## Signature Help` with `### ▶ Active Signature (1/N)`, a code
  fence containing `computeTotal(items: string[]): number`, and an `**Parameters:**`
  list naming `items: string[]`; the named refusal
  `This language server does not support signature help.` also passes (§5).
- **Evidence:** the header, the active-signature line, the fence content.
- **Cleanup:** none. **SKIP:** module gate only.

### Test 42 — lsp_completion

- **Executor:** primary. **Gate:** module gate plus the `completion` label; positive form
  required.
- **Fixture:** `FIXTURE`; position `CALL_ENTRY` (`23:16`, immediately after
  `const total = `).
- **Call:** `lsp_completion({filePath: FIXTURE, line: 23, character: 16, maxItems: 5})`.
- **Required result:** `## Completion Items (showing 5 of N)`, N ≥ 5, followed by at most
  five `### <i>. **[Kind]** \`label\`` entries; the `maxItems` cap must be honoured
  (never more than 5 entries). The reference host returns close to a thousand items, so
  the cap assertion is material.
- **Evidence:** the count line, the number of entries printed, and the first two labels.
- **Cleanup:** none. **SKIP:** module gate only.
- **Note:** `maxItems` is validated to 1–100; do not pass 0 or 101.

### Test 43 — lsp_prepare_rename

- **Executor:** primary. **Gate:** module gate. The `rename` label is present on the
  reference host; the refusal is accepted with a divergence note (§5, §10.2).
- **Fixture:** `FIXTURE`; position `CALLER_FN` (`21:16`).
- **Call:** `lsp_prepare_rename({filePath: FIXTURE, line: 21, character: 16})`.
- **Accepted forms:** `## Prepare Rename` with `**Range:** \`L21:16-L21:30\`` and
  `**Current name:** \`runReport\``; the named prepare-support refusal
  (`This language server does not support prepare rename (the \`rename.prepareSupport\`
  capability is not enabled). You can still try \`lsp_rename\` directly.`); or the
  exact refusal `This language server does not support rename.` — the reference host
  returns the last form even though `lsp_servers` lists `rename`; record the divergence,
  never edit the tool.
- **Evidence:** the whole four-line block or the exact refusal, plus the summary's
  `rename` label.
- **Cleanup:** none. **SKIP:** module gate only.

### Test 44 — lsp_code_actions (temp copy)

- **Executor:** primary. **Gate:** module gate plus the `code-action` label; a non-empty
  action list is required.
- **Fixture:** `ACTION` (byte copy of `FIXTURE`); range from `0:0` to the file end
  (`29:0` for the canonical 30-line fixture). The fixture deliberately contains two
  unused declarations and a type error so quickfixes are offered.
- **Call:** `lsp_code_actions({filePath: ACTION, startLine: 0, startChar: 0, endLine: 29,
  endChar: 0})`. Optionally also
  `lsp_code_actions({…, kind: "quickfix"})` to record the filtered form.
- **Required result:** `## Code Actions (N)` with `N ≥ 1`; each entry is
  ``1. **Remove unused declaration for: 'unusedValue'** (quickfix) ★``. The reference
  host returns `Remove unused declaration for: 'unusedValue'`,
  `Remove unused declaration for: 'TYPE_ERROR'`, `Convert named export to default
  export`, `Move to a new file` (order may vary; record the exact list). A kind filter
  that matches nothing returns `No code actions found matching kind filter:
  '<kind>'.` and does not fail the body.
- **Evidence:** the action count, the titles and kinds, and the filtered result if run.
  The action list is the input to 250, which re-queries it immediately before executing.
- **Cleanup:** restore `ACTION` from its snapshot byte-for-byte and delete any file that
  appeared (the call itself does not write, but verify anyway), then delete `ACTION` and
  its snapshot at module cleanup (§6).
- **SKIP:** module gate only.

### Test 45 — lsp_folding_ranges

- **Executor:** primary. **Gate:** module gate plus `folding`; positive form required.
- **Fixture:** `FIXTURE`; no position.
- **Call:** `lsp_folding_ranges({filePath: FIXTURE})`.
- **Required result:** `## Folding Ranges (N)` with `N ≥ 1`, rows sorted by start line
  and printed as ``1. `L0-L1` `` (an optional `(kind)` suffix and optional character
  offsets may appear).
- **Evidence:** `N`, the first three ranges.
- **Cleanup:** none. **SKIP:** module gate only.

### Test 46 — lsp_selection_ranges

- **Executor:** primary. **Gate:** module gate plus `selection`; positive form required.
- **Fixture:** `FIXTURE`; one position, `CALL_ENTRY` (`23:16`).
- **Call:** `lsp_selection_ranges({filePath: FIXTURE, positions: [{line: 23,
  character: 16}]})`.
- **Required result:** `## Selection Ranges (1 position(s))`, `### Position 1: L23:16`,
  and a nested chain of at least three levels
  (`- L23:16-L23:28` → `  - L23:16-L23:35` → `    - L23:2-L23:36` → …) ending at the
  document scope. Each line is indented by two spaces per level.
- **Evidence:** the header line and the chain depth.
- **Cleanup:** none. **SKIP:** module gate only. `positions` accepts 1–50 entries.

### Test 47 — lsp_semantic_tokens

- **Executor:** primary. **Gate:** module gate plus `semantic-tokens`; positive form
  required.
- **Fixture:** `FIXTURE`; no position.
- **Call:** `lsp_semantic_tokens({filePath: FIXTURE})`.
- **Required result:** `## Semantic Tokens (N)` with `N ≥ 1`, then the table header
  `| Line | Char | Length | Type | Modifiers |` and rows such as
  `| 0 | 17 | 10 | interface | declaration |`. The tool decodes the delta-encoded array
  itself; do not expect the raw `data` array.
- **Accepted refusal:** `Semantic tokens legend not available from server capabilities.`
  only when the summary lacks `semantic-tokens`.
- **Evidence:** `N`, the header, and the first three rows.
- **Cleanup:** none. **SKIP:** module gate only.

### Test 48 — lsp_code_lens

- **Executor:** primary. **Gate:** module gate plus `code-lens`; the empty form is legal
  (§5).
- **Fixture:** `FIXTURE`; no position.
- **Call:** `lsp_code_lens({filePath: FIXTURE})`.
- **Accepted forms:** `## Code Lenses (N)` with `N ≥ 0` entries
  (`1. **<title>** \`<command>\`` plus a `Range:` line) or the named empty form
  `No code lenses found.` (observed on the reference host).
- **Evidence:** the header and `N`, or the empty form.
- **Cleanup:** none. **SKIP:** module gate only.

### Test 49 — lsp_inlay_hints

- **Executor:** primary. **Gate:** module gate plus `inlay-hints`; empty is legal.
- **Fixture:** `FIXTURE`; the whole document (optional range parameters omitted).
- **Call:** `lsp_inlay_hints({filePath: FIXTURE})`. Optionally repeat with a range
  (`startLine/startChar/endLine/endChar` all supplied) to exercise the filtered path.
- **Accepted forms:** `## Inlay Hints (N)` with rows
  ``1. `label` (Type|Parameter) — Lline:char`` or `No inlay hints found.` (observed on
  the reference host).
- **Evidence:** header and count, or the empty form, plus whether a range was supplied.
- **Cleanup:** none. **SKIP:** module gate only.

### Test 50 — lsp_document_links

- **Executor:** primary. **Gate:** module gate; links are not summarised, so a positive,
  empty or refusal form passes.
- **Fixture:** `FIXTURE`; no position.
- **Call:** `lsp_document_links({filePath: FIXTURE})`.
- **Accepted forms:** `## Document Links (N)` with `[target]`, a `Range:` line and an
  optional `Tooltip:`; `No document links found.`; or
  `This language server does not support document links.` (reference host).
- **Evidence:** the exact form and, for a success, the first target.
- **Cleanup:** none. **SKIP:** module gate only. Never call this on a `.css` fixture: no
  server is configured for `.css` and the tool returns an `Error retrieving …: No
  language server configured for file type: .css` text, which is a FAIL by §5.

### Test 51 — lsp_document_colors

- **Executor:** primary. **Gate:** module gate; colors are not summarised.
- **Fixture:** `FIXTURE` (TypeScript — the reference host's server has no colour
  provider, so the refusal is the expected form).
- **Call:** `lsp_document_colors({filePath: FIXTURE})`.
- **Accepted forms:** `## Document Colors (N)` with `#rrggbb[aa] — Lx:y-Lx:y` rows;
  `No color information found.`; or
  `This language server does not support document colors.`
- **Evidence:** the exact form; for a success, the first colour and range.
- **Cleanup:** none. **SKIP:** module gate only.

### Test 52 — lsp_goto_implementation

- **Executor:** primary. **Gate:** module gate; implementation is not summarised, so a
  positive or the empty/refusal form passes.
- **Fixture:** `FIXTURE`; position `SUBTYPE` (`4:17`) — the interface that
  `SpecialWidgetImpl` implements.
- **Call:** `lsp_goto_implementation({filePath: FIXTURE, line: 4, character: 17})`.
- **Accepted forms:** `## Implementations` with a numbered location starting at
  `IMPL_CLASS`'s line (8 — observed on the reference host); `No results found.`; or the
  named refusal.
- **Evidence:** the header and locations, or the empty/refusal form.
- **Cleanup:** none. **SKIP:** module gate only.

### Test 53 — lsp_goto_declaration

- **Executor:** primary. **Gate:** module gate; declaration is not summarised.
- **Fixture:** `FIXTURE`; position `BASE_REF` (`4:39`).
- **Call:** `lsp_goto_declaration({filePath: FIXTURE, line: 4, character: 39})`.
- **Accepted forms:** `## Declarations` with a numbered location; `No results found.`;
  or `This language server does not support declaration.` (reference host).
- **Evidence:** the exact form.
- **Cleanup:** none. **SKIP:** module gate only.

### Test 54 — lsp_type_hierarchy_supertypes

- **Executor:** primary. **Gate:** module gate; type hierarchy is not summarised on the
  reference host, so the refusal is the expected form there.
- **Fixture:** `FIXTURE`; position `IMPL_CLASS` (`8:13`).
- **Call:** `lsp_type_hierarchy_supertypes({filePath: FIXTURE, line: 8, character: 13})`.
- **Accepted forms:** `## Supertypes (N)` with `- **<name>** (<kind>)` entries and URI +
  range lines; `No supertypes found for this symbol.`;
  `No type hierarchy found at the specified position.`; or
  `This language server does not support type hierarchy.` (reference host).
- **Evidence:** the exact form; for a success, the first supertype name.
- **Cleanup:** none. **SKIP:** module gate only.

### Test 55 — lsp_prepare_call_hierarchy

- **Executor:** primary. **Gate:** module gate plus `call-hierarchy`; at least one item
  is required.
- **Fixture:** `FIXTURE`; position `CALL_ENTRY` (`23:16`) — the callee identifier.
- **Call:** `lsp_prepare_call_hierarchy({filePath: FIXTURE, line: 23, character: 16})`.
- **Required result:** `## Call Hierarchy — 1 item(s)` and a bullet naming the entry
  function (`- **computeTotal** (Function)` plus URI and range), or more than one item
  when the server returns several.
- **Evidence:** the header, the item name(s), and the URI/range. The printed item's
  fields are the input to 252/253 (§10.5).
- **Cleanup:** none. **SKIP:** module gate only.

### Test 56 — lsp_format_document (temp file, restore)

- **Executor:** primary. **Gate:** module gate plus `format`; with the label present a
  success form is required.
- **Fixture:** `MESSY` from §4.3; snapshot the bytes first.
- **Call:** `lsp_format_document({filePath: MESSY})`.
- **Required result:** `## Format Complete`, `File: <path>`, `Lines changed: N` (N ≥ 1
  for the messy fixture; observed `3`), `Total edits: N` (observed `14`). The file on
  disk must now be the formatted form:
  `const x: number = 42;` / `function greet(name: string) {` / `  return "Hello, " +
  name;` / `}`.
- **Accepted alternative:** `No formatting changes needed — the document is already
  formatted.` passes only if the pre-call fixture was already formatted (it is not), so
  on the canonical messy fixture this form FAILS.
- **Restore:** write the snapshot back, verify the bytes equal the snapshot, record the
  check, then delete `MESSY` at module cleanup. See §6.
- **Evidence:** the four header lines, the on-disk change, the restore check.
- **Cleanup:** restore + delete. **SKIP:** module gate only.

### Test 57 — lsp_restart_server (start control, exactly once)

- **Executor:** primary. **Gate:** module gate; `typescript` is reported by 26. Executes
  **second**, immediately after 26 (see §3), and it is the only restart in the run.
- **Fixture:** none; read `lsp_servers` before and after.
- **Call:** `lsp_restart_server({languageId: "typescript"})`.
- **Required result:** `## Server Restarted: typescript`, `Status: running`, `PID: <n>`,
  `Started at: <ISO-8601>`. Then `lsp_servers({})` must show a `### Running` row for
  `typescript` with `status` `running` and a capability cell. If `typescript` was
  already running before the call, the PID must differ; if the PID is unchanged, FAIL.
- **Accepted refusal (edge case):** `Language 'typescript' is not in the detected server
  list. Available: …` passes only when 26 found `typescript` **running but not
  detected** (it was started externally in this session); record the divergence, keep
  using the running server and continue. This is the only legitimate refusal branch.
- **FAIL:** `Error restarting server: <message>`, `Server 'typescript' restart initiated
  but server not found in running list.`, or no running row afterwards.
- **Evidence:** the restart block, the pre/post PID, the running capability cell.
- **Cleanup:** none (the server is left running for the module and is shut down with the
  session). **SKIP:** module gate only.

### Test 250 — lsp_execute_code_action (temp copy, restore)

- **Executor:** primary. **Gate:** module gate plus `code-action`; runs after 44 so it
  can reuse an action title from the same run.
- **Fixture:** `ACTION` (byte copy of `FIXTURE`); snapshot bytes and the scratch
  directory listing.
- **Calls:** first `lsp_code_actions` on the same range as 44 to obtain the current
  titles, then
  `lsp_execute_code_action({filePath: ACTION, startLine: 0, startChar: 0, endLine: 29,
  endChar: 0, title: "<exact title>"})`. Choose the first `(quickfix)` title, else the
  first title. Pass the exact title, not a prefix.
- **Accepted forms:**
  - `## Code Action: "<title>"` + `Kind: <kind>` + `### Changes`, with change lines of
    the documented shapes `<path>: N edit(s) applied`, `Command executed: <command>` or
    `Command failed: <command> — <message>`. A `Command failed` line is recorded
    verbatim; a `Move to a new file`-style refactor can exceed the tool's 30 s
    `workspace/executeCommand` timeout and still create a file, so the directory check
    and restore are mandatory (§6, §10.6).
  - `No code action found matching title "<title>". Available actions:` followed by the
    list — the execute-time query offered a different set (observed on the reference
    host, §10.6). PASS with the available list and the divergence note.
  - `No code actions available for the specified range.` or
    `Code action "<title>" executed but produced no changes.`
  - `This language server does not support code actions.` only when the summary lacks
    `code-action`.
- **FAIL:** `Error executing code action: <message>`, any other `Error` text, a header
  naming a different title than requested, or a failed restore.
- **Restore:** write the snapshot back, delete every path that appeared during the call,
  verify the file and tree, record both checks. See §6.
- **Evidence:** the title chosen and where it came from, the header, each change line,
  files created, and the restore/tree checks.
- **Cleanup:** restore + delete extras. **SKIP:** module gate only.

### Test 251 — lsp_format_range (temp file, restore)

- **Executor:** primary. **Gate:** module gate; range formatting is not summarised, so
  the success form or the documented range-format refusal passes.
- **Fixture:** `MESSY` from §4.3; snapshot the bytes.
- **Call:** `lsp_format_range({filePath: MESSY, startLine: 0, startChar: 0, endLine: 0,
  endChar: 20})`.
- **Accepted forms:** `## Range Format Complete`, `File: <path>`,
  `Range: L0:0-L0:20`, `Edits applied: N` (observed `3`), `### Formatted Range` and a
  fenced preview of the formatted range (`const x: number =   42;` on the reference
  host — the tool formats only the requested line, so the rest of the messy file is
  unchanged); `No formatting changes needed for the specified range.`; or
  `This language server does not support range formatting, but supports full document
  formatting. Use lsp_format_document instead.` / `This language server does not support
  formatting.`
- **Assertion:** when the success form is returned, the file changed only within the
  requested range (compare the snapshot: lines 1–3 unchanged on the reference fixture).
- **Restore:** write the snapshot back and verify byte equality, then delete `MESSY`.
- **Evidence:** the header block, the preview, the on-disk diff scope, the restore check.
- **Cleanup:** restore + delete. **SKIP:** module gate only.

### Test 252 — lsp_incoming_calls

- **Executor:** primary. **Gate:** module gate plus `call-hierarchy`; the item is the one
  printed by 55 (§10.5).
- **Fixture:** `FIXTURE`; reconstruct the `CallHierarchyItem`:
  `{name: "computeTotal", kind: 12, uri: "file://<abs FIXTURE>", range: {start:
  {line: 17, character: 0}, end: {line: 19, character: 1}}, selectionRange: {start:
  {line: 17, character: 16}, end: {line: 17, character: 28}}}`. `kind` 12 is `Function`
  (SymbolKind table: 5 Class, 6 Method, 9 Constructor, 12 Function, 13 Variable); the
  ranges come from the 55 output and the fixture, `data` is not printed by 55 so it is
  omitted.
- **Call:** `lsp_incoming_calls({item: <the item above>})`.
- **Accepted forms:** `## Incoming Calls (N)` with `### <i>. **<caller>** (<kind>)` and
  `Call sites:` ranges; or `No incoming calls found for this item.`
- **FAIL (the 2.2.0 finding):** `Error retrieving incoming calls: Cannot determine
  languageId for request. Provide languageId or include textDocument.uri in params.`
  This is not a documented answer — the tool never passes a language id and the only
  `uri` it receives is nested under `item`, so the request cannot resolve a language
  (§10.4). Record the exact error in `error_detail`; do not retry with a mutated item
  looking for a green result, and never edit rolebox.
- **Evidence:** the item passed, the exact response, and the classification.
- **Cleanup:** none (read-only). **SKIP:** module gate only.

### Test 253 — lsp_outgoing_calls

- **Executor:** primary. **Gate:** module gate plus `call-hierarchy`; same reconstructed
  item as 252 (the entry function calls `items.reduce`'s callback, so a positive result
  may list it).
- **Fixture:** `FIXTURE`; the same reconstructed `CallHierarchyItem` as 252
  (`computeTotal`, kind 12, the fixture URI, range `L17:0-L19:1`, selection range
  `L17:16-L17:28`).
- **Call:** `lsp_outgoing_calls({item: <same item as 252>})`.
- **Accepted forms:** `## Outgoing Calls (N)` with `### <i>. **<callee>** (<kind>)` and
  `Call sites:` ranges; or `No outgoing calls found for this item.`
- **FAIL:** `Error retrieving outgoing calls: Cannot determine languageId for request.
  Provide languageId or include textDocument.uri in params.` (the same 2.2.0 transport
  finding as 252; record the exact error, do not retry or mutate the item).
- **Evidence:** the item passed, the exact response, and the classification.
- **Cleanup:** none. **SKIP:** module gate only.

### Test 254 — lsp_rename (temp copy, restore, no-write assertion)

- **Executor:** primary. **Gate:** module gate. The `rename` label is present on the
  reference host; the refusal is accepted with a divergence note (§5, §10.2).
- **Fixture:** `RENAME` (byte copy of `FIXTURE`); snapshot its bytes.
- **Call:** `lsp_rename({filePath: RENAME, line: 21, character: 16, newName:
  "runReportRenamed"})`.
- **Accepted forms:** `## Rename to \`runReportRenamed\``, `**Files modified:** N`,
  per-file `### \`file://…\` (N changes)` rows with
  ``- `L21:16-L21:30`: `runReport` → `runReportRenamed` ``, and
  `**Total:** N edits across M files.`; `No rename edits returned. The symbol may not be
  renameable at this position.`; `No edits were generated by the rename operation.`; or
  the exact refusal `This language server does not support rename.` (reference host).
- **Required assertion:** the tool is a preview — after either the success or the
  refusal form, `RENAME` must be byte-identical to the snapshot. An on-disk change is a
  FAIL (the tool wrote when its contract says it only reports edits).
- **Restore:** if a difference is found, restore the snapshot before failing so the
  module can continue (§6).
- **Evidence:** the output block, the byte comparison, and the divergence note when the
  refusal appears with `rename` in the summary.
- **Cleanup:** restore + delete `RENAME`. **SKIP:** module gate only.

### Test 255 — lsp_type_hierarchy_subtypes

- **Executor:** primary. **Gate:** module gate; type hierarchy is not summarised on the
  reference host, so the refusal is the expected form there.
- **Fixture:** `FIXTURE`; position `BASE_TYPE` (`0:17`).
- **Call:** `lsp_type_hierarchy_subtypes({filePath: FIXTURE, line: 0, character: 17})`.
- **Accepted forms:** `## Subtypes (N)` with `- **<name>** (<kind>)` entries (expected
  names on a supporting server: `SpecialWidget`, `SpecialWidgetImpl`);
  `No subtypes found for this symbol.`; `No type hierarchy found at the specified
  position.`; or `This language server does not support type hierarchy.` (reference
  host).
- **Evidence:** the exact form; for a success, the first subtype name.
- **Cleanup:** none. **SKIP:** module gate only.

## 9. Module cleanup and report rows

1. Delete `<workspace>/.rolebox/lsp-tests/<run-id>/` and every snapshot file in it.
2. Confirm the scratch path is gone and that no file outside it changed: the module
   never writes outside the scratch directory, and every mutating body restored its
   file byte-for-byte (§6).
3. Leave the language server running; the session's `LspService.dispose()` shuts it
   down. Do not restart it a second time.
4. Emit one row per test id with `id`, `name`, `status`, `evidence`, `error_detail`
   (empty for PASS/SKIP), `duration_ms`, `executor: "primary"` and
   `capability_reason` (only for SKIP). A module row aggregates the 32 rows and keeps
   the SKIP count visible. The run summary records every divergence note from §10 and
   the single restart.

## 10. Known rolebox 2.2.0 behavior to classify, not to hide

These observations were reproduced against the shipped tools; the bodies above encode
the correct classification. A later rolebox that fixes one of them turns the relevant
finding into a normal positive result.

### 10.1 Cold capability checks and the dropped `initialized` handshake

Every capability-gated tool reads the server capabilities before issuing the request
that would lazily start the server, so on a cold client it returns the
`does not support …` refusal. The only start path is `lsp_restart_server`. In addition,
`startServer` sends the `initialized` notification before marking the server `running`,
and `notify` drops notifications for a non-running server, so the LSP `initialized`
handshake is never delivered. Consequences: servers that need `initialized` before
answering (for example `pyright-langserver`) time out on every request, and push
diagnostics stay empty on a server that publishes only after it. The bodies therefore
(1) start the server through 57 before the capability bodies, (2) accept the documented
empty diagnostics form, and (3) FAIL a `Request timed out. The language server may be
slow to respond.` response, which is an execution error.

### 10.2 Rename gating on `textDocument.rename`

`lsp_prepare_rename` and `lsp_rename` check `textDocument.rename` (and
`textDocument.rename.prepareSupport`) while LSP servers advertise `renameProvider`.
Every tested server therefore refuses rename even though `lsp_servers` lists `rename` in
its capability summary. Bodies 43/254 PASS the named refusal and record the divergence;
they do not treat a provider summary as proof of the tool's precondition.

### 10.3 Workspace symbols checking `workspace.symbol`

`lsp_workspace_symbols` requires `caps.workspace.symbol`, while servers advertise the
top-level `workspaceSymbolProvider`. The body therefore accepts
`This language server does not support workspace symbols.` and records that the summary
and the tool disagree.

### 10.4 Incoming/outgoing calls never resolve a language

`lsp_incoming_calls` and `lsp_outgoing_calls` call
`clientManager.request(method, {item})` without a language id, and
`resolveLanguageIdFromParams` only reads `textDocument.uri`, which the params never
contain. Both tools return `Error retrieving … Cannot determine languageId for request.
Provide languageId or include textDocument.uri in params.` for every item, including one
reconstructed from the 55 output. This is an execution error, so 252/253 FAIL with that
text (the matrix's rule: an execution error is a FAIL with `error_detail`).

### 10.5 `lsp_prepare_call_hierarchy` prints text, not the item

The tool's description tells the caller to pass an item returned by
`lsp_prepare_call_hierarchy`, but the result is a formatted markdown block (name, kind
label, URI, range). The bodies reconstruct the `CallHierarchyItem` from those fields
(kind label→number, range from the fixture/55 output) and record the divergence. The
`data` field is not printed and is omitted.

### 10.6 Execute-code-action re-queries with a different diagnostic context

`lsp_execute_code_action` performs its own `textDocument/codeAction` request using the
**full** cached diagnostic list with a stripped shape (`{range, severity, message}` — no
`code` or `source`), whereas `lsp_code_actions` filters diagnostics to the requested
range. A server can therefore offer a title in 44 that the execute request does not
offer, producing `No code action found matching title …`; that documented refusal is a
PASS with the divergence note. Command-backed refactors can also exceed the tool's 30 s
`workspace/executeCommand` timeout and may create a file before the timeout, which is
why 250 snapshots and restores the whole scratch tree.

### 10.7 Non-TypeScript fixture languages

The module is verified against `typescript-language-server`. Other detected servers are
not exercised by this revision: `pyright-langserver` times out on every request because
of 10.1, and the other registry languages were not verified. A server reported by
`lsp_servers` but not `typescript` therefore yields `language_server_absent` for the
module rather than an invented fixture. Adding a variant requires a new verified
fixture and body set, not an improvised fixture in the run.
