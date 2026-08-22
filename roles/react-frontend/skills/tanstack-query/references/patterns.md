# TanStack Query Patterns

Concrete TSX/TypeScript patterns for TanStack Query v5 (`@tanstack/react-query`) and TanStack Form (`@tanstack/react-form`) in this project. Stack: React 19, TypeScript, pnpm.

## Table of Contents

1. [Query-Key Factory](#query-key-factory)
2. [Basic useQuery](#basic-usequery)
3. [useSuspenseQuery with Boundaries](#usesuspensequery-with-boundaries)
4. [Dependent Queries with enabled](#dependent-queries-with-enabled)
5. [Mutation with Optimistic Update + Rollback](#mutation-with-optimistic-update--rollback)
6. [Infinite Query](#infinite-query)
7. [Custom Hook Wrapping a Query](#custom-hook-wrapping-a-query)
8. [TanStack Form Bound to a Mutation](#tanstack-form-bound-to-a-mutation)

---

## Query-Key Factory

Centralize key construction so queries and invalidations stay in sync. Keys are hierarchical (broad → narrow) and fully serializable.

```typescript
// src/features/todos/query-keys.ts
export interface TodoFilters {
  status?: "open" | "done";
  assigneeId?: string;
}

export const todoKeys = {
  all: ["todos"] as const,
  lists: () => [...todoKeys.all, "list"] as const,
  list: (filters: TodoFilters) => [...todoKeys.lists(), filters] as const,
  details: () => [...todoKeys.all, "detail"] as const,
  detail: (id: string) => [...todoKeys.details(), id] as const,
};
```

Invalidation by tree level:

```typescript
// Refetch every list variant (all filters)
queryClient.invalidateQueries({ queryKey: todoKeys.lists() });

// Refetch a single detail
queryClient.invalidateQueries({ queryKey: todoKeys.detail(todoId) });
```

---

## Basic useQuery

```typescript
// src/features/projects/use-project.ts
import { useQuery } from "@tanstack/react-query";

interface Project {
  id: string;
  name: string;
  members: string[];
}

async function fetchProject(id: string): Promise<Project> {
  const res = await fetch(`/api/projects/${id}`);
  if (!res.ok) throw new Error(`Failed to load project ${id}`);
  return res.json();
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ["projects", id],
    queryFn: () => fetchProject(id),
    staleTime: 5 * 60 * 1000, // fresh for 5 minutes
    gcTime: 30 * 60 * 1000,   // v5: keep inactive cache for 30 minutes
    enabled: Boolean(id),     // dependent: don't fire until id exists
    select: (data) => data,   // derive here when a subset/slice is needed
  });
}
```

Usage in a component:

```tsx
function ProjectPage({ projectId }: { projectId: string }) {
  const { data, isPending, isError, error, refetch } = useProject(projectId);

  if (isPending) return <ProjectSkeleton />;
  if (isError) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  return <ProjectDetail project={data} />;
}
```

---

## useSuspenseQuery with Boundaries

Let Suspense own the loading state; wrap the data-dependent region in a strategic boundary.

```tsx
// src/features/projects/project-detail.tsx
import { useSuspenseQuery } from "@tanstack/react-query";

function ProjectDetail() {
  // Throws a promise while loading — Suspense catches it
  const { data: project } = useSuspenseQuery({
    queryKey: ["projects", projectId],
    queryFn: () => fetchProject(projectId),
  });

  return <ProjectView project={project} />;
}

export function ProjectSection() {
  return (
    <ErrorBoundary fallback={<ProjectError />}>
      {/* Only this region suspends; page chrome renders immediately */}
      <Suspense fallback={<ProjectSkeleton />}>
        <ProjectDetail />
      </Suspense>
    </ErrorBoundary>
  );
}
```

Match the boundary placement to the `vercel-react-best-practices` `async-suspense-boundaries` rule: suspend only the subtree that needs the data, not the whole page.

---

## Dependent Queries with enabled

`enabled` gates a query until its inputs exist. Use it for user-dependent data, filter-dependent lists, and multi-step lookups.

```typescript
// src/features/issues/use-issues.ts
export function useIssuesForUser(userId: string | null) {
  return useQuery({
    queryKey: ["issues", userId],
    queryFn: () => fetchIssues({ assigneeId: userId }),
    enabled: Boolean(userId), // no fetch until a user is selected
  });
}

// src/features/issues/use-issue-detail.ts
// Chained: needs the issue to exist before fetching its comments
export function useIssueWithComments(issueId: string | undefined) {
  const issue = useQuery({
    queryKey: ["issues", "detail", issueId],
    queryFn: () => fetchIssue(issueId!),
    enabled: Boolean(issueId),
  });

  const comments = useQuery({
    queryKey: ["issues", "detail", issueId, "comments"],
    queryFn: () => fetchComments(issueId!),
    enabled: Boolean(issue?.data?.id), // depends on the first query resolving
  });

  return { issue, comments };
}
```

---

## Mutation with Optimistic Update + Rollback

Update the cache immediately, snapshot for rollback, restore on error, reconcile on settle.

```typescript
// src/features/todos/use-toggle-todo.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Todo {
  id: string;
  title: string;
  completed: boolean;
}

async function toggleTodoOnServer(id: string): Promise<Todo> {
  const res = await fetch(`/api/todos/${id}/toggle`, { method: "POST" });
  if (!res.ok) throw new Error("Toggle failed");
  return res.json();
}

export function useToggleTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => toggleTodoOnServer(id),

    onMutate: async (id: string) => {
      // Cancel in-flight refetches so they don't clobber the optimistic write
      await queryClient.cancelQueries({ queryKey: todoKeys.lists() });

      // Snapshot the current cache for rollback
      const previous = queryClient.getQueryData<Todo[]>(todoKeys.lists());

      // Apply the optimistic change
      queryClient.setQueryData<Todo[]>(todoKeys.lists(), (old) =>
        old?.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
      );

      return { previous }; // passed to onError/onSettled as context
    },

    onError: (_error, _id, context) => {
      // Roll back to the snapshot
      if (context?.previous) {
        queryClient.setQueryData(todoKeys.lists(), context.previous);
      }
    },

    onSettled: () => {
      // Reconcile with the server (background refetch)
      void queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
    },
  });
}
```

Component usage:

```tsx
function TodoItem({ todo }: { todo: Todo }) {
  const toggleTodo = useToggleTodo();

  return (
    <label>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => toggleTodo.mutate(todo.id)}
        disabled={toggleTodo.isPending}
      />
      {todo.title}
    </label>
  );
}
```

---

## Infinite Query

Cursor- or page-based pagination with `useInfiniteQuery`. v5 requires `initialPageParam` and `getNextPageParam`.

```typescript
// src/features/issues/use-infinite-issues.ts
import { useInfiniteQuery } from "@tanstack/react-query";

interface IssuePage {
  items: Issue[];
  nextCursor: string | null;
}

async function fetchIssuePage(cursor: string | null): Promise<IssuePage> {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  const res = await fetch(`/api/issues?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to load issues");
  return res.json();
}

export function useInfiniteIssues() {
  return useInfiniteQuery({
    queryKey: ["issues", "infinite"],
    queryFn: ({ pageParam }) => fetchIssuePage(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}
```

Component with an IntersectionObserver trigger (or a "Load more" button):

```tsx
function IssueFeed() {
  const { data, isPending, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteIssues();

  if (isPending) return <FeedSkeleton />;
  if (isError) return <ErrorState />;

  return (
    <div>
      {data.pages.flatMap((page) => page.items).map((issue) => (
        <IssueCard key={issue.id} issue={issue} />
      ))}
      <button
        onClick={() => void fetchNextPage()}
        disabled={!hasNextPage || isFetchingNextPage}
      >
        {isFetchingNextPage ? "Loading more…" : hasNextPage ? "Load more" : "End of list"}
      </button>
    </div>
  );
}
```

---

## Custom Hook Wrapping a Query

Per the `react-patterns` skill convention: complex hooks return an **object**, not an array. Wrap queries in domain hooks so components never see `queryKey`/`queryFn` plumbing.

```typescript
// src/features/user/use-user.ts
import { useQuery } from "@tanstack/react-query";

export function useUser(userId: string) {
  const query = useQuery({
    queryKey: ["users", "detail", userId],
    queryFn: () => fetchUser(userId),
    staleTime: 60 * 1000,
  });

  return {
    user: query.data,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
```

Components consume the object directly:

```tsx
function UserProfile({ userId }: { userId: string }) {
  const { user, isPending, isError, error, refetch } = useUser(userId);

  if (isPending) return <AvatarSkeleton />;
  if (isError) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  return <ProfileView user={user} />;
}
```

---

## TanStack Form Bound to a Mutation

Typed fields, validation, and submit → mutation, then invalidate the server state.

```tsx
// src/features/issues/create-issue-form.tsx
import { useForm } from "@tanstack/react-form";
import { useCreateIssue } from "./use-create-issue";

interface IssueValues {
  title: string;
  description: string;
}

export function CreateIssueForm() {
  const createIssue = useCreateIssue(); // useMutation → invalidates ["issues"]

  const form = useForm<IssueValues>({
    defaultValues: { title: "", description: "" },
    validators: {
      onChange: ({ value }) => {
        if (value.title.length > 200) return "Title must be 200 characters or fewer";
        return undefined;
      },
      onSubmit: ({ value }) => {
        if (!value.title.trim()) return "Title is required";
        return undefined;
      },
    },
    onSubmit: async ({ value }) => {
      await createIssue.mutateAsync(value);
      form.reset();
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <form.Field
        name="title"
        children={(field) => (
          <label>
            <span>Title</span>
            <input
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              aria-invalid={field.state.meta.errors.length > 0}
            />
            {field.state.meta.errors.map((err) => (
              <span key={err} role="alert">{err}</span>
            ))}
          </label>
        )}
      />
      <form.Field
        name="description"
        children={(field) => (
          <label>
            <span>Description</span>
            <textarea
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </label>
        )}
      />
      <button type="submit" disabled={createIssue.isPending}>
        {createIssue.isPending ? "Creating…" : "Create issue"}
      </button>
    </form>
  );
}
```

```typescript
// src/features/issues/use-create-issue.ts
export function useCreateIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: IssueValues) => createIssue(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["issues"] });
    },
  });
}
```

---

## Anti-Patterns to Avoid

1. **Server state in Zustand** — duplicate cache → drift. Query owns it.
2. **Fetch-after-mutation** — refetching manually instead of invalidating. `invalidateQueries` handles background refetch with dedup.
3. **Inline/unstructured keys** — `["data", obj]` or non-serializable values break cache identity and invalidation.
4. **`enabled: false` forever** — a query disabled by a missing input should be gated by `Boolean(input)`, not hardcoded.
5. **Optimistic updates without snapshot** — no `context.previous` means no rollback path.
6. **Unbounded `staleTime: 0` defaults** — if data barely changes, set `staleTime` to avoid refetch storms on every remount.
7. **Suspense on every query** — wrap only data-critical subtrees; see the suspense-boundaries rule.
