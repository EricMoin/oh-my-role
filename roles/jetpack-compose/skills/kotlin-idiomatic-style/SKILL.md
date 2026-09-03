---
name: kotlin-idiomatic-style
description: Idiomatic Kotlin language reference — ❌/✅ comparative examples for null safety, scope functions, data/sealed classes, objects/companion, control flow, collections/sequences, extension functions, generics, destructuring, coroutines/Flow idioms, naming conventions, Java-style anti-patterns, and DSL design. Use when writing or reviewing plain-Kotlin code (ViewModel, repository, data layer, domain types, non-composable functions, tests) where Kotlin language quality matters more than Compose. Do NOT load for @Composable-specific patterns (defer to compose-idiomatic-style) or single-line edits.
---
# Kotlin Idiomatic Style

Quick-reference for idiomatic Kotlin. Each entry shows the naive / Java-style / Compose-aware-but-Kotlin-poor approach (❌) vs the idiomatic approach (✅) with a one-line rationale. This is the Kotlin-LANGUAGE companion to `compose-idiomatic-style`: everything here is about what the Kotlin compiler and the language's idioms care about, independent of Compose. Follow the official [Kotlin coding conventions](https://kotlinlang.org/docs/coding-conventions.html) and ktlint; for coroutine idioms reference the official [kotlinx.coroutines docs](https://kotlin.github.io/kotlinx.coroutines/).

**When NOT to load this skill:**
- Single-line edits or trivial changes — the cost of loading reference content outweighs the benefit.
- Compose `@Composable` patterns — route to `compose-idiomatic-style`.
- Compose state / recomposition / side effects — route to `compose-runtime-state`.
- Compose UI layout, constraints, or adaptive sizing — route to `compose-layout-material-adaptive`.
- Compose architecture / ViewModel wiring / navigation — route to `compose-ui-architecture`.

## Quick Routing — Symptom to Skill

When a symptom points to a different concern, route to the skill that owns it instead of forcing the fix here.

| Symptom / Signal | Load this skill |
| --- | --- |
| nullable handling, elvis, or `!!` choices | `kotlin-idiomatic-style` (this skill) |
| choosing `let` / `run` / `apply` / `also` / `with` | `kotlin-idiomatic-style` |
| data vs sealed class vs enum choice, object vs companion | `kotlin-idiomatic-style` |
| `when` exhaustiveness, guard clauses, `runCatching` | `kotlin-idiomatic-style` |
| a `@Composable` is too big or skips recomposition unexpectedly | `compose-idiomatic-style` |
| state resets on rotation / process death | `compose-runtime-state` |
| recomposition storms or unstable lambdas | `compose-runtime-state` |
| list jank or lazy layout tuning | `compose-layout-material-adaptive` |
| text overflow at large font scale / constraint errors | `compose-layout-material-adaptive` |
| preview missing or broken | `compose-testing-previews` |
| screen architecture or state ownership unclear | `compose-ui-architecture` |

Subsequent parts extend the Kotlin rows; this header keeps the file self-consistent so a plain-Kotlin fix never lands in a Compose skill by mistake.

## Null Safety

### Safe call + elvis over Java-style null drill

```kotlin
// ❌ Java-style: a nullable temp, a manual null check, a branch
val city: String? = user?.address?.city
val label: String
if (city != null) {
    label = city
} else {
    label = "Unknown"
}

// ✅ Chained safe calls + elvis collapse the whole thing
val label: String = user?.address?.city ?: "Unknown"
```

A single `?.` chain propagates null through the whole path and `?:` supplies the fallback, so the null decision is one declarative expression instead of a branch.

### `?.let` for a null-aware block, not a nested `if`

```kotlin
// ❌ Repeat the subject and bury the body in an if
val id = item?.id
if (id != null) {
    load(id)
    track(id)
}

// ✅ `?.let` binds a non-null smart-cast value for the whole block
item?.id?.let { id ->
    load(id)
    track(id)
}
```

`?.let` gives you a non-null `it` inside the block, turns "if it exists, do X and Y" into one unit, and the smart cast survives across multiple calls.

### Avoid `!!` — prefer `?: return` / `?: throw` / requireNotNull

```kotlin
// ❌ Force-unwrap — a single null turns into a crash with no message
fun load(user: User?) {
    val real = user!!          // NPE if null
    fetch(real.name)
}

// ✅ Early return — recoverable null exits cleanly
fun load(user: User?) {
    val real = user ?: return
    fetch(real.name)
}

// ✅ Or fail explicitly at the point of the null
fun name(user: User?): String =
    user?.name ?: throw IllegalStateException("user is required")
```

`!!` converts a recoverable null into a stack trace; elvis lets you exit or throw at the exact spot with an explicit intent.

### Platform types from Java — treat them as nullable at the boundary

```kotlin
// ❌ A Java `User!` return is treated as a non-null Kotlin type
fun handle(user: User) {          // compiles, but Java may hand you null
    print(user.name)              // NPE at runtime
}

// ✅ Declare the parameter nullable and guard it
fun handle(user: User?) = user?.name ?: "Guest"
```

Platform types hide nullability, so the compiler cannot protect you; be explicit and treat Java-returned values as nullable at the boundary.

### requireNotNull / checkNotNull — meaningful preconditions over `!!`

```kotlin
// ❌ `!!` for a value that is actually a precondition
fun parseInt(id: String?): Int = Integer.parseInt(id!!)   // bare NPE

// ✅ requireNotNull — a caller-contract violation
fun parseInt(id: String?): Int
    = Integer.parseInt(requireNotNull(id) { "id must not be null" })

// ✅ checkNotNull — an internal invariant that must hold
fun Task.run(): Task {
    val data = checkNotNull(payload) { "payload not set; build() must be called" }
    return apply(data)
}
```

`require*` asserts a caller argument and `check*` asserts an internal invariant; both throw a typed `IllegalArgumentException`/`IllegalStateException` with a message instead of a bare NPE.

### `?.run` and `?.let` chaining — pick the receiver that fits the body

```kotlin
// ❌ `let` used only to call members — every call needs `it.`
item?.let {
    it.begin()
    it.commit()
}

// ✅ `?.run` binds the receiver, so call the members bare
item?.run {
    begin()
    commit()
}

// ✅ Keep `let` when you want `it` (pass it on, or return a transformed value)
item?.let { log(it.id) }
```

`?.run` sets `this` so you call members without a prefix; `?.let` sets `it`, which is the right pick for passing a value on or returning a transformed result.

### Null means absent — don't copy the Java "checked null" drill

```kotlin
// ❌ Java-style: checked-null local, then branch
var result: Something? = compute()
if (result == null) {
    return
}
println(result.value)            // smart cast saves you, but the shape is Java

// ✅ Express the guarantee in the type — nullable + elvis/?., compiler checks the branches
val result = compute() ?: return
println(result.value)

// ❌ Returning null everywhere and forcing every caller to guard
fun find(id: String): User? = dao.find(id)      // each call site re-checks null

// ✅ Model "no result" as a value when null is really an outcome, not an error
sealed interface FindResult {
    data class Found(val user: User) : FindResult
    data object NotFound : FindResult
}
```

When null means "absent/optional" use nullable types and `?.`/`?:`; when absence is a distinct outcome, model it as a sealed result so callers handle all cases exhaustively rather than re-checking null.

## Scope Functions

### Selection table — what each one returns and how it reads

| Function | Receiver | Returns | Use when |
| --- | --- | --- | --- |
| `let` | `it` | lambda result | transform a value, run a block on a non-null value via `?.`, pass `it` on |
| `run` | `this` | lambda result | call several members of a receiver and produce a result |
| `with` | `this` | lambda result | call members of a (non-null) receiver without repeating its name |
| `apply` | `this` | the receiver | configure an object and keep returning that object (builder-style) |
| `also` | `it` | the receiver | perform a side effect / logging / tap and keep the object unchanged |

### Misuse: nesting scope functions

```kotlin
// ❌ Scope functions nested so deep the receiver is unreadable
phone.apply { name?.let { cart?.run { add(it) } } }

// ✅ Name the steps; a nested `let` is fine, stack of three is not
val resolved = name ?: return
cart?.add(resolved)
```

One scope-function nest is a smell; extract a named local or collapse the chain so the receiver is never more than one level away.

### Misuse: `apply` where `also` is meant (and vice versa)

```kotlin
// ❌ `also` used to configure — but `also` returns the receiver unchanged and gives `it`
val result = repo.build().also { it.name = "main" }     // wrong intent

// ✅ `apply` configures the receiver and still returns it
val result = repo.build().apply { name = "main" }

// ✅ `also` for a side effect — it does not change the object
val result = repo.build().also { log("built ${it.id}") }
```

`apply` is for mutating and returning the same object (uses `this`); `also` is for observing/one-off side effects and returns the object as-is (uses `it`).

### Misuse: `let` for a pure side effect

```kotlin
// ❌ `let` for a side effect — `it` is ignored, reads as an accident
user?.let { log(it.id) }                         // fine only when you use `it`

// ❌ `let` returning Unit from a string of side effects
user?.let { it.markSeen(); it.save(); }          // `it` used but the value is discarded

// ✅ Use a plain block for a side effect; keep `run` for receiver scope
user?.let { log(it.id) }
user?.run { markSeen(); save() }
```

Use `let` when you actually consume `it` (transform or pass on); for a bare side effect prefer `?.run` (receiver scope) or an explicit statement so the discarded value does not read as a mistake.

### Misuse: `run` on a nullable receiver where `?.let` is clearer

```kotlin
// ❌ `run` on a nullable receiver hides the null branch
job?.run { startTask() }                       // works, but "let" signals the null guard

// ✅ `?.let` (with `it`) reads as "if not null, do this with it"
job?.let { startTask(it) }
```

When the intent is "if the value exists, do something with it", `?.let` reads more naturally than `?.run`; reserve `?.run` for binding the receiver as `this`.

### Scoping a temporary so it does not leak

```kotlin
// ❌ An intermediate object floats for the whole function, reusable by accident
val temp = TempStorage()
temp.write("a")
temp.flush()
process(temp.read())
// ... later, temp is still in scope

// ✅ Confine the intermediate to the block that needs it
val output = TempStorage().run {
    write("a")
    flush()
    read()
}
process(output)
```

Scoping a temporary to the `run`/`with` block that consumes it removes the dangling name and the risk of reusing stale state later.

## Classes & Objects

### data class over hand-written equals/hashCode/toString

```kotlin
// ❌ Hand-written equals/hashCode/toString — boilerplate that drifts
class Point(val x: Int, val y: Int) {
    override fun equals(other: Any?): Boolean =
        other is Point && other.x == x && other.y == y
    override fun hashCode(): Int = 31 * x + y
    override fun toString(): String = "Point(x=$x, y=$y)"
}

// ✅ data class generates equals/hashCode/toString/copy/componentN
data class Point(val x: Int, val y: Int)
```

A `data class` generates the value semantics (equals/hashCode/toString/copy/componentN) so you never hand-write them and they cannot drift from the fields.

### sealed class vs sealed interface

```kotlin
// ❌ sealed class blocks a subtype from also extending another class
sealed class Result
class Success(val value: String) : Result()
// If Success also needs to extend BaseDto, single inheritance forbids it.

// ✅ sealed interface — subtypes implement the contract and may extend other things
sealed interface Result
class Success(val value: String) : Result(), BaseDto()
```

Use a `sealed interface` when subtypes may need multiple supertypes (or the hierarchy is purely a contract); use a `sealed class` only when subtypes share constructor state that the base must own.

### enum vs sealed for a closed set

```kotlin
// ❌ enum forced to carry per-case data through awkward nullable fields
enum class Status(val items: List<Item>? = null, val error: String? = null) {
    LOADING,
    SUCCESS(listOf()),
    ERROR("boom"),
}

// ✅ sealed — each case is its own type with its own payload
sealed interface Status
data object Loading : Status
data class Success(val items: List<Item>) : Status
data class Error(val message: String) : Status
```

`enum` is for a fixed set of constants with no per-instance data; `sealed` is for a closed set of types whose cases each carry their own payload and are exhaustively matched with smart casts.

### object singleton over a Java static-holder class

```kotlin
// ❌ Java-style: a class with a hidden constructor + static methods
class Network {
    private Network() {}
    companion object {
        private val client = OkHttpClient()
        @JvmStatic fun get(): OkHttpClient = client
    }
}

// ✅ object is a true singleton with a body and instance members
object Network {
    val client: OkHttpClient by lazy { OkHttpClient() }
}
```

`object` declares a singleton with real instance members and no plumbing; a Java "static utility/holder class" is written as an `object` in Kotlin.

### companion object vs Java static members — and `const val`

```kotlin
// ❌ companion for everything, plain `val` for a literal
class Config {
    companion object {
        val appName = "MyApp"                 // runtime field, not inlined
        fun create(): Config = Config()
    }
}

// ✅ `const val` for compile-time literals; companion for static-like members
class Config {
    companion object {
        const val APP_NAME = "MyApp"          // inlined at every call site
        fun create(): Config = Config()
    }
}

// ✅ `const val` also lives at top level (primitive/String only)
const val DEFAULT_LOCALE = "en"
```

`const val` is a real compile-time constant inlined everywhere; a plain `companion val` is a runtime field. Put static-like factories/lazy in `companion`, and compile-time constants in `const val`.

### top-level functions/constants over "Utils" classes

```kotlin
// ❌ A fake "Utils" namespace of static helpers
object StringUtils {
    fun capitalize(s: String): String = s.replaceFirstChar { it.uppercase() }
}

// ✅ Top-level functions — no artificial container
fun capitalize(s: String): String = s.replaceFirstChar { it.uppercase() }

// ✅ Extension functions when there is a natural receiver
fun String.capitalized(): String = replaceFirstChar { it.uppercase() }
```

Kotlin has no need for static util classes; top-level functions, and extension functions when a natural receiver exists, read better and avoid a fake namespace.

### properties over getFoo()/setFoo() methods

```kotlin
// ❌ Java-style accessor methods
class Person {
    private var n = ""
    fun getName(): String = n
    fun setName(v: String) { n = v }
}

// ✅ property with visibility control
class Person {
    var name: String = ""
        private set
}

// ❌ Java-style method for a derived value
fun getFullName(): String = "$first $last"

// ✅ computed property
val fullName: String get() = "$first $last"
```

Kotlin properties replace `getX`/`setX`; use a `val` with a custom getter for a cheap derived value, and `var ... private set` for a field whose writes are encapsulated.

### lateinit vs lazy

```kotlin
// ❌ lateinit for a value that is a fixed computation, or lazy for a mutable field
private var repo: Repo? = null
    get() = field ?: Repo()                   // awkward memoized getter

// ✅ lazy — computed once, thread-safe, on first access
private val repo: Repo by lazy { Repo() }

// ❌ lazy for a value the framework sets after construction (cannot reassign)
private val binding by lazy { ... }

// ✅ lateinit — mutable, non-null, initialized after construction by a framework
lateinit var binding: ViewBinding
```

`lazy` is for a `val` computed once on first access; `lateinit` is for a mutable non-null `var` that a framework/DI initializes after construction.

### primary constructor + default args over telescoping constructors/builders

```kotlin
// ❌ A mutable builder-ish class configured after construction
class Config {
    var host = "localhost"
    var port = 8080
    var tls = true
}
val config = Config().apply {
    host = "example.com"
    port = 443
}

// ✅ Primary constructor + defaults — immutable, visible in the signature
data class Config(
    val host: String = "localhost",
    val port: Int = 8080,
    val tls: Boolean = true,
)
val config = Config(host = "example.com", port = 443)
```

Default arguments cover every constructor call-site without telescoping overloads or a builder, and `val` keeps the result immutable.

### `init` block vs field initializers — compute derived state, don't store it

```kotlin
// ❌ Field-initializer style: store a redundant derived copy
class Circle(val r: Double) {
    var area: Double
    init { area = Math.PI * r * r }          // stored, duplicated truth
}

// ✅ Use `init` for validation; express derived facts as a computed `val`
class Circle(val r: Double) {
    init { require(r > 0.0) { "radius must be positive" } }
    val area: Double get() = Math.PI * r * r
}
```

`init` blocks (which run in declaration order with property initializers) are for validation and setup; do not store a copy of a derived fact — a `val ... get()` (or `by lazy` for a costly one) keeps a single source of truth.

## Control Flow

### `when` as an exhaustive expression over sealed types with smart cast

```kotlin
// ❌ Manual is-checks + redundant casts (the Java way)
fun describe(result: Result): String {
    if (result is Success) {
        val s = result as Success            // redundant cast
        return "success: ${s.item}"
    }
    return "error"
}

// ✅ `when` over a sealed type — exhaustive, smart-cast, no cast needed
fun describe(result: Result): String = when (result) {
    is Success -> "success: ${result.item}"
    is Error -> "error: ${result.message}"
    is Loading -> "loading"
}
```

`when` over a sealed type is exhaustive (no `else` required) and smart-casts the subject to the branch type, so `as?`/`as` casts disappear.

### `when` with no subject for boolean/guard combos

```kotlin
// ❌ if/else chain for a multi-condition decision
fun statusText(v: Session): String {
    if (v.isActive && v.hasAdmin) return "admin"
    if (v.isActive) return "user"
    if (v.isGuest) return "guest"
    return "anonymous"
}

// ✅ `when` with no subject — ordered boolean guards
fun statusText(v: Session): String = when {
    v.isActive && v.hasAdmin -> "admin"
    v.isActive -> "user"
    v.isGuest -> "guest"
    else -> "anonymous"
}
```

`when` without a subject reads as a chain of ordered boolean guards and returns directly from the expression instead of stacked if/else.

### if-as-expression over the Java ternary emulation

```kotlin
// ❌ Java ternary translated with a mutable var + if statement
val result: String
if (condition) {
    result = "yes"
} else {
    result = "no"
}

// ✅ `if` is an expression — returns directly, no var, and replaces the missing `?:` ternary
val result = if (condition) "yes" else "no"
```

Kotlin has no ternary operator; use `if` as an expression (it yields a value) instead of declaring a mutable `var` and assigning it in branch statements.

### Guard clauses over deeply nested if/else

```kotlin
// ❌ Deep nesting (Arrow/Java-shaped)
fun describe(user: User?): String {
    if (user != null) {
        if (user.isActive) {
            return "active"
        } else {
            return "inactive"
        }
    } else {
        return "guest"
    }
}

// ✅ Guard clauses — return early, happy path reads straight down
fun describe(user: User?): String {
    if (user == null) return "guest"
    if (!user.isActive) return "inactive"
    return "active"
}
```

Each early return clears one precondition so the remaining code has no nesting and the success path reads top to bottom.

### `runCatching` vs try/catch — pick the accessor that matches intent

```kotlin
// ❌ try/catch for a value with a manual fallback
fun load(): Data {
    return try {
        api.get()
    } catch (e: Exception) {
        Data.empty()
    }
}

// ✅ runCatching returns a Result; choose the accessor for your intent
val result = runCatching { api.get() }
result.getOrElse { Data.empty() }   // value or fallback
result.getOrNull()                  // value or null (loses the error)
result.onFailure { log(it) }        // side effect on error
result.exceptionOrNull()            // inspect the cause, rethrow if needed
```

`runCatching` wraps a block in a `Result` so the failure is a value you handle with the right accessor; `try/catch` is for when you need explicit, specific exception handling (or a `finally`).

### `runCatching` pitfalls — never swallow CancellationException

```kotlin
// ❌ runCatching swallows CancellationException — a cancel becomes a "success"
runCatching { asyncWork() }.getOrNull()      // corrupts structured concurrency

// ✅ Let CancellationException propagate; catch only recoverable failures
suspend fun work() = try {
    asyncWork()
} catch (e: CancellationException) {
    throw e
} catch (e: IOException) {
    fallback()
}
```

`runCatching` catches every `Throwable`, including `CancellationException`; for coroutine work it must never absorb cancellation or a failure, so use `try/catch` (or `getOrElse { throw it }`) to keep the one you care about explicit. `Result` is also a value class — it is not rethrowable from a non-inline context and is erased as a generic, so prefer `try/catch` for suspend blocks.

### `for` / `forEach` / `repeat`

```kotlin
// ❌ forEach for a fixed count — allocates an iterator, reads wrong
(1..10).forEach { println(it) }

// ✅ repeat for a known count
repeat(10) { i -> println(i) }

// ❌ forEach where break/continue is needed — awkward non-local return
list.forEach { if (it == stop) return@forEach }

// ✅ `for` loop — idiomatic, supports break/continue
for (item in list) {
    if (item == stop) break
    println(item)
}

// ✅ Indexed iteration when you need the position
for ((index, item) in list.withIndex()) { ... }
```

`repeat(n)` is for a fixed count, `forEach` is for collection iteration without breaking, and `for` is the idiomatic loop whenever you need `break`/`continue` or an index — with `withIndex()` as the clean way to get both.

## Citing Sources on Idiom Claims

When this skill asserts an idiomatic contract or a version-sensitive behavior, back it with the official source: `[docs: URL — what was verified]`. For Kotlin language/convention behavior, cite the [Kotlin coding conventions](https://kotlinlang.org/docs/coding-conventions.html) or the relevant [Kotlin docs](https://kotlinlang.org/docs/home.html). For coroutine/Flow idioms, cite the [kotlinx.coroutines docs](https://kotlin.github.io/kotlinx.coroutines/). `Result`'s generic erasure and `const`/`const val` restrictions are defined in the language reference, not by convention.

When behavior is uncertain or version-sensitive, do not guess — route through `android-source-research` (for platform/framework source) or the `kotlin` documentation before writing the claim. NEVER assert Kotlin behavior from training data alone.

## Collections & Sequences

### Declarative pipelines over an imperative loop

```kotlin
// ❌ Build a result list with a loop, mutating a throwaway accumulator
val adults = mutableListOf<Person>()
for (p in people) {
    if (p.age >= 18) adults.add(p)
}

// ✅ One filter/map chain states the transformation, and the result is immutable
val adults = people.filter { it.age >= 18 }
val names = adults.map { it.name }
```

A `filter`/`map` pipeline reads as the intent and produces a read-only collection, instead of a `+=` loop that mutates a list just to hand back a copy.

### `sumOf` / `count` / `maxOf` / `average` over a manual accumulator

```kotlin
// ❌ Hand-rolled accumulator
var total = 0
for (p in people) { total += p.salary }

// ✅ The reduction is a named operation, no loop, no collision
val total = people.sumOf { it.salary }
val maxSalary = people.maxOf { it.salary }
val avgSalary = people.average { it.salary }   // average takes a selector: (T)->Double

// ❌ Counter variable for a predicate
var active = 0
for (p in people) { if (p.isActive) active++ }

// ✅ count(predicate) gives the count directly
val active = people.count { it.isActive }
```

`sumOf`/`maxOf`/`average`/`count` replace the accumulate-in-a-var pattern with a named reducer, and make the selector a lambda instead of an inline `if` inside a loop.

### `groupBy` / `associateBy` / `partition` / `distinctBy` / `chunked`

```kotlin
// ❌ Group into a nested map by hand
val byDept = mutableMapOf<String, MutableList<Employee>>()
for (e in employees) {
    byDept.getOrPut(e.dept) { mutableListOf() }.add(e)
}

// ✅ groupBy builds Map<Key, List<T>> in one pass
val byDept = employees.groupBy { it.dept }

// ❌ Build an id -> object lookup map
val byId = mutableMapOf<String, Employee>()
for (e in employees) byId[e.id] = e

// ✅ associateBy — keyed lookup with no loop
val byId = employees.associateBy { it.id }

// ✅ partition splits into a destructured pair of lists
val (active, inactive) = employees.partition { it.isActive }

// ✅ distinctBy collapses duplicates by a key
val uniqueUsers = users.distinctBy { it.email }

// ✅ chunked batches a list into fixed-size groups
val pages = longList.chunked(50)   // List<List<T>>, last one may be smaller
```

`groupBy`/`associateBy` build keyed collections declaratively, `partition` returns both halves at once in a destructured pair, `distinctBy` dedupes by a key, and `chunked` batches — replacing the common "group, index, split, dedupe, page" loops.

### `flatten` / `flatMap` over a nested loop

```kotlin
// ❌ Nested loop collecting into a mutable list
val all = mutableListOf<Item>()
for (group in groups) for (item in group.items) all.add(item)

// ✅ flatten collapses a List<List<T>>; flatMap maps then flattens
val all = groups.map { it.items }.flatten()
val all = groups.flatMap { it.items }
```

`flatten` removes one level of nesting, and `flatMap` maps and flattens in a single call, so a nested `for` and a collector list disappear.

### `asSequence()` — lazy pipelines, and when they are worth it

```kotlin
// ❌ Eager pipeline: every step materializes a full intermediate list
val names = logs
    .filter { it.severity >= WARN }
    .map { it.message }
    .take(10)

// ✅ Sequence: each element flows through all steps before the next is pulled
val names = logs.asSequence()
    .filter { it.severity >= WARN }
    .map { it.message }
    .take(10)
    .toList()
```

A `Sequence` is lazy — each element passes through every intermediate operator before the next one is produced — so `filter`+`map`+`take(n)`/`find` stops pulling once the terminal `n` survives. It pays off on large collections or short-circuiting terminals; for a small list an eager pipeline is simpler and faster (a Sequence adds wrapper overhead).

### `buildList` / `buildMap` / `buildSet` for construction

```kotlin
// ❌ Mutable list returned as-is, or a builder that leaks mutability
val result = mutableListOf<Int>()
for (i in 0 until n) if (i % 2 == 0) result.add(i)
return result                  // caller can mutate the returned list

// ✅ buildList builds in a builder, returns a read-only List
return buildList {
    for (i in 0 until n) if (i % 2 == 0) add(i)
}

// ✅ buildMap / buildSet for the same construction needs
return buildMap { put("a", 1) }
return buildSet { add("x"); add("y") }
```

`buildList`/`buildMap`/`buildSet` give a builder `this` for genuinely imperative/conditional construction, but the returned `List`/`Map`/`Set` is read-only, so mutability stays internal.

### Expose read-only interfaces, keep the mutable version private

```kotlin
// ❌ Expose a MutableList — every caller can add/remove behind your back
class Team {
    var members: MutableList<Member> = mutableListOf()
}

// ✅ Read-only List in the API, private MutableList backs it
class Team {
    private val _members = mutableListOf<Member>()
    val members: List<Member> get() = _members
}
```

Prefer the read-only `List`/`Map`/`Set` in public signatures; the `MutableList`/`MutableMap`/`MutableSet` (or a `MutableStateFlow`) stays private, so encapsulation is enforced by the type system.

### `forEachIndexed` / `withIndex` over a Java index loop

```kotlin
// ❌ Size-based index loop with a [i] lookup
for (i in 0 until list.size) {
    println("$i: ${list[i]}")
}

// ✅ withIndex destructures index + element
for ((index, item) in list.withIndex()) {
    println("$index: $item")
}

// ✅ forEachIndexed when you don't need break/continue
list.forEachIndexed { index, item -> println("$index: $item") }
```

`withIndex()` (or `forEachIndexed`) yields the position and the element together, without a size bound or a manual `[i]`.

### `mapNotNull` / `filterNotNull` to drop nulls in one step

```kotlin
// ❌ Filter then narrow, or filterNotNull keeps the structure
val urls = items.map { it.url }.filterNotNull()

// ✅ mapNotNull maps and removes nulls in one pass
val urls = items.mapNotNull { it.url }

// ❌ filter { it != null } keeps the element type nullable
val names = list.filter { it != null }          // stays List<String?>

// ✅ filterNotNull both removes the nulls and narrows to List<String>
val names = list.filterNotNull()                // List<String>
```

`mapNotNull` applies the transform and drops null results in one step; `filterNotNull` removes nulls and narrows the element type, so you never keep a nullable `List<T?>` around.

## Functions & Extensions

### Extension functions/properties over a "Utils" object

```kotlin
// ❌ A fake namespace that operates on a receiver type
object DateUtils {
    fun short(d: LocalDate): String = d.format(DateTimeFormatter.ISO_LOCAL_DATE)
}

// ✅ Extension function — the call site reads receiver.method()
fun LocalDate.short(): String = format(DateTimeFormatter.ISO_LOCAL_DATE)

// ✅ Extension property for a derived, no-arg fact
val LocalDate.slug: String get() = toString()
```

An extension takes `this` as the receiver and reads like a member, so you never invent an `XxxUtils` object just to add behavior to a type you don't own.

### `infix` only when it reads like a sentence

```kotlin
// ❌ Infix for an arbitrary operation — the call reads as an accident
infix fun Int.adjoined(other: Int): String = toString() + other   // 1 adjoined 2

// ✅ Infix for an asymmetric, verb-like operation
infix fun <T> List<T>.plusSorted(other: List<T>): List<T> = (this + other).sorted()
// list1 plusSorted list2  — reads as an English sentence

// ❌ A plain operator (or a normal call) reads better than infix here
infix fun String.concat(s: String): String = this + s   // "a" concat "b" < "a" + "b"
```

`infix` is for a one-parameter, method-like operation that reads as a natural sentence; if a normal call or the built-in operator is clearer, don't force it.

### Operator overloading with restraint

```kotlin
// ❌ Overloading for a meaning no reader will guess
data class Money(val cents: Long) {
    operator fun times(other: Money): Money = ???     // "money * money" is meaningless
}

// ✅ Overload only the operator whose meaning is the obvious, natural reading
data class Money(val cents: Long) {
    operator fun plus(other: Money): Money = Money(cents + other.cents)
    operator fun compareTo(other: Money): Int = cents.compareTo(other.cents)
    operator fun minus(other: Money): Money = Money(cents - other.cents)
}

// ✅ get / contains / in map cleanly onto the language
operator fun <T> List<T>.contains(t: T): Boolean = any { it == t }
operator fun <T> List<T>.get(range: IntRange): List<T> = subList(range.first, range.last + 1)
```

Overload `plus`/`minus`/`times`/`get`/`contains`/`compareTo` only when the operator is the obvious reading; an overload whose meaning a reader must decode — or that returns a surprising type — is a trap, not a convenience.

### Function type + trailing lambda over a one-method listener interface

```kotlin
// ❌ Force a SAM/listener interface and an anonymous object on the caller
interface ResultListener { fun onResult(r: Result) }
fun run(task: Task, listener: ResultListener) { ... }
run(task, object : ResultListener { override fun onResult(r: Result) { handle(r) } })

// ✅ A function type with trailing-lambda syntax reads cleanly
fun run(task: Task, onResult: (Result) -> Unit) { ... }
run(task) { result -> handle(result) }
```

For a single callback, a function type (`(T) -> Unit`) with trailing-lambda syntax beats a listener interface; reach for `fun interface` only when you want a named SAM.

### Single-expression (expression-body) functions

```kotlin
// ❌ Block body for a one-line computation
fun fullName(p: Person): String {
    return "${p.first} ${p.last}"
}

// ✅ Expression body — braces and return are gone, the type is stated at the boundary
fun fullName(p: Person): String = "${p.first} ${p.last}"
```

When the body is a single expression, use the `=` form; it drops the block and the `return`, and gives you the spot to declare the return type explicitly on a public function.

### Named arguments + default args over boolean traps / positional magic

```kotlin
// ❌ Positional booleans — the call site is unreadable
fun submit(order: Order, notify: Boolean, refund: Boolean) { ... }
submit(order, true, false)

// ✅ Named args + defaults — intent is explicit, callers override only what matters
fun submit(order: Order, notify: Boolean = false, refund: Boolean = false) { ... }
submit(order, notify = true)
```

Named arguments make a multi-parameter call self-documenting, and a default value removes the "which boolean was that?" trap and the need for overloads.

### Local functions for reuse inside a function

```kotlin
// ❌ Inline the same computation repeatedly, or leak a one-use top-level helper
fun process(raw: String): String {
    return clean(raw) + clean(raw.uppercase())   // clean lives at top level
}

// ✅ A local function scoped to the one call site that uses it
fun process(raw: String): String {
    fun normalize(s: String) = s.trim().lowercase()
    return normalize(raw) + normalize(raw.uppercase())
}
```

A local `fun` is captured by the enclosing function, keeps the helper private to where it is used, and avoids polluting the file with a single-use top-level helper.

### `fun interface` / SAM conversion for a named single-abstract-method contract

```kotlin
// ❌ Forcing of an anonymous object at every call site
class CatExecutor : Executor { override fun execute(r: Runnable) { ... } }

// ✅ fun interface — a lambda satisfies the SAM automatically
fun interface Awaiter { fun await(): Boolean }
val ready = Awaiter { checkReady() }
```

`fun interface` declares a single abstract method that a lambda can implement directly (SAM conversion), giving you a named contract with lambda ergonomics instead of repeated anonymous objects.

## Types & Generics

### Type inference — prefer it at boundaries, not everywhere

```kotlin
// ❌ Redundant type annotations on every local
val count: Int = items.size
val name: String = user.name
val map: Map<String, Int> = buildMap { put("a", 1) }

// ✅ Let inference work for locals; annotate at the public boundary
val count = items.size
fun parse(s: String): String = s.trim()   // return type explicit where it matters
```

The compiler infers local/property types; write the type explicitly at public API boundaries (return types, complex generics, where it changes overload resolution). Over-annotating is noise.

### `typealias` to name a complex type

```kotlin
// ❌ Repeat a long generic shape in every signature
fun load(): Result<List<Pair<String, Map<String, Account>>>>
fun index(): List<Pair<String, Map<String, Account>>>

// ✅ One alias names the shape for every signature
typealias AccountIndex = List<Pair<String, Map<String, Account>>>
fun load(): Result<AccountIndex>
fun index(): AccountIndex
```

`typealias` does not create a new type — it names an existing one — so it is ideal for long generic shapes, callback signatures, and FP-style function types that would otherwise be repeated verbatim.

### Generics variance: `out` (producer), `in` (consumer), invariant, `*` projection

```kotlin
// ❌ Invariant Box is unnecessarily restrictive
class Box<T>(val value: T)
fun feed(box: Box<Animal>) { ... }
feed(Box(Cat()))   // error: Box<Cat> is not a Box<Animal>

// ✅ `out` — a producer: a more specific type is substitutable
class Box<out T>(val value: T)
fun feed(box: Box<Animal>) { ... }
feed(Box(Cat()))   // OK

// ✅ `in` — a consumer: a less specific type may be fed where specific is expected
interface Sink<in T> { fun send(x: T) }

// ✅ Invariant when T appears in both positions (no in/out)
class Slot<T>(val get: () -> T, val set: (T) -> Unit)

// ✅ `*` projection — the type argument is irrelevant to the operation
fun sizeOf(any: List<*>): Int = any.size
```

`out` declares a producer (covariant), `in` declares a consumer (contravariant), no annotation means invariant (the default), and `*` is a projection for "some unknown type" when you only need to treat the container generically.

### `reified` + `inline` — and why reified requires inline

```kotlin
// ❌ Recover a generic type at runtime with clunky reflective casts
fun <T : Any> typeName(value: Any): String =
    if (value is String) "String" else if (value is Int) "Int" else value::class.simpleName ?: "?"

// ✅ reified — T is the real type at runtime, no cast needed
inline fun <reified T> typeName(): String = T::class.simpleName ?: "?"

// ✅ Reified lets filterIsInstance work against a real class
inline fun <reified T> List<Any>.ofType(): List<T> = filterIsInstance<T>()
val strings = misc.ofType<String>()
```

`reified` makes the generic type real at runtime — and because that requires the compiler to inline the body at the call site, a `reified` type parameter forces the function to be `inline`. You cannot reify a type passed through a non-inline boundary.

### Value classes for domain types — without the wrapper ceremony

```kotlin
// ❌ Bare primitives — an id and a count are interchangeable by accident
fun fetch(id: Long, limit: Long) { ... }
fetch(userId, pageSize)   // both Long, swapped silently and compiles

// ❌ A wrapper class with hand-written equals/hashCode/toString
class UserId(val value: Long) { /* equals/hashCode/toString boilerplate */ }

// ✅ @JvmInline value class — a real distinct type, inlined, no allocation
@JvmInline
value class UserId(val value: Long)

@JvmInline
value class Percent(val value: Int) {
    init { require(value in 0..100) }
}

fun fetch(id: UserId, limit: Int) { ... }   // UserId and Long can never be confused
```

A `@JvmInline value class` wraps a single value in a real, distinct type that the JVM inlines (no object allocation for the wrapper), so `UserId` and `Long` are no longer interchangeable and the type carries its own invariants in an `init`.

### `contract` for smart-cast helpers — with the caveat

```kotlin
// ❌ A helper that hides a null check defeats smart-cast
fun <T> T?.valid(): T? = this?.takeIf { it.isActive }
if (name.valid() != null) {
    name.valid().length   // still nullable — no smart cast
}

// ✅ contract tells the compiler the truth (opt-in, experimental/evolving API)
import kotlin.contracts.ExperimentalContracts

@OptIn(ExperimentalContracts::class)
fun <T> T?.isNotNull(): Boolean {
    contract { returns(true) implies (this@isNotNull != null) }
    return this != null
}

if (value.isNotNull()) {
    value.length   // smart-cast to non-null thanks to the contract
}
```

`contract` is a compiler hint that lets a helper function carry smart-cast information, but the `@Contracts` API is marked experimental/evolving — use it only where a `require`/`check` literal cannot express the invariant, and keep the contract body trivially in line with what it asserts. For argument and state validation, prefer a plain `require`/`check` (see Destructuring & Misc below).

## Destructuring & Misc

### Destructuring declarations over separate accessors

```kotlin
// ❌ Read fields one at a time
val name = entry.name
val credits = entry.credits

// ✅ Destructure a data class / Pair into named locals
data class Entry(val name: String, val credits: Int)
val (name, credits) = entry

// ✅ Pair/triple destructuring
val (x, y) = point
val (status, body) = response
```

`val (a, b) = ...` destructures a `data class`, a `Pair`/`Triple`, or any type with matching `componentN()`, naming the parts in one declaration.

### `componentN()` — the contract behind destructuring

```kotlin
// ❌ Hand-written componentN with no property mapping
class Point(val x: Int, val y: Int) {
    operator fun component1() = x
    operator fun component2() = y
}

// ✅ A data class already provides componentN() in primary-constructor order
data class Point(val x: Int, val y: Int)
val (x, y) = Point(1, 2)

// ✅ Pair provides component1/component2 for free
val (a, b) = 1 to 2
```

A `data class` generates `component1()..componentN()` in primary-constructor order, so destructuring works out of the box; pairs/triples provide theirs too. Define `componentN()` manually only for a deliberately non-data type you want to destructure.

### Ranges & progressions over off-by-one loops

```kotlin
// ❌ Java-style bound loop — < n vs <= n is an off-by-one trap
for (var i = 0; i < n; i++) { ... }

// ✅ Ranges are inclusive; until is exclusive; downTo counts down; step skips
for (i in 0..10) { ... }        // 0..10 inclusive both ends
for (i in 0 until n) { ... }    // 0..n-1 exclusive upper bound
for (i in 10 downTo 0) { ... }  // 10, 9, ..., 0
for (i in 0..10 step 2) { ... } // 0, 2, 4, ...

// ✅ Clamp with coerceIn instead of a min/max pair
val page = requested.coerceIn(0, totalPages - 1)
val width = size.coerceAtLeast(0)
val height = size.coerceAtMost(maxHeight)
```

Ranges (`..`, `until`, `downTo`, `step`) express the progression and its bounds directly, and `coerceIn`/`coerceAtLeast`/`coerceAtMost` clamp a value in one call.

### String templates over concatenation

```kotlin
// ❌ Concatenation with + — noisy and easy to drop a space
val msg = "User " + user.name + " has " + count + " items (" + (count * 2) + " total)"

// ✅ Templates — the literal keeps its shape, values interpolate
val msg = "User ${user.name} has $count items (${count * 2} total)"

// ✅ $name for a simple identifier, ${expr} for anything more complex
val tag = "${item.id}@${index + 1}"
```

A string template interpolates `$name` for a simple identifier and `${expr}` for any expression, so the literal stays readable and you never build a string with `+`.

### `joinToString` / `buildString` over a StringBuilder

```kotlin
// ❌ Hand-built StringBuilder with trailing-comma bookkeeping
val sb = StringBuilder()
for (item in items) sb.append(item).append(", ")
sb.setLength(sb.length - 2)   // strip last comma

// ✅ joinToString — separator, prefix/suffix, limit, and transform built in
val csv = items.joinToString(", ")
val path = items.joinToString("/", prefix = "/", postfix = "/") { it.slug() }

// ✅ buildString wraps a builder and returns a String
val label = buildString { append("Total: "); append(total) }
```

`joinToString` handles separator/prefix/suffix/limit and a transform lambda in one call — no trailing-comma trimming; reserve `StringBuilder` (or `buildString`) for genuinely complex multi-part building.

### `require` / `check` / `error` for argument and state validation

```kotlin
// ❌ Silent, or a bare exception with no context
fun connect(host: String, port: Int) {
    if (host.isBlank()) throw IllegalArgumentException()
}

// ✅ require — validates a caller argument, with a message
fun connect(host: String, port: Int) {
    require(host.isNotBlank()) { "host must not be blank" }
    require(port in 1..65535) { "port out of range: $port" }
}

// ✅ check — an internal invariant that must hold
fun Task.finish() {
    check(state == STARTED) { "finish() requires STARTED, was $state" }
}

// ✅ error — an impossible/buggy state, not a recoverable condition
fun parse(tag: String): Tag = Tag.entries.firstOrNull { it.value == tag }
    ?: error("unknown tag: $tag")
```

`require` asserts a caller-supplied argument (throws `IllegalArgumentException`), `check` asserts an internal invariant (throws `IllegalStateException`), and `error` throws `IllegalStateException` for impossible/buggy conditions — each carries a message and states the contract at the point of use (so you rarely need a `contract` helper).

## Coroutines & Flow Language Idioms

### Structured concurrency: `coroutineScope` / `supervisorScope` over `GlobalScope`

```kotlin
// ❌ GlobalScope launches fire-and-forget work tied to nothing
fun load() {
    GlobalScope.launch { repo.fetch() }    // outlives the caller, no cancellation, leaks
}

// ✅ A scoped builder ties the work to the calling coroutine (and its lifetime)
suspend fun load() = coroutineScope {
    val data = async { repo.fetch() }
    uiState = data.await()                 // cancelled when the caller is cancelled
}

// ❌ coroutineScope: one failing child cancels every sibling (and the parent)
coroutineScope {
    launch { refreshA() }
    launch { refreshB() }                  // cancelled too if refreshA() throws
}

// ✅ supervisorScope: a failing child does not cancel its siblings
supervisorScope {
    launch { refreshA() }
    launch { refreshB() }                  // still runs even if refreshA() fails
}
```

Never use `GlobalScope` in an app — it detaches the work from any caller, so it cannot be cancelled and leaks across the lifetime of the process. `coroutineScope` (all-or-nothing) and `supervisorScope` (fail-fast per child) keep the job inside the caller's structured concurrency tree.

### `suspend` function design — suspend at real suspension points

```kotlin
// ❌ Marking a coroutine-body function suspend when it never suspends
suspend fun compute(): Int = 1 + 2        // no suspension point, misleading signature

// ✅ Only declare suspend a function that actually suspends (or must be called in a coroutine)
suspend fun fetch(): Data = withContext(Dispatchers.IO) { api.get() }

// ❌ Blocking IO inside a suspend function with no dispatcher switch
suspend fun read(): String = URL("https://x").readText()   // blocks the caller's thread

// ✅ Switch to the IO dispatcher for the blocking part, return to the caller's context
suspend fun read(): String = withContext(Dispatchers.IO) {
    URL("https://x").readText()
}
```

`suspend` is a promise that the function does not block a thread; a blocking call in a `suspend` body without `withContext` breaks that promise. `withContext(Dispatchers.IO)` confines only the blocking block — the rest of the caller keeps its dispatcher.

### Dispatcher confinement with `withContext`

```kotlin
// ❌ Assume every suspend function offloads automatically, or run a heavy computation inline
suspend fun render(large: List<Item>): Image {
    val px = computePixels(large)          // CPU-bound, runs on the caller's dispatcher
    return Image(px)
}

// ✅ Name the dispatcher for the kind of work (CPU → Default, blocking IO → IO)
suspend fun render(large: List<Item>): Image = withContext(Dispatchers.Default) {
    val px = computePixels(large)
    Image(px)
}
```

`withContext` is a targeted, scoped switch; it is not a one-time "make this whole coroutine fast" switch. Pick `Dispatchers.Default` for CPU-bound work, `Dispatchers.IO` for blocking IO, and never call `Dispatchers.Main` from a plain (non-UI) layer so the code stays testable.

### Cancellation-cooperative code

```kotlin
// ❌ Swallowing CancellationException breaks structured concurrency
try {
    repo.fetch()
} catch (e: Exception) {
    // a cancellation is caught here and the coroutine keeps running — corrupts cancel
}

// ✅ Re-throw CancellationException; handle only the real failures
try {
    repo.fetch()
} catch (e: CancellationException) {
    throw e
} catch (e: IOException) {
    fallback()
}

// ❌ A CPU-heavy loop with no suspension point ignores early cancellation
suspend fun crunch(items: List<Int>) {
    items.forEach { compute(it) }          // no suspension, cancel waits until it returns
}

// ✅ Check the job is active (or use a cancellable Flow/operator)
suspend fun crunch(items: List<Int>) {
    items.forEach {
        ensureActive()                     // throws CancellationException on cancel
        compute(it)
    }
}

// ✅ `cancellable()` adds cancellation checks between emissions on a Flow
items.asFlow().cancellable().collect { compute(it) }
```

Cancellation must be cooperative: a coroutine only stops if it checks. `ensureActive()`/`currentCoroutineContext().isActive` surface the cancellation, and a Flow's `cancellable()` or suspension points (e.g. `delay`, `emit`) let collection stop promptly. Swallowing `CancellationException` — including via a broad `runCatching`/`catch (e: Exception)` — silently defeats cancellation.

### Cold `Flow` over a hot container

```kotlin
// ❌ A hot SharedFlow built once and shared — every emission goes to all current collectors
val events = MutableSharedFlow<Int>()
events.emit(1)                              // runs whether or not anyone collects

// ✅ flow { } is cold — each collector runs the block fresh, lazily
fun numbers(): Flow<Int> = flow {
    for (i in 1..3) {
        delay(100)
        emit(i)                             // runs only when someone collects
    }
}
```

A `flow { }` building block is cold: nothing runs until a collector subscribes, and each collector gets its own execution. A `MutableSharedFlow`/`StateFlow` is hot — it represents shared state or events that exist independent of a collector. Pick cold for a producer of results, hot for shared state/events.

### Flow operators: `map` / `filter` / `combine` / `flatMapLatest` / `debounce` / `distinctUntilChanged`

```kotlin
// ❌ Accumulate with a loop and mutate a throwaway list
val names = mutableListOf<String>()
items.filter { it.active }.forEach { names.add(it.name) }

// ✅ Operators read as a pipeline, run lazily, and are unit-testable
val names = items.asFlow()
    .filter { it.active }
    .map { it.name }
    .toList()

// ✅ combine merges the latest value of each flow
val total = combine(a, b) { x, y -> x + y }

// ✅ flatMapLatest — switch to the latest inner flow, cancelling the previous one
@OptIn(ExperimentalCoroutinesApi::class)
val results = queryFlow.flatMapLatest { q -> repo.search(q) }

// ✅ debounce throttles rapid emissions; distinctUntilChanged drops repeat values
queryFlow
    .debounce(300)
    .distinctUntilChanged()
    .collect { search(it) }
```

The collection operators are declarative and lazy, and `combine`/`flatMapLatest`/`debounce`/`distinctUntilChanged` solve the reactive-shaped problems (merge latest, switch latest, throttle, dedupe) in one call instead of hand-rolled buffering. `flatMapLatest` and `debounce` are `@ExperimentalCoroutinesApi` — opt in deliberately.

### `flowOn` is scoped, not a global dispatcher

```kotlin
// ❌ Thinking flowOn shifts the whole chain, or applying it "below" the operator it should cover
flow.map { convert(it) }.filter { it.ready }.flowOn(Dispatchers.Default)

// ✅ flowOn shifts ONLY the upstream operators (those above it in the builder)
flow
    .map { convert(it) }          // runs on Dispatchers.Default
    .flowOn(Dispatchers.Default)  // upstream of this point is on Default
    .filter { it.ready }          // runs on the collector's context, not shifted
```

`flowOn` changes the context of the operators upstream of the call and inserts a `Channel` boundary; it does not globally set the flow's dispatcher, and it does not affect operators below it. Use it once, at the point where the expensive upstream work lives, and keep the terminal `collect` on the caller's context.

### `catch` on a Flow vs `try/catch` around `collect`

```kotlin
// ❌ try/catch around collect cannot see errors thrown inside the upstream `flow { }`
try {
    flow.collect { emit(it) }
} catch (e: IOException) { /* misses errors from upstream */ }

// ✅ Flow.catch catches only UPSTREAM failures — handle them inside the pipeline
flow
    .map { convert(it) }
    .catch { e -> emit(fallback) }   // catches errors from map and above
    .collect { use(it) }

// ❌ catch placed to "cover" the collector — it does NOT catch downstream errors
flow.catch { ... }.collect { throw RuntimeException() }   // this one is not caught
```

`Flow.catch` is upstream-only: it handles failures raised in the operators above it, replaces the stream with a fallback emission, and keeps the pipeline alive. Errors thrown in the terminal `collect` (downstream) are not inside its scope — for those use an explicit `try/catch` around the collection, or model the failure as part of the emitted value.

### `StateFlow` / `SharedFlow` / `MutableStateFlow` — value vs event, and who owns it

```kotlin
// ❌ Expose the MutableStateFlow directly — callers can write state behind your back
private val _value = MutableStateFlow(0)
val value = _value                             // callers can call value.value = ...

// ✅ Keep the Mutable one private, expose the read-only interface
private val _value = MutableStateFlow(0)
val value: StateFlow<Int> = _value.asStateFlow()

// ❌ Using SharedFlow for a "current state" value — it is a stream, not source of truth
MutableSharedFlow<Int>(replay = 1)             // works, but StateFlow is the clearer type

// ✅ StateFlow for state (always has a current value); SharedFlow for one-off events
private val _state = MutableStateFlow(...)
val state: StateFlow<State> = _state.asStateFlow()

private val _events = MutableSharedFlow<Event>(extraBufferCapacity = 1)
val events: SharedFlow<Event> = _events.asSharedFlow()
```

`StateFlow` models state: it always holds a current value, conflates updates (a slow collector only sees the latest), and is the value-type to expose for "the current screen state". `SharedFlow` models events: it has no meaningful current value, and is for one-shot notifications with an optional `replay`/buffer. Own the `Mutable*` privately and expose the read-only `StateFlow`/`SharedFlow` so only the owner updates it. Compose-side collection APIs (`collectAsStateWithLifecycle` and friends) are not covered here — defer those to `compose-runtime-state`.

## Naming & Formatting

### Case conventions

```kotlin
// ❌ Java-style / swapped cases
class userAccount { }
fun GetName(): String = ""

// ✅ pascalCase for classes/objects/functions, camelCase for properties & locals
class UserAccount
fun getName(): String = ""

// ❌ Hungarian or prefix annotations — the declared type already tells you
val sName: String = ""
val mContext: Context = ...
val m_User: User = ...

// ✅ No m/_/s prefixes; name the role, let the declaration carry the type
val name: String = ""
val context: Context = ...
val user: User = ...
```

Kotlin convention is `PascalCase` for class/object/type names and `camelCase` for functions, properties, and local variables. Do not carry Java `m`/`_` prefixes or a Hungarian type-prefix — the type is in the declaration.

### `const val` vs `val`, and constants naming

```kotlin
// ❌ A compile-time literal stored as a runtime field, or a constant not named as one
val maxRetries = 5                     // runtime field, not inlined
const val maxRetries = 5              // wrong case for a constant

// ✅ UPPER_SNAKE for a top-level/companion compile-time constant
const val MAX_RETRIES = 5

// ❌ const for a runtime-computed value — const cannot express it
const val CACHE_DIR = prefs.getString("dir", "cache")   // won't compile

// ✅ const only for compile-time literals (String/primitive); runtime values are camelCase
val cacheDir = prefs.getString("dir", "cache")
```

`const val` is a real compile-time constant, inlined at every use, and named `UPPER_SNAKE`. A plain `val` (including a runtime-computed value) is `camelCase`. Mixing the two — `const val maxRetries` or a non-const `MAX_*` — is a convention break.

### Backtick names for test functions

```kotlin
// ❌ JUnit-style descriptive-but-unreadable method names
@Test fun testLoginWithValidCredentialsSucceeds() { ... }

// ✅ Backtick names read as a sentence (kotlin.test / JUnit5 on the JVM)
@Test
fun `given valid credentials when login then succeeds`() { ... }

// ❌ Backtick spelling in production code — reserved for test function names
fun `process data`() { ... }           // tests only
```

Backtick-escaped function names are an idiomatic Kotlin/test convention for expressing behavior as a readable sentence. Leave backticks to test code; production symbols stay plain.

### File & package organization

```kotlin
// ❌ One huge file of unrelated declarations, or a package that doesn't match the layout
package com.example                          // ...with 40 top-level helpers

// ✅ Package mirrors the directory; the file is named after its primary public type
// com/example/repository/UserRepository.kt
package com.example.repository
class UserRepository { ... }

// ❌ A "misc" file containing many unrelated top-level helpers
// MyStuff.kt: helpers, a sealed type, and an extension you can't find

// ✅ A cohesive unit per file — one primary public type, plus its closely-related helpers
// UserRepository.kt -> class UserRepository + its private helpers / extensions
```

The package name matches the directory path, and a file is named after its primary public type (top-level functions and private helpers live in the file that owns them). Avoid "misc"/"utils" catch-all files — they defeat discovery.

### Trailing commas

```kotlin
// ❌ No trailing comma — adding a field later touches the last existing line
data class Config(
    val host: String,
    val port: Int
)

// ✅ Trailing comma — appending/editing the last item is a one-line change
data class Config(
    val host: String,
    val port: Int,
)
```

A trailing comma in a multi-line parameter/list literal is idiomatic and diff-friendly. Let ktlint + the IDE formatter enforce and auto-apply it rather than relying on manual discipline.

### Enforcement is automated, not aspirational

```kotlin
// ❌ Rely on review comments or habit to keep the style consistent
// ✅ ktlint (formatting rules) + Detekt (lint rules) + the IDE formatter enforce them
// ktlintCheck / ktlintFormat, detekt, and "Optimize Imports" on save (IntelliJ)
```

Style is enforced by ktlint and Detekt in CI plus the IDE formatter, so a convention is only real once a linter catches the violation. The exact rule set (trailing commas, import ordering, max line length) is version-sensitive — route the specific rule to the ktlint docs rather than guessing.

### When the "no `_` prefix" rule breaks

```kotlin
// ❌ `_` used to mark "private" or "unused" — the language already handles that
val _items: List<Item> = ...          // `_` is not a privacy mechanism

// ✅ `_` for an intentionally-ignored destructured/lambda parameter
val (_, value) = pair                 // drop the first component
list.forEachIndexed { index, _ -> println(index) }

// ✅ Backing-field + exposed read-only value is a conventional, narrow exception
private val _value = MutableStateFlow(0)
val value: StateFlow<Int> = _value.asStateFlow()   // read-only companion to the mutable holder
```

The rule against `_` prefixes is for naming; an intentionally unused binding is a real use. The `_value` + `value` pair for a private mutable holder with a public read-only view is a widely-accepted exception, and only for that pattern.

## Java-Style Anti-Patterns Catalog

### `!!` abuse vs `?:` / safe call / `requireNotNull`

```kotlin
// ❌ Force-unwrap a value that may be null — a bare NPE with no message
fun load(user: User?) {
    val real = user!!                 // crashes if null
    fetch(real.name)
}

// ✅ Elvis for a fallback
val name = user?.name ?: "Guest"

// ✅ Early return to exit cleanly
val real = user ?: return

// ✅ requireNotNull to turn a call-contract violation into a typed error
val id = requireNotNull(item?.id) { "item must have an id" }
```

`!!` converts a recoverable null into a stack trace. `?:` supplies a fallback, `?: return` exits cleanly, and `requireNotNull`/`checkNotNull` produce a typed exception with a message at the actual point of the null.

### `getFoo()` / `setFoo()` methods vs properties

```kotlin
// ❌ Java-style accessor methods for a plain field
class User {
    private var n = ""
    fun getName(): String = n
    fun setName(v: String) { n = v }
}

// ✅ A property, with a computed getter for a derived value, and encapsulated writes
class User {
    var name: String = ""
        private set
}

val fullName: String get() = "$first $last"
```

Kotlin properties replace `getX`/`setX`; a `val` with a custom getter expresses a cheap derived value, and `var ... private set` encapsulates writes. The `get`/`set` method shape is a Java leftover.

### "Utils"/"Helper" static classes vs top-level / extension functions

```kotlin
// ❌ A fake namespace container of static helpers
object DateUtils {
    fun short(d: LocalDate): String = d.format(DateTimeFormatter.ISO_LOCAL_DATE)
}
class StringUtils {
    companion object { fun capitalize(s: String) = s.replaceFirstChar { it.uppercase() } }
}

// ✅ Top-level functions (no container), and extension functions when a receiver exists
fun short(d: LocalDate): String = d.format(DateTimeFormatter.ISO_LOCAL_DATE)
fun String.capitalized(): String = replaceFirstChar { it.uppercase() }
```

Kotlin has no static-utility classes. A top-level function needs no container, and an extension function attaches to a natural receiver so the call reads like a member.

### `new`-style factory boilerplate vs `operator fun invoke` / companion `of` / data class `copy`

```kotlin
// ❌ A manual `new`-style factory with explicit construction + `create()`
class HttpClient private constructor(val config: Config) {
    companion object {
        fun create(config: Config): HttpClient = HttpClient(config)
    }
}

// ✅ operator fun invoke reads like a constructor; a named `of` works too
class HttpClient(val config: Config) {
    companion object {
        operator fun invoke(config: Config) = HttpClient(config)
        fun of(config: Config) = HttpClient(config)
    }
}
val client = HttpClient(config)              // invoke lets you call it like a constructor
val updated = user.copy(name = "New")        // data class copy for a modified field
```

`operator fun invoke` lets an object be called as a constructor, a named factory (`of`/`create`) stays self-documenting, and a `data class` gives `copy()` for an altered field. This is less ceremony than a `new`-style builder/secondary-constructor fixture.

### Verbose explicit types where inference works

```kotlin
// ❌ Redundant annotations on every local
val count: Int = items.size
val name: String = user.name

// ✅ Let inference work; state the type at a public boundary where it matters
val count = items.size
val name = user.name
fun parse(s: String): String = s.trim()
```

The compiler infers local/property types; spelling them out is noise. Put explicit types at the public API boundary (return types, complex generics, overload resolution) — not on every local.

### Checked-exception-style wrappers vs unchecked + sealed `Result`/error types

```kotlin
// ❌ Propagate a "checked-exception-style" contract through @Throws
@Throws(IOException::class)
fun read(): String { ... }                     // forces a throws-style envelope

// ❌ Or let a raw exception leak and force every caller to catch a broad type
fun read(): String { ... }                     // IOException escapes, no contract

// ✅ Model a recoverable failure as a value the caller handles exhaustively
sealed interface ReadResult {
    data class Success(val text: String) : ReadResult
    data class Failure(val message: String) : ReadResult
}
fun read(): ReadResult = runCatching { readRaw() }
    .fold({ ReadResult.Success(it) }, { ReadResult.Failure(it.message ?: "") })
```

Kotlin has no checked exceptions. A recoverable failure is better modeled as a sealed result type (or `Result`) so the caller handles all cases exhaustively and the compiler enforces it. Reserve exceptions for genuine programmer errors, and keep `suspend` functions letting `CancellationException` propagate.

### Java JUnit-style assertions vs `kotlin.test`

```kotlin
// ❌ JUnit-style: message is the FIRST argument, order is easy to get wrong
assertEquals("user should match", expected, actual)

// ✅ kotlin.test: expected first, actual second, message as an optional third arg
assertEquals(expected, actual, "user should match")

// ✅ And the idiomatic message/assertion helpers
assertTrue(list.contains("x"))
assertContentEquals(expectedList, actualList)
assertEquals(expectedList, actualList)
```

`kotlin.test` places `expected` before `actual` (with an optional message after) — the opposite of JUnit's `(message, expected, actual)` order — so mixing the two silently swaps the failure's "expected/actual" labels. Use `kotlin.test` (matching the JVM/src-common test source set) and its assertion helpers instead of importing JUnit's `org.junit.Assert`.

### Java index loops vs `forEachIndexed` / `withIndex`

```kotlin
// ❌ Size-based index loop with a manual [i] lookup
for (i in 0 until list.size) {
    println("$i: ${list[i]}")
}

// ✅ withIndex destructures index + element together
for ((index, item) in list.withIndex()) println("$index: $item")

// ✅ forEachIndexed when you don't need break/continue
list.forEachIndexed { index, item -> println("$index: $item") }
```

`withIndex()`/`forEachIndexed` yield the position and the element together, without a size bound or a manual `[i]`. A `java.util.List`-style index loop is the shape to leave behind.

### Java streams-style chains vs Kotlin collection operators

```kotlin
// ❌ Java streams style — operation names and a collect() terminal
val list = items.stream()
    .filter { it.active }
    .collect(Collectors.toList())

// ✅ Kotlin collection operators operate directly on the collection
val list = items.filter { it.active }.map { it.name }.toList()
```

Kotlin's collection operators are extension functions on the read-only collection itself, so there is no `.stream()` wrapper, no `Collectors`, and no `collect()` terminal — `filter`/`map`/`toList` are the idiomatic spelling.

### Mutable global state vs coroutines / `StateFlow` / DI

```kotlin
// ❌ Global mutable state mutated from anywhere
object AppConfig {
    var currentUser: User? = null        // mutated across the app, no owner
}

// ✅ State owned by a single holder and shared via StateFlow / DI
class SessionHolder {
    private val _user = MutableStateFlow<User?>(null)
    val user: StateFlow<User?> = _user.asStateFlow()
    fun setUser(u: User?) { _user.value = u }
}
// DI provides the one instance; mutations flow through the single owner
```

A mutable global is shared state with no owner and no way to observe or reset it. Own the state in a holder, expose a read-only `StateFlow` for observation, and let DI control the instance so every mutation is a single, observable, testable path.

## Kotlin DSL Design

### Lambda with receiver vs lambda without receiver

```kotlin
// ❌ No receiver — the "subject" is a positional parameter at every call site
fun buildConfig(configure: (String, Int) -> Unit) { ... }
buildConfig { host, port ->          // a bare lambda that must name the subject each time
    host = "example.com"
}

// ✅ Receiver lambda — methods & properties are called on `this`
class Config {
    var host: String = "localhost"
    var port: Int = 8080
}
fun config(block: Config.() -> Unit): Config = Config().apply(block)

val cfg = config {
    host = "example.com"              // this.host = ...
    port = 443
}
```

A receiver lambda declares `T.() -> Unit`, so the receiver is `this` inside the block and the DSL reads as configuration on the subject, not as a list of named parameters. Use a lambda *without* a receiver when the lambda is just a callback of the subject, not a scope over it.

### `@DslMarker` for nested scoping

```kotlin
// ❌ Nested DSLs let an inner block reach an outer receiver by accident
table {
    row {
        cell {
            row { ... }   // which row()? the inner scope is ambiguous
        }
    }
}

// ✅ @DslMarker restricts implicit receivers to the innermost DSL scope
@DslMarker
annotation class HtmlDsl

@HtmlDsl class Table { fun row(block: Row.() -> Unit) { } }
@HtmlDsl class Row   { fun cell(block: Cell.() -> Unit) { } }

// Now an inner `cell { row { } }` is a compile error — the outer receiver is shadowed
```

`@DslMarker` tells the compiler that only the innermost DSL receiver is in implicit scope, so a nested DSL cannot accidentally call an outer scope's method. It turns an ambiguous "which receiver does `row` target?" bug into a compile error.

### Builder-based DSLs

```kotlin
// ❌ A mutable builder configured manually, then built by hand
val builder = ServerBuilder()
builder.host = "example.com"
builder.port = 443
val server = builder.build()

// ✅ A scoped receiver lambda reads as inline configuration, returns an immutable result
class ServerBuilder {
    var host: String = "localhost"
    var port: Int = 80
    fun build(): Server = Server(host, port)
}
fun server(block: ServerBuilder.() -> Unit): Server = ServerBuilder().apply(block).build()

val server = server {
    host = "example.com"
    port = 443
}
```

A builder DSL collects configuration inside a receiver block and emits one immutable result on `build()` — the mutation lives only inside the builder, so callers never see a half-configured object.

### When a DSL is overkill

```kotlin
// ❌ A DSL where plain named arguments + defaults are clearly clearer
fun title(
    color: Color = Color.Black,
    size: Float = 12f,
    bold: Boolean = false,
) { }
style(color = Color.Red, bold = true)       // named args read fine without the ceremony

// ❌ A DSL that nobody reaches for — the shape never reads as a domain sentence
// For 20 users and 1 config, a DSL's nesting buys nothing.
```

A DSL pays off when the call site genuinely reads as a domain sentence or nests several scopes. For a small, rarely-changing surface, a plain function with named arguments and defaults is clearer — do not build a DSL "for extensibility" that nobody needs.

### A tiny DSL that makes order & nesting read naturally

```kotlin
// ❌ Positional/nested data construction is hard to read
val q = Query(and[Or[A, B], Not[C], Exists[D.field]])

// ✅ A tiny DSL makes the nesting and evaluation order read top-to-bottom
val q = query {
    and {
        or { a("A"); b("B") }
        not { c("C") }
        exists { field("D") }
    }
}
```

A small receiver-based DSL lets the call site describe the structure in its natural order instead of as deep positional constructor nesting. Keep the DSL tiny and single-purpose — it should be the shortest possible way to say what the domain needs, not a general-purpose builder.

## Cite the Source

When this skill asserts an official Kotlin convention, back it with the source: `[docs: URL — what was verified]` — the [Kotlin coding conventions](https://kotlinlang.org/docs/coding-conventions.html), the [Kotlin docs](https://kotlinlang.org/docs/home.html), and the [kotlinx.coroutines docs](https://kotlin.github.io/kotlinx.coroutines/) for coroutine/Flow idioms. For naming and the enforcement toolchain cite [ktlint](https://pinterest.github.io/ktlint/) and the relevant [Detekt](https://detekt.dev/) rule set.

When behavior is version-sensitive or uncertain — e.g. whether a Flow operator is `@ExperimentalCoroutinesApi`, the exact ktlint trailing-comma rule, or `const val` restrictions — do not guess. Route through `android-source-research` (for framework/platform source) or the Kotlin/kotlinx.coroutines documentation before writing the claim. NEVER assert Kotlin behavior from training data alone.

`@Composable`-specific concerns are out of scope here: state collection (`collectAsStateWithLifecycle`), recomposition, and side effects defer to the Compose skill family (`compose-runtime-state`, `compose-idiomatic-style`, `compose-ui-architecture`). This skill is the Kotlin-LANGUAGE reference for the non-composable layers (ViewModel, repository, data, domain, tests) that feed Compose.
