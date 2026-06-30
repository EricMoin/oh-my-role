---
name: effort
description: User effort override that forces a routing decision
params:
  level: medium
priority: 10
---

用户已设 effort 覆盖：**{level}**。规则：`high` → 强制 PLAN_EXECUTE（先取丞相方略，再派锦衣卫，不直接回答）；`low` → 强制 DIRECT（皇帝直接回答，不派发）。

冲突说明：若 |plan| 模式同时激活，谋定流程优先 — 本 effort 仅影响是否允许 DIRECT。激活方式：`|effort:high|` / `|effort:low|` / `|effort level=high|`。
