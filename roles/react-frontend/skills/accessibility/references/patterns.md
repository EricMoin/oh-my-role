# Accessible React/TSX Patterns

Concrete ❌/✅ patterns for accessible React UI. Class strings use the project's Tailwind design tokens (see the `tailwindcss` skill) and the `cn()` helper where class composition is needed. Wrappers that render a single native element extend that element's props and spread `...props` so callers keep `aria-*`/`data-*` access (see the `react` skill → *Extend native element props*).

## 1. Accessible button — never `div` with `onClick`

```tsx
// ❌ Bad: a div masquerading as a button
// Not focusable, not activated by Enter/Space, no button semantics for screen readers
<div onClick={onOpen} className="cursor-pointer text-primary">
  Open settings
</div>

// ✅ Good: a real <button> — focusability, Enter/Space activation, and semantics for free
<button
  type="button"
  onClick={onOpen}
  className="rounded-md bg-primary px-4 py-2 text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
>
  Open settings
</button>
```

If a native `<button>` truly cannot be used, replicate the full contract on the custom widget: `role="button"`, `tabIndex={0}`, `onKeyDown` handling for Enter and Space, and `aria-disabled` instead of `disabled` (a `disabled` attribute is skipped by both keyboard and screen readers — see `aria-disabled:` in the `tailwindcss` skill).

```tsx
// ✅ Custom widget (only when a real button is impossible):
// role + tabIndex + Enter/Space handlers + aria-disabled
<div
  role="button"
  tabIndex={0}
  aria-disabled={disabled}
  onClick={disabled ? undefined : onOpen}
  onKeyDown={(event) => {
    if (disabled) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen();
    }
  }}
  className="cursor-pointer"
>
  Open settings
</div>
```

## 2. Accessible dialog — focus in, focus trap, Escape, focus restore

```tsx
// ✅ Accessible dialog: focus moved in on open, trapped while open,
//    Escape dismisses, focus restored to the trigger on close
function Dialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  // On open: remember the trigger and move focus into the dialog
  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement as HTMLElement | null;
      dialogRef.current?.focus();
    }
  }, [open]);

  // Escape to dismiss + trap Tab inside the dialog
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const container = dialogRef.current;
      if (!container) return;
      const focusables = Array.from(
        container.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // On close: restore focus to the trigger
  useEffect(() => {
    if (!open) triggerRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      ref={dialogRef}
      className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4"
    >
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 text-card-foreground shadow-lg">
        <h2 id={titleId} className="text-lg font-semibold">
          {title}
        </h2>
        <div className="mt-4">{children}</div>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 rounded-md border border-input px-4 py-2 focus-visible:ring-2 focus-visible:ring-ring"
        >
          Close
        </button>
      </div>
    </div>
  );
}
```

Key contract: `role="dialog"` + `aria-modal="true"` + `aria-labelledby` (title), `tabIndex={-1}` on the container so it can receive focus, focus trap on Tab, Escape to dismiss, and focus restore to the trigger on close.

## 3. Accessible form field — label + announced error

```tsx
// ❌ Bad: no label, error is color-only and silent to screen readers
<input
  placeholder="Email"
  className={error ? "border-destructive" : "border-input"}
/>

// ✅ Good: labeled input, error linked via aria-describedby and announced via role="alert"
function EmailField({
  id,
  label,
  error,
  ...props
}: { id: string; label: string; error?: string } & React.ComponentProps<"input">) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(
          "rounded-md border border-input px-3 py-2 focus-visible:ring-2 focus-visible:ring-ring",
          error && "border-destructive"
        )}
        {...props}
      />
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
```

Contract: `<label htmlFor={id}>` names the field; `aria-invalid` conveys the invalid state non-visually; `aria-describedby` links the input to the message; `role="alert"` announces the error the moment it is inserted. If the message can appear while already mounted (e.g. server-rendered), use an `aria-live="polite"` region instead. Never rely on placeholder or red borders alone.

## 4. Accessible disclosure & menu — correct roles and keyboard handling

### Disclosure (button + region)

```tsx
// ✅ Accessible disclosure: button controls a named region
function Disclosure({ summary, children }: { summary: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const buttonId = useId();
  const regionId = useId();

  return (
    <div>
      <button
        id={buttonId}
        type="button"
        aria-expanded={open}
        aria-controls={regionId}
        onClick={() => setOpen((value) => !value)}
        className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
      >
        {summary}
      </button>
      {open ? (
        <div id={regionId} role="region" aria-labelledby={buttonId} className="mt-2">
          {children}
        </div>
      ) : null}
    </div>
  );
}
```

`aria-expanded` tells screen readers whether the region is open; `aria-controls` names the controlled element; the region is `role="region"` named by the button via `aria-labelledby={buttonId}`.

### Menu button (WAI-ARIA APG pattern — roving tabindex + arrow keys)

```tsx
// ✅ Accessible menu button: one tab stop, arrow keys move focus, Escape closes and returns focus
function MenuButton({
  items,
}: {
  items: { id: string; label: string; onSelect: () => void }[];
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const buttonId = useId();
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function openMenu() {
    setOpen(true);
    setActiveIndex(0);
  }

  // Keep the active item focused (roving tabindex)
  useEffect(() => {
    if (open) itemRefs.current[activeIndex]?.focus();
  }, [open, activeIndex]);

  function handleMenuKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % items.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + items.length) % items.length);
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(items.length - 1);
    } else if (event.key === "Escape") {
      setOpen(false);
      buttonRef.current?.focus(); // return focus to the trigger
    }
  }

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        id={buttonId}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && !open) openMenu();
        }}
        className="rounded-md border border-input px-4 py-2 focus-visible:ring-2 focus-visible:ring-ring"
      >
        Options
      </button>
      {open ? (
        <ul
          role="menu"
          aria-labelledby={buttonId}
          onKeyDown={handleMenuKeyDown}
          className="absolute z-10 mt-1 w-48 rounded-md border border-border bg-popover p-1 shadow-md"
        >
          {items.map((item, index) => (
            <li key={item.id} role="none">
              <button
                ref={(element) => {
                  itemRefs.current[index] = element;
                }}
                type="button"
                role="menuitem"
                tabIndex={index === activeIndex ? 0 : -1}
                onClick={() => {
                  item.onSelect();
                  setOpen(false);
                  buttonRef.current?.focus();
                }}
                className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
```

Contract: trigger has `aria-haspopup="menu"` + `aria-expanded`; the menu is `role="menu"` labelled by the trigger (`aria-labelledby`); items are `role="menuitem"` wrapped in `role="none"` list items; **roving tabindex** keeps one tab stop while Arrow Up/Down/Home/End move focus; Escape closes the menu and returns focus to the trigger.

## 5. Visually-hidden utility — screen-reader-only text

Tailwind ships `sr-only` built in (see the `tailwindcss` skill). Use it directly for one-off cases, or wrap it in a component:

```tsx
// ✅ Screen-reader-only text (Tailwind's built-in sr-only utility)
<span className="sr-only">This text is visible to screen readers only</span>

// ✅ Component wrapper for reuse
export function VisuallyHidden({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>;
}

// ✅ Usage: give an icon-only control an accessible name
<button type="button" aria-label="Close">
  <XIcon className="size-4" />
</button>
```

The raw CSS equivalent (useful outside Tailwind):

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

## 6. Skip link — jump past navigation

```tsx
// ✅ Skip link: the first focusable element on the page; keyboard users jump straight to content
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
>
  Skip to main content
</a>

<main id="main-content" tabIndex={-1}>
  {/* page content */}
</main>
```

The link is invisible until focused (`sr-only` → `focus:not-sr-only`), then becomes the first visible, focusable element so keyboard and screen-reader users can bypass the nav. `tabIndex={-1}` on `<main>` lets the browser move focus to it without adding it to the tab order.
