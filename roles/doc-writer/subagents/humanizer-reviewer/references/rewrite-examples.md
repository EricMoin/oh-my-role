# Rewrite Examples

Thirteen calibration pairs. Each shows a source sentence, a minimal rewrite, and the facts, identifiers,
and uncertainty the rewrite had to preserve. Use them to check the shape and size of an edit; do not
paste them into a real document.

Pairs 1–10 show compression that removes what has no evidence. Pairs 11–13 show the opposite error:
a passage compressed so far that the reader loses a condition, a recovery step, or the definition of
a label. In those pairs the longer version is the fix, and `Preserved` names what it had to restore.

The `Preserved` line is the test. If a rewrite in your own review cannot name what it preserved, the
rewrite is not ready.

## 1. English AI-slop to plain

Before: Our robust, seamless tooling leverages battle-tested components to facilitate a comprehensive migration of your workloads.

After: The migration tool moves your workloads.

Preserved: the migration, the tool, and the workloads. Neither version states a number, version,
platform, or condition, so none was added; the removed adjectives had no evidence behind them.

## 2. Chinese translationese to natural

Before: 对于刚刚加入团队的成员而言，可以通过阅读本文档来对部署流程进行了解。

After: 新成员读这篇文档就能了解部署流程。

Preserved: 新成员、本文档、部署流程，以及原句"可以"表达的可行性。改写没有新增步骤、条件或时间。

## 3. Nominalization to verb

Before: The implementation of the retry policy requires the configuration of a backoff value.

After: To add the retry policy, set a backoff value.

Preserved: the retry policy, the backoff value, and the requirement connecting them. No default
value, field name, or unit was invented.

## 4. Vague pronoun to named referent

Before: The scheduler assigns the job to a worker. It marks the job as running.

After: The scheduler assigns the job to a worker. The scheduler marks the job as running.

Preserved: scheduler, job, worker, and both actions. The referent was recoverable because the
scheduler is the only actor in the previous sentence; if two actors had been possible, the item
would be a question, not a rewrite.

## 5. Buried lede to direct

Before: Because the service grew from a small internal tool to a platform used by three teams, and because that growth caused configuration drift, we now recommend that all deployments use the shared release pipeline.

After: Use the shared release pipeline for all deployments. The older deploy scripts drifted as three teams adopted the service.

Preserved: the recommendation, "all deployments", "three teams", the shared release pipeline, and
configuration drift as the stated reason. The strength of the recommendation is unchanged.

## 6. Marketing in a runbook to factual

Before: Our world-class deployment platform makes shipping a delight — just push and watch the magic happen.

After: Push the branch. The pipeline deploys it.

Preserved: the push action and the pipeline deploy. Removed praise only; no build, test, or staging
claim was added, because the source did not make one.

## 7. Hedging to honest uncertainty

Before: The cache may possibly help reduce latency in some environments.

After: The cache may reduce latency in some environments.

Preserved: may (the uncertainty), some environments (the scope), cache, and latency. The rewrite
does not claim a measured improvement; it only removes a stacked intensifier.

## 8. Rule-of-three to one supported claim

Before: The CLI is fast, reliable, and secure. A warm run returns in under 50 ms.

After: A warm run returns in under 50 ms.

Preserved: the 50 ms number, the warm-run condition, and the supported claim about speed. The other
two adjectives had no support in the passage, so they move to Unresolved instead of being replaced
or silently deleted.

## 9. Mixed language to pure Chinese with identifiers

Before: 这个 hook 会在 render 之前去 call 一次 API，然后 update 一下 state。

After: 这个 hook 在 render 之前调用一次 API，然后更新 state。

Preserved: the identifiers hook, render, API, and state; the order (before render); "one API call";
and the object being updated. English verbs became Chinese verbs; identifiers stayed.

## 10. Already-clear text to no change

Before: Set `retries` to 3 to retry a failed upload three times, then stop.

After: (no change)

Preserved: every word. The sentence is active, concrete, and keeps the identifier and the stopping
condition. Any rewrite would either add a fact or weaken the condition, so the correct report is
PASS with no finding for this sentence.

## 11. Label-only summary to expanded explanation

Before: 按调研：删 filler、反 AI-slop、plain language。

After: 根据调研笔记，改写包含三件事：删掉没有信息的 filler（"众所周知"、"值得注意的是"）；把 AI-slop
词换成它描述的具体行为（"无缝"→"不需要重启"）；把 plain language 当作"读一遍就能行动"，而不是
"句子越短越好"。

Preserved: 三个标签、调研来源，以及每个标签指向的动作。展开的部分是定义和一个替换例子，没有新增
研究结论、数字或外部来源。

## 12. Too-short security warning to necessary warning

Before: 不要把 token 写进日志。

After: 不要把 access token 写进日志。任何能读日志的团队都能看到它；token 写进日志后不会自动过期，必须手动轮换。如果已经写进去了，轮换 token 并删除对应的日志行；只删日志行不能撤销 token。

Preserved: the prohibition and the token; the policy's reasons (every team with log access can read
the log, and a logged token stays valid until rotation), the recovery action (rotate), and the limit
of deleting the line. The rewrite invented no token lifetime, role name, or audit step.

## 13. Too-short migration step to necessary migration step

Before: 迁移前停掉 writer。

After: 迁移前停掉 `events-writer`，并确认它已经停止：运行 `systemctl stop events-writer`，再运行
`systemctl is-active events-writer`，输出为 `inactive` 后再开始迁移。writer 还在运行时，迁移期间
写入的行只存在旧表，迁移后的行数校验会对不上。迁移失败时先重启 writer 再重试；writer 停止超过
60 秒会丢弃事件。

Preserved: the prerequisite order, the exact service name, the stop and check commands, the
`inactive` output, the failure symptom (rows exist only in the old table, so the count check fails),
the recovery order (restart before retry), and the 60-second event-loss condition. The short version
keeps the order but drops every fact the reader needs to execute it safely.
