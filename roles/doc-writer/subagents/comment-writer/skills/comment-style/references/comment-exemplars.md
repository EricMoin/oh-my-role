---
description: Real, sourced comment models — why-type exemplars, a near-miss noise catalog, and mining greps. Read on demand while writing comments.
---

# Comment Exemplars

Provenance rule: every exemplar carries a Source URL, and every excerpt is quoted verbatim from that source. Never paraphrase an exemplar or invent one. If a comment is not backed by a Source line here or in the file under review, it is not a model.

## Ordering and sequencing
### Go `sync/once.go` — field order on the hot path
```go
	// It is first in the struct because it is used in the hot path.
	// Placing done first allows more compact instructions on some architectures (amd64/386),
	// and fewer instructions (to calculate offset) on other architectures.
```
Source: https://github.com/golang/go/blob/master/src/sync/once.go (local mirror: `$(go env GOROOT)/src/sync/once.go`)
Kill test: delete it and a later reader repacks the struct, paying a cache miss on every call site.
### Linux `kernel/sched/loadavg.c` — write the time, then flip the index
```c
	 * Make sure we first write the new time then flip the index, so that
	 * calc_load_write_idx() will see the new time when it reads the new
	 * index, this avoids a double flip messing things up.
```
Source: https://github.com/torvalds/linux/blob/master/kernel/sched/loadavg.c
Kill test: delete it and someone reorders the write after the flip, reintroducing the double-flip bug.
### Arthas `Arthas.java` — delete the stale link before linking
```java
            // 清理可能残留的(悬空)软链，避免 createSymbolicLink 因已存在而失败
```
Source: https://github.com/alibaba/arthas/blob/master/core/src/main/java/com/taobao/arthas/core/Arthas.java
Kill test: delete it and a reader removes the `deleteIfExists` above it as redundant.
## Magic values and external constraints
### Hutool `StrUtil.java` — why the factor is 4
```java
		//UTF-8编码单个字符最大长度4
```
Source: https://github.com/dromara/hutool/blob/v5-master/hutool-core/src/main/java/cn/hutool/core/util/StrUtil.java
Kill test: delete it and 4 looks like a magic number to tune.
### Arthas `Arthas.java` — why the whole home, not two jars
```java
     * 不能只复制 agent/core 两个 jar——ArthasBootstrap 启动时还会从 arthas home 读取
     * arthas-spy.jar(注入 bootstrap classloader，缺失会直接抛异常)、async-profiler、
     * arthas.properties 等资源；资源不全会导致 bind 失败、telnet 端口连不上。
```
Source: https://github.com/alibaba/arthas/blob/master/core/src/main/java/com/taobao/arthas/core/Arthas.java
Kill test: delete it and someone optimizes the copy down to two jars, breaking bootstrap.
### Go `fmt/print.go` — the interface is implemented for a reason
```go
// WriteString implements [io.StringWriter] so that we can call [io.WriteString]
// on a pp (through state), for efficiency.
```
Source: https://github.com/golang/go/blob/master/src/fmt/print.go (local mirror: `$(go env GOROOT)/src/fmt/print.go`)
Kill test: delete it and a reader cannot tell why the method exists, or why it beats io.WriteString.
## Workarounds and platform quirks
### Arthas `Arthas.java` — the /proc symlink workaround
```java
     * 通过 /proc/&lt;targetPid&gt;/root 建立软链，使 JDK 的 attach 机制能在本进程 tmpdir 找到它。
     * 若 socket 尚未创建(冷启动)，先建悬空软链，JDK 触发 attach listener 创建 socket 后即可解析成功。
```
Source: https://github.com/alibaba/arthas/blob/master/core/src/main/java/com/taobao/arthas/core/Arthas.java
Kill test: delete it and nobody knows a dangling symlink is intentional, not a bug to fix.
### Arthas `Arthas.java` — cross-namespace attach is a workaround
```java
     *   - 强耦合 JDK attach 的实现细节（.java_pid 命名、tmpdir 约定、.attach_pid+SIGQUIT 触发），JDK 版本变更可能失效；
     *   - 更"正统"的替代方案是运维层面消除双文件系统：kubectl exec 进应用容器、两容器挂共享 emptyDir、或走 tunnel server。
```
Source: https://github.com/alibaba/arthas/blob/master/core/src/main/java/com/taobao/arthas/core/Arthas.java
Kill test: delete it and the workaround hardens into a design, with no path back to the 运维 fix.
### Hutool `StrUtil.java` — a fixed bug with its issue id
```java
		// issue#IDFTJS 修正截断后追加省略号...导致超出限制长度的问题
```
Source: https://github.com/dromara/hutool/blob/v5-master/hutool-core/src/main/java/cn/hutool/core/util/StrUtil.java
Kill test: delete it and a later refactor restores the over-length bug the condition guards.
## Deliberate deviations and tradeoffs
### Go `sync/mutex.go` — TryLock is usually a mistake
```go
// Note that while correct uses of TryLock do exist, they are rare,
// and use of TryLock is often a sign of a deeper problem
// in a particular use of mutexes.
```
Source: https://github.com/golang/go/blob/master/src/sync/mutex.go (local mirror: `$(go env GOROOT)/src/sync/mutex.go`)
Kill test: delete it and TryLock reads as an ordinary API to reach for.
### Hutool `StrUtil.java` — empty string instead of null or "null"
```java
		// obj为空时, 返回 null 或 "null" 都不适用部分场景, 此处返回 "" 空字符串
```
Source: https://github.com/dromara/hutool/blob/v5-master/hutool-core/src/main/java/cn/hutool/core/util/StrUtil.java
Kill test: delete it and someone corrects the return to null, breaking callers that append the result.
## Preconditions and invariants
### Redis `src/dict.c` — rehash cannot run twice
```c
    /* We can't rehash twice if rehashing is ongoing. */
```
Source: https://github.com/redis/redis/blob/7.4/src/dict.c
Kill test: delete it and the assertion below looks defensive, so a caller stops checking dictIsRehashing.
### Redis `src/dict.c` — which table an insert lands in
```c
    /* If rehashing is ongoing, we insert in table 1, otherwise in table 0.
     * Assert that the provided bucket is the right table. */
```
Source: https://github.com/redis/redis/blob/7.4/src/dict.c
Kill test: delete it and the htidx ternary loses the invariant its assertion enforces.
## Doc-comment contracts
### Hutool `StrUtil.java` — the caller contract for truncation
```java
	 * 截断字符串，使用其按照UTF-8编码为字节后不超过maxBytes长度。截断后自动追加省略号(...)
	 * 用于存储数据库varchar且编码为UTF-8的字段
```
Source: https://github.com/dromara/hutool/blob/v5-master/hutool-core/src/main/java/cn/hutool/core/util/StrUtil.java
Kill test: delete it and callers pass a character limit where a byte limit is required.
### Arthas `Arthas.java` — the permission contract for the copied file
```java
                    // 放开 other 读权限，确保目标容器里的(普通用户)进程可读；源文件可执行则保留执行位
```
Source: https://github.com/alibaba/arthas/blob/master/core/src/main/java/com/taobao/arthas/core/Arthas.java
Kill test: delete it and a reader tightens the mode to 750, making the files unreadable in the target container.
## Near-miss catalog
### Alibaba Java 开发手册 rule 10 — 命名已自解释
```java
 // put elephant into fridge
 put(elephant, fridge);
```
Source: https://github.com/alibaba/p3c/blob/master/p3c-gitbook/编程规约/注释规约.md
Kill test: deleting it loses nothing — that is the point; adding it was the mistake.
Noise shapes, each labeled why it is noise:
- 中文 `// 校验参数` above `validateParams(req)` — restates the callee.
- 中文 `// 遍历用户列表` above a `for (const u of users)` loop — announces the loop.
- 中文 `// 初始化 Redis 客户端` above `new RedisClient(cfg)` — labels the assignment.
- 中文 `// ---------- 工具方法 ----------` over two trivial helpers — banner over fewer than three statements.
- EN `// validate the input` — restates the callee.
- EN `// loop over the users` — announces the loop.
- EN `// initialize the client` — labels the assignment.
- EN `// increment the retry counter` — restates the statement.
## How to mine more
Grep a file for the connectives that mark a why-comment, then run each hit through the four-step gate.
- EN: `grep -En "because|so that|avoid|otherwise|must not" <file>`
- 中文: `grep -En "因为|避免|否则|为了|防止|兼容|必须" <file>`
Repos worth mining: `golang/go` (`src/sync`, `src/fmt`), `redis/redis` (`src/dict.c`), `torvalds/linux` (`kernel/sched`), `alibaba/arthas` (`core/src/main/java`), `dromara/hutool` (`hutool-core/src/main/java/cn/hutool/core/util/StrUtil.java`).
