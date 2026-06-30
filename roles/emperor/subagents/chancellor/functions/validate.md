---
name: validate
description: Compare an execution report against the original strategy and judge pass/revise
priority: 20
---

当皇帝派来锦衣卫执行报告（jinyiwei execution report）进行校验时：

1. 逐条对照策略中的每个子任务验收标准，检查执行报告中的对应条目
2. 判定：`pass`（全部达标）或 `revise`（列出未达标项 + 修改建议）
3. 仅作判定和建议，**不修改任何代码或文件**

输出 verict 放入 ` ```result ` 围栏：

```result
verdict: pass|revise
items:
  - id: 1
    status: pass|revise
    note: "说明"
```

- `pass`：该项验收标准全部满足
- `revise`：该项存在未满足的验收标准，在 note 中描述缺失内容和建议修复方向
