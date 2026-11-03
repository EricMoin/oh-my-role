# Computer and browse module bodies — read-only smoke

Modules `computer` (2 tests) and `browse` (2 tests) of the rolebox-tester 7.0.0 suite.
This document owns the `### Test <id>` bodies for **tests 241–244** (4 tests); the
catalog maps both modules to the declaring primary (`references/test-catalog.md`), and
the host gates and SKIP reasons come from `references/host-capability-matrix.md`.

These four bodies are deliberately **read-only**: they discover, capture once, read a
deterministic local page, and close the browser. None of them sends a desktop input
gesture, focuses a user window, changes an OS permission, installs Playwright, enables
the `browseUse`/`computerUse` gates, or captures arbitrary user content. The interactive
`computer_*` and `browse_*` tools are listed in the out-of-scope ledger in
`references/runtime-tests.md`.

## Module contract

| Id | Test | Module | Executor | Host gate | SKIP reason |
|---|---|---|---|---|---|
| 241 | Computer status and one read-only capture | computer | primary | 12 `computer_*` tools registered, `computer_status` supported, OS screen-capture permission granted, a known-safe window target and a display | `capability_absent:computer`, `os_permission_absent`, `window_target_absent` |
| 242 | Computer window and display discovery | computer | primary | `computer_windows` and `computer_displays` registered | `capability_absent:computer` |
| 243 | Browse status, snapshot and read | browse | primary | 23 `browse_*` tools registered, the `browseUse` gate on, Playwright and a Chromium build installed, a deterministic local page | `capability_absent:browse`, `playwright_absent`, `browser_absent` |
| 244 | Browse tabs, history, console, network and close | browse | primary | same as 243 plus a driver that supports tabs and history | `capability_absent:browse`, `playwright_absent`, `browser_absent` |

The `computer_*` family registers on DSH, Pi and Codex when the host allows it, and is
absent on opencode. The `browse_*` family is gated by `browseUse` and requires an
optional Playwright peer and its browser binary; `browse_status` reports both without
launching a browser, so probe with it before opening anything. A family the roster does
not show is a SKIP, never a FAIL.

## Read-only rules

These rules apply to every body in this document. A violation is a FAIL of the test
that caused it, not a cleanup note.

1. **No input gestures.** Do not call `computer_click`, `computer_move`,
   `computer_type`, `computer_key`, `computer_scroll`, `computer_drag`,
   `computer_focus` or `computer_permissions` from tests 241–244. Do not call
   `browse_click`, `browse_type`, `browse_press`, `browse_select`, `browse_drag`,
   `browse_hover`, `browse_scroll`, `browse_wait`, `browse_eval`, `browse_upload`,
   `browse_dialog` or `browse_cookies`. Navigation (`browse_open`, `browse_history`,
   `browse_tabs`) and the read tools are allowed; they act on the test's own page, not
   on the user's applications.
2. **No arbitrary capture.** A screenshot is allowed only of a window whose content the
   test can attribute: a window the test itself caused to exist showing only test-authored
   content, or a window the operator explicitly designated as safe before the capture. It
   must be identified by the `window_id` returned by `computer_windows`, and nothing else
   may be captured. Never capture a terminal, chat, editor, email client, password
   manager, or any window holding user text; never capture the full desktop or several
   windows; never capture a second window "for comparison". If no safe target exists,
   SKIP with `window_target_absent` and capture nothing.
3. **OS permission is not tool availability.** `computer_status` exposes the
   `input_permission` and `screen_capture` verdicts separately. Tests only read those
   verdicts; they never call a permission-request path, and a missing grant is a SKIP
   (`os_permission_absent`), not a reason to request it. A tool grant is not proof that a
   capture succeeded: only the capture result is.
4. **Playwright is optional.** Never install `playwright` or download a browser. If
   `browse_status` reports the driver missing, SKIP `playwright_absent`; if a browser
   launch fails because the Chromium build is missing, SKIP `browser_absent`. A reported
   "binary state unknown" (when `PLAYWRIGHT_BROWSERS_PATH` is unset) is not proof either
   way; attempt one launch and record the result.
5. **Deterministic pages only.** Browse tests navigate to a `data:` URL or a local HTML
   file written under the workspace's `.rolebox/test-reports/tmp/`. Never navigate to a
   remote site, a user's open tab, or a page that needs credentials. The test owns every
   byte it reads.
6. **Scoped cleanup.** Close the `browse_*` pages the test opened (and only those), remove
   the temporary HTML files, and delete the one test screenshot after its metadata has
   been recorded. Never close the user's other pages or the whole browser session unless
   the test created the whole session.
7. **Bounded waits.** A wait is bounded (≤ 15 s) and honest. Do not poll to hide a
   timeout. Record the observed frame/refs/text, not an intention to check later.
8. **Privacy in the report.** `evidence` carries metadata and marker text only: file
   paths, byte counts, dimensions, ids, URLs to local files, refs, and the exact markers.
   Never paste screenshot bytes, a user window title, or page content the test did not
   author.

## Family roster and disposition

All twelve `computer_*` tools and all twenty-three `browse_*` tools are accounted for
here. Tools marked "out of scope" are not exercised by 241–244; `references/runtime-tests.md`
records their reason.

| Tool | Disposition |
|---|---|
| `computer_status` | covered by 241 |
| `computer_screenshot` | covered by 241 (one window, read-only) |
| `computer_windows` | covered by 241 and 242 |
| `computer_displays` | covered by 241 and 242 |
| `computer_click` | out of scope — desktop input |
| `computer_move` | out of scope — desktop input |
| `computer_type` | out of scope — desktop input |
| `computer_key` | out of scope — desktop input |
| `computer_permissions` | out of scope — OS grant probe/request |
| `computer_scroll` | out of scope — desktop input |
| `computer_drag` | out of scope — desktop input with no rollback |
| `computer_focus` | out of scope — changes the user's desktop focus |
| `browse_status` | covered by 243 |
| `browse_open` | covered by 243 (local page only) |
| `browse_snapshot` | covered by 243 |
| `browse_read` | covered by 243 |
| `browse_tabs` | covered by 244 |
| `browse_history` | covered by 244 |
| `browse_console` | covered by 244 (one read) |
| `browse_network` | covered by 244 (one read) |
| `browse_close` | covered by 244 |
| `browse_click` | out of scope — interactive input |
| `browse_type` | out of scope — interactive input |
| `browse_press` | out of scope — interactive input |
| `browse_select` | out of scope — interactive input |
| `browse_drag` | out of scope — interactive input |
| `browse_hover` | out of scope — interactive input |
| `browse_scroll` | out of scope — interactive input |
| `browse_wait` | out of scope — dynamic-page timing surface |
| `browse_eval` | out of scope — executes arbitrary page JavaScript |
| `browse_screenshot` | out of scope — binary capture; text reads are the evidence |
| `browse_upload` | out of scope — attaches user files |
| `browse_downloads` | out of scope — exports page files |
| `browse_dialog` | out of scope — no dialogs on the deterministic page |
| `browse_cookies` | out of scope — private session data / browser-context mutation |

## Test bodies

### Test 241 — Computer status and one read-only capture

**Executor:** primary. **Host gate:** `computer_status`, `computer_windows`,
`computer_displays` and `computer_screenshot` registered; `computer_status` returns
`supported: true`; the screen-capture verdict is checked and granted; a known-safe
window target and at least one display exist. **SKIP:** `capability_absent:computer`,
`os_permission_absent`, `window_target_absent`.

**Procedure**

1. Call `computer_status` with no screenshot and no input. Record the `platform`,
   `supported`, `operations`, `helpers`, `input_permission`, `screen_capture` and
   `install_hint` fields. This test does not need input permission; it needs the
   screen-capture verdict.
2. If `supported` is false, SKIP `capability_absent:computer` with the refusal text.
   If `screen_capture.checked` is false or `screen_capture.granted` is false, SKIP
   `os_permission_absent` with the verdict verbatim; do not request the grant.
3. Call `computer_displays` and record the JSON array. Assert at least one entry, each
   with a flat `id`, `x`, `y`, `width`, `height`, a positive `scale` and a boolean
   `primary` (`name` is optional). Keep the chosen display id.
4. Call `computer_windows` and record the listing. Choose at most one target under the
   read-only rules above: either a window the test caused to exist with test-authored
   content, or a window the operator explicitly designated as safe. If no such target
   exists, SKIP `window_target_absent`; capture nothing. Do not use `computer_focus`.
5. Capture that one window with `computer_screenshot({ window_id: <id> })`. Assert the
   result contains: a `screenshot_id`; a saved path under the session workspace's
   `.rolebox/computer/` (or the explicit path the test passed); positive PNG width and
   height; a positive byte count; and the coordinate metadata `screen_bounds`, `origin`,
   `pixel_scale_x`, `pixel_scale_y` and `displays`. Assert the PNG dimensions equal
   `screen_bounds.w × pixel_scale_x` and `screen_bounds.h × pixel_scale_y` within
   rounding, and that the captured bounds are consistent with the chosen window or its
   display (the capture may be clipped to the display; record the actual bounds).
6. Cross-check the display readback: the capture's `displays` array uses the same flat
   schema and includes the display whose bounds contain the captured window; the
   reported per-axis scales are consistent with that display's `scale`. Read the image
   attachment once to confirm it is a PNG (dimensions/byte count agree); do not
   re-capture.
7. Record the evidence (path, bytes, dimensions, window id, display id, scales) and
   delete the screenshot file. No other file is created.

**PASS:** status is supported, the capture permission verdict is granted, the display and
window listings are well-formed, and the one screenshot returns coherent metadata and a
readable PNG. **FAIL:** a present family returning malformed display/window data, a
capture that fails without an OS-permission explanation, metadata that contradicts the
returned image, or any capture outside the allowed target. **SKIP:** the family is absent
(`capability_absent:computer`), the permission is absent (`os_permission_absent`), or no
safe target exists (`window_target_absent`).

### Test 242 — Computer window and display discovery

**Executor:** primary. **Host gate:** `computer_windows` and `computer_displays`
registered. **SKIP:** `capability_absent:computer`.

This test performs discovery only: it never focuses a window, captures nothing, and sends
no input. It does not require screen-capture or input permission; window titles on macOS
are empty without Screen Recording and that is the documented behaviour, not a failure.

**Procedure**

1. Call `computer_windows` with no `app` filter. Record `metadata.count` and the listing.
   Assert `metadata.count` equals the number of non-empty lines, and that every line
   names a window id (macOS window number, X11 id, or Windows handle) and follows the
   host's documented line format (owner/title where available).
2. Call `computer_windows` again with an `app` filter matching one returned owner or
   title (case-insensitive substring). Assert the filtered result is a subset of the full
   listing. If the filter matches nothing, the documented refusal (macOS error) or empty
   listing is a valid answer; record it and do not treat it as a failure.
3. Call `computer_displays`. Assert the JSON array has at least one entry and every entry
   has a flat `id`, numeric `x`/`y`/`width`/`height`, a positive `scale`, and a boolean
   `primary`; exactly one display is primary when the host reports a primary. Assert the
   ids follow the platform rule (macOS starts at 1; Windows/X11 start at 0).
4. Assert that `computer_focus`, `computer_screenshot` and every input tool were **not**
   called by this test. No file is created.

**PASS:** both discovery tools return structured, internally consistent data and the app
filter narrows correctly. **FAIL:** a registered tool that returns malformed JSON, a count
that disagrees with the listing, ids outside the platform rule, or an unexpected refusal
from an unfiltered discovery. **SKIP:** either tool is absent.

### Test 243 — Browse status, snapshot and read

**Executor:** primary. **Host gate:** `browse_status`, `browse_open`, `browse_snapshot`
and `browse_read` registered; the `browseUse` gate on; Playwright and a Chromium build
available. **SKIP:** `capability_absent:browse`, `playwright_absent`, `browser_absent`.

**Procedure**

1. Call `browse_status`. Record the Playwright module/version, the browser-binary state,
   the session count and pages. If the family is absent, SKIP
   `capability_absent:browse`. If Playwright is reported unavailable, SKIP
   `playwright_absent` with the reported install guidance; never install it.
2. Create the deterministic page. Preferred form is a `data:text/html` URL encoded with
   the marker, for example
   `data:text/html,<title>ROLEBOX_243</title><h1>ROLEBOX_BROWSE_243_MARKER</h1><p>alpha beta gamma</p>`
   (percent-encode spaces and special characters). Fallback: write
   `.rolebox/test-reports/tmp/browse-243/page.html` with the same content and use its
   absolute `file://` URL. Do not use a remote URL.
3. `browse_open({ page: "rb243", url: <local-page> })`. Assert the result names the page
   and URL and does not report a driver error. If the launch fails because the Chromium
   build is missing, SKIP `browser_absent` with the error; a missing browser is an
   environment gate, not a failure of the page.
4. `browse_snapshot({ page: "rb243" })`. Assert the result is an ARIA-shaped tree with
   fresh element refs (`e1`, `e2`, …) and the literal heading text
   `ROLEBOX_BROWSE_243_MARKER`. Record at least the heading ref and the ref count.
5. `browse_read({ page: "rb243", format: "markdown" })`. Assert the output contains the
   marker, the paragraph `alpha beta gamma`, and no error metadata. Repeat with
   `format: "text"` only if the markdown form is empty; the exact marker is the
   assertion.
6. `browse_status` again: assert the page `rb243` is listed with the local URL (the
   session is one page unless the user already had pages; the test only asserts its own
   page). Do not read `browse_console`/`browse_network` here; 244 owns those reads.
7. Close with `browse_close({ page: "rb243" })`; assert the close result. Remove the
   fallback HTML file and its directory if created; confirm no test file remains.

**PASS:** status is available, the local page opens headless, the snapshot exposes refs
and the exact heading, and the read returns the exact page text. **FAIL:** a present
driver with no refs, a missing marker in both snapshot and read, a read error, or a page
that cannot be closed. **SKIP:** `capability_absent:browse`, `playwright_absent` or
`browser_absent`, with the probe/launch evidence recorded.

### Test 244 — Browse tabs, history, console, network and close

**Executor:** primary. **Host gate:** the browse family from 243 plus `browse_tabs`,
`browse_history`, `browse_console`, `browse_network` and `browse_close`; the driver
supports named pages and history. **SKIP:** `capability_absent:browse`,
`playwright_absent`, `browser_absent`.

This test uses a two-page local fixture and acts through navigation, tabs, history,
reads and close only — no click, type, key, select, drag, hover, scroll, wait, eval,
upload, download, dialog or cookie call.

**Procedure**

1. Probe with `browse_status` exactly as in 243; if the family is absent or Playwright
   is unavailable, SKIP with the matching reason.
2. Create `.rolebox/test-reports/tmp/browse-244/` with `a.html` and `b.html`:
   `a.html` contains `<title>ROLEBOX_244_A</title><h1>ROLEBOX_244_A</h1><script>console.log("ROLEBOX_CONSOLE_244")</script>`;
   `b.html` contains `<title>ROLEBOX_244_B</title><h1>ROLEBOX_244_B</h1>`. Use their
   absolute `file://` URLs.
3. `browse_open({ page: "rb244", url: <a.html> })`; then `browse_console({ page: "rb244" })`
   and assert the read answers with the literal entry `ROLEBOX_CONSOLE_244`. If the
   inline script was already consumed before the read, reload the page once
   (`browse_history({ action: "reload" })`) and read the console again; record the entry
   and cursor. An empty console after a successful reload with the script present is a
   FAIL.
4. `browse_tabs({ action: "list" })` — assert `rb244` is listed with the `a.html` URL.
   `browse_tabs({ action: "new", page: "rb244-second", url: <b.html> })` — assert it
   creates and activates the second page (list shows two). `browse_tabs({ action: "select", page: "rb244" })`
   — assert the active page is `rb244` again. `browse_tabs({ action: "close", page: "rb244-second" })`
   — assert the list shows only `rb244`.
5. Navigate the main page: `browse_open({ page: "rb244", url: <b.html> })`; then
   `browse_history({ action: "back" })` and assert the page URL/title is `a.html`
   (`browse_status` page list or `browse_read` with the A marker). Then
   `browse_history({ action: "forward" })` and assert B, then
   `browse_history({ action: "reload" })` and assert B again. Navigation drops refs; do
   not reuse a ref from before a navigation.
6. `browse_network({ page: "rb244" })` — assert the read answers with the documented
   entry structure. If entries exist, every URL is the local `file://` page; there is no
   `http(s)` URL and no `failed` entry. An empty entry list is recorded as "no network
   activity", which is the expected deterministic answer for a local page.
7. `browse_close({ page: "rb244" })` and assert the close result. Then `browse_status`
   or `browse_tabs({ action: "list" })` must no longer list `rb244`. Do not close pages
   the test did not open; do not use `all: true` if the user had a pre-existing session.
8. Remove `a.html`, `b.html` and their directory; assert nothing test-owned remains.

**PASS:** a second named page is created, selected and closed; back/forward/reload move
through the local history; the console read returns the page's own logged marker; the
network read shows no external or failed request; and close releases the page.
**FAIL:** a present driver that cannot create/select/close a tab, history that does not
change the URL, a missing console marker after reload, an external/failed network entry,
or a page that survives close. **SKIP:** `capability_absent:browse`, `playwright_absent`
or `browser_absent`.

## SKIP versus FAIL

An absent family or an unexercisable environment gate is a SKIP with the machine-readable
reason above. A family that is present and contradicts its documented contract — a
malformed listing, a missing marker, a capture that returns unusable metadata, a tab that
cannot be closed, a history action that does not navigate, or a console entry the page
logged but the read omits — is a FAIL with `error_detail` naming the expected and the
observed contract. A refusal the test explicitly did not request (for example an OS
permission denial during a capture the test was allowed to attempt) is reported verbatim
and is a FAIL, not a SKIP. An empty network entry list on a deterministic local page is
the expected answer, not a missing capability.
