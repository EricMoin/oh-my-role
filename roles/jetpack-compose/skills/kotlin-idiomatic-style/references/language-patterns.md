# Kotlin language patterns

Use this reference when a local Kotlin choice needs a concrete pattern. These examples
use the standard library and are independent unless explicitly grouped. They complement
[language decisions](language-decisions.md), which owns nullability contracts, sealed
outcomes, collection aliasing and the corrected aggregate/sorting examples.

## Null handling, scope and expression control flow

Prefer the shape that makes the branch obvious. A safe call propagates absence; elvis
provides a fallback or an early exit. A local guard often reads better than a nested chain.
`?.let` and `?.run` both guard null: choose `it` versus `this` based on the body, not a rule
that only one spelling is correct. Take a local snapshot when a mutable property cannot
be smart-cast safely. Do not turn a required value into a silent default to eliminate `!!`.

```kotlin
data class Contact(val email: String?)

fun recipient(contact: Contact?): String =
    contact?.email?.trim()?.takeIf { it.isNotEmpty() } ?: "No email"

fun sendIfPresent(contact: Contact?, send: (String) -> Unit): Boolean {
    val email = contact?.email?.trim()?.takeIf { it.isNotEmpty() } ?: return false
    send(email)
    return true
}
```

An `if` or `when` expression returns a value without a temporary mutable variable.
A subjectless `when` checks guards in order; put more specific conditions first.
Use exhaustive `when` on a sealed type when every case must be handled. Do not add an
`else` that silently absorbs new cases merely to avoid a compiler error.

`run` can confine temporary names and return the final expression. It does not close a
resource; use the resource's lifecycle API (`use` for supported closeables). Name receivers
when nested scope functions obscure which object is being read or changed.

`runCatching` expresses failure as `Result`: `getOrElse` chooses a fallback, `getOrNull`
discards the cause, `onFailure` observes but does not recover, and `getOrThrow` propagates.
Use narrow `try/catch` for typed recovery or `finally`. Coroutine cancellation rules are
in [coroutine decisions](coroutine-decisions.md), not an exception to be silently swallowed.

Sources: [Null safety](https://kotlinlang.org/docs/null-safety.html),
[control flow](https://kotlinlang.org/docs/control-flow.html),
[scope functions](https://kotlinlang.org/docs/scope-functions.html).

## Classes, objects and construction

| Need | Choice and boundary |
| --- | --- |
| Value with structural equality/copy | `data class`; only primary-constructor properties participate in generated members; `copy` is shallow |
| Fixed named constants, possibly with fixed properties | `enum class`; choose a sealed hierarchy for distinct per-instance payload shapes |
| Shared constructor state or implementation | Class, optionally sealed for a closed hierarchy |
| Stateless singleton or deliberately single owned service | `object`; mutable singleton state still needs ownership and concurrency policy |
| Factory/constants associated with a class | `companion object`; add JVM annotations only for real Java consumers |
| Simple independent helper | Top-level function, or an extension when the receiver is meaningful |
| Immutable configuration with optional values | Primary constructor and named/default arguments; a builder remains useful for a genuinely staged or nested contract |

A generated data-class implementation is not automatically correct for an entity with
identity-based equality, mutable identity fields or a custom domain equality contract.
A named factory can validate, cache, select an implementation or hide construction; do not
replace it with a public constructor plus redundant companion `invoke` for cosmetic reasons.

```kotlin
data class Endpoint(val host: String, val port: Int = 443) {
    init {
        require(host.isNotBlank()) { "host must not be blank" }
        require(port in 1..65535) { "port must be in 1..65535" }
    }

    companion object {
        fun local(port: Int = 8080): Endpoint = Endpoint("localhost", port)
    }
}
```

Initialization blocks and property initializers run in declaration order. Avoid calling
open members during base construction: overriding state may not yet be initialized.
A cheap derived getter stays in sync with its inputs; a stored `val` computed once is also
correct when the inputs cannot change. Memoize an expensive calculation only with a clear
invalidation/lifetime contract; a getter recomputes whenever read.

Sources: [Classes and initialization](https://kotlinlang.org/docs/classes.html),
[data classes](https://kotlinlang.org/docs/data-classes.html),
[objects](https://kotlinlang.org/docs/object-declarations.html).

## Property initialization and access

| Form | Use and important constraint |
| --- | --- |
| Constructor/property initializer | Required dependency or value available at construction; prefer this when possible |
| `val derived get() = ...` | Cheap current fact computed on access; no stored derived copy |
| `var value ... private set` | Public read with owner-controlled writes |
| `val value by lazy { ... }` | Deferred initialization cached after success; not a reactive cache or mutable field |
| `lateinit var value: T` | Non-null, non-primitive mutable property initialized later; access before initialization throws |
| Nullable property | Absence or explicit clearing is part of its lifecycle, including a Fragment view binding |
| `const val` | Compile-time primitive/String constant at top level or in an object/companion, without a custom getter |

Default `lazy` initialization is synchronized on the JVM. `PUBLICATION` may run the
initializer more than once concurrently; avoid side effects that assume one execution.
`NONE` supplies no thread-safety guarantee. A synchronized lazy does not make the resulting
object's later mutations thread-safe. A failing initializer is retried on subsequent access.

`lateinit` does not express resource disposal or reset-to-absent behavior. An Android
Fragment view binding must be cleared when the view is destroyed; merely replacing a
nullable binding with `lateinit` can extend the view's lifetime accidentally.
A `const val` is inlined into consumers, so changing a published constant may require
consumer recompilation. An ordinary `val` is not automatically a compile-time constant.

```kotlin
class DisplayName(first: String, last: String) {
    var first: String = first
        private set
    var last: String = last
        private set

    val fullName: String get() = "$first $last".trim()

    fun rename(first: String, last: String) {
        this.first = first
        this.last = last
    }
}
```

Sources: [Properties](https://kotlinlang.org/docs/properties.html),
[lazy delegates](https://kotlinlang.org/docs/delegated-properties.html#lazy-properties).

## Choose collection operations by the result contract

A loop is valid when it expresses control flow or avoids unnecessary work. For ordinary
transformations, the operation name can make the intent and result type easier to see.
Read-only results are not a blanket guarantee of deeply immutable data.

| Intent | Operation | Boundary to check |
| --- | --- | --- |
| Keep elements / transform elements | `filter` / `map` | Eager collection operations materialize results |
| Transform and omit absent results | `mapNotNull` | Null is intentionally discarded, not silently treated as valid data |
| Narrow a collection of nullable elements | `filterNotNull` | `filter { it != null }` does not itself narrow the generic result type |
| One-to-many projection | `flatMap` | `flatten` removes one level from already nested collections |
| Group all values by key | `groupBy` | Result retains a list per key; for counts/aggregation, inspect `groupingBy` |
| Build one value per key | `associateBy` | Repeated keys keep the last value; detect duplicates if that is invalid |
| Split both matching and remaining elements | `partition` | Both lists are produced; a single `filter` suffices when only one side is needed |
| Keep first occurrence per key | `distinctBy` | Equality/key choice defines which data is lost |
| Fixed-size batches | `chunked(size)` | Size must be positive; the last batch may be smaller |
| Sum/count/extreme | `sumOf`, `count`, `maxOfOrNull` | Handle empty input and numeric overflow deliberately |
| Conditional imperative construction | `buildList` / `buildMap` / `buildSet` | Keep the mutable builder inside its block; do not retain or publish it |

```kotlin
data class Member(val id: Int, val team: String, val email: String?)

fun contactLines(members: List<Member>): List<String> = buildList {
    for (member in members) {
        val email = member.email ?: continue
        add("${member.id}: $email")
    }
}

fun teams(members: List<Member>): Map<String, List<Member>> = members.groupBy { it.team }

fun emails(members: List<Member>): List<String> = members.mapNotNull { it.email }
```

Sequences defer work until a terminal operation and can avoid intermediate collections.
A `filter`/`map`/`take(n)` pipeline can stop early, but operations such as `sorted` still
need all input. Sequence overhead may outweigh savings on a small pipeline. Do not convert
ordinary list transforms into Flow without an asynchronous stream requirement.

```kotlin
fun firstNonBlank(lines: List<String>, limit: Int): List<String> {
    require(limit >= 0)
    return lines.asSequence().map { it.trim() }.filter { it.isNotEmpty() }.take(limit).toList()
}
```

Sources: [Collection transformations](https://kotlinlang.org/docs/collection-transformations.html),
[grouping](https://kotlinlang.org/docs/collection-grouping.html),
[sequences](https://kotlinlang.org/docs/sequences.html),
[collection builders](https://kotlinlang.org/api/core/kotlin-stdlib/kotlin.collections/build-list.html).

## Iteration, destructuring, ranges and strings

Use `for` when `break`/`continue` expresses the behavior; `return@forEach` returns from that
lambda invocation, not the enclosing iteration. `repeat(n)` provides indices `0` through
`n - 1`, so replacing `1..n` with `repeat(n)` requires checking any use of the index.
Use `withIndex`/`forEachIndexed` when both value and index matter; use `indices` when the
index itself is the subject. Do not claim a particular loop spelling is always faster.

`..` includes the end; `until` excludes it; `downTo` and a positive `step` define a
progression. `coerceIn(min, max)` requires `min <= max`: an empty page set needs an empty
result, not `coerceIn(0, -1)`.

```kotlin
fun selectedPage(requested: Int, totalPages: Int): Int? {
    require(totalPages >= 0)
    return if (totalPages == 0) null else requested.coerceIn(0, totalPages - 1)
}
```

Destructuring calls `componentN` in order; data classes derive that order from their primary
constructor. Use names for domain fields when reordering components would be fragile. `_`
skips an unwanted component. Hand-written `componentN` is valid when that positional API is
intentional; it is not automatically an antipattern.

String templates keep interpolated values readable. `joinToString` handles separators,
prefix/suffix and transformation, including empty input without trimming a nonexistent
last delimiter. `buildString` suits conditional multi-part text; it is a scoped StringBuilder.

Sources: [Returns and jumps](https://kotlinlang.org/docs/returns.html),
[ranges](https://kotlinlang.org/docs/ranges.html),
[destructuring](https://kotlinlang.org/docs/destructuring-declarations.html),
[strings](https://kotlinlang.org/docs/strings.html).
