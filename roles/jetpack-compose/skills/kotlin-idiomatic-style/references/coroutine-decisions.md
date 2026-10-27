# Coroutine decisions

Read for plain Kotlin concurrency and Flow changes. Android lifecycle collection and
UI event ownership belong to `compose-runtime-state` and `compose-ui-architecture`.
Examples require `kotlinx-coroutines-core`; use the target project's resolved version.

## Scope and dispatcher are separate decisions

- Use a caller-owned scope or suspending function for work with that caller's lifetime.
  Longer-lived work needs an explicit application owner. `GlobalScope` can be cancelled
  through a returned job, but has no structured parent; do not substitute it for ownership.
- `coroutineScope` propagates child failure through the operation. `supervisorScope`
  isolates child failures from siblings; it does not handle uncaught `launch` exceptions.
  Handle expected child failures explicitly; an exception in the scope block still
  cancels its children.
- `suspend` enables suspension; it does not guarantee main safety. Move blocking IO to
  an appropriate dispatcher and CPU-heavy work off Main. Existing suspending library
  APIs may already be main-safe; do not wrap every call in `Dispatchers.IO` by habit.

Sources: [Structured scopes](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/coroutine-scope.html),
[supervision](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/supervisor-scope.html),
and [Android coroutine practices](https://developer.android.com/kotlin/coroutines/coroutines-best-practices).

## Preserve cancellation and recover only from expected failures

```kotlin
import java.io.IOException
import kotlinx.coroutines.CancellationException

suspend fun readOrFallback(read: suspend () -> String, fallback: String): String =
    try {
        read()
    } catch (cancelled: CancellationException) {
        throw cancelled
    } catch (failure: IOException) {
        fallback
    }
```

`runCatching` catches `Throwable`, including cancellation. It is not inherently illegal
around a suspending call, but consuming its failure can hide cancellation or fatal
errors. Prefer a narrow `try/catch` when the recoverable failure type is known.

For a CPU loop in a plain suspending function, use the current context explicitly:

```kotlin
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.ensureActive

suspend fun processAll(items: List<Int>, process: (Int) -> Unit) {
    for (item in items) {
        currentCoroutineContext().ensureActive()
        process(item)
    }
}
```

This checks cancellation between items; it does not move processing off the caller's
thread or interrupt a single blocking `process` call.

Sources: [runCatching](https://kotlinlang.org/api/core/kotlin-stdlib/kotlin/run-catching.html)
and [ensureActive](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/ensure-active.html).

## Place Flow failure handling at the intended boundary

```kotlin
import java.io.IOException
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.collect

suspend fun consumeWithFallback(source: Flow<String>, consume: suspend (String) -> Unit) {
    source
        .catch { failure ->
            if (failure !is IOException) throw failure
            emit("Unavailable")
        }
        .collect { consume(it) }
}

suspend fun consumeOrReport(
    source: Flow<String>,
    consume: suspend (String) -> Unit,
    report: (IOException) -> Unit,
) {
    try {
        source.collect { consume(it) }
    } catch (failure: IOException) {
        report(failure)
    }
}
```

`catch` handles failures upstream of its position, not failures from `consume` below it.
A `try/catch` around terminal collection can catch both upstream and collector failures
of the matching exception type. Emitting a fallback from `catch` does not resume the
failed upstream producer; use an intentional retry policy when restarting is required.

Source: [Flow catch](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/catch.html).

## Keep stream semantics explicit

- `flowOn` affects upstream context, not downstream collection. A dispatcher change
  introduces a coroutine/channel boundary; not every `flowOn` creates another channel.
- Keep mutable flow holders private. `StateFlow` has a current value and conflates
  equal updates; `SharedFlow` has configurable replay and buffering. Neither makes
  lifecycle-sensitive event delivery exactly once. Define loss/replay requirements.
- Use `MutableStateFlow.update` for atomic read-modify-write changes. Its lambda may
  run more than once under contention, so keep external effects outside the lambda.
- Choose `combine`, switching, debouncing, and buffering by semantics. Check each API's
  actual opt-in annotation in the resolved dependency; `FlowPreview` and
  `ExperimentalCoroutinesApi` are not interchangeable.

Sources: [flowOn](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/flow-on.html),
[StateFlow](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/-state-flow/),
[SharedFlow](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/-shared-flow/), and
[update](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/update.html).

## Independent work within one operation

Use structured parallelism only when the results are independently obtainable and both
belong to the caller's operation. Creating an `async` and immediately awaiting it before
starting the next one does not provide concurrency.

```kotlin
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope

suspend fun <A, B> fetchTogether(first: suspend () -> A, second: suspend () -> B): Pair<A, B> =
    coroutineScope {
        val firstResult = async { first() }
        val secondResult = async { second() }
        firstResult.await() to secondResult.await()
    }
```

Failure cancels the sibling work under `coroutineScope`. Use `supervisorScope` when partial
success is an explicit requirement, and handle each child's expected failure; supervision
is not an exception handler. Inject dispatchers where the layer owns blocking/CPU work so
checks can control execution. A suspend API may have a synchronous fast path or be required
by an interface; do not remove `suspend` solely because one implementation does not suspend.

Source: [Composing suspending functions](https://kotlinlang.org/docs/composing-suspending-functions.html).

## Cold producers, sharing and operator selection

A `flow { }` producer runs separately for each collector and starts only on collection.
Hot flows share a state or broadcast independent of an individual collector. Neither model
is inherently better. Sharing an expensive cold producer needs an explicit scope, start/stop
policy and replay contract (`shareIn` or `stateIn` where appropriate); see the architecture
skill for UI ownership. An extra collector can otherwise duplicate upstream work.

| Requirement | Candidate and behavior |
| --- | --- |
| Transform/filter each value | `map` / `filter`; suspend transformations stay sequential unless concurrency is explicitly introduced |
| Latest value from each input | `combine`; waits for an initial value from each input, then recomputes on updates |
| Pair corresponding values | `zip`; pairs next elements and completes when one input completes |
| Replace an obsolete inner stream | `flatMapLatest`; cancels the previous inner flow when a new upstream value arrives |
| Stop an obsolete action | `collectLatest`; cancels the previous collector action, not every external effect it already caused |
| Wait for a quiet interval | `debounce`; suppresses values followed too soon by newer ones, not a fixed-rate throttle |
| Suppress equal consecutive values | `distinctUntilChanged`; no extra effect on an untransformed StateFlow |
| Decouple producer/consumer pace | `buffer`; check capacity/overflow, ordering and memory requirements |

Cancellation is cooperative and cannot undo a completed external write. A "latest" operator
alone is not a transaction or a guarantee that a callback-based remote API honors cancellation.
Keep request identity/idempotency rules where side effects can outlive the cancelled request.

```kotlin
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.FlowPreview
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.debounce
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.map

@OptIn(ExperimentalCoroutinesApi::class, FlowPreview::class)
fun searchValues(
    queries: Flow<String>,
    search: (String) -> Flow<List<String>>,
): Flow<List<String>> = queries
    .map { it.trim() }
    .distinctUntilChanged()
    .debounce { query -> if (query.isEmpty()) 0L else 250L }
    .flatMapLatest { query -> if (query.isEmpty()) flowOf(emptyList()) else search(query) }
```

This example emits an empty result for empty input and replaces prior result collection
when the debounced query changes. During the debounce interval, the previous search remains
active; if immediate cancellation or suppression of its output is required, design that
policy separately. The debounce interval and normalization are product choices, not defaults.
Confirm opt-ins in the resolved dependency: the inspected API marks `flatMapLatest` with
`ExperimentalCoroutinesApi` and `debounce` with `FlowPreview`.

Sources: [Flow concepts](https://kotlinlang.org/docs/flow.html),
[combine](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/combine.html),
[zip](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/zip.html),
[flatMapLatest](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/flat-map-latest.html),
[debounce](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/debounce.html).

## Expose state without exposing its writer

```kotlin
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

class CountOwner {
    private val mutableCount = MutableStateFlow(0)
    val count: StateFlow<Int> = mutableCount.asStateFlow()

    fun increment() { mutableCount.update { it + 1 } }
}
```

The owner exposes a read-only flow and controls transitions. `update` may retry its lambda,
so keep logging, network calls and other effects outside it. Replacing a global variable
with a global StateFlow does not by itself fix scope, reset, privacy or lifecycle ownership.
The caller/DI boundary must still choose which owner instance is shared and for how long.
