---
name: software-architecture-patterns
description: Design patterns and architectural styles for the Software Architecture suite. Covers architectural styles catalog (layered, microservices, event-driven, monolith, service-based, space-based, pipe-and-filter, microkernel), code-level design patterns at architecture scale, POSA patterns, API design patterns (REST, GraphQL, gRPC), enterprise integration patterns, legacy refactoring patterns, and pattern selection methodology. Includes real-world OSS case studies.
---

## Pattern Thinking

Patterns are named solutions to recurring problems in a given context. A pattern is not inherently good or bad. It is appropriate or inappropriate for a given context. This distinction is the difference between cargo-cult architecture and informed decision-making.

### The Pattern Language

Every architectural pattern follows the same structure:

- **Problem**: The recurring challenge the pattern addresses.
- **Context**: The conditions under which the problem arises.
- **Forces**: The competing concerns, constraints, and trade-offs at play.
- **Solution**: The core structural arrangement that resolves the forces.
- **Consequences**: What the solution gives you and what it costs you.
- **Related Patterns**: What patterns naturally follow, precede, or complement this one.

This format comes from the seminal works *Design Patterns* (Gamma, Helm, Johnson, Vlissides) and *Pattern-Oriented Software Architecture* Vol. 1-5 (Buschmann et al.).

### Patterns as Vocabulary, Not Prescriptions

Knowing 23 GoF patterns does not make you an architect. Patterns are a shared vocabulary for communicating design intent. They let you say "we'll use a Broker topology here" instead of describing 15 minutes of box-and-arrow detail. But patterns applied without context analysis are cargo-cult architecture. The pattern name is not the justification. The pattern's fit to the specific problem, scale, and quality attribute requirements is the justification.

Use patterns as decision tools, not as a checklist to fill. A system that implements every pattern in this catalog is an over-engineered disaster. A system that uses exactly two patterns, both perfectly fitted to the context, is good architecture.

**Core principle**: "Make the implicit explicit." (See software-architecture-core.md § Principle Ownership Map) If you're applying a pattern, state which pattern you're applying and why. Don't let the pattern be an accidental structure that emerged. Make it an explicit architectural decision.


## Architectural Styles Catalog

Architectural styles are the highest-level structural patterns. They define the fundamental topology of the system: how components connect, how data flows, how the system is deployed. Choosing an architectural style is the single most consequential decision you will make. Changing it later is a rewrite, not a refactor.

Every style below includes quality attribute ratings, scale context, and concrete OSS examples. Use the decision tree at the end of this section to narrow your options.

### Quality Attribute Rating Legend

| Symbol | Meaning |
|---|---|
| + | Positive impact: the style naturally supports this attribute |
| ◇ | Neutral: can support with additional effort |
| — | Negative impact: the style actively works against this attribute |

### Layered Architecture

**Description**: Organizes the system into horizontal layers, each with a distinct responsibility. The classic stack: Presentation → Business Logic → Persistence → Database. Each layer depends only on the layer directly below it.

**Quality Attributes**:

| Attribute | Rating | Notes |
|---|---|---|
| Maintainability | + | Clear separation of concerns. Changes are localized to one layer. |
| Testability | + | Layers can be tested in isolation with mocked dependencies. |
| Scalability | — | Monolithic deployment. Cannot scale layers independently. |
| Performance | ◇ | Each layer adds call overhead. Mitigated by in-process calls. |
| Agility | ◇ | Simple initially. Becomes rigid as the system grows. |

**When to Use**: CRUD-heavy applications, systems with straightforward business logic, internal tools, early-stage products where team size is small and domain understanding is evolving.

**When NOT to Use**: Systems with complex, cross-cutting workflows. Systems requiring independent deployment of components. Systems where different parts have radically different scaling profiles.

**Scale Context**:
- **Solo/Startup**: Ideal. Optimizes for speed and simplicity.
- **Growth**: Works as a modular monolith. Boundaries between layers may need to relax for cross-cutting concerns.
- **Scale**: Usually insufficient. The monolithic deployment model becomes a bottleneck.

**Anti-Pattern: Sink-Hole Anti-Pattern**: Layers that pass data through without transformation. If every request flows Presentation → Business → Persistence → Database with the business layer doing nothing but forwarding, the business layer is a sink-hole. Either give it real logic or collapse the layers.

**Real-World OSS Example**: Many Django and Rails applications at small scale. WordPress core uses a layered architecture: Themes (Presentation), Plugin API + Core Logic (Business), WP_Query + Database Abstraction (Persistence), MySQL (Database).

```
┌─────────────────────────────────────────┐
│              Presentation                │
│  HTTP handlers, views, input validation  │
└──────────────────┬──────────────────────┘
                   │ calls (in-process)
┌──────────────────▼──────────────────────┐
│            Business Logic                │
│    Domain services, rules, workflows     │
└──────────────────┬──────────────────────┘
                   │ calls (in-process)
┌──────────────────▼──────────────────────┐
│              Persistence                 │
│      Repositories, ORM, data access      │
└──────────────────┬──────────────────────┘
                   │ SQL / ORM
┌──────────────────▼──────────────────────┐
│               Database                   │
│            PostgreSQL, MySQL             │
└─────────────────────────────────────────┘
```

### Microservices Architecture

**Description**: Independent deployable services, each owning a bounded context (See software-architecture-ddd.md § Bounded Context). Services communicate over the network via lightweight protocols (HTTP/REST, gRPC, messaging). Each service has its own database.

**Quality Attributes**:

| Attribute | Rating | Notes |
|---|---|---|
| Scalability | + | Services scale independently based on their specific load profile. |
| Agility | + | Teams deploy independently. No coordination for most changes. |
| Fault Isolation | + | A failure in one service does not crash the entire system. |
| Performance | — | Network calls add latency. Serialization/deserialization overhead. |
| Maintainability | ◇ | Simple per service. Complex across services (debugging, tracing). |
| Operational Complexity | — | Requires container orchestration, service mesh, distributed tracing. |

**When to Use**: Team size exceeds 10 engineers. Independent deployment cadence is required. Different parts of the system have fundamentally different scaling or technology requirements. The domain is well-understood and bounded contexts are stable.

**When NOT to Use**: Small teams (fewer than 8 engineers). Early-stage products where the domain model is evolving rapidly. When you cannot articulate three concrete problems that microservices solve for your specific system.

**Scale Context**:
- **Solo/Startup**: Architectural malpractice. The operational overhead will kill velocity.
- **Growth**: Consider service-based (coarser-grained) as a stepping stone. (See § Service-Based Architecture)
- **Scale**: The standard choice. Teams are large enough to own services independently.

**Real-World OSS Example**: **Netflix OSS** (Eureka for service discovery, Hystrix for circuit breaking, Zuul for API gateway). Netflix migrated from a monolith when their datacenter outage proved a single point of failure. They traded operational complexity for fault isolation and independent deployment velocity.

```
┌──────────┐    ┌──────────┐    ┌──────────┐
│ Service  │    │ Service  │    │ Service  │
│  Orders  │    │ Payments │    │ Shipping │
└────┬─────┘    └────┬─────┘    └────┬─────┘
     │ PostgreSQL     │ PostgreSQL    │ PostgreSQL
     ▼                ▼               ▼
┌──────────┐    ┌──────────┐    ┌──────────┐
│ Orders   │    │ Payments │    │ Shipping │
│   DB     │    │    DB    │    │    DB    │
└──────────┘    └──────────┘    └──────────┘

Communication: Async events via message broker for cross-service workflows.
                 Sync HTTP/gRPC for direct queries.
```

### Event-Driven Architecture

**Description**: Components communicate by producing and consuming events. Two topologies: **Broker** (choreography — components publish events to a shared broker, consumers react independently) and **Mediator** (orchestration — a central mediator manages event routing and workflow state).

**Quality Attributes**:

| Attribute | Rating | Notes |
|---|---|---|
| Scalability | + | Components scale independently. Back-pressure handled by queue depth. |
| Loose Coupling | + | Producers don't know about consumers. Consumers can be added without touching producers. |
| Performance | + | High throughput for async workflows. Producers don't wait for consumers. |
| Debuggability | — | Tracing a request across async event chains is hard. Requires distributed tracing. |
| Consistency | — | Eventual consistency by design. No distributed transactions. |

**When to Use**: Complex, multi-step workflows. High throughput requirements. Systems where producers and consumers have different throughput profiles. Loose coupling between components is a hard requirement.

**When NOT to Use**: Simple request-response workflows. When latency must be sub-millisecond. When strong consistency is required for every operation.

**Broker (Choreography) vs Mediator (Orchestration)**:

| Factor | Broker | Mediator |
|---|---|---|
| Coupling | Lower: components know only events | Higher: components know the mediator |
| Workflow visibility | Scattered across event handlers | Centralized in the mediator |
| Adding new steps | Add new consumer, no mediator change | Modify mediator workflow |
| Debugging | Hard: trace through many consumers | Easier: workflow is in one place |
| Single point of failure | Broker itself (mitigated by clustering) | Mediator + broker |

**Real-World OSS Example**: **Apache Kafka** at LinkedIn. LinkedIn processes trillions of events per day. Broker topology: producers publish to Kafka topics, consumers (real-time analytics, search indexing, notification systems) subscribe independently. The broker is the source of truth for event ordering.

```
Broker Topology:
┌──────────┐  event  ┌──────────────┐  event  ┌──────────┐
│  Order   │────────▶│    Event     │────────▶│ Payment  │
│ Service  │         │    Broker    │         │ Service  │
└──────────┘         │  (Kafka /    │         └──────────┘
                     │   RabbitMQ)  │
┌──────────┐         │              │  event  ┌──────────┐
│ Shipping │◀────────│              │────────▶│   Notif. │
│ Service  │  event  └──────────────┘         │ Service  │
└──────────┘                                  └──────────┘
```

### Monolithic Architecture

**Description**: A single deployable unit containing all application logic. All components share the same process space, memory, and database connections. This is the default architecture. It is not a failure. It is the starting point.

**Quality Attributes**:

| Attribute | Rating | Notes |
|---|---|---|
| Simplicity | + | Single deployment. Single codebase. Single pipeline. |
| Performance | + | In-process calls. No network latency. No serialization overhead. |
| Development Velocity | + | Simple for small teams. No distributed debugging. |
| Scalability | — | Scales as a unit. Cannot scale a hot path independently. |
| Agility (at scale) | — | Teams step on each other. Deployment becomes a bottleneck. |

**When to Use**: Small teams (1-8 engineers). Early-stage products. When the domain model is still being discovered. When you cannot justify the operational cost of distribution.

**When NOT to Use**: Large teams. When different parts of the system need independent deployment. When fault isolation is a hard requirement.

**Scale Context**:
- **Solo/Startup**: The correct choice. (See software-architecture-core.md § Scale Context Framework — Solo/Startup)
- **Growth**: Modular monolith. Enforce module boundaries at the code level. Prepare for extraction.
- **Scale**: Usually outgrown. The monolith becomes the strangler fig target.

**Real-World OSS Example**: **GitLab** ran as a Rails monolith well past 100 engineers and 30M users. They invested heavily in modularization within the monolith (enforcing module boundaries, dependency direction rules) before extracting select services. The lesson: a well-structured monolith scales further than most architects assume.

```
┌──────────────────────────────────────────────┐
│              Single Deployable Unit            │
│                                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  Orders  │  │ Payments │  │ Shipping │    │
│  │  Module  │  │  Module  │  │  Module  │    │
│  └──────────┘  └──────────┘  └──────────┘    │
│        │             │             │           │
│        └─────────────┼─────────────┘           │
│                      │                         │
│              ┌───────▼───────┐                 │
│              │   PostgreSQL  │                 │
│              └───────────────┘                 │
└──────────────────────────────────────────────┘
```

### Service-Based Architecture

**Description**: A pragmatic middle ground between monolith and microservices. The system is split into coarse-grained services (typically 4-12), each a domain-aligned deployable unit. Services may share a database, though separate schemas are preferred. Communication is typically HTTP/REST.

**Quality Attributes**:

| Attribute | Rating | Notes |
|---|---|---|
| Pragmatism | + | Fewer services = less operational overhead than microservices. |
| Deployability | + | Services deploy independently but less frequently than microservices. |
| Scalability | ◇ | Better than monolith, worse than microservices. Coarse-grained scaling. |
| Complexity | ◇ | Moderate. More than monolith, far less than microservices. |

**When to Use**: Team size 10-50 engineers. You need independent deployment but microservices are overkill. The domain has clear, stable boundaries but the team isn't large enough to own dozens of services.

**When NOT to Use**: When you need independent scaling of fine-grained components. When team size justifies full microservices.

**Scale Context**:
- **Growth**: The sweet spot. Enough distribution for team autonomy without the full microservices tax.
- **Scale**: Usually evolves into full microservices as teams grow and services need finer-grained scaling.

**Real-World OSS Example**: Many mid-stage startups use service-based before they need microservices. A typical split: User Service, Product Service, Order Service, Payment Service, Notification Service (5 services for an e-commerce platform at 10-50 engineers).

### Space-Based Architecture

**Description**: Distributes processing and data across a grid of processing units, each containing application logic and an in-memory data grid. A middleware layer (messaging grid, data grid, processing grid) coordinates. Designed for extreme scale and variable, unpredictable load.

**Quality Attributes**:

| Attribute | Rating | Notes |
|---|---|---|
| Scalability | + | Near-linear scaling. Add processing units to handle more load. |
| Performance | + | In-memory data access. No database bottleneck. |
| Complexity | — | Extremely complex. Requires specialized expertise. |
| Consistency | — | Eventual consistency. Complex conflict resolution. |

**When to Use**: Extreme scale (millions of concurrent users). Highly variable load (flash sales, ticket releases). When database is the bottleneck and caching alone isn't sufficient.

**When NOT to Use**: Almost always. This is a niche architecture for specific scaling problems. If you're not sure you need it, you don't need it.

**Scale Context**: Scale+ only. This architecture is for organizations that have exhausted simpler scaling strategies.

**Real-World OSS Example**: **Apache Ignite** and **Hazelcast** implement space-based architecture primitives. Used by financial trading systems and large-scale gaming platforms where in-memory data access and elastic scaling are required.

### Pipe-and-Filter Architecture

**Description**: Processing stages (filters) connected by communication channels (pipes). Each filter transforms input data and passes output to the next filter. Filters are independent, composable, and reusable.

**Quality Attributes**:

| Attribute | Rating | Notes |
|---|---|---|
| Composability | + | Filters can be rearranged and reused in different pipelines. |
| Testability | + | Each filter tested in isolation with known input/output pairs. |
| Performance | ◇ | Sequential processing adds latency. Parallelizable if filters are independent. |
| Error Handling | — | A failure in one filter breaks the pipeline. Requires explicit error channels. |

**When to Use**: Data transformation pipelines, ETL (Extract-Transform-Load), stream processing, compilers (lexer → parser → semantic analyzer → code generator), media processing pipelines.

**When NOT to Use**: Interactive systems. Request-response workflows. When processing order isn't linear.

**Real-World OSS Example**: **Unix pipes** (`cat file | grep pattern | sort | uniq`) are the canonical implementation. **Apache NiFi** implements visual pipe-and-filter for data flow automation. **FFmpeg** uses pipe-and-filter for media transcoding pipelines.

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Filter  │───▶│  Filter  │───▶│  Filter  │───▶│  Filter  │
│   Read   │    │ Validate │    │Transform │    │  Write   │
│   CSV    │    │  Schema  │    │   Data   │    │   JSON   │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
     │               │               │               │
     │               │               │               │
     ▼               ▼               ▼               ▼
  Raw data      Validated      Transformed     Output
                 records        records         file
```

### Microkernel (Plugin) Architecture

**Description**: A minimal core system provides essential functionality. Extension modules (plugins) add specific features through a well-defined plugin API. The core system is stable. Plugins evolve independently.

**Quality Attributes**:

| Attribute | Rating | Notes |
|---|---|---|
| Extensibility | + | New features added as plugins without modifying the core. |
| Maintainability | + | Core is small and stable. Plugin failures don't crash the core. |
| Performance | ◇ | Plugin isolation (separate processes) adds overhead. |
| Complexity | ◇ | Plugin API design is hard. Backward compatibility is critical. |

**When to Use**: Product platforms that need third-party extensions. Systems where feature set varies by customer or deployment. Tools and IDEs.

**When NOT to Use**: When features are tightly coupled and can't be cleanly separated. When the plugin API overhead isn't justified.

**Real-World OSS Examples**:
- **VS Code**: Core editor + extension marketplace. Every language support, theme, and tool integration is a plugin. The core has never been rewritten. Extensions are sandboxed.
- **Webpack**: Core bundler + loader/plugin system. Loaders transform files. Plugins hook into the build lifecycle. The plugin architecture is why Webpack can handle any file type.
- **Eclipse**: Core IDE platform + plugin architecture. The canonical example in POSA Vol. 1.

**Architectural Decision**: VS Code chose process isolation for extensions (each extension runs in its own process). The cost is memory overhead. The gain is that a misbehaving extension cannot crash the editor.

```
┌────────────────────────────────────────┐
│              Plugin API                  │
│  (Extension points, hooks, contracts)    │
└────┬───────┬───────┬───────┬────────────┘
     │       │       │       │
┌────▼──┐ ┌──▼───┐ ┌─▼────┐ ┌▼──────┐
│Plugin │ │Plugin│ │Plugin│ │Plugin │
│  A    │ │  B   │ │  C   │ │  D    │
└───────┘ └──────┘ └──────┘ └───────┘
     │       │       │       │
     └───────┴───────┴───────┘
                  │
          ┌───────▼───────┐
          │   Core System  │
          │  (minimal)     │
          └───────────────┘
```

### Architectural Style Selection Decision Tree

Use this decision tree to narrow your options before performing detailed trade-off analysis:

```
START
  │
  ├─ Team < 10 engineers? ──▶ Monolith (modular)
  │
  ├─ Extreme scale / variable load? ──▶ Space-Based
  │
  ├─ Third-party extensibility required? ──▶ Microkernel (Plugin)
  │
  ├─ Data transformation pipeline? ──▶ Pipe-and-Filter
  │
  ├─ Complex multi-step workflows + loose coupling? ──▶ Event-Driven
  │
  ├─ Team 10-50, need independent deployment? ──▶ Service-Based
  │
  ├─ Team 50+, fine-grained scaling, fault isolation? ──▶ Microservices
  │
  └─ CRUD-heavy, simple logic? ──▶ Layered
```

The decision tree narrows options. The final selection requires trade-off analysis against specific quality attribute requirements. (See software-architecture-core.md § Trade-Off Analysis Template)


## Code-Level Design Patterns at Architecture Scale

The Gang of Four patterns were defined for object-oriented code. At architecture scale, the same structural ideas apply to components, services, and system boundaries. This section covers which GoF patterns have architectural significance and how they manifest at the system level.

### Strategy / Policy Pattern

**System-Level Application**: Configurable business rules engines, pluggable algorithms, policy-based routing.

**When It Becomes Architectural**: When business rules must change independently of the system's deployment cycle. A new pricing strategy or fraud detection algorithm is deployed as configuration, not as code.

```
// Component: PricingEngine
// Architecture: Strategy pattern at service level
// The strategy is selected at runtime based on customer segment

pricing_engine:
    strategy = strategy_registry.lookup(customer.segment)  // "retail", "enterprise", "partner"

    calculate_price(order):
        base = strategy.compute_base(order.items)     // Strategy-specific algorithm
        discounts = strategy.apply_discounts(order)    // Strategy-specific rules
        return base - discounts
```

**Real-World Reference**: Insurance underwriting engines load rule sets per product line. Each product line has a different risk model (strategy). Adding a new product line means adding a new strategy, not modifying the engine.

### Observer / Publisher-Subscriber

**System-Level Application**: Event bus, message broker integration, cross-service notification.

**When It Becomes Architectural**: When you replace in-process observer lists with a message broker. The Observer pattern becomes Pub/Sub at the system level. This is the foundation of Event-Driven Architecture. (See § Event-Driven Architecture)

```
// Architecture: System-level Pub/Sub via message broker
// Publisher does not know subscriber identities

order_service:
    // Publish event — don't know or care who listens
    event_bus.publish("order.placed", {
        order_id: order.id,
        customer_id: order.customer_id,
        total: order.total,
        timestamp: now()
    })

// Subscribers register independently:
//   payment_service subscribes to "order.placed"
//   shipping_service subscribes to "order.placed"
//   analytics_service subscribes to "order.placed"
```

### Facade

**System-Level Application**: API Gateway, Backend-for-Frontend (BFF).

**When It Becomes Architectural**: When a single entry point hides the complexity of multiple backend services from clients. The API Gateway is the Facade for your entire service ecosystem. A BFF is a per-client Facade.

```
// Architecture: API Gateway as Facade
// Client makes one call. Gateway fans out to multiple services.

client → api_gateway.get_product_page(product_id):
    // Fan out to internal services
    product = product_service.get(product_id)         // HTTP
    reviews = review_service.get_reviews(product_id)  // HTTP
    inventory = inventory_service.check(product_id)    // gRPC
    pricing = pricing_service.get_price(product_id)    // HTTP

    // Aggregate into single response
    return { product, reviews, inventory, pricing }
```

**Real-World Reference**: Netflix's API Gateway pattern. Different clients (iOS, Android, TV, Web) have different data needs. Each client gets a BFF that aggregates backend services into exactly the shape that client needs.

### Adapter

**System-Level Application**: Anti-Corruption Layer (ACL) in Domain-Driven Design, legacy system integration, third-party API wrapping.

**When It Becomes Architectural**: When integrating with systems that speak a different language (different models, different protocols, different semantics). The Adapter is not just wrapping an API. It's translating between two different domain models.

```
// Architecture: Anti-Corruption Layer as Adapter
// Protects the core domain from the legacy system's model

anti_corruption_layer:
    // Legacy system uses "CUST_REC" with 30-character codes
    // Our system uses "Customer" with UUIDs
    translate_from_legacy(legacy_record: LegacyCustRec) → Customer:
        return Customer(
            id = legacy_id_mapping.resolve(legacy_record.cust_code),
            name = legacy_record.full_name,
            email = legacy_record.primary_email
        )

    translate_to_legacy(customer: Customer) → LegacyCustRec:
        return LegacyCustRec(
            cust_code = legacy_id_mapping.reverse_lookup(customer.id),
            full_name = customer.name,
            primary_email = customer.email
        )
```

### Proxy

**System-Level Application**: Sidecar pattern, ambassador pattern, service mesh (Envoy, Linkerd).

**When It Becomes Architectural**: When every service gets a proxy that handles cross-cutting concerns (TLS termination, retry, circuit breaking, metrics collection) without modifying the service code. The proxy pattern at infrastructure scale.

```
// Architecture: Sidecar Proxy
// Application container doesn't handle retry, TLS, or discovery.
// The sidecar handles all of it transparently.

┌───────────────────┐
│  Service A        │  ← Application code: business logic only
│  (app container)  │
│  localhost:8080   │
└────────┬──────────┘
         │ localhost
┌────────▼──────────┐
│  Envoy Sidecar    │  ← Proxy: TLS, retry, circuit breaking, metrics
│  localhost:15001  │
└────────┬──────────┘
         │ mTLS
    ┌────▼────┐
    │ Network │
    └─────────┘
```

**Real-World Reference**: Istio service mesh uses Envoy sidecar proxies. Every service gets a sidecar. The application code never handles retry logic, circuit breaking, or mTLS.

### Command

**System-Level Application**: CQRS command handling. (See software-architecture-distributed.md § CQRS) Each command is an object that encapsulates a write operation's intent, data, and validation.

**When It Becomes Architectural**: When you separate the command model from the query model. Commands become first-class architectural elements with their own pipeline (validation, authorization, execution, event publication).

```
// Architecture: Command pattern in CQRS
// Commands are architectural elements, not just method parameters

command_handler(PlaceOrderCommand):
    // 1. Validate command
    if not command.is_valid():
        return rejection(command.errors)

    // 2. Authorize
    if not auth.can_execute(command.user_id, "place_order"):
        return rejection(["unauthorized"])

    // 3. Execute against domain model
    order = order_aggregate.create(command.items, command.customer_id)

    // 4. Publish domain events
    event_store.append("order.placed", order.events)
```

### Template Method

**System-Level Application**: Plugin architecture hooks, framework extension points, lifecycle callbacks.

**When It Becomes Architectural**: When you define the skeleton of a process and let plugins fill in the variable parts. The Template Method becomes the plugin contract.

```
// Architecture: Template Method as plugin lifecycle
// Core system defines the algorithm structure.
// Plugins implement the variable steps.

abstract class DataProcessor:
    // Template method: defines the algorithm skeleton
    process(data):
        validated = this.validate(data)       // Plugin step
        enriched = this.enrich(validated)     // Plugin step
        transformed = this.transform(enriched)// Plugin step
        this.persist(transformed)             // Plugin step
```

### Decorator

**System-Level Application**: Request/response middleware pipelines. Authentication, logging, rate limiting, compression applied as composable layers.

**When It Becomes Architectural**: When cross-cutting concerns are applied as a composable chain rather than baked into each service. Express.js middleware, Django middleware, ASP.NET middleware.

```
// Architecture: Decorator as middleware pipeline
// Each middleware wraps the next, adding behavior

pipeline = [
    rate_limiter,       // Outer: reject if rate limit exceeded
    authenticator,      // Add user context
    logger,             // Log request
    compressor,         // Inner: compress response
    handler             // Core: business logic
]

// Request flows through pipeline outer → inner
// Response flows through pipeline inner → outer
```

### Chain of Responsibility

**System-Level Application**: Filter chains, middleware stacks, request processing pipelines, validation chains.

**When It Becomes Architectural**: When a request passes through a series of handlers, each deciding whether to process it or pass it to the next. Unlike Decorator (which always wraps), Chain of Responsibility may terminate early.

```
// Architecture: Chain of Responsibility as validation pipeline
// Each validator can reject the request (stop chain) or pass it through

validation_chain = [
    schema_validator,       // Check JSON schema
    business_rule_validator, // Check business rules
    fraud_detector,         // Check for fraud patterns
    rate_limiter            // Check rate limits
]

// If any validator rejects, the chain stops.
// If all pass, the request proceeds to the handler.
```


## POSA Patterns

Pattern-Oriented Software Architecture (POSA) Volumes 1-5 catalog architectural and design patterns beyond the GoF scope. This section covers the POSA patterns with the highest architectural impact.

### Layers (POSA Vol. 1)

The Layered pattern from POSA Vol. 1 is the canonical reference for layered architecture. (See § Layered Architecture for the full treatment with quality attribute ratings and scale context.)

POSA's contribution: defines the rules for layer interaction. Layer N may only use services of Layer N-1. No layer skipping. No upward dependencies. These rules are what make the pattern work. Violating them creates a "relaxed layered" system that's harder to reason about.

### Pipes and Filters (POSA Vol. 1)

The POSA treatment of Pipes and Filters adds the concept of active vs. passive filters and the taxonomy of filter types (source, transform, sink, test). (See § Pipe-and-Filter Architecture for the full treatment.)

**Key POSA contribution**: Filters should be context-free where possible. A filter that depends on processing order or shared state is not a true filter. True filters can be rearranged, parallelized, and reused in any pipeline.

### Blackboard (POSA Vol. 1)

**Description**: Multiple specialized knowledge sources collaborate to solve a problem by reading from and writing to a shared data structure (the blackboard). A control component manages which knowledge source is activated next.

**When to Use**: AI/ML pipelines, speech recognition, complex problem-solving where no single algorithm suffices, systems where the solution path is not predetermined.

**When NOT to Use**: Deterministic problems with known solution paths. When a simple sequential algorithm works.

**Real-World Reference**: **Hearsay II** speech recognition system (the original Blackboard application). Modern applications: AI agent orchestration systems where multiple specialized agents (knowledge sources) contribute to a shared context (the blackboard).

```
┌──────────────────────────────────────────┐
│              Blackboard                    │
│  (Shared data structure / context)         │
└───┬──────────┬──────────┬─────────────────┘
    │          │          │
┌───▼────┐ ┌───▼────┐ ┌───▼────┐
│ Knowl. │ │ Knowl. │ │ Knowl. │
│ Source │ │ Source │ │ Source │
│   A    │ │   B    │ │   C    │
└────────┘ └────────┘ └────────┘
    │          │          │
    └──────────┴──────────┘
               │
    ┌──────────▼──────────┐
    │     Controller       │
    │  (Decides which KS   │
    │   to activate next)  │
    └─────────────────────┘
```

### Broker (POSA Vol. 1)

The Broker pattern from POSA defines the architecture for distributed systems where components interact through a broker that handles location transparency, communication, and marshaling.

**Key POSA contribution**: The Broker pattern separates the communication infrastructure from the application logic. Components register with the broker. Clients call the broker, which locates the server, forwards the request, and returns the result. The client never knows the server's location.

This pattern is the foundation of modern service meshes, message brokers, and RPC frameworks. (See § Event-Driven Architecture for the Broker topology.)

### MVC and Variants (POSA Vol. 1)

**Model-View-Controller**: Separates interactive applications into Model (data and business logic), View (presentation), and Controller (input handling). The canonical POSA pattern for interactive systems.

**Variants with Architectural Significance**:

- **MVVM** (Model-View-ViewModel): Data binding between View and ViewModel. Used by Angular, Vue. The ViewModel exposes observable properties that the View binds to. No direct View-Model communication in MVC.

- **MVP** (Model-View-Presenter): Presenter mediates all View-Model interaction. Used in Android development. More testable than MVC because the Presenter has no UI dependency.

- **Flux / Redux**: Unidirectional data flow. Action → Dispatcher → Store → View. Used by React ecosystem. Architectural significance: makes state changes predictable by enforcing a single direction of data flow and a single source of truth (the Store).

```
MVC:
┌──────────┐  updates   ┌──────────┐
│  Model   │◀───────────│Controller│
└────┬─────┘            └────▲─────┘
     │ reads                 │ user input
     ▼                       │
┌──────────┐                 │
│   View   │─────────────────┘
└──────────┘

Flux/Redux (Unidirectional):
Action ──▶ Dispatcher ──▶ Store ──▶ View
  ▲                                      │
  └──────────────────────────────────────┘
```

### Reactor (POSA Vol. 2)

**Description**: An event demultiplexer waits for events on a set of handles. When an event arrives, it dispatches to the appropriate event handler. All processing happens synchronously in a single thread.

**When to Use**: High-concurrency I/O-bound applications. When thread-per-connection models exhaust system resources.

**Real-World Reference**: **Nginx** uses a Reactor pattern. A single master process and multiple worker processes, each running an event loop. Each worker handles thousands of concurrent connections in a single thread. The Reactor pattern is why Nginx can serve 10,000+ concurrent connections with minimal memory.

**System**: Nginx
**Architectural Decision**: Reactor pattern (event-driven, non-blocking I/O in single-threaded workers)
**Trade-off Rationale**: Thread-per-connection (Apache model) is simple but doesn't scale past a few thousand connections due to thread memory overhead and context switching cost.
**What They Gave Up**: Simplicity. Event-driven code is harder to write and debug. A blocking operation in a handler blocks the entire worker.
**What They Gained**: Massive concurrency with minimal resource usage. C10K problem solved.

### Proactor (POSA Vol. 2)

**Description**: Like Reactor, but asynchronous operations are initiated by the Proactor, and completion handlers are invoked when operations finish. The OS handles the asynchronous I/O and notifies when done.

**When to Use**: When the OS provides true async I/O (IOCP on Windows, io_uring on Linux). Higher performance than Reactor for I/O-heavy workloads because the OS handles the I/O completion.

**Trade-off**: Proactor is more performant than Reactor on platforms that support it, but it's less portable. Reactor works everywhere.

### Half-Sync / Half-Async (POSA Vol. 2)

**Description**: Separates synchronous processing (simple, predictable, easy to reason about) from asynchronous processing (efficient, scalable). A queue layer connects them.

**When to Use**: Systems that need both: async I/O for scalability and sync processing for business logic simplicity. The async layer handles I/O events efficiently. The sync layer processes business logic in a simple, blocking model.

**Real-World Reference**: Many network servers use this pattern. A Reactor handles async I/O and queues requests. Worker threads pull from the queue and process synchronously.

```
┌──────────────────────────┐
│   Async Layer (Reactor)   │  ← Non-blocking I/O
│   Handles connections     │
└──────────┬───────────────┘
           │ Queue
┌──────────▼───────────────┐
│   Sync Layer (Workers)    │  ← Blocking business logic
│   Thread pool processing  │
└──────────────────────────┘
```


## API Design Patterns

API design is architecture. The API is the contract between components. A poorly designed API propagates its flaws to every consumer. A well-designed API makes the system composable and evolvable.

### REST

**Description**: Resource-oriented architectural style. Resources are identified by URIs. Standard HTTP methods (GET, POST, PUT, DELETE, PATCH) define operations. Stateless: each request contains all information needed to process it. HATEOAS: responses include hyperlinks to related resources.

**Richardson Maturity Model**:

| Level | Name | Description |
|---|---|---|
| 0 | Swamp of POX | Single endpoint. HTTP as transport. No resource model. |
| 1 | Resources | Multiple URIs. Each resource has its own endpoint. |
| 2 | HTTP Verbs | Proper use of GET, POST, PUT, DELETE semantics. Response codes. |
| 3 | HATEOAS | Responses include links to related resources. Self-documenting API. |

**When to Use**: Public APIs consumed by unknown clients. CRUD-oriented domains. When HTTP caching infrastructure (CDNs, proxies) is valuable. When you want the broadest possible client compatibility.

**When NOT to Use**: When clients need fine-grained control over response shape (use GraphQL). When performance demands binary protocol and multiplexing (use gRPC). When the domain is heavily command-oriented rather than resource-oriented.

**Versioning Strategies**:

| Strategy | Approach | Trade-off |
|---|---|---|
| URI versioning | `/v1/orders`, `/v2/orders` | Simplest. URI pollution. Breaks HATEOAS. |
| Header versioning | `Accept: application/vnd.api+v1` | Clean URIs. Harder to test in browser. |
| Query parameter | `/orders?version=1` | Easy to test. Non-standard. |
| Content negotiation | `Accept: application/json;version=1` | Standards-compliant. Complex for clients. |

**Recommendation**: Use URI versioning for public APIs (simplest for consumers). Use header versioning for internal APIs (cleaner, more flexible).

### GraphQL

**Description**: Schema-first query language. Clients specify exactly the fields they need. Single endpoint. Strongly typed schema defines the data graph. Resolvers map schema fields to data sources.

**When to Use**: Multiple client types with different data needs. Complex, deeply nested data relationships. Rapid frontend iteration where API changes are frequent. When over-fetching and under-fetching are real problems.

**When NOT to Use**: Simple CRUD APIs. When caching is critical (GraphQL is harder to cache than REST). When the client is fully controlled by the backend team. When query complexity needs strict server-side control.

**Federation for Microservices**:

In a microservices architecture, GraphQL federation composes a unified graph from multiple services:

```
┌──────────────┐
│   Gateway    │  ← Single GraphQL endpoint for clients
│  (Apollo     │
│   Router)    │
└───┬────┬─────┘
    │    │
┌───▼──┐ ┌▼─────┐
│Users │ │Orders│  ← Each service owns its subgraph
│subgr.│ │subgr.│
└──────┘ └──────┘
```

**N+1 Problem**: A naive resolver makes one query for the parent, then N queries for each child. DataLoader solves this by batching and caching: collect all child IDs, make one query, return results mapped to parents.

```
// WITHOUT DataLoader: N+1 queries
for each order:
    user = user_service.get(order.user_id)  // 1 query per order

// WITH DataLoader: 2 queries total
orders = order_service.get_all()
user_ids = [order.user_id for order in orders]
users = user_service.get_batch(user_ids)    // 1 batched query
```

**Real-World Reference**: **GitHub** migrated from REST to GraphQL for their v4 API. The motivation: their REST API required multiple round-trips to assemble a single screen's data. GraphQL lets clients fetch exactly what they need in one request.

### gRPC

**Description**: High-performance RPC framework using Protocol Buffers (binary serialization) and HTTP/2. Supports unary, server-streaming, client-streaming, and bidirectional streaming.

**When to Use**: Internal service-to-service communication. When performance and type safety are priorities. Polyglot environments (protobuf generates clients in 10+ languages). When you need bidirectional streaming.

**When NOT to Use**: Public APIs consumed by browser clients (browser gRPC support is limited). When human-readability of requests is important for debugging. When clients can't handle protobuf.

**Streaming Patterns**:

| Pattern | Client | Server | Use Case |
|---|---|---|---|
| Unary | 1 request | 1 response | Standard RPC |
| Server streaming | 1 request | Stream of responses | Log tailing, live updates |
| Client streaming | Stream of requests | 1 response | File upload, telemetry |
| Bidirectional | Stream | Stream | Chat, real-time collaboration |

### AsyncAPI / Event-Driven APIs

**Description**: AsyncAPI is the event-driven equivalent of OpenAPI (REST). It specifies event contracts: channel definitions, message schemas, bindings to message brokers.

**Event Contract Design**:

```
// Event contract (AsyncAPI-style)
event OrderPlaced:
    // Schema
    order_id: UUID (required, immutable)
    customer_id: UUID (required)
    items: Array<OrderItem> (required, min 1)
    total: Decimal (required, positive)
    timestamp: DateTime (required, immutable)

    // Compatibility rules
    // - New fields must have defaults (forward compatibility)
    // - Never remove required fields (backward compatibility)
    // - Never change field types
```

**Schema Evolution Rules**:
- Add optional fields freely.
- Add required fields only with a default value.
- Never remove a field that consumers might depend on (deprecate first, remove in a later version).
- Never change a field's type (treat it as a new field and deprecate the old one).
- Use schema registry to enforce compatibility checks at the pipeline level.

### API Gateway Patterns

**Rate Limiting**: Protect backend services from overload. Strategies: token bucket (burst-friendly), sliding window (precise), fixed window (simple but allows edge bursts).

**Authentication**: Centralize auth at the gateway. Downstream services trust the gateway's auth headers. Never propagate raw credentials to backend services.

**Routing**: Path-based (`/users/*` → user service), header-based (`X-Tenant: eu` → EU cluster), content-based (GraphQL operation name → appropriate service).

**Aggregation**: Combine responses from multiple services into a single client response. (See § Facade)

### API Versioning and Backward Compatibility

**Backward Compatibility Rules**:
- Never remove a field that is in the documented API contract.
- Never change the meaning of an existing field.
- Never change the type of a response field.
- New required request fields break backward compatibility. Make them optional with a sensible default.
- New response fields are always backward-compatible.

**Deprecation Strategy**: Announce deprecation → support old version for N release cycles → monitor usage → remove when usage drops below threshold. Never remove without monitoring.


## Integration Patterns

Based on *Enterprise Integration Patterns* (Hohpe & Woolf). These patterns govern how independent systems communicate. At architecture scale, integration is not just connecting two systems. It's defining the contracts, guarantees, and failure modes of every connection.

### Message Channel

**Point-to-Point**: One sender, one receiver. Exactly-once delivery semantics. Use for commands that must be processed by a specific service.

**Publish-Subscribe**: One sender, many receivers. At-least-once delivery. Each subscriber gets a copy. Use for events where multiple services need to react.

**Dead Letter Channel**: Messages that cannot be delivered or processed go to a dead letter queue. Essential for production reliability. Without a dead letter channel, failed messages are silently lost.

### Message Router

**Content-Based Router**: Route messages to different channels based on message content. Example: `order.type == "domestic"` → domestic shipping channel, `order.type == "international"` → international shipping channel.

**Message Filter**: Discard messages that don't match criteria. Example: analytics pipeline filters out test traffic before processing.

**Splitter**: Break a compound message into individual messages, each processed independently. Example: an order message split into individual line items for inventory reservation.

**Aggregator**: Collect related messages, correlate them, and publish a combined result. Example: wait for all line item reservations to complete, then publish "order confirmed."

### Message Transformer

**Envelope Wrapper**: Add metadata (correlation ID, timestamp, source) to a message without modifying the payload.

**Content Enricher**: Fetch additional data to complete a message. Example: an order event contains a customer ID. The enricher fetches the customer's current tier and adds it to the event.

**Normalizer**: Convert different message formats into a canonical format. Essential when integrating with multiple external systems that each use different schemas.

### Messaging Endpoints

**Polling Consumer**: Consumer periodically checks for messages. Simple but adds latency and wastes resources when the queue is empty.

**Event-Driven Consumer**: Consumer is invoked when a message arrives. Lower latency, more efficient. Standard for modern message brokers.

**Competing Consumers**: Multiple consumers pull from the same queue. Enables horizontal scaling of message processing. Each message is processed by exactly one consumer.

### Saga Pattern

Distributed transaction pattern for long-running business processes. Each step is a local transaction with a compensating transaction for rollback.

This pattern is defined in software-architecture-distributed.md § Saga Pattern. The integration-relevant aspects:

- **Choreography**: Each service publishes events and listens for events. Services coordinate without a central controller. More loosely coupled but harder to understand the full workflow.
- **Orchestration**: A saga orchestrator manages the workflow, calling each service and handling compensation on failure. Easier to reason about but introduces a central coordinator.

### Anti-Corruption Layer

Protects your domain model from external system models. Every integration with a legacy system or third-party API should go through an ACL that translates between the external model and your domain model. (See § Adapter)

Without an ACL, the external system's model leaks into your domain. You start using their field names, their constraints, their quirks. When they change, you change. The ACL absorbs that impact.

### Real-World Integration Systems

**Apache Kafka**: Distributed commit log. Append-only, partitioned, replicated. Consumers maintain their own offset. Supports replay, which makes it ideal for event sourcing and CQRS. (See software-architecture-distributed.md § Event Sourcing)

**RabbitMQ**: Traditional message broker. Exchanges route messages to queues based on routing keys. Supports complex routing topologies (direct, topic, fanout, headers exchanges). Better for traditional messaging patterns with complex routing rules.

| Factor | Kafka | RabbitMQ |
|---|---|---|
| Primary use | Event streaming, log | Traditional messaging |
| Message retention | Configurable retention period | Deleted after consumption |
| Throughput | Millions of messages/sec | Tens of thousands/sec |
| Routing | Simple: topic-based | Complex: exchanges, bindings |
| Message ordering | Per partition | Per queue (with caveats) |


## Refactoring & Legacy Patterns

Legacy systems are not failures. They are systems that have survived. But they accumulate technical debt that must be managed. These patterns let you modernize safely.

### Strangler Fig

**Description**: Incrementally replace a legacy system by intercepting requests and routing them to new implementations. The new system "strangles" the old one, branch by branch, until the old system is fully replaced.

**When to Use**: Replacing a system that cannot be rewritten in one go. The system must remain operational during the migration.

**Risk Profile**: Low. Each intercepted endpoint can be rolled back independently. If the new implementation fails, route back to the old one.

**Rollback Strategy**: Per-endpoint. If `/orders` fails on the new system, route `/orders` back to the legacy system without affecting other endpoints.

```
Phase 1: Route everything to legacy
┌──────────┐     ┌──────────┐
│  Router  │────▶│  Legacy  │
└──────────┘     └──────────┘

Phase 2: Strangle one endpoint
┌──────────┐     ┌──────────┐
│  Router  │────▶│ /orders  │──▶ New Order Service
│          │     │ /users   │──▶ Legacy (unchanged)
└──────────┘     └──────────┘

Phase 3: All endpoints strangled
┌──────────┐     ┌──────────┐
│  Router  │────▶│  New     │
└──────────┘     │  System  │
                 └──────────┘
```

**Real-World Reference**: **Netflix** migrated from a monolithic datacenter application to AWS microservices using the Strangler Fig. They incrementally moved functionality to AWS, routing requests through a traffic manager. The migration took years but the service never went down.

### Branch by Abstraction

**Description**: Create an abstraction layer over the component to replace. Implement the new component behind the same abstraction. Switch the abstraction to point to the new implementation. Remove the old.

**When to Use**: Replacing a component within a running system (database driver, payment provider, search engine). The rest of the system must not change.

**Risk Profile**: Low. The abstraction layer provides a clear seam. Both implementations exist simultaneously. Switching is a configuration change.

**Rollback Strategy**: Flip the abstraction back to the old implementation. Instantaneous if the abstraction layer is well-designed.

```
Step 1: Introduce abstraction
System → [Abstraction] → Legacy DB Driver

Step 2: Implement new behind abstraction
System → [Abstraction] → Legacy DB Driver
                       → New DB Driver (in parallel, read-only)

Step 3: Switch
System → [Abstraction] → New DB Driver

Step 4: Remove legacy
System → [Abstraction] → New DB Driver
Legacy DB Driver: removed
```

### Parallel Run

**Description**: Run old and new systems simultaneously. Send identical inputs to both. Compare outputs. When the new system's outputs consistently match the old system's, switch.

**When to Use**: High-risk replacements where correctness is critical (financial calculations, medical systems, billing engines). You need proof that the new system produces identical results.

**Risk Profile**: Very low during parallel run. Moderate at cutover. The parallel run proves correctness before the switch.

**Rollback Strategy**: During parallel run, the old system is still the source of truth. Rollback is instant. After cutover, fall back to the old system if issues are detected.

### Feature Flags

**Description**: Decouple deployment from release. Code is deployed to production but disabled by a flag. Features are enabled/disabled at runtime without redeployment.

**When to Use**: Continuous delivery. A/B testing. Canary releases. Kill switches for risky features.

**Risk Profile**: Low if flags are short-lived. High if flags accumulate and create untested code paths.

**Rules**:
- Every flag has an owner and an expiry date.
- Remove flags within 2 sprints of full rollout.
- Test with flags ON and OFF.
- Never nest flags (flag B depends on flag A being ON). Combinatorial explosion of untested states.

### Seam

From *Working Effectively with Legacy Code* (Feathers). A seam is a place in the code where you can alter behavior without editing in that place. Every seam is an opportunity to introduce tests or replace behavior.

**Types of Seams**:
- **Link seam**: Replace a dependency at link time (e.g., mock library in test).
- **Object seam**: Replace an object at runtime (e.g., dependency injection).
- **Preprocessing seam**: Use preprocessor directives to swap implementations.

**When to Use**: Introducing tests into untested legacy code. The key insight from Feathers: identify seams first, then write characterization tests at those seams, then refactor.

### When Each Applies

| Pattern | Legacy System Active? | Risk Level | Speed | Use Case |
|---|---|---|---|---|
| Strangler Fig | Yes, during migration | Low | Slow | Full system replacement |
| Branch by Abstraction | Yes, during migration | Low | Medium | Component replacement |
| Parallel Run | Yes, during verification | Very Low | Slow | High-correctness systems |
| Feature Flags | Yes | Low | Fast | Incremental rollout |
| Seam | Yes | Low | Fast | Adding tests, small refactors |


## Pattern Selection Methodology

Choosing the right pattern is not a matter of taste. It's a structured decision process that starts with requirements and ends with a traceable rationale.

### Selection Process

1. **Requirements**: What must the system do? Functional requirements define scope. Quality attribute requirements define shape.

2. **Quality Attributes**: Rank the quality attributes by priority. No system optimizes for everything. (See software-architecture-core.md § Quality Attribute Trade-off Matrix) The top 2-3 quality attributes drive pattern selection.

3. **Constraints**: What can't you change? Technology stack, team size, budget, timeline, regulatory requirements. Constraints eliminate patterns.

4. **Scale Context**: What scale tier are you in now? What tier are you growing into? (See software-architecture-core.md § Scale Context Framework) Patterns that are right at one tier are wrong at another.

5. **Pattern Candidates**: Generate 2-3 candidate patterns that satisfy the quality attributes and constraints.

6. **Trade-off Analysis**: For each candidate, articulate what you gain and what you sacrifice. (See software-architecture-core.md § Trade-Off Analysis Template)

7. **Decision**: Select the pattern with the best trade-off profile for your specific context. Document in an ADR. (See software-architecture-core.md § ADR Template)

### Common Decision Points

**Sync vs Async**:

| Factor | Synchronous | Asynchronous |
|---|---|---|
| Latency requirement | Sub-second | Seconds to minutes acceptable |
| Coupling | Tighter (caller waits) | Looser (fire and forget) |
| Error handling | Immediate (exception) | Delayed (dead letter, retry) |
| Throughput | Limited by slowest service | High (producer doesn't wait) |
| Debugging | Simple (call stack) | Complex (distributed tracing) |

**Decision Rule**: Use synchronous when the caller needs an immediate response to proceed. Use asynchronous when the caller doesn't need the result immediately, or when producer and consumer have different throughput profiles, or when you need to decouple deployment schedules.

**Push vs Pull**:

| Factor | Push (events, webhooks) | Pull (polling, REST) |
|---|---|---|
| Timeliness | Near real-time | Polling interval latency |
| Consumer control | Producer decides when | Consumer decides when |
| Back-pressure | Built-in (queue depth) | Consumer can stop polling |
| Complexity | Consumer needs listener | Consumer needs scheduler |

**Decision Rule**: Push for near real-time updates and high throughput. Pull for simple consumers and when the consumer needs control over timing.

**Orchestration vs Choreography**:

| Factor | Orchestration | Choreography |
|---|---|---|
| Workflow visibility | Centralized | Distributed |
| Coupling | Higher (to orchestrator) | Lower (to events only) |
| Adding steps | Modify orchestrator | Add new consumer |
| Debugging | Easier (workflow in one place) | Harder (events across services) |
| Single point of failure | Orchestrator | Broker (mitigated by clustering) |

**Decision Rule**: Use orchestration for complex workflows where visibility and debugging matter. Use choreography for simpler workflows where loose coupling is the priority. Many systems use a hybrid: orchestration for the main workflow, choreography for side effects (notifications, analytics, audit).

**Stateful vs Stateless**:

| Factor | Stateful | Stateless |
|---|---|---|
| Scalability | Harder (sticky sessions, state replication) | Easy (any instance handles any request) |
| Performance | Faster (no state fetch per request) | Slower (state must be fetched) |
| Resilience | State loss = data loss | Instance failure = no data loss |
| Simplicity | Natural for stateful domains | Requires external state store |

**Decision Rule**: Stateless by default. Add statefulness only when the performance benefit justifies the scaling cost. If you need state, push it to a dedicated state store (Redis, database), not to the application instance.

### Decision Tables

**Architectural Style Selection**:

| Requirement | Recommended Style |
|---|---|
| Small team, early product | Monolith (modular) |
| CRUD, simple business logic | Layered |
| Team 10-50, need deploy independence | Service-Based |
| Complex workflows, high throughput | Event-Driven |
| Third-party extensibility | Microkernel |
| Data pipeline, ETL | Pipe-and-Filter |
| Extreme scale, variable load | Space-Based |
| Team 50+, fine-grained scaling | Microservices |

**API Style Selection**:

| Requirement | Recommended API Style |
|---|---|
| Public API, unknown clients | REST |
| Multiple client types, complex data | GraphQL |
| Internal service-to-service, high perf | gRPC |
| Event-driven, async workflows | AsyncAPI / Events |
| Browser-to-backend, real-time | WebSocket (supplemental) |

**Integration Pattern Selection**:

| Requirement | Pattern |
|---|---|
| One-to-one, guaranteed delivery | Point-to-Point Channel |
| One-to-many, loose coupling | Publish-Subscribe Channel |
| Route based on content | Content-Based Router |
| Protect domain from external model | Anti-Corruption Layer |
| Long-running business transaction | Saga (See software-architecture-distributed.md § Saga Pattern) |
| Collect correlated messages | Aggregator |
| Failed message handling | Dead Letter Channel |


## Patterns Checklist

Use this checklist when selecting and applying architectural patterns. Every "no" answer requires justification.

### Pattern Selection

- [ ] Have you ranked quality attributes by priority before selecting patterns?
- [ ] Does the selected architectural style match your current scale tier? (See software-architecture-core.md § Scale Context Framework)
- [ ] Have you articulated what you gain AND what you sacrifice with this pattern?
- [ ] Have you documented the pattern selection decision in an ADR?
- [ ] Is the pattern the simplest thing that works at your scale? (See software-architecture-core.md § Simplicity First)
- [ ] Have you considered how the system will evolve to the next scale tier?

### Pattern Application

- [ ] Is the pattern explicitly named in your architecture documentation?
- [ ] Are the pattern's constraints (e.g., "layer N may only call layer N-1") enforced or merely documented?
- [ ] Does every team member who touches the system understand the pattern and its rationale?
- [ ] Is there a fitness function that validates the pattern is being followed? (e.g., architecture unit tests for layer dependency direction)
- [ ] Are pattern violations detectable automatically (static analysis) or only by manual review?

### API Patterns

- [ ] Is the API versioned? Is the versioning strategy documented?
- [ ] Are backward compatibility rules enforced by CI pipeline checks?
- [ ] For GraphQL: is there a query complexity limit and depth limit?
- [ ] For REST: are HTTP status codes used consistently and semantically?
- [ ] For events: is there a schema registry? Are compatibility checks automated?

### Integration Patterns

- [ ] Is there a dead letter channel for every message queue?
- [ ] Are message retry policies defined (max retries, backoff strategy)?
- [ ] Is idempotency guaranteed for all message consumers? (See software-architecture-distributed.md § Idempotency)
- [ ] Do external integrations go through an Anti-Corruption Layer?

### Legacy Refactoring

- [ ] Is the legacy system's behavior characterized by tests before refactoring begins?
- [ ] Does each refactoring step have a rollback plan?
- [ ] Are feature flags tracked with owners and expiry dates?
- [ ] Can you deploy the new implementation alongside the old one (parallel run or branch by abstraction)?


## Book Source Appendix

This appendix maps each section to its source material. These are the canonical references for the concepts in this Skill.

| Section | Primary Sources |
|---|---|
| Pattern Thinking | *Design Patterns: Elements of Reusable Object-Oriented Software* (Gamma, Helm, Johnson, Vlissides), *Head First Design Patterns* (Freeman), *POSA Vol. 1* (Buschmann et al.) |
| Architectural Styles Catalog | *Fundamentals of Software Architecture* (Richards & Ford), *Software Architecture in Practice* (Bass, Clements, Kazman), *Building Microservices* (Newman) |
| Code-Level Patterns at Architecture Scale | *Design Patterns* (GoF), *Patterns of Enterprise Application Architecture* (Fowler), *Implementing Domain-Driven Design* (Vernon) |
| POSA Patterns | *POSA Vol. 1: A System of Patterns* (Buschmann, Meunier, Rohnert, Sommerlad, Stal), *POSA Vol. 2: Patterns for Concurrent and Networked Objects* (Schmidt et al.), *POSA Vol. 4: A Pattern Language for Distributed Computing* (Buschmann, Henney, Schmidt), *POSA Vol. 5: On Patterns and Pattern Languages* (Buschmann, Henney, Schmidt) |
| API Design Patterns | *RESTful Web APIs* (Richardson, Amundsen), *GraphQL in Action* (Buna), *gRPC: Up and Running* (Indrasiri, Kuruppu), *The Design of Web APIs* (Lauret) |
| Integration Patterns | *Enterprise Integration Patterns* (Hohpe, Woolf), *Kafka: The Definitive Guide* (Narkhede, Shapira, Palino), *RabbitMQ in Depth* (Roy) |
| Refactoring & Legacy Patterns | *Working Effectively with Legacy Code* (Feathers), *Refactoring: Improving the Design of Existing Code* (Fowler), *Monolith to Microservices* (Newman) |
| Pattern Selection Methodology | *Fundamentals of Software Architecture* (Richards & Ford), *The Pragmatic Programmer* (Hunt, Thomas), *Code Complete* (McConnell), *Clean Code* (Martin), *Software Architecture: The Hard Parts* (Ford, Richards, Sadalage, Dehghani) |
| Architecture Ethics & General Principles | *The Pragmatic Programmer* (Hunt, Thomas), *Code Complete* (McConnell), *Clean Code* (Martin), *Clean Architecture* (Martin) |

**Note on Source Usage**: This Skill does not reproduce book content. It synthesizes patterns from these sources into a unified decision framework, organized by architectural concern rather than by source. Where books disagree (e.g., microservices vs. monolith orthodoxy), this Skill presents the trade-offs and lets the architect decide based on their specific context.
