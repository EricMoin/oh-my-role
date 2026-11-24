---
name: zustand
description: Expert guide for Zustand state management patterns, store organization, and best practices. Use when implementing client state management with Zustand, creating stores, or managing shared UI state across components.
allowed-tools: Read, Grep, Glob
---

# Zustand State Management Guide

Use these examples when the project uses Zustand. In a server-rendered app, scope request-specific state per request and hydrate the client from the same initial data. [Zustand’s Next.js guide](https://zustand.docs.pmnd.rs/learn/guides/nextjs)

## Quick Start

For detailed store patterns, middleware usage, and comprehensive examples, please refer to `references/patterns.md`.

## Core Philosophy

- **State ownership**: Use the store for shared client state. When a route loader or query cache already owns a remote value, read it there.
- **Domain-Specific Stores**: Keep stores focused on specific domains.
- **Type Safety**: Leverage TypeScript for fully typed stores.
- **Simplicity**: Prefer simplicity over complex abstractions.

## Store Organization

### Essential Patterns

- Create separate stores for different domains
- Use slices pattern for large stores
- Keep stores close to features that use them
- Export typed selector hooks for better DX and performance

### Optional middleware

Use just the middleware the store needs. This example combines persistence, DevTools inspection and Immer for nested updates.

```typescript
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const useExampleStore = create<ExampleState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // state and actions
      })),
      { name: "example-storage" }
    ),
    { name: "example-store" }
  )
);
```

### Store Structure Template

```typescript
interface StoreState {
  // State properties
  data: DataType | null;
  isLoading: boolean;
  // Group actions together
  actions: {
    fetchData: () => Promise<void>;
    updateData: (updates: Partial<DataType>) => void;
    reset: () => void;
  };
}
```

### Selector Hooks Pattern

Subscribe to the slices a component reads. Export a reusable selector hook when it helps callers.

```typescript
// Bad - subscribes to entire store
const { user, isLoading } = useAuthStore();

// Good - subscribes only to specific slices
export const useUser = () => useAuthStore((state) => state.user);
export const useIsLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthActions = () => useAuthStore((state) => state.actions);
```

## Best Practices

1. **Keep stores focused** on specific domains
2. **Use TypeScript** for full type safety
3. **Leverage middleware** for common patterns (devtools, persist, immer)
4. **Create selector hooks** for performance
5. **Use immer** for complex nested state updates
6. **Persist only necessary state** - use `partialize` option
7. **Test stores thoroughly**
8. **Handle async operations properly** with loading/error states
9. **Implement optimistic updates** when appropriate
10. **Document store structure** and actions

## Common Tasks

### Creating a New Store

1. Define the state interface with typed actions
2. Create the store with appropriate middleware
3. Export selector hooks for each state slice
4. Expose the store through the feature’s established public entry point

### Persisting State

Use the `persist` middleware with `partialize` to persist only necessary data:

```typescript
persist(
  (set) => ({ /* ... */ }),
  {
    name: "store-key",
    partialize: (state) => ({
      // Only persist these fields
      user: state.user,
      preferences: state.preferences,
    }),
  }
);
```

### Using Immer for Updates

Immer allows mutable-style updates that produce immutable state:

```typescript
immer((set) => ({
  updateNested: (id, value) => {
    set((state) => {
      const item = state.items.find((i) => i.id === id);
      if (item) {
        item.value = value; // Mutable style, but produces immutable state
      }
    });
  },
}));
```

## Validation Checklist

Before finishing a task involving Zustand:

- [ ] Store is domain-specific and focused
- [ ] TypeScript interfaces are properly defined
- [ ] Each selected middleware serves an actual requirement
- [ ] Consumers subscribe to the values they read
- [ ] Actions follow the store's public API
- [ ] Only necessary state is persisted
- [ ] Run the relevant existing workspace checks

For detailed rules, examples, and anti-patterns, please consult `references/patterns.md`.
