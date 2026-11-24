---
name: tailwindcss
description: Guide for Tailwind CSS v4 patterns and best practices. Use when styling components with Tailwind CSS, creating responsive layouts, or working with Tailwind 4 features. Don't use for plain-CSS authoring, CSS-in-JS libraries (styled-components, emotion), or non-Tailwind utility frameworks.
allowed-tools: Read, Grep, Glob
metadata:
  author: Pedro Nauck
  github: https://github.com/pedronauck
  repository: https://github.com/pedronauck/skills
---
# Tailwind CSS Developer Guide

This skill provides guidelines, patterns, and best practices for working with Tailwind CSS v4 when the consuming project uses v4. Confirm the resolved Tailwind version and the theme loaded by the affected entry point.

## Quick Reference

For detailed patterns, examples, and checklists, see:
- [references/patterns.md](references/patterns.md) - Complete usage patterns, design tokens, and anti-patterns

## Core Principles

- **Utility-First**: Embrace utility-first approach and avoid custom CSS.
- **Design Tokens**: Use the theme utilities and CSS conventions defined by the project.
- **Mobile-First**: Build responsive layouts with mobile-first approach.

## Check the project theme

In v4 a theme variable such as `--color-card` provides a corresponding utility such as `bg-card`. Check the theme for each name before copying the examples. [Tailwind theme variables](https://tailwindcss.com/docs/theme)

Examples from a design system with semantic colors include
- Backgrounds: `bg-background`, `bg-card`, `bg-muted`, `bg-popover`
- Text: `text-foreground`, `text-muted-foreground`, `text-card-foreground`
- Borders: `border-border`, `border-input`, `border-ring`
- Actions: `bg-primary text-primary-foreground`, `bg-secondary text-secondary-foreground`
- States: `bg-destructive text-destructive-foreground`, `bg-accent text-accent-foreground`

The default palette is also available where the project keeps it. Check the rendered color pair in each supported theme.

## Common Tasks

### Long Class Strings

Group class strings if that matches the formatter and improves readability.

```typescript
const cardBaseClasses = [
  'relative flex flex-col rounded-xl border border-border',
  'bg-card text-card-foreground shadow-xs transition-colors duration-150',
]

// Usage: className={cardBaseClasses.join(' ')} or spread into cn()/clsx
```

### Responsive Design

```tsx
// Mobile-first responsive design
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">

// Container queries (built-in in v4)
<div className="@container">
  <div className="@lg:flex @lg:items-center">
```

### Modern v4 Utilities

```tsx
<div className="size-10">          {/* Instead of w-10 h-10 */}
<div className="h-dvh">            {/* Dynamic viewport height */}
<div className="grid-cols-15">     {/* Dynamic grid columns */}
<h1 className="text-shadow-md">    {/* Text shadows */}
<div className="bg-(--custom-color)">  {/* CSS variables */}
```

## Anti-Patterns to Avoid

- Don't use `@apply` except for base styles
- Avoid inline styles when Tailwind has utilities
- Don't create utility classes that duplicate Tailwind
- Never use `!important` unless absolutely necessary
- Don't construct classes dynamically (`bg-${color}-500`)

## Validation Checklist

Before finishing a task involving Tailwind CSS:

- [ ] Chosen utilities generate the intended CSS in the active theme
- [ ] Class strings follow the workspace formatter
- [ ] Mobile-first responsive approach
- [ ] Run the workspace’s styling or build check

For detailed rules, anti-patterns, and configuration examples, see [references/patterns.md](references/patterns.md).
