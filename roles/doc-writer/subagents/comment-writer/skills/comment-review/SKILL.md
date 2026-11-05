---
name: comment-review
description: Audit and fix existing code comments — detect noise, stale, and missing comments, then report findings and rewrite in place.
---

# Comment Review (Audit & Fix)

## 1. Detection Checklist

A comment fails review when it fails the kill test in comment-style section 1: delete it and ask whether a competent reader loses something the code and its names cannot recover.

Stale / lying comments (verify each claim against the code):
- Comment claims behavior the code no longer has. Treat every comment as a claim and check it.
- Comment contradicts the line below it. The comment is wrong, not the code.
- Suspect staleness → `git blame <file>`: date the comment against the code line it annotates.

MISSING why on non-obvious code:
- Magic values, workarounds, ordering constraints, platform quirks, inverted logic — why comment required.
- A fix that looks wrong at first glance (offsets, off-by-one, negative checks) — why comment required.

Comment forests and commented-out code:
- Every line carries a comment, or a banner restates a signature. Keep only the non-obvious why.
- Commented-out code with no dated reason and no owner. Delete; a dated, owned `// dead since v1.2 — zhang` stays.

Jargon / buzzwords, AI-slop hedging and filler:
- "leverage", "synergy", "robust solution", "modern approach". Plain words or delete.
- Hedging: "attempt to", "try to", "potentially". Filler: "Note that", "This is important because". Delete.
- Pleasantries ("Nice work here", "Careful!") and full-sentence restatements of the obvious. Delete.

## 2. Audit Workflow

1. Read the code first. Never audit comments without the code they annotate.
2. Apply the kill test to each comment: delete it and check whether something unrecoverable is lost.
3. Staleness suspected → `git blame <file>` before judging.
4. Report findings (one line each, per contract below), then fix. Never fix silently.
5. Fix in place. Comments-only diff — code is untouchable during this pass.

## 3. Output Format Contract (required)

One line per finding, sorted by file:

`file:line — <problem> — <fix>`

- No filler prose. No hedging ("maybe", "I think", "could be"). No preamble, no summary.
- Example:
  `src/parser.js:88 — stale: claims ms, code returns s — fix to match`
  `src/auth.js:17 — missing: magic 86400 — add why comment`
  `src/util.js:7 — buzzword ("robust solution") — delete`

## 4. Rewrite Rules

- Fix in place with plain language. Short sentences, concrete words, no buzzwords.
- Never change code while fixing comments. If a comment and code disagree, comment is wrong — but code fix is out of scope; report it.
- Delete when a comment adds nothing. Missing why → add. Wrong → fix. Noise → delete.
- One comment per non-obvious why. No comment forests, no comment blocks restating a signature.

## 5. Example Findings

English:
- ❌ `src/parser.js:88 — stale: claims ms, code returns s — fix to match`
- ✅ `src/queue.js:11 — ordering constraint, still load-bearing — keep`
- ❌ `src/util.js:7 — buzzword ("leverage the robust framework API") — delete`
- ❌ `src/load.js:3 — hedging ("attempt to load config") — delete`
- ❌ `src/auth.js:17 — missing: magic 86400 — add why comment`
- ❌ `src/tokens.js:56 — forest: a comment on every line of check_token — cut to the one why`

中文:
- ❌ `src/parser.js:88 — 过期注释：声称毫秒，代码返回秒 — 改为与代码一致`
- ✅ `src/queue.js:11 — 顺序约束仍在注释里，删掉就会丢 — 保留`
- ❌ `src/util.js:7 — 空话（“利用健壮的框架 API”）— 删除`
- ❌ `src/load.js:3 — 含糊表述（“尝试加载配置”）— 删除`
- ❌ `src/auth.js:17 — 缺少注释：魔法值 86400 — 补充 why 注释`
- ❌ `src/tokens.js:56 — 注释成林：check_token 每行都有注释 — 只留那一条 why`
