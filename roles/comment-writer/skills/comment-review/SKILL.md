---
name: comment-review
description: Audit and fix existing code comments — detect noise, stale, and missing comments, then report findings and rewrite in place.
---

# Comment Review (Audit & Fix)

## 1. Detection Checklist

Noise comments that restate the code:
- Comment says what the code already shows. `i += 1  # increment i` — delete.
- Comment repeats the function name. `# parse input` above `parse_input()` — delete.
- Comment describes obvious control flow. `# loop over users` above a `for` loop — delete.

Stale / lying comments (verify each claim against the code):
- Comment claims behavior the code no longer has. Treat every comment as a claim and check it.
- Comment contradicts the line below it. The comment is wrong, not the code.
- `# returns milliseconds` when the code returns seconds — fix or delete.
- Suspect staleness → `git blame <file>`: date the comment against the code line it annotates.

Jargon / buzzword comments:
- "leverage", "synergy", "robust solution", "modern approach". Plain words or delete.

AI-slop patterns (hedging, filler, pleasantries):
- Hedging: "attempt to", "try to", "potentially". State it or delete it.
- Filler: "Note that", "It is worth mentioning that", "This is important because". Delete.
- Pleasantries: "Nice work here", "Careful!". Delete.
- Over-explaining the obvious in full sentences. Cut to the why or delete.

Over-commented trivial code:
- Every line carries a comment. Keep only the non-obvious why, drop the rest.
- Comment on a self-evident expression. `# sum the totals` above `total += x` — delete.

MISSING comments on non-obvious why:
- Magic values, workarounds, ordering constraints, platform quirks — why comment required.
- Inverted logic, non-obvious branch, seemingly dead code — why comment required.
- A fix that looks wrong at first glance (offsets, off-by-one, negative checks) — why comment required.

## 2. Audit Workflow

1. Read the code first. Never audit comments without the code they annotate.
2. Treat each comment as a claim. Verify it line-by-line against the code.
3. Staleness suspected → `git blame <file>` before judging.
4. Report findings (one line each, per contract below), then fix. Never fix silently.
5. Fix in place. Comments-only diff — code is untouchable during this pass.

## 3. Output Format Contract (required)

One line per finding, sorted by file:

`file:line — <problem> — <fix>`

- No filler prose. No hedging ("maybe", "I think", "could be"). No preamble, no summary.
- Example:
  `src/parser.js:42 — comment restates code — delete`
  `src/parser.js:88 — stale: claims ms, code returns s — fix to match`
  `src/auth.js:17 — missing: magic 86400 — add why comment`

## 4. Rewrite Rules

- Fix in place with plain language. Short sentences, concrete words, no buzzwords.
- Never change code while fixing comments. If a comment and code disagree, comment is wrong — but code fix is out of scope; report it.
- Delete when a comment adds nothing. Missing why → add. Wrong → fix. Noise → delete.
- One comment per non-obvious why. No comment forests, no comment blocks restating a signature.

## 5. Example Findings

English:
- ❌ `src/app.js:5 — comment restates code ("increment the counter") — delete`
- ✅ `src/app.js:11 — comment captures ordering constraint ("must run before flush") — keep`
- ❌ `src/load.js:3 — hedging ("attempt to load config") — delete`
- ✅ `src/load.js:9 — comment explains why twice ("loaded at boot and on signal") — keep`
- ❌ `src/api.js:22 — stale: claims ms, code returns s — fix to match`
- ❌ `src/util.js:7 — buzzword ("leverage the robust framework API") — delete`
- ❌ `src/main.js:1 — missing: magic 86400 — add why comment`

中文:
- ❌ `src/app.js:5 — 复述代码（“计数器加一”）— 删除`
- ✅ `src/app.js:11 — 记录了顺序约束（“必须先于 flush 执行”）— 保留`
- ❌ `src/load.js:3 — 含糊表述（“尝试加载配置”）— 删除`
- ✅ `src/load.js:9 — 解释了为何加载两次（“启动一次，收到信号一次”）— 保留`
- ❌ `src/api.js:22 — 过期注释：声称毫秒，代码返回秒 — 改为与代码一致`
- ❌ `src/util.js:7 — 空话（“利用健壮的框架 API”）— 删除`
- ❌ `src/main.js:1 — 缺少注释：魔法值 86400 — 补充 why 注释`
