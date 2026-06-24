---
name: ai-designer-psychology
description: Design psychology and cognitive science principles for the AI Designer suite. Covers cognitive foundations, cognitive load theory, mental models, Gestalt principles in UI, behavioral design and habit formation, persuasion principles, cognitive biases relevant to design, emotional design, flow state and engagement, psychology-based design laws, and psychology checklist. Load with ai-designer-core.
---

## Cognitive Foundations

Human cognition is the medium you design for. Not screens, not pixels, not code — the human brain with its predictable strengths and systematic limitations. Every design decision either works with cognition or fights against it. This section establishes the foundational cognitive science that underpins all subsequent principles.

### Dual Process Theory: System 1 and System 2

The brain operates through two distinct processing systems, as established by Kahneman.

**System 1** — fast, automatic, intuitive, effortless. Pattern recognition, habitual actions, emotional reactions, reading familiar words. This system handles 95% of daily decisions. It operates below conscious awareness and responds to visual cues, spatial relationships, and learned associations.

**System 2** — slow, deliberate, analytical, effortful. Complex calculations, unfamiliar tasks, weighing tradeoffs, reading fine print. This system fatigues quickly and has severely limited capacity. It requires conscious engagement and active concentration.

**Design implication**: Design the default path for System 1. Make common actions automatic, obvious, and requiring zero deliberation. Visual hierarchy, spatial grouping, color coding, and consistent patterns all serve System 1 processing. Reserve System 2 engagement for genuinely complex decisions — account deletion, financial transactions, irreversible actions — where you *want* the user to slow down and think.

**When System 2 engagement is necessary**: Use friction intentionally. Confirmation dialogs for destructive actions, two-step verification for high-stakes changes, deliberate breaks in visual flow that force conscious processing. The key distinction: System 2 friction must serve the user's interests, never the business's.

**Anti-pattern**: Requiring System 2 for routine tasks. Navigation that requires reading every label. Forms that demand decisions about settings the user doesn't understand. Layouts so inconsistent that the user must re-orient on every page.

### Working Memory Limits

Working memory is the cognitive workspace where active processing happens. Its capacity is severely limited.

**Miller's Law**: The classic formulation — 7±2 items can be held in working memory simultaneously. This applies to *chunks*, not raw data points. A phone number chunked as XXX-XXX-XXXX occupies 3 chunks. The same number as XXXXXXXXXX occupies 10 items and exceeds working memory.

**Cowan's refinement**: More recent research suggests the effective limit is closer to 4 items for novel, unrelated information. When designing for first-time users encountering unfamiliar content, 4 is the safer upper bound.

**Design implication**: Chunk information into groups of 3-5 items. Navigation categories, form field groups, dashboard sections, settings panels — all must respect this limit. When content exceeds 5-7 items in a group, subdivide into nested groups or use progressive disclosure.

**Chunking strategies**:
- Group related form fields under descriptive labels (3-5 fields per group)
- Limit primary navigation items to 5-7 categories
- Break long processes into discrete steps (3-5 steps per wizard)
- Display phone numbers, credit cards, and codes in chunked formats
- Use whitespace and visual separators to reinforce chunk boundaries

### Attention as a Scarce Resource

Attention is finite, selective, and easily misdirected. Three phenomena define its limits:

**Selective attention**: Users see what they are looking for and miss everything else. A user scanning for a "Cancel subscription" link will miss the banner ad, the promotional sidebar, and the "helpful tips" section. Design for the task the user came to accomplish, not the content you want them to see.

**Change blindness**: Users fail to notice changes in areas they are not actively attending to. A status message that updates while the user is filling out a form field goes unnoticed. A notification badge that appears in the corner while the user reads center content is invisible. Important state changes require visual prominence — animation, color shift, spatial proximity to the user's current focus.

**Inattentional blindness**: Users miss unexpected stimuli when focused on a task. The classic gorilla experiment: participants counting basketball passes fail to notice a person in a gorilla suit walking through the scene. Implication: critical alerts and warnings must break through task focus. Subtle indicators are insufficient for urgent information.

**Design implication**: Place important changes and critical information near the user's current focus of attention. Use motion, contrast, and spatial proximity to draw attention. Never rely on the user "noticing" a change in a peripheral area of the screen. For critical alerts, use modals or inline messages that interrupt the current task flow — but only when the interruption genuinely serves the user.

### Recognition Over Recall — Cognitive Basis

The full principle definition and checklist live in (See ai-designer-core.md § Recognition Over Recall). This section provides the underlying cognitive science.

Recognition (identifying something when you see it) is fundamentally easier than recall (retrieving something from memory without cues).

**Recognition load**: Low. The brain matches a presented stimulus against stored patterns. Menus, autocomplete suggestions, visual browsing, thumbnail previews — all leverage recognition.

**Recall load**: High. The brain must search memory without external cues. Command-line interfaces, blank search fields, remembering passwords, recalling file names — all demand recall.

**Cognitive basis**: Recognition requires only a familiarity signal — the brain matches a stimulus to a stored pattern. Recall requires active search through memory without external cues. This asymmetry explains why menus outperform command lines for novices and why autocomplete transforms blank search fields into recognition tasks.

### Cognitive Processing Speed

The brain processes different types of information at different speeds. This hierarchy governs what users perceive first and what they process most quickly.

**Processing speed hierarchy** (fastest to slowest):
1. Spatial position — where something is on the screen
2. Color and contrast — visual salience
3. Shape and size — iconography, element dimensions
4. Text labels — reading and comprehending words
5. Numerical data — parsing and comparing numbers

**Design implication**: Use spatial position and color as primary information channels. Reserve text for disambiguation and detail. An icon's position and color communicate faster than its label. A button's size and placement communicate importance faster than its text. This hierarchy directly informs visual hierarchy decisions (See ai-designer-visual.md § Visual Hierarchy).


## Cognitive Load Theory

This is the HOME SKILL for cognitive load principles. All other Skills reference this section.

Cognitive load theory distinguishes three types of mental demand. Understanding these types is the foundation for every simplification decision you make.

### Intrinsic Load

Complexity inherent to the task itself. Filing taxes is inherently complex. Configuring a network router involves inherently technical concepts. Intrinsic load cannot be eliminated — the task is what it is. It can only be managed through sequencing, scaffolding, and progressive disclosure.

**Management strategies**:
- Break complex tasks into sequential steps
- Provide scaffolding for unfamiliar concepts (contextual help, examples, previews)
- Use progressive disclosure to reveal complexity only when relevant
- Offer guided flows for complex tasks with autonomous paths for experts

### Extraneous Load

Complexity added by poor design that contributes nothing to the task. This is what you eliminate. Extraneous load is pure waste — every unit of attention spent on extraneous load is attention stolen from the actual task.

**Sources of extraneous load**:
- Cluttered layouts with competing visual elements
- Inconsistent patterns that force re-learning on every page
- Unclear labels that require interpretation
- Unnecessary decisions ("Would you like to save in format A or format B?" when the user has no basis to choose)
- Split attention: information needed together is displayed separately (e.g., error message at the top of the page, error field at the bottom)
- Redundant information that adds noise without value
- Gratuitous animations that distract without informing

**Elimination strategies**:
- Remove every element that does not serve the current task
- Consolidate related information into spatial proximity
- Use consistent patterns across the entire product (See ai-designer-core.md § Design Ethics)
- Replace ambiguous labels with action-specific language
- Eliminate unnecessary choices by providing smart defaults
- Place error messages adjacent to the fields they describe

### Germane Load

Mental effort that helps the user learn and build accurate mental models. This is productive cognitive investment. Good design channels germane load toward understanding: clear feedback that teaches cause-and-effect, consistent patterns that build transferable knowledge, informative error messages that help users understand what went wrong.

**How to support germane load**:
- Provide clear feedback for every action (what happened, why, what's next)
- Use consistent patterns so learning transfers across the product
- Write error messages that explain the problem and suggest a fix
- Include contextual guidance for first-time encounters with complex features
- Design onboarding that builds mental models, not just task completion

### Hick's Law and Decision Complexity

Decision time increases logarithmically with the number of choices. This is Hick's Law, and it governs every decision point in your interface.

**Formula**: RT = a + b × log₂(n), where n = number of equally probable choices.

**Design implication**: Reduce the number of choices presented at any decision point. When many options exist, provide structure: categorize options, recommend a default, highlight the most common choice, or use progressive disclosure to reveal additional options only on demand.

**Specific applications**:
- Navigation: 5-7 top-level items, not 15
- Pricing pages: 3 plans with one recommended, not 6 undifferentiated options
- Settings: group by category with sensible defaults, not a flat list of 40 toggles
- Action menus: primary action prominent, secondary actions in overflow
- Onboarding: one decision per step, not a wall of configuration options

**When Hick's Law does not apply**: Expert users with well-learned option sets. A musician navigating a familiar DAW. A developer using a familiar IDE. Expertise collapses decision time because options are already chunked and prioritized in memory. Do not oversimplify for experts — provide progressive complexity.


## Mental Models

This is the HOME SKILL for mental model principles. All other Skills reference this section.

### Three Models That Must Align

Every product involves three mental models that are almost never identical:

**User's mental model**: How the user *thinks* the system works. This model is always incomplete, often inaccurate, and built from prior experience with other products. It is the only model that matters for design decisions, because the user acts on their mental model, not on the system model.

**Designer's conceptual model**: How the designer *intends* the system to work. This is the idealized interaction flow, the logical structure, the "correct" way to use the product. It exists in documentation, wireframes, and the designer's head.

**System model**: How the system *actually* works. The database schema, the API calls, the state machine. This is the technical reality. Users never need to understand this model — they need an interface that lets them accomplish tasks without understanding it.

### Model Mismatch = Failure

When the user's mental model diverges from the system model, predictable failures occur:

- User performs an action expecting outcome A; system produces outcome B → confusion
- User searches for a feature where they *expect* it to be; it's elsewhere → frustration
- User interprets a label based on prior experience; the label means something different here → errors
- User assumes undo is available (because it is everywhere else); it isn't → anxiety, data loss

**The user's mental model always wins.** If users consistently expect a feature to work a certain way, the system must accommodate that expectation — even if the "correct" model is technically superior. Technical correctness means nothing if users can't figure it out.

### Discovering Mental Models

You cannot design for mental models you don't understand. Methods for discovery:

- **Card sorting**: Have users organize content into groups that make sense to them. Reveals how users categorize information — which is often radically different from how the organization categorizes it.
- **Think-aloud protocol**: Have users narrate their thought process while completing tasks. Reveals assumptions, expectations, and confusion points in real time.
- **Contextual interviews**: Observe users in their actual environment doing their actual tasks. Reveals workflow, workarounds, and unspoken needs.
- **First-click testing**: Show users a page and ask where they would click to accomplish a task. Reveals whether the information architecture matches user expectations.

### Aligning Models

Strategies for bringing the user's mental model into alignment with the system:

**Leverage existing models (Jakob's Law)**: Users spend most of their time on other products. They expect your product to work like those products. Follow established conventions for navigation, interaction patterns, and terminology. Innovation is welcome in your value proposition, not in your scrollbar behavior.

**Use consistent metaphors**: The desktop metaphor (files, folders, trash) works because it maps digital concepts to physical experience. Choose metaphors that align with your users' real-world experience and maintain them consistently. Do not mix metaphors — if settings are a "dashboard," do not also call them a "control panel."

**Teach through interaction**: Progressive onboarding that lets users build accurate models through guided experience. Tooltips on first encounter. Empty states that explain what will appear and how to get started. Inline guidance that fades as the user gains competence.

**Provide clear system feedback**: Every action must produce visible feedback that confirms or corrects the user's model. "Your file is saved" confirms. "This action cannot be undone" corrects the assumption that undo is available. Silence is the worst feedback — it leaves the user's model untested and potentially wrong.


## Gestalt Principles in UI

Gestalt psychology describes how the human visual system organizes elements into meaningful groups. These principles are not guidelines — they are descriptions of how perception works. Your interface is subject to them whether you design for them or not.

### Proximity

Items close together are perceived as a related group. Items far apart are perceived as unrelated. This is the strongest and most reliable Gestalt principle.

**Application**:
- Group related form fields together (name + email + phone), separate them from unrelated fields (billing address) with whitespace
- Place labels adjacent to their fields, not equidistant between two fields
- Group action buttons by function (Save/Cancel together, Delete separately)
- Use consistent spacing: within-group spacing < between-group spacing. This ratio must be at minimum 2:1 to be perceived as grouping.

**Anti-pattern**: Equal spacing between all elements. When everything is equidistant, no grouping is perceived and the user must read every label to understand relationships.

### Similarity

Elements that share visual properties (color, shape, size, typography) are perceived as belonging to the same category or having the same function.

**Application**:
- All interactive buttons share the same visual style → users learn "this shape = clickable"
- All error messages share the same color → users learn "red = problem"
- All section headers share the same typography → users learn the content hierarchy
- Tags, badges, and status indicators use consistent color coding across the entire product

**Anti-pattern**: Using the same visual style for elements with different functions. A text link styled identically to a heading. A decorative element that looks like a button. Inconsistent color meaning (red for errors on one page, red for "featured" on another).

### Continuity

The eye follows the smoothest visual path. Elements arranged along a line or curve are perceived as related and sequential.

**Application**:
- Align form fields along a single vertical axis — the eye flows naturally from top to bottom
- Use visual flow lines to connect sequential steps (progress bars, step indicators, timelines)
- Align navigation items along a single horizontal or vertical axis
- Use consistent left-alignment for content blocks to create a strong reading line

**Anti-pattern**: Layouts that force the eye to jump unpredictably. Zigzag form layouts. Inconsistent alignment that breaks the visual flow. Center-aligned body text (the eye must re-find the start of each line).

### Closure

The mind completes incomplete shapes, filling in gaps to perceive a whole. The brain prefers complete, recognizable forms and will infer missing information.

**Application**:
- Progress indicators: a partially filled progress bar implies a complete journey with remaining steps
- Icon design: silhouettes and partial outlines are recognized as complete objects
- Card designs with partial borders still read as contained regions
- Loading skeletons: placeholder shapes imply content that is coming

**Anti-pattern**: Incomplete visual elements that create ambiguity rather than recognition. A progress bar without clear start/end points. An icon with so much removed that it becomes unrecognizable.

### Figure-Ground

The visual system separates elements into foreground (figure) and background (ground). The figure receives attention; the ground recedes.

**Application**:
- Modal dialogs: darken the background to push it to ground, elevate the modal to figure through contrast and shadow
- Selected states: the selected item must read as figure against the unselected ground
- Card-based layouts: cards are figure, the page surface is ground — use shadow or border to reinforce separation
- Focus states: the focused element must be unambiguous figure against surrounding ground

**Anti-pattern**: Ambiguous figure-ground relationships. When users cannot tell what is foreground and what is background, they cannot determine what is interactive, what is content, and what is decoration. Low-contrast layouts destroy figure-ground distinction.

### Common Region

Elements enclosed within a shared boundary are perceived as a group, even if they are not proximate or similar.

**Application**:
- Cards: a bordered or shaded region groups its contents regardless of internal layout
- Form sections: a subtle background color or border groups related fields
- Navigation sections: a sidebar or header region groups its contained items
- Toolbars: a distinct background region groups tools together

**Anti-pattern**: Overuse of boundaries creating visual clutter. Every element in its own box. Nested borders within borders. When everything is in a region, the grouping effect is lost.

### Connectedness

Elements connected by visual links (lines, arrows, shared color bands) are perceived as related, even more strongly than proximity or similarity alone.

**Application**:
- Step indicators connected by a line communicate sequence
- Organizational charts with connecting lines communicate hierarchy
- Timeline designs with connecting bars communicate temporal sequence
- Tree views with branch lines communicate parent-child relationships
- Flowcharts and process diagrams with arrows communicate direction

**Anti-pattern**: Decorative lines that connect unrelated elements. Connecting lines that cross and tangle, obscuring relationships rather than clarifying them.

### Compound Application

Real interfaces combine multiple Gestalt principles simultaneously:

- **Card-based dashboards**: common region (card boundary) + proximity (grouped metrics within cards) + similarity (all cards share visual style)
- **Form design**: proximity (field groups) + continuity (vertical alignment) + common region (section backgrounds)
- **Navigation**: similarity (all nav items share style) + proximity (related items grouped) + connectedness (active item connected to content area via highlight)

When principles conflict, proximity wins in most contexts. Proximity is the strongest perceptual grouping cue and should be the primary organizational tool.


## Behavioral Design & Habit Formation

Behavioral design applies psychology to shape user behavior. This is the most ethically fraught area of design psychology. Every technique in this section can be used to serve users or to exploit them. The ethical line is clear: behavioral design serves the user's stated goals. If the behavior you're designing for serves only the business, you are manipulating, not designing.

### The Hooked Model

Nir Eyal's four-phase habit loop describes how products become habitual:

**Trigger** → the cue that initiates behavior.
- *External triggers*: notifications, emails, badges, visual cues in the environment
- *Internal triggers*: emotions (boredom, anxiety, loneliness, FOMO) that the user associates with your product
- Mature habits are driven by internal triggers. New habits require external triggers. The transition from external to internal triggers is the hallmark of habit formation.

**Action** → the simplest behavior in anticipation of reward. The action must be easier than thinking about whether to do it. Open the app. Pull to refresh. Tap the notification. The lower the effort, the more reliably the action occurs (see Fogg's Behavior Model below).

**Variable Reward** → the unpredictable payoff that sustains engagement. Variable rewards are dramatically more compelling than predictable ones. Three types:
- *Rewards of the tribe*: social validation (likes, comments, mentions)
- *Rewards of the hunt*: resources and information (new content, deals, results)
- *Rewards of the self*: mastery and completion (leveling up, streaks, achievements)

**Investment** → the user puts something in, increasing their commitment and the product's value. Data entered, preferences set, content created, connections made, reputation built. Investment increases switching costs and primes the next trigger.

**Ethical application**: The Hooked model is ethical when the habit serves the user's goals (e.g., building a daily exercise habit through a fitness app). It is manipulative when the habit serves only engagement metrics (e.g., making social media compulsive through variable reward schedules). Ask: does the user *want* this habit? Would they thank you for building it?

### BJ Fogg's Behavior Model

Behavior = Motivation × Ability × Prompt (B = MAP). All three must converge simultaneously for a behavior to occur.

**Motivation**: The user's desire to perform the behavior. Motivation fluctuates wildly — it is unreliable as a design lever. Do not design systems that depend on high motivation.

**Ability**: How easy the behavior is to perform. This is the most reliable design lever. Reduce steps, eliminate friction, pre-fill fields, provide defaults, minimize decisions. When ability is high enough, even low motivation is sufficient.

**Prompt**: The cue that triggers the behavior at the right moment. A prompt without motivation or ability is annoying (notification for something the user can't or won't do). A prompt with both is effective (notification that their report is ready to review, with a one-tap action).

**Design implication**: Always increase ability before trying to increase motivation. Make the desired behavior as easy as possible. Then ensure a well-timed prompt. Only invest in motivational design if ability and prompts are already optimized. The order matters: Ability → Prompt → Motivation.

### Nudge Theory

Choice architecture that influences behavior without restricting options. Users remain free to choose; the design makes certain choices more likely.

**Defaults**: The most powerful nudge. Users overwhelmingly accept defaults — opt-out rates are dramatically lower than opt-in rates. Set defaults to the option that serves the user's best interest. Ethical requirement: defaults must benefit the user, not exploit their inertia.

**Framing**: How an option is presented changes its perceived value. "95% fat-free" is chosen over "5% fat" — identical information, different framing. "Save $50" and "Don't lose $50" differ in motivational impact (loss framing is stronger). Use framing to help users make decisions aligned with their goals.

**Social proof**: "9 out of 10 users choose this plan." "1,247 people completed this course today." Social proof reduces decision uncertainty by showing what others chose. Ethical requirement: social proof must be genuine. Fabricated numbers are fraud, not design.

**Environmental design**: Physical and digital environment shapes behavior. Placing healthy food at eye level increases its selection. Placing the "Save" button in the expected location increases successful task completion. Environment is invisible nudging — users don't notice the architecture, only their choices.

**Ethical boundary**: A nudge preserves freedom of choice while making the preferred option easier. A dark pattern removes choice or obscures alternatives. If the user would object to the nudge upon learning about it, it is not a nudge — it is manipulation. (See ai-designer-antipatterns.md § Dark Pattern Catalog)


## Persuasion Principles

Cialdini's six principles of influence describe the psychological mechanisms that make people say yes. In design, these principles guide ethical persuasion — helping users make decisions aligned with their goals. Each principle includes its ethical boundary.

### Reciprocity

People feel obligated to return favors. When someone gives us something, we feel compelled to give something back.

**Application**: Free trials, free content, helpful onboarding, generous free tiers. Give value before asking for commitment. A product that helps the user accomplish something before requesting signup earns reciprocity naturally.

**Ethical line**: Do not create artificial obligation debt. Do not frame a free trial as a "gift" to manufacture guilt. The value you provide must be genuinely useful, not a manipulation vehicle.

### Commitment and Consistency

People want to act consistently with their prior commitments. Small commitments pave the way for larger ones.

**Application**: Start with small asks. "Create a free account" before "Upgrade to premium." "Try one feature" before "Adopt the entire platform." Onboarding that gets users to invest small amounts of effort builds commitment that supports retention.

**Ethical line**: Do not trap users with sunk cost fallacy. The fact that a user has invested time does not obligate them to continue. Make it easy to leave at any point. Commitment should come from genuine value, not from manufactured switching costs.

### Social Proof

People follow the behavior of others, especially in uncertain situations. When we don't know what to do, we look at what others did.

**Application**: Testimonials from relatable users (not just celebrities). User counts and adoption metrics. "Most popular" labels on plans. Activity feeds showing what others are doing. Star ratings and review counts. "X people are viewing this right now."

**Ethical line**: All social proof must be genuine. Real testimonials from real users. Accurate user counts. Honest popularity rankings. Fabricated social proof — fake reviews, inflated numbers, manufactured "trending" labels — is fraud and erodes trust permanently.

### Authority

People trust and defer to credible experts. Expertise signals increase persuasive impact.

**Application**: Expert endorsements. Industry certifications and compliance badges. Security seals and audit results. Professional design quality (aesthetic-usability effect: polished design signals competence). Credible data sources cited in content.

**Ethical line**: Do not fabricate authority signals. Do not display certifications you haven't earned. Do not imply endorsements that don't exist. Authority must be earned and genuine.

### Liking

People say yes to people they like. Similarity, attractiveness, familiarity, and association drive liking.

**Application**: Friendly, conversational microcopy. Human-centered imagery. Relatable brand personality. Consistent, familiar interactions that build rapport over time. Personalization that shows "we know you."

**Ethical line**: Do not feign friendship or manufactured intimacy. A chatbot that uses your first name is personalization. A chatbot that pretends to be your friend to sell you things is manipulation. The distinction: genuine helpfulness vs. simulated emotional connection for commercial gain.

### Scarcity

People want what is limited. Scarcity increases perceived value and urgency.

**Application**: Limited-time offers with genuine deadlines. "Only 3 seats remaining" when seats are genuinely limited. Exclusive access for specific user segments. Early-bird pricing with real expiration dates.

**Ethical line**: Never fake scarcity. If you say "only 3 left," there must actually be only 3 left. If you say "offer ends Friday," the offer must actually end Friday. Fake countdown timers, manufactured "limited stock," and perpetual "sales" that never end are dark patterns that destroy trust. (See ai-designer-antipatterns.md § Dark Pattern Catalog)

### The Master Ethical Distinction

Persuasion helps users make decisions that serve their own goals. Manipulation tricks users into decisions that serve yours. The test: if the user fully understood the persuasion technique being applied, would they still appreciate it? If yes — persuasion. If they would feel tricked or exploited — manipulation.


## Cognitive Biases Relevant to Design

Cognitive biases are systematic patterns in how humans deviate from rational judgment. They are not flaws to be exploited — they are features of cognition to be respected. Design can work with biases to help users make better decisions or exploit biases to serve the business. Only the former is acceptable.

### Anchoring

The first piece of information encountered disproportionately influences subsequent judgments. The anchor need not be relevant — any number affects estimation.

**Application**: Show the full price before the discounted price. Display the premium plan first to anchor value perception. Show the "most popular" option to anchor expectations.

**Ethical line**: Do not anchor with fabricated reference points. A "regular price" that was never actually charged is a fake anchor. A "competitor price" that is inflated is deceptive anchoring.

### Framing Effect

How information is presented changes decisions, even when the objective content is identical. Positive framing ("95% success rate") and negative framing ("5% failure rate") drive different choices.

**Application**: Frame positively for adoption and engagement: "Join 10,000 satisfied users." Frame negatively for risk awareness and caution: "Don't lose your unsaved work." Match framing to the user's goal — encourage action with positive frames, encourage caution with negative frames.

**Ethical line**: Do not use framing to obscure information. Presenting only the positive frame when the negative frame is material to the decision is deception. Both frames should be available for informed choice.

### Status Quo Bias

People prefer the current state of affairs. Change requires effort and introduces uncertainty. Defaults are disproportionately sticky.

**Application**: Set defaults to the option that best serves the user's interests. Pre-select the most common and safest configuration. Auto-enroll users in beneficial features. Make the default path the best path.

**Ethical line**: Defaults must serve the user, not exploit their inertia. Pre-checking "Send me marketing emails" exploits status quo bias. Pre-checking "Enable two-factor authentication" leverages it for the user's benefit. The question: would the user choose this default if they were paying full attention?

### Loss Aversion

Losses are psychologically approximately twice as powerful as equivalent gains. Losing $50 feels worse than gaining $50 feels good.

**Application**: "Don't lose your progress" is more motivating than "Save your progress." "Your trial expires in 3 days — don't lose access to your data" creates urgency. Streak counters ("15-day streak! Don't break it!") leverage loss aversion for habit maintenance.

**Ethical line**: Do not manufacture artificial losses. Do not threaten users with data loss to force upgrades. Do not create anxiety about losing things the user doesn't actually value. Loss framing must reference genuine value the user would genuinely miss.

### Peak-End Rule

Experiences are judged primarily by their peak emotional intensity and their final moment — not by the average experience or total duration.

**Application**: End every flow on a positive note. Successful form submission → celebratory confirmation. Completed purchase → clear confirmation with next steps. Error recovery → reassurance that everything is fixed. Invest disproportionately in the end-of-flow experience.

**The peak matters too**: Identify the moment of highest emotional intensity in your user journey. If it's negative (a confusing step, a surprising charge), redesign it. If it's positive (the "aha moment," the first success), amplify it.

**Ethical line**: Do not manipulate peaks artificially. Creating a fake problem to "solve" heroically is not designing a positive peak. The peak must emerge from genuine value delivery.

### Paradox of Choice

As the number of options increases beyond a threshold, satisfaction decreases, decision difficulty increases, and the likelihood of choosing nothing at all rises. This is Barry Schwartz's paradox — more choice does not mean more freedom.

**Application**: Limit visible options. Provide clear recommendations. Use smart defaults. Offer curated selections rather than exhaustive catalogs. When extensive choice is necessary (e.g., an e-commerce catalog), provide powerful filtering and sorting to reduce the effective choice set.

**Anti-pattern**: Showing all 50 product variants on a single page. Presenting 8 pricing tiers. Offering 20 customization options during onboarding. More options = more regret, more paralysis, more abandonment.

### Serial Position Effect

Items at the beginning (primacy) and end (recency) of a list are remembered better than items in the middle. The middle items receive less attention and are recalled less accurately.

**Application**: Place the most important navigation items at the start and end of the menu bar. Put critical information at the top and bottom of lists. In mobile tab bars (typically 5 items), the first and last positions are prime real estate — place the most important actions there.

**Anti-pattern**: Burying important items in the middle of lists. Placing the primary CTA as the third of five options. Hiding critical navigation in the middle of a horizontal menu.

### Von Restorff Effect (Isolation Effect)

An item that is visually distinct from its surroundings is more likely to be remembered and noticed. Distinctiveness attracts attention and enhances recall.

**Application**: Make the primary call-to-action visually distinct from all other elements on the page. Use a unique color, size, or style for the one element you most want users to notice. The "recommended" plan on a pricing page should look different from the other plans.

**Anti-pattern**: Making everything visually distinctive. When every element screams for attention, nothing is distinctive. The Von Restorff effect requires a single (or very few) distinctive element(s) against a uniform background. If three buttons are all different colors, none of them is "the" distinctive one.

### Endowment Effect

People value things more once they own them. Ownership — even psychological ownership — increases perceived value.

**Application**: Free trials that let users create content, customize settings, and invest effort before asking for payment. "Your dashboard" language that frames the product as the user's own. Personalization that makes the experience feel uniquely theirs.

**Ethical line**: Do not exploit the endowment effect to trap users. Making it easy to invest and hard to extract (data hostage patterns) exploits this bias. Users must be able to export their data and leave as easily as they arrived.


## Emotional Design

Emotion is not separate from cognition — it is integral to every decision. Emotional responses occur faster than rational analysis and fundamentally shape how users perceive, evaluate, and remember their experience. Design that ignores emotion is design that ignores half the user experience.

### Norman's Three Levels

Don Norman's framework describes three levels at which design creates emotional response:

**Visceral level (appearance)**: Immediate, pre-conscious emotional reaction. Before the user clicks anything, reads anything, or understands anything, they have already formed an emotional impression. "This looks clean and trustworthy" or "This looks cluttered and cheap." Visceral response is governed by aesthetics, visual quality, and first impressions. It happens in milliseconds.

**Behavioral level (usability)**: Emotional response during active use. "This feels intuitive and satisfying" or "This feels confusing and frustrating." Behavioral emotion is governed by function, performance, feedback quality, and interaction fluency. It accumulates over the course of task completion.

**Reflective level (meaning)**: Long-term emotional association and identity connection. "I love this product — it represents who I am" or "Using this product makes me feel professional." Reflective emotion is governed by brand, story, social significance, and personal identity. It determines loyalty and advocacy.

**Design implication**: All three levels must be addressed. Visceral design gets users in the door. Behavioral design keeps them using the product. Reflective design creates loyalty and word-of-mouth. Neglecting any level creates a weakness that undermines the others.

### Aesthetic-Usability Effect

Beautiful interfaces are perceived as more usable — even when they objectively are not. Users are more patient with attractive designs, more likely to forgive minor usability issues, and more likely to attribute problems to their own error rather than the design's.

**Design implication**: Visual quality is not vanity — it is a functional requirement. Polish communicates competence, which builds trust, which increases tolerance, which improves perceived usability. A pixel-perfect interface with mediocre UX will outperform an ugly interface with good UX in first impressions and short-term satisfaction.

**The trap**: Do not sacrifice actual usability for aesthetics. The aesthetic-usability effect masks problems — it does not solve them. Eventually, users discover that the beautiful interface is hard to use, and the betrayal of mismatched expectations is worse than if the interface had been ugly but functional from the start.

### Emotional Response Hierarchy

Not all emotional responses are equally important. Design for them in order:

1. **Trust**: Establish first. Users must feel safe before they engage. Security indicators, professional design quality, transparent communication, reliable performance. Without trust, nothing else matters.

2. **Satisfaction**: Deliver consistently. The product works well, meets needs, and respects the user's time. Satisfaction comes from functional reliability and task success.

3. **Delight**: Add sparingly. Surprise, personality, polish, thoughtful microinteractions. Delight is the bonus layer — never pursue it at the expense of trust or satisfaction. A delightful animation that delays task completion is not delightful.

### Designing for Emotional Safety

Users carry emotional vulnerability into interactions. Fear of making mistakes. Anxiety about data loss. Embarrassment about not understanding. Frustration with technology. Design must accommodate this vulnerability.

**Principles**:
- Never blame users for errors. "That password is incorrect" → not "You entered the wrong password"
- Reduce anxiety about irreversible actions. Auto-save. Undo. Confirmation dialogs for destructive actions. Recoverability.
- Be transparent about consequences before the user acts. "This will permanently delete your account and all associated data" — before the button, not after.
- Provide escape routes. Every flow must have a way out. No dead ends, no forced commitments, no points of no return without explicit warning.
- Use calm, reassuring language in error states. The user is already frustrated — do not add to it with technical jargon, accusatory tone, or unhelpful messages.


## Flow State & Engagement

### Csikszentmihalyi's Flow

Flow is the state of optimal experience where a person is fully immersed in an activity with energized focus, full involvement, and enjoyment. Challenge and skill are in balance — the task is neither so easy that it bores nor so hard that it frustrates.

**Conditions for flow**:
- **Clear goals**: The user knows exactly what to do next. Ambiguity kills flow.
- **Immediate feedback**: Every action produces visible, interpretable feedback. Delayed or absent feedback breaks flow.
- **Balance of challenge and skill**: The task stretches the user's ability without exceeding it. Progressive difficulty maintains this balance.
- **Sense of control**: The user feels in command. Unexpected errors, confusing navigation, and forced interruptions destroy the sense of control.
- **Deep concentration**: The user can focus without distraction. Popups, notifications, and layout shifts break concentration.
- **Loss of self-consciousness**: The user is so engaged they forget themselves. This state requires all other conditions to be met.
- **Altered sense of time**: Time passes without notice. This is a consequence of deep engagement, not a design goal.

### Design for Flow

**Progressive difficulty**: Start easy. Increase challenge as the user gains competence. Onboarding should feel effortless. Advanced features should challenge experienced users. The difficulty curve must be smooth — no sudden spikes that frustrate and no plateaus that bore.

**Clear progress feedback**: Progress bars, step indicators, completion percentages, achievement markers. The user must always know where they are in the journey, how far they've come, and how far they have to go.

**Remove interruptions**: Every interruption breaks flow, and re-establishing flow takes significant effort (research suggests 15-25 minutes to regain deep focus after interruption). Minimize popups, defer non-critical notifications, batch low-priority alerts, and never interrupt a task to ask a question that could wait.

**Match complexity to expertise**: Novice users need guided flows with constrained options. Expert users need powerful tools with flexible workflows. Adaptive interfaces that adjust complexity to demonstrated expertise maintain flow across user populations.

### Anti-Patterns in Flow Design

**Artificial difficulty**: Making things hard to "increase engagement" or "add challenge." If the difficulty comes from poor design rather than inherent task complexity, it is not flow — it is frustration.

**Compulsion loops**: Auto-playing next episodes, infinite scroll without stopping cues, notification cascades that pull users back against their conscious intent. These patterns exploit the flow state rather than cultivating it. They serve engagement metrics at the cost of user wellbeing.

**Interruption-driven engagement**: Breaking flow to show ads, prompt reviews, request notifications, or upsell premium features. Every interruption has a cost — the user's concentration. Only interrupt for information that genuinely serves the user's current task.


## Psychology-Based Design Laws

Each law is a specific, evidence-based principle with direct design implications. These laws are not suggestions — they describe measurable human behavior.

### Fitts's Law

**Definition**: The time to acquire a target is a function of the distance to the target and the size of the target. Closer and larger = faster and easier.

**Formula**: T = a + b × log₂(1 + D/W), where D = distance, W = width of target.

**Design implication**: Make important targets large and position them close to likely cursor/finger positions. Primary actions get large click targets. Related actions are positioned near each other. Destructive actions are positioned away from constructive actions (preventing accidental clicks).

**Specific applications**:
- Primary CTA buttons: minimum 44×44px touch target (mobile), generous padding (desktop)
- Navigation items: full-width click targets in sidebars, not just the text
- Context menus: appear at the cursor position, not in a fixed location
- Corner and edge targets: effectively infinite size on desktop (cursor stops at screen edge) — use this for critical actions

**Anti-pattern**: Tiny close buttons. Small touch targets on mobile. Important actions far from the user's current focus. Related actions on opposite sides of the screen.

### Hick's Law

**Definition**: Decision time increases logarithmically with the number of equally probable alternatives.

**Design implication**: Reduce the number of choices at each decision point. When many options are necessary, structure them hierarchically, categorize them, or provide progressive disclosure.

**Specific applications**:
- Landing page: one primary CTA, not five competing actions
- Navigation: 5-7 top-level categories, drill-down for specifics
- Pricing: 3 plans with clear differentiation and one recommended
- Settings: grouped by category, with sensible defaults that eliminate most decisions
- Search results: faceted filtering to reduce the visible result set

**Anti-pattern**: Showing all 50 product categories on the homepage. Presenting every configuration option during first-run setup. Offering undifferentiated choices without guidance.

### Jakob's Law

**Definition**: Users spend most of their time on other sites. They expect your site to work like those other sites.

**Design implication**: Follow established conventions. Use standard patterns for navigation, search, forms, shopping carts, account settings, and every other common interaction. Users transfer learned behavior from other products — leveraging this transfer reduces learning cost to zero for familiar patterns.

**When to break convention**: Only when you have strong evidence that the convention harms usability for your specific users, and your alternative has been validated through testing. Innovation belongs in your value proposition, not in your hamburger menu placement.

**Anti-pattern**: Custom scrollbar behavior. Novel navigation paradigms that "reinvent" the header. Non-standard form interactions (custom dropdowns that don't behave like native ones). Moving the shopping cart icon away from the top-right corner.

### Miller's Law

**Definition**: The average person can hold 7±2 items in working memory. The effective limit for unrelated, novel items is closer to 4.

**Design implication**: Chunk information into groups of 3-7 items. Break long lists into categorized sublists. Limit the number of items presented simultaneously without structure.

**Specific applications**:
- Phone numbers: XXX-XXX-XXXX (3 chunks), not XXXXXXXXXX (10 items)
- Credit card numbers: XXXX XXXX XXXX XXXX (4 chunks)
- Navigation: 5-7 items per level
- Dashboard widgets: 4-6 per view, grouped by function
- Onboarding steps: 3-5 steps per wizard

**Anti-pattern**: Ungrouped lists of 15+ items. Long forms without section breaks. Dashboards with 20 undifferentiated widgets. Any presentation of more than 7 items without visual chunking.

### Tesler's Law (Law of Conservation of Complexity)

**Definition**: Every application has an inherent amount of complexity that cannot be removed or hidden. It can only be moved — from the user to the system, or from the system to the user.

**Design implication**: Move complexity to the system side whenever possible. Auto-detect what the system can infer. Pre-fill what the system already knows. Compute what the system can calculate. The user should never do work the system could do for them.

**Specific applications**:
- Auto-detect location rather than asking users to type their city
- Pre-fill form fields from known user data
- Auto-format inputs (phone numbers, dates, credit cards)
- Suggest the most likely option based on usage patterns
- Handle edge cases and exceptions in system logic, not in user decisions

**Anti-pattern**: Asking users for information the system already has. Requiring manual data entry when auto-detection is feasible. Exposing system complexity through technical settings that users cannot meaningfully evaluate.

### Doherty Threshold

**Definition**: Productivity soars when a computer and its users interact at a pace (< 400ms) that ensures neither has to wait on the other. Response times above 400ms break the sense of direct manipulation.

**Design implication**: Every interaction must produce a visible response within 400ms. For operations that take longer, provide immediate feedback (optimistic UI, loading indicators, progress bars). Never leave the user staring at an unchanged screen wondering if their click registered.

**Response time guidelines**:
- 0-100ms: perceived as instantaneous. Direct manipulation feedback (button press, toggle, hover)
- 100-400ms: perceptible delay but feels responsive. Most transitions and simple operations
- 400ms-1s: noticeable delay. Show a loading indicator or spinner
- 1-5s: significant delay. Show a progress bar with estimated time
- 5s+: long operation. Show detailed progress, allow background processing, offer notification on completion

**Anti-pattern**: No loading indicator for multi-second operations. Spinners without progress information for operations longer than 5 seconds. Entire page reloads for small data updates.

### Zeigarnik Effect

**Definition**: Incomplete tasks are remembered better and create more psychological tension than completed tasks. The mind holds onto unfinished business.

**Design implication**: Use progress indicators and completion tracking to leverage this effect positively. Profile completion bars, learning path progress, onboarding checklists — all create productive tension that motivates completion. Show the user how close they are to done.

**Specific applications**:
- "Complete your profile" with a progress bar showing 60% done
- Learning paths showing completed and remaining modules
- Onboarding checklists with checked and unchecked items
- Achievement systems that show partial progress toward the next milestone
- Shopping cart badges showing items waiting for checkout

**Anti-pattern**: Using incompleteness to create anxiety rather than motivation. Endless "complete your profile" nudges for fields that don't matter. Artificial incompleteness that manufactures urgency. Gamification that makes the user feel perpetually behind. The test: does the completion serve the user's goals, or does the tension serve engagement metrics?

### Aesthetic-Usability Effect (as a Design Law)

See § Aesthetic-Usability Effect above for the full definition. As a design law: first impressions form in 50ms and are dominated by visual quality. Invest in polish — it directly impacts perceived credibility and trust. But the effect is a perception buffer, not a substitute for genuine usability.


## Psychology Checklist

Apply this checklist to every design decision. Each item references the specific principle it validates.

### Cognitive Load
- [ ] Have you minimized extraneous cognitive load? (See § Extraneous Load)
- [ ] Is information chunked into groups of 3-7? (See § Working Memory Limits, Miller's Law)
- [ ] Are only task-relevant elements visible? (See § Extraneous Load)
- [ ] Is progressive disclosure used for complex features? (See § Intrinsic Load)

### Defaults and Decision Support
- [ ] Are defaults set to the most common or safest option? (See § Status Quo Bias, § Nudge Theory)
- [ ] Are choices kept to a reasonable number at each decision point? (See § Hick's Law, § Paradox of Choice)
- [ ] Is a recommended option clearly indicated when multiple options exist? (See § Hick's Law)

### Memory and Recognition
- [ ] Does the interface leverage recognition over recall? (See § Recognition Over Recall)
- [ ] Are familiar patterns and conventions followed? (See § Jakob's Law, § Mental Models)
- [ ] Are important items placed at the start or end of lists? (See § Serial Position Effect)

### Visual Organization
- [ ] Are related items visually grouped using proximity and similarity? (See § Gestalt Principles)
- [ ] Is the most important action the most visually prominent? (See § Fitts's Law, § Von Restorff Effect)
- [ ] Does the layout create a clear visual flow? (See § Continuity)
- [ ] Is figure-ground distinction unambiguous? (See § Figure-Ground)

### Feedback and Response
- [ ] Does every action produce visible feedback within 400ms? (See § Doherty Threshold)
- [ ] Are progress indicators shown for operations longer than 1 second? (See § Doherty Threshold)
- [ ] Do error messages explain what happened and suggest a fix? (See § Germane Load)
- [ ] Does the experience end on a positive note? (See § Peak-End Rule)

### Emotional Design
- [ ] Does the design accommodate both System 1 and System 2 thinking appropriately? (See § Dual Process Theory)
- [ ] Is emotional safety maintained? No blame, no anxiety, no dead ends? (See § Emotional Safety)
- [ ] Is trust established before satisfaction and delight are pursued? (See § Emotional Response Hierarchy)

### Behavioral Ethics
- [ ] Are persuasion techniques used ethically — serving user goals, not exploiting users? (See § Persuasion Principles)
- [ ] Would the user approve of every nudge and default if they fully understood it? (See § Nudge Theory)
- [ ] Are all social proof indicators genuine? (See § Social Proof)
- [ ] Is scarcity real, not manufactured? (See § Scarcity)
- [ ] Do habit-forming features serve the user's stated goals? (See § The Hooked Model)
- [ ] Are dark patterns absent from every flow? (See ai-designer-antipatterns.md § Dark Pattern Catalog)

### Flow and Engagement
- [ ] Is difficulty progressive and matched to user expertise? (See § Flow State)
- [ ] Are interruptions minimized during task completion? (See § Flow State)
- [ ] Is the Zeigarnik Effect used for motivation, not anxiety? (See § Zeigarnik Effect)


## Book Source Appendix

These sources inform the principles in this Skill. Knowledge is merged by theme — not organized by book.

| Book | Author | Primary Contribution |
|------|--------|---------------------|
| Thinking, Fast and Slow | Daniel Kahneman | System 1/System 2, cognitive biases, loss aversion, anchoring, framing |
| Emotional Design | Don Norman | Three levels of emotional design (visceral, behavioral, reflective) |
| The Design of Everyday Things | Don Norman | Mental models, affordances, signifiers, feedback |
| Nudge | Richard Thaler & Cass Sunstein | Choice architecture, defaults, framing, libertarian paternalism |
| Predictably Irrational | Dan Ariely | Cognitive biases in decision-making, anchoring, relativity |
| The Laws of Simplicity | John Maeda | Complexity reduction, organization, context |
| Hooked | Nir Eyal | Habit formation model (Trigger → Action → Variable Reward → Investment) |
| Indistractable | Nir Eyal | Attention management, internal triggers, focus protection |
| Influence | Robert Cialdini | Six principles of persuasion (reciprocity, commitment, social proof, authority, liking, scarcity) |
| Flow | Mihaly Csikszentmihalyi | Flow state conditions, challenge-skill balance, optimal experience |
| Seductive Interaction Design | Stephen Anderson | Emotional design, playful interaction, engagement patterns |
| Designing with the Mind in Mind | Jeff Johnson | Perception, attention, memory, learning — applied to interface design |
| 100 Things Every Designer Needs to Know About People | Susan Weinschenk | Cognitive psychology applied to design, decision-making, motivation |
| Mental Models | Indi Young | Mental model research methods, alignment diagrams |
| The Paradox of Choice | Barry Schwartz | Choice overload, decision fatigue, satisfaction vs. maximization |
| Universal Principles of Design | William Lidwell et al. | Cross-disciplinary design principles including Gestalt, cognitive, behavioral |
| Designing for Behavior Change | Stephen Wendel | Behavioral science applied to product design, habit formation |
| The Humane Interface | Jef Raskin | Cognitive load, interface efficiency, humane design principles |
