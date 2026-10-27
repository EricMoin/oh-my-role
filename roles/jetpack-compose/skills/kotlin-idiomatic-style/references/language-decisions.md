# Kotlin language decisions

Read the section relevant to the change. Examples below are independent Kotlin/JVM
snippets using the standard library; they do not require Android or Compose.

## Nullability and scope

| Intent | Choice |
| --- | --- |
| Optional absence | Nullable type with a deliberate fallback or early return |
| Invalid caller argument | `require` / `requireNotNull` with a useful message |
| Broken internal state | `check` / `checkNotNull` |
| Configure and return the receiver | `apply` (`this`) |
| Additional work and return the receiver | `also` (`it`) |
| Produce a result from a receiver | `run` / `with` (`this`), or `let` (`it`) |

`let` may contain side effects and `also` may mutate its argument. These functions
differ in receiver access and return value, not in permission to mutate. Prefer a
named local or ordinary `if` when chaining obscures the receiver. A Java platform type
needs a boundary decision based on its actual nullability contract, not automatic
conversion of every API to nullable.

Sources: [Scope functions](https://kotlinlang.org/docs/scope-functions.html) and
[null safety](https://kotlinlang.org/docs/null-safety.html).

## Model different outcomes with a sealed interface

```kotlin
sealed interface LookupResult {
    data class Found(val name: String) : LookupResult
    object Missing : LookupResult
}

fun describe(result: LookupResult): String = when (result) {
    is LookupResult.Found -> result.name
    LookupResult.Missing -> "Missing"
}
```

Implement an interface with `: LookupResult`, without constructor parentheses.
Use a sealed class when shared constructor state is useful. A nullable return can be
simpler for ordinary absence; an enum can carry fixed per-constant properties. Do not
force every result into a new sealed hierarchy.

Source: [Sealed classes and interfaces](https://kotlinlang.org/docs/sealed-classes.html).

## Read-only access and snapshots are different contracts

```kotlin
class Roster {
    private val entries = mutableListOf<String>()

    fun add(name: String) {
        entries.add(name)
    }

    fun snapshot(): List<String> = entries.toList()
}
```

A getter returning the backing `MutableList` as `List` exposes a live alias: later
owner mutations remain visible through it. `toList()` supplies a snapshot of membership,
not deep copies of mutable elements. Neither a `val` field nor the `List` interface
alone proves immutability or Compose stability. Define ownership before choosing a
view, a copy, or an immutable collection implementation.

Source: [Kotlin collection types](https://kotlinlang.org/docs/collections-overview.html).

## Aggregates and empty input

```kotlin
data class Employee(val salary: Int)

fun averageSalary(employees: List<Employee>): Double? =
    if (employees.isEmpty()) null else employees.map { it.salary }.average()

fun highestSalary(employees: List<Employee>): Int? =
    employees.maxOfOrNull { it.salary }
```

`average()` operates on numbers; there is no standard `average { selector }` overload.
Map the property first. Decide what empty input means instead of accidentally relying
on an exception or a non-finite average. Use `sumOf`, `count`, `fold`, `groupBy`, and
`associateBy` when their contracts match; remember that duplicate map keys overwrite
previous entries in `associateBy`.

Sources: [Aggregates](https://kotlinlang.org/docs/collection-aggregate.html) and
[associateBy](https://kotlinlang.org/api/core/kotlin-stdlib/kotlin.collections/associate-by.html).

## Constrain a generic operation to what it requires

```kotlin
fun <T : Comparable<T>> List<T>.mergedSorted(other: List<T>): List<T> =
    (this + other).sorted()

fun <T> List<T>.mergedSortedWith(other: List<T>, comparator: Comparator<in T>): List<T> =
    (this + other).sortedWith(comparator)
```

Natural sorting requires comparable elements; an unconstrained `T` is insufficient.
Prefer a comparator when ordering is external to the type. Use declaration-site
`out` for producers and `in` for consumers when those contracts hold. A `typealias`
renames a type; it does not create a distinct domain type.

Source: [Generics and bounds](https://kotlinlang.org/docs/generics.html).

## API choices without blanket bans

- Use top-level functions or extensions for natural helpers. Named factory functions
  remain useful for validation and construction policies; a companion `invoke` beside
  an equivalent public constructor does not make construction clearer.
- A data class's generated members use its primary-constructor properties, and `copy`
  is shallow. Use a property for a cheap, unsurprising value; keep expensive or effectful
  work visible as a function.
- A JVM value class provides a distinct type, but can be boxed at generic, interface,
  or nullable boundaries. Do not advertise it as universally allocation-free.
- Prefer named arguments and defaults over opaque positional booleans. Add a receiver
  DSL only when nested domain structure benefits; mark all participating receivers
  with the appropriate `@DslMarker` when implicit outer access must be restricted.
- Use a `for` loop when `break` or `continue` expresses the behavior. Sequences can
  reduce intermediate work, especially with short-circuiting terminals, but their
  overhead can outweigh that saving; measure performance-sensitive paths.
- Keep the project's test framework and check the imported assertion's signature.
  JUnit and `kotlin.test` are both valid; argument-order advice must name the API/version.
- Use project lint configuration for naming, imports, and trailing commas. Do not add
  a new formatter or change the whole file's style for an unrelated fix.

Sources: [Data classes](https://kotlinlang.org/docs/data-classes.html),
[value-class representation](https://kotlinlang.org/docs/inline-classes.html#representation),
[sequences](https://kotlinlang.org/docs/sequences.html),
[type-safe builders](https://kotlinlang.org/docs/type-safe-builders.html), and
[coding conventions](https://kotlinlang.org/docs/coding-conventions.html).
