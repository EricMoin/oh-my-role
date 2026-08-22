# Anti-Slop: Catalog of AI-Generated UI Tells

AI-generated UI reads as slop when the design picks the default answer at every decision point: the modal answer, not the subject's answer. Fixing tells one by one helps, but grounding the design in the subject (see SKILL.md, "Ground it in the subject") fixes the cause.

Each entry below: the tell, why it reads as slop, and what to do instead.

## 1. Default shadcn-everywhere with no identity

❌ Every surface is the same rounded-lg white card, the same `border-border`, the same neutral gray text, with no reason for any of it.

Why it reads as slop: it is the framework's answer, not the subject's. A page built entirely from stock primitives has no point of view, so it looks like every other page built from stock primitives.

✅ Keep the primitives where they earn their place (forms, dialogs, tables), then let one or two signature surfaces carry the identity: a distinctive hero, a custom type treatment, a color or texture that comes from the subject. Primitives in the body, personality in the frame.

## 2. Purple/indigo gradient hero

❌ A full-bleed `bg-gradient-to-r from-purple-600 to-indigo-600` hero with white bold text and a floating mockup.

Why it reads as slop: purple-indigo gradients are the most common default accent in generated UI. The gradient adds nothing about the subject; it is decoration pretending to be brand.

✅ Pick a color that comes from the subject's world, or work with the existing token palette (see the `tailwindcss` skill). If a gradient is right, derive it from a real brand color and give it a job (depth, focus, separation), not just "vibrancy."

## 3. Three-column feature grid with lucide icons + generic copy

❌ Three equal cards, each with a lucide icon in a tinted circle, a two-word title, and two sentences of marketing filler.

Why it reads as slop: the layout is the default "we are a company" pattern. Generic copy ("Seamless integration", "Enterprise-grade security") plus stock icons means the cards could describe any product.

✅ Features earn a grid only when they are genuinely parallel and equal in weight. Write copy specific to the subject. Let each feature's explanation carry the meaning; the icon is support, not substance. If one feature dominates, do not force a grid: use a layout that reflects the real hierarchy.

## 4. Emoji as section markers

❌ `## 🚀 Getting Started`, `## 📊 Analytics`, `## 💡 Tips`, with emoji standing in for design.

Why it reads as slop: emoji are a low-effort way to fake visual interest. They introduce uncontrolled color, render inconsistently across platforms, and carry no real hierarchy.

✅ Use typography and spacing to mark sections: size, weight, case, an eyebrow label in a real typeface, a rule line. If an icon is needed, use a consistent icon set sized and colored deliberately, not emoji.

## 5. Centered everything

❌ Every section is centered: centered heading, centered cards, centered CTA, identical width.

Why it reads as slop: uniform centering removes all hierarchy and rhythm. Nothing tells the eye where to start or what matters most.

✅ Center only the moments that deserve ceremony (a hero, a closing statement). Left-align reading content, vary section widths, let some sections be asymmetric. Hierarchy comes from contrast, not from symmetry.

## 6. Over-rounded cards

❌ Every card at `rounded-3xl` with a soft shadow and generous padding, regardless of content.

Why it reads as slop: the over-rounded card is a default "friendly tech" surface. When every surface is equally soft and equal in radius, nothing stands out and the page looks pillowed.

✅ Match radius to the surface's role and the subject's tone. Use small radii (`rounded-md`) for dense, technical content; larger radii sparingly for hero-scale elements. Vary elevation instead of radius.

## 7. Meaningless glassmorphism

❌ A translucent backdrop-blur panel floating over a colorful image, where the blur serves no purpose.

Why it reads as slop: glassmorphism was a trend default. When the backdrop behind the panel is not actually dynamic or busy, the blur does nothing but look like a trend.

✅ Use backdrop blur only when real content passes behind the surface (sticky nav over scrolling content, overlays over dense UI) and legibility requires it. Otherwise use a solid or near-solid surface.

## 8. Filler "Lorem"-flavored marketing copy

❌ "Empower your team with the next generation of intelligent solutions" and its many cousins.

Why it reads as slop: generic marketing language has no subject. It reads as placeholder because it is placeholder: it could be swapped onto any page without loss or gain.

✅ Write copy that names the actual thing: the product's real behavior, the audience's real problem, the concrete outcome. If real copy does not exist yet, write the honest minimum and mark the gap rather than padding with filler. Short and specific beats long and generic.

## 9. Symmetrical 01/02/03 that isn't a real sequence

❌ Three sections labeled 01, 02, 03 in a row, where the order is arbitrary and nothing about the content is sequential.

Why it reads as slop: numbering implies a process. Stamping numbers on unordered content fabricates a structure that does not exist, and the eye catches it as noise.

✅ Use numbered markers only for genuine sequences: steps, phases, timeline entries. For unordered content, use layout (spacing, type scale, alignment) to create hierarchy instead of fake numbers.

## 10. Excessive framer-motion on every element

❌ Every card, heading, and icon slides, fades, or springs in with its own delay, on every scroll.

Why it reads as slop: when everything moves, nothing moves. Per-element animation with staggered delays is the signature of generated pages, and it reads as noise and as "AI made this."

✅ Choose one orchestrated moment (the hero entrance), one reveal pattern for subsequent sections, and a few purposeful hover micro-interactions. Sequence them so the page reads in order. Motion should carry meaning, not fill time.

## More tells (quick list)

- Stock-photo people in the hero who have nothing to do with the product.
- Every section capped at the same max-width, so the page is a stack of identical-width bands.
- Gradient text on every heading.
- Badge chips ("New", "Beta", "AI-powered") on unrelated features.
- Identical card grids repeated section after section with no visual rhythm.
- A testimonial wall of 6+ generic avatars.

## Anti-slop checklist

Run this before calling a design done:

- [ ] The design states its thesis; the hero is not a generic template
- [ ] Palette, type, and surfaces come from the subject, not from defaults
- [ ] No purple/indigo gradient hero
- [ ] No emoji section markers
- [ ] Not everything is centered
- [ ] Radius and elevation vary by role, not uniformly soft
- [ ] Glassmorphism only where legibility requires it
- [ ] Copy names the actual product and audience; no filler
- [ ] Numbered markers only for real sequences
- [ ] Motion is one orchestrated moment, not per-element sprinkles
- [ ] Colors use design tokens from the `tailwindcss` skill (no raw hex)
