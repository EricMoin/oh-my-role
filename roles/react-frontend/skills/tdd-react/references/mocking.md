# Mocking: When and How

Mocking removes dependencies so a test observes exactly one seam. Mock too little and tests hit the network, the clock, or a real database. Mock too much and tests verify your own mocks' wiring instead of the app's behavior. The governing rule: **mock at the boundary of your system — the network — not at every function in the call chain.**

## Table of Contents

- [When to Mock vs Not](#when-to-mock-vs-not)
- [Mock at the Network Boundary](#mock-at-the-network-boundary)
- [Mocking Modules with `vi.mock`](#mocking-modules-with-vimock)
- [Mocking Fetch / Network](#mocking-fetch--network)
- [Mocking Timers with `vi.useFakeTimers`](#mocking-timers-with-viusefaketimers)
- [The Over-Mocking Anti-Pattern](#the-over-mocking-anti-pattern)

---

## When to Mock vs Not

**Mock when:**
- The dependency is outside your control: network, timers, browser APIs, third-party SDKs
- The dependency is slow or non-deterministic (real network latency, real clocks, real randomness)
- The dependency drags in an unrelated subsystem you don't want to boot (a real database in a component test)

**Don't mock when:**
- The dependency is **your own code** — test it through its real public interface, and let the test exercise the real interaction
- The behavior under test *is* the interaction (e.g. "the component sends the right request") — use a network mock at the boundary, not a mocked function inside the component
- The mock would make the test assert the mock instead of the behavior (see [The Over-Mocking Anti-Pattern](#the-over-mocking-anti-pattern))

---

## Mock at the Network Boundary

For React apps the network boundary is where components talk to HTTP. Mock **there** — with MSW (Mock Service Worker) — and leave everything above it real.

**Why MSW is the preferred network mock for React:**

- It intercepts real `fetch`/XHR at the HTTP layer — the component's own data-fetching code runs unchanged, for real
- It exercises the full request/response flow: loading, success, error, retry, empty states
- The same handlers are reusable in component tests, hook tests, and (with `msw/node`) e2e setups
- It works regardless of whether the app uses `fetch`, `axios`, or TanStack Query's default fetcher

```typescript
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const server = setupServer(
  http.get("/api/users/1", () => HttpResponse.json({ name: "Ada Lovelace" }))
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers()); // undo per-test handler overrides
afterAll(() => server.close());
```

The component under test fetches normally; you assert on what it renders:

```typescript
it("renders the fetched user", async () => {
  render(<UserProfile userId="1" />);

  expect(await screen.findByRole("heading", { name: "Ada Lovelace" })).toBeInTheDocument();
});
```

Per-test overrides use `server.use(...)` — e.g. return a 500 to test the error state:

```typescript
it("shows an error state when the request fails", async () => {
  server.use(http.get("/api/users/1", () => HttpResponse.error()));

  render(<UserProfile userId="1" />);

  expect(await screen.findByRole("alert")).toHaveTextContent("Could not load user");
});
```

---

## Mocking Modules with `vi.mock`

When a module is genuinely out of scope — a third-party SDK, an analytics wrapper, a heavy utility — mock it at the **import boundary**:

```typescript
import { vi } from "vitest";

vi.mock("@/lib/analytics", () => ({
  track: vi.fn(),
}));

// in the test body:
import { track } from "@/lib/analytics";
expect(track).toHaveBeenCalledWith("signup_complete");
```

Rules:

- Vitest **hoists** `vi.mock` to the top of the file regardless of where you write it — write it at the top anyway so the intent is obvious.
- Mock only what the test needs; return small, stable factories. A huge mock object is a maintenance burden and a sign you should reconsider the seam.
- If the mock factory needs variables (e.g. a response payload defined in the test), define them with `vi.hoisted` so they exist before the factory runs:

```typescript
const { mockUser } = vi.hoisted(() => ({ mockUser: { name: "Ada" } }));

vi.mock("@/api/users", () => ({
  fetchUser: vi.fn().mockResolvedValue(mockUser),
}));
```

- Partial mocks: `vi.mock("@/lib/utils", async (importOriginal) => ({ ...(await importOriginal()), formatDate: vi.fn() }))` keeps the real implementation for everything except the function you need to stub.

---

## Mocking Fetch / Network

If MSW is not set up yet, you can stub `fetch` directly — but treat it as a stopgap, not the default. It is fragile: it depends on the app calling `fetch` itself (breaks with `axios` or TanStack Query's adapter), and a global overwrite leaks into other tests.

```typescript
// ❌ Global assignment — leaks across tests, hard to restore, breaks on client libraries
global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ name: "Ada" }) });

// ✅ Spy + restore — scoped, and uses the real Response type
const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
  new Response(JSON.stringify({ name: "Ada" }), { status: 200 })
);
afterEach(() => fetchSpy.mockRestore());
```

Prefer MSW: it intercepts at the same HTTP layer the app uses, so tests survive the app switching from `fetch` to a client, and error/loading states come for free.

---

## Mocking Timers with `vi.useFakeTimers`

For debounce, polling, `setTimeout`-based logic, or anything time-dependent, use fake timers to make time deterministic:

```typescript
import { vi } from "vitest";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers()); // fake timers leak across tests — always restore

it("debounces the search input", async () => {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  const onSearch = vi.fn();
  render(<SearchBox onSearch={onSearch} />);

  await user.type(screen.getByRole("searchbox"), "react");

  vi.advanceTimersByTime(300); // advance past the debounce window

  expect(onSearch).toHaveBeenCalledWith("react");
});
```

Rules:

- **Always restore real timers in `afterEach`.** Fake timers silently leak into every later test in the file.
- **When using `user-event` with fake timers, pass `advanceTimers: vi.advanceTimersByTime`** so interactions advance the clock correctly; otherwise `user-event`'s internal waits hang.
- For `Date.now`/`performance.now`-based logic, combine with `vi.setSystemTime(new Date("2026-01-01T00:00:00Z"))`.
- Prefer `vi.advanceTimersByTime(n)` over `vi.runAllTimers()` unless you genuinely want every pending timer to fire — `runAllTimers` can spin forever on recursive timers.

---

## The Over-Mocking Anti-Pattern

**The anti-pattern: mock every function in the call chain.** The test then verifies that your mocks are wired to each other — not that the app works — and any refactor breaks the test even though the behavior is untouched.

```typescript
// ❌ Over-mocked: three mocks proving the mocks are connected
vi.mock("@/api/client", () => ({ fetchUser: vi.fn().mockResolvedValue(user) }));
vi.mock("@/hooks/useUserQuery", () => ({ useUserQuery: () => ({ data: user, isLoading: false }) }));

it("renders the user", () => {
  render(<UserProfile />);
  expect(screen.getByText(user.name)).toBeInTheDocument();
});
// If the two mocks are wrong in the same way, this passes while the app is broken.
```

```typescript
// ✅ Mocked once at the network boundary — the component's real logic is exercised
server.use(http.get("/api/users/1", () => HttpResponse.json(user)));

it("renders the user", async () => {
  render(<UserProfile userId="1" />);
  expect(await screen.findByText(user.name)).toBeInTheDocument();
});
```

**Signs you are over-mocking:**

- The test setup is longer than the test itself
- The test passes even when the component is visibly broken (mocks "agree" with each other)
- The same mocks are copy-pasted across many test files (hoist them into a shared setup instead)
- You are mocking your own hooks, components, or utilities — those should be tested for real at their own seams

**Default strategy for React:**

1. Real components, real hooks, real rendering — mock only at the seams listed in `SKILL.md`
2. Network mocked at the HTTP boundary with **MSW**
3. Timers faked only when the test needs determinism
4. Third-party modules mocked only when they are irrelevant to the behavior under test
