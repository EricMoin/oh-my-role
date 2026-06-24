---
name: ai-designer-interaction
description: Interaction design patterns and principles for the AI Designer suite. Covers microinteractions, navigation patterns, feedback and system status, progressive disclosure, form design, motion and animation principles, state design, UX writing and microcopy patterns, gesture and touch interaction, responsive interaction patterns, and interaction design checklist. Load with ai-designer-core.
---

## Interaction Design Philosophy

Interaction design is the discipline that bridges user intent and system response. Every tap, click, swipe, scroll, and keystroke is a conversation between human and interface. Your job is to make that conversation feel natural, predictable, and effortless.

### Goal-Directed Design

Design for goals, not tasks. A user's goal is "pay my friend back" — the task is "open app, navigate to payments, enter amount, select contact, confirm." Goal-directed design minimizes the gap between intent and outcome. Fewer steps. Fewer decisions. Fewer opportunities to fail.

**Alan Cooper's hierarchy**: Goals drive activities, activities drive tasks, tasks drive actions, actions drive operations. Design at the goal level. Implement at the action level.

**Wrong approach**: "The user needs to fill out 12 fields to create an account."
**Right approach**: "The user's goal is to start using the product. What is the minimum information required to enable that goal?"

### Direct vs Indirect Manipulation

**Direct manipulation**: the user acts on the object itself. Drag to reorder. Pinch to zoom. Swipe to dismiss. Direct manipulation feels natural and provides immediate feedback. It maps to physical-world mental models.

**Indirect manipulation**: the user acts through a proxy. Click up/down arrows to reorder. Click a zoom button. Click a delete button and confirm. Indirect manipulation is more discoverable and more precise, but less engaging.

**When to use each**:
- Direct manipulation: frequent actions, spatial tasks, mobile-first interfaces, when the physical metaphor is obvious
- Indirect manipulation: precise control needed, accessibility requirements, desktop-heavy workflows, when the action is abstract (save, share, export)
- Both: provide direct manipulation as the primary path, indirect as the accessible alternative. Drag-to-reorder plus arrow buttons. Swipe-to-delete plus a delete button.

### The Interaction Loop

Every interaction follows a loop: **intent → action → feedback → evaluation**. The user forms an intent ("I want to delete this item"), performs an action (swipes left), receives feedback (delete button appears, item slides), and evaluates the result ("did it work?"). Design failures occur when any step in this loop breaks down — when the user can't figure out the action, when feedback is absent or misleading, or when evaluation is ambiguous.

**Design principle**: close the gap between intent and action (make things obvious), and close the gap between action and evaluation (make feedback immediate and clear).

### Source References

From: About Face (Cooper) — goal-directed design framework. Designing Interactions (Moggridge) — interaction as conversation. Designing for Interaction (Saffer) — practical interaction patterns.


## Microinteractions

Microinteractions are contained product moments that accomplish a single task. Turning on a switch. Liking a post. Setting an alarm. Pulling to refresh. They are small, but they are the texture of a product — the difference between software that feels alive and software that feels dead.

### Dan Saffer's Four-Part Model

Every microinteraction consists of four parts:

1. **Trigger**: what initiates the microinteraction. User-initiated triggers (tap, click, swipe, voice command) or system-initiated triggers (notification, time-based, location-based, incoming data).

2. **Rules**: what happens once triggered. The rules determine the sequence, conditions, and logic. "If the user swipes past the threshold, reveal the delete button. If not, snap back." Rules are invisible to the user but define the entire behavior.

3. **Feedback**: what the user sees, hears, or feels in response. Visual feedback (color change, animation, position change), auditory feedback (click sound, chime), haptic feedback (vibration pattern on mobile). Feedback must be immediate — any delay >100ms feels sluggish.

4. **Loops and Modes**: what happens over time or on repeat. Loops determine long-term behavior: does the microinteraction change after the 50th use? Does it expire? Does it adapt? Modes are branches: does holding shift change the behavior?

### Common Microinteraction Specifications

#### Toggle Switch

- **Trigger**: tap or click on the toggle element
- **Rules**: flip the boolean state. If currently off, set to on. If on, set to off. Animate the knob position and track color simultaneously.
- **Feedback**: knob slides from one side to the other. Track color transitions (e.g., gray → green). On mobile, provide subtle haptic feedback on state change. The transition duration communicates responsiveness — keep it fast (See ai-designer-system.md § Design Tokens — Motion & Animation).
- **Loops and Modes**: state persists across sessions. No decay. No adaptation needed.

#### Pull-to-Refresh

- **Trigger**: pull gesture on scrollable content that exceeds a defined threshold distance
- **Rules**: if the pull distance exceeds the threshold (typically 80–100pt), initiate a refresh. If the pull distance is below the threshold, snap back to the resting position with elastic easing. During the pull, show progressive feedback proportional to pull distance.
- **Feedback**: a loading indicator appears at the top of the list. On mobile, haptic feedback fires when the threshold is crossed. Content below shifts down to accommodate the indicator. After refresh completes, the indicator collapses and new content appears.
- **Loops and Modes**: resets completely after each refresh cycle. If the refresh fails, show an inline error with retry affordance. Do not auto-retry — the user initiated the action and expects control over retry.

#### Swipe-to-Delete (or Swipe-to-Reveal)

- **Trigger**: horizontal swipe gesture on a list item
- **Rules**: if swipe distance exceeds the action threshold, reveal the action button(s). If not, snap back. Support partial reveal (drag and release) and full swipe (swipe past full threshold to execute immediately). Track velocity — a fast short swipe with high velocity should trigger the same as a slow long swipe.
- **Feedback**: the action panel is revealed progressively behind the list item. Color indicates action type — red for destructive, blue or green for non-destructive. The item itself translates horizontally, maintaining the spatial metaphor.
- **Loops and Modes**: if delete is triggered, provide undo for a timed window (5–10 seconds). After the undo window closes, the deletion is permanent.

#### Like / Favorite Animation

- **Trigger**: tap on the like/favorite icon
- **Rules**: toggle the liked/favorited state. If toggling to "liked," play the full animation sequence. If toggling to "unliked," play a simpler reverse animation.
- **Feedback**: the icon scales down slightly (anticipation), then scales up beyond its final size (overshoot), then settles at the final size (follow-through). Color transitions from outline to filled. Optional: particle burst effect for the "like" action. On mobile, light haptic feedback reinforces the action.
- **Loops and Modes**: state persists. The elaborate animation only plays on the first like — repeated rapid toggling uses a simplified animation to avoid visual noise.

#### Progress Indicator

- **Trigger**: system-initiated when an asynchronous operation begins
- **Rules**: for operations with known duration or percentage, use a determinate progress bar. For operations with unknown duration, use an indeterminate indicator (spinner, pulsing bar, shimmer). Switch from indeterminate to determinate once progress information becomes available.
- **Feedback**: determinate — bar fills left-to-right, percentage or step label updates. Indeterminate — continuous animation that communicates "working." Both types should be accompanied by a text label describing what's happening ("Uploading photo..." not just a spinner).
- **Loops and Modes**: completes when the operation finishes. On error, transition to an error state with retry option. On success, briefly show a completion state (checkmark) before dismissing.

#### Character Counter

- **Trigger**: user begins typing in a length-limited field
- **Rules**: display remaining character count. Update on every keystroke. When approaching the limit (last 20%), change the counter color to warning. When at or over the limit, change to error and optionally prevent further input.
- **Feedback**: the counter is positioned near the text field (typically bottom-right). Color transitions: neutral → warning (amber/yellow) → error (red). If the limit is hard, disable input at the limit. If soft, allow overage but show how many characters over.
- **Loops and Modes**: counter resets when the field is cleared. Persists as long as the field has content.

#### Scroll-to-Top

- **Trigger**: tap on the status bar (iOS convention) or a floating "scroll to top" button that appears after scrolling down a threshold distance (typically 2+ screens)
- **Rules**: smoothly scroll to the top of the content. The button fades in when the scroll threshold is reached and fades out when the user scrolls back near the top.
- **Feedback**: smooth scroll animation with deceleration easing. The button provides standard tap feedback (opacity change or scale).
- **Loops and Modes**: the button reappears every time the user scrolls past the threshold. No state persistence needed.

### Microinteraction Design Rules

1. **One trigger, one purpose.** A microinteraction does one thing. If it does two things, split it into two microinteractions.

2. **Make it feel human.** Natural motion, appropriate timing, proportional feedback. A toggle that snaps instantly feels mechanical. A toggle that eases into position feels crafted.

3. **Don't annoy.** A delightful microinteraction on first encounter becomes irritating by the hundredth. Keep animations fast. Make sounds optional. Never block the user with a microinteraction that doesn't serve their immediate goal.

4. **Feedback must match the action's weight.** A "like" gets a small bounce. A "delete account" gets a serious confirmation. The magnitude of feedback communicates the magnitude of the action.

5. **Signature moments, not signature everything.** Pick 1–3 microinteractions to make distinctive (your signature moments). Everything else should be conventional and invisible. Trying to make every interaction "delightful" results in an exhausting product.

### Source References

From: Microinteractions (Saffer) — the four-part model and design rules. Designing for Emotion (Walter) — signature moments and personality.


## Navigation Patterns

Navigation is the skeleton of a product. Get it right and users move effortlessly. Get it wrong and every task becomes a scavenger hunt.

### Global Navigation — Always Accessible

Global navigation is persistent across all screens. It provides access to the product's top-level destinations.

#### Tab Bar (Bottom Navigation)

- **Use when**: 3–5 top-level destinations, mobile-first product, destinations are of equal importance
- **Specifications**: positioned at the bottom of the screen. Each tab has an icon and a text label — icons alone are ambiguous. Active tab is visually distinct (color change, filled icon vs outline icon). Maximum 5 tabs — beyond 5, navigation becomes cramped and labels truncate.
- **Behavior**: tapping the active tab scrolls its content to the top. Switching tabs preserves the scroll position of each tab's content. Badge indicators on tabs communicate unread counts or pending actions.
- **Accessibility**: tabs are focusable via keyboard. Active tab is announced by screen readers. Swipe gestures between tabs are supplementary, not primary.

#### Sidebar Navigation

- **Use when**: deep information hierarchy (6+ destinations), desktop or tablet primary, users need to see available sections at all times
- **Specifications**: persistent left panel. Width: 240–280pt expanded, 64–72pt collapsed (icon-only). Supports nested sections (expandable groups). Active item is highlighted. Scroll if content exceeds viewport height.
- **Behavior**: on desktop, sidebar is always visible. On tablet, sidebar can be collapsible (toggle between expanded and icon-only). On mobile, sidebar converts to a drawer that overlays content. Hover on collapsed sidebar icons shows tooltip labels.
- **Organization**: group related items under section headings. Most-used items at the top. Use dividers to separate functional groups. Limit nesting to 2 levels — deeper nesting indicates a navigation architecture problem.

#### Top Navigation Bar

- **Use when**: 5–7 top-level items, web-primary product, content-heavy sites where vertical space is premium
- **Specifications**: horizontal link bar at the top of the viewport. Items are text labels (icons optional for reinforcement, not as replacements). Active item is underlined or color-highlighted. Dropdown menus for sub-navigation — triggered by click (not hover, for accessibility and mobile compatibility).
- **Behavior**: sticky on scroll (remains visible as user scrolls down). On narrow viewports, collapses to a hamburger menu or priority+ pattern (most important items visible, rest in "More" dropdown).
- **Limits**: 7 items maximum in the bar — beyond that, cognitive load increases and scanning slows (See ai-designer-psychology.md § Hick's Law). If you have more than 7 top-level sections, restructure the information architecture.

#### Hamburger Menu

- **Use when**: secondary navigation, low-frequency destinations, space is extremely constrained
- **Why sparingly**: hamburger menus hide navigation. Hidden navigation is undiscovered navigation. Studies consistently show that visible navigation increases engagement with navigation items. The hamburger menu is appropriate for settings, help, profile, and other low-frequency destinations — not for primary navigation.
- **If you must use it**: pair with a visible tab bar or bottom navigation for primary items. Put only secondary items in the hamburger. Include a clear icon and label ("Menu" text next to the icon improves discoverability).

### Local Navigation — Context-Specific

Local navigation exists within a section and helps users move within that section's content.

#### Breadcrumbs

- **Use when**: hierarchy is 3+ levels deep, users frequently enter via search or deep links (not the homepage), users need to understand where they are in the hierarchy
- **Specifications**: horizontal trail showing the path from root to current page. Each level is a clickable link except the current page. Separator between levels (typically "/" or ">"). Truncate long trails with an ellipsis for the middle levels, always showing root and current.
- **Placement**: below the global navigation, above the page title. Left-aligned. Do not wrap to multiple lines — truncate.

#### Stepped Navigation (Wizard / Stepper)

- **Use when**: multi-step processes (checkout, onboarding, complex forms), the order of steps matters, each step depends on the previous
- **Specifications**: numbered or labeled steps displayed linearly. Current step is highlighted. Completed steps show a checkmark and are clickable (allow back-navigation). Future steps are dimmed but visible. Show total steps ("Step 2 of 4").
- **Behavior**: "Next" button advances. "Back" button returns without losing entered data. If a step has validation, prevent advance until valid. Show a summary/review step before final submission.

#### Faceted Navigation

- **Use when**: large, filterable datasets (e-commerce catalogs, search results, directories), users need to narrow results by multiple attributes
- **Specifications**: filter categories displayed as collapsible groups (price range, category, size, color). Active filters shown as removable chips above results. Result count updates in real-time as filters are applied. "Clear all filters" affordance always visible when filters are active.
- **Behavior**: filters apply immediately (no "Apply" button needed for single-selection filters). For multi-selection or range filters, apply after user confirms. Always show result count to prevent empty-result confusion.

### Contextual Navigation

- **Inline links**: links within body content that navigate to related content. Visually distinct from surrounding text (underline + color). Avoid link text like "click here" — use descriptive text that makes sense out of context.
- **Related content**: cards or links at the bottom of content pages. "Related articles," "Customers also viewed," "Next steps." Keep to 3–6 items.
- **See also / cross-references**: explicit navigation to deeper or related content within the same product. Use when content naturally connects but lives in different sections.

### Search as Navigation

When content volume exceeds browse-ability (roughly >100 items), search becomes the primary navigation method.

- **Autocomplete**: suggest completions as the user types. Show results after 2–3 characters. Highlight the matching portion of each suggestion. Limit to 5–8 suggestions.
- **Recent searches**: show the user's previous queries below the search field. Maximum 5 recent items. Allow clearing individual items or all history.
- **Search results**: clear result count. Sorting options (relevance, date, popularity). Filtering/faceting for refinement. Highlighted search terms in results. Empty state with suggestions for reformulating the query.
- **Behavior**: search field is prominent and accessible from every screen. On mobile, search can be triggered from a persistent icon that expands to a full-screen search experience.

### Mobile Navigation Patterns

Mobile navigation must account for thumb reachability, limited screen space, and one-handed use.

- **Bottom tab bar**: the standard for mobile. Thumb-friendly position. 3–5 items.
- **Bottom sheet navigation**: slides up from the bottom for secondary navigation or actions. Supports partial and full-height states. Dismissible by swipe-down or tapping the overlay.
- **Swipeable pages / tabs**: horizontal swipe between content sections. Combined with a tab indicator at the top or bottom. Good for content that's naturally sequential or categorical (inbox tabs, date ranges).
- **Avoid**: top-of-screen hamburger menus as the sole navigation (hard to reach, poor discoverability), deep navigation hierarchies requiring many taps back, full-screen takeover menus for primary navigation.

### Navigation Pattern Selection Criteria

| Factor | Tabs / Tab Bar | Sidebar | Hamburger | Search |
|---|---|---|---|---|
| Content depth | Shallow (2–3 levels) | Deep (4+ levels) | Any | Any |
| Number of destinations | 3–5 | 6–20 | Unlimited | N/A |
| Task complexity | Simple, frequent | Complex, varied | Low-frequency | Content-heavy |
| User frequency | Daily users | Power users | Occasional users | All users |
| Platform | Mobile-first | Desktop-first | Secondary nav | Universal |

### Source References

From: Designing Interfaces (Tidwell) — navigation pattern taxonomy. About Face (Cooper) — navigation architecture principles.


## Feedback & System Status

Users must always know what is happening. The system's current state must be visible and comprehensible at all times. This is Nielsen's first heuristic, and it is the one most often violated.

### Feedback Types

**Visual feedback** — the most common and most versatile. Color changes, animations, state changes, progress indicators, icons, text updates. Visual feedback must be perceivable without relying on color alone (See ai-designer-core.md § Accessibility Foundations).

**Auditory feedback** — notifications, confirmation sounds, error sounds. Effective for attention-grabbing when the user isn't looking at the screen. Critical for accessibility (screen reader announcements). Use sparingly — sound can be intrusive.

**Haptic feedback** — vibration patterns on mobile devices. Lightweight haptic for toggles and selections. Medium haptic for confirmations. Strong haptic for errors or warnings. Haptic feedback reinforces visual feedback but never replaces it.

### Loading States

Loading is the most common system state users encounter. Design it well.

#### Skeleton Screens

- **Use when**: loading page-level content or complex layouts. The shape and position of content is known before the data arrives.
- **How**: display gray placeholder shapes that mirror the layout of the incoming content. Animate with a subtle shimmer (left-to-right light sweep) to communicate activity.
- **Why**: skeleton screens reduce perceived load time compared to blank screens or spinners. They set expectations about the content layout, making the transition from loading to loaded feel smoother.

#### Progress Bars

- **Use when**: operations with known or estimable duration >3 seconds. File uploads, data exports, batch processing.
- **How**: horizontal bar fills left-to-right. Show percentage and/or descriptive label. Do not let the progress bar stall — if progress is uneven, use a smoothing algorithm to keep it moving. A stalled progress bar is worse than a spinner.
- **Why**: progress bars communicate both "something is happening" and "how long it will take." They reduce anxiety and abandonment for long operations.

#### Spinners

- **Use when**: indeterminate operations <10 seconds where the layout is unknown or the loading area is small.
- **How**: animated rotating indicator. Accompany with a text label when the wait exceeds 3 seconds ("Loading your data..."). Center within the loading area.
- **Why**: spinners communicate "working" but not "how long." They're appropriate for brief, unpredictable waits. For longer waits, they create anxiety — switch to a progress bar or skeleton.

#### Inline Loading

- **Use when**: individual components load independently within an already-rendered page. Lazy-loaded images, asynchronously fetched data panels, search-as-you-type results.
- **How**: show a loading state within the specific component — a small spinner, a skeleton for that component, or a placeholder. Do not block or gray out the rest of the page.
- **Why**: inline loading maintains the user's sense of progress. The page is functional; only a small part is updating.

### Success Feedback

Success feedback confirms that the user's action achieved its goal.

- **Toast / snackbar**: for non-critical confirmations. "Message sent." "File saved." Appears at the bottom or top of the screen, auto-dismisses after 3–5 seconds. Non-blocking — the user can continue working. Include an "Undo" action when the operation is reversible.
- **Inline success**: for form submissions and in-context actions. A green checkmark or success message appears near the action that was taken. "Changes saved" near the save button.
- **Full-page success**: for significant completions (order placed, account created, payment processed). A dedicated confirmation screen with summary, next steps, and clear navigation forward. Do not dead-end the user — always provide a path forward.

**Design rule**: success feedback is brief and non-intrusive. The user wanted to accomplish something; they accomplished it. Don't celebrate excessively. Don't block them with a modal saying "Success!" that they have to dismiss.

### Error Feedback

Error feedback must be specific, actionable, and positioned near the source of the error (See ai-designer-core.md § Help Users Recognize, Diagnose, Recover from Errors).

- **Inline field errors**: red border on the field, error message below the field, icon within the field. "This email is already registered." Not "Invalid input." Not "Error."
- **Form-level errors**: summary at the top of the form listing all errors with anchor links to each field. "3 fields need attention:" followed by specific items. This supplements inline errors, it does not replace them.
- **System errors**: when the backend fails, the network drops, or something unexpected happens. Tell the user what happened in plain language, what they can do about it, and provide a retry mechanism. "We couldn't load your messages. Check your connection and try again." Include a "Retry" button.
- **404 / not found**: friendly message, search bar, links to common destinations. Never a raw error page.

**Never**: "Something went wrong." "Error: 500." "An unexpected error occurred." "Oops!" These tell the user nothing and provide no path forward.

### Optimistic UI

Optimistic UI updates the interface immediately as if the action succeeded, then reconciles with the server response.

- **Appropriate for**: high-confidence, easily reversible actions. Like/unlike. Bookmark. Mark as read. Send a message (the message appears in the chat immediately).
- **Not appropriate for**: financial transactions, destructive actions, actions with irreversible consequences, actions with a significant failure rate. Do not optimistically show "Payment complete" before the payment processes.
- **Reconciliation**: if the server confirms success, do nothing (the UI is already correct). If the server returns an error, revert the UI change and show a non-intrusive error. "Couldn't save your bookmark. Try again."

### Empty States

Empty states occur when there is no content to display. They are design opportunities, not dead ends.

#### First-Use Empty State

The user has no content because they're new. Show:
- A welcoming, helpful message explaining what this section is for
- A clear primary CTA to create their first item / take their first action
- Optional: an illustration or example showing what the populated state looks like

#### No-Results Empty State

The user searched or filtered and got zero results. Show:
- What they searched/filtered for
- Suggestions: "Try different keywords," "Remove some filters," "Browse categories instead"
- A clear action to modify their search or reset filters

#### Error Empty State

Content should be here but failed to load. Show:
- What happened (in plain language)
- A retry button
- Alternative navigation ("Go back to homepage")

**Never**: a blank white screen. "No data." "0 results." without context or next steps.

### Feedback Delivery Mechanisms

| Mechanism | Blocking? | Duration | Use For |
|---|---|---|---|
| Toast / snackbar | No | Auto-dismiss 3–5s | Non-critical confirmations, undo offers |
| Inline message | No | Persistent until resolved | Validation errors, field-level status |
| Banner | No | Persistent until dismissed | System-wide notices, connectivity status |
| Modal dialog | Yes | Until user acts | Critical confirmations, destructive actions, errors requiring immediate attention |
| Full-page state | Yes | Until resolved | Major errors, maintenance, onboarding completions |

### Source References

From: The Design of Everyday Things (Norman) — feedback and system status. Designing Interfaces (Tidwell) — notification patterns and loading states.


## Progressive Disclosure

Show only what is needed at any given moment. Reveal complexity on demand.

### Core Principle

Every additional element on screen increases cognitive load. Progressive disclosure manages this by revealing information and functionality incrementally, based on the user's needs in context. The novice sees a clean, simple interface. The expert can access the full power of the system — but only when they ask for it.

### Techniques

#### Expandable Sections (Accordions)

- **Use when**: multiple categories of content exist but the user typically needs only one at a time (FAQ pages, settings categories, filter groups)
- **Behavior**: one section can be open at a time (exclusive) or multiple sections can be open simultaneously (independent). Default: show the most important or most frequently used section expanded. All others collapsed.
- **Interaction**: tap/click on the section header to toggle. Chevron icon rotates to indicate open/closed state. Content area expands/collapses with a smooth height animation.

#### Tooltips and Popovers

- **Use when**: a brief explanation is needed that doesn't warrant permanent screen space. Icon meanings, data definitions, feature hints.
- **Behavior**: hover-triggered on desktop (with 200–300ms delay to avoid accidental triggers). Tap-triggered on mobile (since hover doesn't exist). Dismissible by tapping/clicking elsewhere. Positioned to avoid viewport edges.
- **Content**: 1–2 sentences maximum. If you need more, use a popover, help panel, or dedicated documentation link.

#### Stepped Flows

- **Use when**: a complex task can be broken into sequential stages. Onboarding, checkout, setup wizards, multi-part forms.
- **Behavior**: one step at a time. Each step focused on a single sub-task. Progress indicator shows current position and total steps. Back navigation available. Data persists between steps (no data loss on back).
- **Design**: each step should be completable in <60 seconds. If a step takes longer, break it into smaller steps.

#### Contextual Help

- **Use when**: users need guidance at the exact point of interaction. Complex form fields, first-use of a feature, non-obvious functionality.
- **Forms**: help text below the field (always visible for complex fields) or info icon that triggers a tooltip. "Your display name is visible to other users."
- **Features**: contextual tip that appears on first use of a feature. Dismissible. Does not reappear after dismissal.

#### Advanced Settings / Show More

- **Use when**: a small number of users need access to complex options that would overwhelm the majority
- **Pattern**: default view shows essential options. "Advanced" or "Show more options" link reveals additional controls. Remember the user's preference (if they always expand advanced, consider keeping it expanded).

### Balancing Simplicity and Power

The goal is not to hide features — it is to organize them by frequency and necessity. Every interface has a power curve: a small number of features are used constantly, a larger number are used occasionally, and many are used rarely.

- **Always visible**: features used in >80% of sessions
- **One click away**: features used in 20–80% of sessions
- **Two clicks away**: features used in <20% of sessions

If power users complain that features are "buried," check whether the progressive disclosure hierarchy matches actual usage frequency. Sometimes it's wrong and needs rebalancing.

### Source References

From: About Face (Cooper) — progressive disclosure and complexity management. The Humane Interface (Raskin) — information revelation strategies.


## Form Design

Forms are the gatekeepers between the user and their goal. A well-designed form is invisible — the user fills it out and moves on. A poorly designed form is a wall.

### Label Placement

#### Top-Aligned Labels

- **Use when**: mobile interfaces, forms that need fast completion, most general-purpose forms
- **Why**: top-aligned labels have the fastest completion times in eye-tracking studies. The eye moves in a single downward trajectory — label, then field, then next label, with no horizontal scanning.
- **Specifications**: label directly above the field, left-aligned. 4–8px gap between label and field. Label text at a smaller size than input text but still readable.

#### Left-Aligned Labels

- **Use when**: forms where the user needs to scan and locate specific fields (account settings, data entry forms with many fields)
- **Why**: left-aligned labels create a clean left edge that makes it easy to scan the list of labels. However, the horizontal distance between label and field varies, which slows completion.
- **Specifications**: labels right-aligned within a fixed-width column, fields left-aligned in a second column. This minimizes the label-to-field gap and improves association.

#### Floating Labels

- **Use when**: space is extremely constrained and you need to combine label and placeholder
- **Trade-offs**: space-efficient, but less scannable because labels shift position between empty and filled states. Users sometimes confuse floating labels with placeholder text. Use sparingly and only when space genuinely requires it.
- **Specifications**: label starts as placeholder text inside the field. On focus or when the field has a value, the label floats to a position above the field. The floating label must be a different size or style than the placeholder to avoid confusion.

### Input Types and Formatting

Match the input mechanism to the data type. The right input type reduces errors and speeds entry.

| Data Type | Input Mechanism | Keyboard (Mobile) |
|---|---|---|
| Email | Text input with email validation | Email keyboard (@ symbol prominent) |
| Phone number | Text input with input mask | Numeric keypad |
| Date | Date picker component | Date keyboard / picker |
| Currency | Text input with mask and prefix/suffix | Numeric with decimal |
| URL | Text input with URL validation | URL keyboard (/ and .com prominent) |
| Quantity (1–10) | Stepper or segmented control | N/A |
| Yes/No | Toggle switch or radio buttons | N/A |
| One of few (2–5 options) | Radio buttons or segmented control | N/A |
| One of many (6+ options) | Dropdown select or searchable select | N/A |
| Many of many | Checkboxes or multi-select chips | N/A |

**Input masks**: for formatted data (phone numbers, credit cards, dates), use input masks that format as the user types. Show the expected format as placeholder text. Accept various input formats and normalize (user types "5551234567", mask displays "(555) 123-4567").

### Validation

#### Inline Real-Time Validation

- **When**: most fields where validation criteria are simple and clear (email format, password strength, required fields)
- **How**: validate as the user types or after a brief debounce (300–500ms of no keystrokes). Show success (green checkmark) or error (red border + message) inline.
- **Caveat**: do not show errors prematurely. Wait until the user has had a reasonable chance to complete the field. For email, validate after the user types an "@" or moves to the next field — not after the first character.

#### On-Blur Validation

- **When**: fields that require complex validation (checking if a username is available, validating an address) or where real-time validation would be premature
- **How**: validate when the user tabs or clicks out of the field. Show the result inline.
- **Advantage**: reduces premature error messages. The user finishes typing before being told they're wrong.

#### On-Submit Validation

- **When**: simple forms with few fields, forms where server-side validation is the only option
- **How**: validate all fields when the user clicks submit. Show a summary of errors at the top of the form AND inline errors on each problematic field. Scroll to the first error. Focus the first error field.
- **Disadvantage**: forces the user to fix errors after they thought they were done. Acceptable for simple forms; frustrating for complex ones.

### Error Messages in Forms

**Structure**: [What's wrong] + [How to fix it]

**Good examples**:
- "Email must include an '@' symbol. Try name@example.com"
- "Password must be at least 8 characters. You've entered 5."
- "This username is taken. Try adding numbers or choosing a different name."

**Bad examples**:
- "Invalid input" — what's invalid? How do I fix it?
- "Error" — completely useless
- "Please enter a valid email address" — better, but still doesn't explain what's wrong with the current input

**Positioning**: error messages appear below the field they relate to. Red text, accompanied by an error icon for color-blind accessibility. The field itself gets a red border. Never show errors only in a banner at the top — users lose the connection between the error message and the field.

### Multi-Step Forms

For forms with more than 6–8 fields, break them into logical steps.

- **Progress indication**: "Step 2 of 4" with a visual stepper. Completed steps are clickable (allow back-navigation). The current step is highlighted. Future steps are visible but not interactive.
- **State preservation**: auto-save between steps. If the user navigates away and returns, their progress is preserved. Never lose entered data on back-navigation.
- **Step logic**: each step should be a coherent group (personal info, shipping, payment, review). Do not split a coherent group across steps. Do not combine unrelated groups in one step.
- **Review step**: before final submission, show a summary of all entered data with "Edit" links for each section. This reduces errors and builds confidence.

### Sensible Defaults

- **Pre-fill known information**: if you know the user's country from their IP, pre-select it. If they've previously entered a shipping address, offer to reuse it.
- **Select the most common option**: if 80% of users choose "Standard Shipping," pre-select it.
- **Smart defaults**: date picker opens to today's date. Country selector defaults to the user's detected locale. Currency defaults to the user's local currency.
- **Reduce decisions**: every decision costs cognitive effort. Defaults reduce the number of decisions the user must make. But defaults must be genuinely helpful — a wrong default is worse than no default because users may not notice and override it.

### Source References

From: Web Form Design (Wroblewski) — label placement research, validation patterns. Designing Interfaces (Tidwell) — form layout and input selection.


## Motion & Animation Principles

Motion in interfaces is not decoration. It is communication. Every animation must answer the question: "What information does this convey that static design cannot?"

### Purpose of Motion

Motion serves five functions. If an animation doesn't serve at least one of these, remove it.

1. **Orient**: where am I? Where did I come from? Where can I go? Page transitions that slide in from the direction of navigation. Breadcrumb animations that show hierarchical position. Zoom transitions that maintain spatial context.

2. **Guide attention**: look here. This changed. This is important. A new notification badge pulsing briefly. A save button shaking when the form has errors. An element highlighting when it's the next step in a flow.

3. **Show relationships**: these are connected. This came from that. This belongs here. Shared element transitions (a card expands into a detail page — the image morphs from thumbnail to hero). Parent-child transitions (a folder opens to reveal its contents).

4. **Provide feedback**: your action had an effect. The system is working. Something changed. Button press animations. Loading indicators. State change transitions (toggle sliding, checkbox checking, progress bar filling).

5. **Add delight**: that was pleasant. This product feels alive. This brand has personality. Subtle bounce on pull-to-refresh. A playful empty state animation. A celebration animation on achievement. Use sparingly — delight becomes annoyance with repetition.

### Adapted Principles of UI Animation

These are adapted from the classic 12 principles of animation (Disney), reframed for interface design.

#### 1. Easing (Slow In, Slow Out)

Nothing in nature moves at constant speed. Everything accelerates and decelerates. Linear motion in UI feels robotic and unnatural.

- **Ease-out** (deceleration): for elements entering the screen. They arrive quickly and slow down to rest. Feels responsive.
- **Ease-in** (acceleration): for elements leaving the screen. They start slowly and accelerate away. Feels natural.
- **Ease-in-out**: for elements moving within the screen. They accelerate from rest, reach peak speed, and decelerate to the new position.
- **Linear**: only for continuous, unchanging animations like a loading spinner rotation. Never for transitions between states.

#### 2. Anticipation

A small preparatory movement before the main action. In UI: a button scales down slightly (2–5%) before scaling up on press. A list item shifts slightly in the direction it's about to swipe. A card lifts slightly (shadow increases) before being dragged.

Anticipation tells the user: "something is about to happen." It makes the subsequent motion feel intentional rather than sudden.

#### 3. Follow-Through and Overshoot

Elements don't stop instantly. They overshoot their target position slightly and settle back. In UI: a modal slides up past its final position by 10–15px, then settles. A dropped element bounces slightly at its landing position. A scaling animation goes slightly beyond 100% before settling at 100%.

Follow-through adds a sense of physicality. Use subtle overshoot (5–15% beyond the target) — excessive overshoot feels cartoonish.

#### 4. Staging

Use motion to direct the user's eye to the most important change on screen. When multiple things change at once, stagger their animations so the user's attention is guided in the correct order. Primary changes animate first; secondary changes follow.

**Technique**: stagger delays. The primary element animates at 0ms delay. Secondary elements animate with 50–100ms delays, cascading from the primary element outward.

#### 5. Secondary Action

Subtle movements that reinforce the primary action without distracting from it. When a notification arrives: primary action is the notification sliding in. Secondary action is the badge count incrementing. Another secondary action is a subtle pulse on the notification bell icon.

Secondary actions add richness but must never compete with the primary action for attention.

#### 6. Timing and Spacing

Speed communicates meaning:
- **Fast (100–200ms)**: micro-feedback. Button state changes, toggle switches, simple transitions. These feel instant and responsive.
- **Medium (200–400ms)**: standard transitions. Page transitions, modal openings, element expansions. These feel smooth and intentional.
- **Slow (400–700ms)**: complex or emphasized transitions. Shared element morphs, multi-step orchestrated animations, celebratory moments. These feel deliberate and weighty.
- **Never >700ms**: users perceive >700ms as sluggish. If a real operation takes longer, show progress feedback rather than a long animation.

For specific duration and easing token values: (See ai-designer-system.md § Design Tokens — Motion & Animation).

### Functional vs Decorative Animation

**Functional animation** communicates information that static design cannot. A shared element transition tells you "this detail page is about the card you just tapped." A loading skeleton tells you "content is coming and here's roughly what it'll look like." A slide-in transition tells you "this screen is to the right of where you were."

**Decorative animation** looks nice but conveys no information. A logo that bounces on page load. Stars that sparkle around a button. Background particles floating.

**The rule**: every animation budget goes to functional animation first. Only add decorative animation after all functional needs are met and if the product's brand warrants it. One well-crafted functional animation is worth ten decorative ones.

### Transition Types

#### Shared Element Transition

An element morphs continuously from one view to another. A product thumbnail expands into the product detail hero image. A user avatar grows from a list item into a profile header.

- **When**: navigating to a detail view from a list, expanding a card or tile, any transition where an element persists between views
- **How**: the shared element's position, size, and shape interpolate from source to target. Other content cross-fades or slides in around it.
- **Effect**: maintains spatial context. The user knows "this page is about that item."

#### Fade Transition

Content fades out and new content fades in. Simple, subtle, low information content.

- **When**: switching between tabs of unrelated content, replacing a section's content, minor state changes
- **How**: old content fades to 0 opacity while new content fades from 0 to 1. Can be simultaneous (cross-fade) or sequential (fade out → fade in).
- **Effect**: minimal spatial information. Appropriate when there's no meaningful spatial relationship.

#### Slide Transition

Content slides in from a direction, displacing the current content.

- **When**: navigating forward/backward in a linear flow, revealing a panel or drawer, pagination
- **How**: new content enters from the direction of navigation (e.g., forward = slide from right). Old content exits in the opposite direction. On back-navigation, the direction reverses.
- **Effect**: communicates direction and spatial relationship. "The next page is to the right."

#### Expand / Collapse Transition

Content reveals or hides from a specific point or edge.

- **When**: opening accordions, expanding cards, showing/hiding panels, dropdown menus
- **How**: content clips from the trigger point (the clicked element) and expands to its full height/width. Reverse for collapse. Use height animation with easing for vertical expansion.
- **Effect**: communicates containment. "This content was inside that element."

### When NOT to Animate

- **Initial page load**: users want content, not an entrance show. Render content immediately. If content loads asynchronously, use skeleton screens — not entrance animations.
- **Purely decorative motion**: if removing the animation loses no information, the animation is decorative. Remove it or make it very subtle.
- **prefers-reduced-motion**: when the user's system setting requests reduced motion, respect it. Replace animations with instant state changes or very subtle fades (crossfade <200ms). Never ignore this preference.
- **During user input**: don't animate elements while the user is typing, dragging, or otherwise actively engaged. Animations during input feel laggy and disorienting.
- **Excessive stagger**: staggering 3 items entering a list feels polished. Staggering 50 items feels like watching paint dry. Limit stagger to 5–7 items max; beyond that, animate as a group.

### Source References

From: Animation at Work (Nabors) — functional animation framework. Designing Interface Animation (Head) — transition types and principles.


## State Design

Every interactive element exists in multiple states. If you only design the default state, you've designed 10% of the experience. The other 90% — hover, focus, active, disabled, loading, error, empty, selected — is where usability lives or dies.

### Comprehensive State Catalog

#### Default State

The resting state. No user interaction, no system activity, no errors. This is what the user sees when they first encounter the element.

- **Design priority**: highest. This state is seen most often. Make it clear, inviting, and understandable at a glance.
- **Requirements**: the element's purpose and affordance must be immediately apparent. A button must look clickable. A text field must look editable. A link must look tappable.

#### Hover State

Mouse pointer is over the element. Desktop-only — hover does not exist on touch devices.

- **Visual change**: subtle. Slight background color shift (5–10% darker or lighter), increased shadow (elevation change), cursor change (pointer for clickable, text for editable). Underline appearing for links.
- **Timing**: instant transition in (<50ms). Slightly slower transition out (100–150ms) to avoid flicker.
- **Purpose**: communicates "this is interactive" and "you can click here." Confirms the user's targeting intent.
- **Important**: never hide critical information behind a hover state. It's inaccessible on touch devices and invisible to keyboard users.

#### Focus State

The element has keyboard focus (via Tab key or programmatic focus).

- **Visual change**: prominent and unmistakable. 2px+ outline or ring, 3:1 minimum contrast ratio against adjacent colors. The focus indicator must be visible against any background the element might appear on.
- **Never remove focus indicators.** Never set `outline: none` without providing an equivalent alternative. Users who navigate by keyboard rely on focus visibility. Removing it makes the interface unusable for them.
- **Focus vs focus-visible**: show focus styles on keyboard navigation. Optionally suppress them on mouse click if the design team insists, but the keyboard focus state must always be visible.

#### Active / Pressed State

The element is being clicked (mousedown) or tapped (touchstart).

- **Visual change**: represents compression or activation. Darker background color, slight scale reduction (97–98%), increased border weight, inset shadow instead of outset. The element appears to be pushed into the surface.
- **Duration**: visible only during the press event. On touch, consider a minimum visible duration of 100ms to ensure the state is perceivable (fast taps can be <50ms).
- **Purpose**: confirms the user's click/tap connected with the element. "Yes, you pressed this."

#### Disabled State

The element cannot be interacted with.

- **Visual change**: reduced opacity (40–50%), desaturated, no hover or focus effects, cursor changes to "not-allowed" on desktop.
- **Requirement**: explain WHY the element is disabled. A disabled button with no explanation is a dead end. Use a tooltip ("Complete all required fields to continue") or adjacent helper text ("Available after email verification").
- **Accessibility**: disabled elements should not receive keyboard focus (use `aria-disabled` or `disabled` attribute). Screen readers should announce the element and its disabled state.

#### Loading State

The element or its content is being fetched, processed, or updated.

- **Visual change**: the element shows a loading indicator (inline spinner, skeleton, shimmer). The element is non-interactive during loading — disable click/tap handlers to prevent duplicate submissions.
- **For buttons**: replace the button label with a spinner + "Saving..." or similar. Keep the button the same size to prevent layout shift. Do not allow re-clicking during loading.
- **For content areas**: skeleton screen matching the expected content layout. Shimmer animation to convey activity.
- **For the full page**: skeleton for the entire layout, or a centered spinner with descriptive text.

#### Error State

Something went wrong related to this element.

- **Visual change**: red border (or other error color from the design system), error icon, error message text below the element. The element itself remains interactive — the user needs to correct the error.
- **Error message**: specific, actionable, positioned adjacent to the element (See § Error Messages in Forms).
- **Persistence**: the error state persists until the user corrects the input or the error condition resolves. Real-time validation clears the error state as soon as the input becomes valid.

#### Empty State

The element or container has no content to display.

- **Visual change**: a meaningful placeholder — not a blank space. Illustration, descriptive text, and a CTA to populate the content (See § Empty States).
- **Variations**: first-use empty (welcoming, tutorial-oriented), no-results empty (helpful, suggests alternatives), error empty (explains failure, offers retry).

#### Selected / Active State

The element is the current selection within a group (tab, list item, navigation item, toggle option).

- **Visual change**: clear differentiation from unselected siblings. Background fill, border highlight, text weight change, icon change (outline → filled). The selected state must be distinguishable from the hover state.
- **Persistence**: selected state persists until a different element is selected. In multi-select contexts, multiple elements can be in selected state simultaneously.

### State Transition Diagrams

For complex components, document valid state transitions to prevent impossible states and guide implementation.

**Example — Submit Button**:
```
Default → [hover] → Hover
Default → [focus] → Focus
Hover → [mousedown] → Active
Focus → [enter key] → Active
Active → [release + valid form] → Loading
Active → [release + invalid form] → Default (form shows errors)
Loading → [success] → Success (brief) → Default
Loading → [failure] → Error → Default (with error message)
Disabled (when form incomplete) — no transitions out until form state changes
```

For every complex component (date picker, dropdown, multi-select, drag-and-drop, modal), create a state transition map before designing individual states.

### Destructive Action Design

Destructive actions — delete, remove, cancel subscription, close account — require special interaction design because they cannot be undone (or are costly to undo).

#### Undo Over Confirmation

**Prefer undo.** When technically feasible, execute the action immediately and offer a timed undo window (5–10 seconds). Undo is faster (one click to undo vs two clicks to confirm), less disruptive (no modal), and lets the user see the result before committing.

- **Implementation**: execute the action in the UI. Show a toast: "Item deleted. [Undo]". If the user taps Undo within the window, revert. If the window expires, commit permanently.
- **Appropriate for**: deleting list items, archiving, removing tags, unfavoriting.

#### Confirmation When Undo Isn't Possible

When the action is truly irreversible (deleting an account, purging data, canceling a paid subscription), use a confirmation dialog.

- **Confirmation dialog**: describe the consequence explicitly. "Delete your account? This permanently removes all your data, projects, and files. This action cannot be undone."
- **Buttons**: the destructive action button uses red/danger styling and a specific label ("Delete Account"), not "OK" or "Yes." The safe action button ("Cancel" or "Keep Account") is the default (pre-focused). The destructive button is never the default.
- **Extra confirmation for high-stakes actions**: type the item name to confirm ("Type 'delete my account' to confirm"). This prevents accidental clicks and forces deliberation.

#### Inline Confirmation

For moderate-risk actions (deleting a file, removing a team member), inline confirmation is less disruptive than a modal.

- **Pattern**: the delete button transforms into a confirmation ("Are you sure? [Confirm] [Cancel]") within the same space. Auto-reverts after 5 seconds of inactivity.
- **Advantage**: no modal, no context switch. The confirmation is spatially linked to the action.

**Never**: make a destructive action the default in any context. Never place a destructive button where a common non-destructive button typically sits (e.g., don't put "Delete" where "Save" usually goes). Never allow destructive actions without at least one confirmation step.

### Source References

From: About Face (Cooper) — state modeling and error prevention. Designing Interfaces (Tidwell) — interaction states catalog.


## UX Writing & Microcopy Patterns

Words are interface elements. The right three words on a button can be worth more than a week of visual design refinement. Microcopy — the small text elements throughout an interface — guides, reassures, and sometimes saves the user from costly mistakes.

### Button Labels

**Rule**: verb + object. Tell the user exactly what will happen when they press the button.

| Instead of | Write |
|---|---|
| Submit | Save Changes |
| OK | Confirm Order |
| Yes | Delete Project |
| Cancel | Discard Draft |
| Click Here | Download Report |
| Continue | Proceed to Payment |

**Specific verbs over generic verbs.** "Save," "Send," "Create," "Delete," "Download," "Upload," "Share," "Export" — each tells the user exactly what action they're taking. "Submit," "OK," "Continue," "Done" — these are vague and force the user to recall what they were doing.

**Destructive actions get specific labels.** Never "OK" or "Yes" for destructive actions. "Delete Project," "Remove Member," "Cancel Subscription." The button label must make the consequence clear without reading the surrounding context.

### Error Messages

**Structure**: [What happened] + [What to do next]

| What happened | What to do next | Full message |
|---|---|---|
| Email already registered | Sign in instead | "This email is already registered. Try signing in instead." |
| Password too short | Meet the requirement | "Password must be at least 8 characters. You've entered 5." |
| File too large | Reduce file size | "This file is 25MB. Maximum size is 10MB. Try compressing the image." |
| Network error | Check connection | "Couldn't connect to the server. Check your internet connection and try again." |
| Permission denied | Contact admin | "You don't have access to this file. Ask the file owner for permission." |

**Tone in errors**: neutral and helpful. No blame ("You entered an invalid..."), no cuteness ("Oopsie!"), no jargon ("Error 422: Unprocessable Entity"). The user has a problem — help them solve it.

### Empty State Copy

**Structure**: [What this is] + [Why it's empty] + [How to populate it]

- "No messages yet. Start a conversation by tapping the compose button."
- "Your cart is empty. Browse our collection to find something you'll love."
- "No search results for 'xyzzy.' Try different keywords or check the spelling."
- "No projects yet. Create your first project to get started."

Each empty state tells the user where they are, why it's empty, and what to do about it.

### Onboarding Text

- **Progressive**: one tip at a time. Don't frontload 10 screens of instructions. Show guidance at the point of need.
- **Contextual**: the tip appears when the user encounters the feature, not before. "Swipe left to archive" appears the first time the user views their inbox, not during signup.
- **Dismissible**: every onboarding element can be dismissed permanently. Never force users through a tutorial they didn't ask for.
- **Useful**: each tip teaches something the user couldn't figure out from the interface alone. If the interface is well-designed, most onboarding is unnecessary. Onboarding compensates for discoverability failures.

### Confirmation Dialog Copy

**Structure**: [Describe the consequence] + [Specific action button] + [Safe escape button]

**Good**:
```
Delete "Project Alpha"?
This will permanently remove all 47 files and 12 collaborators.
This action cannot be undone.

[Cancel]  [Delete Project]
```

**Bad**:
```
Are you sure?
[No]  [Yes]
```

The good example tells the user exactly what will happen and gives them specific button labels. The bad example forces the user to remember what they clicked, and "Yes" / "No" can be confused (is "Yes" confirming the deletion or confirming they want to cancel?).

### Tone Guidelines

- **Confident**: "Your file is saved" not "Your file should be saved"
- **Helpful**: "Try a different search term" not "No results found"
- **Concise**: "Saved" not "Your changes have been successfully saved to the database"
- **Human**: "Something went wrong on our end. We're working on it." not "Internal Server Error 500"
- **Consistent**: same action = same language throughout the product. If it's "Save" on one screen, it's "Save" on every screen — not "Update" or "Submit" or "Apply"

### Source References

(See ai-designer-core.md § Content Strategy Essentials) for deeper coverage of content strategy, voice and tone frameworks, and editorial guidelines.


## Gesture & Touch Interaction

Touch interfaces rely on gestures that are invisible — there's no cursor to hover, no right-click to discover, no tooltip to reveal. This creates a fundamental discoverability problem that must be solved through design.

### Standard Gesture Vocabulary

| Gesture | Primary Action | Secondary Action |
|---|---|---|
| Tap | Select, activate, toggle | N/A |
| Double-tap | Zoom in, like (context-dependent) | N/A |
| Long press | Context menu, enter selection mode | Start drag |
| Swipe (horizontal) | Navigate between pages/tabs, reveal actions, dismiss | N/A |
| Swipe (vertical) | Scroll, pull-to-refresh (down), dismiss (down on modals) | N/A |
| Pinch | Zoom out | N/A |
| Spread (reverse pinch) | Zoom in | N/A |
| Rotate | Rotate content (maps, images) | N/A |
| Drag | Reorder, move elements, adjust values (sliders) | N/A |

### The Discoverability Problem

Gestures are invisible. Unlike buttons, links, and menus, there is no visual affordance that says "swipe me" or "pinch here." This means:

1. **Every gesture-based action must have a visible alternative.** Swipe-to-delete must also have a delete button (via long-press menu or edit mode). Pinch-to-zoom must also work via zoom buttons. Pull-to-refresh should have a refresh button accessible somewhere.

2. **Hint where possible.** When the user first encounters a swipeable list, show a subtle peek of the action panel behind the first item, then animate it closed. This teaches the gesture through demonstration.

3. **Never make a gesture the only way.** If the only way to delete an item is to swipe it, and the user doesn't know about swiping, the item is undeletable. Every gesture is a shortcut — there must always be a longer but discoverable path.

### Edge Swipe Conflicts

Mobile operating systems reserve edge swipes for system navigation:
- **iOS**: left-edge swipe = back navigation. Right-edge swipe from control center area = control center.
- **Android**: edge swipe from left or right = system back gesture (on gesture navigation). Bottom swipe = home / app switcher.

**Design implications**: do not use left-edge swipe for in-app functionality — it will conflict with iOS back navigation. Do not use bottom-edge swipe for in-app functionality — it will conflict with Android's home gesture. Reserve 20–30pt from screen edges for OS gesture recognition. Test edge gestures on both platforms.

### Touch Target Sizing

- **Minimum**: 44×44pt (Apple HIG), 48×48dp (Material Design). These are the minimum for a target that an average adult finger can hit reliably.
- **Recommended**: 48×48pt for most interactive elements. Larger (56–64pt) for primary actions and frequently-used controls.
- **Spacing between targets**: minimum 8pt between adjacent touch targets. If targets are smaller than recommended, increase spacing to compensate.
- **Visual size vs touch target size**: the visible element can be smaller than the touch target. A 24×24pt icon can have a 48×48pt touch target — the tappable area extends beyond the visual boundary. This is preferable to making every icon visually oversized.

### Touch Interaction Patterns

#### Tap and Hold (Long Press)

- **Delay**: 500ms is the standard long-press duration. <300ms risks accidental triggers. >700ms feels unresponsive.
- **Feedback**: haptic feedback at the moment the long-press registers. Visual feedback (context menu appears, element lifts/scales, selection mode activates).
- **Discoverability**: extremely low. Users don't instinctively try long-pressing. Provide visual hints ("Tap and hold to reorder") on first use.

#### Drag and Drop

- **Initiation**: long-press to pick up, then drag. The element lifts (shadow, scale) to indicate it's being dragged.
- **Feedback during drag**: the dragged element follows the finger. Drop targets highlight when the dragged element is over them. A gap opens in a list to indicate where the element will be inserted.
- **Release**: the element animates to its new position. If released outside a valid drop zone, it animates back to its original position.
- **Accessibility alternative**: provide "Move up" / "Move down" buttons for keyboard and assistive technology users.

#### Multi-Touch

- **Pinch/spread**: two-finger zoom. Provide zoom controls (+/- buttons) as an alternative.
- **Two-finger rotate**: for maps and image editing. Provide a rotation control as an alternative.
- **Three-finger gestures**: avoid in apps. These are typically OS-level shortcuts (screenshot, undo) and will conflict.

### Source References

From: Tapworthy (Clark) — touch target design and gesture patterns. Designing for Touch (Clark) — comprehensive touch interaction guidelines.


## Responsive Interaction Patterns

Interactions change across screen sizes. A pattern that works on desktop may be unusable on mobile, and vice versa. Responsive interaction design ensures that the core experience adapts without losing functionality.

### How Interactions Transform

| Desktop Pattern | Mobile Equivalent | Reason |
|---|---|---|
| Hover to preview | Tap to preview / long press | No hover on touch |
| Right-click context menu | Long press context menu | No right-click on touch |
| Drag-and-drop reorder | Drag-and-drop (long press to initiate) + move buttons | Touch drag needs initiation gesture |
| Multi-column layout | Single column with tabs or progressive disclosure | Limited screen width |
| Side-by-side comparison | Stacked or swipeable comparison | Limited screen width |
| Inline editing (click field to edit) | Navigate to edit screen | Small targets, keyboard overlap |
| Keyboard shortcuts | Gesture shortcuts | No physical keyboard |
| Hover tooltips | Tap to show info / info icon | No hover on touch |
| Dropdown on hover | Dropdown on tap | No hover on touch |
| Scroll-linked animations | Reduced or removed | Performance, battery |

### Hover-Dependent Patterns Need Touch Alternatives

**Tooltips**: on desktop, hover to show. On mobile, provide a persistent info icon (ⓘ) that can be tapped to show the same information in a popover or bottom sheet.

**Dropdown menus**: on desktop, hover to reveal submenu. On mobile, tap to reveal. Nested submenus are extremely difficult on mobile — flatten the navigation structure or use full-screen drill-down instead.

**Preview on hover**: on desktop, hover over a link to see a content preview. On mobile, consider long-press to preview (Peek in iOS), or simply navigate to the content.

**Hover states as affordance signals**: on desktop, hover states communicate "this is interactive." On mobile, rely on visual affordance (button shapes, underlined text, card shadows) since hover is unavailable.

### Responsive Form Adaptation

- **Label placement**: top-aligned on mobile (always). Left-aligned acceptable on desktop with sufficient width.
- **Input sizing**: full-width inputs on mobile. Constrained-width on desktop (max-width prevents uncomfortably wide fields).
- **Keyboard management**: on mobile, the virtual keyboard covers ~40% of the screen. Ensure the active input scrolls above the keyboard. Dismiss the keyboard when tapping outside fields.
- **Multi-column forms**: two-column forms on desktop can work for related fields (first name / last name). On mobile, always single-column.
- **Action buttons**: on mobile, primary action buttons should be full-width and positioned at the bottom of the viewport (thumb-friendly). On desktop, buttons can be inline with form fields.

### Responsive Navigation Adaptation

- **Sidebar → bottom tab bar**: desktop sidebar navigation converts to a bottom tab bar on mobile for the top 3–5 destinations. Remaining items go into a "More" tab.
- **Top nav → hamburger or bottom tabs**: horizontal top navigation that fits on desktop collapses to a hamburger menu or bottom tab bar on mobile.
- **Breadcrumbs → back button**: full breadcrumb trail on desktop. On mobile, a simple back arrow with the parent section label.
- **Faceted filters → filter sheet**: inline filter panels on desktop. On mobile, a "Filter" button opens a bottom sheet or full-screen overlay with filter options.

### Performance and Battery Considerations

Mobile devices have limited processing power and battery. Interaction patterns must account for this:

- **Reduce animation complexity**: fewer simultaneous animations, shorter durations, simpler easing curves on mobile.
- **Avoid scroll-linked animations**: parallax, scroll-triggered reveals, and scroll-position-dependent visual effects are expensive on mobile. Use sparingly or disable on lower-powered devices.
- **Lazy-load interactions**: defer loading of complex interaction patterns (drag-and-drop libraries, rich text editors) until the user needs them.
- **Respect prefers-reduced-motion**: this preference is common on mobile (where motion sickness is more prevalent due to screen proximity and device movement) and must be honored.

### Source References

From: Responsive Web Design (Marcotte) — foundational responsive patterns. Designing Mobile Interfaces (Hoober) — mobile interaction adaptation strategies.


## Interaction Design Checklist

Use this checklist to verify that every screen, component, and flow meets interaction design standards. Every "no" is a design deficiency that needs resolution.

### Feedback & Communication

- [ ] Does every user action have visible feedback within 100ms?
- [ ] Are loading states designed for every asynchronous operation?
- [ ] Do loading states use the appropriate pattern (skeleton, spinner, progress bar)?
- [ ] Are success states communicated without blocking the user?
- [ ] Are error messages specific, actionable, and positioned near their source?
- [ ] Is system status always visible (connected/disconnected, saving/saved, synced/unsynced)?

### Navigation & Orientation

- [ ] Can the user always answer: "Where am I? Where can I go? How do I get back?"
- [ ] Is primary navigation visible (not hidden behind a hamburger)?
- [ ] Do navigation transitions communicate direction and hierarchy?
- [ ] Are breadcrumbs provided for hierarchies deeper than 2 levels?
- [ ] Is search available when content volume exceeds browse-ability?

### State Completeness

- [ ] Is every interactive element designed in all applicable states (default, hover, focus, active, disabled, loading, error, empty, selected)?
- [ ] Are focus states visible with 3:1 minimum contrast?
- [ ] Are disabled states explained (why is this disabled)?
- [ ] Are empty states meaningful and actionable?
- [ ] Are error states recoverable?

### Forms & Input

- [ ] Do form fields use appropriate input types and keyboards?
- [ ] Is validation inline where possible?
- [ ] Do error messages explain what's wrong and how to fix it?
- [ ] Are multi-step forms saving state between steps?
- [ ] Are sensible defaults provided?
- [ ] Can the user undo or go back without losing data?

### Motion & Animation

- [ ] Does every animation serve a functional purpose (orient, guide, relate, feedback)?
- [ ] Are animations fast enough (<400ms for standard transitions)?
- [ ] Is prefers-reduced-motion respected?
- [ ] Are entrance animations avoided on initial page load?
- [ ] Are simultaneous animations limited to avoid visual chaos?

### Touch & Gesture

- [ ] Are touch targets at least 44×44pt (iOS) / 48×48dp (Android)?
- [ ] Do all gesture-based actions have visible alternatives?
- [ ] Are edge swipes reserved for OS-level navigation?
- [ ] Is long-press usage discoverable (hints on first use)?

### Destructive Actions

- [ ] Can destructive actions be undone?
- [ ] If undo isn't possible, is there a confirmation step?
- [ ] Do confirmation dialogs describe consequences specifically?
- [ ] Are destructive buttons visually distinct and never the default?

### Responsive Adaptation

- [ ] Do hover-dependent patterns have touch alternatives?
- [ ] Does navigation adapt appropriately across breakpoints?
- [ ] Are forms single-column on mobile?
- [ ] Are primary actions thumb-reachable on mobile?

### Progressive Disclosure

- [ ] Is the interface layered by usage frequency (common visible, rare hidden)?
- [ ] Can power users access advanced features without frustration?
- [ ] Is onboarding contextual and dismissible?


## Book Source Appendix

The principles and patterns in this Skill are grounded in the following foundational texts:

| Book | Author(s) | Relevance |
|---|---|---|
| About Face | Alan Cooper et al. | Goal-directed design, interaction patterns, state modeling |
| Microinteractions | Dan Saffer | Four-part microinteraction model, signature moments |
| Designing Interfaces | Jenifer Tidwell | Navigation patterns, form design, notification patterns |
| Animation at Work | Rachel Nabors | Functional animation framework, motion principles |
| Designing Interface Animation | Val Head | Transition types, animation implementation |
| The Humane Interface | Jef Raskin | Progressive disclosure, information revelation |
| Tapworthy | Josh Clark | Touch target design, mobile gesture patterns |
| Designing for Touch | Josh Clark | Comprehensive touch interaction design |
| Web Form Design | Luke Wroblewski | Label placement research, validation patterns, form UX |
| Responsive Web Design | Ethan Marcotte | Responsive layout and interaction adaptation |
| Designing Mobile Interfaces | Steven Hoober | Mobile interaction patterns and adaptation |
| The Design of Everyday Things | Don Norman | Feedback, affordance, conceptual models |
| Designing for Emotion | Aarron Walter | Personality, delight, signature moments |
| Seductive Interaction Design | Stephen Anderson | Engagement patterns, behavior design |
| Designing Interactions | Bill Moggridge | Interaction design history and philosophy |
| Designing for Interaction | Dan Saffer | Practical interaction design methodology |
