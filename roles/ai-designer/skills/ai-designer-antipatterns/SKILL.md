---
name: ai-designer-antipatterns
description: Anti-pattern catalog for the AI Designer suite. Catalogs AI-specific design mistakes, classic UX anti-patterns, dark patterns to avoid, visual design anti-patterns, interaction anti-patterns, content and IA anti-patterns, accessibility anti-patterns, and an anti-pattern detection checklist. Load as a companion to all other ai-designer Skills to audit designs for common mistakes.
---

# Anti-Pattern Library

## How to Use This Skill

This is a reference library, not a sequential read. Use it as a diagnostic tool.

### Usage Protocol

1. After producing any design artifact, scan the relevant anti-pattern categories below.
2. Each anti-pattern follows this format:
   - **Name** — What the mistake is
   - **Description** — What it looks like in practice
   - **Why It Happens** — The root cause (so you can prevent it)
   - **What To Do Instead** — The concrete fix
   - **Detection** — A question to ask yourself
3. If you find yourself matching an anti-pattern, stop and fix it before proceeding.
4. The detection checklist at the end (§ Anti-Pattern Detection Checklist) is a quick-scan summary.

### Severity Levels

- **Critical**: Dark patterns and accessibility violations. Must fix before delivery.
- **High**: AI-specific anti-patterns. These are your most likely mistakes.
- **Medium**: Classic UX and visual anti-patterns. Fix unless you have a documented reason.
- **Low**: Content and IA anti-patterns. Fix when time permits, flag otherwise.

---

## AI-Specific Design Anti-Patterns

These are patterns that AI designers are particularly prone to. This section is your highest-priority audit target.

### Generic Symmetry

**Description**: Defaulting to perfectly balanced, symmetrical layouts where every element is centered and evenly distributed. Real designs use intentional asymmetry to create hierarchy and visual interest.

**Why It Happens**: Symmetry is the "safest" choice — it offends no one and requires no judgment calls about emphasis. AI defaults to balance because imbalance feels like a mistake.

**Instead**: Use asymmetry to create focal points and guide attention. One side heavier than the other. One element larger. The layout should tell the user where to look first, second, third.

**Detection**: "Is every element perfectly centered or evenly spaced? Does the layout have a clear focal point, or does it feel like a spreadsheet?"

### Token Soup

**Description**: Applying design tokens mechanically without understanding the relationships between elements. Using `spacing-4` everywhere because it appears most frequently in examples. Every gap identical, every padding the same.

**Why It Happens**: Tokens are concrete values that can be applied without judgment. Picking the "right" token requires understanding why one spacing value works better than another — a contextual judgment that AI struggles with.

**Instead**: Choose spacing based on the relationship between elements. Related items get tighter spacing. Separate groups get wider spacing. The token system encodes a range of relationships — use the full range. (See ai-designer-system.md § Design Tokens)

**Detection**: "Can I explain why each spacing value was chosen, or did I just pick the most common one?"

### Placeholder Syndrome

**Description**: Designs where placeholder text and stock images ARE the design. No consideration for real content length variation. "Lorem ipsum" in every text field. "User Name" always exactly two words.

**Why It Happens**: AI doesn't have access to real content and treats placeholders as final. The design looks complete with perfect-length placeholder text, masking layout problems that real content would reveal.

**Instead**: Design for content extremes — shortest and longest possible. Test with a one-word name and a 40-character name. Test with one paragraph and ten paragraphs. The design must accommodate the range.

**Detection**: "Have I tested this with real content of varying lengths? What happens when the title is 3 words? 30 words?"

### Feature Parity Blindness

**Description**: Giving every feature equal visual weight because all requirements seem equally important in the spec. Every button the same size, every section the same prominence, every action equally visible.

**Why It Happens**: AI treats requirements as a flat list. Without user research or usage data, every feature appears equally important. The result is visual democracy — and visual democracy is visual chaos.

**Instead**: Establish clear hierarchy. One primary action per screen. Two to three secondary actions. Everything else is tertiary or hidden. If you don't have usage data, use task frequency as a proxy. (See ai-designer-visual.md § Visual Hierarchy)

**Detection**: "What is the single most important thing on this screen? Can I point to it instantly?"

### Convention Over Context

**Description**: Blindly copying patterns from popular apps without considering whether they fit this specific product, audience, or use case. "Spotify does it this way" is not a design rationale.

**Why It Happens**: AI training data is full of popular app patterns. These patterns are easy to recall and apply. But a pattern that works for music discovery may fail for medical records.

**Instead**: Understand why a pattern works before applying it. What user need does it serve? Does your context share that need? If not, the pattern doesn't transfer. (See ai-designer-core.md § Universal Design Principles)

**Detection**: "Why did I choose this pattern specifically for this context? Would a different pattern serve these users better?"

### Over-Explanation

**Description**: Adding tooltips, labels, help text, info icons, and instructional copy to everything. The result is a cluttered, patronizing interface that treats users like they've never seen a computer.

**Why It Happens**: AI errs on the side of caution — if something might be confusing, add an explanation. This compounds across a full interface until the explanations are more confusing than the interface itself.

**Instead**: Make the interface self-evident through clear labels, familiar patterns, and logical layout. If you need a tooltip, the design may be unclear. Fix the design first, add the tooltip as a last resort.

**Detection**: "Can I remove any labels, tooltips, or help text without losing clarity? If the UI needs this much explanation, is the design itself the problem?"

### Consistency Zealotry

**Description**: Making everything look and behave identically when differentiation is needed. Every card the same size. Every button the same style. Every page the same layout. Consistency is a tool, not a goal.

**Why It Happens**: "Be consistent" is a design principle AI takes literally. But consistency means "same things look the same" — not "all things look the same." Different things should look different.

**Instead**: Be consistent where uniformity aids usability (navigation, common actions). Be different where differentiation aids clarity (primary vs. secondary actions, different content types). (See ai-designer-core.md § Universal Design Principles)

**Detection**: "Does every element that looks the same actually do the same thing? Does every element that does something different look different?"

### Aesthetic Over Functional

**Description**: Prioritizing visual beauty over usability. Tiny fonts because they look elegant. Low contrast because it's "modern." Hidden navigation because it's "clean." Form over function.

**Why It Happens**: AI can evaluate visual harmony more easily than usability. A beautiful screenshot looks like a success. But users don't look at screenshots — they use interfaces.

**Instead**: Beauty must serve usability, not compete with it. If making something more usable makes it less beautiful, the design has a structural problem. Redesign until usability and aesthetics align. (See ai-designer-visual.md § Visual Hierarchy)

**Detection**: "If I make this more usable, does it become less beautiful? If yes, the design has a problem."

### Infinite Scroll Default

**Description**: Defaulting to infinite scroll for every list because it's the pattern AI has seen most often. Infinite scroll works for browsing (social media, image galleries). It fails for task-oriented finding.

**Why It Happens**: Infinite scroll is the dominant pattern in consumer apps that make up most training data. It's also simpler to specify than pagination with sort/filter controls.

**Instead**: Choose pagination vs. infinite scroll based on user goals. Browsing or discovery = infinite scroll. Finding a specific item = pagination with search and filters. Managing items = pagination with selection controls. (See ai-designer-interaction.md § Navigation Patterns)

**Detection**: "Are users browsing or searching? Can they find what they're looking for, or just what they stumble upon?"

### Modal Addiction

**Description**: Using modal dialogs for everything — confirmations, settings, forms, messages, alerts. Modals on top of modals. The entire experience is a series of interruptions.

**Why It Happens**: Modals are a well-documented pattern with clear structure. AI defaults to them because they're contained and predictable. But modals interrupt the user's flow.

**Instead**: Modals are for critical decisions or focused tasks that require the user's full attention. For everything else, use inline expansion, slide-over panels, or page navigation. (See ai-designer-interaction.md § State Design)

**Detection**: "Could this be an inline element instead of a modal? Am I showing a modal on top of another modal?"

### Hamburger Everything

**Description**: Hiding essential navigation in hamburger menus by default, even on desktop or when there are only four items. The hamburger menu becomes a junk drawer for everything.

**Why It Happens**: The hamburger menu is a universal solution that works for any number of navigation items. AI defaults to it because it handles the general case. But "handles" is not "optimizes."

**Instead**: Show primary navigation visibly — tab bars on mobile, horizontal nav on desktop. Use hamburger only for secondary navigation or when screen space is truly constrained and items exceed 5-6. (See ai-designer-interaction.md § Navigation Patterns)

**Detection**: "Can users reach key sections without opening a menu? Are there fewer than 5 items hidden in a hamburger?"

### Design Token Fetishism

**Description**: Obsessing over token values, naming conventions, and system completeness while ignoring whether the resulting interface actually works for users. The token system becomes the product.

**Why It Happens**: Tokens are systematic and concrete — perfect for AI to optimize. But optimizing the system is not the same as optimizing the experience. A perfect token system can produce a terrible interface.

**Instead**: Tokens serve the experience, not the other way around. Start with the desired experience, then express it through tokens. If a token doesn't serve a user need, question whether it belongs. (See ai-designer-system.md § Design Tokens)

**Detection**: "Am I choosing tokens because they serve the user, or because they complete the system?"

### Grayscale Wireframe Trap

**Description**: Producing wireframes that look like finished designs (too much visual detail) or finished designs that look like wireframes (too little visual refinement). Conflating fidelity levels.

**Why It Happens**: AI generates at whatever fidelity level emerges from the prompt. Without clear fidelity calibration, outputs drift toward a muddy middle — too polished for exploration, too rough for implementation.

**Instead**: Wireframes communicate structure with low visual fidelity — boxes, labels, hierarchy. Final designs communicate the complete experience with full fidelity — real colors, typography, imagery. Keep these distinct. (See ai-designer-core.md § Design Specification Document Template)

**Detection**: "Can a stakeholder tell whether this is a wireframe or a final design within 2 seconds?"

### One-State Design

**Description**: Designing only the happy path — the default view with ideal data. Forgetting empty states, error states, loading states, edge cases, first-time experiences, and maximum content scenarios.

**Why It Happens**: The happy path is the most straightforward to design and the most visually appealing. Edge cases require creative problem-solving and often ugly solutions. AI gravitates toward the pretty screenshot.

**Instead**: For every screen, design at minimum: default state, empty state, loading state, error state, maximum content state, and first-time user state. If you haven't designed the error state, you haven't designed the screen. (See ai-designer-interaction.md § State Design)

**Detection**: "Have I designed every state for every screen? What does this look like with zero items? With 10,000 items? When the API fails?"

### Fake Personalization

**Description**: Suggesting "personalized" elements, "recommended for you" sections, or "smart" features without any actual user data to power them. The design implies intelligence that doesn't exist.

**Why It Happens**: Personalization is a common pattern in AI training data. It's easy to design a "Recommended for You" section. It's hard to design the data pipeline that makes it real.

**Instead**: If you don't have user data, don't pretend. Use smart defaults based on common patterns (most popular, most recent, highest rated) and label them honestly. "Popular items" is honest. "Picked for you" without data is a lie.

**Detection**: "Is this 'personalization' actually based on user data, or is it a lie dressed up as a feature?"

---

## Classic UX Anti-Patterns

These are well-documented UX mistakes that persist because they're easy to create and hard to notice from the designer's perspective.

### Mystery Meat Navigation

**Description**: Unlabeled icons that require hover, click, or guesswork to understand. Icon-only toolbars where every icon is ambiguous. Navigation that works only if you already know where things are.

**Why It Happens**: Icons look cleaner than text. Designers who created the icons know what they mean. Users don't.

**Instead**: Label icons with text. If space is constrained, use tooltips — but only as a supplement, not as the primary label. If an icon's meaning isn't universally understood (home, search, close), it needs a text label.

**Detection**: "Can a first-time user understand every navigation element without hovering or clicking?"

### Paradox of Choice

**Description**: Presenting too many options simultaneously without guidance, categorization, or recommendation. 50 items in a dropdown. 12 buttons on a toolbar. 8 pricing plans.

**Why It Happens**: More options feels like more value. But past ~7 options, decision quality drops and anxiety rises. Users freeze or choose randomly.

**Instead**: Limit visible options to 5-7. Categorize larger sets. Provide a recommended or default option. Use progressive disclosure — show common options first, reveal advanced options on demand.

**Detection**: "How many choices does the user face at each decision point? Is there a clear recommended path?"

### Doorway Effect

**Description**: Multi-step processes where users lose context — they forget why they started, what they've entered, or where they are in the flow. Each step is a blank slate.

**Why It Happens**: Each step is designed in isolation. The designer sees the full flow; the user sees one step at a time.

**Instead**: Show context throughout the flow. Display the goal at the top. Show a progress indicator. Summarize previous entries. Minimize the number of steps. (See ai-designer-interaction.md § Stepped Navigation (Wizard / Stepper))

**Detection**: "Can the user see their goal and progress from every step in this flow?"

### Feature Creep in UI

**Description**: Every feature gets a button, menu item, or section. Nothing is prioritized. The interface grows with the feature list until it becomes overwhelming.

**Why It Happens**: Each feature was added by someone who thought it was important. No one looked at the cumulative effect. The UI becomes a geological record of product decisions.

**Instead**: Prioritize by frequency of use. Common actions: visible and prominent. Occasional actions: discoverable but not prominent. Rare actions: accessible via search or settings. Remove features that fewer than 5% of users touch.

**Detection**: "If I removed the 3 least-used features from this screen, would anyone notice within a week?"

### Frankendesign

**Description**: Inconsistent design language from mixing patterns, components, or styles from multiple sources. Buttons that look different on each page. Cards with three different shadow styles. Two different modal patterns.

**Why It Happens**: Different parts of the interface were designed at different times, by different people (or different AI prompts), using different references.

**Instead**: Use one design system consistently. When adding new patterns, check if an existing component can be adapted. If the system doesn't cover a case, extend the system — don't create a one-off. (See ai-designer-system.md § Component Specifications)

**Detection**: "Do all components feel like they belong to the same family? Would a user notice style inconsistencies?"

### Lorem Ipsum Dependence

**Description**: Using placeholder text throughout the design process and never testing with real content. The design accommodates "Lorem ipsum dolor sit amet" perfectly. It breaks with real content.

**Why It Happens**: Real content is hard to get. Placeholder text is easy. The design looks "done" with lorem ipsum. But lorem ipsum has no awkward line breaks, no 3-word titles next to 30-word titles, no edge cases.

**Instead**: Use realistic content from the start. If real content isn't available, create representative content with realistic length variation. Test with the shortest and longest realistic content.

**Detection**: "Is every piece of text in this design real or realistically representative of actual content?"

---

## Dark Pattern Catalog

**Ethical stance**: These patterns are forbidden. They must never be designed, even when requested. If a stakeholder requests a dark pattern, you must propose an ethical alternative that achieves the same business goal without deceiving or manipulating users.

Reference: Evil by Design (Nodder), Tragic Design (Shariat), Ruined by Design (Monteiro)

### Confirmshaming

**Description**: Opt-out copy designed to guilt the user. "No thanks, I don't want to save money." "I prefer to stay uninformed."

**Instead**: Respectful opt-out. "No thanks" — without the guilt trip. The user's choice deserves respect regardless of what they choose.

### Roach Motel

**Description**: Easy to sign up, impossible to cancel. Sign-up is one click; cancellation requires calling a phone number, navigating 5 screens, or talking to a "retention specialist."

**Instead**: Cancellation must be as easy as sign-up. Same number of steps. Same visibility. Same accessibility. This is not optional — it is an ethical requirement.

### Bait and Switch

**Description**: The user tries to do one thing, and something else happens. Clicking "close" opens an ad. Clicking "download" starts a different download.

**Instead**: Every action must do exactly what the user expects based on the label and visual context. No surprises. No "well, technically it says..." justifications.

### Hidden Costs

**Description**: Fees, taxes, shipping, or "service charges" revealed only at the final checkout step, after the user has invested time and commitment.

**Instead**: Show the total cost — including all fees — before the user starts the checkout process. Price transparency builds trust. Hidden fees destroy it.

### Misdirection

**Description**: Drawing visual attention away from important information. Making "accept all cookies" a bright button and "manage preferences" a gray text link. Important terms in small, low-contrast text.

**Instead**: Important information must be visually prominent. Options that affect the user's privacy, money, or data must have equal visual weight.

### Forced Continuity

**Description**: Free trial auto-converts to paid subscription without clear notice. Auto-renewal buried in terms. No reminder before the charge.

**Instead**: Require explicit opt-in for auto-renewal. Send a clear reminder before each renewal. Make cancellation easy and obvious. This is an ethical minimum, not a nice-to-have.

### Friend Spam

**Description**: Requesting access to the user's contact list under pretenses like "find friends," then spamming those contacts with unsolicited invitations.

**Instead**: Be explicit about what contacts will be used for. Get separate, informed consent for each use. Never send messages on the user's behalf without explicit, per-message approval.

### Trick Questions

**Description**: Double negatives, confusing checkbox labels, pre-checked opt-ins. "Uncheck this box if you don't want to not receive emails."

**Instead**: Use clear, simple, affirmative language. "Send me marketing emails" — checked means yes, unchecked means no. No double negatives. No pre-checked boxes for data sharing.

---

## Visual Design Anti-Patterns

### Flat Design Extremism

**Description**: Removing all visual cues in the name of minimalism. Users can't distinguish interactive elements from static content. Buttons look like text. Links look like labels. Everything is flat, borderless, and ambiguous.

**Why It Happens**: Flat design is the dominant aesthetic. "Clean" is praised. But clean becomes sterile when affordances disappear.

**Instead**: Flat design can be clean and functional. But interactive elements need clear signifiers — color differentiation, subtle elevation, underlines for links, distinct button shapes. (See ai-designer-core.md § Affordances & Signifiers)

**Detection**: "Can a user tell what's clickable and what isn't without trial and error?"

### Rainbow Syndrome

**Description**: Using too many colors without a cohesive palette. Every section a different color. Status indicators in 8 different hues. Charts that look like confetti.

**Why It Happens**: Color is an easy differentiator. Without a constrained palette, each new element gets a new color until the interface is a carnival.

**Instead**: Use the design system's color palette. Limit functional colors to 2-3 main hues plus neutrals. Use shade variations of the same hue rather than new hues. (See ai-designer-system.md § Design Tokens — Color Palette)

**Detection**: "How many distinct hues am I using? Can I reduce them without losing information?"

### Typography Chaos

**Description**: Mixing too many typefaces, sizes, weights, and styles. Five font sizes on one screen. Bold, italic, bold-italic, uppercase, small-caps all competing for attention.

**Why It Happens**: Each text element is styled independently without reference to a type scale. New sizes are invented for each new context.

**Instead**: Use a defined type scale with 5-7 sizes. Limit to 2 typefaces maximum (one display, one body). Use weight and size — not typeface changes — to create hierarchy. (See ai-designer-visual.md § Typography in Practice)

**Detection**: "How many distinct text styles are on this screen? Can I reduce them to fit within my type scale?"

### Grid Ignorance

**Description**: Elements floating without alignment. Left edges that don't line up. Inconsistent gutters. The layout feels "off" but you can't pinpoint why.

**Why It Happens**: Each element is positioned individually rather than placed on a grid. Small misalignments compound into visual disorder.

**Instead**: Everything aligns to a consistent grid — column grid for layout, baseline grid for typography. If something is off-grid, it should be intentionally off-grid for emphasis, not accidentally off-grid from laziness. (See ai-designer-visual.md § Grid Systems & Layout)

**Detection**: "Do all left edges align? Are all gutters consistent? Can I overlay a grid and see alignment?"

### Whitespace Phobia

**Description**: Filling every available pixel with content, controls, or decoration. No breathing room. No visual rest. The interface feels claustrophobic and overwhelming.

**Why It Happens**: Empty space feels like wasted space. There's pressure to "use the space" and show more content. But density without hierarchy is noise.

**Instead**: Whitespace is a design element, not empty space. It creates hierarchy, groups related elements, and gives the eye places to rest. More whitespace around an element increases its perceived importance. (See ai-designer-visual.md § Whitespace & Density)

**Detection**: "Is there breathing room between sections? Can I increase spacing without losing functionality?"

### Decorative Overload

**Description**: Gratuitous gradients, drop shadows, borders, background patterns, and ornamental elements that add visual noise without communicating anything.

**Why It Happens**: Decoration makes a design feel "designed." Each effect adds a small amount of visual interest. But they compound into clutter.

**Instead**: Every visual element must serve a purpose — grouping, hierarchy, state indication, or brand expression. If a shadow doesn't indicate elevation, remove it. If a border doesn't separate content, remove it.

**Detection**: "Can I remove this decorative element without losing information or hierarchy? If yes, remove it."

---

## Interaction Anti-Patterns

### Click Target Lottery

**Description**: Interactive elements that are too small to tap reliably or spaced so closely that users hit the wrong one. 20px buttons. Links 4px apart. Touch targets that overlap.

**Why It Happens**: Designs optimized for pixel-perfect screenshots, not for fingers. What looks fine at 100% zoom on a desktop monitor fails on a phone held in one hand.

**Instead**: 44×44pt minimum touch targets with at least 8pt spacing between adjacent targets. This is a hard requirement, not a suggestion. (See ai-designer-core.md § Accessibility Foundations)

**Detection**: "Can I tap every interactive element reliably with my thumb? Is there at least 8pt between adjacent targets?"

### Invisible Loading

**Description**: No feedback during asynchronous operations. The user clicks a button and nothing happens. Did it work? Is it loading? Did it fail? The interface gives no indication.

**Why It Happens**: Loading states are designed after the happy path. Or they're specified but only for full-page loads, not for individual actions.

**Instead**: Every operation taking longer than 300ms needs a loading indicator. Buttons should show inline spinners. Content areas should show skeleton screens. Progress should be determinate when possible. (See ai-designer-interaction.md § Feedback & System Status)

**Detection**: "What does the user see between clicking the button and seeing the result?"

### Scroll Hijacking

**Description**: Overriding the browser's native scroll behavior — changing scroll speed, snapping to sections, horizontal scrolling on vertical scroll, parallax effects that fight the scroll direction.

**Why It Happens**: Custom scroll feels "premium" and enables storytelling effects. But users have decades of muscle memory for how scrolling works.

**Instead**: Never override default scroll behavior. Users expect predictable, consistent scrolling. If you need section-based navigation, use scroll-snap sparingly and allow natural scrolling between snap points.

**Detection**: "Does scrolling feel natural and predictable, or does the page fight the user's scroll input?"

### Popup Avalanche

**Description**: Multiple overlays appearing in sequence — a cookie banner, then a newsletter popup, then a chat widget, then a notification permission request. Or modals stacking on modals.

**Why It Happens**: Each popup was added by a different stakeholder for a different goal. No one evaluated the cumulative experience.

**Instead**: Consolidate or sequence interruptions. Maximum one popup per page load. Never stack modals. Delay non-essential prompts until the user has engaged with the content.

**Detection**: "How many popups, banners, or overlays does a new user see before they can use the page?"

### Disabled State Mystery

**Description**: Buttons or controls that are grayed out with no explanation. The user wants to perform an action but can't, and has no idea why or how to fix it.

**Why It Happens**: The disabled state is implemented as a visual style (gray, low opacity) but the condition that causes it isn't communicated.

**Instead**: Show why an element is disabled and how to enable it. A tooltip on the disabled button: "Complete all required fields to submit." Or adjacent text explaining the prerequisite.

**Detection**: "For every disabled element, can the user understand why it's disabled and what to do about it?"

### Zombie Controls

**Description**: UI elements that appear interactive but aren't. Buttons that don't click. Links that go nowhere. Form fields that can't be edited. The interface promises interactivity and doesn't deliver.

**Why It Happens**: Elements are styled as interactive (button-like appearance, link-like color) but haven't been connected to functionality, or are decorative elements styled too aggressively.

**Instead**: If it looks interactive, it must be interactive. If it's not interactive, it must not look interactive. Static text should look like static text. Decorative elements should not resemble buttons or links.

**Detection**: "Does every element that looks clickable actually do something when clicked?"

---

## Content & Information Architecture Anti-Patterns

### Jargon Overload

**Description**: Using internal terminology, technical terms, or industry jargon that users don't understand. "Reconcile your ledger entries" when users think in terms of "Match your receipts."

**Why It Happens**: Designers and developers use internal terminology daily. It feels natural. But users have their own vocabulary for the same concepts.

**Instead**: Use the language your users use. Test labels with real users. If a term requires explanation, replace it with a simpler term. (See ai-designer-core.md § Information Architecture Principles)

**Detection**: "Would my least technical user understand every label on this screen without asking for help?"

### Wall of Text

**Description**: Dense paragraphs of text with no visual structure. No headings, no bullet points, no bold keywords, no visual breaks. The user must read every word to find what they need.

**Why It Happens**: Content is written as prose rather than designed for scanning. The writer (or AI) defaults to complete sentences and full paragraphs.

**Instead**: Structure content for scanning. Use headings to create sections. Use bullet points for lists. Bold key terms. Keep paragraphs to 3-4 lines. Front-load important information. (See ai-designer-core.md § Content Strategy Essentials)

**Detection**: "Can a user find the key information on this screen in under 5 seconds by scanning?"

### Orphan Pages

**Description**: Pages that exist in isolation — no breadcrumbs, no related links, no clear path back to the main navigation. Users arrive (often via search) and are stranded.

**Why It Happens**: Pages are designed individually rather than as part of a navigation ecosystem. Internal links are added later (or never).

**Instead**: Every page must be reachable from the primary navigation structure. Every page must provide context (breadcrumbs) and paths to related content. Dead ends are navigation failures.

**Detection**: "Can I reach this page from the main navigation? Can I get from this page to related content?"

### Deep Nesting

**Description**: Information buried 4 or more levels deep in the navigation hierarchy. Settings > Advanced > Notifications > Email > Frequency. Users give up before reaching the content.

**Why It Happens**: The information architecture mirrors the org chart or database schema rather than user mental models. Each category is subdivided until the hierarchy is deep and narrow.

**Instead**: Flatten the hierarchy. Broad and shallow beats narrow and deep. If users need something frequently, it shouldn't require more than 2-3 clicks from the home screen. Use search as an escape hatch for deep content.

**Detection**: "What's the maximum number of clicks to reach any piece of content? Is it more than 3?"

### Misleading Labels

**Description**: Navigation labels that don't match the destination content. "Resources" that leads to a sales page. "Dashboard" that shows a settings screen. "Help" that shows a marketing FAQ.

**Why It Happens**: Labels are chosen for marketing or organizational reasons rather than user comprehension. Or labels were accurate once but the content changed.

**Instead**: The label must accurately describe what the user will find. Test with the "5-second rule" — show users the label and ask what they expect to find. If expectations don't match reality, the label is wrong.

**Detection**: "If I showed someone this label without context, would they correctly predict what they'd find?"

---

## Accessibility Anti-Patterns

These are not optional. Accessibility failures exclude real users and often violate legal requirements.

### Color-Only Signaling

**Description**: Using only color to convey meaning. Red for errors, green for success — with no icon, text label, or other indicator. Users who are colorblind or using monochrome displays get no information.

**Why It Happens**: Color is the quickest visual differentiator. It's easy to add and looks clean. But ~8% of men and ~0.5% of women have color vision deficiency.

**Instead**: Always pair color with a secondary indicator — an icon, a text label, a pattern, or a border style. Color enhances the signal; it must never be the only signal. (See ai-designer-core.md § Accessibility Foundations)

**Detection**: "If I converted this screen to grayscale, would all information still be communicated?"

### Keyboard Trap

**Description**: Focusable elements that trap keyboard focus — the user can Tab in but can't Tab out. Common in modals, custom dropdowns, and embedded widgets.

**Why It Happens**: Custom components are built for mouse interaction and keyboard behavior is an afterthought. Focus management isn't tested.

**Instead**: Test every interactive element with Tab and Shift+Tab. Focus must always be able to move forward and backward. Modals must trap focus within themselves AND release it when closed.

**Detection**: "Can I navigate the entire interface using only the Tab key? Can I always escape from any focused element?"

### Contrast Violation

**Description**: Text that doesn't meet WCAG AA contrast ratios. Light gray text on white backgrounds. Low-contrast placeholder text. Colored text on colored backgrounds that look fine on one monitor and disappear on another.

**Why It Happens**: Low contrast looks "sophisticated" and "modern." The designer's high-end monitor shows subtle differences that cheaper monitors can't reproduce.

**Instead**: Verify contrast ratios — 4.5:1 for normal text, 3:1 for large text (18pt+ or 14pt bold). No exceptions for "aesthetic" reasons. (See ai-designer-core.md § Accessibility Foundations)

**Detection**: "Does every text element meet WCAG AA contrast ratios? Have I checked with a contrast tool, not just my eyes?"

### Mouse-Only Interactions

**Description**: Functionality that requires a mouse — hover-only tooltips, drag-only reordering, right-click-only menus, swipe-only actions with no alternative.

**Why It Happens**: Mouse interactions are intuitive and well-documented. Keyboard and touch equivalents require additional design and implementation work.

**Instead**: Every mouse interaction needs a keyboard equivalent and a touch equivalent. Hover tooltips need focus-triggered equivalents. Drag-to-reorder needs arrow-key reordering. Right-click menus need visible action buttons.

**Detection**: "Can every interaction be performed without a mouse? Without a touchscreen? With only a keyboard?"

### Motion Assault

**Description**: Aggressive animations — auto-playing videos, parallax scrolling, large-scale transitions, pulsing elements — without respecting the user's motion preferences. Some users experience nausea, dizziness, or seizures from motion.

**Why It Happens**: Animation adds "polish" and "delight." The impact on motion-sensitive users is invisible to the designer.

**Instead**: Respect `prefers-reduced-motion`. When the user has requested reduced motion, disable or significantly reduce all non-essential animations. Essential feedback (loading spinners) can remain but should be subtle. (See ai-designer-system.md § Design Tokens — Motion & Animation)

**Detection**: "Have I tested with prefers-reduced-motion enabled? Does the interface still work and communicate without animations?"

### Alt Text Neglect

**Description**: Missing alt text, or unhelpful alt text that describes the file rather than the content. "image.png", "photo", "screenshot", "hero-banner-v3-final." Screen reader users get no useful information.

**Why It Happens**: Alt text is metadata that sighted users never see. It's invisible in visual designs and easy to forget.

**Instead**: Every informational image needs alt text that describes what the image communicates, not what it looks like. Decorative images get empty alt (`alt=""`). Functional images (icons used as buttons) describe the function, not the icon.

**Detection**: "If I replaced every image with its alt text, would the content still make sense?"

---

## Anti-Pattern Detection Checklist

Run this checklist after completing any design artifact. It's organized by severity — fix critical issues before delivery, address important issues before handoff, and review lower-severity items as time permits.

### Critical (Must Fix Before Delivery)

- [ ] Any dark patterns present? (See § Dark Patterns) — These are never acceptable.
- [ ] Any accessibility anti-patterns? (See § Accessibility Anti-Patterns) — These exclude real users.
- [ ] Any one-state designs missing error, empty, or loading states? (See § One-State Design)
- [ ] Any color-only signaling without secondary indicators? (See § Color-Only Signaling)
- [ ] Any contrast violations below WCAG AA? (See § Contrast Violation)
- [ ] Any keyboard traps in custom components? (See § Keyboard Trap)

### Important (Should Fix Before Handoff)

- [ ] Any AI-specific anti-patterns? (See § AI-Specific Design Anti-Patterns) — Your most likely mistakes.
- [ ] Any visual anti-patterns — rainbow colors, typography chaos, grid misalignment? (See § Visual Design Anti-Patterns)
- [ ] Any interaction anti-patterns — tiny targets, invisible loading, scroll hijacking? (See § Interaction Anti-Patterns)
- [ ] Any disabled elements without explanation? (See § Disabled State Mystery)
- [ ] Any zombie controls that look interactive but aren't? (See § Zombie Controls)
- [ ] Any feature parity blindness — all features given equal weight? (See § Feature Parity Blindness)

### Review (Consider Fixing)

- [ ] Any content or IA anti-patterns — jargon, walls of text, orphan pages? (See § Content & IA Anti-Patterns)
- [ ] Any generic symmetry or over-consistency? (See § Generic Symmetry, § Consistency Zealotry)
- [ ] Any over-explanation or modal addiction? (See § Over-Explanation, § Modal Addiction)
- [ ] Is the hamburger menu hiding essential navigation? (See § Hamburger Everything)
- [ ] Any placeholder syndrome — designs untested with real content? (See § Placeholder Syndrome)
- [ ] Any convention over context — patterns borrowed without rationale? (See § Convention Over Context)

---

## Book Source Appendix

The anti-patterns in this catalog are informed by the following references:

| Book | Author(s) | Primary Contribution |
|------|-----------|---------------------|
| Evil by Design | Chris Nodder | Dark pattern identification and ethics |
| Tragic Design | Jonathan Shariat | Consequences of bad design on real users |
| Ruined by Design | Mike Monteiro | Designer responsibility and ethical practice |
| Don't Make Me Think | Steve Krug | Usability heuristics and common mistakes |
| Refactoring UI | Adam Wathan & Steve Schoger | Visual design anti-patterns and practical fixes |
| Designing with the Mind in Mind | Jeff Johnson | Cognitive psychology of interface mistakes |
| The Design of Everyday Things | Don Norman | Affordance failures and signifier problems |

---

*Load this skill alongside any ai-designer skill. After producing a design, run § Anti-Pattern Detection Checklist. Fix critical issues immediately. Flag important issues for revision. Note review items for future iteration.*
