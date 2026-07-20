# Design Patterns Catalog

Scenario-to-pattern mapping with applicability signals and multi-language examples.

## Strategy Pattern

**When**: You have multiple algorithms for the same task, and you want to select one at runtime (e.g., different sorting strategies, different pricing calculations, different output formats).

**Applicability signals**:
- A function has a long `if-elif` / `switch` chain selecting behavior
- You need to add new variants without modifying existing code
- The same algorithm needs to be swapped at runtime

```python
# Python — function-based (simplest approach)
strategy_map = {
    "json": lambda data: json.dumps(data),
    "yaml": lambda data: yaml.dump(data),
    "csv":  lambda data: "\n".join(",".join(row) for row in data),
}
output = strategy_map[format](data)
```

```rust
// Rust — trait-based
trait Serialize {
    fn format(&self, data: &[u8]) -> String;
}
struct JsonSerializer;
impl Serialize for JsonSerializer {
    fn format(&self, data: &[u8]) -> String {
        // ... json output
    }
}
```

```typescript
// TypeScript — class/interface-based
interface PaymentStrategy {
    pay(amount: number): PaymentResult;
}
class CreditCardStrategy implements PaymentStrategy { /* ... */ }
class PaypalStrategy implements PaymentStrategy { /* ... */ }
```

## Factory Pattern (Factory Method)

**When**: Creating objects that belong to a family, but the exact type is determined by runtime context.

**Applicability signals**:
- `if type == "a" return A() else if type == "b" return B()` repeated
- Object construction needs to be centralized
- Downstream code should not know the concrete type

```python
# Python — simple factory
def create_parser(filetype: str) -> Parser:
    parsers = {"json": JsonParser, "yaml": YAMLParser, "toml": TOMLParser}
    cls = parsers.get(filetype)
    if cls is None:
        raise ValueError(f"Unknown parser: {filetype}")
    return cls()
```

```rust
// Rust — enum dispatch
enum Parser {
    Json(JsonParser),
    Yaml(YamlParser),
}
impl Parser {
    fn new(filetype: &str) -> Result<Self, Error> {
        match filetype {
            "json" => Ok(Self::Json(JsonParser)),
            "yaml" => Ok(Self::Yaml(YamlParser)),
            _ => Err(Error::UnknownFormat),
        }
    }
}
```

## Observer Pattern

**When**: One object's state change should notify multiple dependents automatically, without the notifier knowing who or what those dependents are.

**Applicability signals**:
- UI model changes need to update multiple views
- Event-driven architecture
- Publish-subscribe relationship (one-to-many)

```python
# Python — simple callback list
class Observable:
    def __init__(self):
        self._observers = []
    def subscribe(self, callback):
        self._observers.append(callback)
    def _notify(self, value):
        for cb in self._observers:
            cb(value)
```

```typescript
// TypeScript — EventEmitter pattern
class EventBus extends EventTarget {
    emit(event: string, detail?: unknown) {
        this.dispatchEvent(new CustomEvent(event, { detail }));
    }
}
const bus = new EventBus();
bus.addEventListener("user-login", (e) => console.log(e.detail));
```

## Decorator Pattern

**When**: You need to add behavior to an object without modifying its class, and you want to compose multiple behaviors.

**Applicability signals**:
- Cross-cutting concerns (logging, timing, caching, auth) that should not be mixed into business logic
- You want to add/remove features at runtime
- Multiple optional behaviors need to compose

```python
# Python — function decorator
def timed(fn):
    from time import perf_counter
    def wrapper(*args, **kwargs):
        start = perf_counter()
        result = fn(*args, **kwargs)
        print(f"{fn.__name__} took {perf_counter() - start:.3f}s")
        return result
    return wrapper

@timed
def slow_function():
    ...
```

```typescript
// TypeScript — higher-order function
function withLogging<T extends (...args: any[]) => any>(fn: T): T {
    return ((...args: any[]) => {
        console.log(`called ${fn.name} with`, args);
        return fn(...args);
    }) as T;
}
```

## Adapter Pattern

**When**: Two interfaces don't match, and you need to make one work with the other without changing either.

**Applicability signals**:
- Third-party library interface differs from your application's expected interface
- Legacy code that can't be modified needs to work with a new system
- Different data sources need a uniform access layer

```python
# Python — wrapper class
class OldLogger:
    def log_msg(self, level, text): ...

class NewLogger:
    def info(self, msg): ...
    def error(self, msg): ...

class LoggerAdapter:
    """Makes OldLogger look like NewLogger"""
    def __init__(self, old: OldLogger):
        self._old = old
    def info(self, msg):
        self._old.log_msg("INFO", msg)
    def error(self, msg):
        self._old.log_msg("ERROR", msg)
```

```rust
// Rust — newtype + From/TryFrom
struct OldPoint(f64, f64);
struct NewPoint { x: f64, y: f64 }

impl From<OldPoint> for NewPoint {
    fn from(p: OldPoint) -> Self {
        NewPoint { x: p.0, y: p.1 }
    }
}
```

## Singleton Pattern

**When**: Exactly one instance of a class should exist, globally accessible.

**Applicability signals**:
- Shared configuration, logging, or connection pool
- Hardware interface (one physical device)
- Cache manager

**Note**: In modern practice, prefer dependency injection over singletons for testability.

```python
# Python — module-level instance (simplest, Pythonic)
# config.py
class _Config:
    def __init__(self):
        self.debug = False
        self.db_url = ""

config = _Config()  # module import ensures singleton

# usage: from config import config
```

```go
// Go — sync.Once (idiomatic Go)
var (
    instance *Database
    once     sync.Once
)

func GetDatabase() *Database {
    once.Do(func() {
        instance = connect()
    })
    return instance
}
```

## Builder Pattern

**When**: An object is complex to construct (many optional parameters, validation needed between steps), or you want to make construction readable.

**Applicability signals**:
- Constructor with many positional parameters, many of which are optional
- Construction involves multiple steps with intermediate validation
- The same construction process should produce different representations

```rust
// Rust — builder with consume-and-recreate
struct Query {
    table: String,
    select: Vec<String>,
    where_clause: Option<String>,
    limit: Option<usize>,
}

struct QueryBuilder {
    table: String,
    select: Vec<String>,
    where_clause: Option<String>,
    limit: Option<usize>,
}

impl QueryBuilder {
    fn new(table: &str) -> Self { /* ... */ }
    fn select(mut self, cols: &[&str]) -> Self { self.select = cols.iter().map(|s| s.to_string()).collect(); self }
    fn limit(mut self, n: usize) -> Self { self.limit = Some(n); self }
    fn build(self) -> Result<Query, Error> {
        // validate required fields
        Ok(Query { table: self.table, select: self.select, where_clause: self.where_clause, limit: self.limit })
    }
}

let q = QueryBuilder::new("users")
    .select(&["id", "name"])
    .limit(10)
    .build()?;
```

```typescript
// TypeScript — class builder
class PizzaBuilder {
    private size: string = "medium";
    private toppings: string[] = [];

    setSize(size: string): this { this.size = size; return this; }
    addTopping(t: string): this { this.toppings.push(t); return this; }
    build(): Pizza { return new Pizza(this.size, this.toppings); }
}
```

## Command Pattern

**When**: You need to parameterize operations, queue them, log them, or support undo/redo.

**Applicability signals**:
- Undo/redo functionality
- Task queues / job scheduling
- Macro recording (record a sequence of operations)
- Remote operation invocation

```python
# Python — callable objects
class Command:
    def execute(self): ...
    def undo(self): ...

class TextInsert(Command):
    def __init__(self, doc, pos, text):
        self.doc = doc; self.pos = pos; self.text = text
    def execute(self):
        self.doc.insert(self.pos, self.text)
    def undo(self):
        self.doc.delete(self.pos, len(self.text))

# History: a list of executed commands for undo
history.append(cmd)
```

```typescript
// TypeScript — function objects
interface Command {
    execute(): void;
    undo(): void;
}

class History {
    private stack: Command[] = [];
    execute(cmd: Command) {
        cmd.execute();
        this.stack.push(cmd);
    }
    undo() {
        const cmd = this.stack.pop();
        cmd?.undo();
    }
}
```

## Iterator Pattern

**When**: You need to traverse a collection without exposing its internal structure, and you want a uniform traversal interface.

**Applicability signals**:
- Collections with different internal structures (array, tree, graph) need the same iteration API
- Lazy/eager traversal choice should not affect calling code
- You need multiple traversal strategies (DFS, BFS, reverse)

```python
# Python — generators (built-in protocol)
def inorder(tree):
    """Tree traversal as iterator — lazy, no extra allocation"""
    if tree.left:
        yield from inorder(tree.left)
    yield tree.value
    if tree.right:
        yield from inorder(tree.right)
```

```rust
// Rust — IntoIterator trait
struct Tree<T>(Option<Box<Node<T>>>);
impl<T> IntoIterator for Tree<T> {
    type Item = T;
    type IntoIter = TreeIter<T>;
    fn into_iter(self) -> Self::IntoIter {
        // custom iterator implementation
    }
}
```

## State Pattern

**When**: An object's behavior changes based on its internal state, and state transitions are explicit and rule-governed.

**Applicability signals**:
- Large `if state == X` / `match state` blocks
- Finite state machine (protocol, workflow, game character)
- States and transitions need to be independently testable

```python
# Python — state as separate objects
class State:
    def handle(self, context): ...

class IdleState(State):
    def handle(self, ctx):
        if ctx.has_input:
            ctx.transition_to(ProcessingState())

class ProcessingState(State):
    def handle(self, ctx):
        ctx.process()
        ctx.transition_to(DoneState())

class StateMachine:
    def __init__(self):
        self.state = IdleState()
    def transition_to(self, new_state):
        self.state = new_state
    def run(self):
        self.state.handle(self)
```

```rust
// Rust — enum-based state machine (compile-time safe)
enum Connection {
    Disconnected,
    Connecting { attempt: u8 },
    Connected { session: Session },
}

impl Connection {
    fn next(self) -> Self {
        match self {
            Self::Disconnected => Self::Connecting { attempt: 0 },
            Self::Connecting { attempt } if attempt < 3 => Self::Connecting { attempt: attempt + 1 },
            Self::Connecting { .. } => Self::Disconnected,
            Self::Connected { session } => { session.send_heartbeat(); self }
        }
    }
}
```

## Template Method Pattern

**When**: An algorithm has a fixed skeleton but allows subclasses to override specific steps.

**Applicability signals**:
- Multiple implementations share the same high-level structure but differ in details
- "Hook methods" in a framework — "override this method to customize behavior"

```python
# Python — class inheritance
class DataProcessor:
    def process(self):
        data = self._load()
        cleaned = self._clean(data)
        result = self._analyze(cleaned)
        self._save(result)

    def _load(self):     raise NotImplementedError
    def _clean(self, data): return data  # default: no cleaning
    def _analyze(self, data): raise NotImplementedError
    def _save(self, result): print(result)  # default: print

class CSVProcessor(DataProcessor):
    def _load(self):           return csv.reader(...)
    def _analyze(self, data):  return compute_stats(data)
```

```typescript
// TypeScript — abstract class
abstract class BuildPipeline {
    build(): void {
        this.checkout();
        this.installDeps();
        this.runLint();
        this.runTests();
        this.package();
    }
    protected abstract checkout(): void;
    protected installDeps(): void { /* default npm install */ }
    protected abstract runLint(): void;
    protected abstract runTests(): void;
    protected package(): void { /* default: tar */ }
}
```

## Pattern Selection Guide

| When you need... | Consider... | When NOT to use |
|------------------|-------------|-----------------|
| Runtime algorithm selection | Strategy | Only one algorithm will ever exist |
| Object creation without concrete types | Factory | The type is always known statically |
| One-to-many notifications | Observer | Push-based polling is simpler (or you don't need loose coupling) |
| Add behavior without subclassing | Decorator | The behavior is permanent and can be added directly |
| Match incompatible interfaces | Adapter | You can modify both sides to agree on an interface |
| Single instance enforcement | Singleton | DI and testability matter more (most cases) |
| Complex object construction | Builder | 2-3 parameters, use named parameters / struct literals |
| Undo/redo, queuing | Command | Simple function call is sufficient |
| Uniform collection traversal | Iterator | The collection is simple and internals are not hidden |
| State-dependent behavior | State | 2-3 states, simple if-else is clearer |
| Fixed algorithm skeleton | Template Method | Steps vary independently (use Strategy instead) |

> **Golden rule**: A pattern is a tool, not a goal. If the simplest solution works (plain function, simple `if`, direct call), use it. Introduce patterns only when the complexity they manage actually exists.
