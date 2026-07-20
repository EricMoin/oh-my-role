---
name: misconceptions
description: Language-specific common newcomer misconceptions catalog — static reference data. Works alongside memory-stored personal misconception records for a two-layer knowledge system.
---
# Common Misconceptions

This is a **static reference catalog** of common misconceptions organized by language/topic. It is the "textbook" layer.

The **personal layer** lives in `memory` (category: `lesson`, tag: `misconception-corrected`) — records of *this specific user's* misconceptions. The two layers work together: when the user asks about a topic, check both the static catalog for common pitfalls and memory for their personal history.

## Python

### Mutable default arguments are evaluated once at function definition

```python
# Misconception: items=[] creates a new list each call
def add(item, items=[]):
    items.append(item)
    return items

# Reality: items is the SAME list across all calls
print(add(1))  # [1]
print(add(2))  # [1, 2] — surprise!
```

### `is` vs `==`

```python
# Misconception: `is` and `==` are interchangeable
a = 256
b = 256
a is b  # True (CPython caches -5..256, but don't rely on this)

c = 257
d = 257
c is d  # False! — different objects

# Reality: `==` checks value equality, `is` checks identity
```

### Closure captures by reference, not value

```python
funcs = []
for i in range(3):
    funcs.append(lambda: i)

# Misconception: prints 0, 1, 2
# Reality: prints 2, 2, 2 (all closures capture the same `i`)
for f in funcs:
    print(f())
```

### `except:` vs `except Exception:`

```python
# Misconception: they're the same
try:
    risky()
except:
    pass  # Also catches KeyboardInterrupt, SystemExit, GeneratorExit

# Correct: be specific
try:
    risky()
except Exception:
    pass  # Only catches runtime exceptions
```

## JavaScript / TypeScript

### `==` vs `===`

```javascript
// Misconception: they're interchangeable
0 == false   // true — coercion makes them "equal"
0 === false  // false — different types
"" == 0      // true
"" === 0     // false

// Rule: always use === except when explicitly using == for null check
value == null  // catches both null and undefined
```

### `var` hoisting vs `let`/`const` TDZ

```javascript
// Misconception: all declarations are hoisted the same way
console.log(x)  // undefined (hoisted, not error)
var x = 1

console.log(y)  // ReferenceError: Cannot access before initialization
let y = 1       // Temporal Dead Zone
```

### `this` in arrow functions vs regular functions

```javascript
// Misconception: this works the same
const obj = {
    name: "test",
    regular: function() { return this.name },
    arrow: () => this.name
}
obj.regular()  // "test" — this === obj
obj.arrow()    // undefined — this === outer scope (global/module)
```

### Promise executor runs synchronously

```javascript
// Misconception: Promise(() => ...) is async
console.log(1)
new Promise(() => console.log(2))
console.log(3)
// Output: 1, 2, 3 — the executor runs synchronously!
// Only .then() is async
```

## Rust

### `let mut x` makes the binding mutable, not the value

```rust
// Misconception: mut = everything is mutable
let mut x = vec![1, 2, 3];
x.push(4);                    // OK — mutable binding
// x = vec![4, 5, 6];        // Also OK — can reassign

// But &mut is required for other functions
fn push_item(v: &mut Vec<i32>) {
    v.push(5);
}
push_item(&mut x);            // Must pass &mut
```

### Closures capture by reference unless `move`

```rust
// Misconception: closures always capture by value
let s = String::from("hello");
let c = || println!("{s}");  // Captures &s, not s
c();
println!("{s}");             // OK — s still accessible

let c2 = move || println!("{s}");  // Captures s by value
c2();
// println!("{s}");          // Error: s moved
```

### `Option::None` is not "null"

```rust
// Misconception: if let Some(x) = option is like a null check
// Reality: it's full-branch pattern matching — the compiler
// forces you to handle both Some and None

// This doesn't compile:
fn get_length(s: Option<String>) -> usize {
    s.unwrap().len()  // Will panic on None
}

// This does:
fn get_length(s: Option<String>) -> usize {
    s.map(|s| s.len()).unwrap_or(0)
}
```

## Go

### `defer` executes at function return, not scope exit

```go
// Misconception: defer runs when the block ends
func read() error {
    f, _ := os.Open("file.txt")
    defer f.Close()
    // ... lots of code ...
    // f.Close() runs HERE, not at any intermediate return
    return nil
}
```

### Slice append may or may not allocate

```go
// Misconception: append always creates a new slice
s := make([]int, 3, 5)  // len=3, cap=5
s2 := append(s, 4)      // May reuse same backing array
s[0] = 99
// s2[0] may or may not be 99 — depends on capacity

// If capacity is exceeded:
s3 := append(s, 4, 5, 6)  // New backing array allocated
```

### `range` copies values

```go
// Misconception: range gives you a reference to each element
items := []MyStruct{{Name: "a"}, {Name: "b"}}
for _, item := range items {
    item.Name = "changed"  // This modifies a COPY, not the original
}

// Correct: use index
for i := range items {
    items[i].Name = "changed"
}
```

## Two-Layer Operation

### Static layer (this file)
Consult when the user's question is about a language feature or pattern. Cross-reference the relevant language section for common pitfalls before answering.

### Personal layer (memory)
- Check `memory_recall` for `category: lesson, tag: misconception-corrected` records for this user
- If the user has previously held a misconception about the current topic, explicitly address it: "我之前注意到你觉得 X 和 Y 是一样的——这里正好是展示它们区别的例子。"
- After correcting a new misconception, write to memory: `memory_write(category="lesson", tags=["misconception-corrected", "python"], content="User thought ... was ... Actually ...")`
