---
name: tanstack-query
description: Comprehensive guide for TanStack Query v5 and TanStack Form covering server state fetching, caching, revalidation, mutations, optimistic updates, infinite/paginated queries, query key discipline, and forms bound to server data. Use when fetching or caching server state, synchronizing client data with the server, writing mutations, implementing optimistic updates with rollback, building infinite or paginated queries, dependent queries, or creating forms backed by server data via TanStack Query/TanStack Form. Don't use for pure client UI state (use the zustand skill) or static build-time data (import directly or generate at build).
allowed-tools: Read, Grep, Glob
---

# TanStack Query & TanStack Form Guide

This skill provides guidelines, patterns, and best practices for working with TanStack Query v5 (`@tanstack/react-query`) and TanStack Form (`@tanstack/react-form`) in this project.

## Quick Start

For complete TSX patterns (query-key factories, dependent queries, optimistic updates, infinite queries, custom hooks), see `references/patterns.md`.

## Server State vs Client State

TanStack Query is the **server state** layer: it owns fetching, caching, revalidation, retries, and synchronization with the backend. It is not a general-purpose state manager.

Follow the state-management hierarchy from the `react-patterns` skill:

| Priority | Tool | Use Case |
|----------|------|----------|
| 1 | `useState`/`useReducer` | Component-specific UI state |
| 2 | Zustand | Shared client state across components (see the `zustand` skill) |
| 3 | TanStack Query | Server state and data synchronization |
| 4 | URL state | Shareable application state (TanStack Router) |

Rules of thumb:

- **Server data lives in Query, never in Zustand.** Duplicating server state in a store creates two sources of truth that drift apart. Store only client-derived values (filters, selection, UI flags) in Zustand.
- **Derive from query data during render.** Compute filtered/sorted/aggregated values with `select` or plain derivation — do not copy them into local state.
- **Local `useState` is for ephemeral component state** (open/closed, input drafts, hover) — not for server data.

## Query Fundamentals

A query is a declarative fetch keyed by a structured `queryKey`:

```typescript
const { data, isPending, isError, error, refetch } = useQuery({
  queryKey: ["projects", projectId],
  queryFn: () => fetchProject(projectId),
  staleTime: 5 * 60 * 1000, // 5 minutes — data is fresh, no refetch on remount
  gcTime: 30 * 60 * 1000,   // v5 rename of cacheTime — how long inactive data is kept
  enabled: Boolean(projectId), // dependent queries: skip until a value is ready
  select: (data) => data.members, // derive a slice; stable reference prevents extra renders
});
```

- **`staleTime`** — how long data is considered fresh. Tune per query: short for real-time-ish data, long for stable reference data. Default is 0 (always refetch on mount), which is usually too aggressive.
- **`gcTime`** — how long inactive cached data is kept (v5 renamed `cacheTime`).
- **`enabled`** — gate the query. Set `false` until required inputs exist (dependent queries, auth, filters).
- **`select`** — derive data or pick a subset. The selector result is cached, so it is safe to return new object references; but keep the selector itself stable (defined outside the component or memoized) to avoid recomputation.
- `queryFn` **must throw on error** so Query can retry and surface `error`.

## Mutations

Mutations write to the server and reconcile the cache. Never fetch after a mutation — invalidate or update the cache instead.

```typescript
const queryClient = useQueryClient();

const updateProject = useMutation({
  mutationFn: (patch: ProjectPatch) => api.updateProject(patch),
  onSuccess: () => {
    // Refetch the affected query so the server is the source of truth
    void queryClient.invalidateQueries({ queryKey: ["projects"] });
  },
});
```

- **`isPending`** (v5) / `isError` / `error` — track the mutation's lifecycle for button disabled states and toasts.
- **`mutate`** vs **`mutateAsync`** — `mutate` fires and returns void (use in event handlers); `mutateAsync` returns the promise (use in `onSubmit` or when you need to await).
- On success, prefer `invalidateQueries` over manual cache writes unless you can construct the server response locally (see optimistic updates).

### Optimistic Updates with Rollback

Apply the change to the cache immediately, roll back on failure, and reconcile on settle:

```typescript
const toggleTodo = useMutation({
  mutationFn: (todo: Todo) => api.toggleTodo(todo.id),
  onMutate: async (todo) => {
    await queryClient.cancelQueries({ queryKey: ["todos"] }); // stop in-flight refetch
    const previous = queryClient.getQueryData<Todo[]>(["todos"]);
    queryClient.setQueryData<Todo[]>(["todos"], (old) =>
      old?.map((t) => (t.id === todo.id ? { ...t, completed: !t.completed } : t))
    );
    return { previous }; // snapshot for rollback
  },
  onError: (_err, _todo, context) => {
    if (context?.previous) {
      queryClient.setQueryData(["todos"], context.previous);
    }
  },
  onSettled: () => {
    void queryClient.invalidateQueries({ queryKey: ["todos"] });
  },
});
```

The `onMutate` return value is passed to `onError`/`onSettled` as the third argument — use it to carry the pre-mutation snapshot.

## Query Key Discipline

Query keys are the cache's identity. Two rules:

1. **Hierarchical and structured** — start broad, narrow down: `["todos", "list", { filters }]`. Key order matters for invalidation (invalidating `["todos"]` matches everything under it).
2. **Serializable** — only JSON-serializable values (strings, numbers, booleans, arrays, plain objects). No class instances, functions, or components. Stable references, not inline objects that change identity every render.

Use a **query-key factory** so keys and their consumers stay in sync:

```typescript
export const todoKeys = {
  all: ["todos"] as const,
  lists: () => [...todoKeys.all, "list"] as const,
  list: (filters: TodoFilters) => [...todoKeys.lists(), filters] as const,
  details: () => [...todoKeys.all, "detail"] as const,
  detail: (id: string) => [...todoKeys.details(), id] as const,
};
```

Invalidate partial trees: `invalidateQueries({ queryKey: todoKeys.lists() })` refetches every list variant.

## Suspense & Error Boundaries

For data the UI cannot render without, use `useSuspenseQuery` and let React's Suspense handle the loading state:

```typescript
const { data: project } = useSuspenseQuery({
  queryKey: ["projects", projectId],
  queryFn: () => fetchProject(projectId),
});
```

```tsx
<ErrorBoundary fallback={<ProjectError />}>
  <Suspense fallback={<ProjectSkeleton />}>
    <ProjectDetail />
  </Suspense>
</ErrorBoundary>
```

- Place boundaries **strategically** so the wrapper renders fast while only the data-dependent region suspends — see the `vercel-react-best-practices` skill (`async-suspense-boundaries` rule).
- Pair with an `ErrorBoundary` above the Suspense boundary; errors from a suspended query propagate to the nearest error boundary.
- Do not use suspense for small, fast queries where the fallback flicker outweighs the benefit, or for data needed for layout decisions.

## Forms with TanStack Form

For forms bound to server data, use `@tanstack/react-form` and drive submission through a mutation:

```typescript
const form = useForm({
  defaultValues: { title: "", description: "" },
  validators: {
    onSubmit: ({ value }) => (value.title.trim() ? undefined : "Title is required"),
  },
  onSubmit: async ({ value }) => {
    await createIssue.mutateAsync(value);
  },
});
```

- Fields are **fully typed** from `defaultValues` — no `any`, no stringly-typed access.
- Render fields with `form.Field`; wire `field.handleChange` and read `field.state.value` / `field.state.meta.errors`.
- Per-field `validators` for inline validation; `onSubmit` validator as the final gate.
- **Submit → mutation**: call `form.handleSubmit()` in the form's `onSubmit` handler; the mutation's `isPending` drives the submit button state; `onSuccess` invalidates the affected queries so the server state refreshes.

## Validation Checklist

Before finishing a task involving TanStack Query or TanStack Form:

- [ ] Server state lives in Query, not Zustand or local state
- [ ] Query keys are hierarchical, serializable, and use a query-key factory
- [ ] `staleTime`/`gcTime` are tuned per query; `enabled` gates dependent queries
- [ ] Mutations invalidate (`invalidateQueries`) or update (`setQueryData`) the cache — no fetch-after-mutation
- [ ] Optimistic updates carry a snapshot and roll back in `onError`
- [ ] Loading and error states are handled (Suspense + ErrorBoundary, or explicit `isPending`/`isError` branches)
- [ ] Forms use typed fields and submit through a mutation
- [ ] Run `pnpm typecheck` and `pnpm test` — both green

For complete TSX examples, consult `references/patterns.md`.
