# Small type patterns and their limits

These are illustrative snippets, not results from the reader's toolchain. Use only a pattern
that solves the current contract, and check it with the project's compiler/options. Prefer
existing domain types and type-test helpers over introducing parallel ones.

## Correlated state

```ts
type LoadState<T> =
  | { status: "idle" }
  | { status: "loaded"; value: T }
  | { status: "failed"; error: Error };

function valueOr<T>(state: LoadState<T>, fallback: T): T {
  return state.status === "loaded" ? state.value : fallback;
}
```

The discriminant preserves which fields exist together. It does not validate JSON that
claims to have this shape. Do not replace an existing error convention just to adopt it.

## Validated brand

```ts
declare const userIdBrand: unique symbol;
type UserId = string & { readonly [userIdBrand]: true };

function parseUserId(value: unknown): UserId {
  if (typeof value !== "string" || !/^u_[0-9]+$/.test(value)) {
    throw new Error("Invalid user id");
  }
  return value as UserId;
}
```

The assertion is localized after a concrete check. The pattern and throw convention are
illustrative domain decisions, not universal ID rules. Branding neither transforms nor
secures the underlying string and does not survive serialization as runtime metadata.

## Preserve a key/result relationship

```ts
function getProperty<T, K extends keyof T>(value: T, key: K): T[K] {
  return value[key];
}

const record = { count: 1, name: "sample" };
const count = getProperty(record, "count"); // inferred number
// @ts-expect-error -- this key is not in record
getProperty(record, "missing");
```

The generic ties a key to its corresponding value. It does not make an arbitrary runtime
string a valid key. Put rejected-call examples in type tests, not executable production code.

## Exhaustiveness for a closed union

```ts
function assertNever(value: never): never {
  throw new Error("Unexpected variant");
}

type Action = { kind: "start" } | { kind: "stop" };
function label(action: Action): string {
  switch (action.kind) {
    case "start": return "Start";
    case "stop": return "Stop";
    default: return assertNever(action);
  }
}
```

Adding an unhandled variant should make the call to `assertNever` fail type checking.
An external payload can still reach the throw; validate it before treating it as `Action`.

## Distribution is a choice

```ts
type Distributed<T> = T extends unknown ? T[] : never;
type Together<T> = [T] extends [unknown] ? T[] : never;
// Distributed<string | number>: string[] | number[]
// Together<string | number>: (string | number)[]
```

Use the one that models the contract. Test union and `never` inputs if they are supported;
recursive combinations can become expensive, so avoid deriving a parser or schema in types
when ordinary runtime code plus a small public type would be clearer.

## Test the consumer contract

Prefer the repository's established exact-type assertion helper when inference precision
matters. A value assignable to an expected type may still be wider, narrower or `any` in ways
a simple assignment misses. Homegrown equality helpers also have edge cases around unions,
overloads and special types; do not claim they prove arbitrary semantic equivalence.

Negative assertions with `@ts-expect-error` must be small and compiled. If the reason for
rejection matters, inspect the unsuppressed diagnostic in a scratch fixture. Runtime test
success alone says nothing about these compile-time expectations.
