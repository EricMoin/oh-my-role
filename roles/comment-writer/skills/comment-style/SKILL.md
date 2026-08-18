---
name: comment-style
description: Core comment-writing discipline — what to comment, what to drop, and how to phrase it. Load before writing any comment.
---

# Comment Style

## 1. When to Comment

Comment only what the code cannot say. Four reasons justify a comment:

- **Why** — the decision behind the code, not the code itself.
- **Context** — constraints, history, or environment the reader lacks.
- **Intent** — the goal, so a later change can preserve it.
- **Tradeoffs** — what was chosen and what was given up.

Assumptions count: if the code silently relies on a precondition, say so.

## 2. When NOT to Comment

Drop comments that restate the code, describe obvious behavior, or repeat a self-documenting name:

- ❌ `// increment i by 1` — the code says this.
- ❌ `// parse the JSON response` — `parseJson()` says this.
- ❌ `// set the user's name` — `setUserName()` says this.

If a comment adds nothing the reader cannot read off the line, it is noise. Noise costs more than silence: it rots, drifts, and trains readers to skip comments.

## 3. WHY-not-WHAT

A comment explains the *why*; the code shows the *what*. A comment that can only say *what* gets deleted.

❌
```python
# apply the discount to the total
total = total * 0.9
```

✅
```python
# 10% early-bird discount — expires 2026-12-31 (contract §4.2)
total = total * 0.9
```

❌
```javascript
// retry the request
for (let i = 0; i < 3; i++) { ... }
```

✅
```javascript
// backend is flaky under load; retry up to 3 times, then surface the error
for (let i = 0; i < 3; i++) { ... }
```

## 4. Plain-Language Vocabulary

Write like a human. Drop the buzzwords:

- `utilize` → `use`
- `leverage` → `use`
- `robust` → say what it actually does
- `seamless` → say what it actually does
- `granular` → `fine-grained`, or just say it
- `facilitate` → `help` / `enable`
- `comprehensive` → `covers X and Y`
- `ensure` → `make sure`, or delete when the code already does it
- `optimize` → name the metric, or delete

中文黑话，同样 Drop: `众所周知` / `简而言之` / `值得注意的是` / `显而易见` / `综上所述` → delete each.

Never mix languages mid-sentence. Pure 中文 or pure English, never both:

- ❌ `这个 function 的作用是校验 input`
- ✅ `这个函数的作用是校验输入。` / ✅ `This function validates the input.`

Code identifiers stay English: `校验 payload 的 schema` is fine — `payload` and `schema` are identifiers, not English prose.

## 5. AI-Slop Patterns to Strip

- Hedging: ❌ `you might want to`, ❌ `I noticed that`, ❌ `as you can see`
- Exclamation marks: ❌ `// NOTE: this is important!` → drop the `!`
- Rule-of-three padding: three examples when one suffices
- Empty pleasantries: ❌ `// hope this helps`, ❌ `// happy to explain more`
- Meta-commentary: ❌ `// this is a tricky part` — say *why* it is tricky, or say nothing.

## 6. Length Discipline

- One line preferred. If it fits on one line, keep it on one line.
- A paragraph is allowed only for a non-obvious *why*: a historical bug, a weird constraint, a deliberate deviation.
- Two paragraphs belong in a docstring or README, not inline.
- Never repeat in a paragraph what the code already shows.

## 7. Placement Conventions

Markers follow one shape: `MARKER(owner|ref): description`

- `TODO(zhang): add pagination when the table exceeds 10k rows`
- `FIXME(#482): off-by-one on leap years, fix before 2027-03-01`
- `HACK(deprecated API): keep while the v1 shim is live`
- `NOTE: capacity is 2^16 — see protocol spec §3`

Rules:

- Owner (name or handle) or issue ref — never both empty.
- Description states the gap, not a wish.
- Section headers only to group a non-obvious block (≥3 related comments); never to decorate trivial code.
- License headers: follow the project convention. Never invent a header the repo does not use.

## 8. Bilingual Examples

English:

- ❌ `// increments the counter by one` — WHAT
- ✅ `// counter starts at 1 so the first id is 1, not 0` — WHY

- ❌ `// this function is designed to facilitate the comprehensive validation of user input`
- ✅ `// rejects empty and duplicate usernames (signup form rule 3)`

中文:

- ❌ `// 将计数器加一` — 复述代码
- ✅ `// 计数器从 1 开始，保证第一个 id 是 1 而不是 0` — 解释原因

- ❌ `// 众所周知，此函数用于全面校验用户输入`
- ✅ `// 拒绝空用户名和重复用户名（注册表单规则 3）`
