---
name: software-architect-antipatterns
description: Anti-pattern catalog for the Software Architect suite. Catalogs AI-specific architecture mistakes (resume-driven architecture, pattern salad, Netflix cargo cult, technology name-dropping, premature distribution, solution-first architecture, missing trade-off acknowledgment, greenfield assumption, symmetry bias, over-documentation), classic architecture anti-patterns (big ball of mud, distributed monolith, sinkhole architecture, golden hammer, architecture astronaut, lava flow, vendor lock-in), data architecture anti-patterns, operational anti-patterns, and process anti-patterns. Load as a companion to all other software-architect Skills to audit architecture decisions for common mistakes.
---

# Anti-Pattern Library

## How to Use This Skill

This is a reference library, not a sequential read. Use it as a diagnostic tool to audit your architecture decisions before they become production problems.

### Usage Protocol

1. After producing any architecture artifact (ADR, System Design Document, Trade-Off Analysis, component decomposition), scan the relevant anti-pattern categories below.
2. Each anti-pattern follows this format:
   - **Name** — What the mistake is
   - **Description** — What it looks like in practice and why it's damaging
   - **Why It Happens** — The root cause (so you can prevent recurrence)
   - **What To Do Instead** — The concrete fix, not just the diagnosis
   - **Detection** — A yes/no question that identifies the pattern in your work
   - **Severity** — Critical (must fix), High (should fix), Medium (consider), Low (awareness)
3. If you find yourself matching an anti-pattern, stop and fix it before proceeding to implementation. An anti-pattern caught in design costs hours to fix. Caught in production, it costs weeks.
4. The detection checklist at the end (See § Anti-Pattern Detection Checklist) provides a rapid-scan summary organized by priority. Use it as your final gate before delivering any architecture artifact.

### Severity Levels

- **Critical**: Decisions that guarantee system failure at scale. Distributed monolith, shared database across services, missing trade-off analysis. These are not judgment calls — they are structural errors that will cause outages, data corruption, or impossible migrations.
- **High**: Mistakes that are common, damaging, and hard to reverse. Resume-driven architecture, pattern salad, technology name-dropping, premature distribution. AI architects are particularly prone to these.
- **Medium**: Patterns that degrade architecture quality over time. Over-documentation, symmetry bias, greenfield assumption. Fix them, but if you have a documented rationale for the trade-off, proceed with caution.
- **Low**: Awareness-level items. These are worth knowing about but rarely the biggest problem. Flag them and move on.

---

## AI-Specific Architecture Anti-Patterns

These are patterns that AI architects are disproportionately prone to. They stem from how AI models are trained, how they process requirements, and how they generate recommendations. This section is your highest-priority audit target. If you catch nothing else, catch these.

### Resume-Driven Architecture

**Description**: Recommending microservices, event sourcing, Kubernetes, Kafka, and service meshes for every problem because those technologies are prominent in conference talks, blog posts, and job descriptions. The architecture is optimized for the architect's career growth, not the system's needs. A 3-person startup gets a microservices recommendation. A simple CRUD app gets CQRS and event sourcing.

**Why It Happens**: AI training data is disproportionately sourced from conference talks, engineering blogs, and documentation for sophisticated technologies. These sources describe solutions at FAANG scale because that's what gets written about. Nobody writes blog posts about their boring monolithic CRUD app that works perfectly. The AI learns that "good architecture" equals "architecture that uses advanced technologies."

**What To Do Instead**: Start every architecture recommendation by stating the scale context. (See software-architect-core.md § Scale Context Framework) Map every technology choice to a concrete problem it solves at the current scale. If you can't name the specific problem a technology solves for this system, don't recommend it. Rule of thumb: the complexity of the solution must not exceed the complexity of the problem.

**Detection**: "Does the solution complexity exceed the problem complexity? Would a simpler architecture using fewer technologies solve the same requirements?"

**Severity**: High

---

### Pattern Salad

**Description**: Listing 5 or more applicable patterns without helping the reader choose among them. "You could use CQRS, Event Sourcing, Saga, Outbox, or Two-Phase Commit" — presented as a menu of options with no decision framework. The reader is left with a list of names and no way to decide. This is worse than recommending the wrong pattern — it's recommending nothing while appearing to recommend everything.

**Why It Happens**: AI models are pattern-matching engines. Given a problem, they retrieve all patterns associated with that problem domain and present them exhaustively. The AI can enumerate patterns but cannot weigh trade-offs because trade-offs require understanding of the specific context, team, and scale that the prompt may not include. Enumeration feels like thoroughness. It's actually abdication.

**What To Do Instead**: For any architectural decision, recommend exactly one approach with rationale. If multiple approaches are genuinely viable, present them with a decision framework: "Choose X when A and B are true. Choose Y when C and D are true." If you cannot articulate the conditions that favor one over the other, you don't understand the trade-offs well enough to recommend either. (See software-architect-core.md § Trade-Off Analysis Methodology)

**Detection**: "Do my recommendations read as 'you could do X or Y or Z' without a clear decision framework? Can the reader determine which option to choose without additional research?"

**Severity**: High

---

### Netflix Cargo Cult

**Description**: Recommending solutions designed for Netflix, Google, or Amazon scale for organizations that will never reach that scale. Recommending multi-region active-active deployment for a B2B SaaS with 500 customers. Recommending Cassandra because Netflix uses it, when PostgreSQL would handle the workload with a fraction of the operational complexity. The architecture solves problems the organization doesn't have, at a cost the organization can't afford.

**Why It Happens**: AI training data contains extensive documentation of FAANG architectures. These are well-documented, well-justified solutions to real problems at extreme scale. The AI learns these patterns as "correct architecture" and applies them without the scale calibration that a human architect would instinctively perform. The AI doesn't know that your user said "10-person startup" unless you explicitly constrain it.

**What To Do Instead**: Always qualify recommendations with scale context. (See software-architect-core.md § Scale Context Framework) Before recommending any pattern or technology, ask: "What is the minimum scale at which this solution becomes cost-effective?" If the current system is below that threshold, the solution is premature. Default to the simplest architecture that meets requirements at the current scale tier, with a documented path to the next tier when needed.

**Detection**: "Have I considered the current scale context? Would a simpler solution work at the actual number of users, requests, and engineers this system will have?"

**Severity**: High

---

### Technology Name-Dropping

**Description**: Mentioning Kafka, Redis, Elasticsearch, Cassandra, or Kubernetes without explaining why this specific technology is better than alternatives for this specific context. The technology name is used as shorthand for a capability — "use Kafka for messaging" without explaining whether the system needs Kafka's durability guarantees, its throughput profile, or its ecosystem. The recommendation assumes the technology name carries its own justification.

**Why It Happens**: AI models associate problem keywords with technology keywords. "Asynchronous messaging" triggers "Kafka." "Caching" triggers "Redis." "Search" triggers "Elasticsearch." These associations are statistically correct (these are common choices) but architecturally lazy. The AI defaults to the most popular solution without analyzing whether it's the right solution.

**What To Do Instead**: For every technology recommendation, state: (1) what specific capability of this technology makes it the right choice, (2) what alternative was considered and why it was rejected, (3) what operational cost this technology introduces. If you can't articulate all three, you're name-dropping, not architecting.

**Detection**: "For every technology I recommend, can I explain why it's better than the next-best alternative for this specific context? Can I articulate what we're giving up by choosing it?"

**Severity**: High

---

### Abstract Theory Without Grounding

**Description**: Invoking principles without showing what they mean at the module, service, and system levels. "Apply Separation of Concerns" without decomposing what concerns exist and where the boundaries should be drawn. "Apply Single Responsibility" without defining what a responsibility is at the scale of a service versus a class. The principles are correct but the application is absent, leaving the reader with slogans instead of architecture.

**Why It Happens**: AI models have been trained on software engineering literature that discusses principles extensively. The model can recite the definition of every principle but struggles to apply them contextually because application requires understanding the specific system being designed. Principles are easy to state. Grounded application requires design work.

**What To Do Instead**: Every principle invocation must be followed by a concrete application: what it means for this system specifically, where the boundary goes, what changes as a result. If you say "apply Separation of Concerns," show the concern decomposition. If you say "design for failure," show the specific failure modes and the specific mitigation for each. (See software-architect-core.md § Principle Ownership Map for principle definitions)

**Detection**: "For every principle I invoke, have I shown a concrete, system-specific application of it? Or did I just name the principle and move on?"

**Severity**: Medium

---

### Ignoring Organizational Constraints

**Description**: Recommending architectures that require skills, team structures, or operational capabilities the organization doesn't have. Microservices for a team of 3 developers who have never operated Kubernetes. Event-driven architecture for an organization with no message broker experience and no SRE team. The architecture is technically sound but organizationally impossible, which makes it practically useless.

**Why It Happens**: AI processes technical requirements but not organizational context unless explicitly provided. The AI doesn't know the team size, skill distribution, or operational maturity unless you tell it. It produces the technically optimal architecture for the requirements as stated, ignoring that the organization can't implement or operate it.

**What To Do Instead**: Before recommending any architecture, assess: (1) team size and skill distribution, (2) operational maturity (do they have on-call? incident response? CI/CD?), (3) organizational structure (Conway's Law). (See software-architect-organization.md § Conway's Law) The right architecture is the best one the team can build and operate, not the best one in the abstract.

**Detection**: "Does the team have the skills and headcount to implement and operate this architecture? Have I considered what they can actually deliver?"

**Severity**: High

---

### Premature Distribution

**Description**: Breaking a monolith into services before understanding domain boundaries, before the team has operational maturity, and before distribution is justified by scale. Services are split along technical layers (frontend service, backend service, database service) rather than business capabilities. The result is not a microservice architecture — it's a distributed monolith with all the costs of distribution and none of the benefits.

**Why It Happens**: AI models see "microservices" as the default modern architecture. The pattern is so prevalent in training data that the AI may not consider a monolith as a valid starting point. Distribution feels like progress. It's actually premature optimization of the system structure.

**What To Do Instead**: Start with a well-structured modular monolith. Extract services only when you have a clear, measurable reason: independent scaling needs, team autonomy requirements, fault isolation requirements, or different technology needs for different components. Before extracting any service, verify that the domain boundary is stable. A service extracted along the wrong boundary is worse than no service at all. (See software-architect-core.md § Scale Evolution Path)

**Detection**: "Do the service boundaries align with business capabilities? Is there a concrete, measurable problem that distribution solves that a monolith cannot? Can I articulate three specific problems distribution solves for this system?"

**Severity**: Critical

---

### Solution-First Architecture

**Description**: Jumping to technology choices before understanding the requirements. "Let's use GraphQL and a service mesh" before defining what the system does, who uses it, or what constraints it operates under. The architecture is built from technology preferences downward, rather than from requirements upward. The solution shapes the problem instead of the problem shaping the solution.

**Why It Happens**: AI models are trained to be helpful and produce output quickly. Given a vague prompt, the AI fills in the gaps with plausible architecture choices rather than asking clarifying questions. Producing a solution feels more productive than asking questions. But the questions are the architecture work.

**What To Do Instead**: Follow the Architecture Workflow in order. (See software-architect-core.md § Architecture Workflow) Phase 1 (Understand) comes before Phase 3 (Design) for a reason. Before recommending any technology, document: what the system does, for whom, at what scale, under what constraints, and what the architecturally significant requirements are. Technology choices come last, not first.

**Detection**: "Did I recommend technologies before defining requirements? Did I ask clarifying questions before proposing solutions?"

**Severity**: High

---

### Over-Documentation

**Description**: Producing 50-page architecture documents with exhaustive descriptions of every component, every data flow, every edge case, every alternative considered. The document is comprehensive but unreadable. Nobody reads it. The architecture exists in the document but not in the team's understanding. The document is a tombstone for decisions, not a living reference.

**Why It Happens**: AI models are exhaustive by default. Given a prompt to "document the architecture," the AI will document everything — because it doesn't know what's important and what isn't. It cannot judge what the reader needs versus what the writer can include. More documentation feels like more thoroughness.

**What To Do Instead**: Documentation must match its audience and purpose. ADRs are for individual decisions — 1-2 pages each. System Design Documents provide the holistic view — 10-15 pages for most systems. (See software-architect-core.md § Architecture Output Templates) If a section doesn't help the reader make a decision or understand the system, cut it. A 10-page document that gets read is worth more than a 50-page document that doesn't.

**Detection**: "Is this document longer than its audience will read? Can a new team member understand the architecture in under 30 minutes from this document?"

**Severity**: Medium

---

### Symmetry Bias

**Description**: Making all services the same size, applying the same patterns everywhere, using the same communication style for every interaction. Every service gets its own database. Every interaction is asynchronous. Every component has the same deployment model. The architecture treats non-uniform components as if they were uniform, erasing the differences that justified separating them in the first place.

**Why It Happens**: AI models favor consistency and pattern-matching. If one service uses a pattern, the AI tends to apply the same pattern to all services because that's the statistically safe choice. Uniformity is easier to generate and easier to explain. But systems are not uniform, and architectures that pretend they are create friction.

**What To Do Instead**: Treat each component according to its actual requirements, not according to a uniform template. Some services need relational databases. Others need document stores. Some interactions should be synchronous. Others should be asynchronous. The architecture should reflect the diversity of the problem domain, not impose artificial uniformity. Consistency is a tool, not a goal. (See software-architect-core.md § Simplicity First)

**Detection**: "Am I applying the same pattern to every component without justification? Would different patterns better serve different components' actual requirements?"

**Severity**: Medium

---

### Missing Trade-Off Acknowledgment

**Description**: Recommending a solution without stating what you're giving up. "Use event sourcing for the order service" — without mentioning that event sourcing introduces eventual consistency, requires event schema evolution, and makes simple queries harder. The recommendation presents one side of the trade-off as if the other side doesn't exist. This is architecture malpractice. Every decision has a cost, and failing to acknowledge it means the decision wasn't actually analyzed.

**Why It Happens**: AI models are optimized to produce confident, helpful-sounding recommendations. Stating the downside of a recommendation feels like undermining it. But in architecture, stating the downside is the most important part — it's how you know the architect actually evaluated the decision rather than just pattern-matched a solution.

**What To Do Instead**: Every recommendation must include "The downside is..." or "What we give up by choosing this..." If you cannot articulate the trade-off, you haven't completed the analysis. (See software-architect-core.md § Trade-Off Analysis Methodology) A recommendation without trade-off acknowledgment is not a recommendation — it's a guess dressed up as architecture.

**Detection**: "For every recommendation I make, have I explicitly stated what we're sacrificing? Does the reader know the cost of this decision?"

**Severity**: Critical

---

### Greenfield Assumption

**Description**: Always recommending from scratch, ignoring existing systems, data, integrations, and migration constraints. "Rewrite the monolith as microservices" without a migration strategy. "Replace the legacy database" without a data migration plan. The architecture assumes a blank slate when every real system is constrained by what already exists. Greenfield thinking produces architectures that can never be implemented because they ignore the starting point.

**Why It Happens**: AI models default to greenfield design because it's cleaner and easier. Given no explicit instruction about existing systems, the AI assumes none exist. Greenfield architecture is also more satisfying to produce — it's a complete, coherent vision unconstrained by legacy. But real architecture is always evolution, never creation.

**What To Do Instead**: Every architecture must include a migration strategy: how do we get from the current state to the target state without a big-bang rewrite? (See software-architect-core.md § Phase 6: Evolve) Use the strangler fig pattern as the default migration approach — incrementally replace parts of the old system while both systems coexist. Document the current state before designing the target state.

**Detection**: "Have I described the current system state? Is there a migration path from current to target? Did I assume we can start over?"

**Severity**: Medium

---

## Classic Architecture Anti-Patterns

These are well-documented architectural mistakes that have been recognized for decades. They persist because the forces that create them — time pressure, organizational dynamics, and technical debt accumulation — are universal.

### Big Ball of Mud

**Description**: A system with no discernible architecture. Every module depends on every other module. There are no clear interfaces, no separation of concerns, no consistent patterns. Changes in one part of the system cause unpredictable failures in unrelated parts. The system grows by accretion — new features are bolted on wherever they fit rather than where they belong. This is not an architecture. This is the absence of architecture.

**Why It Happens**: Big balls of mud are never designed. They accumulate. They happen when: (1) the system grows without architectural guidance, (2) deadlines consistently override quality concerns, (3) there is no shared understanding of the system's structure, (4) code reviews don't enforce architectural boundaries, (5) the original architecture was never documented, so each new feature erodes it further.

**What To Do Instead**: Define and enforce architectural boundaries. Use dependency rules: high-level modules don't depend on low-level modules. Both depend on abstractions. Establish a shared understanding of the system structure through C4 diagrams and ADRs. (See software-architect-core.md § C4 Model) If you're already in a big ball of mud, don't rewrite it. Incrementally extract modules along natural seams, one bounded context at a time.

**Detection**: "Can I draw the system's module dependencies on a whiteboard without crossing lines everywhere? Can a new developer understand the system's structure in a week?"

**Severity**: Critical

---

### Distributed Monolith

**Description**: A system that has been split into services but behaves like a monolith. Services are tightly coupled: they share a database, they communicate through synchronous call chains that require all services to be available for any request to succeed, and they must be deployed together because changes in one service require coordinated changes in others. The system has all the costs of distribution (network latency, partial failure modes, operational complexity) and none of the benefits (independent deployability, fault isolation, team autonomy).

**Why It Happens**: Organizations split a monolith into services along technical layers rather than business capabilities. They keep the shared database because splitting it is hard. They use synchronous HTTP calls because asynchronous messaging is unfamiliar. The result looks like microservices on a diagram but behaves like a distributed disaster in production. This is the most common architectural failure mode in organizations attempting microservices.

**What To Do Instead**: Before distributing, identify stable domain boundaries. (See software-architect-ddd.md § Bounded Context) Each service owns its data — no shared databases. Communication between services is asynchronous wherever possible. Each service must be independently deployable. If you can't deploy a service without deploying others, it's not a service — it's a module of a distributed monolith. Either merge the services back into a monolith or fix the boundaries.

**Detection**: "Can I deploy any service independently without deploying others? Does any service directly access another service's database? Does a request require all services to be up to succeed?"

**Severity**: Critical

---

### Sinkhole Architecture

**Description**: Requests pass through multiple architectural layers where each layer adds no value — it simply forwards the request to the next layer with minimal or no transformation. A request goes through Controller → Service → Repository → Database where the Service layer is a one-line pass-through and the Repository layer adds no abstraction. The layers exist because the pattern says they should, not because they solve a problem. This is ceremony masquerading as architecture.

**Why It Happens**: Layered architecture is taught as a universal best practice without teaching when layers add value versus when they add indirection. Architects add layers defensively — "we might need this abstraction later." Each layer feels like good practice individually. The cumulative effect is a system where most code exists to route requests between layers rather than to implement business logic.

**What To Do Instead**: Every architectural layer must have a demonstrable purpose. Ask: "If I remove this layer, does the system lose a capability?" If the answer is no, the layer is ceremony. In a well-designed layered architecture, each layer transforms the request in a meaningful way (validation, authorization, business logic, data access). If a layer only delegates, it shouldn't exist.

**Detection**: "Does each layer transform the request in a meaningful way? Are there layers that exist only to call the next layer?"

**Severity**: Medium

---

### Golden Hammer

**Description**: Using one technology, pattern, or approach for every problem because it's what the team knows. Microservices for everything. MongoDB for every data model. Kubernetes for every deployment regardless of complexity. Event sourcing for every domain regardless of whether the domain benefits from it. When all you have is a hammer, every problem looks like a nail — and the architecture is full of nails that should have been screws.

**Why It Happens**: Teams (and AI models) develop expertise in specific technologies and patterns. Using what you know is efficient in the short term. But different problems have different shapes, and forcing every problem into the same shape creates friction. The golden hammer is especially dangerous in organizations that have invested heavily in a particular technology stack — the sunk cost makes it hard to acknowledge when a different tool would be better.

**What To Do Instead**: Choose the right tool for each problem. This doesn't mean using every technology — that's the polyglot persistence overkill anti-pattern. (See § Polyglot Persistence Overkill) It means being willing to use different approaches when the problem demands it. The question is not "how do I solve this with our standard stack?" It's "what is the best solution for this problem, and is the benefit of using a non-standard approach worth the cost of introducing a new technology?"

**Detection**: "Am I recommending the same technology/pattern for every component because it's the right fit, or because it's what I'm comfortable with? Have I considered alternatives?"

**Severity**: Medium

---

### Architecture Astronaut

**Description**: Over-abstracting and over-engineering for flexibility that will never be needed. Building a plugin system for 3 known use cases. Designing a generic workflow engine for 2 workflows. Creating an abstraction layer "so we can swap databases later" when there's no plan to ever swap databases. The architecture solves hypothetical future problems at the cost of real present complexity. The system is flexible in theory and unusable in practice.

**Why It Happens**: Abstraction feels like good architecture. It's intellectually satisfying to build systems that can handle any future requirement. But abstraction has a cost: every layer of indirection makes the system harder to understand, debug, and modify. Architecture astronauts optimize for flexibility at the expense of simplicity, forgetting that simplicity is itself a quality attribute.

**What To Do Instead**: Design for the requirements you have, not the requirements you imagine. Abstractions should be extracted, not invented. Wait until you have at least 3 concrete use cases before creating an abstraction. Before adding any abstraction, ask: "What concrete problem does this solve today, not someday?" (See software-architect-core.md § Simplicity First)

**Detection**: "Am I solving problems that don't exist yet? Does this abstraction have at least 3 concrete use cases today? Would the system be simpler and just as functional without it?"

**Severity**: Medium

---

### Lava Flow

**Description**: Dead code, unused services, obsolete data schemas, and deprecated patterns that nobody dares remove because nobody fully understands the system. The architecture is a geological record: each layer represents a different era of the system's history, with older layers still present underneath newer ones. The system carries the weight of every architectural decision ever made, including the ones that were wrong.

**Why It Happens**: Lava flows accumulate when: (1) there are no tests that verify what code is actually used, (2) removing code is riskier than leaving it, (3) knowledge of the system's internals has left with departed engineers, (4) there's no process for deprecation and removal. Each piece of dead code seems harmless individually. Collectively, it's a maintenance tax on every future change.

**What To Do Instead**: Establish a culture of removal. When deprecating a feature or pattern, schedule its removal. Use observability to verify what's actually being used in production. When a team member leaves, document what they knew about the system. Run regular architecture reviews that identify and schedule removal of dead components. Every system should have less code this year than last year, not more.

**Detection**: "Are there parts of the system that nobody understands? Are there services or code paths that might be unused but nobody is willing to remove?"

**Severity**: Medium

---

### Vendor Lock-In

**Description**: Designing the architecture around a single vendor's products with no abstraction layer, making migration to alternatives prohibitively expensive. The system uses AWS Lambda with AWS-specific triggers, AWS-specific IAM policies, and AWS-specific deployment tools. Switching to another cloud provider would require rewriting every integration point. The architecture is not just hosted on a vendor's platform — it's married to it.

**Why It Happens**: Vendor-specific features are convenient. They solve problems quickly. Building abstraction layers around them feels like unnecessary work when you have no plans to switch vendors. But plans change. Acquisitions happen. Pricing models change. Vendors deprecate products. The architecture that was convenient at build time becomes a liability at year 5.

**What To Do Instead**: Use vendor services where they provide clear value, but wrap them behind your own interfaces. If you use a cloud queue service, abstract it behind a `MessageQueue` interface. If you use a cloud database, use standard protocols (PostgreSQL wire protocol) rather than proprietary APIs. The abstraction layer doesn't need to be perfect — it just needs to make migration possible without a rewrite.

**Detection**: "Could we switch cloud providers or database vendors without rewriting the application? Are vendor-specific APIs exposed throughout the system, or are they isolated behind interfaces?"

**Severity**: Medium

---

## Data Architecture Anti-Patterns

Data architecture mistakes are among the most expensive to fix. They compound over time as data accumulates. A wrong database choice or a broken data model is not a refactoring problem — it's a migration problem that affects every downstream consumer.

### Shared Database

**Description**: Multiple services reading from and writing to the same database. Service A updates the `users` table directly. Service B reads from the `orders` table that Service C wrote to. There are no clear data ownership boundaries. Any service can modify any table. Schema changes require coordination across all services because a change that helps Service A might break Service B's queries. This is the single most damaging data architecture anti-pattern.

**Why It Happens**: Sharing a database is easy. It avoids the complexity of data synchronization, API design, and eventual consistency. At small scale, it works. But as the system grows, the shared database becomes a coupling point that prevents independent evolution of services. Every schema change becomes a cross-team negotiation. Performance problems in one service's queries affect all other services.

**What To Do Instead**: Each service owns its data exclusively. No service accesses another service's database directly. Services communicate through APIs (for synchronous reads) or events (for asynchronous updates). (See software-architect-distributed.md § Data Ownership) If multiple services need the same data, one service owns it and exposes it through a well-defined API. Data duplication across services is acceptable when managed through events — it's the price of autonomy.

**Detection**: "Does more than one service read from or write to the same database or schema? Does a schema change in one service risk breaking another service?"

**Severity**: Critical

---

### Distributed Transaction Abuse

**Description**: Using two-phase commit (2PC) or distributed transactions to maintain consistency across services. A single business operation spans multiple services, and the system uses a distributed transaction coordinator to ensure all-or-nothing semantics. This creates tight coupling between services, introduces a single point of failure (the coordinator), and performs poorly at scale because all participants must hold locks until the transaction completes.

**Why It Happens**: Developers with relational database backgrounds apply ACID transaction patterns to distributed systems. Two-phase commit is the standard solution in the database world, so it feels natural to extend it across services. But distributed transactions violate the fundamental principle of distributed systems: services should be autonomous. A transaction that spans services means no service can complete its work independently.

**What To Do Instead**: Use the Saga pattern for long-running business transactions that span services. (See software-architect-distributed.md § Saga Pattern) Each service performs its local transaction and publishes an event. If a subsequent step fails, compensating transactions undo the previous steps. This preserves service autonomy at the cost of eventual consistency. Accept that distributed systems cannot have the same consistency guarantees as monolithic databases.

**Detection**: "Does a single business operation require transactional consistency across multiple services? Am I using distributed transactions where sagas or eventual consistency would be more appropriate?"

**Severity**: Critical

---

### Cache as Source of Truth

**Description**: Treating the cache as the primary data store rather than a performance optimization. The application writes to the cache first and the database eventually. Cache misses are treated as data loss. Cache eviction policies determine what data is available. The system's correctness depends on cache behavior, which is inherently unreliable. This is a data integrity time bomb.

**Why It Happens**: Caches are fast. Writing to a cache and reading from it feels like a performance win. The database becomes an afterthought — a persistence layer that's rarely read from. Over time, the cache accumulates business logic (what data to cache, how to invalidate, how to handle misses) that should be in the application layer. The cache stops being an optimization and starts being the system.

**What To Do Instead**: The database is the source of truth. The cache is a read-through performance optimization. Every write goes to the database first. The cache is populated from the database on read. If the cache is lost, the system continues to function correctly (slower, but correctly). Cache invalidation is the application's responsibility, not the infrastructure's. (See software-architect-data.md § Caching Architecture)

**Detection**: "If I delete the entire cache, does the system still function correctly? Do writes go to the database first, or to the cache first? Is any data only available in the cache?"

**Severity**: Critical

---

### Schema on Read Everywhere

**Description**: Applying "schema on read" to every data source without governance, creating a data swamp instead of a data lake. Every team dumps raw data with no schema, no documentation, and no quality guarantees. Consumers must reverse-engineer the schema from the data, which is unreliable and inconsistent. Different consumers interpret the same data differently. The system has data but not information.

**Why It Happens**: Schema on read is liberating in the short term. Teams can ingest data without upfront modeling. They don't need to agree on schemas or coordinate with other teams. But without governance, the data becomes increasingly inconsistent and unreliable. The cost shifts from producers (who save time by not defining schemas) to consumers (who waste time reverse-engineering meaning from raw data).

**What To Do Instead**: Use a layered approach. Raw data can be schema-on-read for exploratory use cases. But curated datasets that serve multiple consumers need explicit schemas, documentation, and quality guarantees. (See software-architect-data.md § Data Modeling Fundamentals) Define a data contract between producers and consumers. The producer guarantees the schema. The consumer trusts the schema.

**Detection**: "Do data consumers have to reverse-engineer the meaning of data? Are there inconsistent interpretations of the same data across different consumers?"

**Severity**: High

---

### Polyglot Persistence Overkill

**Description**: Using 5 different database technologies when 2 would suffice. A relational database for users, a document store for profiles, a graph database for relationships, a time-series database for metrics, a key-value store for sessions — each chosen because it's "the right tool for the job." The system has 5 operational burdens, 5 query languages to learn, 5 backup strategies to maintain, and 5 failure modes to debug. The specialization benefit is outweighed by the operational complexity cost.

**Why It Happens**: The polyglot persistence principle says "use the right database for each workload." This is correct in principle but dangerous in practice. Each additional database adds operational complexity: deployment, monitoring, backup, failover, schema management, query optimization, and developer expertise. At small to medium scale, the benefit of a specialized database rarely exceeds the cost of adding another technology to the stack.

**What To Do Instead**: Default to one general-purpose database (PostgreSQL) that handles relational, document, key-value, and even time-series workloads adequately. Add a specialized database only when you have concrete evidence that the general-purpose database cannot meet your requirements. Evidence means measurements, not assumptions. The burden of proof is on the specialized database, not on the general-purpose one.

**Detection**: "How many distinct database technologies does this architecture use? For each one, do I have measurements showing the general-purpose database can't meet the requirements?"

**Severity**: High

---

## Operational Anti-Patterns

An architecture that can't be operated is not an architecture — it's a prototype. Operational anti-patterns turn elegant designs into production nightmares.

### Snowflake Servers

**Description**: Each server is unique — manually configured, hand-tuned, and irreproducible. The production environment was set up by an engineer who left 18 months ago. Nobody knows exactly what's installed, what's configured, or why certain settings exist. Rebuilding a server from scratch would take days of detective work. The system runs on accumulated tribal knowledge rather than documented, version-controlled infrastructure.

**Why It Happens**: Manual configuration is faster in the moment than automation. An engineer SSHes into a server, tweaks a setting, and the problem is solved. Documenting the change and encoding it in infrastructure-as-code takes longer. Over months and years, these manual tweaks accumulate until the server is a unique artifact that cannot be reproduced.

**What To Do Instead**: Infrastructure as Code (IaC) for everything. Every server configuration, every network rule, every deployment step is defined in version-controlled configuration. (See software-architect-infrastructure.md § Infrastructure as Code) Servers are cattle, not pets. If a server misbehaves, you terminate it and a new one is provisioned automatically from the IaC definition. No manual SSH. No undocumented tweaks.

**Detection**: "Can I rebuild the entire production environment from version control without manual steps? If a server dies, does a new one come up automatically with the correct configuration?"

**Severity**: Critical

---

### Alert Fatigue

**Description**: Too many alerts, too many false positives, too many low-severity notifications. The monitoring system fires 200 alerts per day. 195 are false alarms. The 5 real incidents are buried in noise. The on-call engineer learns to ignore alerts because 97.5% of them don't matter. When a real incident occurs, it's missed because the alert was dismissed along with the noise. The monitoring system has made the system less reliable, not more.

**Why It Happens**: Alerts are easy to create and hard to remove. Every team adds alerts for their service. Nobody reviews the aggregate alert volume. Alert thresholds are set conservatively — "better to alert and be wrong than to miss something." But each false alert trains the responder to ignore alerts. The cumulative effect is an alerting system that nobody trusts.

**What To Do Instead**: Alert on symptoms, not causes. "The API is returning errors at >1% for 5 minutes" is a symptom. "CPU is at 80%" is a cause. Alert on SLOs, not thresholds. Every alert must require a human response. If an alert fires and the correct response is "acknowledge and go back to sleep," it should not be an alert. Review alert volume weekly. Remove or tune any alert that fired without requiring action.

**Detection**: "How many alerts fire per day? What percentage require a human response? Do on-call engineers trust the alerting system, or do they ignore it?"

**Severity**: Critical

---

### Hero Culture

**Description**: Relying on one person who "knows the system." When something breaks, only Alice can fix it. When a design decision is questioned, only Bob knows why it was made. The bus factor — the number of people who would need to be hit by a bus before the system becomes unmaintainable — is 1. This is not a personnel problem. This is an architectural failure. The system's knowledge is stored in people's heads instead of in documentation, ADRs, and runbooks.

**Why It Happens**: Documentation is deferred. ADRs aren't written because "everyone knows why we made that decision." Runbooks aren't created because "Alice handles that." The hero engineer becomes the system's living documentation. This works until the hero goes on vacation, changes teams, or leaves the company. Then the system becomes a black box that nobody can operate or evolve.

**What To Do Instead**: Write ADRs for every significant decision. (See software-architect-core.md § Architecture Output Templates — ADR Template) Create runbooks for every operational procedure. Pair on complex tasks so knowledge spreads. The architect's job is to make themselves unnecessary — the architecture should be understandable and operable by any qualified engineer, not just the person who designed it.

**Detection**: "Is there any part of the system that only one person understands? What happens if that person is unavailable? Is the bus factor >1 for every critical component?"

**Severity**: High

---

### No Post-Mortem

**Description**: Incidents happen, the system is fixed, and nobody learns anything. The same root causes cause the same incidents months later. There's no structured analysis of what went wrong, why it went wrong, or what prevents it from happening again. The organization is stuck in a cycle of firefighting — fixing symptoms without addressing causes. Each incident is a missed opportunity to improve the system's reliability.

**Why It Happens**: Post-mortems take time. After an incident, the priority is restoring service and catching up on work that was delayed. Writing a post-mortem feels like additional overhead when everyone is already behind. Organizations that don't have a blameless culture may avoid post-mortems because they fear blame assignment. But without post-mortems, the organization cannot learn.

**What To Do Instead**: Every incident above a defined severity threshold gets a blameless post-mortem. The post-mortem documents: what happened (timeline), why it happened (root causes), how it was detected, how it was resolved, and what prevents recurrence (action items). Action items have owners and deadlines. Post-mortems are shared broadly so the entire organization learns from each incident. (See software-architect-infrastructure.md § Incident Management)

**Detection**: "Does every significant incident result in a post-mortem? Are action items tracked to completion? Do incidents with the same root cause recur?"

**Severity**: High

---

### Monitoring Without Observability

**Description**: Dashboards show green. Metrics are within thresholds. The monitoring system says everything is fine. But when a user reports slowness, nobody can answer "why is this slow?" The dashboards show that the system is alive but not how it's behaving. CPU is fine, memory is fine, error rate is zero — but the p99 latency has doubled and nobody noticed because nobody set an alert on p99 latency. The system is monitored but not observed.

**Why It Happens**: Monitoring is easier than observability. Monitoring tells you whether predefined metrics are within predefined thresholds. Observability lets you ask arbitrary questions about system behavior. Setting up dashboards with CPU, memory, and error rate is straightforward. Setting up distributed tracing, structured logging, and high-cardinality metrics that enable ad-hoc investigation requires more investment.

**What To Do Instead**: Observability means you can answer any operational question without deploying new code. (See software-architect-core.md § Observability) Implement: (1) structured logging with trace IDs, (2) distributed tracing across service boundaries, (3) high-cardinality metrics (per-endpoint latency percentiles, not just average latency), (4) SLO-based alerting (error budget burn rate, not static thresholds). The test: when something is slow, can you identify the bottleneck in under 5 minutes?

**Detection**: "Can I answer 'why is this slow?' without deploying new instrumentation? Do I have distributed tracing? Are my alerts based on SLOs or static thresholds?"

**Severity**: High

---

## Process Anti-Patterns

Architecture is not just about the system. It's about how the system is designed, evolved, and governed. Process anti-patterns corrupt the architecture by corrupting the process that produces it.

### Architecture by Committee

**Description**: Every architectural decision requires consensus from 15 people across 6 teams. Decisions take weeks of meetings. Compromises are made to satisfy everyone, resulting in architectures that nobody believes in but everyone can live with. The architecture is a political document, not a technical one. Design by committee produces designs that are acceptable to the committee but wrong for the system.

**Why It Happens**: Organizations value consensus. "Everyone should have input" sounds inclusive. But architecture requires making trade-offs — choosing one thing means not choosing another. When 15 people must agree, the decision converges on the option that offends the fewest people, not the option that best serves the system's requirements. Consensus is the enemy of good architecture.

**What To Do Instead**: Assign decision rights clearly. The architect (or architecture team) has authority over architectural decisions. Stakeholders provide input but don't vote. Decisions are made by the people with the most context and accountability for the outcome. ADRs document decisions so they can be reviewed and challenged after the fact, but they are not blocked waiting for consensus. (See software-architect-organization.md § The Architecture Decision Spectrum)

**Detection**: "How many people must approve an architectural decision? Does the approval process take longer than the time spent analyzing the decision itself?"

**Severity**: High

---

### Ivory Tower Architecture

**Description**: Architects who design but never implement. They produce diagrams, documents, and specifications, then hand them to engineering teams with the expectation that the implementation will match the design. The architects are disconnected from the reality of the codebase, the build system, the deployment pipeline, and the operational constraints. The architecture looks elegant on paper and breaks on contact with reality.

**Why It Happens**: Organizations separate "architecture" from "engineering" as distinct roles. Architects are promoted out of engineering and stop writing code. Their understanding of the system becomes increasingly theoretical. Meanwhile, engineering teams work around architectural constraints that don't make sense in practice, creating a gap between the documented architecture and the actual system.

**What To Do Instead**: Architects must stay connected to implementation. This doesn't mean writing all the code — it means understanding the codebase, participating in code reviews, and occasionally implementing non-trivial features to maintain context. The architecture is validated by implementation, not by diagrams. If the architecture can't be implemented by the team, the architecture is wrong, regardless of how elegant it looks. (See software-architect-core.md § Architect's Role: Guide, Don't Dictate)

**Detection**: "Do the architects regularly write or review code? Does the documented architecture match what's actually running in production?"

**Severity**: High

---

### Big Upfront Design (BUFD)

**Description**: Spending 6 months designing the architecture before writing any code. Every component is specified. Every interface is defined. Every data model is normalized. The architecture is complete before implementation begins. But 3 months into implementation, the team discovers that some assumptions were wrong. Requirements changed. The market shifted. The architecture designed in month 1 doesn't match the reality of month 7. Half the design work is wasted.

**Why It Happens**: BUFD feels responsible. "Measure twice, cut once." Architecture is hard to change later, so design it thoroughly upfront. This logic is correct for structural decisions (database choice, system boundaries) but wrong for detailed design (component internals, API contracts, data models). BUFD assumes the requirements are complete and stable. They never are.

**What To Do Instead**: Make irreversible decisions early. Defer reversible decisions. (See software-architect-core.md § Delay Decisions Until the Last Responsible Moment) Design the architecture at the level of system structure (components, boundaries, communication patterns) and defer detailed design until implementation. Use evolutionary architecture — design enough to start building, then let the architecture evolve as you learn from implementation. The architecture should guide implementation, not specify it exhaustively.

**Detection**: "How long is the architecture phase before the first code is written? Are we designing details that could be deferred until implementation?"

**Severity**: Medium

---

### No Architecture at All

**Description**: "We're agile, we don't need architecture." The team starts coding immediately. Architecture emerges organically from implementation. There are no documented decisions, no defined boundaries, no shared understanding of the system's structure. Six months in, the codebase is a big ball of mud. Refactoring is constant. New features take longer and longer to implement. The system's architecture is whatever the code happens to do.

**Why It Happens**: Agile methodologies emphasize working software over comprehensive documentation. This is misinterpreted as "no architecture." Teams that have been burned by BUFD swing too far in the opposite direction, rejecting all upfront architecture as waterfall thinking. But agile values architecture — it just values evolutionary architecture over big upfront architecture. The absence of architecture is not agility. It's negligence.

**What To Do Instead**: Define just enough architecture to provide a shared understanding of the system's structure and constraints. (See software-architect-core.md § Architecture Workflow — Phase 3: Design) Write ADRs for significant decisions. Establish boundaries between components. Define communication patterns. This is not BUFD — it's the minimum architecture needed to prevent chaos. The architecture can and should evolve, but it needs a starting point.

**Detection**: "Can every team member describe the system's architecture in the same way? Are there documented boundaries between components? Would a new team member know where to put new code?"

**Severity**: Critical

---

## Anti-Pattern Detection Checklist

Run this checklist after completing any architecture artifact. It's organized by severity — fix critical issues before delivery, address high-priority issues before implementation, and review lower-severity items as time permits.

### Critical (Must Fix Before Delivery)

- [ ] Is this a distributed monolith? Can any service be deployed independently? Does any service share a database?
- [ ] Are services sharing a database? Does more than one service read/write the same database or schema?
- [ ] Is the cache being treated as the source of truth? Would deleting the cache break the system?
- [ ] Are distributed transactions being used across services where sagas would be more appropriate?
- [ ] Is every recommendation accompanied by an explicit trade-off acknowledgment?
- [ ] Has the scale context been considered? Would a simpler solution work at the actual scale?
- [ ] Can the production environment be rebuilt from version control without manual steps?
- [ ] Is there any part of the system with no documented architecture? Can every team member describe the system structure?

### High Priority (Should Fix Before Implementation)

- [ ] Is this resume-driven architecture? Does the solution complexity exceed the problem complexity?
- [ ] Am I presenting a pattern salad — listing options without a decision framework?
- [ ] Am I cargo-culting FAANG-scale solutions for a non-FAANG-scale system?
- [ ] Am I name-dropping technologies without explaining why they're the right choice for this context?
- [ ] Have I ignored team size, skills, and organizational constraints in my recommendations?
- [ ] Am I recommending solutions before fully understanding the requirements?
- [ ] Is the bus factor >1 for every critical component? Is knowledge distributed across the team?
- [ ] Do incidents result in post-mortems with tracked action items?
- [ ] Can operational questions be answered without deploying new instrumentation?
- [ ] Are alerts based on symptoms and SLOs, not static thresholds? Do on-call engineers trust the alerting system?
- [ ] Are architectural decisions made by a small group with accountability, not a committee of 15?
- [ ] Are architects connected to implementation — reviewing code, understanding the real system?

### Medium Priority (Consider Fixing)

- [ ] Am I invoking principles without showing concrete, system-specific applications?
- [ ] Is the documentation longer than its audience will read? Can a new team member understand the architecture in under 30 minutes?
- [ ] Am I applying the same patterns uniformly without considering whether different components need different approaches?
- [ ] Am I designing from a greenfield assumption without addressing the current system state and migration path?
- [ ] Does every architectural layer add value, or are there pass-through layers?
- [ ] Am I using the same technology/pattern for every problem because it's what I know?
- [ ] Am I abstracting for flexibility that isn't needed today?
- [ ] Is there dead code or unused infrastructure accumulating?
- [ ] Are we locked into a single vendor with no migration path?
- [ ] How many distinct database technologies are in use? Is each one justified by measurements?
- [ ] Is the architecture phase delaying the first code by months? Are we designing details that could be deferred?

### Low Priority (Awareness)

- [ ] Are data consumers reverse-engineering schemas? Are there inconsistent interpretations of the same data?
- [ ] Is the system accumulating lava flows — obsolete code that nobody dares remove?
- [ ] Is schema-on-read being applied without governance, creating a data swamp?

---

## Book Source Appendix

The anti-patterns in this catalog are informed by the following references. Each book contributes not just patterns but the "what NOT to do" sections that describe architectural failures and their consequences.

| Book | Author(s) | Primary Contribution |
|---|---|---|
| A Philosophy of Software Design | John Ousterhout | Complexity identification, deep vs. shallow modules, abstraction anti-patterns |
| The Mythical Man-Month | Fred Brooks | Second-system effect, conceptual integrity, communication overhead |
| Release It! | Michael Nygard | Stability anti-patterns, capacity patterns, operational failures |
| Building Microservices | Sam Newman | Distributed monolith, premature distribution, shared database anti-patterns |
| Software Architecture: The Hard Parts | Ford, Richards, Sadalage, Dehghani | Distributed transaction analysis, data ownership, service granularity trade-offs |
| Fundamentals of Software Architecture | Mark Richards, Neal Ford | Architecture anti-patterns taxonomy, architecture by committee, ivory tower |
| Designing Data-Intensive Applications | Martin Kleppmann | Data architecture anti-patterns, consistency vs. availability trade-offs |
| Domain-Driven Design | Eric Evans | Bounded context misapplication, shared kernel anti-patterns |
| The Pragmatic Programmer | David Thomas, Andrew Hunt | Broken windows theory, knowledge portfolio, technical debt |
| Site Reliability Engineering | Google (Beyer, Jones, Petoff, Murphy) | Alert fatigue, monitoring vs. observability, post-mortem culture |
| Thinking in Systems | Donella Meadows | System leverage points, unintended consequences, complexity growth |
| Clean Architecture | Robert C. Martin | Dependency rule violations, architecture erosion patterns |
| Building Evolutionary Architectures | Ford, Parsons, Kua | Fitness function failures, architectural drift, change coupling |
| The Phoenix Project | Gene Kim, Kevin Behr, George Spafford | Operational anti-patterns, hero culture, deployment bottlenecks |
| Accelerate | Nicole Forsgren, Jez Humble, Gene Pupp | Process anti-patterns, delivery performance, organizational maturity |
| Team Topologies | Matthew Skelton, Manuel Pais | Conway's Law violations, cognitive load anti-patterns, team structure |
| Continuous Delivery | Jez Humble, David Farley | Deployment anti-patterns, configuration drift, snowflake servers |
| The Art of Scalability | Martin Abbott, Michael Fisher | Scale anti-patterns, capacity planning failures, organizational scaling |
| Microservices Patterns | Chris Richardson | Saga anti-patterns, event sourcing misapplication, service decomposition |
| Cloud Native Patterns | Cornelia Davis | Cloud anti-patterns, lift-and-shift failures, cloud-native misapplication |
| Software Architecture in Practice (3rd Ed.) | Bass, Clements, Kazman | Quality attribute anti-patterns, architecture evaluation failures |
| Just Enough Software Architecture | George Fairbanks | Over-engineering anti-patterns, architecture documentation failures |
| Documenting Software Architectures | Clements, Bachmann, Bass, et al. | Documentation anti-patterns, view mismatch, over-documentation |
| Enterprise Integration Patterns | Gregor Hohpe, Bobby Woolf | Integration anti-patterns, messaging failures, routing mistakes |
| Patterns of Enterprise Application Architecture | Martin Fowler | Layered architecture anti-patterns, data source patterns, distribution |
| 97 Things Every Software Architect Should Know | Various (ed. Richard Monson-Haefel) | Practice anti-patterns, communication failures, stakeholder management |
| Software Architecture Patterns | Mark Richards | Pattern misapplication, style selection failures |
| Database Internals | Alex Petrov | Data architecture anti-patterns, storage engine misuse |
| Streaming Systems | Tyler Akidau, Slava Chernyak, Reuven Lax | Event streaming anti-patterns, watermark failures, state management |
| Kubernetes Patterns | Bilgin Ibryam, Roland Huß | Container anti-patterns, orchestration failures, cloud-native mistakes |

---

*Load this skill alongside any software-architect skill. After producing an architecture artifact, run § Anti-Pattern Detection Checklist. Fix critical issues immediately. Flag high-priority issues for revision. Note medium-priority items for future iteration.*
