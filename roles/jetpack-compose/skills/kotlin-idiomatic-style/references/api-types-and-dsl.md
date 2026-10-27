# Kotlin API, type and DSL decisions

Read for reusable Kotlin APIs, type-system questions, Java boundaries or a nested builder.
Do not add a DSL, value class or generic abstraction simply because an example uses one.
Examples are independent Kotlin/JVM snippets with their necessary imports.

## Functions, extensions and callback shape

- Choose a top-level function for an independent operation; use an extension when the
  receiver makes the call clearer. Extensions are statically resolved from the declared
  receiver type, do not add virtual members, and cannot access otherwise-private members.
  A real member with the applicable signature wins over an extension.
- Use a property for a cheap, unsurprising value. Keep expensive work, I/O and explicit
  state transitions visible as functions. An extension property has no backing field.
- Expression bodies suit short computations; block bodies suit branching/steps. Specify
  public result types when they define a contract rather than exposing incidental inference.
- A local function can own repeated logic confined to one caller. Capturing local mutable
  state still creates a dependency; prefer explicit parameters when that dependency is unclear.
- A function type is usually enough for one callback. `fun interface` adds a named SAM
  contract, Java interoperability or useful additional members; neither is universally better.
- Put a primary callback last for trailing-lambda use. Named/default parameters clarify
  meaningful options. Independent booleans are valid; invalid combinations need a model.
- Use `infix` or operator overloads only with familiar domain meaning. Do not overload
  `contains`/`get` already supplied by a collection merely to restate their behavior.

```kotlin
fun interface TextRule {
    fun accepts(text: String): Boolean
}

fun acceptedNames(names: List<String>, rule: TextRule): List<String> =
    names.filter { rule.accepts(it) }

fun String.singleLine(): String = lineSequence().joinToString(" ").trim()
```

Sources: [Extensions](https://kotlinlang.org/docs/extensions.html),
[functions](https://kotlinlang.org/docs/functions.html),
[functional interfaces](https://kotlinlang.org/docs/fun-interfaces.html),
[operator conventions](https://kotlinlang.org/docs/operator-overloading.html).

## Variance, projections and runtime type checks

| Type shape | Meaning |
| --- | --- |
| `Producer<out T>` | Produces T; a producer of a subtype can stand in for a producer of its supertype |
| `Consumer<in T>` | Consumes T; a consumer of a supertype can handle the subtype's values |
| Mutable slot consuming and producing T | Normally invariant; widening it would allow invalid writes |
| `Container<*>` | Unknown argument with safe reads according to its bounds, not permission to write arbitrary values |
| `typealias` | Another name for the same type; does not prevent mixing two domain concepts |
| Value class | A distinct type with one wrapped property; boxing can still occur |

```kotlin
class Producer<out T>(val value: T)
fun interface Consumer<in T> { fun accept(value: T) }

fun widen(source: Producer<String>): Producer<CharSequence> = source
fun narrow(target: Consumer<CharSequence>): Consumer<String> = target
fun itemCount(items: List<*>): Int = items.size
```

Use-site projections such as `Array<out Number>` restrict operations on an otherwise
invariant type. They are useful at an API boundary; they do not make a mutable object
immutable. Upper bounds must match the operation, such as `Comparable<T>` for natural sorting;
see [the corrected sorting examples](language-decisions.md#constrain-a-generic-operation-to-what-it-requires).

An inline reified parameter permits `is T`, `as? T` and class-token access at an inlined
call site. It does not recover erased nested type arguments: testing `is List<String>`
through reified `T` cannot establish that all elements are Strings. Validate elements or
use the appropriate serialization/type-token contract instead of an unchecked promise.

```kotlin
inline fun <reified T> selectedTypes(values: List<Any?>): List<T> = values.filterIsInstance<T>()

fun stringElements(value: Any?): List<String>? {
    if (value !is List<*>) return null
    return buildList {
        for (element in value) {
            if (element !is String) return null
            add(element)
        }
    }
}
```

Use a value class when the type distinction prevents mistakes at a meaningful boundary;
keep validation local to construction. Check JVM signature/Java-call implications before
changing a published parameter type. Do not promise allocation elimination.

```kotlin
@JvmInline
value class CompletionPercent(val value: Int) {
    init { require(value in 0..100) }
}
```

Sources: [Generics and erasure](https://kotlinlang.org/docs/generics.html),
[type aliases](https://kotlinlang.org/docs/type-aliases.html),
[value classes](https://kotlinlang.org/docs/inline-classes.html).

## Contracts and validation helpers

`require`/`requireNotNull` establish caller requirements; `check`/`checkNotNull` describe
internal state. `error` throws an IllegalStateException; it is not a substitute for modeling
an expected invalid user input or recoverable I/O failure.

Only write a custom compiler contract when ordinary control flow and standard checks cannot
express the reusable API. Check the project's compiler and opt-in requirements. The contract
must be true for every returning path; it is a compiler promise, not a runtime assertion.

```kotlin
import kotlin.contracts.ExperimentalContracts
import kotlin.contracts.contract

@OptIn(ExperimentalContracts::class)
fun String?.hasValue(): Boolean {
    contract { returns(true) implies (this@hasValue != null) }
    return this != null
}

fun textLength(text: String?): Int = if (text.hasValue()) text.length else 0
```

This contract establishes non-nullness only. It does not claim nonempty content. Keep
`callsInPlace` claims equally exact about invocation count and lifetime; an incorrect
contract can make otherwise unsafe code appear valid to the compiler.

Sources: [Contract API](https://kotlinlang.org/api/core/kotlin-stdlib/kotlin.contracts/contract.html),
[contract design](https://kotlinlang.org/docs/whatsnew13.html#contracts).

## Receiver builders with real scope boundaries

A receiver lambda (`Builder.() -> Unit`) supports a configuration scope; an ordinary lambda
(`(Value) -> Unit`) suits a callback over a value. Named arguments and defaults are clearer
for a small flat configuration. Nested domain structure may justify a small DSL.

The following complete example keeps mutable construction private and returns snapshots.
Both builder receiver types carry the same marker. The marker restricts *implicit* outer
receiver access; an explicitly qualified outer receiver remains available when intentional.

```kotlin
@DslMarker
annotation class MenuDsl

data class MenuItem(val label: String)
data class MenuGroup(val title: String, val items: List<MenuItem>)

@MenuDsl
class MenuGroupBuilder(private val title: String) {
    private val items = mutableListOf<MenuItem>()
    fun item(label: String) { items.add(MenuItem(label)) }
    fun build(): MenuGroup = MenuGroup(title, items.toList())
}

@MenuDsl
class MenuBuilder {
    private val groups = mutableListOf<MenuGroup>()
    fun group(title: String, block: MenuGroupBuilder.() -> Unit) {
        groups.add(MenuGroupBuilder(title).apply(block).build())
    }
    fun build(): List<MenuGroup> = groups.toList()
}

fun menu(block: MenuBuilder.() -> Unit): List<MenuGroup> = MenuBuilder().apply(block).build()

fun exampleMenu(): List<MenuGroup> = menu {
    group("File") {
        item("Open")
        item("Save")
    }
}
```

Inside `group`, an unqualified call to outer `group(...)` is rejected by the DSL marker.
Apply the marker to all participating receiver types (or a common marked supertype), not
merely to the entry function. A builder must still validate domain invariants and ordering;
a DSL marker is scope control, not business validation or concurrency protection.

Source: [Type-safe builders and receiver scope](https://kotlinlang.org/docs/type-safe-builders.html).

## Naming, organization and Java boundaries

- Use UpperCamelCase for types and lowerCamelCase for ordinary functions/properties.
  Follow the Compose skill's special naming contract for composables.
- Constants use uppercase underscore-separated names. An immutable top-level/object value
  may conventionally be a constant even without `const`; do not mechanically lowercase all
  non-const values. Mutable backing properties may use `_value` when paired with a public
  read-only `value`. `_` also discards an unused lambda/destructured component.
- Cohesive declarations can share a file; one class per file is not a Kotlin requirement.
  Match package/source-set conventions, name the file for its responsibility, and avoid
  catch-all `Utils` files. Multiplatform file-facade naming needs target-specific attention.
- Backtick test names can express behavior where the test runtime supports them. JVM/Android
  tooling and API constraints matter; do not call escaped production identifiers illegal
  (Java keyword interop can require them). Match the configured runner's conventions.
- Use project formatting/import/trailing-comma rules and installed lint tasks. Do not invent
  universal ktlint/Detekt task names or install a tool solely to enforce a personal preference.
- Kotlin has no checked exceptions, but `@Throws` is useful for Java callers that need a
  checked-exception signature. Exceptions and result types are both valid contracts; recover
  only expected failures and preserve cancellation. Keep the existing test framework and
  verify its assertion argument order instead of replacing JUnit with kotlin.test by decree.
- Top-level functions compile to JVM facade methods; companion methods are not all static
  Java methods automatically. `@JvmStatic`, `@JvmField` and `@JvmOverloads` serve specific
  Java APIs, not stylistic improvements to Kotlin-only code. Preserve binary/source contracts.

Sources: [Coding conventions](https://kotlinlang.org/docs/coding-conventions.html),
[calling Kotlin from Java](https://kotlinlang.org/docs/java-to-kotlin-interop.html).
