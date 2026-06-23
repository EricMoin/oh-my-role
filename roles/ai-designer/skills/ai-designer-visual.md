---
name: ai-designer-visual
description: Visual design theory and application for the AI Designer suite. Covers visual hierarchy, typography in practice, color theory and application, grid systems and layout, whitespace and density, imagery and iconography principles, brand and identity considerations, internationalization visual considerations, and visual design checklist. Load with ai-designer-core and ai-designer-system.
---

## Visual Design Foundations

Visual design is not decoration. It is communication. Every typographic choice, color decision, spatial relationship, and visual weight assignment communicates meaning to the user — intentionally or accidentally. Unintentional visual communication is the root cause of most "this feels off" feedback. The goal is total intentionality: every visual property serves a purpose you can articulate.

### The Four Basic Principles (CRAP)

These four principles, from Robin Williams' *The Non-Designer's Design Book*, form the foundation of all visual communication. Every layout decision maps to one or more of these principles.

**Contrast**: If two elements are not the same, make them very different. Slight differences look like mistakes. Bold differences look intentional. A heading that is only slightly larger than body text fails — it signals a difference without making it clear what the difference means. Minimum effective contrast: 1.5× size difference for text, 2× weight difference for emphasis, or a distinct color/style change.

**Repetition**: Repeat visual elements throughout the design. Consistent button styles, consistent heading treatments, consistent spacing patterns. Repetition creates unity — it tells the user "these things are the same kind of thing." Repetition also creates learnability: once the user recognizes a pattern, they can predict behavior. (See ai-designer-core.md § Consistency)

**Alignment**: Every element must have a visual connection to something else on the page. Nothing is placed arbitrarily. Alignment creates order and relationship. A left-aligned label above a left-aligned input field communicates belonging. A centered label above a left-aligned input creates visual tension — the two elements look disconnected.

**Proximity**: Group related elements together. Separate unrelated elements. The distance between elements communicates their relationship. A label 4px from its input is clearly associated. A label 24px from its input could belong to either the field above or the field below. Proximity is the most violated principle in amateur design.

### Communication Before Aesthetics

When visual design decisions conflict, resolve them in this priority order:

1. **Clarity**: Can the user understand what they're looking at?
2. **Hierarchy**: Can the user identify what's most important?
3. **Usability**: Can the user interact with the elements effectively?
4. **Consistency**: Does this match the patterns established elsewhere?
5. **Aesthetics**: Does this look polished and professional?

Aesthetics matter — they build trust and credibility. But aesthetics that sacrifice clarity, hierarchy, or usability are decoration, not design.


## Visual Hierarchy

Visual hierarchy determines the order in which the human eye processes information on a screen. Without deliberate hierarchy, users must work to understand what's important. With hierarchy, importance is self-evident.

### Hierarchy Tools

You control hierarchy through seven properties. Each property shifts visual weight. Combine properties for stronger signals. Use a single property for subtle differentiation.

| Tool | More Weight | Less Weight |
|---|---|---|
| Size | Larger | Smaller |
| Color | Saturated, warm, dark | Desaturated, cool, light |
| Contrast | High contrast with background | Low contrast with background |
| Position | Top-left (LTR), above the fold | Bottom-right, below the fold |
| Whitespace | Surrounded by space (isolation) | Packed tightly with other elements |
| Density | Dense, filled, solid | Sparse, outlined, ghosted |
| Alignment | Breaking alignment (intentional) | On the grid (expected) |

### Visual Weight Rules

Visual weight determines what the eye sees first. These are not suggestions — they are observed perceptual behaviors:

- **Large > Small.** A 48px heading dominates a 16px paragraph. This is the most reliable hierarchy tool.
- **Dark > Light.** Dark elements on light backgrounds draw the eye before light elements. Invert for dark mode.
- **Saturated > Desaturated.** A saturated blue button stands out from a gray interface. Saturation is attention.
- **Irregular > Regular.** A circle in a grid of rectangles draws the eye. An angled element in an orthogonal layout commands attention. Use irregularity sparingly — it loses power when overused.
- **Isolated > Grouped.** An element surrounded by whitespace has more weight than the same element packed into a cluster. Isolation creates importance. (See § Whitespace & Density)
- **Filled > Outlined.** A solid button has more visual weight than an outlined (ghost) button. Use filled for primary actions, outlined for secondary.

### Reading Patterns

Eye-tracking research reveals two dominant scanning patterns for screen content:

**F-Pattern**: Used when scanning text-heavy pages (articles, search results, documentation). Users read the first line fully, scan down the left edge, read partially across when something catches interest. Design implications: place the most important content in the first line. Front-load headings and bullet points. The left column of a layout gets the most attention.

**Z-Pattern**: Used when scanning pages with less text and more visual blocks (landing pages, dashboards, marketing). The eye moves: top-left → top-right → diagonal to bottom-left → bottom-right. Design implications: place logo/brand top-left, CTA top-right or bottom-right, key content along the diagonal.

**When to Use Which**: F-pattern layouts for content-heavy interfaces (email clients, documentation, news). Z-pattern layouts for conversion-oriented interfaces (landing pages, sign-up flows, marketing). Dashboard interfaces typically use a modified F-pattern with a left navigation column.

### Focal Point

Every screen has exactly one primary focal point — the single element the eye should land on first. If everything is emphasized, nothing is emphasized.

**Establishing focal point**:
- Make it the largest element (size dominance)
- Give it the highest contrast (color or value contrast)
- Surround it with whitespace (isolation)
- Place it in the upper-left quadrant or center (position)

**Testing focal point**: The squint test. Blur your vision or step back from the screen. The element that remains most visible is your focal point. If the wrong element dominates, adjust size, contrast, or whitespace until the correct element wins.

**Common focal point failures**:
- Two elements competing for dominance (split attention — the user hesitates)
- The decorative element outweighing the functional element (a hero image dominating a CTA)
- Status bar or navigation drawing more attention than the content area

### Hierarchy in Practice

For a typical content page, hierarchy follows this weight order:

1. **Page title**: Largest text, highest weight. Immediately communicates "what is this page?"
2. **Primary CTA**: High contrast, isolated by whitespace. Communicates "what should I do here?"
3. **Section headings**: Smaller than page title, larger than body text. Communicate structure.
4. **Body content**: Standard weight, comfortable reading size. The substance.
5. **Supporting elements**: Metadata, timestamps, secondary actions. Lowest visual weight, smallest size, most muted color.

If you find yourself giving equal weight to more than two elements on a screen, you have a hierarchy problem. Prioritize ruthlessly. (See ai-designer-core.md § Aesthetic & Minimalist Design)


## Typography in Practice

Typography is the most important visual design skill. Text dominates interfaces — it is the primary medium through which information is communicated. Good typography is invisible: the reader absorbs the content without noticing the type. Bad typography is a barrier: the reader struggles, squints, loses their place, or gives up.

### Type Anatomy

Understanding type anatomy enables precise communication about typographic choices:

- **x-height**: The height of a lowercase "x." Typefaces with large x-heights are more legible at small sizes. Compare: Verdana (large x-height) reads clearly at 12px; Garamond (small x-height) struggles below 14px.
- **Ascenders**: The parts of lowercase letters that extend above the x-height (b, d, f, h, k, l, t). Long ascenders increase line height requirements.
- **Descenders**: The parts that extend below the baseline (g, j, p, q, y). Long descenders increase line height requirements.
- **Counters**: The enclosed or partially enclosed spaces within letters (the hole in "o," the bowl of "a"). Open counters improve legibility. Typefaces with closed, narrow counters are harder to read at small sizes.
- **Serifs**: Small strokes at the ends of letterforms. Present in serif typefaces (Times, Georgia), absent in sans-serif (Helvetica, Inter).
- **Terminals**: The end of a stroke that does not have a serif. Round terminals feel friendly. Sharp terminals feel precise. Flat terminals feel modern.

### Type Classification

Each classification carries inherent associations. These are not arbitrary — they are the product of centuries of cultural context.

**Serif**: Conveys tradition, authority, readability in long-form text. The serifs guide the eye along the baseline, aiding reading flow in paragraphs. Use for: body text in editorial contexts, formal headings, brand identities that value heritage. Examples: body text in newspapers, legal documents, book publishing.

**Sans-Serif**: Conveys modernity, clarity, neutrality. Clean letterforms render well on screens at all sizes. Use for: UI text, body text in digital products, headings in modern brands, interface labels. Sans-serif is the default for digital product design — deviate only with reason.

**Monospace**: Conveys precision, technical authority. Every character occupies the same width, creating perfect vertical alignment. Use for: code display, data tables where digit alignment matters, technical interfaces. Never use for body text — the uniform width disrupts natural reading rhythm.

**Display**: Conveys personality, distinctiveness. Designed for large sizes, display faces trade readability for character. Use for: hero headings, brand moments, marketing headlines. Never use below 24px. Never use for body text. A display face used sparingly creates impact; used everywhere, it creates fatigue.

### Type Pairing

Effective type pairing creates contrast with harmony. The goal is complementary voices — one typeface for personality, one for clarity.

**The pairing rule**: Contrast in style, harmony in proportion. Pair a distinctive display face with a neutral body face. The display face sets the tone; the body face does the work.

**Pairing strategies**:
- Serif heading + sans-serif body (classic, reliable, high contrast)
- Display heading + sans-serif body (expressive heading, clean body)
- Same superfamily at different weights (guaranteed harmony, lower contrast)
- Sans-serif heading + serif body (modern heading, traditional body — use when editorial feel is desired)

**Pairing failures**:
- Two faces too similar: "Is that the same font or a mistake?" If the user cannot immediately see the difference, the pairing fails. Two geometric sans-serifs side by side create confusion, not contrast.
- Two faces too different: A blackletter heading with a geometric body creates visual whiplash. The styles must share some characteristic — similar x-height, similar proportions, or similar historical era.
- More than two families: Every additional typeface adds complexity. Two families (plus their weights and styles) provide ample variety. Three is the maximum. More than three signals a lack of system.

### Readability vs. Legibility

These terms are not interchangeable. Both must be optimized, but they address different problems.

**Legibility**: Can you distinguish individual letters? Legibility is a property of the typeface itself. A typeface with a clear distinction between "I" (capital i), "l" (lowercase L), and "1" (digit one) is highly legible. Test legibility by examining: Ill1, O0, rn vs m, cl vs d.

**Legibility requirements for UI**: The typeface used for interface text must clearly distinguish all alphanumeric characters. This eliminates many elegant typefaces that trade legibility for style. Prioritize: large x-height, open counters, distinct letterforms.

**Readability**: Can you comfortably read paragraphs? Readability is a product of typeface choice, size, line height, line length, color contrast, and spacing. A legible typeface at 8px on a busy background is unreadable. Readability is the designer's responsibility.

### Optimal Line Length

Line length is the single most impactful readability factor that designers consistently get wrong.

**The rule**: 45–75 characters per line (including spaces) for body text. 66 characters is the widely cited ideal.

**Too short (under 40 characters)**: The eye must return to the left edge too frequently. Reading becomes choppy. Comprehension drops. Common in narrow mobile layouts and sidebars.

**Too long (over 80 characters)**: The eye loses its place when returning to the start of the next line. Fatigue sets in quickly. Common in full-width layouts on large monitors.

**Practical application**: For a 16px body font, 45–75 characters typically translates to 540–720px of content width. Do not fill the entire viewport width with body text on desktop screens. Use max-width constraints, multi-column layouts, or generous side margins.

**Exception**: Code blocks can extend wider (up to 120 characters) because code is scanned, not read linearly, and line breaks in code change meaning.

### Typographic Scale

A typographic scale creates consistent, harmonious relationships between text sizes. Without a scale, sizes are chosen arbitrarily, and the type system feels disordered.

**Modular scale theory**: Choose a base size and a ratio. Multiply the base by the ratio repeatedly to generate the scale. Each step produces the next size up.

| Scale Name | Ratio | Character |
|---|---|---|
| Minor Second | 1.067 | Very tight, subtle differences between steps |
| Major Second | 1.125 | Compact, suitable for dense interfaces |
| Minor Third | 1.200 | Moderate, versatile for most interfaces |
| Major Third | 1.250 | Comfortable, clear hierarchy with fewer steps |
| Perfect Fourth | 1.333 | Pronounced, strong hierarchy, ideal for content-heavy pages |
| Augmented Fourth | 1.414 | Dramatic, large jumps between sizes |
| Perfect Fifth | 1.500 | Very dramatic, best for display-oriented layouts |

**Choosing a ratio**: Dense, data-heavy interfaces benefit from tighter ratios (1.125–1.200). Content-oriented interfaces benefit from wider ratios (1.250–1.333). Marketing and editorial layouts can use dramatic ratios (1.414–1.500). The ratio must produce enough distinct sizes to support your hierarchy without creating sizes that are too similar to differentiate.

**Practical scale construction**: Start with a 16px base (body text). Apply the ratio to generate heading sizes, small text sizes, and display sizes. Round to whole pixels. Verify that each step is visibly distinct from adjacent steps — if two sizes look the same, the ratio is too tight for your size range.

For concrete token values and the project's specific typographic scale, (See ai-designer-system.md § Design Tokens — Typography).

### Line Height

Line height (leading) controls the vertical space between lines of text. It directly impacts readability.

**Body text**: 1.4–1.6 × the font size. Tighter leading (1.4) works for short blocks. Looser leading (1.6) improves comfort in long-form reading. Below 1.3, lines feel cramped. Above 1.8, the connection between lines weakens and the eye drifts.

**Headings**: 1.1–1.3 × the font size. Headings are read as phrases, not paragraphs. Tighter leading in headings looks more cohesive, especially in multi-line headings. At display sizes (32px+), use 1.1 or even 1.0 — large text needs proportionally less leading.

**UI text**: 1.3–1.5 × the font size. Labels, buttons, navigation items, and metadata. Tighter than body text because these elements are short and scanned, not read.

**The relationship between font size and line height**: As font size increases, the line-height multiplier should decrease. A 16px font at 1.5 line height (24px) is comfortable. A 48px font at 1.5 line height (72px) creates excessive gaps between lines.

### Font Weight

Font weight communicates emphasis and hierarchy within a type family.

**Weight hierarchy**: Regular (400) for body text. Medium (500) for subtle emphasis or UI labels. Semibold (600) for subheadings and important labels. Bold (700) for headings and strong emphasis.

**Weight rules**:
- Use a maximum of 3 weights from a single family. More than 3 creates confusion about what each weight means.
- Never use thin or light weights (100–300) for text below 18px — they become illegible on low-resolution screens.
- Bold text in body paragraphs should be used sparingly for inline emphasis. If everything is bold, nothing is bold.
- Weight contrast between heading and body should be at least 2 steps (e.g., 700 heading, 400 body). A 500 heading over 400 body text looks like a mistake.

### Widow and Orphan Control

**Widows**: A single word (or very short line) left alone at the end of a paragraph. Widows create awkward whitespace and disrupt visual rhythm. In fixed layouts (print, marketing pages), eliminate widows by rewriting copy or adjusting line length. In dynamic layouts (responsive UI), accept that widows will occur and do not sacrifice responsive behavior to prevent them.

**Orphans**: A single line of a paragraph isolated at the top or bottom of a column or page break. Orphans are more disruptive than widows because they lose their paragraph context. Ensure at least 2 lines of a paragraph appear together at any break point.

### Letter Spacing and Word Spacing

**Letter spacing (tracking)**: The uniform space between all characters in a block of text.
- Body text: use the typeface's default tracking. Designers who set the type already optimized it.
- Uppercase text: increase tracking by 2–5%. ALL CAPS without added tracking feels cramped because uppercase letters have similar shapes that crowd together.
- Display text at large sizes (40px+): decrease tracking by 1–3%. At large sizes, the default spacing appears too loose.
- Never increase tracking on lowercase body text — it disrupts word shapes that the eye relies on for reading speed.

**Word spacing**: Rarely needs adjustment from defaults. Excessively tight word spacing merges words. Excessively loose word spacing breaks the line into isolated chunks. Both harm readability.


## Color Theory & Application

Color is the most emotionally potent visual property. It triggers faster responses than shape, size, or text. This power makes color decisions high-leverage — a good color system multiplies clarity; a poor one multiplies confusion. This section covers color theory and application principles. For specific color token values, (See ai-designer-system.md § Design Tokens — Color Palette).

### Color Models

Different color models serve different purposes. Use the model that matches your task.

**RGB (Red, Green, Blue)**: The native model for screens. Every pixel is a combination of red, green, and blue light at varying intensities (0–255 each). Use RGB when specifying final output values for implementation. Limitation: RGB values are unintuitive for humans — "rgb(64, 128, 200)" does not communicate the color's character.

**HSL (Hue, Saturation, Lightness)**: The most intuitive model for design decisions. Hue is the color (0–360°). Saturation is intensity (0–100%). Lightness is brightness (0–100%). Use HSL when creating palettes, adjusting colors, and communicating color intent. "Reduce saturation by 20%" is meaningful; "subtract 40 from the red channel" is not.

**HSB/HSV (Hue, Saturation, Brightness)**: Similar to HSL but uses "brightness" instead of "lightness." HSB 100% brightness = the fully saturated color. HSL 100% lightness = white. Use HSB when adjusting perceived brightness — it maps more closely to how humans perceive light and dark.

**When to use which**: Design exploration and palette creation → HSL. Communicating specific implementation values → RGB or hex. Adjusting perceived brightness for accessibility → HSB. Evaluating contrast → convert to relative luminance.

### Color Harmony

Color harmony describes relationships between colors that produce visually stable, pleasing, or intentionally dynamic combinations. These are not rigid rules — they are starting points for palette development.

**Complementary**: Two colors opposite each other on the color wheel (180° apart). High contrast, high energy. Creates vibrant tension. Use for: CTA buttons against a contrasting background, alert states. Risk: direct complementary pairs at full saturation vibrate visually — desaturate one or both.

**Analogous**: Three colors adjacent on the color wheel (within 30–60° of each other). Low contrast, high harmony. Creates calm, cohesive palettes. Use for: backgrounds, gradients, multi-step progressions. Risk: insufficient contrast between states — ensure functional colors are still distinguishable.

**Triadic**: Three colors evenly spaced on the color wheel (120° apart). Balanced contrast. Creates vibrant but stable palettes. Use for: information visualization with 3 categories, multi-brand systems. Risk: full-saturation triadic palettes feel childish — desaturate at least two of the three.

**Split-Complementary**: One color plus the two colors adjacent to its complement. Similar vibrancy to complementary but less tension. Use for: primary + two accent colors. More forgiving than pure complementary — easier to balance.

**Monochromatic**: One hue at varying saturation and lightness levels. Maximum harmony, minimum variety. Use for: elevation layers (darker = deeper, lighter = elevated), status progressions (light = inactive, saturated = active). Risk: monotony — add a single accent hue for interactive elements.

### Color Temperature

Color temperature is a perceptual property that influences emotional response and spatial perception.

**Warm colors** (reds, oranges, yellows): Advance toward the viewer. Create energy, urgency, appetite. Warm accents draw the eye. Use warm colors for: CTAs, urgency indicators, notifications, food-related interfaces. Warm backgrounds feel intimate and enclosing.

**Cool colors** (blues, greens, purples): Recede from the viewer. Create calm, trust, spaciousness. Cool backgrounds feel open. Use cool colors for: backgrounds, trust-building interfaces (finance, healthcare), data-dense layouts where calm aids focus.

**Neutral colors** (grays, tans, off-whites): Neither warm nor cool. Provide the scaffolding that lets chromatic colors work. Use neutrals for: backgrounds, borders, secondary text, disabled states. Neutrals with warm undertones (warm gray) feel more human. Neutrals with cool undertones (cool gray) feel more technical.

### The 60-30-10 Rule

A time-tested formula for color distribution that prevents both monotony and chaos:

- **60% — Dominant color**: The background, the canvas. Typically a neutral: white, off-white, light gray, dark gray (dark mode). This is the color users see most and notice least. It sets the emotional baseline.
- **30% — Secondary color**: UI elements that provide structure. Navigation backgrounds, card surfaces, section dividers, secondary buttons. This color supports hierarchy by differentiating surface layers.
- **10% — Accent color**: The attention-grabber. Primary CTAs, active states, selected elements, links, key data points. This is the color that means "look here" and "interact with this."

**Applying the rule**: The 60-30-10 distribution is approximate, not mathematical. The principle is: most of the interface is calm (60%), some of the interface provides structure (30%), and a small amount commands attention (10%). If your accent color occupies more than 15% of the screen, it loses its attention-commanding power.

### Color for Meaning

Color carries semantic meaning. Some meanings are learned conventions; others are cultural. Know the difference.

**Learned conventions (near-universal in digital products)**:
- Red = error, danger, destructive action, stop
- Green = success, confirmation, positive change, go
- Yellow/Amber = warning, caution, attention needed
- Blue = link, primary action, trust, information

**Cultural associations (vary by region and context)**:
- Red: danger and stop (Western), luck and celebration (Chinese), mourning (South Africa)
- White: purity and cleanliness (Western), mourning and death (East Asia)
- Green: nature and permission (global), Islam (Middle East), envy (Western)
- Purple: royalty and luxury (Western), mourning (Thailand, Brazil)
- Yellow: happiness (Western), imperial (China), mourning (Egypt)

**Design implication**: When using color for meaning, always pair it with a secondary indicator. Red error states need an icon and text label — not just a red border. Green success needs a checkmark or "Success" text. This serves both accessibility (color blindness) and cross-cultural clarity.

### Color Accessibility

Color accessibility is a non-negotiable requirement, not an enhancement.

**Color blindness prevalence**: Approximately 8% of males and 0.5% of females have some form of color vision deficiency. In a product with 1,000 users, roughly 40 cannot see your color system as intended.

**Types and design implications**:
- **Protanopia (red-weak)**: Reds appear muted or brown. Red-green pairs are indistinguishable. Red text on dark backgrounds may disappear.
- **Deuteranopia (green-weak)**: The most common form. Green appears brownish. Red-green pairs are indistinguishable. Green "success" indicators look identical to red "error" indicators.
- **Tritanopia (blue-weak)**: Rare. Blue-yellow pairs are problematic. Blues appear greener, yellows appear pinker.

**Mandatory practices**:
- Never use color as the sole differentiator between states. Error fields need icons, borders, or text — not just red highlighting.
- Never use red vs. green as a binary indicator (pass/fail, good/bad) without additional cues — shapes, patterns, icons, or labels.
- Test every color combination against WCAG contrast requirements: 4.5:1 for normal text, 3:1 for large text, 3:1 for UI components.
- Validate with color blindness simulation tools across all three deficiency types.

### HSL Manipulation for Palette Generation

HSL provides an intuitive framework for generating systematic color palettes:

**Monochromatic palette**: Fix the hue. Generate variations by adjusting saturation (25%, 50%, 75%, 100%) and lightness (10%, 30%, 50%, 70%, 90%). This produces a complete tonal range for backgrounds, surfaces, borders, text, and accents from a single hue.

**Analogous palette**: Start with the primary hue. Shift by ±30° for adjacent hues. Apply the monochromatic lightness variations to each hue. This produces a harmonious multi-hue palette.

**Complementary accent**: Take the primary hue. Shift by 180° for the complement. Use the complement only at the accent level (10% distribution). Generate lightness variations for both hues.

**Saturation guidelines**: Full saturation (100%) is aggressive — use only for small accent elements. UI surfaces work best at 5–30% saturation. Text works best at 0–10% saturation (near-neutral). Reduce saturation as elements increase in area.

**Lightness for elevation**: In light themes, higher elevation = lighter surfaces (background at L:95%, card at L:100%, popup at L:100% with shadow). In dark themes, higher elevation = lighter surfaces (background at L:10%, card at L:15%, popup at L:20%).


## Grid Systems & Layout

Grid systems provide the invisible structure that makes layouts feel ordered, coherent, and professional. A grid is not a constraint — it is a scaffold that accelerates decision-making and guarantees alignment.

### Column Grids

Column grids divide the viewport into vertical columns with gutters (gaps) between them. Content spans one or more columns. This system creates consistent alignment across all screens and components.

**Standard column counts by viewport**:
- **Mobile (320–767px)**: 4 columns. Content typically spans all 4 columns, with occasional 2+2 splits for grids and cards.
- **Tablet (768–1023px)**: 8 columns. Enables side-by-side layouts (4+4), asymmetric layouts (5+3), and narrow content in a centered 6-column span.
- **Desktop (1024px+)**: 12 columns. Maximum flexibility. Content areas typically span 8–10 columns with sidebar in 2–4 columns. Full-width layouts span all 12.

**Why 12 columns**: 12 is divisible by 2, 3, 4, and 6, enabling half, third, quarter, and sixth divisions. This mathematical flexibility makes 12 the standard for responsive grid systems.

### Baseline Grid

The baseline grid is a horizontal rhythm that aligns text across columns to a consistent vertical beat. When text in adjacent columns aligns to the same baseline, the layout feels ordered. When baselines drift, the layout feels chaotic.

**Establishing a baseline**: Set the baseline increment to match your body text line height. If body text is 16px with 1.5 line height, the baseline is 24px. Every text block, component, and spacing value should be a multiple of this baseline (24, 48, 72, 96...).

**Practical application**: Strict baseline alignment is more critical in editorial and content-heavy layouts. In component-driven UI layouts, maintaining an overall vertical rhythm (consistent spacing multiples) is sufficient — individual component baselines can flex without visible harm.

### Modular Grid

A modular grid combines columns with rows, creating a matrix of cells. Each cell is a module. Content occupies one or more modules.

**When to use modular grids**:
- Dashboards with multiple data panels of varying size
- E-commerce product grids where items differ in visual weight
- Magazine-style layouts with mixed content types (articles, images, quotes, data)
- Complex forms with multiple sections that need visual grouping

**When column grids suffice**: Most standard web and app layouts. Content flows vertically within column spans. Modular grids add complexity — use them only when horizontal AND vertical alignment both matter.

### Golden Ratio and Rule of Thirds

**Golden ratio (1:1.618)**: A mathematical proportion that appears frequently in nature and has been used in art and architecture for millennia. In practice, it creates layouts that feel "naturally" balanced.

Application: Use the golden ratio for asymmetric divisions. A content area + sidebar at a 1.618:1 ratio (roughly 62%:38%) feels balanced without being symmetrical. A hero image with text overlay positioned at the golden intersection point draws the eye naturally.

**Rule of thirds**: Divide the canvas into a 3×3 grid. Place focal elements along the grid lines or at their intersections. This creates dynamic, non-centered compositions that feel professional.

Application: Photo cropping, hero layouts, dashboard widget placement. The rule of thirds prevents the amateur tendency to center everything — centered compositions feel static and formal. Off-center compositions feel dynamic and editorial.

**When to ignore both**: Content-driven layouts where content volume varies. A blog post does not need golden ratio proportions — it needs an appropriate line length and adequate margins. Data tables do not benefit from rule-of-thirds placement — they need alignment and scanability. Use these ratios for fixed compositional decisions, not fluid content containers.

### Margin and Gutter Calculations

**Margins**: The space between the grid and the viewport edge. Margins prevent content from touching screen edges, creating visual breathing room and preventing accidental touch on mobile.

| Viewport | Margin Size | Rationale |
|---|---|---|
| Mobile | 16–20px | Balance between content width and edge breathing room |
| Tablet | 24–32px | Sufficient room for touch avoidance and visual comfort |
| Desktop | 32–64px | Generous margins at large widths prevent excessively wide content |

**Gutters**: The space between columns. Gutters create separation between content blocks without requiring explicit dividers.

| Viewport | Gutter Size | Rationale |
|---|---|---|
| Mobile | 16px | Narrow gutters preserve content width on small screens |
| Tablet | 20–24px | Moderate separation for medium-density layouts |
| Desktop | 24–32px | Generous gutters for comfortable content separation |

**Max-width constraints**: On very large screens (1440px+), content should not stretch to fill the viewport. Apply a max-width (typically 1200–1440px) and center the grid. This prevents text lines from exceeding readable length and maintains visual cohesion.

### Breaking the Grid

**Intentional grid breaks** create emphasis, surprise, and visual interest. A full-bleed image that ignores column boundaries draws attention. A pull quote that extends into the margin creates editorial emphasis. A CTA that overlaps two sections feels prominent and dynamic.

**Accidental grid breaks** look like errors. An element that is 2px off the column edge, a component with different padding than its siblings, text that does not align with adjacent content — these create subtle unease. Users cannot articulate what is wrong, but they sense that something is off.

**The rule**: Break the grid only when you can articulate why. Every grid break should serve a hierarchy, emphasis, or compositional goal. If you cannot explain the reason, align to the grid.


## Whitespace & Density

Whitespace is the space between elements. It is the most undervalued tool in visual design. Amateur designers fill space; professional designers create space. Whitespace is not empty — it is the design element that makes all other elements comprehensible.

### Active vs. Passive Whitespace

**Active whitespace**: Intentional space added to create hierarchy, guide attention, and separate content groups. The space around a CTA that gives it prominence. The space between sections that signals "new topic." The margins that prevent content from feeling cramped. Active whitespace is a design decision.

**Passive whitespace**: The space that exists by default — default line spacing, default paragraph margins, default component padding. Passive whitespace is not a decision; it is an absence of decision. Relying solely on passive whitespace produces layouts that feel "okay" but never "designed."

**The distinction matters**: When evaluating a layout, ask: "Did I choose this space, or did it just happen?" Every significant space should be an active choice.

### Whitespace as Hierarchy

Whitespace communicates relationships as powerfully as visual weight.

**Proximity principle applied**: Elements with less space between them are perceived as related. Elements with more space between them are perceived as separate. A form field with 8px between its label and input is clearly a unit. A 32px gap between two form groups signals "these are different topics."

**Isolation principle**: An element surrounded by generous whitespace receives more visual weight and perceived importance. A CTA with 48px of clear space around it commands more attention than the same CTA in a packed layout — even if the CTA itself is identical.

**Progressive spacing**: Increase spacing between elements as you move up the hierarchy. Within a form field group: 4–8px between label and input. Between form fields: 16–24px. Between form sections: 32–48px. Between major page sections: 48–80px. This progression creates natural grouping at multiple scales.

### Information Density Tradeoffs

There is no universally correct density. The right density depends on the user, their task, and the content type.

**Low density (scannable)**:
- Large whitespace, generous margins, limited content per screen
- Ideal for: onboarding, marketing, simple forms, mobile-first interfaces
- Benefit: easy to scan, low cognitive load, focus on key actions
- Risk: excessive scrolling, feeling of "too much space, not enough content"

**Medium density (balanced)**:
- Moderate whitespace, standard margins, reasonable content per screen
- Ideal for: most applications, dashboards, content management, email
- Benefit: balance of scanability and information access
- Risk: the "safe middle" can feel generic — requires strong hierarchy to compensate

**High density (comprehensive)**:
- Compact whitespace, tight margins, maximum content per screen
- Ideal for: data tables, financial interfaces, developer tools, power-user dashboards
- Benefit: all information visible, minimal scrolling, expert efficiency
- Risk: overwhelming for novices, difficult to scan, requires excellent hierarchy to remain usable

**Matching density to context**: The same product may need different densities in different areas. A settings page benefits from low density (one decision at a time). A data table benefits from high density (see all rows). A navigation sidebar benefits from medium density (scannable list of options). Do not apply uniform density across an entire product.

### Micro-Whitespace vs. Macro-Whitespace

**Micro-whitespace**: The small-scale spacing within and between individual elements.
- Letter spacing (tracking): space between characters in a word
- Word spacing: space between words in a line
- Line spacing (leading): space between lines of text
- Component padding: space between a component's content and its border
- Icon-to-label gap: space between an icon and its adjacent text

**Macro-whitespace**: The large-scale spacing that defines page structure.
- Section spacing: space between major content sections
- Margin: space between content and viewport edge
- Column gutters: space between grid columns
- Content-to-navigation gap: space between nav and content area
- Above-the-fold breathing room: space at the top of the page before content begins

**Both scales must be intentional.** Tight micro-whitespace with generous macro-whitespace creates dense content blocks with clear separation. Generous micro-whitespace with tight macro-whitespace creates airy content that feels crowded at the page level. Align both scales with the same density intent.

### Breathing Room Around Interactive Elements

Interactive elements need isolation to:
1. Prevent accidental activation of adjacent elements (especially on touch)
2. Signal that the element is important and actionable
3. Meet minimum touch target requirements (44×44pt minimum including padding)

**CTA buttons**: Minimum 16px clear space above and below, 24px to adjacent interactive elements. Primary CTAs benefit from 32–48px of isolation in high-priority contexts (checkout, signup, confirmation).

**Form elements**: Minimum 16px between adjacent form fields. Group-level spacing (between field groups) should be 2–3× the within-group spacing to communicate grouping.

**Navigation items**: Minimum 8px between items. On mobile, ensure the total tappable area (including padding) meets the 44×44pt minimum even when the visible element is smaller.


## Imagery & Iconography Principles

Images and icons are not decoration. They serve specific communication functions. Every image in an interface should earn its space by conveying information, guiding action, or building context that text alone cannot.

### When to Use Each Medium

**Photography**:
- Use for: real-world context (product images, team photos, location imagery), building trust (showing real people and places), emotional connection (hero images, testimonials)
- Requirements: consistent style (lighting, color treatment, composition), appropriate resolution, meaningful content (not generic stock)
- Avoid: photography that contradicts brand identity, low-quality or generic stock images that signal inauthenticity, decorative images that consume space without communicating

**Illustration**:
- Use for: abstract concepts that photography cannot capture (workflow diagrams, feature explanations), empty states (friendly, non-photographic visual for "nothing here yet"), onboarding (guiding users through abstract processes), brand personality (distinctive style that photography cannot achieve)
- Requirements: consistent illustration style across the product (same line weight, color palette, level of detail), appropriate complexity (simple for small spaces, detailed for hero moments)
- Avoid: mixing illustration styles within a product, illustrations that require explanation (if you need a label to explain the illustration, the illustration has failed)

**Icons**:
- Use for: navigation (recognizable action shortcuts), status indicators (success, warning, error), labels (supplementing text with visual cues), actions (edit, delete, share, download)
- Requirements: consistent style (outlined OR filled, same stroke weight, same corner radius), clarity at small sizes (16–24px), universal recognition (standard metaphors for common actions)
- The test: an icon that needs a text label to be understood is not communicating. It is decorating. The icon must convey meaning independently, or it must be paired with text permanently — not as a tooltip that requires hover.

### Icon Design Principles

**Clarity**: Every icon must be recognizable at its minimum display size (typically 16px). This means simple forms, minimal detail, and clear silhouettes. A magnifying glass reads at 16px; a detailed camera with lens reflections does not.

**Consistency**: All icons in a system share visual properties:
- Same stroke weight (1.5–2px is standard for UI icons)
- Same corner radius (sharp, slightly rounded, or fully rounded — pick one)
- Same grid (design on a consistent pixel grid — 24×24 is standard)
- Same style (all outlined OR all filled — mixing creates hierarchy confusion)
- Same optical weight (a filled circle and a detailed outlined icon at the same size have different visual weight — adjust to balance)

**Metaphor**: Icons work through learned metaphor. A floppy disk means "save" to generations who have never seen a floppy disk. A shopping cart means "purchase items." These metaphors are powerful but culturally dependent. A mailbox icon for email is universal in some cultures and unrecognizable in others. When in doubt, pair icons with text.

**States**: Interactive icons need visual states:
- Default: standard color and opacity
- Hover: increased contrast or slight color shift
- Active/Selected: filled (if default is outlined), accent color, or both
- Disabled: reduced opacity (40–50%) with no interactive cursor

### Image Composition for UI

**Focal point placement**: Subject matter should align with the content layout. In a card with text below, the subject should be centered or positioned to create visual flow toward the text. Avoid cropping that places the subject at odds with the surrounding layout.

**Consistent treatment**: All photography in a product should share a visual treatment — similar color temperature, similar contrast, similar cropping style. An interface that mixes warm, highly saturated photos with cold, desaturated photos feels inconsistent.

**Resolution and performance**: Specify minimum resolution requirements (2× for retina), maximum file sizes, and acceptable formats. Beautiful imagery that takes 5 seconds to load damages the experience more than an empty placeholder.

### Empty State Illustrations

Empty states are opportunities, not dead ends. When a user encounters an empty list, empty inbox, or empty dashboard, the illustration should:

1. **Communicate context**: Show what this space is for. An empty task list shows a friendly illustration of a checklist. An empty inbox shows an illustration related to messages.
2. **Guide action**: Pair with clear instructional text and a CTA. "No projects yet. Create your first project to get started." with a "Create Project" button.
3. **Match brand tone**: Empty state illustrations are often the most personality-rich moment in a product. They can be warmer and more expressive than the operational UI.
4. **Stay proportionate**: The illustration should not dominate the screen. It supplements the message — it does not replace it. Size the illustration to support, not overwhelm.


## Brand & Identity Considerations

Visual design in a product context does not exist in a vacuum. It exists within a brand system. The product UI is one expression of the brand — alongside marketing, packaging, communications, and physical spaces. Visual design decisions must align with brand intent while prioritizing usability.

### Visual Design Serves Brand

The brand is not a logo and a color palette. The brand is the sum of every interaction a person has with the organization. Visual design contributes to brand by establishing:

- **Recognition**: Consistent visual patterns that users associate with the product. A user should recognize the product from a screenshot without seeing the logo.
- **Trust**: Visual polish signals competence. A well-designed interface communicates "this team pays attention to detail" and, by extension, "this team will handle your data/money/health carefully."
- **Personality**: Typography, color temperature, whitespace density, imagery style, and microinteractions collectively create a personality. Is this product formal or casual? Technical or accessible? Premium or utilitarian?

### Maintaining Brand-Product Consistency

- **Brand colors in UI**: Primary brand colors should appear in the product — but not necessarily as the dominant color. A brand with a vibrant orange identity might use orange for CTAs and navigation highlights while keeping backgrounds neutral. Brand color overuse creates visual fatigue.
- **Brand typography in UI**: If the brand uses a distinctive typeface, it should appear in the product — at minimum in headings. If the brand typeface is unsuitable for UI text (display faces, highly decorative faces), pair it with a neutral UI typeface. Never sacrifice readability for brand consistency.
- **Brand imagery style in UI**: If the brand uses illustration, the product's illustrations should match the brand style. If the brand uses photography, the product's photography should follow brand guidelines for style, color treatment, and subject matter.

### When to Challenge Brand Guidelines

Brand guidelines that harm usability must be challenged with evidence, not opinion.

**Challenge when**:
- Brand colors do not meet WCAG contrast ratios for text or interactive elements. Present the specific contrast numbers and the standard they violate.
- Brand typography is illegible at UI text sizes. Show the legibility comparison at the required sizes.
- Brand imagery guidelines require high-resolution images that degrade performance. Present the load time impact with data.
- Brand spacing or layout requirements create touch target violations. Demonstrate the minimum sizes and the guideline conflict.

**How to challenge**: Present the problem as a UX risk, not a brand criticism. Propose alternatives that maintain brand identity while meeting usability requirements. "The brand blue at this size creates a 2.8:1 contrast ratio. WCAG requires 4.5:1. Darkening the blue by 15% maintains brand recognition while meeting accessibility standards."


## Internationalization (i18n) Visual Considerations

Visual design must accommodate diverse languages, scripts, reading directions, and cultural contexts. Designing only for English on a left-to-right layout excludes billions of users and creates expensive retrofitting later.

### Right-to-Left (RTL) Layout

RTL languages (Arabic, Hebrew, Farsi, Urdu) require mirroring the entire layout, not just flipping text direction.

**What to mirror**:
- Navigation: left sidebar → right sidebar
- Content flow: left-aligned → right-aligned
- Progress indicators: left-to-right → right-to-left
- Directional icons: forward arrows, back arrows, "next" indicators
- Reading order in lists and grids: left-to-right → right-to-left

**What NOT to mirror**:
- Media playback controls (play, pause, forward, rewind — these are universal)
- Clocks and circular progress indicators
- Graphs and charts (X-axis flows left to right universally in mathematics)
- Checkmarks and universal symbols
- Images of real objects (a car facing right does not need to face left in RTL)

**Bidirectional (BiDi) content**: When RTL text contains LTR content (English brand names, URLs, code), the layout must handle both directions within the same line. Design for this complexity — do not assume single-direction text.

### Text Expansion

Languages vary dramatically in the space required to express the same content. Design layouts that accommodate expansion without breaking.

| Language | Expansion vs. English | Example |
|---|---|---|
| German | +30% | "Settings" → "Einstellungen" |
| Finnish | +30–40% | "Search" → "Haku" (shorter), but compound words expand dramatically |
| French | +15–20% | "Download" → "Télécharger" |
| Japanese | -30% | Characters are denser — fewer characters convey same meaning |
| Chinese | -30% | Similar to Japanese |
| Arabic | +25% | But vertically compact — shorter line height may be possible |

**Design implications**:
- Buttons must accommodate 30–40% longer text without wrapping or truncating
- Navigation labels must have flexible widths or graceful truncation with tooltips
- Table headers must not rely on fixed widths
- Card layouts must handle varying text lengths without layout shifts
- Never hard-code content widths — design for flexibility

### Cultural Color Associations

Color meaning varies across cultures. A palette designed for Western audiences may communicate unintended messages in other markets.

**Research requirement**: Before finalizing a color system for a multi-market product, research color associations in every target market. Document conflicts and resolve them through:
- Using color + icon + text (triple encoding) so meaning does not depend solely on color
- Adjusting hues for specific markets (localized color tokens if necessary)
- Avoiding culturally sensitive colors in prominent positions

### Icon Universality

Icons that feel universal often are not.

**Universally understood**: Magnifying glass (search), X (close), plus sign (add), arrow (directional navigation), heart (favorite/like in digital contexts).

**Culturally dependent**: Mailbox (varies by country), thumbs-up (offensive in some Middle Eastern cultures), owl (wisdom in West, bad omen in some Asian cultures), hand gestures (vary widely).

**Design rule**: For global products, test icons with users from target cultures. When in doubt, pair every icon with a text label. The text label is the authoritative communicator; the icon is a visual supplement.

### Date, Time, and Number Formats

These formats vary by locale and must be accommodated in visual layouts.

**Date formats**: MM/DD/YYYY (US), DD/MM/YYYY (most of Europe, Latin America), YYYY/MM/DD (ISO 8601, East Asia). A date field displaying "03/04/2025" is ambiguous — is it March 4 or April 3? Design for explicit formats or locale-aware display.

**Time formats**: 12-hour with AM/PM (US, UK, most of Anglosphere), 24-hour (most of Europe, military, technical). Design time displays to accommodate both formats — "3:00 PM" is wider than "15:00."

**Number formats**: 1,000.00 (US, UK), 1.000,00 (Germany, France, Brazil), 1 000,00 (Sweden, France alternate). Thousand separators and decimal markers are swapped across locales. Design numeric displays with flexible widths.

**Design implication**: Fixed-width date/time/number fields break in international contexts. Design for the longest reasonable format in each locale. Use locale-aware formatting in specifications.


## Visual Design Checklist

Use this checklist during Phase 7 (Validate) of the design workflow (See ai-designer-core.md § Design Workflow — Phase 7). Every item is a yes/no question. Pass all items or document the exception.

### Hierarchy

- [ ] Is the most important element on each screen the most visually prominent?
- [ ] Can you identify the primary, secondary, and tertiary hierarchy levels at a glance?
- [ ] Does the squint test pass? (Blur the screen — can you still see the hierarchy?)
- [ ] Is there exactly one primary focal point per screen?
- [ ] Do heading sizes follow a consistent typographic scale?

### Alignment

- [ ] Is every element aligned to the grid or intentionally breaking it?
- [ ] Do text baselines align across adjacent columns?
- [ ] Are form labels consistently positioned relative to their inputs?
- [ ] Are left edges of content blocks aligned vertically?
- [ ] Is centered text used only for short, standalone elements (never for paragraphs)?

### Consistency

- [ ] Are similar elements treated with identical visual properties?
- [ ] Do all buttons of the same type share the same size, color, and typography?
- [ ] Is the spacing system consistent (all values from the same scale)?
- [ ] Are icon styles uniform (all outlined OR all filled, same weight)?
- [ ] Does the typography use a maximum of 2–3 typeface families?

### Contrast

- [ ] Do interactive elements stand out from static content?
- [ ] Does all text meet WCAG contrast ratios (4.5:1 normal, 3:1 large)?
- [ ] Are primary actions visually distinct from secondary actions?
- [ ] Is disabled state visually distinct from both enabled and non-interactive?
- [ ] Can you distinguish clickable from non-clickable elements without hovering?

### Whitespace

- [ ] Is there breathing room around primary CTAs (minimum 16px, ideally 32px+)?
- [ ] Do section breaks use appropriate spacing (32–80px between major sections)?
- [ ] Is the spacing between related elements tighter than the spacing between unrelated elements?
- [ ] Does micro-whitespace (line height, letter spacing) match the density intent?
- [ ] Are touch targets adequately spaced (8px minimum between interactive elements)?

### Typography

- [ ] Is the typographic scale consistent across all screens?
- [ ] Are line lengths within the 45–75 character range for body text?
- [ ] Do heading weights contrast sufficiently with body weight (2+ steps difference)?
- [ ] Is line height appropriate for each text role (1.4–1.6 body, 1.1–1.3 headings)?
- [ ] Are font weights limited to 3 or fewer per typeface family?

### Color

- [ ] Does the color distribution follow the 60-30-10 principle (or a documented alternative)?
- [ ] Is color never used as the sole indicator of meaning or state?
- [ ] Have color combinations been tested for all three color blindness types?
- [ ] Are semantic colors (error, warning, success, info) used consistently throughout?
- [ ] Does the palette work in both light and dark mode (if applicable)?


## Book Source Appendix

This table maps the primary references to the sections they inform. Knowledge is merged by theme, not summarized by book — but knowing the sources enables deeper study.

| Book | Author(s) | Primary Sections Informed |
|---|---|---|
| The Non-Designer's Design Book | Robin Williams | Visual Design Foundations (CRAP Principles) |
| Universal Principles of Design | William Lidwell, Kritina Holden, Jill Butler | Visual Hierarchy, Whitespace & Density |
| Refactoring UI | Adam Wathan, Steve Schoger | Visual Hierarchy, Typography in Practice, Color Application |
| Thinking with Type | Ellen Lupton | Typography in Practice (anatomy, classification, pairing, scale) |
| The Elements of Typographic Style | Robert Bringhurst | Typography in Practice (line length, leading, tracking, readability) |
| Interaction of Color | Josef Albers | Color Theory & Application (harmony, perception, context) |
| Color and Light | James Gurney | Color Theory & Application (temperature, light behavior, palette) |
| Grid Systems in Graphic Design | Josef Müller-Brockmann | Grid Systems & Layout (column grids, modular grids, baseline) |
| Layout Essentials: 100 Design Principles | Beth Tondreau | Grid Systems & Layout (practical grid application, layout patterns) |
| Designing Brand Identity | Alina Wheeler | Brand & Identity Considerations |
| Logo Design Love | David Airey | Brand & Identity Considerations |
| The Laws of Simplicity | John Maeda | Whitespace & Density, Visual Hierarchy |
