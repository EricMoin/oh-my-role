---
name: ai-designer-system
description: Apple HIG-inspired default design system for the AI Designer suite. Provides concrete design tokens (colors, typography, spacing, border radius, shadows, motion, iconography) and component specifications for use when no project design system exists. Load with ai-designer-core. Override with project-specific tokens when available.
---

# AI Designer — Default Design System

This Skill contains the complete default design system: every color, every spacing value, every type size, every shadow, every motion curve, every component specification. These are concrete values you use directly in design decisions — not principles or philosophy.

All principles governing how and why these tokens exist live in `ai-designer-core.md`. This file answers "what are the values?" — Core answers "why these values?"

## Purpose & When to Use

### This Is the Default Design System

Use these tokens when:

- The project has no existing design system
- The project has a partial design system with gaps — fill gaps from here
- You are prototyping or creating a new project from scratch
- The client has not specified brand colors, typography, or spacing

### When a Project Design System Exists

The project's own design system ALWAYS takes precedence. Specifically:

- **Full override**: The project defines its own color palette → ignore this file's color palette entirely
- **Partial override**: The project defines primary/secondary colors but no spacing scale → use the project's colors with this file's spacing scale
- **Gap filling**: The project defines buttons and inputs but no modal specs → use the project's button/input specs, fall back to this file for modals

### When to Adapt vs Adopt

**Adopt** (use directly) when:
- No project tokens exist for that category
- The project explicitly says "use system defaults"
- You are in early prototyping and the brand identity is not yet defined

**Adapt** (modify based on project context) when:
- The project has a brand color but hasn't defined a full palette — generate the palette using the brand color as primary, following the structure defined here
- The project targets a specific platform (Android, Windows) — adjust platform-specific values (touch targets, navigation patterns) while keeping the token structure
- The project has specific accessibility requirements beyond WCAG AA — tighten contrast ratios and increase minimum sizes accordingly

### What This Skill Provides

Values and rules. Not code. Not implementation. Not CSS classes or React components. When you use these tokens in a design specification, reference them by their semantic name and provide the concrete value.

**Wrong**: "Use the primary color for the button background."
**Right**: "Button background: `color-primary-500` (#007AFF in light mode, #0A84FF in dark mode)."

---

## Design Tokens — Color Palette

Every color token has a light mode value and a dark mode value. Always specify both. Never assume light mode is the default — both modes are equal citizens.

### Semantic Colors

The core palette. These seven colors carry meaning across every interface.

#### Primary — Blue Family

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `color-primary-50` | #EBF5FF | #001A33 | Subtle backgrounds, selected states |
| `color-primary-100` | #CCE5FF | #003366 | Hover backgrounds, light tints |
| `color-primary-200` | #99CBFF | #004D99 | Secondary indicators, progress tracks |
| `color-primary-300` | #66B0FF | #0066CC | Active states, secondary actions |
| `color-primary-400` | #339AFF | #0077EE | Interactive element accents |
| `color-primary-500` | #007AFF | #0A84FF | Primary buttons, links, key actions |
| `color-primary-600` | #0066D6 | #3D9EFF | Hover on primary elements |
| `color-primary-700` | #0052AD | #70B8FF | Visited links, active indicators |
| `color-primary-800` | #003D82 | #A3D1FF | Decorative accents |
| `color-primary-900` | #002952 | #D6EAFF | Subtle text accents |

#### Secondary — Purple Family

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `color-secondary-50` | #F0EFFA | #1A1833 | Subtle backgrounds |
| `color-secondary-100` | #D8D7F0 | #2D2A66 | Hover backgrounds |
| `color-secondary-200` | #B1AEE1 | #433F99 | Decorative elements |
| `color-secondary-300` | #8A86D2 | #5955CC | Badge backgrounds |
| `color-secondary-400` | #6F6BCC | #6964E0 | Secondary interactive elements |
| `color-secondary-500` | #5856D6 | #5E5CE6 | Secondary actions, tags, categories |
| `color-secondary-600` | #4A48B5 | #7B79ED | Hover on secondary elements |
| `color-secondary-700` | #3C3A94 | #9896F3 | Active states |
| `color-secondary-800` | #2E2D73 | #B5B4F7 | Decorative accents |
| `color-secondary-900` | #201F52 | #D2D1FB | Subtle accents |

#### Accent — Pink Family

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `color-accent-50` | #FFF0F3 | #33001A | Subtle notification backgrounds |
| `color-accent-100` | #FFD6DF | #660033 | Badge tints |
| `color-accent-200` | #FFADC0 | #99004D | Notification indicators |
| `color-accent-300` | #FF85A1 | #CC0066 | Highlight accents |
| `color-accent-400` | #FF5C82 | #E6197A | Featured content markers |
| `color-accent-500` | #FF2D55 | #FF375F | Notification badges, promotions |
| `color-accent-600` | #D6264A | #FF5C7F | Hover states |
| `color-accent-700` | #AD1F3F | #FF859F | Active states |
| `color-accent-800` | #851834 | #FFADBF | Decorative |
| `color-accent-900` | #5C1129 | #FFD6DF | Subtle tints |

#### Success — Green

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `color-success-50` | #EDFAF1 | #0A2614 | Success background tints |
| `color-success-100` | #D1F2DA | #144D28 | Positive indicator backgrounds |
| `color-success-200` | #A3E5B5 | #1F733D | Progress completion fills |
| `color-success-300` | #75D890 | #299A51 | Secondary success indicators |
| `color-success-400` | #54CF74 | #2DB85F | Active positive states |
| `color-success-500` | #34C759 | #30D158 | Success messages, confirmations, checkmarks |
| `color-success-600` | #2BA84B | #56DA79 | Hover on success elements |
| `color-success-700` | #22893D | #7DE39A | Active success states |
| `color-success-800` | #196A2F | #A4ECBB | Decorative |
| `color-success-900` | #104B21 | #CBFADC | Subtle success tints |

#### Warning — Orange

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `color-warning-50` | #FFF7EB | #332000 | Warning background tints |
| `color-warning-100` | #FFEACC | #664100 | Caution indicator backgrounds |
| `color-warning-200` | #FFD699 | #996100 | Alert decorative fills |
| `color-warning-300` | #FFC166 | #CC8200 | Secondary warning indicators |
| `color-warning-400` | #FFAD33 | #E69500 | Active caution states |
| `color-warning-500` | #FF9500 | #FF9F0A | Warning banners, pending states, caution icons |
| `color-warning-600` | #D67E00 | #FFB23D | Hover on warning elements |
| `color-warning-700` | #AD6600 | #FFC570 | Active warning states |
| `color-warning-800` | #854F00 | #FFD9A3 | Decorative |
| `color-warning-900` | #5C3700 | #FFECD6 | Subtle warning tints |

#### Error — Red

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `color-error-50` | #FFF0EF | #330A08 | Error background tints |
| `color-error-100` | #FFD6D3 | #661410 | Validation error backgrounds |
| `color-error-200` | #FFADA7 | #991F19 | Destructive action indicators |
| `color-error-300` | #FF857B | #CC2921 | Critical alert fills |
| `color-error-400` | #FF5C4F | #E6342C | Active error states |
| `color-error-500` | #FF3B30 | #FF453A | Error messages, destructive actions, validation failures |
| `color-error-600` | #D63228 | #FF6B62 | Hover on error elements |
| `color-error-700` | #AD2820 | #FF918A | Active error states |
| `color-error-800` | #851F18 | #FFB7B2 | Decorative |
| `color-error-900` | #5C1510 | #FFDCDA | Subtle error tints |

#### Info — Teal

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `color-info-50` | #EDF9FE | #001A26 | Informational background tints |
| `color-info-100` | #CFEFFB | #00334D | Tooltip backgrounds |
| `color-info-200` | #9FE0F8 | #004D73 | Info badge fills |
| `color-info-300` | #6FD0F4 | #00669A | Highlighted info sections |
| `color-info-400` | #3FC1F1 | #0080C0 | Active info indicators |
| `color-info-500` | #5AC8FA | #64D2FF | Info banners, tooltips, help text highlights |
| `color-info-600` | #4CA9D3 | #83DBFF | Hover on info elements |
| `color-info-700` | #3E8AAD | #A2E4FF | Active info states |
| `color-info-800` | #306B86 | #C1EDFF | Decorative |
| `color-info-900` | #224C60 | #E0F6FF | Subtle info tints |

### Neutral Scale

Neutrals form the backbone of every interface — backgrounds, text, borders, dividers. These are gray tones with a very slight cool undertone.

| Token | Hex Value | Usage |
|-------|-----------|-------|
| `neutral-50` | #F9FAFB | Page backgrounds (light mode), subtle surface tints |
| `neutral-100` | #F3F4F6 | Card backgrounds (light mode), input backgrounds |
| `neutral-200` | #E5E7EB | Borders (light mode), dividers, separators |
| `neutral-300` | #D1D5DB | Disabled text backgrounds, secondary borders |
| `neutral-400` | #9CA3AF | Placeholder text, disabled icons |
| `neutral-500` | #6B7280 | Secondary text, metadata, timestamps |
| `neutral-600` | #4B5563 | Body text (light mode), secondary labels |
| `neutral-700` | #374151 | Primary text (light mode), headings |
| `neutral-800` | #1F2937 | High-emphasis text (light mode), card backgrounds (dark mode) |
| `neutral-900` | #111827 | Maximum contrast text (light mode), page backgrounds (dark mode) |

#### Neutral Usage in Dark Mode

In dark mode, the neutral scale inverts its role:

| Light Mode Usage | Token | Dark Mode Usage |
|------------------|-------|-----------------|
| Page background | `neutral-50` #F9FAFB | Highest-emphasis text |
| Card background | `neutral-100` #F3F4F6 | High-emphasis text |
| Borders | `neutral-200` #E5E7EB | Secondary text |
| Disabled backgrounds | `neutral-300` #D1D5DB | Tertiary text, placeholders |
| Placeholder text | `neutral-400` #9CA3AF | Disabled text (same role) |
| Secondary text | `neutral-500` #6B7280 | Borders, dividers |
| Body text | `neutral-600` #4B5563 | Elevated surface borders |
| Headings | `neutral-700` #374151 | Elevated surfaces, card backgrounds |
| High-emphasis text | `neutral-800` #1F2937 | Surface backgrounds |
| Maximum contrast | `neutral-900` #111827 | Page backgrounds |

### Apple-Inspired System Colors

These map directly to Apple's dynamic system colors. Use them for platform-native feel.

| System Color | Light Mode | Dark Mode | Semantic Role |
|-------------|-----------|-----------|---------------|
| `systemBlue` | #007AFF | #0A84FF | Links, primary actions, tint color |
| `systemGreen` | #34C759 | #30D158 | Success, positive values, active states |
| `systemIndigo` | #5856D6 | #5E5CE6 | Secondary actions, categories, tags |
| `systemOrange` | #FF9500 | #FF9F0A | Warnings, attention-needed, pending |
| `systemPink` | #FF2D55 | #FF375F | Notifications, badges, favorites |
| `systemPurple` | #AF52DE | #BF5AF2 | Creative tools, rich media, premium |
| `systemRed` | #FF3B30 | #FF453A | Errors, destructive actions, critical alerts |
| `systemTeal` | #5AC8FA | #64D2FF | Information, help, secondary highlight |
| `systemYellow` | #FFCC00 | #FFD60A | Starred items, ratings, highlights |

#### Accessibility-Safe System Color Pairs

These pairings meet WCAG AA (4.5:1 for normal text, 3:1 for large text):

| Foreground | Background | Contrast Ratio | WCAG Level |
|-----------|-----------|----------------|------------|
| `systemBlue` #007AFF | White #FFFFFF | 4.5:1 | AA (normal text) |
| `systemBlue` #0A84FF | `neutral-900` #111827 | 5.2:1 | AA (normal text) |
| `systemRed` #FF3B30 | White #FFFFFF | 4.0:1 | AA (large text only) |
| `systemRed` #FF453A | `neutral-900` #111827 | 4.8:1 | AA (normal text) |
| `systemGreen` #34C759 | `neutral-900` #111827 | 7.1:1 | AAA |
| `systemGreen` #30D158 | `neutral-900` #111827 | 7.5:1 | AAA |
| `neutral-700` #374151 | White #FFFFFF | 9.1:1 | AAA |
| `neutral-50` #F9FAFB | `neutral-900` #111827 | 16.8:1 | AAA |

**Rule**: Never use `systemYellow` (#FFCC00) or `systemOrange` (#FF9500) as text on white backgrounds — contrast ratios fall below 3:1. Use them only for icons, badges, or backgrounds with dark text.

### Semantic Usage Mapping

These tokens abstract the color system into functional roles. Reference these in component specifications rather than raw color values.

#### Light Mode Semantic Tokens

| Semantic Token | Maps To | Hex Value | Role |
|---------------|---------|-----------|------|
| `background-primary` | `neutral-50` | #F9FAFB | Page background |
| `background-secondary` | White | #FFFFFF | Cards, elevated surfaces |
| `surface` | White | #FFFFFF | Primary content surface |
| `surface-secondary` | `neutral-100` | #F3F4F6 | Grouped content, sidebar |
| `surface-tertiary` | `neutral-200` | #E5E7EB | Nested surfaces, inset content |
| `on-surface` | `neutral-900` | #111827 | Primary text on surface |
| `on-surface-secondary` | `neutral-500` | #6B7280 | Secondary text on surface |
| `on-surface-tertiary` | `neutral-400` | #9CA3AF | Placeholder text, hints |
| `on-primary` | White | #FFFFFF | Text on primary-colored backgrounds |
| `on-error` | White | #FFFFFF | Text on error-colored backgrounds |
| `border-default` | `neutral-200` | #E5E7EB | Standard borders and dividers |
| `border-strong` | `neutral-300` | #D1D5DB | Emphasized borders, input borders |
| `border-focus` | `color-primary-500` | #007AFF | Focus rings, selected borders |
| `disabled-background` | `neutral-100` | #F3F4F6 | Disabled element backgrounds |
| `disabled-text` | `neutral-400` | #9CA3AF | Disabled element text |
| `placeholder` | `neutral-400` | #9CA3AF | Input placeholder text |
| `overlay` | Black | rgba(0,0,0,0.50) | Modal overlays, scrims |

#### Dark Mode Semantic Tokens

| Semantic Token | Maps To | Hex Value | Role |
|---------------|---------|-----------|------|
| `background-primary` | `neutral-900` | #111827 | Page background |
| `background-secondary` | `neutral-800` | #1F2937 | Cards, elevated surfaces |
| `surface` | `neutral-800` | #1F2937 | Primary content surface |
| `surface-secondary` | `neutral-700` | #374151 | Grouped content, sidebar |
| `surface-tertiary` | `neutral-600` | #4B5563 | Nested surfaces, inset content |
| `on-surface` | `neutral-50` | #F9FAFB | Primary text on surface |
| `on-surface-secondary` | `neutral-400` | #9CA3AF | Secondary text on surface |
| `on-surface-tertiary` | `neutral-500` | #6B7280 | Placeholder text, hints |
| `on-primary` | White | #FFFFFF | Text on primary-colored backgrounds |
| `on-error` | White | #FFFFFF | Text on error-colored backgrounds |
| `border-default` | `neutral-700` | #374151 | Standard borders and dividers |
| `border-strong` | `neutral-600` | #4B5563 | Emphasized borders, input borders |
| `border-focus` | `color-primary-500` | #0A84FF | Focus rings, selected borders |
| `disabled-background` | `neutral-700` | #374151 | Disabled element backgrounds |
| `disabled-text` | `neutral-500` | #6B7280 | Disabled element text |
| `placeholder` | `neutral-500` | #6B7280 | Input placeholder text |
| `overlay` | Black | rgba(0,0,0,0.70) | Modal overlays, scrims |

### Color Accessibility Reference

#### Minimum Contrast Ratios (WCAG 2.1 AA)

| Text Type | Minimum Ratio | Example Passing Pairs |
|-----------|--------------|----------------------|
| Normal text (<18pt / <14pt bold) | 4.5:1 | `neutral-700` on White, `neutral-50` on `neutral-900` |
| Large text (≥18pt / ≥14pt bold) | 3:1 | `color-primary-500` on White, `systemOrange` on `neutral-900` |
| UI components (icons, borders) | 3:1 | `neutral-400` on White (3.1:1), `neutral-500` on `neutral-900` (3.4:1) |
| Non-text contrast | 3:1 | Chart colors against background, focus indicators |

#### Color-Blind Safe Combinations

Never rely on color alone to convey meaning. Always pair color with:
- Text labels (e.g., "Success" alongside green indicator)
- Icons (e.g., checkmark for success, X for error)
- Patterns (e.g., striped vs solid chart fills)

Safe color distinction pairs for the three most common types of color vision deficiency:

| Pair | Protanopia Safe | Deuteranopia Safe | Tritanopia Safe |
|------|:-:|:-:|:-:|
| Blue (#007AFF) + Red (#FF3B30) | ✓ | ✓ | ✓ |
| Blue (#007AFF) + Orange (#FF9500) | ✓ | ✓ | ✗ |
| Green (#34C759) + Red (#FF3B30) | ✗ | ✗ | ✓ |
| Purple (#5856D6) + Orange (#FF9500) | ✓ | ✓ | ✓ |
| Blue (#007AFF) + Yellow (#FFCC00) | ✓ | ✓ | ✓ |

**Rule**: Never use green-vs-red as the sole differentiator. Always add a secondary indicator (icon, label, position).

---

## Design Tokens — Typography

All type values reference the Apple SF Pro family as the primary design target. The font stack gracefully degrades across platforms. (See ai-designer-visual.md § Visual Hierarchy for the principles governing typographic hierarchy.)

### Font Stack

| Priority | Font | Platform |
|----------|------|----------|
| 1 | SF Pro Display / SF Pro Text | macOS, iOS |
| 2 | -apple-system | Apple fallback |
| 3 | Inter | Cross-platform web |
| 4 | system-ui | OS-native fallback |
| 5 | Segoe UI | Windows |
| 6 | Roboto | Android |
| 7 | Helvetica Neue | Legacy Apple |
| 8 | sans-serif | Final fallback |

**Monospace stack**: SF Mono, ui-monospace, JetBrains Mono, Cascadia Code, Fira Code, Menlo, Consolas, monospace.

### Font Weights

| Weight Name | Numeric Value | Usage |
|-------------|:---:|-------|
| Regular | 400 | Body text, descriptions, long-form content |
| Medium | 500 | Emphasis within body, labels, navigation items |
| Semibold | 600 | Headlines, subheadings, button text, table headers |
| Bold | 700 | High-emphasis headings, key statistics, call-to-action text |

**Rule**: Never use more than 3 weight variations on a single screen. Two is ideal: one for body (Regular) and one for emphasis (Semibold or Bold).

### Type Scale

Every level specifies: size, weight, line-height ratio, letter-spacing, and intended usage.

| Level | Size | Weight | Line Height | Letter Spacing | Usage |
|-------|:----:|:------:|:-----------:|:--------------:|-------|
| Large Title | 34pt | Regular (400) | 1.2 (41pt) | +0.37pt | Hero sections, onboarding screens, feature headings |
| Title 1 | 28pt | Regular (400) | 1.2 (34pt) | +0.36pt | Page titles, major section headings |
| Title 2 | 22pt | Regular (400) | 1.25 (28pt) | +0.35pt | Section headings, dialog titles |
| Title 3 | 20pt | Regular (400) | 1.25 (25pt) | +0.38pt | Sub-section headings, card titles |
| Headline | 17pt | Semibold (600) | 1.3 (22pt) | -0.43pt | List item titles, toolbar titles, inline headings |
| Body | 17pt | Regular (400) | 1.5 (26pt) | -0.43pt | Primary content, paragraphs, descriptions |
| Callout | 16pt | Regular (400) | 1.5 (24pt) | -0.32pt | Secondary content, supporting information, quotes |
| Subheadline | 15pt | Regular (400) | 1.4 (21pt) | -0.24pt | Tertiary content, list subtitles, metadata |
| Footnote | 13pt | Regular (400) | 1.4 (18pt) | -0.08pt | Supplementary info, timestamps, attributions |
| Caption 1 | 12pt | Regular (400) | 1.35 (16pt) | 0pt | Labels, tags, badges, input hints |
| Caption 2 | 11pt | Regular (400) | 1.3 (14pt) | +0.07pt | Legal text, fine print, tertiary metadata |

#### Type Scale Ratios

The scale follows an approximate ratio of 1.125 (major second) between adjacent sizes. This produces a harmonious progression:

- 11 → 12 → 13 → 15 → 16 → 17 → 20 → 22 → 28 → 34
- Ratio between extremes: 34/11 ≈ 3.09

For projects needing a tighter scale, use 1.067 (minor second). For more dramatic hierarchy, use 1.25 (major third).

### Line Height Rules

| Content Type | Line Height | When to Use |
|-------------|:-----------:|-------------|
| Display / headings | 1.2 | Titles, hero text, any text ≥ 22pt |
| Standard headings | 1.25 | Section headings 20-22pt |
| UI text | 1.3–1.4 | Navigation, labels, short strings |
| Body text | 1.5 | Paragraphs, descriptions, primary content |
| Long-form reading | 1.6 | Articles, documentation, multi-paragraph content |
| Compact UI | 1.2 | Badges, tags, single-line constrained elements |

**Rule**: Line height below 1.2 causes descender/ascender collisions in multi-line text. Never go below 1.2 for any multi-line content.

### Letter Spacing (Tracking)

| Size Range | Letter Spacing | Rationale |
|-----------|:-:|-------|
| ≥ 28pt | +0.35pt to +0.37pt | Larger sizes need slight positive tracking for openness |
| 20pt–22pt | +0.35pt to +0.38pt | Moderate positive tracking for clarity |
| 15pt–17pt | -0.24pt to -0.43pt | Tighter tracking at body sizes improves readability |
| 11pt–13pt | -0.08pt to +0.07pt | Near-zero tracking; let the typeface's native spacing work |

**Rule**: Positive tracking increases with size. Negative tracking is appropriate only for body-range sizes (15-17pt) where the typeface benefits from tightening.

### Typographic Pairings

| Heading Font | Body Font | Character |
|-------------|-----------|-----------|
| SF Pro Display | SF Pro Text | Apple-native, clean, neutral |
| Inter | Inter | Cross-platform, highly legible |
| SF Pro Display | Inter | Mixed: Apple headings, cross-platform body |

**Rule**: Maximum two typeface families per project. One serif + one sans-serif is acceptable. Two serif or two sans-serif families that are too similar create visual confusion.

### Minimum Text Sizes

| Context | Minimum Size | Rationale |
|---------|:---:|-------|
| Body text on desktop | 16pt | Below 16pt, extended reading causes eye strain |
| Body text on mobile | 16pt | Same — do not reduce for smaller screens |
| UI labels | 12pt | Below 12pt, legibility degrades on standard displays |
| Legal / fine print | 11pt | Absolute minimum for any visible text |
| Touch target labels | 14pt | Must be readable at arm's length |

**Rule**: If you find yourself setting text below 11pt, the information either needs to be removed or restructured, not shrunk.

---

## Design Tokens — Spacing & Layout

All spacing is built on a 4pt base unit. Every spacing value in this system is a multiple of 4. No exceptions. This creates consistent vertical and horizontal rhythm across every component and layout. (See ai-designer-psychology.md § Gestalt Principles in UI for the proximity and alignment principles governing spacing decisions.)

### Base Unit

**4pt**. Every measurement derives from this.

Why 4pt and not 8pt: A 4pt grid provides finer control for small components (icons, badges, dense tables) while still scaling cleanly. 8pt is a subset of 4pt — every 8pt value is a valid 4pt value, but not vice versa.

### Spacing Scale

| Token | Value | Common Usage |
|-------|:-----:|------|
| `spacing-1` | 4pt | Icon-to-text gap, inline element separation, tight padding |
| `spacing-2` | 8pt | Related element gap, compact list item padding, small component internal padding |
| `spacing-3` | 12pt | Input internal padding (vertical), tight card padding, chip content padding |
| `spacing-4` | 16pt | Standard component padding, list item padding, mobile gutter, form field gap |
| `spacing-5` | 20pt | Card internal padding (standard), comfortable element separation |
| `spacing-6` | 24pt | Section separator, tablet gutter, dialog internal padding |
| `spacing-7` | 32pt | Major section separation, header-to-content gap, desktop gutter |
| `spacing-8` | 40pt | Page section separation, prominent visual breaks |
| `spacing-9` | 48pt | Large section gaps, feature section padding |
| `spacing-10` | 64pt | Hero section padding, major layout separation |
| `spacing-11` | 80pt | Page-level vertical rhythm, landing page section gaps |
| `spacing-12` | 96pt | Maximum standard section gap, footer separation |
| `spacing-13` | 128pt | Extreme spacing — hero areas, splash screens |

### Component Spacing Patterns

#### Internal Padding (Inside Components)

| Component | Horizontal | Vertical | Notes |
|-----------|:---:|:---:|-------|
| Button (small) | 12pt | 6pt | Compact actions |
| Button (medium) | 16pt | 10pt | Standard actions |
| Button (large) | 24pt | 14pt | Primary call-to-action |
| Input field | 12pt | 10pt | Standard text input |
| Card | 16pt–20pt | 16pt–20pt | 16pt for compact, 20pt for spacious |
| Dialog | 24pt | 24pt | All four sides |
| Table cell | 12pt | 10pt | Horizontal more than vertical |
| Badge / Tag | 8pt | 4pt | Tight, content-hugging |
| Tooltip | 8pt | 6pt | Compact, non-intrusive |
| Dropdown item | 12pt | 10pt | Match input field padding |

#### External Margins (Between Components)

| Relationship | Spacing | Rationale |
|-------------|:---:|-------|
| Related elements (label → input) | 8pt | Tight coupling signals relationship |
| Sibling elements (input → input) | 16pt | Standard separation |
| Sub-sections | 24pt | Visible grouping boundary |
| Major sections | 32pt–48pt | Clear topic change |
| Page sections | 64pt–96pt | Dramatic break, new context |

### Layout Dimensions

#### Content Width

| Context | Max Width | Rationale |
|---------|:---:|-------|
| Readable text (articles, docs) | 680pt | 65-75 characters per line at 17pt body |
| Form content | 540pt | Optimal for label + input scanning |
| Wide content (tables, dashboards) | 1200pt | Maximum before peripheral vision strain |
| Full-bleed content (hero, media) | 100% | Edge-to-edge, no max width |

#### Safe Area Insets

| Edge | Value | Context |
|------|:-----:|---------|
| Top | 44pt | Notched devices (iPhone) status bar + dynamic island |
| Top (non-notched) | 20pt | Standard status bar |
| Bottom | 34pt | Home indicator area (notched devices) |
| Bottom (non-notched) | 0pt | No reserved space |
| Left/Right | 16pt | Minimum side padding on any device |

#### Gutter Widths

| Screen Class | Gutter | Usage |
|-------------|:---:|-------|
| Compact (mobile < 600pt) | 16pt | Between grid columns, outside margins |
| Regular (tablet 600–1024pt) | 24pt | Between grid columns, outside margins |
| Expanded (desktop > 1024pt) | 32pt | Between grid columns, outside margins |

### Responsive Breakpoints

| Breakpoint | Width | Columns | Behavior |
|-----------|:---:|:---:|-------|
| Compact | < 600pt | 4 | Single column, stacked layouts, full-width components |
| Regular | 600–1024pt | 8 | Two-column where beneficial, sidebar optional |
| Expanded | > 1024pt | 12 | Multi-column, sidebar + content, dashboard layouts |

#### Breakpoint Behavior Rules

- **Compact → Regular**: Transition stacked layouts to side-by-side. Navigation moves from bottom tab bar to sidebar. Modals go from full-screen to centered overlays.
- **Regular → Expanded**: Add tertiary columns (e.g., detail pane). Increase content width maximums. Sidebar becomes persistent (always visible).
- **Never hide content at smaller breakpoints** — reorganize, reflow, or provide progressive disclosure, but never remove information entirely.

### Grid System

| Property | Compact | Regular | Expanded |
|----------|:---:|:---:|:---:|
| Columns | 4 | 8 | 12 |
| Gutter | 16pt | 24pt | 32pt |
| Outside margin | 16pt | 24pt | 32pt–64pt |
| Column minimum | 64pt | 64pt | 64pt |

**Rule**: Content blocks snap to column boundaries. A card spanning 3 of 12 columns is valid. A card spanning 3.5 columns is not. Fractional column spans indicate a grid violation.

---

## Design Tokens — Border Radius

Border radius controls perceived softness and approachability. Apple's design language favors generous radii with continuous corners (squircles).

### Border Radius Scale

| Token | Value | Usage |
|-------|:---:|-------|
| `radius-none` | 0pt | Sharp edges: tables, full-width dividers, code blocks |
| `radius-xs` | 2pt | Subtle rounding: inline code, micro-badges |
| `radius-sm` | 4pt | Slight softening: tags, chips, small buttons |
| `radius-md` | 8pt | Standard components: buttons, inputs, dropdowns |
| `radius-lg` | 12pt | Elevated surfaces: cards, panels, containers |
| `radius-xl` | 16pt | Prominent surfaces: modals, dialogs, sheets |
| `radius-2xl` | 20pt | Extra-prominent surfaces: popovers, onboarding cards |
| `radius-full` | 9999pt | Pill shape: badges, avatar frames, toggle tracks |

### Component-Specific Radius

| Component | Radius Token | Value | Rationale |
|-----------|-------------|:---:|-------|
| Button | `radius-md` | 8pt | Balanced — not too sharp, not too soft |
| Input field | `radius-md` | 8pt | Matches buttons for visual cohesion |
| Card | `radius-lg` | 12pt | Softens elevated surfaces, signals containment |
| Modal / Dialog | `radius-xl` | 16pt | Prominent rounding signals overlay importance |
| Popover | `radius-2xl` | 20pt | Maximum standard rounding for floating elements |
| Badge / Pill | `radius-full` | 9999pt | Full pill shape for compact indicators |
| Avatar | `radius-full` | 9999pt | Circular framing for profile images |
| Tooltip | `radius-md` | 8pt | Matches standard component rounding |
| Switch / Toggle track | `radius-full` | 9999pt | Pill-shaped track |
| Checkbox | `radius-sm` | 4pt | Slight rounding, still recognizably square |
| Table | `radius-none` | 0pt | Sharp edges for data density |
| Code block | `radius-md` | 8pt | Softened container for code content |

### Continuous Corners (Squircle)

Apple uses superellipse-based corner rounding (CSS: `border-radius` with a smooth interpolation) rather than simple circular arcs. The visual difference:

- **Circular radius**: Abrupt transition from straight edge to curve
- **Continuous radius (squircle)**: Gradual, organic transition — the curve begins before the mathematical radius point

**Implementation note**: Standard CSS `border-radius` produces circular corners. For a closer Apple-native feel, use `border-radius` with `mask-image` or `-webkit-mask-composite` techniques, or accept the circular approximation which is visually acceptable for most web contexts.

**Rule**: Consistent radius is more important than squircle accuracy. Never mix radius values arbitrarily — every radius on a screen must come from the scale above.

---

## Design Tokens — Shadows & Elevation

Shadows create the illusion of physical depth. They communicate hierarchy: what sits above what. Apple's design language uses subtle, layered shadows rather than single aggressive drop shadows.

### Shadow Elevation Scale

Each level uses two shadow layers for realism: a tighter "contact" shadow and a broader "ambient" shadow.

#### Light Mode Shadows

| Level | Name | Shadow Definition | Usage |
|:---:|-------|-------|-------|
| 0 | Flat | none | Inline elements, flat cards, items within scrollable lists |
| 1 | Subtle | 0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06) | Slight lift: buttons at rest, input fields, toolbar |
| 2 | Card | 0 2px 4px rgba(0,0,0,0.06), 0 4px 6px rgba(0,0,0,0.06) | Standard elevation: cards, tiles, raised surfaces |
| 3 | Dropdown | 0 4px 8px rgba(0,0,0,0.08), 0 8px 16px rgba(0,0,0,0.08) | Floating elements: dropdowns, popovers, menus |
| 4 | Modal | 0 8px 16px rgba(0,0,0,0.10), 0 16px 32px rgba(0,0,0,0.10) | High elevation: modals, dialogs, bottom sheets |
| 5 | Toast | 0 12px 24px rgba(0,0,0,0.12), 0 24px 48px rgba(0,0,0,0.12) | Maximum elevation: toasts, notifications, snackbars |

#### Dark Mode Shadows

In dark mode, traditional dark shadows become invisible against dark backgrounds. Use two approaches:

**Approach 1 — Border glow (preferred for dark mode)**:

| Level | Name | Implementation | Usage |
|:---:|-------|-------|-------|
| 0 | Flat | none | Same as light mode |
| 1 | Subtle | 1px solid rgba(255,255,255,0.06) border | Slight separation |
| 2 | Card | 1px solid rgba(255,255,255,0.08) border + background shift | Surface distinction |
| 3 | Dropdown | 1px solid rgba(255,255,255,0.10) border + 0 4px 8px rgba(0,0,0,0.30) | Floating element distinction |
| 4 | Modal | 1px solid rgba(255,255,255,0.12) border + 0 8px 16px rgba(0,0,0,0.40) | Modal distinction with subtle shadow |
| 5 | Toast | 1px solid rgba(255,255,255,0.14) border + 0 12px 24px rgba(0,0,0,0.50) | Maximum distinction |

**Approach 2 — Background elevation (Apple's approach)**:

Instead of shadows, elevate surfaces by lightening their background color:

| Level | Light Mode Background | Dark Mode Background |
|:---:|-------|-------|
| 0 | `surface` #FFFFFF | `neutral-900` #111827 |
| 1 | `surface` #FFFFFF | `neutral-800` #1F2937 |
| 2 | `surface` #FFFFFF | `neutral-700` #374151 |
| 3 | `surface` #FFFFFF | `neutral-600` #4B5563 |

**Rule**: In dark mode, "higher" elements are literally lighter in color. This mimics how physical objects closer to a light source appear brighter.

### Shadow Usage Rules

- Never apply more than one elevation level to a single element
- Elevation must increase as elements stack (dropdown over card, modal over dropdown)
- Interactive elements (buttons, links) do not gain elevation on hover — use color changes instead
- Cards within cards: inner card is flat (level 0), outer card holds the elevation
- Scrolling content does not cast shadows on the scroll container unless at the edge

### Focus Ring Specification

Focus rings are not shadows but are specified here for completeness.

| Property | Value | Notes |
|----------|-------|-------|
| Width | 3pt | Visible on all backgrounds |
| Offset | 2pt | Gap between element edge and ring |
| Color (light mode) | `color-primary-500` #007AFF at 50% opacity | Matches primary brand color |
| Color (dark mode) | `color-primary-500` #0A84FF at 50% opacity | Brighter for dark backgrounds |
| Style | Solid outline | Not a box-shadow — use actual outline for accessibility |

---

## Design Tokens — Motion & Animation

Motion communicates state changes, guides attention, and provides continuity. Every animation in this system serves a purpose — decorative animation is excluded. (See ai-designer-interaction.md § Motion & Animation Principles for the principles governing when and why to animate.)

### Duration Scale

| Token | Duration | Usage |
|-------|:---:|-------|
| `duration-instant` | 100ms | Micro-interactions: toggle state, checkbox tick, button color change |
| `duration-fast` | 200ms | Standard transitions: hover effects, tooltip appearance, fade in/out |
| `duration-normal` | 300ms | Layout changes: panel expand/collapse, tab switch, slide transitions |
| `duration-slow` | 500ms | Major transitions: page transition, modal entrance, complex layout shifts |
| `duration-deliberate` | 800ms | Dramatic transitions: onboarding sequences, celebration animations |

**Rule**: If an animation takes longer than 300ms, the user must be able to interact with other elements during the animation. Never block interaction for animation duration.

### Easing Curves

| Token | Curve | CSS Value | Usage |
|-------|-------|-----------|-------|
| `ease-out` | Deceleration | cubic-bezier(0, 0, 0.2, 1) | Elements entering the screen — fast start, smooth stop |
| `ease-in` | Acceleration | cubic-bezier(0.4, 0, 1, 1) | Elements leaving the screen — slow start, fast exit |
| `ease-in-out` | Standard | cubic-bezier(0.4, 0, 0.2, 1) | Elements moving within the screen — accelerate then decelerate |
| `ease-linear` | Constant | linear | Progress bars, continuous animations, loading spinners |
| `ease-spring` | Bounce | cubic-bezier(0.34, 1.56, 0.64, 1) | Playful entrances, toggle snaps, attention-grabbing |

#### Easing Selection Rules

| Scenario | Easing | Duration | Example |
|----------|--------|:---:|---------|
| Element appears | `ease-out` | 200-300ms | Modal fading in, toast sliding up |
| Element disappears | `ease-in` | 100-200ms | Modal fading out, tooltip hiding |
| Element moves | `ease-in-out` | 200-300ms | Sidebar sliding, panel resizing |
| State change (color, opacity) | `ease-out` | 100-200ms | Button hover, focus ring |
| Loading/progress | `ease-linear` | Continuous | Progress bar fill, spinner rotation |
| Spring/bounce effect | `ease-spring` | 300-500ms | Toggle snap, card entrance |

### Apple Spring Animation Parameters

For native-feeling animations, these spring parameters produce Apple-like motion:

| Parameter | Tight Spring | Standard Spring | Gentle Spring |
|-----------|:---:|:---:|:---:|
| Mass | 1 | 1 | 1 |
| Stiffness | 500 | 350 | 200 |
| Damping | 30 | 25 | 20 |
| Character | Snappy, minimal bounce | Balanced, slight settle | Soft, visible settle |
| Usage | Toggle, switch | Modal entrance, sheet | Page transition, onboarding |

**Approximate CSS equivalent** for standard spring: `cubic-bezier(0.34, 1.2, 0.64, 1)` with `duration-normal` (300ms). True spring physics require JavaScript animation libraries.

### Transition Patterns

#### Enter/Exit Pairs

Every entrance animation has a matching exit animation. Enter is always slower than exit (users need more time to register new content than to see it leave).

| Pattern | Enter | Exit |
|---------|-------|------|
| Fade | 200ms ease-out, opacity 0→1 | 150ms ease-in, opacity 1→0 |
| Slide up | 300ms ease-out, translateY 16pt→0 + opacity 0→1 | 200ms ease-in, translateY 0→8pt + opacity 1→0 |
| Slide down | 300ms ease-out, translateY -16pt→0 + opacity 0→1 | 200ms ease-in, translateY 0→-8pt + opacity 1→0 |
| Scale | 300ms ease-out, scale 0.95→1 + opacity 0→1 | 200ms ease-in, scale 1→0.98 + opacity 1→0 |
| Slide from right | 300ms ease-out, translateX 100%→0 | 200ms ease-in, translateX 0→100% |

### Reduced Motion

When `prefers-reduced-motion: reduce` is active:

- **All non-essential animations**: Disabled entirely (duration: 0ms)
- **Essential state transitions** (e.g., loading spinner, progress bar): Reduced to instant crossfade or simplified motion
- **Parallax effects**: Disabled
- **Auto-playing animations**: Stopped
- **Hover animations**: Reduced to instant color change (no transition duration)
- **Page transitions**: Instant cut (no slide or fade)

**Essential animations** (never fully disable):
- Loading spinner (reduce to simple pulse or static indicator)
- Progress bar (allow fill animation but remove easing)
- Focus ring appearance (instant, no transition)

**Rule**: A reduced-motion user must receive the same information as a full-motion user. Remove the animation, never the content it reveals.

---

## Design Tokens — Iconography

Icons are visual shorthand. They accelerate recognition and reduce cognitive load when used correctly. They increase cognitive load when used as decoration. (See ai-designer-core.md § Information Architecture Principles for icon-as-navigation principles.)

### Icon Size Scale

Aligned with SF Symbols sizing for Apple-native consistency.

| Token | Size | Stroke Weight | Usage |
|-------|:---:|:---:|-------|
| `icon-xs` | 16pt | 1.5pt | Inline with small text, status indicators, checkbox marks |
| `icon-sm` | 20pt | 1.5pt | Inline with body text, list item icons, form field icons |
| `icon-md` | 24pt | 2pt | Standard UI icons, toolbar, navigation, action buttons |
| `icon-lg` | 28pt | 2pt | Prominent icons, section headers, empty state illustrations |
| `icon-xl` | 32pt | 2pt | Feature icons, onboarding steps, primary navigation (tab bar) |

### Icon Alignment Rules

| Scenario | Alignment | Gap |
|----------|-----------|:---:|
| Icon + text (horizontal) | Icon vertically centered with text x-height | 4pt (xs/sm icon) or 8pt (md/lg/xl icon) |
| Icon + text (vertical/stacked) | Icon centered above text, text centered below | 4pt |
| Icon in button | Icon vertically and horizontally centered in hit area | 8pt from text |
| Icon-only button | Icon centered in 44×44pt minimum touch target | — |
| Icon in input | Icon vertically centered, 12pt from input edge | 8pt from text |

### Optical Alignment

Icons must be visually centered, not mathematically centered. Common adjustments:

- **Play/arrow icons**: Shift 1-2pt toward the point direction to compensate for visual weight imbalance
- **Circular icons** (e.g., radio button): No adjustment needed
- **Asymmetric icons** (e.g., flag, chat bubble): Shift toward the heavier visual side by 1pt
- **Text-adjacent icons**: Align to the text baseline, not the text midline, for icons that have a flat bottom edge

### Icon Style Rules

- **Outlined icons** for interactive/navigation elements (buttons, tabs, links)
- **Filled icons** for selected/active states (selected tab, toggled favorite)
- **Consistent weight**: All icons in a set must share the same stroke weight. Mixing 1.5pt and 2pt icons in the same toolbar breaks visual cohesion
- **Minimum padding**: 2pt clear space around every icon within its bounding box

### Icon as Communication

| Icon Purpose | Must Be Accompanied By | Exception |
|-------------|----------------------|-----------|
| Navigation action | Text label (below or beside) | Universally recognized: back arrow, close X, hamburger menu |
| Status indicator | Text explanation nearby | Color + icon pairs for success/error (if both present) |
| Feature icon | Feature name | Never — features always need labels |
| Decorative | Nothing (but question if needed) | — |

**Rule**: If removing an icon and keeping only its label would not reduce comprehension, the icon is decorative. Remove it or accept the decorative cost.

---

## Component Specifications

Each component specification defines: size variants, internal dimensions, states, and token mapping. This section provides the data needed to build every standard component. (See ai-designer-interaction.md § Interaction Patterns for behavioral specifications.)

### Buttons

#### Button Size Variants

| Variant | Height | Horizontal Padding | Min Width | Font Size | Font Weight | Icon Size | Radius |
|---------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Small | 32pt | 12pt | 64pt | 14pt | Semibold (600) | 16pt | `radius-md` 8pt |
| Medium | 44pt | 16pt | 80pt | 16pt | Semibold (600) | 20pt | `radius-md` 8pt |
| Large | 56pt | 24pt | 120pt | 18pt | Semibold (600) | 24pt | `radius-md` 8pt |

#### Button Types

| Type | Background | Text Color | Border | Usage |
|------|-----------|-----------|--------|-------|
| Primary (filled) | `color-primary-500` | `on-primary` (White) | None | Main call-to-action. One per visible area. |
| Secondary (outlined) | Transparent | `color-primary-500` | 1pt `color-primary-500` | Supporting actions. Multiple allowed. |
| Tertiary (text-only) | Transparent | `color-primary-500` | None | Low-emphasis actions: Cancel, Skip, Learn More. |
| Destructive | `color-error-500` | `on-error` (White) | None | Delete, Remove, Revoke. Requires confirmation. |

#### Button States

| State | Background Modifier | Text Modifier | Additional |
|-------|----------|-------|------------|
| Default | As defined by type | As defined by type | — |
| Hover | Darken background 5% | No change | Cursor: pointer |
| Active / Pressed | Darken background 10% | No change | Scale: 0.98 (optional) |
| Focus | No color change | No change | Focus ring: 3pt outline, 2pt offset, primary color 50% opacity |
| Disabled | 40% opacity (entire button) | 40% opacity | Cursor: not-allowed. No hover/active effects. |
| Loading | Same as default | Hidden (replaced by spinner) | 20pt spinner centered. Button width locked (no shrink). |

### Input Fields

#### Input Dimensions

| Property | Value | Notes |
|----------|:---:|-------|
| Height | 44pt | Standard touch-friendly height |
| Horizontal padding | 12pt | Left and right |
| Vertical padding | 10pt | Top and bottom |
| Border width | 1pt | Default state |
| Border radius | `radius-md` 8pt | Consistent with buttons |
| Font size | 16pt | Prevents mobile zoom on focus (iOS zooms inputs < 16pt) |
| Font weight | Regular (400) | Body weight for input text |
| Label font size | 14pt | Above the input |
| Label font weight | Medium (500) | Distinct from input text |
| Label gap | 8pt | Space between label and input top edge |
| Helper text size | 12pt | Below the input |
| Helper text gap | 4pt | Space between input bottom edge and helper text |

#### Input States

| State | Border Color | Background | Label Color | Additional |
|-------|-------------|-----------|-------------|------------|
| Default | `border-strong` #D1D5DB | `surface` #FFFFFF | `on-surface-secondary` #6B7280 | — |
| Hover | `neutral-400` #9CA3AF | `surface` #FFFFFF | `on-surface-secondary` #6B7280 | Border darkens slightly |
| Focus | `color-primary-500` #007AFF | `surface` #FFFFFF | `color-primary-500` #007AFF | Label turns primary color. 2pt border. Focus ring. |
| Filled | `border-strong` #D1D5DB | `surface` #FFFFFF | `on-surface-secondary` #6B7280 | Same as default but with value |
| Error | `color-error-500` #FF3B30 | `color-error-50` #FFF0EF | `color-error-500` #FF3B30 | Error message below in error color |
| Disabled | `neutral-200` #E5E7EB | `disabled-background` #F3F4F6 | `disabled-text` #9CA3AF | 60% opacity. No interaction. |

#### Input Dark Mode States

| State | Border Color | Background | Label Color |
|-------|-------------|-----------|-------------|
| Default | `border-strong` #4B5563 | `surface` #1F2937 | `on-surface-secondary` #9CA3AF |
| Hover | `neutral-400` #9CA3AF | `surface` #1F2937 | `on-surface-secondary` #9CA3AF |
| Focus | `color-primary-500` #0A84FF | `surface` #1F2937 | `color-primary-500` #0A84FF |
| Filled | `border-strong` #4B5563 | `surface` #1F2937 | `on-surface-secondary` #9CA3AF |
| Error | `color-error-500` #FF453A | `color-error-50` #330A08 | `color-error-500` #FF453A |
| Disabled | `neutral-700` #374151 | `disabled-background` #374151 | `disabled-text` #6B7280 |

### Cards

#### Card Dimensions

| Property | Value | Notes |
|----------|:---:|-------|
| Padding | 16pt–20pt | 16pt for compact, 20pt for standard |
| Border radius | `radius-lg` 12pt | Generous rounding signals containment |
| Shadow | Level 2 (Card) | See § Shadows & Elevation |
| Border (dark mode) | 1pt rgba(255,255,255,0.08) | Replaces shadow in dark mode |
| Content gap | 12pt | Between internal sections (header, body, footer) |
| Image radius (inner) | 8pt | Slightly less than card radius |

#### Card Content Layout

| Section | Typography | Spacing |
|---------|-----------|---------|
| Card title | Title 3 (20pt, Regular) | 0pt top (first element) |
| Card subtitle | Subheadline (15pt, Regular), `on-surface-secondary` | 4pt below title |
| Card body | Body (17pt, Regular) | 12pt below subtitle |
| Card footer (actions) | — | 12pt above, aligned to card bottom |
| Card metadata | Caption 1 (12pt, Regular), `on-surface-tertiary` | 8pt below body |

### Navigation Components

#### Tab Bar (Bottom Navigation — iOS Pattern)

| Property | Value | Notes |
|----------|:---:|-------|
| Height | 49pt | Apple standard (excluding safe area) |
| Safe area addition | 34pt | Bottom safe area on notched devices |
| Total height (notched) | 83pt | 49pt + 34pt |
| Icon size | 24pt (`icon-md`) | Centered above label |
| Label size | 10pt | Below icon, Caption 2 scale |
| Icon-to-label gap | 2pt | Tight vertical stacking |
| Item width | Equal distribution | Total width / number of items |
| Maximum items | 5 | Beyond 5, use "More" tab |
| Active color | `color-primary-500` | Both icon and label |
| Inactive color | `neutral-400` #9CA3AF | Both icon and label |

#### Sidebar Navigation

| Property | Value | Notes |
|----------|:---:|-------|
| Width | 260pt | Standard sidebar width |
| Min width (collapsible) | 72pt | Icon-only collapsed state |
| Max width | 320pt | User-resizable upper bound |
| Item height | 40pt | Standard navigation item |
| Item padding | 12pt horizontal, 8pt vertical | Internal padding |
| Item radius | `radius-md` 8pt | Rounded items |
| Active item background | `color-primary-50` #EBF5FF (light) / `color-primary-900` #002952 (dark) | Subtle highlight |
| Active item text color | `color-primary-500` | Primary color for emphasis |
| Section header | Caption 1 (12pt), `on-surface-tertiary`, uppercase | Group labels |
| Section gap | 24pt | Between navigation sections |

#### Header / Navigation Bar

| Property | Value | Notes |
|----------|:---:|-------|
| Height | 44pt | Apple standard navigation bar |
| Title font | Headline (17pt, Semibold) | Centered or left-aligned |
| Large title font | Large Title (34pt, Bold) | iOS large title style |
| Large title area height | 96pt | Expanded state |
| Back button hit area | 44×44pt | Minimum touch target |
| Trailing action spacing | 8pt | Between trailing buttons |
| Background | `surface` with blur | Translucent with backdrop blur |
| Border bottom | 1pt `border-default` | Separator from content |

### Lists

#### List Row Dimensions

| Variant | Row Height | Usage |
|---------|:---:|-------|
| Standard | 44pt | Text-only rows, settings items |
| Subtitle | 60pt | Title + subtitle or description |
| Image | 60pt | Leading image/avatar + text |
| Large image | 88pt | Prominent image + multi-line text |

#### List Row Layout

| Property | Value | Notes |
|----------|:---:|-------|
| Leading edge padding | 16pt | From screen/container edge to content |
| Trailing edge padding | 16pt | From content to screen/container edge |
| Leading accessory gap | 12pt | Space between leading icon/image and text |
| Trailing accessory gap | 8pt | Space between text and trailing accessory |
| Separator height | 1pt | Hairline divider (0.5pt on retina) |
| Separator inset (leading) | 16pt | Aligned with text start, not row edge |
| Separator inset (with image) | 60pt | Aligned with text start (past image) |
| Text vertical padding | 10pt | Top and bottom within row |

#### List Row States

| State | Background | Separator | Notes |
|-------|-----------|-----------|-------|
| Default | Transparent | Visible | — |
| Hover | `neutral-100` #F3F4F6 (light) / `neutral-700` #374151 (dark) | Visible | Subtle highlight |
| Pressed | `neutral-200` #E5E7EB (light) / `neutral-600` #4B5563 (dark) | Visible | Deeper highlight |
| Selected | `color-primary-50` #EBF5FF (light) / `color-primary-900` #002952 (dark) | Visible | Active/selected state |
| Swipe action revealed | Row slides to reveal action buttons | Hidden | Action buttons below |

### Modals & Dialogs

#### Modal Dimensions

| Property | Value | Notes |
|----------|:---:|-------|
| Max width | 540pt | Prevents overly wide dialogs |
| Min width | 280pt | Prevents overly narrow dialogs |
| Padding | 24pt | All four sides |
| Border radius | `radius-xl` 16pt | Prominent rounding |
| Shadow | Level 4 (Modal) | See § Shadows & Elevation |
| Overlay | `overlay` rgba(0,0,0,0.50) light / rgba(0,0,0,0.70) dark | Background dim |
| Title font | Title 3 (20pt, Regular) | Dialog heading |
| Body font | Body (17pt, Regular) | Dialog content |
| Button spacing | 12pt gap | Between action buttons |
| Title-to-body gap | 16pt | After title, before body |
| Body-to-actions gap | 24pt | After body, before buttons |

#### Modal Types

| Type | Behavior | Mobile Width | Desktop Width |
|------|----------|:---:|:---:|
| Alert dialog | Centered, no dismiss on overlay click | 280pt | 320pt |
| Confirmation dialog | Centered, dismiss on overlay click | 320pt | 420pt |
| Form dialog | Centered, scroll if overflow | Full width - 32pt | 480pt–540pt |
| Bottom sheet | Slides up from bottom, drag to dismiss | Full width | 480pt max |
| Full-screen modal | Covers entire viewport | Full | Full (with close button) |

#### Modal Animation

| Action | Animation | Duration | Easing |
|--------|-----------|:---:|-------|
| Open (centered) | Scale 0.95→1 + opacity 0→1 | 300ms | `ease-out` |
| Close (centered) | Scale 1→0.98 + opacity 1→0 | 200ms | `ease-in` |
| Open (bottom sheet) | Slide up from below viewport | 300ms | Spring (standard) |
| Close (bottom sheet) | Slide down past viewport | 200ms | `ease-in` |
| Overlay appear | Opacity 0→1 | 300ms | `ease-out` |
| Overlay disappear | Opacity 1→0 | 200ms | `ease-in` |

### Badges & Tags

| Property | Badge (count) | Tag (label) |
|----------|:---:|:---:|
| Height | 20pt | 24pt |
| Min width | 20pt (circular for single digit) | — |
| Horizontal padding | 6pt | 8pt |
| Vertical padding | 2pt | 4pt |
| Font size | 11pt | 12pt |
| Font weight | Semibold (600) | Medium (500) |
| Border radius | `radius-full` 9999pt | `radius-sm` 4pt |
| Background | `color-accent-500` / `color-error-500` | `neutral-100` (light) / `neutral-700` (dark) |
| Text color | White | `on-surface` |

### Tooltips

| Property | Value | Notes |
|----------|:---:|-------|
| Max width | 240pt | Prevents overly wide tooltips |
| Padding | 8pt horizontal, 6pt vertical | Compact |
| Font size | 12pt (Caption 1) | Small, supplementary |
| Font weight | Regular (400) | Non-intrusive |
| Background | `neutral-800` #1F2937 (light mode) / `neutral-100` #F3F4F6 (dark mode) | Inverted for contrast |
| Text color | White (light mode) / `neutral-900` #111827 (dark mode) | Maximum contrast |
| Border radius | `radius-md` 8pt | Standard rounding |
| Shadow | Level 3 (Dropdown) | Floating element |
| Arrow size | 6pt | Equilateral triangle pointing to trigger |
| Delay (show) | 500ms | Prevents accidental triggers |
| Delay (hide) | 100ms | Fast dismissal |
| Animation | Fade in, 150ms `ease-out` | Subtle entrance |

### Toggle / Switch

| Property | Value | Notes |
|----------|:---:|-------|
| Track width | 51pt | Apple standard switch width |
| Track height | 31pt | Apple standard switch height |
| Track radius | `radius-full` 9999pt | Pill shape |
| Thumb diameter | 27pt | Slightly smaller than track height |
| Thumb inset | 2pt | From track edge |
| Track color (off) | `neutral-300` #D1D5DB (light) / `neutral-600` #4B5563 (dark) | Inactive state |
| Track color (on) | `color-success-500` #34C759 (light) / `color-success-500` #30D158 (dark) | Active state |
| Thumb color | White #FFFFFF | Both states |
| Thumb shadow | 0 2px 4px rgba(0,0,0,0.15) | Subtle depth |
| Animation | 200ms spring (tight) | Snappy toggle feel |

---

## Design System Governance

These rules govern how tokens are managed over the lifecycle of a project. Tokens are a contract — changing them has ripple effects across every component.

### Token Naming Convention

Format: `{category}-{property}-{variant}`

| Category | Property Examples | Variant Examples | Full Example |
|----------|---------|---------|-------|
| `color` | `primary`, `error`, `neutral` | `50`–`900`, `light`, `dark` | `color-primary-500` |
| `spacing` | (numbered scale) | `1`–`13` | `spacing-4` |
| `radius` | `none`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `full` | — | `radius-lg` |
| `shadow` | `flat`, `subtle`, `card`, `dropdown`, `modal`, `toast` | — | `shadow-card` |
| `duration` | `instant`, `fast`, `normal`, `slow`, `deliberate` | — | `duration-fast` |
| `ease` | `out`, `in`, `in-out`, `linear`, `spring` | — | `ease-out` |
| `icon` | `xs`, `sm`, `md`, `lg`, `xl` | — | `icon-md` |

### When to Extend vs Override

**Extend** (add new tokens alongside existing ones):
- Project needs a tertiary color not in this system → add `color-tertiary-*` tokens
- Project needs a 6pt spacing value → add `spacing-1.5` (6pt) between existing tokens
- Project has unique component sizes → add project-specific size tokens

**Override** (replace a default token value):
- Project's brand blue is #2563EB, not #007AFF → override `color-primary-500` only
- Project uses 8pt base grid, not 4pt → override all spacing tokens
- Project requires larger touch targets (52pt not 44pt) → override component heights

**Never override**:
- Token naming structure
- Semantic role mapping (e.g., primary means "main action")
- Accessibility minimums (contrast ratios, touch target sizes)

### Token Versioning Rules

- **Never change a token value once established in production** — add a new token instead
- `color-primary-500: #007AFF` is permanent once shipped. If brand changes, introduce `color-primary-v2-500: #2563EB` and migrate
- Deprecation: mark old tokens as deprecated for 2 release cycles before removal
- **Additive changes are always safe**: new tokens, new variants, new components
- **Destructive changes require migration**: changing values, removing tokens, renaming tokens

### Audit Checklist

Before finalizing any design that uses this system, verify:

- [ ] Every color reference uses a semantic token, not a raw hex value
- [ ] Every spacing value exists in the spacing scale (no arbitrary values)
- [ ] Every border radius uses a radius token from the scale
- [ ] Every shadow uses an elevation level, not a custom shadow
- [ ] Every animation uses a duration + easing token combination
- [ ] Every icon uses a size from the icon scale
- [ ] Light mode and dark mode tokens are both specified
- [ ] All text meets WCAG AA contrast requirements
- [ ] All interactive elements meet 44×44pt minimum touch target
- [ ] No more than 3 font weights are used on any single screen

---

## Responsive Design Rules

Responsive design is not "make it smaller." It is adaptive information architecture — different screen sizes demand different layouts, interactions, and component choices.

### Mobile-First Approach

Design for compact first, then enhance for larger screens. Every design starts at < 600pt width.

**Why mobile-first is non-negotiable**:
- Forces content prioritization — you cannot fit everything, so you must decide what matters
- Additive enhancement is simpler than subtractive reduction
- Mobile traffic exceeds desktop globally

### Touch Targets

| Standard | Minimum Size | Recommended Size | Source |
|----------|:---:|:---:|-------|
| Apple HIG | 44×44pt | 44×44pt | Human Interface Guidelines |
| WCAG 2.5.5 (AAA) | 44×44px | 44×44px | Web Content Accessibility Guidelines |
| WCAG 2.5.8 (AA) | 24×24px | 44×44px | Target Size (Minimum) |
| Recommended | 44×44pt | 48×48pt | Combining standards |

**Rule**: Interactive elements smaller than 44×44pt must have padding or margin that extends the touch area to at least 44×44pt. The visual element can be smaller; the hit area cannot.

### Breakpoint Behavior Per Component

| Component | Compact (< 600pt) | Regular (600–1024pt) | Expanded (> 1024pt) |
|-----------|-------|--------|---------|
| Navigation | Bottom tab bar (49pt) | Sidebar (260pt, collapsible) | Persistent sidebar (260pt) |
| Cards | Full width, stacked | 2-column grid | 3 or 4-column grid |
| Tables | Horizontal scroll or card view | Full table, optional horizontal scroll | Full table, no scroll |
| Modals | Full-screen sheet | Centered overlay, 480pt max | Centered overlay, 540pt max |
| Forms | Single column, full width | Single column, 540pt max centered | Two-column where logical |
| Images | Full width, 16:9 | Constrained width, original ratio | Constrained width, original ratio |
| Lists | Full width | Full width with more content per row | Master-detail layout |
| Button groups | Stacked vertically, full width | Horizontal, right-aligned | Horizontal, right-aligned |

### Content Reflow Rules

| Screen Size | Layout Strategy |
|------------|----------------|
| < 600pt | Single column. Stack everything. Full-width components. |
| 600–768pt | Selective two-column. Sidebar + content OR content + aside. |
| 768–1024pt | Comfortable two-column. More breathing room. |
| 1024–1200pt | Multi-column. Sidebar + content + optional detail. |
| > 1200pt | Multi-column with max-width constraint. Center content, don't stretch. |

**Rule**: Content never stretches beyond 1200pt total width. Beyond that, add margins, not columns.

### Responsive Typography Adjustments

| Type Level | Compact | Regular | Expanded |
|-----------|:---:|:---:|:---:|
| Large Title | 28pt | 34pt | 34pt |
| Title 1 | 24pt | 28pt | 28pt |
| Title 2 | 20pt | 22pt | 22pt |
| Title 3 | 18pt | 20pt | 20pt |
| Headline | 16pt | 17pt | 17pt |
| Body | 16pt | 17pt | 17pt |
| Callout | 15pt | 16pt | 16pt |
| Subheadline | 14pt | 15pt | 15pt |

**Rule**: Body text never drops below 16pt, even on compact screens. Reduce heading sizes instead — the hierarchy still works at smaller differentials.

### Responsive Spacing Adjustments

| Spacing Role | Compact | Regular | Expanded |
|-------------|:---:|:---:|:---:|
| Page padding | 16pt | 24pt | 32pt |
| Section gap | 32pt | 48pt | 64pt |
| Component gap | 12pt | 16pt | 16pt |
| Card padding | 16pt | 20pt | 20pt |
| Grid gutter | 16pt | 24pt | 32pt |

---

## Book Source Appendix

The design tokens, component specifications, and rules in this Skill are informed by these foundational texts. Each section maps to one or more sources.

| Section | Primary Source | Supporting Sources |
|---------|---------------|-------------------|
| Purpose & When to Use | Design Systems (Alla Kholmatova) | Atomic Design (Brad Frost) |
| Color Palette | Interaction of Color (Josef Albers) | Apple Human Interface Guidelines, Refactoring UI (Adam Wathan & Steve Schoger) |
| Typography | Thinking with Type (Ellen Lupton) | The Elements of Typographic Style (Robert Bringhurst), Apple Human Interface Guidelines |
| Spacing & Layout | Grid Systems in Graphic Design (Josef Müller-Brockmann) | Refactoring UI (Adam Wathan & Steve Schoger) |
| Border Radius | Apple Human Interface Guidelines | Refactoring UI (Adam Wathan & Steve Schoger) |
| Shadows & Elevation | Apple Human Interface Guidelines | Refactoring UI (Adam Wathan & Steve Schoger) |
| Motion & Animation | Apple Human Interface Guidelines | The Illusion of Life (Frank Thomas & Ollie Johnston) |
| Iconography | Apple Human Interface Guidelines (SF Symbols) | Universal Principles of Design (Lidwell, Holden, Butler) |
| Component Specifications | Atomic Design (Brad Frost) | Apple Human Interface Guidelines, Design Systems (Alla Kholmatova) |
| Design System Governance | Design Systems (Alla Kholmatova) | Atomic Design (Brad Frost) |
| Responsive Design | Mobile First (Luke Wroblewski) | Responsive Web Design (Ethan Marcotte) |

### Source Detail

| Book | Author(s) | Key Contribution to This Skill |
|------|-----------|-------------------------------|
| Atomic Design | Brad Frost | Component hierarchy: atoms → molecules → organisms → templates → pages. Informed the component specification structure. |
| Design Systems | Alla Kholmatova | Token governance, naming conventions, when to extend vs override. The governance section draws heavily from this work. |
| Grid Systems in Graphic Design | Josef Müller-Brockmann | 4-point grid rationale, column-based layout, mathematical spacing harmony. The spacing scale and grid system are rooted here. |
| Thinking with Type | Ellen Lupton | Type scale relationships, line height ratios, letter spacing principles. The typography section applies Lupton's rules to digital interfaces. |
| Interaction of Color | Josef Albers | Color relationship theory — how colors influence each other in context. Informed the semantic color pairings and accessibility combinations. |
| Mobile First | Luke Wroblewski | Progressive enhancement approach, content prioritization at small sizes. The responsive design section is built on this philosophy. |
| Responsive Web Design | Ethan Marcotte | Fluid grids, flexible images, media queries. Breakpoint definitions and reflow rules derive from Marcotte's framework. |
| Refactoring UI | Adam Wathan & Steve Schoger | Practical design token decisions — shadow scales, spacing scales, color palette generation. Many of the specific numeric values in this Skill are informed by their recommendations. |
| Apple Human Interface Guidelines | Apple | Platform-specific dimensions (44pt touch targets, 49pt tab bar, SF Pro type scale), system colors, motion parameters, continuous corner radius. The primary design reference for this system. |
