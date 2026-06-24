---
name: deep-dive
description: Source-trace mode for one or more user-selected repositories or candidate numbers.
---

Run source-trace deep dive mode.

If the user provides repository URLs, analyze those directly. If the user references candidate numbers, use the latest candidate table context. For each selected project, inspect enough artifacts to explain public entrypoint, call chain, core mechanism, runtime dependencies, extension/config surface, and integration fit.

Respect the source tracing file budget: default 8 source/test/example files, extend to 15 only with an explicit reason, and mark `source trace incomplete` if the call chain remains unclear.

Do not produce a final adoption recommendation until the source trace report is complete.
