---
name: idiomatic-patterns
description: Language-idiomatic patterns and design patterns quick reference for Python, JavaScript, TypeScript, Rust, and Go — when-to-use and how-to-write with ❌/✅ comparative examples
---
# Idiomatic Patterns

Quick-reference for language-specific idiomatic patterns. Each entry shows the common naive approach (❌) vs the idiomatic approach (✅) with explanation.

## Python

### Early return over nested if-else

```python
# ❌ Deep nesting
def process(x):
    if x is not None:
        if x > 0:
            return x * 2
        else:
            return 0
    return -1

# ✅ Guard clauses
def process(x):
    if x is None:
        return -1
    if x <= 0:
        return 0
    return x * 2
```

### `dict.get` and `setdefault` over manual key check

```python
# ❌ Manual key check
if "count" in data:
    n = data["count"]
else:
    n = 0

# ✅ .get() with default
n = data.get("count", 0)

# ❌ Manual list init
if "tags" not in data:
    data["tags"] = []
data["tags"].append("new")

# ✅ setdefault
data.setdefault("tags", []).append("new")
```

### Context manager for resource cleanup

```python
# ❌ Manual open/close
f = open("file.txt")
try:
    data = f.read()
finally:
    f.close()

# ✅ Context manager
with open("file.txt") as f:
    data = f.read()
```

### `enumerate` over manual index

```python
# ❌ Manual index
i = 0
for item in items:
    print(i, item)
    i += 1

# ✅ enumerate
for i, item in enumerate(items):
    print(i, item)
```

## JavaScript / TypeScript

### Early return over nested if-else

```typescript
// ❌ Nested
function process(x: number | null): number {
    if (x !== null) {
        if (x > 0) {
            return x * 2;
        } else {
            return 0;
        }
    }
    return -1;
}

// ✅ Guard clauses
function process(x: number | null): number {
    if (x === null) return -1;
    if (x <= 0) return 0;
    return x * 2;
}
```

### Optional chaining and nullish coalescing

```typescript
// ❌ Manual truth checks
const name = user && user.profile && user.profile.name ? user.profile.name : "Guest";

// ✅ Optional chaining + nullish coalescing
const name = user?.profile?.name ?? "Guest";
```

### Destructuring for object/array access

```typescript
// ❌ Dot notation repetition
const name = data.name;
const age = data.age;
const city = data.address.city;

// ✅ Destructuring
const { name, age, address: { city } } = data;
```

### Array methods over for-loops

```typescript
// ❌ Imperative loop
const result: number[] = [];
for (let i = 0; i < items.length; i++) {
    if (items[i].active) {
        result.push(items[i].value * 2);
    }
}

// ✅ Method chain
const result = items
    .filter(item => item.active)
    .map(item => item.value * 2);
```

## Rust

### `?` operator over match for error propagation

```rust
// ❌ Verbose match
fn read_file(path: &str) -> Result<String, io::Error> {
    match File::open(path) {
        Ok(mut f) => {
            let mut s = String::new();
            match f.read_to_string(&mut s) {
                Ok(_) => Ok(s),
                Err(e) => Err(e),
            }
        }
        Err(e) => Err(e),
    }
}

// ✅ ? operator
fn read_file(path: &str) -> Result<String, io::Error> {
    let mut f = File::open(path)?;
    let mut s = String::new();
    f.read_to_string(&mut s)?;
    Ok(s)
}
```

### `if let` over match for single-arm pattern

```rust
// ❌ match for one case
match opt {
    Some(val) => println!("{}", val),
    None => {}
}

// ✅ if let
if let Some(val) = opt {
    println!("{}", val);
}
```

### Iterator combinators over for/loop

```rust
// ❌ Imperative
let mut result = Vec::new();
for item in items {
    if item.active {
        result.push(item.value * 2);
    }
}

// ✅ Iterator combinators
let result: Vec<_> = items
    .iter()
    .filter(|item| item.active)
    .map(|item| item.value * 2)
    .collect();
```

### Entry API for HashMap

```rust
use std::collections::HashMap;

// ❌ Manual get-or-insert
let mut map = HashMap::new();
if !map.contains_key("count") {
    map.insert("count", 0);
}
*map.get_mut("count").unwrap() += 1;

// ✅ Entry API
*map.entry("count").or_insert(0) += 1;
```

## Go

### Early return over if-else chains

```go
// ❌ Deep if-else
func process(x int) int {
    if x > 0 {
        return x * 2
    } else {
        return 0
    }
}

// ✅ Early return
func process(x int) int {
    if x > 0 {
        return x * 2
    }
    return 0
}
```

### `range` over index-based loops

```go
// ❌ Index loop
for i := 0; i < len(items); i++ {
    fmt.Println(items[i])
}

// ✅ range
for _, item := range items {
    fmt.Println(item)
}
```

### Error check discipline

```go
// ❌ Ignore error
f, _ := os.Open("file.txt")

// ✅ Handle error
f, err := os.Open("file.txt")
if err != nil {
    return fmt.Errorf("open file: %w", err)
}
defer f.Close()
```

### `defer` over manual cleanup

```go
// ❌ Manual close in every exit
f, _ := os.Open("file.txt")
// ... use f ...
f.Close()

// ✅ defer
f, err := os.Open("file.txt")
if err != nil {
    return err
}
defer f.Close()
```
