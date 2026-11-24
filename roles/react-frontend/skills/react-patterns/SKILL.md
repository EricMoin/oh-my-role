---
name: react
description: Design React DOM components, hooks, state ownership, effects and TypeScript props for the project's supported React versions.
allowed-tools: Read, Grep, Glob
metadata:
  author: Pedro Nauck
  github: https://github.com/pedronauck
  repository: https://github.com/pedronauck/skills
---
# React Development Guide

Check the consuming package's React and React DOM versions, and the peer range for a shared component library. The React 19 examples require that version throughout the supported range.

## Quick Start

1. **Best Practices**: For component architecture, state management, and TypeScript integration, read `references/best-practices.md`
2. **Element wrappers**: Keep native semantics and the public prop contract when creating a reusable primitive. See **Extend native element props** below.
3. **useEffect Patterns**: For understanding when to use (and avoid) useEffect, read `references/useeffect-patterns.md`
4. **Data Fetching**: For TanStack Query patterns, use the `tanstack-query` skill
5. **Forms**: For form handling with TanStack Form, use the `tanstack-query` skill

## Core Principles

- Prefer function components for new UI. Preserve supported class components and existing error boundaries.
- **Single Responsibility**: Keep components small and focused on a single purpose
- Keep local behavior close to the UI that owns it. Extract a hook when it gives shared or complex behavior a clear contract.
- **Feature-Based Organization**: Co-locate related files by feature, not by type
- Match APIs such as `use`, form Actions and `useOptimistic` to the target renderer, framework and peer range.

## Extend native element props

For a primitive that exposes a native element's API, derive its props from that element and pass supported attributes through. For a component that owns a value, event or accessible name, define the narrower contract explicitly.

**Do this:**

| Requirement | Detail |
| ------------- | ------ |
| Base type | `interface XProps extends React.ComponentProps<"button">` (or `"input"`, `"a"`, `"div"`, …) |
| Spreading | Destructure your custom fields, then `{...props}` (and merged `className`) onto the DOM node |
| Ref | React 19 function components can receive `ref` as a prop. Use `forwardRef` when the component must expose a ref to React 18 consumers. [React ref API](https://react.dev/reference/react/forwardRef) |

```typescript
interface TextFieldProps extends React.ComponentProps<"input"> {
  label: string;
  error?: string;
}

function TextField({ label, error, className, ...props }: TextFieldProps) {
  return (
    <label className="flex flex-col gap-1">
      <span>{label}</span>
      <input className={cn("rounded border px-2 py-1", error && "border-destructive", className)} {...props} />
      {error ? <span className="text-destructive text-sm">{error}</span> : null}
    </label>
  );
}
```

**Variants + CVA:** if you use `class-variance-authority`, combine intrinsic props with `VariantProps<typeof variants>` (often `extends React.ButtonHTMLAttributes<HTMLButtonElement>`), following shadcn/ui conventions: define variants with `cva`, merge `className` last via `cn()`, and spread `...props` onto the root element.

**Deep dive:** `references/best-practices.md` → *Extending HTML Elements*.

## Quick Reference Tables

### State ownership

| What owns the value? | Typical implementation |
| --- | --- |
| The mounted component or subtree | Local state, lifted to a common parent as needed |
| The navigation history or shareable link | The existing router's path or search parameters |
| Multiple independent client consumers | Their shared parent, context or the project's existing client store |
| A remote resource | The route's data loader or the existing server-data cache |

### useEffect Decision Tree

| Situation | DON'T | DO |
|-----------|-------|-----|
| Derived state from props/state | `useState` + `useEffect` | Calculate during render |
| Expensive calculations | `useEffect` to cache | `useMemo` |
| Reset state on prop change | `useEffect` with `setState` | `key` prop |
| User event responses | `useEffect` watching state | Event handler directly |
| Notify parent of changes | `useEffect` calling `onChange` | Call in event handler |
| Fetch data | `useEffect` without cleanup | `useEffect` with cleanup OR TanStack Query |

### When You DO Need Effects

- Synchronizing with **external systems** (non-React widgets, browser APIs)
- **Subscriptions** to external stores (use `useSyncExternalStore` when possible)
- **Analytics/logging** that runs because component displayed
- **Data fetching** with proper cleanup (or use TanStack Query)

### When You DON'T Need Effects

1. **Transforming data for rendering** - Calculate at top level, re-runs automatically
2. **Handling user events** - Use event handlers, you know exactly what happened
3. **Deriving state** - Just compute it: `const fullName = firstName + ' ' + lastName`
4. **Chaining state updates** - Calculate all next state in the event handler

## TypeScript Integration

```typescript
// One way to type a function component's props.
interface BrandButtonProps {
  variant: "primary" | "secondary";
  children: React.ReactNode;
}

function BrandButton({ variant, children }: BrandButtonProps) {
  return <button type="button" className={variant}>{children}</button>;
}

// When wrapping a native element, extend its props — see "Extend native element props" above
interface IconButtonProps extends React.ComponentProps<"button"> {
  icon: React.ReactNode;
}
```

## Custom Hooks Guidelines

- Extract related stateful behavior when it has a meaningful hook contract
- Keep hooks focused on single purpose
- Use clear naming: `useXxx` pattern
- Return arrays for state-like hooks, objects for complex returns

```typescript
// State-like hook returns array
function useToggle(initial = false) {
  const [value, setValue] = useState(initial);
  const toggle = useCallback(() => setValue((v) => !v), []);
  return [value, toggle] as const;
}

// Complex hook returns object
function useUser(id: string) {
  const query = useQuery({ queryKey: ["user", id], queryFn: () => fetchUser(id) });
  return {
    user: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
```

## Component Architecture Pattern

```typescript
// Encapsulate the search behavior shared by issue views.
function useIssueSearch(projectId: string) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>({});

  const issues = useQuery({
    queryKey: ["issues", projectId, query, filters],
    queryFn: () => searchIssues(projectId, query, filters),
  });

  return {
    query,
    setQuery,
    filters,
    setFilters,
    issues: issues.data ?? [],
    isLoading: issues.isLoading,
  };
}

function IssueList({ projectId }: { projectId: string }) {
  const { query, setQuery, issues, isLoading } = useIssueSearch(projectId);

  return (
    <div>
      <SearchInput value={query} onChange={setQuery} />
      {isLoading ? <Loading /> : <IssueTable issues={issues} />}
    </div>
  );
}
```

## File Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Components | kebab-case.tsx | `user-avatar.tsx` |
| Hooks | use-kebab-case.ts | `use-user-data.ts` |
| Utilities | camelCase.ts | `formatDate.ts` |
| Types | types.ts | `types.ts` |
| Tests | *.test.tsx | `user-avatar.test.tsx` |

## Testing with Vitest

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { renderHook, act } from "@testing-library/react";

describe("MyComponent", () => {
  it("renders correctly", () => {
    render(<MyComponent />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});

describe("useMyHook", () => {
  it("returns expected value", () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current.value).toBe(expected);
  });
});
```

## Validation Checklist

Before finishing a task involving React:

- [ ] Props and refs preserve the public contract throughout the supported React range
- [ ] Each state value has an owner and the expected lifetime across navigation and remounts
- [ ] useEffect is only used for external system synchronization
- [ ] Rendering failures have the recovery behavior required by this flow
- [ ] Loading and error states are handled
- [ ] Accessibility requirements are met (semantic HTML, keyboard navigation)
- [ ] Run the relevant existing checks using the owning workspace's scripts and package manager

## Detailed References

For comprehensive guidance, consult these reference files:

- `references/best-practices.md` - Component architecture, TypeScript, state management, React 19+ features, testing patterns
- `references/useeffect-patterns.md` - When to use/avoid useEffect, anti-patterns, and better alternatives
