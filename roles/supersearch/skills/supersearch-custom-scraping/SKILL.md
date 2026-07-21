---
name: supersearch-custom-scraping
description: "Custom scraping via temporary scripts when all web_fetch/web_search engines and the 6-step anti-crawl fallback chain have been exhausted. Governs web-scout and source-scout script behavior with security, compliance, and scope constraints."
---

# SuperSearch Custom Scraping

Custom scraping is the escalation path for fetching data that all built-in tools and fallback strategies cannot reach. Activation triggers a gate check, runtime availability, strict script constraints, and mandatory cleanup.


## Decision Gate

Before any custom scraping begins, operator MUST check each item in this checklist and record the result. The operator proceeds when all hard gates pass. If a hard gate fails, the operator MUST abort and report the blocking reason. Soft checks inform the approach but a negative result is not a blocker.

### Pre-Activation Checklist

**Hard Gates** — if any of these fail, operator MUST NOT proceed:

- [ ] **6-level fallback chain exhausted.** All steps in `supersearch-web-discovery/SKILL.md` (engine default → jina → browser → reader → web_search → alternative sources) have been attempted and returned no usable data.
- [ ] **robots.txt and ToS permit scraping.** The target domain's `robots.txt` does not disallow the scraping path. The site's Terms of Service do not prohibit automated access. If either restriction exists, operator MUST abort and report the legal reason.
- [ ] **No authentication bypass.** The scrape reads only publicly accessible content. It does not require login credentials, session cookies, captcha solving, or paywall circumvention.

**Soft Checks** — record the result; informs approach but not a blocker:

- [ ] **curl|jq one-liner attempted.** A pure `curl | jq` pipeline (see Curl+Jq Fallback section) was tried first and found insufficient. If the one-liner succeeds, use its output directly and do not proceed to script writing.
- [ ] **Public API considered.** If a public API, GraphQL endpoint, or documented data export covers the desired data, it was attempted first. Custom scraping is for data the API cannot reach.

## Runtime Probing

After the gate passes, probe available runtimes in the following preference order:

1. `which python3` — preferred. Use `python3 -c` to test availability. Python offers `requests`, `BeautifulSoup`, and `json` standard library.
2. `which node` — secondary. Node provides `fetch` (built-in since 18), `cheerio` for HTML parsing, and full npm ecosystem.
3. `which curl` + `which jq` — tertiary fallback. Pure shell pipeline without a script file. See Curl+Jq Fallback section below.

If none of these runtimes are available, operator MUST abort. Report: "No scraping runtime available (python3, node, curl+jq all absent). Cannot proceed with custom scraping."

## Script Constraints

All scraping scripts MUST obey the following constraints:

### Workspace Boundary

- Scripts MUST reside exclusively in `.rolebox/scratch/`.
- Scripts MUST NOT create, read, or modify any file outside `.rolebox/scratch/`.
- Script output files MUST be written to `.rolebox/scratch/` and then copied or read into the caller's evidence stream.
- Scripts MUST NOT access environment variables, dotfiles, or configuration outside the workspace.

### Security and Compliance

- Credentials: MUST NOT hardcode API keys, tokens, passwords, or session cookies in script text. If authentication is required, operator MUST use environment variables passed at invocation time, never stored in the file.
- Authorization bypass: MUST NOT attempt to bypass authentication, rate limits, captchas, or paywalls. If the target returns 401, 403, or a login redirect, operator MUST stop and report the authorization requirement.
- robots.txt: MUST respect `Disallow` directives. Operator MUST check `/{domain}/robots.txt` before writing any scraping script that targets that domain.
- Rate limiting: MUST enforce a minimum delay of 1 second between consecutive requests to the same domain. Implement via `time.sleep(1)` (Python) or `setTimeout` / `AbortController` delay (Node).
- User-Agent: MUST set a descriptive, truthful User-Agent header that identifies the tool and purpose (e.g., `"oh-my-role-supersearch/1.0 (research; +https://github.com/user/oh-my-role)"`). MUST NOT impersonate browsers or lie about intent.
- Destructive actions: MUST NOT perform any write, POST, DELETE, PUT, PATCH, or state-changing request. Automated data retrieval is read-only by definition.
- Request volume: MUST NOT exceed 100 requests per domain per script execution.

### Output Format

Script output MUST be one of these structured formats:

- **JSON** — for structured records, each entry a JSON object.
- **JSONL** — for streaming large result sets, one JSON object per line.
- **CSV** — for tabular data with a header row.
- **text** — for prose, rendered HTML text, or line-oriented content when structure is not required.

Output MUST include a trailing summary line with total item count if applicable.

### Error Handling

- Transient errors (timeout, connection reset, 429, 5xx): implement exponential backoff with up to 3 retries. Base delay 1 second, multiplier 2×.
- Permanent errors (403 Forbidden, 404 Not Found): do not retry. Stop immediately and report the URL and status code.
- Parse errors: log the raw response fragment that caused the failure. Do not silently drop malformed records.
- Partial success: if some pages succeed and others fail, return all successfully scraped data alongside an error report. Do not discard on partial failure.

### Cleanup

- After scraping completes (success or failure), operator MUST delete the temporary script file from `.rolebox/scratch/`.
- Only the output data file(s) remain in `.rolebox/scratch/` for evidence integration.
- If the script was aborted mid-execution, operator MUST still clean up the script file and any incomplete output.

### Evidence Integration

All custom scraping results MUST be recorded in the evidence ledger (see `supersearch-evidence-synthesis/SKILL.md` for the standard ledger format):

- Source: script file path and target URL list.
- Artifact: output file path.
- Tool fit: custom scraping (last resort).
- Claim: what data was extracted.
- Confidence: low (custom scraping is inherently fragile).
- Freshness: scrape timestamp.
- Gap: what could not be scraped and why.

## Curl+Jq Fallback

Before writing any multi-line script, operator MUST attempt a pure `curl | jq` one-liner. This is read-only, leaves no script artifact, and satisfies many API-wrapping use cases without entering the full script lifecycle.

```
curl -s -H "User-Agent: <descriptive UA>" "<url>" | jq '<filter>'
```

If the one-liner succeeds, operator uses the output directly and MUST NOT proceed to script writing. If the one-liner fails due to pagination, rate limiting, or non-JSON response, operator reverts to the full script approach and MUST pass through the decision gate again.

## Output Format

```
Custom Scraping Report
- Runtime: python3 | node | curl+jq
- Script path: .rolebox/scratch/<script-name>.<ext>
- Output file: .rolebox/scratch/<output-name>.<ext>
- Target URLs: <url-list>
- Items extracted: <count>
- Errors: <count and description>
- Confidence: low
- Evidence ledger: see Evidence Ledger section
```
