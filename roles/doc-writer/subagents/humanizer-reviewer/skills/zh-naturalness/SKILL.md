---
name: zh-naturalness
description: Chinese naturalness pass for technical prose — translationese patterns, buzzword removal, mixed-language and punctuation rules, rhythm, terminology consistency, before/after examples, and false positives. Load when reviewing Chinese paragraphs.
---

# Chinese Naturalness

## 1. What this pass judges

This pass covers Chinese paragraphs only. Judge them as Chinese: would a Chinese engineer write it
this way, and would a reader understand it in one pass?

- Change expression, never fact, number, condition, or identifier.
- Judge paragraph by paragraph; an English heading in the same file does not make the Chinese English.
- A Chinese sentence that is clear but plain is already good. Do not decorate it.

## 2. Translationese

### 2.1 Stacked 的

Long chains of 的 turn a sentence into a noun phrase and delay the verb.

- ❌ 这是一个用于在分布式系统中进行数据同步的基于消息队列的实现方案。
- ✅ 这个方案用消息队列在分布式系统之间同步数据。
- ❌ 请提供一个包含所有必填字段并且符合接口规范的请求示例。
- ✅ 请求示例要包含所有必填字段，并符合接口规范。

Rule: more than two 的 in one clause usually means the sentence should be split or the noun phrase
turned back into a verb phrase.

### 2.2 Overused 被

被 is correct when something is genuinely done to the subject by an unnamed actor. It is wrong when
Chinese would simply state the change.

- ❌ 配置文件被修改后，服务会被要求重新加载。
- ✅ 配置修改后，服务重新加载。
- ❌ 这个问题被我们通过增加超时时间解决了。
- ✅ 我们增加了超时时间，解决了这个问题。

### 2.3 Nominalization: 进行 / 实现 / 作出

Verb-plus-noun padding adds length and distance.

- ❌ 我们需要对日志进行清理，并对索引作出调整。
- ✅ 清理日志，调整索引。
- ❌ 该模块实现了对请求参数的校验。
- ✅ 该模块校验请求参数。

Try deleting 进行/实现/作出 first; if the sentence still works, the padding was never needed.

### 2.4 对于……而言 / 通过……来…… / 在……的情况下

These frames are grammatical but often add a layer between the reader and the action.

- ❌ 对于新用户而言，可以通过点击设置按钮来对语言进行切换。
- ✅ 新用户点击设置按钮即可切换语言。
- ❌ 在磁盘空间不足的情况下，写入操作会失败。
- ✅ 磁盘空间不足时，写入会失败。

Keep the frame when it carries a real condition. Delete it when it only marks importance.

### 2.5 Long pre-modifiers

Chinese puts the modifier before the noun, so a long attributive forces the reader to hold the whole
phrase in memory before learning what it is.

- ❌ 这是一个负责处理来自外部服务并且需要重试的请求的组件。
- ✅ 这个组件重试外部服务失败的请求。

### 2.6 English punctuation

- ❌ 支持 macOS, Linux, 和 Windows.
- ✅ 支持 macOS、Linux 和 Windows。
- ❌ 如果超时,请重试.
- ✅ 如果超时，请重试。

Chinese prose uses full-width punctuation; ASCII punctuation stays inside identifiers, commands, paths, and code spans.

## 3. Buzzwords

Delete these, or replace them with the action they are hiding: 赋能、助力、一站式、闭环、底层逻辑、
抓手、沉淀、对齐、打通、众所周知、简而言之、值得注意的是、显而易见、综上所述。

- ❌ 这套方案赋能团队，助力业务闭环，沉淀底层能力。
- ✅ 这套方案把审批从三步减到一步。
- ❌ 众所周知，缓存可以显著提升性能。
- ✅ 缓存命中时，查询不访问数据库。
- ❌ 简而言之，这个接口用于对齐订单字段。
- ✅ 这个接口把订单字段映射为报表字段。

If the rewrite would need a fact the text does not contain, report the sentence as unsupported.

## 4. Mixed language

Write each sentence in one language. English prose inside a Chinese sentence reads as translation,
not as precision.

- ❌ 这个 function 会 validate 传入的 input。
- ✅ 这个函数会校验传入的输入。
- ❌ 调用 API 之后 update 一下 state。
- ✅ 调用 API 后更新状态。

Exceptions: identifiers, commands, flags, paths, code, and standard terms such as `payload`, `token`, `commit`, or `webhook` stay in English and are not prose.

## 5. Punctuation and spacing

- 顿号 for short parallel items: 支持 JSON、CSV 和 YAML。
- 逗号 for clauses: 配置修改后，服务自动重启。
- Full-width comma, period, colon, semicolon, and question mark in Chinese text.
- Quotation marks follow the document: 中文引号“” or English quotes, one style throughout.
- Keep a space or none between Chinese and Latin text according to the project's existing files;
  do not switch style mid-document.
- Never put a Chinese full-width punctuation mark inside a command, path, or code identifier.

## 6. Rhythm

- Prefer short clauses over one long sentence with several 并且 and 以及.
- Prefer the active verb: 服务会重试请求，而不是“请求被服务进行重试”。
- Omit the subject when Chinese does; do not repeat 我们 or 用户 for grammatical comfort.
- Delete redundant pronouns: 用户他可以在页面上他可以点击按钮 → 用户可以在页面上点击按钮。

## 7. Terminology consistency

One concept, one name, for the whole document.

- ❌ 在请求头中传入令牌。该 token 有效期为 24 小时。后续请求要带同一个 credential。
- ✅ 在请求头中传入 token。token 有效期为 24 小时，后续请求要带同一个 token。

If the project already translates a term, use the translation everywhere. If it keeps the English
term, keep it everywhere. Do not alternate for variety; variety is not a virtue in technical terms.

## 8. Quick before/after set

The rewrites below are illustrative; in a real review, every number comes from the source text.

- ❌ 通过对配置文件的修改，可以实现服务启动速度的提升。
- ✅ 修改配置后，服务启动更快。
- ❌ 该功能被设计用于对异常请求进行处理。
- ✅ 该功能处理异常请求。
- ❌ 我们将会在稍后的时候对这个问题进行一个处理。
- ✅ 我们稍后处理这个问题。
- ❌ 请点击“确定”按钮来对设置进行保存。
- ✅ 点击“确定”保存设置。
- ❌ 在性能方面，这个版本得到了很大的优化。
- ✅ 这个版本的查询耗时从 800 ms 降到 320 ms。

## 9. False positives

Do not flag:

- Identifiers and code: `token`, `payload`, `schema`, flags, file names, commands.
- Quoted UI copy: if the text quotes a button label, keep the label exactly.
- Legal, safety, and compliance wording: 禁止在生产环境执行，可能导致数据丢失。
- Terms with no accepted Chinese equivalent. Keep the English term; do not invent a translation.
- A plain sentence that is correct but not elegant. Rhythm suggestions are minor, not major.
- A necessary 被: 配置文件被外部工具修改后，服务不会自动重载 — the external actor is unnamed and the passive carries the condition.
- Short, dense UI strings where space is constrained; the constraint is part of the register.

When unsure whether a phrase is translationese or established usage, search the repository for how the same concept is written and follow the dominant form.
