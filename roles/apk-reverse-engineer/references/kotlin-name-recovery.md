# Kotlin Name Recovery Reference

Deep-dive companion to the `structure-analysis` skill (Phase 3.5). Explains why and how
original Kotlin class/method names can be recovered from an R8/ProGuard-obfuscated app.

## Why it works

R8 renames JVM symbols (`com.example.data.UserRepository` → `a.b.c`), but the Kotlin
compiler embeds **metadata strings** the app needs at runtime for reflection,
coroutines, and serialization. R8 does **not** strip these strings, so the original
fully-qualified names leak through two annotations:

- **`@kotlin.Metadata`** — on every Kotlin class. Its `d2` array (and `d1`) contains the
  original class name and member signatures as strings.
- **`@kotlin.coroutines.jvm.internal.DebugMetadata`** — on the state machine of every
  `suspend` function. Its `c` (className) and `m` (methodName) fields carry the original
  enclosing class and function name.

Because network/repository code in modern apps is coroutine-heavy, `@DebugMetadata`
often recovers exactly the classes you care about (`*Repository`, `*UseCase`, `*Api`).

## Finding the metadata

```bash
SRC=<output>/sources

# Classes carrying Kotlin metadata (nearly all Kotlin classes)
grep -rl '@Metadata' "$SRC" | head

# Suspend-function debug metadata — the highest-signal source for network code
grep -rn '@DebugMetadata' "$SRC"
```

In a decompiled class you'll see something like:

```java
@Metadata(mv = {1, 9, 0}, k = 1, d1 = {"\u0000..."}, d2 = {"Lcom/example/data/UserRepository;", "", "api", "Lcom/example/api/UserApi;", "login", ...})
public final class a {   // <- obfuscated name 'a'
    ...
}
```

The `d2` array's first string `Lcom/example/data/UserRepository;` is the **real** name of
class `a`. For suspend functions:

```java
@DebugMetadata(f = "UserRepository.kt", l = {42}, i = {}, s = {}, n = {}, m = "login", c = "com.example.data.UserRepository")
```

→ obfuscated method belongs to `com.example.data.UserRepository.login`.

## Building a recovery map

1. Walk every `@Metadata`/`@DebugMetadata` and pair the **obfuscated class name** (the
   file/class it sits on) with the **original FQN** from `d2`/`c`.
2. Store `obfuscated → original` in a lookup table.
3. When tracing (Phase 4) or searching APIs (Phase 5), annotate each hit with the
   recovered name so `a.b.c` reads as `com.example.data.UserRepository`.

Typical yield on a real Kotlin app: ~100% of `*Repository` / `*ViewModel` / `*UseCase` /
`*Impl` classes and ~80% of DTOs.

## Limitations

- **Java-only code** has no Kotlin metadata — names stay obfuscated; fall back to string
  and library-call anchors (see `api-extraction-patterns.md`).
- **kotlinx-metadata stripping**: a few hardened apps run extra passes that remove or
  mangle `@Metadata`. If `d2` strings are absent, recovery isn't possible this way.
- **Member-name recovery** from `d2` is partial — it's most reliable for class names and
  suspend-function names.

## Practical workflow

```bash
# 1. decompile with deobf so obfuscated names are stable across the tree
bash scripts/decompile.sh --deobf app.apk -o out

# 2. pull the metadata to seed the recovery map
grep -rn '@DebugMetadata' out/sources | sed -E 's/.*c *= *"([^"]+)".*m *= *"([^"]+)".*/\1#\2/' | sort -u

# 3. trace call flows using the recovered names as anchors
```
