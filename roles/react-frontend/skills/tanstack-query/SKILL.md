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

Use Query where it already owns remote data. Compare the route's loader, URL and component state when identifying the owner of a value.

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
  select: (data) => data.members,
});
```

- **`staleTime`** controls freshness. With the v5 defaults, stale queries can refetch when an enabled observer mounts. Choose a longer freshness window when the product permits it.
- **`gcTime`** — how long inactive cached data is kept (v5 renamed `cacheTime`).
- **`enabled`** — gate the query. Set `false` until required inputs exist (dependent queries, auth, filters).
- **`select`** — derive data or pick a subset. The selector result is cached, so it is safe to return new object references; but keep the selector itself stable (defined outside the component or memoized) to avoid recomputation.
- `queryFn` **must throw on error** so Query can retry and surface `error`.

## Mutations

After a successful write, reconcile the affected readers using the mutation response, targeted invalidation or the project's explicit refetch flow.

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

The rollback value returned by `onMutate` is the third argument to `onError` and the fourth to `onSettled`. This list snapshot assumes one outstanding update to the list. For overlapping edits, scope rollback to the edited value or show the pending mutation in the UI. [Mutation callback signatures at v5.90.3](https://github.com/TanStack/query/blob/v5.90.3/docs/framework/react/reference/useMutation.md)

## Query Key Discipline

Query keys are the cache's identity. Two rules:

1. **Hierarchical and structured** — start broad, narrow down: `["todos", "list", { filters }]`. Key order matters for invalidation (invalidating `["todos"]` matches everything under it).
2. **Serializable** — include each changing input to the query function. The default hash treats fresh plain objects with the same serializable properties as equivalent. Array element order matters. [Query key hashing at v5.90.3](https://github.com/TanStack/query/blob/v5.90.3/docs/framework/react/guides/query-keys.md)

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

`invalidateQueries({ queryKey: todoKeys.lists() })` invalidates the matching list variants. Active eligible queries refetch by default.

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

When the project uses `@tanstack/react-form`, its submit handler can call a Query mutation:

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

Select the checks that cover the changed behavior.

- [ ] Readers and writers agree on the owner of the remote data
- [ ] Query keys identify all inputs and support the intended invalidations
- [ ] Freshness and dependent-query behavior match the product's requirements
- [ ] The affected reader displays the saved value after the mutation succeeds
- [ ] A failed optimistic mutation leaves visible data consistent, including any overlapping edits
- [ ] Loading and error states are handled (Suspense + ErrorBoundary, or explicit `isPending`/`isError` branches)
- [ ] Forms using a mutation report its pending, success and failure states
- [ ] Run the relevant existing checks with the workspace's package manager

For complete TSX examples, consult `references/patterns.md`.
