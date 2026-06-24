---
name: ai-designer-research
description: UX research methods and frameworks for the AI Designer suite. Covers qualitative and quantitative research methods, user persona framework, mental models, user journey mapping, usability testing protocol, research synthesis techniques, UX metrics and measurement, and AI-specific research guidance. Load with ai-designer-core. Reference when conducting or recommending user research.
---

## Research Mindset

Research is not optional. It is the foundation of every defensible design decision. Without research, you are decorating assumptions. With research, you are solving verified problems.

### You Are Not the User — Applied

This principle is owned by Core Skill. (See ai-designer-core.md § "You Are Not the User") Here it becomes operational: every research method in this Skill exists because your intuition about users is unreliable. Research replaces guessing with knowing.

The evidence hierarchy governs all design decisions:

1. **Observed behavior** — what users actually do (usability testing, analytics, field observation)
2. **Stated preference** — what users say they want (interviews, surveys)
3. **Expert opinion** — what established heuristics and patterns predict (heuristic evaluation, design critique)
4. **Assumption** — what you think is true without evidence (proto-personas, untested hypotheses)

Never treat a lower-tier source as equivalent to a higher-tier one. A survey that says users love feature X is less reliable than analytics showing they never use it.

### Empathy vs. Sympathy

Empathy is understanding another person's experience from their frame of reference. Sympathy is projecting your feelings onto their situation. Research requires empathy.

- **Empathy**: "This user struggles with the checkout flow because the address form requires a format they don't recognize."
- **Sympathy**: "I'd be frustrated too if the checkout was this bad."

Sympathy centers your experience. Empathy centers theirs. When you find yourself saying "I would feel…" during research, stop. The question is "What does the evidence show this person feels?"

### Research Is Continuous

Research is not a phase you complete and leave behind. It is a continuous activity that runs alongside design, implementation, and post-launch operation.

- **Before design**: Understand the problem space, users, and context
- **During design**: Validate assumptions, test prototypes, refine direction
- **After launch**: Measure outcomes, identify new problems, inform the next iteration

Every design specification should identify which decisions are evidence-based and which are assumptions requiring validation. (See ai-designer-core.md § Design Workflow — Phase 2)


## Research Methods Catalog

Each method below includes: when to use it, when NOT to use it, typical sample size, time investment, and expected output. Choose methods based on what you need to learn, not what's familiar.

### Qualitative Methods

Qualitative research answers **why** and **how**. It reveals motivations, mental models, pain points, and context. It does not tell you how many or how often — that's quantitative.

#### User Interviews

**Definition**: One-on-one conversations with users to understand their goals, behaviors, context, and mental models.

**Variants**:
- **Structured interview**: Fixed questions in fixed order. Consistent across participants. Best for comparing responses across a group. Least flexible.
- **Semi-structured interview**: Core questions with freedom to follow interesting threads. Best balance of consistency and depth. The default choice for most research.
- **Contextual interview**: Conducted in the user's environment while they perform real tasks. Combines interview with observation. Highest-fidelity data.

**When to Use**: Early in the design process to understand the problem space. When you need to understand motivations, workflows, or pain points that analytics cannot reveal. When the domain is unfamiliar.

**When NOT to Use**: When you need to quantify how many users share a behavior (use a survey). When users cannot accurately self-report the behavior you're studying (use observation). When the question is "which design works better" (use usability testing).

**Sample Size**: 5–8 participants per user segment. Diminishing returns after 8 — new interviews repeat existing themes.

**Time**: 45–60 minutes per session. Plan 2× session time for note synthesis.

**Output**: Key themes, pain points, goals, quotes, behavioral patterns, mental model insights.

**Facilitation Principles**:
- Ask open-ended questions: "Tell me about the last time you…" not "Do you like…"
- Follow the participant's story — do not redirect to your agenda
- Ask "why" and "tell me more" — the first answer is rarely the real answer
- Record exact quotes — paraphrasing introduces your bias
- Never lead: "What are you thinking?" not "Is this confusing?"

#### Contextual Inquiry

**Definition**: Observe users performing real tasks in their natural environment. You are the apprentice; they are the master.

**When to Use**: When you need to understand how people actually work, not how they describe their work. When workflows involve physical space, multiple tools, or collaboration. When stated behavior likely differs from actual behavior.

**When NOT to Use**: When the task is infrequent and cannot be observed on a schedule. When the environment is inaccessible (regulated spaces, personal contexts). When the participant's awareness of being observed would alter the behavior (highly sensitive tasks).

**Sample Size**: 4–6 participants. Contextual inquiry is time-intensive per session.

**Time**: 2–4 hours per session (including setup and debrief).

**Output**: Workflow diagrams, environmental constraints, workarounds and hacks, tool interactions, communication patterns.

**Key Practice**: The master-apprentice model. The user is the expert performing their task. You observe, ask questions, and have them teach you. Interrupt only to clarify — never to suggest.

#### Diary Studies

**Definition**: Participants record their experiences over time — days, weeks, or months — capturing behaviors and contexts that a single session cannot reveal.

**When to Use**: When the behavior is longitudinal (happens over days or weeks). When you need to understand habits, routines, and context changes over time. When you need data about infrequent events that cannot be observed on demand.

**When NOT to Use**: When you need immediate answers — diary studies take weeks. When participants have low motivation or literacy for self-reporting. When the behavior is subconscious and participants cannot notice or articulate it.

**Sample Size**: 10–15 participants (expect some dropout).

**Time**: 1–4 weeks of data collection. 1–2 weeks for analysis.

**Output**: Behavioral patterns over time, context triggers, emotional arcs, unmet needs in natural settings.

#### Focus Groups

**Definition**: Group discussions with 5–8 participants facilitated by a moderator.

**When to Use**: When you need to explore a range of attitudes, opinions, or ideas quickly. When group dynamics (agreement, disagreement, building on ideas) would generate richer discussion than individual interviews. When exploring brand perception or initial reactions to concepts.

**When NOT to Use**: When individual behaviors matter more than group opinions — focus groups reveal social consensus, not individual truth. When the topic is sensitive or personal (participants self-censor in groups). When you need to understand usability (use usability testing instead). When dominant personalities will skew the data (always a risk).

**Critical Warning**: Focus groups are the most misused research method. Groupthink, social desirability bias, and dominant voices routinely produce misleading data. Never use focus group data as the sole input for design decisions. Triangulate with behavioral data.

**Sample Size**: 5–8 per group. Run 3–4 groups minimum to identify patterns vs. group-specific dynamics.

**Time**: 60–90 minutes per session.

**Output**: Range of perspectives, shared language, areas of consensus and disagreement, initial concept reactions.

#### Ethnographic Observation

**Definition**: Extended observation of users in their natural context, often over days or weeks. The researcher is a fly on the wall, not an active participant.

**When to Use**: When you need to understand culture, environment, and social dynamics that shape behavior. When the context is unfamiliar to the design team. When you need to discover problems users do not know they have.

**When NOT to Use**: When the research question is specific and narrow — ethnography is broad and exploratory. When time constraints prevent extended immersion. When the environment cannot accommodate an observer.

**Sample Size**: 3–5 observation sites or contexts.

**Time**: Days to weeks of immersion. Substantial analysis time.

**Output**: Rich contextual understanding, cultural insights, behavioral patterns, environmental constraints, unarticulated needs.

#### Card Sorting

**Definition**: Participants organize content into categories that make sense to them, revealing their mental model of the information space.

**Variants**:
- **Open card sort**: Participants create their own categories. Reveals how users naturally group concepts. Use when building IA from scratch.
- **Closed card sort**: Participants sort into predefined categories. Tests whether your IA structure matches user expectations. Use to validate existing IA.
- **Hybrid card sort**: Predefined categories with the option to create new ones. Best of both approaches.

**When to Use**: When designing or redesigning information architecture. When label naming is uncertain. When you need to understand how users mentally group content. When there are more than 15 items to organize.

**When NOT to Use**: When the content set is tiny (fewer than 10 items — the structure is obvious). When the question is about task flow, not content organization (use tree testing or usability testing).

**Sample Size**: 15–30 participants for statistical reliability. Can be run remotely at scale.

**Time**: 15–30 minutes per participant. 1–2 days for analysis with clustering algorithms.

**Output**: Dendrograms showing natural content clusters, category labels in user language, similarity matrices, IA structure recommendations.

#### Tree Testing

**Definition**: Participants navigate a text-only hierarchy (no visual design) to find specific items. Tests whether the IA structure works before any visual design is applied.

**When to Use**: After card sorting results have been synthesized into a proposed IA. When you need to validate that users can find content in your hierarchy. When you want to test IA independent of visual design, navigation patterns, or labels.

**When NOT to Use**: When the IA is trivially simple (3–5 items at one level). When the real problem is visual design or navigation mechanism, not structure.

**Sample Size**: 30–50 participants for reliable task completion rates.

**Time**: 10–15 minutes per participant. Runs remotely and unmoderated at scale.

**Output**: Task success rates per path, time to find items, first-click accuracy, paths taken (revealing where users get lost).

### Quantitative Methods

Quantitative research answers **how many**, **how often**, and **how much**. It measures behavior at scale. It does not explain why — that requires qualitative methods.

#### Surveys and Questionnaires

**Definition**: Structured sets of questions administered to a sample of users to measure attitudes, preferences, demographics, and self-reported behaviors.

**When to Use**: When you need to quantify the prevalence of behaviors or attitudes discovered in qualitative research. When you need demographic data. When you need to measure satisfaction or perception at scale.

**When NOT to Use**: When you need to understand why (use interviews). When the question requires observation of behavior (self-reported behavior is unreliable). When the sample is too small for meaningful quantitative analysis (fewer than 30 respondents).

**Sample Size**: Minimum 30 for basic descriptive statistics. 100+ for cross-segment analysis. 384+ for ±5% margin of error at 95% confidence on a large population.

**Time**: Survey design: 2–5 days (including pilot testing). Data collection: 1–2 weeks. Analysis: 1–3 days.

**Question Design Rules**:
- One concept per question — never "and" two ideas
- Avoid leading questions: "How much did you enjoy…" assumes enjoyment
- Avoid double negatives: "Do you disagree that this is not useful?"
- Include "Not applicable" when relevant — forced choices produce bad data
- Randomize option order to prevent position bias
- Pilot test with 5 people before launch — every survey has unclear questions

**Output**: Frequency distributions, satisfaction scores, demographic breakdowns, attitude measurements, benchmarks for tracking over time.

#### A/B Testing

**Definition**: Show two or more variants to different user groups simultaneously and measure which performs better on a defined metric.

**When to Use**: When you have a specific, measurable hypothesis ("Variant B will increase sign-up completion rate"). When you have sufficient traffic to reach statistical significance. When the change is isolated enough to attribute causation.

**When NOT to Use**: When you lack sufficient traffic (minimum ~1,000 users per variant for most tests). When the metric is ambiguous or long-term (A/B tests measure short-term behavior). When you're testing fundamentally different experiences (A/B tests work best for isolated changes). When the ethical implications of showing different experiences are unacceptable.

**Statistical Significance**: A result is statistically significant when p-value < 0.05, meaning there is less than a 5% probability the difference is due to chance. Minimum detectable effect: decide the smallest improvement worth detecting before starting. Running a test until you get significance (p-hacking) invalidates results. Set sample size before starting.

**Sample Size**: Calculate based on: baseline conversion rate, minimum detectable effect, statistical power (0.8 standard), significance level (0.05 standard). Typical range: 1,000–10,000 users per variant.

**Time**: 1–4 weeks of data collection, depending on traffic. Minimum 1 full business cycle (usually 1 week) to account for day-of-week effects.

**Output**: Winner with statistical confidence, effect size, confidence interval.

#### Analytics Analysis

**Definition**: Examine behavioral data from existing product instrumentation — page views, click paths, conversion funnels, drop-off points, feature usage.

**When to Use**: Always, as a baseline before any design work. When you need to understand what users actually do (vs. what they say they do). When you need to identify problem areas at scale. When you need to measure the impact of design changes post-launch.

**When NOT to Use**: When you need to understand why users behave a certain way (analytics show what, not why). When the product is new and has no historical data. When the analytics instrumentation is unreliable or incomplete.

**Key Metrics**:
- **Conversion funnels**: Where do users drop off?
- **Feature adoption**: What percentage of users engage with a feature?
- **Navigation paths**: How do users move through the product?
- **Error rates**: Where do users encounter errors?
- **Engagement depth**: How deeply do users explore?
- **Retention curves**: When do users stop returning?

**Output**: Behavioral baselines, problem areas ranked by severity and volume, feature usage patterns, funnel metrics.

#### Task Success Rate Measurement

**Definition**: Measure the percentage of users who successfully complete a defined task. The most fundamental usability metric.

**When to Use**: During usability testing to compare designs, measure progress, or benchmark against competitors. Post-launch to monitor whether real-world task completion meets design targets.

**When NOT to Use**: When the task is exploratory with no single "success" definition. When success is subjective (e.g., "find an interesting article").

**Measurement**: Binary (completed/failed) or graded (completed without help / completed with help / failed). Record along with time-on-task and error count for a complete picture.

**Output**: Percentage completion rate, comparison across designs or user segments, trend data over time.

#### System Usability Scale (SUS)

**Definition**: A standardized 10-question post-test questionnaire that produces a single usability score from 0–100. Created by John Brooke in 1986. The most widely used usability questionnaire.

**The 10 Questions** (rated 1 = Strongly Disagree to 5 = Strongly Agree):
1. I think that I would like to use this system frequently.
2. I found the system unnecessarily complex.
3. I thought the system was easy to use.
4. I think that I would need the support of a technical person to be able to use this system.
5. I found the various functions in this system were well integrated.
6. I thought there was too much inconsistency in this system.
7. I would imagine that most people would learn to use this system very quickly.
8. I found the system very cumbersome to use.
9. I felt very confident using the system.
10. I needed to learn a lot of things before I could get going with this system.

**Scoring**: Odd items: score - 1. Even items: 5 - score. Sum all values, multiply by 2.5. Result: 0–100.

**Interpretation**: Average SUS score: 68. Above 80.3: top 10% (excellent). Below 51: bottom 15% (poor). SUS measures perceived usability, not objective usability — use alongside task success rate.

**When to Use**: After any usability testing session. For benchmarking against industry averages. For tracking usability over design iterations.

**When NOT to Use**: As the sole measure of usability (it's perception-based). For diagnosing specific problems (SUS tells you something's wrong, not what).

#### Net Promoter Score (NPS)

**Definition**: Single question — "How likely are you to recommend [product] to a friend or colleague?" — scored 0–10. Detractors (0–6), Passives (7–8), Promoters (9–10). NPS = % Promoters − % Detractors. Range: −100 to +100.

**When to Use**: For high-level satisfaction tracking over time. For comparing against industry benchmarks. As one signal among many.

**Limitations — and they are significant**:
- NPS measures loyalty intent, not actual behavior. People who say they'll recommend often don't.
- A single number cannot diagnose problems. NPS tells you sentiment, not what to fix.
- Score interpretation varies wildly by industry and culture.
- NPS is easily gamed by survey timing, question framing, and selection bias.
- NPS should never be the sole metric for UX quality. Combine with task success rate, SUS, and behavioral analytics.

**Output**: Trend data, segment comparison, high-level satisfaction indicator. Never use in isolation.

### Mixed Methods

Mixed methods combine qualitative and quantitative approaches. They answer both "what's happening" and "why."

#### Usability Testing

**Definition**: Observe users attempting to complete specific tasks with your design. The single most valuable research method for design teams.

**Variants**:
- **Moderated, in-person**: Facilitator and participant in the same room. Highest fidelity. Best for exploring complex workflows and catching subtle reactions.
- **Moderated, remote**: Facilitator and participant connected via screen-sharing. Nearly as good as in-person. Broader geographic reach.
- **Unmoderated, remote**: Participant completes tasks independently using testing software. Scales to larger samples. Loses the ability to probe and follow up.

**When to Use**: At every fidelity level — paper prototypes, wireframes, interactive prototypes, production product. Before launch to find problems. After launch to validate fixes.

**When NOT to Use**: When you need to understand the problem space, not evaluate a solution (use interviews). When you need statistically significant comparison (use A/B testing with adequate sample). When the design is so early that there's nothing to test (use interviews and card sorting first).

**Sample Size**: 5 users find approximately 85% of usability problems (Nielsen/Landauer). Test with 5, fix the problems, test with 5 more. This iterative approach finds more issues per dollar than one large study.

**Time**: 30–60 minutes per moderated session. Plan 3–5 days for a round of 5 sessions plus analysis.

**Output**: Usability findings with severity ratings, task completion rates, time on task, error counts, user quotes, recommendations.

Full protocol in § Usability Testing Protocol below.

#### Heuristic Evaluation

**Definition**: Expert reviewers evaluate a design against a set of established usability principles (heuristics). Not user research — expert analysis.

**Nielsen's 10 Usability Heuristics**:
1. Visibility of system status
2. Match between system and the real world
3. User control and freedom
4. Consistency and standards
5. Error prevention
6. Recognition rather than recall
7. Flexibility and efficiency of use
8. Aesthetic and minimalist design
9. Help users recognize, diagnose, and recover from errors
10. Help and documentation

**When to Use**: When time or budget prevents user testing. As a preliminary pass before usability testing (find the obvious issues first). When evaluating competitor products.

**When NOT to Use**: As a replacement for usability testing. Experts find different problems than users do. Heuristic evaluation catches principle violations; usability testing catches real-world task failures. Use both.

**Sample Size**: 3–5 evaluators. Each evaluator finds different issues. Aggregating 3–5 evaluators captures ~75% of issues.

**Time**: 1–2 hours per evaluator per product area.

**Output**: List of heuristic violations with severity ratings, affected heuristic(s), screenshot/location, and recommended fix.

#### Competitive Analysis

**Definition**: Systematic evaluation of competitor and analogous products to understand the design landscape, identify patterns, and spot opportunities.

**Variants**:
- **Feature matrix**: Spreadsheet comparing features across competitors. Reveals gaps and table stakes.
- **Experience audit**: Walk through competitor products as a user, documenting strengths, weaknesses, and patterns. Reveals UX quality, not just feature presence.

**When to Use**: Early in the design process to understand the competitive landscape. When defining scope to distinguish "must-have" from "differentiator." When looking for established patterns to adopt (or avoid).

**When NOT to Use**: As justification for copying competitors. "They did it this way" is not evidence that it's the right approach — they may not have tested it either. When the product is genuinely novel with no meaningful competitors (rare).

**Sample Size**: 3–5 direct competitors plus 2–3 analogous products (products solving similar problems in different domains).

**Output**: Feature comparison matrix, pattern inventory, experience strengths/weaknesses, opportunity areas, screenshots with annotations.

#### Design Critique

**Definition**: Structured peer review of design work against defined criteria. Not personal opinion — disciplined evaluation against principles.

**When to Use**: Throughout the design process. After completing wireframes, after visual design, before final specification. Regular cadence (weekly or per milestone).

**When NOT to Use**: Never skip critique. Even solo designers benefit from self-critique against checklists. (See ai-designer-core.md § Master Self-Review Checklist)

**Structure**:
1. Designer presents context: problem, constraints, decisions
2. Reviewers ask clarifying questions (no opinions yet)
3. Reviewers provide feedback organized by: what works well, what needs attention, specific suggestions
4. Each piece of feedback ties to a principle, heuristic, or evidence — not personal preference

**Output**: Prioritized feedback, action items, validated decisions, identified assumptions.


## User Persona Framework

Personas are fictional representations of real user groups, grounded in research data. They make abstract user segments concrete and keep the team focused on actual human needs instead of feature lists.

### Proto-Personas vs. Research-Backed Personas

**Proto-personas** are created from assumptions and internal knowledge — without direct user research. They are hypotheses, not findings.

- Use proto-personas when research is not yet available
- Label them explicitly: "ASSUMPTION-BASED — requires validation"
- Update or replace them as soon as research data is available
- Never present proto-personas as evidence-based

**Research-backed personas** are synthesized from actual user research data — interviews, surveys, observation, analytics.

- Grounded in patterns observed across multiple participants
- Verifiable against source data
- Updated when new research reveals behavioral shifts
- Carry authority in design decisions

### Persona Anatomy

Each persona includes:

| Component | Description | Example |
|---|---|---|
| Name & Photo | Memorable identifier (not a real person) | "Maria, the Time-Pressed Manager" |
| Demographics | Age range, role, context (only if relevant to design) | 35–45, mid-level manager, 2 direct reports |
| Goals | What they want to accomplish (primary and secondary) | Primary: Review team status in under 5 minutes |
| Frustrations | Pain points with current solutions | "I have to open 3 different tools to see who's blocked" |
| Behaviors | How they currently approach the problem | Checks dashboard first thing in the morning and after lunch |
| Context | Environment, devices, constraints, interruptions | Mobile during commute, desktop at work, frequently interrupted |
| Technical proficiency | Comfort with technology | Comfortable with standard business tools, avoids customization |
| Mental model | How they think the system works | Thinks of projects as timelines, not task lists |

### Persona Anti-Patterns

- **Fictional personas with no research basis presented as truth**: Always label the evidence level
- **Demographic-heavy, behavior-light**: A persona's age and location rarely matter. Their goals and behaviors always matter.
- **Too many personas**: 3–5 primary personas maximum. If you have 12 personas, you have a segmentation problem, not a design tool.
- **Personas that never change**: Personas are living documents. Update them when new research emerges.
- **Elastic personas**: Personas that stretch to justify any design decision. A persona that "sometimes wants simplicity and sometimes wants power" is two personas.

### Jobs-to-Be-Done (JTBD) as Alternative

JTBD focuses on the situation and desired outcome, not the person. Format:

**"When** [situation], **I want to** [motivation], **so I can** [expected outcome]."

Examples:
- "When I'm reviewing my team's progress before a standup, I want to see who's blocked, so I can unblock them before the meeting."
- "When I'm onboarding a new employee, I want to reuse my last onboarding checklist, so I can save time and not forget steps."

**When to prefer JTBD over personas**: When the same person has fundamentally different needs in different situations. When the design is task-focused rather than role-focused. When persona demographics add no design value.

**When to prefer personas over JTBD**: When the user's context, technical proficiency, or mental model significantly shapes the design. When you need to build organizational empathy for specific user groups.

Use both when appropriate. They are complementary, not competing.


## Mental Models & User Journey

### Mental Models

Mental models are the internal representations users carry about how a system works. They are always incomplete and often wrong — but they govern user behavior more than reality does. (See ai-designer-psychology.md § Mental Models)

**Why they matter for research**: Discovering user mental models is the primary purpose of early-stage qualitative research. If the design matches the user's mental model, the interface feels intuitive. If it contradicts the mental model, the user is confused regardless of how "clean" the design looks.

**Mental model diagrams** (Indi Young method): Two-part tower diagrams. The top half shows the user's tasks, thoughts, and feelings. The bottom half shows the system's features and content that support (or fail to support) those tasks. Gaps between the two halves reveal design opportunities. Overlaps confirm alignment.

**How to discover mental models**:
- Contextual interviews: ask users to walk through their process and explain their reasoning
- Card sorting: reveals how users categorize concepts
- Think-aloud usability testing: reveals real-time reasoning about system behavior
- "Draw me how you think this works" exercises during interviews

### User Journey Mapping

A user journey map visualizes the end-to-end experience of a user accomplishing a goal across time and touchpoints.

**Components of a journey map**:

| Layer | Content |
|---|---|
| Stages | Major phases of the experience (Awareness → Consideration → Purchase → Onboarding → Use → Support) |
| Actions | What the user does at each stage |
| Thoughts | What the user is thinking ("Where do I find pricing?" "Is this worth it?") |
| Emotions | How the user feels (confident, confused, frustrated, delighted) — plotted as a curve |
| Pain points | Specific friction, confusion, or failure |
| Opportunities | Design improvements that address pain points |
| Touchpoints | Channels and interfaces the user interacts with (website, app, email, phone, in-person) |

**When to Use**: When you need to understand the full experience across touchpoints and time. When identifying systemic problems that span multiple features. When aligning the team around the user's perspective rather than internal structures.

**When NOT to Use**: When the scope is a single screen or feature (use a task flow instead). When you have no data to ground the map (a journey map based purely on assumptions is fiction).

### Service Blueprints

**Definition**: An extension of the journey map that adds the organization's internal processes. Two layers:

- **Frontstage**: What the user sees and interacts with (same as journey map)
- **Backstage**: Internal processes, systems, and people that support the frontstage experience

Separated by the **line of visibility** — everything above the line is visible to the user, everything below is not.

**When to Use**: When the user experience depends on internal processes (support tickets, order fulfillment, account provisioning). When optimizing the organization's ability to deliver the experience, not just the interface.

**When NOT to Use**: When the product is self-contained with no significant backend processes visible to users.

### Experience Map vs. Journey Map vs. Service Blueprint

| Tool | Scope | Focus | Requires Specific Persona? |
|---|---|---|---|
| Experience map | General human experience with a concept or activity | Broad understanding | No — maps general behavior |
| Journey map | Specific user's experience with a specific product | User-centric diagnosis | Yes — tied to a persona |
| Service blueprint | Specific user's experience + organization's processes | System-wide alignment | Yes — tied to a persona + org |

Use experience maps early in research to understand the broad landscape. Use journey maps to diagnose specific user problems. Use service blueprints to align design improvements with operational capability.


## Usability Testing Protocol

Usability testing is the single most effective method for improving design quality. This section provides a complete protocol from planning through reporting.

### Planning

**Define objectives**: What specific questions will this test answer? "Is this usable?" is too vague. "Can users complete the checkout flow within 3 minutes without errors?" is testable.

**Select tasks**: 3–5 tasks per session. Each task must be:
- Realistic (something users would actually do)
- Specific (measurable success/failure)
- Independent (not dependent on completing a previous task)
- Written as a scenario, not an instruction: "You want to cancel your subscription" not "Click Settings, then Account, then Cancel"

**Define metrics per task**:
- Completion rate (binary or graded)
- Time on task
- Error count
- Path taken (for comparison with expected path)
- Post-task satisfaction (single question, 7-point scale)

**Recruit participants**: Screen for people who match your target persona's characteristics. 5 participants per round. Exclude: people who helped build the product, UX professionals (unless they are the target user), anyone who has participated in testing for this product in the last 6 months.

**Session length**: 45–60 minutes. Beyond 60 minutes, participant fatigue degrades data quality.

### Facilitating

The facilitator's job is to learn what the participant thinks and does — not to teach them the product.

**Before the session**:
- Explain the purpose: "We're testing the product, not you. There are no wrong answers."
- Get consent for recording
- Ask the participant to think aloud: "Please tell me what you're thinking as you work through each task"

**During the session**:
- Use neutral prompts: "What are you thinking?" "What do you expect to happen?" "What would you do next?"
- Never lead: ~~"Did you notice the button in the top right?"~~ → "What are you looking for?"
- Never rescue: When the participant is stuck, observe. Note the stuck point. Give them 30–60 seconds before offering a gentle redirect.
- Never defend: If they criticize the design, acknowledge and explore: "Tell me more about that."
- Note non-verbal signals: confusion (furrowed brow, hesitation), frustration (sighing, repeated clicking), success (relief, speed increase)

**After each task**:
- "On a scale of 1 to 7, how easy or difficult was that task?"
- "Was there anything that surprised you?"
- "What would you have expected to happen?"

**After the session**:
- "What was the most frustrating part of the experience?"
- "What, if anything, worked well?"
- "Is there anything else you'd like to share?"

### Analyzing Results

**Severity rating for each finding**:

| Severity | Definition | Action |
|---|---|---|
| Critical | Prevents task completion. Users cannot proceed. | Fix before launch. |
| Major | Causes significant difficulty or errors. Users complete the task but with frustration. | Fix before launch if possible. |
| Minor | Causes slight hesitation or confusion. Users recover quickly. | Fix in next iteration. |
| Cosmetic | Noticeable but does not affect task performance. | Fix when convenient. |

**Affinity diagramming**: Write each observation on a sticky note (or digital equivalent). Group related observations into clusters. Label clusters with theme names. Themes become findings.

**Pattern identification**: A finding requires evidence from multiple participants. One person's struggle is an anecdote. Three people struggling with the same thing is a pattern. Pattern threshold: observed in 3+ of 5 participants.

### Reporting

Every finding follows this format:

**"We observed** [what happened] **which caused** [impact on user] **so we recommend** [specific design change]."

Examples:
- "We observed that 4 of 5 participants could not find the 'Cancel Subscription' option, which caused them to give up or contact support, so we recommend moving it from Settings > Account > Billing to a prominent link on the Account overview page."
- "We observed that 3 of 5 participants misunderstood the 'Archive' button as 'Delete,' which caused them to avoid using it, so we recommend relabeling it to 'Move to Archive' and adding a brief description."

**Report structure**: Executive summary (top 3 findings) → Methodology → Findings by severity → Detailed observations per task → Recommendations → Raw data appendix.

### Guerrilla Testing

**Definition**: Fast, informal usability testing with 3–5 participants recruited on the spot — in a coffee shop, hallway, or office. Prioritizes speed over rigor.

**When to Use**: When you need fast feedback on early concepts. When formal testing is not yet justified. When you want to test a specific interaction, not the full experience.

**When NOT to Use**: When your product has a specialized audience (random people are not your users). When you need statistical validity. When the task requires domain knowledge.

**Protocol**: 3–5 people. 10–15 minutes each. 1–2 tasks maximum. "Can I get your quick feedback on something we're working on?" Show the design. Observe. Thank them. Buy them a coffee.

**Output**: Quick signal on major issues only. Not a substitute for proper usability testing — a complement.


## Research Synthesis

Raw research data is not useful until it's synthesized into actionable insights. Synthesis transforms observations into understanding and understanding into design direction.

### Affinity Mapping

**Process**:
1. Write individual observations on separate notes (one observation per note)
2. Spread all notes on a surface (physical wall or digital whiteboard)
3. Group notes that belong together — let the groups emerge; do not predefine categories
4. Label each group with a descriptive theme
5. Identify meta-groups (themes of themes) if the data is large
6. Prioritize themes by frequency and severity

**When to Use**: After interviews, usability testing, diary studies, or any qualitative data collection. When you have 50+ discrete observations to organize.

**When NOT to Use**: When the dataset is small enough to summarize directly (fewer than 20 observations). When the data is quantitative (use statistical analysis instead).

### Insight Statements

Transform themes into actionable insight statements. Format:

**"We observed** [pattern from research] **which means** [what this implies about users] **so we should** [design direction]."

Examples:
- "We observed that users check their dashboard 3–4 times a day but spend less than 30 seconds each time, which means they need information-dense, scannable summaries, so we should design for glanceable status rather than detailed exploration."
- "We observed that new users consistently ignore the onboarding tutorial, which means they prefer learning by doing, so we should replace the tutorial with contextual guidance embedded in the first tasks."

**Quality check**: A good insight statement is:
- Grounded in observed data (not assumption)
- Non-obvious (stating the obvious wastes everyone's time)
- Actionable (points toward a design direction)
- Specific (applies to a defined context, not everything)

### How-Might-We Questions

Transform insight statements into design opportunities. Format:

**"How might we** [design opportunity] **for** [user/context] **so that** [desired outcome]?"

Examples:
- "How might we surface blocked team members for managers so that they can unblock them before standup?"
- "How might we teach the product through use for new users so that they feel productive from minute one?"

**Rules**:
- Broad enough to inspire multiple solutions — not so broad that anything fits
- "How might we improve the experience" is too broad
- "How might we add a tooltip to the dashboard" is too narrow (that's a solution, not a question)
- "How might we help managers identify team blockers within 30 seconds" is the right scope

### Research-to-Design Bridge

Research findings must connect to design requirements. The bridge:

1. **Insight** → What we learned
2. **Design principle** → What rule this implies
3. **Requirement** → What the design must do
4. **Success metric** → How we'll measure if it works

Example:
- Insight: "Users check the dashboard 3–4 times daily for < 30 seconds"
- Design principle: "Dashboard is a glanceable status board, not an exploratory tool"
- Requirement: "Critical status visible without scrolling or clicking. No more than 3 seconds to answer 'Is anything wrong?'"
- Success metric: "80% of users can identify blocked items within 5 seconds"


## Metrics & Measurement

You cannot improve what you do not measure. But measuring the wrong things is worse than measuring nothing — it optimizes for the wrong outcomes.

### HEART Framework

Google's HEART framework provides five categories for user-centered metrics:

| Category | Definition | Example Signals | Example Metrics |
|---|---|---|---|
| **Happiness** | Satisfaction, perceived ease of use, NPS | Survey responses, SUS scores, NPS | SUS score > 80, NPS > 40 |
| **Engagement** | Frequency and depth of interaction | Session frequency, features used, content created | DAU/MAU ratio, actions per session |
| **Adoption** | New users successfully starting to use the product | Sign-ups, onboarding completion, first key action | Onboarding completion rate > 85% |
| **Retention** | Existing users continuing to use the product | Return rate, churn, renewal | 30-day retention > 60% |
| **Task success** | Ability to complete key tasks | Completion rate, time on task, error rate | Task completion > 95%, time < 2 min |

**How to use HEART**: Not every category matters for every feature. Select 1–3 categories relevant to the design goal. Define signals (user behaviors that indicate the metric). Define metrics (measurable values). Define targets (what "good" looks like).

### UX Key Performance Indicators

| KPI | What It Measures | Collection Method | Target Range |
|---|---|---|---|
| Task completion rate | Can users finish the task? | Usability testing, analytics | > 90% for primary tasks |
| Time on task | How long does it take? | Usability testing, analytics | Benchmark, then improve |
| Error rate | How often do users make mistakes? | Usability testing, analytics | < 5% for critical flows |
| Satisfaction score | How do users feel about it? | SUS, CSAT surveys | SUS > 68 (average), > 80 (excellent) |
| Learnability | How quickly do new users reach proficiency? | First-use testing, time-series analytics | Proficient within [N] sessions |

### Quantitative vs. Qualitative Measurement

| Aspect | Quantitative | Qualitative |
|---|---|---|
| Answers | How many? How often? How much? | Why? How? What's the experience like? |
| Strength | Statistical confidence, trend tracking, scale | Depth, context, nuance, discovery |
| Weakness | Cannot explain causation or motivation | Cannot be generalized to populations |
| Sample size | Large (30–1,000+) | Small (5–15) |
| Analysis | Statistical | Thematic |
| Bias risk | Sampling bias, question bias | Interviewer bias, selection bias |

**The combination principle**: Quantitative data tells you what is happening. Qualitative data tells you why. Use quantitative to identify problems at scale. Use qualitative to understand and solve them. Neither alone is sufficient.

### Statistical Significance for A/B Testing

- **p-value**: Probability that the observed difference occurred by chance. Standard threshold: p < 0.05 (less than 5% chance of a false positive).
- **Statistical power**: Probability of detecting a real effect. Standard target: 0.8 (80% chance of detecting a true difference).
- **Minimum sample size**: Depends on baseline conversion rate and minimum detectable effect. Lower baseline rates require larger samples. Smaller effects require larger samples.
- **Common mistakes**:
  - Stopping the test early when results look significant (peeking inflates false positive rate)
  - Running the test indefinitely until significance appears (p-hacking)
  - Testing too many variants simultaneously without adjusting for multiple comparisons
  - Ignoring practical significance — a statistically significant change of 0.01% is meaningless
- **Rule**: Set your sample size before starting. Run until you hit it. Interpret once. If the result is not significant, it means you need more data or the effect doesn't exist — not that you should keep testing.


## AI-Specific Research Guidance

As an AI designer, you operate under unique constraints. Understanding what you can and cannot do is essential for honest, effective design work.

### What You Can Do

- **Analyze stated requirements**: Extract user needs from project briefs, stakeholder descriptions, and existing documentation
- **Identify implicit needs**: Recognize unstated requirements based on patterns in established research
- **Reference research findings**: Apply published research, heuristics, and industry benchmarks to design decisions
- **Recommend research methods**: Prescribe the appropriate method from § Research Methods Catalog for a given design question
- **Design research plans**: Create complete research plans with objectives, methods, participant criteria, and task scripts
- **Synthesize provided data**: Analyze research data provided by the user — interview transcripts, survey results, analytics screenshots, usability test recordings
- **Apply established frameworks**: Use persona templates, journey maps, mental model diagrams, and synthesis techniques on provided data
- **Identify assumptions**: Flag which of your design decisions are grounded in evidence and which are assumptions requiring validation

### What You Cannot Do

- **Conduct interviews**: You cannot speak with real users, read their body language, or follow conversational threads in real time
- **Observe real behavior**: You cannot watch users interact with products, navigate physical environments, or perform tasks in context
- **Run A/B tests**: You cannot deploy design variants to real users and measure behavioral differences
- **Collect survey responses**: You cannot distribute questionnaires to a sample of real users
- **Access live analytics**: You cannot pull data from analytics platforms unless the user provides it
- **Validate your own assumptions**: You cannot test whether your design recommendations actually work for real users

### How to Compensate

**When you have no user research data**:
1. State explicitly: "No user research data is available. The following decisions are assumption-based and require validation."
2. Create proto-personas labeled as assumption-based (See § Proto-Personas vs. Research-Backed Personas)
3. Apply established heuristics and patterns as expert opinion (tier 3 in the evidence hierarchy)
4. Recommend specific research activities the team should conduct
5. Design for testability — structure the design so key assumptions can be validated quickly

**When you have some data**:
1. Identify what the data covers and what it does not
2. Ground as many decisions as possible in available evidence
3. Flag remaining assumptions explicitly
4. Prioritize validation by risk: which assumptions, if wrong, would cause the most damage?

**Available data sources you can analyze** (when provided by the user):
- Interview transcripts and notes
- Survey results and response data
- Analytics screenshots and reports
- App store reviews and ratings
- Support ticket themes and frequencies
- Social media feedback
- Competitor product screenshots and reviews
- Previous research reports

### When to Say "This Needs User Research"

Say it when:
- The design decision hinges on understanding user behavior that has not been observed
- The target users have specialized domain knowledge you cannot simulate
- Stakeholder opinions conflict about user needs and no data resolves the disagreement
- The product is entering a new market or serving a new user segment with no existing data
- The cost of being wrong is high (financial, safety, trust)

Do not say it when:
- Established heuristics and patterns provide sufficient guidance for the decision
- The change is minor and low-risk
- The question can be answered by analyzing existing data the user has provided

Format: "This decision requires user research. Specifically, I recommend [method] with [participant criteria] to answer [specific question]. Without this research, the following assumptions remain untested: [list]."


## Research Checklists

### Pre-Design Research Checklist

Before starting any design work, verify:

- [ ] **Problem statement defined**: Can you state the problem in one sentence?
- [ ] **Target users identified**: Who are you designing for? Based on evidence or assumption?
- [ ] **User goals documented**: What do users want to accomplish? Source: research or assumption?
- [ ] **Pain points cataloged**: What current frustrations exist? Source: research, analytics, support data, or assumption?
- [ ] **Mental models explored**: How do users think about this problem domain? (See ai-designer-psychology.md § Mental Models)
- [ ] **Competitive landscape reviewed**: How do 3–5 competitors solve this problem?
- [ ] **Existing data inventoried**: What research, analytics, support data, and reviews already exist?
- [ ] **Assumptions labeled**: Which of the above are evidence-based and which need validation?
- [ ] **Research plan created**: What methods will fill the gaps? (See § Research Methods Catalog)

### Mid-Design Validation Checklist

During design, regularly verify:

- [ ] **Key decisions evidence-grounded**: Are the major design decisions supported by research or heuristics?
- [ ] **Assumptions tracked**: Have new assumptions emerged during design? Are they labeled?
- [ ] **Usability testing planned or conducted**: Has the design been tested with representative users?
- [ ] **Task flows validated**: Can users complete primary tasks without errors or confusion?
- [ ] **Persona alignment checked**: Does the design serve the primary persona's goals and mental model?
- [ ] **Stakeholder feedback incorporated**: Has input from stakeholders been filtered through user evidence?

### Post-Launch Measurement Checklist

After release, establish:

- [ ] **Success metrics baselined**: Are the metrics from Phase 1 being tracked?
- [ ] **Task completion rates measured**: Can users complete key tasks? At what rate?
- [ ] **Satisfaction measured**: Have SUS, CSAT, or NPS scores been collected?
- [ ] **Engagement tracked**: Are users adopting and returning to the feature?
- [ ] **Error rates monitored**: Where are users encountering errors?
- [ ] **Feedback channels active**: Are support tickets, reviews, and direct feedback being collected and analyzed?
- [ ] **Iteration planned**: Based on post-launch data, what needs to change?


## Book Source Appendix

This Skill synthesizes knowledge from the following primary sources. Sections reference specific books where applicable. The table maps major topics to their primary references.

| Topic | Primary Source(s) |
|---|---|
| Research mindset, empathy | Practical Empathy (Indi Young), Just Enough Research (Erika Hall) |
| User interviews | Interviewing Users (Steve Portigal) |
| Contextual inquiry, observation | Observing the User Experience (Goodman, Kuniavsky, Moed) |
| Survey design | Just Enough Research (Hall), Measuring the User Experience (Tullis & Albert) |
| Usability testing | Rocket Surgery Made Easy (Steve Krug), Measuring the User Experience (Tullis & Albert) |
| Mental models, mental model diagrams | Mental Models (Indi Young) |
| Journey mapping, service blueprints | Mapping Experiences (Jim Kalbach) |
| Personas, JTBD | About Face (Alan Cooper), The Jobs to Be Done Playbook (Jim Kalbach) |
| UX metrics, SUS, statistical methods | Measuring the User Experience (Tullis & Albert), Quantifying the User Experience (Jeff Sauro) |
| Analytics, lean measurement | Lean Analytics (Alistair Croll & Benjamin Yoskovitz) |
| HEART framework | How Google Does It (Kerry Rodden, Hilary Hutchinson, Xin Fu) |
| Heuristic evaluation | Usability Engineering (Jakob Nielsen), Usability Inspection Methods (Nielsen & Mack) |
| Research synthesis, storytelling | Storytelling for User Experience (Whitney Quesenbery & Kevin Brooks) |
| Cognitive and behavioral insights | 100 Things Every Designer Needs to Know About People (Susan Weinschenk) |

Knowledge from these sources is integrated by theme throughout the Skill, not presented as book-by-book summaries. Where a specific framework or method originates from a particular source, it is attributed inline.
