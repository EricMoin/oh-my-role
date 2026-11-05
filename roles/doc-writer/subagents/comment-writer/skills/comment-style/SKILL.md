---
name: comment-style
description: Default-no-comment gate plus prose rules — decide whether a comment is earned, then phrase the ones that are. Load before writing any comment.
---

# Comment Style

## 1. The comment gate — default: no comment

No comment is the default. Every comment is an exception that must be earned, one at a time:

1. **Recover** — read the line using only the code, names, types, and structure. If you already know what it does, stop. No comment.
2. **Delete** — take the comment away. Does a competent reader who knows this language and this codebase lose something they cannot recover from the code and its names? If not, the comment never existed.
3. **Name it** — say the lost thing in one concrete clause. If the only thing you can say is "this validates the parameters", nothing was lost. Stop.
4. **Write exactly that** — the one thing named in step 3: a reason, a constraint or invariant, a history (a bug, a decision), or a caller contract. Say it the way a colleague would say it aloud, in the reader's language. One line unless the reason genuinely needs two.

Auto-suspect shapes — delete unless step 3 produced a concrete why:
- restates the called function or identifier
- announces a loop or an initialization
- labels the variable being assigned
- restates a condition
- section banner over fewer than three substantive statements
- a comment on nearly every line of a short function
- commented-out code with no dated reason
- mixed 中文/English prose in one comment

### Near-misses

Noise a glance accepts and step 2 kills (the sourced models live in the exemplar bank):

- ❌ `// 校验参数` above `validateParams(req)` — restates the callee.
- ❌ `// 遍历用户列表` above `for (const u of users)` — announces the loop.
- ❌ `// 初始化 Redis 客户端` above `new RedisClient(cfg)` — labels the assignment.
- ❌ `// ---------- 工具方法 ----------` over two trivial helpers — banner over fewer than three statements.
- ❌ `// validate the input` — restates the callee.
- ❌ `// loop over the users` — announces the loop.
- ❌ `// initialize the client` — labels the assignment.
- ❌ `// increment the retry counter` — restates the statement.

## 2. Worked walkthrough

```python
def load_config(path, attempts=3):
    for attempt in range(attempts):            # ①
        try:
            with open(path) as fh:
                raw = fh.read()
            return json.loads(raw)             # ②
        except (OSError, JSONDecodeError):
            sleep(0.1 * (attempt + 1))         # ③
    raise ConfigError(path)
```

- ① tempting `# 重试读取配置` → DELETE: the loop already reads as retry.
- ② tempting `# 解析 JSON` → DELETE: `json.loads` already says it.
- ③ tempting `# 指数退避` → DELETE the mechanism; step 3 names the constraint, KEEP `# 配置由写方原子替换，读失败是暂时的` — it survives the kill test.

## 3. WHY-not-WHAT, reconciled

A comment explains *why*; the code shows the *what*. Google pyguide §3.8.5 — never describe the code, assume the reader knows the language. Linux kernel coding style §8 — comments tell **what** the code does, not **how** it works. Both land on one rule: **never narrate the mechanism; state the reason or the constraint.**

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

## 4. Plain-language vocabulary

Write like a human (Microsoft Writing Style Guide, Top 10 tips; Google developer documentation style guide). Drop the buzzwords:

- `leverage` / `utilize` → `use`
- `robust` / `seamless` → say what it does
- `facilitate` → `help` / `enable`
- `comprehensive` → `covers X and Y`
- `ensure` → `make sure`, or delete when the code already does it
- `optimize` → name the metric, or delete

中文黑话，同样 Drop: `众所周知` / `简而言之` / `值得注意的是` / `显而易见` / `综上所述` → delete each.

Never mix languages mid-sentence. Pure 中文 or pure English, never both:

- ❌ `这个 function 的作用是校验 input`
- ✅ `这个函数的作用是校验输入。` / ✅ `This function validates the input.`

Code identifiers stay English: `校验 payload 的 schema` is fine — `payload` and `schema` are identifiers, not English prose.

## 5. AI-slop patterns to strip

Google pyguide §3.8.5/§3.8.6 — comments are narrative text: complete sentences, correct spelling, punctuation, and grammar.

- Hedging: ❌ `you might want to`, ❌ `I noticed that`, ❌ `as you can see`
- Exclamation marks: ❌ `// NOTE: this is important!` → drop the `!`
- Rule-of-three padding: three examples when one suffices
- Empty pleasantries: ❌ `// hope this helps`
- Meta-commentary: ❌ `// this is a tricky part` — say *why* it is tricky, or say nothing.

## 6. Length discipline

- One line preferred. If it fits on one line, keep it on one line.
- A paragraph is allowed only for a non-obvious *why*: a historical bug, a weird constraint, a deliberate deviation.
- Two paragraphs belong in a docstring or README, not inline.
- Never repeat in a paragraph what the code already shows.

## 7. Placement conventions

Markers follow one shape: `MARKER(owner|ref): description`

- `TODO(zhang): add pagination when the table exceeds 10k rows`
- `FIXME(#482): off-by-one on leap years, fix before 2027-03-01`
- `HACK(deprecated API): keep while the v1 shim is live`
- `NOTE: capacity is 2^16 — see protocol spec §3`

- Owner (name or handle) or issue ref — never both empty.
- Description states the gap, not a wish.
- Section headers only to group a non-obvious block (≥3 related comments); never to decorate trivial code.
- License headers: follow the project convention. Never invent a header the repo does not use.

## 8. Human-authored models

For real human-authored comment models with sources, read `references/comment-exemplars.md`.

- Go `sync/once.go`: `// It is first in the struct because it is used in the hot path.` — delete it and the field gets repacked off the hot path.
- Redis `dict.c`: `/* We can't rehash twice if rehashing is ongoing. */` — an invariant the assertion below depends on.
- Arthas `Arthas.java`: `// 清理可能残留的(悬空)软链，避免 createSymbolicLink 因已存在而失败` — 删掉后，读者会把上面的 deleteIfExists 当冗余删掉。
- Hutool `StrUtil.java`: `// obj为空时, 返回 null 或 "null" 都不适用部分场景, 此处返回 "" 空字符串` — 删掉后，有人会把返回值"修正"成 null。
