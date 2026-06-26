---
name: software-architecture-ddd
description: Domain-Driven Design for the Software Architecture suite. Covers strategic DDD (bounded contexts, context mapping, subdomains, ubiquitous language), tactical DDD (aggregates, entities, value objects, domain events, repositories, domain services, application services, factories), DDD and microservices interplay, Event Storming methodology, and DDD anti-patterns. Includes OSS case studies.
---

## DDD Philosophy and When to Apply

DDD is not a set of patterns to apply everywhere. DDD is a methodology for complex domains where the business logic is the competitive advantage and the domain model is the primary source of value. If your system's complexity is technical (high throughput, distributed consensus, real-time constraints) rather than domain-driven (complex business rules, evolving regulations, multiple stakeholder groups with conflicting requirements), DDD's overhead is not justified.

### When to Apply DDD

Apply DDD when three or more of these conditions are true:

- **Complex business rules**: The domain has rules that are non-obvious, interdependent, and change over time. If the rules can be described in a few sentences, you don't need DDD.
- **Multiple teams**: Different teams work on different parts of the system, and coordination overhead is becoming a bottleneck. Bounded contexts provide team boundaries.
- **Evolving domain**: The business is discovering new rules, new products, or new customer segments. The domain model will change significantly over the system's lifetime.
- **Domain experts available**: You have access to people who understand the domain deeply and are willing to collaborate. DDD without domain experts is architecture theater.
- **Competitive advantage in the domain**: The business logic is what differentiates the product from competitors. If you're building a generic CRUD app with a competitive advantage in UX or distribution, invest in those areas instead.

### When NOT to Apply DDD

- **CRUD applications**: The domain is create-read-update-delete with no complex business rules. Applying entities, aggregates, and domain events to a CRUD app adds ceremony with no benefit.
- **Tech-heavy, domain-light systems**: Message brokers, API gateways, monitoring infrastructure, CI/CD pipelines. These systems have architectural complexity but negligible domain complexity.
- **Throwaway prototypes**: DDD's upfront investment in understanding the domain is wasted if the system will be discarded in 3 months.
- **When you don't have domain expert access**: Without domain experts, ubiquitous language becomes developer language, and the model diverges from the business. You're better off with simpler patterns.

### Ubiquitous Language

**Definition**: A shared vocabulary between developers and domain experts, used consistently in code, conversations, and documentation. The language is bounded to a specific bounded context. Different bounded contexts may use different terms for the same real-world concept.

**Key rules**:
- Domain experts define the terms. Developers translate them into the model.
- The same word in different bounded contexts means different things. "Account" in the Banking context is a financial instrument. "Account" in the Identity context is a login credential. This is not a bug. This is bounded contexts working correctly.
- Code must use the ubiquitous language. If domain experts say "policy lapses," the code must not say `Policy.setStatus(EXPIRED)`. It must say `Policy.lapse()`.
- If you can't find a word for a concept, you don't understand the concept. Ask the domain expert.
- If the code and the conversation use different words, the conversation is wrong or the code is wrong. Fix one.

**Scale Context**: At Solo/Startup, ubiquitous language is implicit (everyone talks to each other). At Growth, it must be explicit and documented per bounded context. At Scale, it must be enforced through code review and architecture fitness functions that detect terminology drift.

**From**: Domain-Driven Design (Evans, 2003), DDD Distilled (Vernon, 2016)


## Strategic DDD

Strategic DDD is about the big picture: where are the boundaries, how do contexts relate, and where should you invest? Strategic DDD matters more than tactical DDD. A system with well-chosen bounded contexts and mediocre tactical patterns outperforms a system with perfect aggregates in the wrong boundaries.

### Bounded Context

**Definition**: A boundary within which a domain model has a specific, well-defined meaning. Everything inside a bounded context speaks the same ubiquitous language. Everything inside a bounded context is consistent with the same model. When you cross a bounded context boundary, the model changes.

**When to Apply**: Always for any non-trivial system. Bounded contexts are not optional in DDD. They are the foundation. Even a monolith should have explicit bounded contexts enforced by package structure and code ownership.

**Trade-off Summary**: Explicit bounded contexts add complexity (translation between contexts, data duplication, eventual consistency). The payoff is independent evolution of each context. Without bounded contexts, the model becomes a single, inconsistent tangle where changing one concept breaks another.

**Real-World Reference**: Amazon's "two-pizza team" structure is bounded contexts at organizational scale. Each team owns a bounded context. Each bounded context exposes a well-defined interface (API). Teams do not share databases. The organization mirrors the architecture (Conway's Law). (See software-architecture-organization.md § Conway's Law)

**Examples of bounded contexts in an e-commerce system**:

| Context | Ubiquitous Language for "Customer" | Owns |
|---|---|---|
| Sales | A party that can place orders. Has: order history, credit limit, preferred payment method. | Order placement, pricing |
| Support | A party that can open tickets. Has: support tier, open cases, SLA level. | Ticket management, resolution |
| Marketing | A profile with segments and campaigns. Has: email preferences, browsing history, segment membership. | Campaign management, analytics |
| Shipping | A delivery destination. Has: addresses, delivery preferences, shipping zones. | Shipment tracking, logistics |

Each context has a different model of "Customer" with different attributes, different behavior, and different invariants. This is correct. A single, unified "Customer" model that serves all four contexts would be inconsistent (different rules in different contexts would conflict) and bloated (attributes that matter to one context are noise to another).

**Detection signal for missing bounded contexts**: Different teams argue about what a word means. The same database table has columns added for every use case. Changes in one "module" break another "module" that shouldn't be related.

**From**: Domain-Driven Design (Evans, 2003), Implementing DDD (Vernon, 2013)

### Context Mapping

Context mapping defines the relationships between bounded contexts. Every pair of communicating contexts has a relationship type. Choosing the right relationship type is one of the highest-leverage architectural decisions in DDD.

#### Partnership

**Definition**: Two contexts cooperate with aligned goals. Both teams collaborate on the interface. Changes are negotiated. Neither context dominates the other.

**When to use**: Contexts owned by teams that work closely together, share a product manager, or have a shared business goal. Both teams have equal stake in the integration's success.

**Trade-off**: Partnership requires ongoing communication and coordination. It does not scale to many contexts. Use for 2-3 closely related contexts, not for 20.

**Example**: Sales and Inventory contexts. Sales needs to know what's in stock. Inventory needs to know what's been sold. Neither context is "upstream" or "downstream" — they're partners.

#### Shared Kernel

**Definition**: A subset of the domain model that two or more contexts share. Both contexts can read and modify the shared kernel. Changes to the shared kernel must be coordinated between both teams.

**When to use**: When two contexts have a genuinely shared concept that changes for the same reasons in both contexts. Use sparingly — shared kernel is the tightest form of coupling between contexts.

**When NOT to use**: When the concept changes for different reasons in each context. If Sales cares about "Product.price" and Marketing cares about "Product.description," they should not share a Product model. Each should have its own.

**Trade-off**: Shared kernel reduces duplication (one model, one source of truth) at the cost of tight coupling (any change requires coordination). The coordination overhead grows with the number of contexts sharing the kernel.

**Detection signal for misuse**: Changes to the shared kernel require meetings with 3+ teams. One team wants to change the kernel but another team blocks it for reasons unrelated to their domain.

#### Customer-Supplier

**Definition**: The upstream context (supplier) provides a service or data. The downstream context (customer) consumes it. The upstream has more influence over the interface, but the downstream's needs are considered.

**When to use**: When one context provides foundational data that multiple downstream contexts depend on, and the upstream can accommodate downstream needs without compromising its own model.

**Trade-off**: The downstream gets what it needs (negotiated) but remains dependent on the upstream's release schedule and priorities. The upstream carries the burden of supporting multiple consumers.

**Example**: Product Catalog (upstream/supplier) provides product data to Sales, Marketing, and Shipping contexts (downstream/customers). The Catalog team considers downstream needs when designing the API but ultimately owns the product model.

#### Conformist

**Definition**: The downstream context conforms to the upstream's model with no negotiation. The downstream accepts the upstream's model as-is and adapts internally.

**When to use**: When the upstream is an external system, a legacy system that can't be changed, or a system owned by a team that won't negotiate. Also appropriate when the integration is simple enough that the cost of translation (ACL) exceeds the cost of conformity.

**Trade-off**: Conformity is cheap to implement but makes the downstream fragile. If the upstream changes its model, the downstream breaks. If the upstream's model is a poor fit for the downstream's domain, the downstream accumulates translation logic scattered throughout its code.

**Example**: Integrating with a third-party payment gateway. The payment gateway defines the API. You conform. You don't negotiate the schema with Stripe.

#### Anti-Corruption Layer (ACL)

**Definition**: A translation layer that protects the downstream context's model from the upstream's model. The ACL translates between the upstream's language and the downstream's ubiquitous language, preventing the upstream's concepts from leaking into the downstream.

**When to use**: When integrating with a legacy system, an external system, or any upstream whose model is a poor fit for the downstream's domain. Also when the upstream is unstable and you want to contain the blast radius of upstream changes.

**Trade-off**: ACL adds development and maintenance cost (translation code, testing, keeping the translation in sync). The payoff is model integrity: the downstream's domain model remains clean and consistent regardless of upstream changes.

**Implementation**: The ACL lives at the boundary of the downstream context. It is NOT part of the domain model. It is infrastructure.

```
// Anti-Corruption Layer: translates legacy CustomerRecord into domain Customer

// Domain model (clean, ubiquitous language)
class Customer:
    id: CustomerId
    name: CustomerName           // value object with validation
    contactInfo: ContactInfo     // value object
    status: CustomerStatus       // enum: Active, Suspended, Closed

// Legacy system model (messy, technical)
class LegacyCustomerRecord:
    cust_id: string              // "CUST-00123"
    first_name: string
    last_name: string
    email_addr: string
    phone_num: string | null
    account_flags: int           // bitmask: bit 0=active, bit 1=suspended, bit 2=archived
    last_modified: timestamp

// ACL: translates between them
class CustomerTranslator:
    // ACL lives at the context boundary, not in the domain
    toDomain(record: LegacyCustomerRecord): Customer
        name = CustomerName(record.first_name, record.last_name)
        email = Email.parse(record.email_addr)
        phone = record.phone_num ? PhoneNumber.parse(record.phone_num) : null
        contactInfo = ContactInfo(email, phone)
        status = mapFlagsToStatus(record.account_flags)
        id = CustomerId(record.cust_id.removePrefix("CUST-"))
        return Customer(id, name, contactInfo, status)

    mapFlagsToStatus(flags: int): CustomerStatus
        if flags & 4: return CustomerStatus.Closed
        if flags & 2: return CustomerStatus.Suspended
        if flags & 1: return CustomerStatus.Active
        return CustomerStatus.Closed  // unknown = closed, safe default
```

**From**: Domain-Driven Design (Evans, 2003), Implementing DDD (Vernon, 2013)

#### Open Host Service

**Definition**: The upstream context provides a well-defined protocol (API) that any downstream can use. The protocol is designed for external consumption, not as an afterthought.

**When to use**: When a context has many consumers and you want to reduce the integration burden. Instead of each consumer building its own ACL, the upstream provides a clean, stable interface.

**Trade-off**: The upstream invests in API design, documentation, versioning, and backward compatibility. This investment pays off when there are 3+ consumers. For 1-2 consumers, the investment is premature.

**Example**: A User Identity context exposes an Open Host Service with a REST API for authentication and authorization. Every other context consumes this API rather than duplicating user management.

#### Published Language

**Definition**: A shared language (schema, format, protocol) that multiple contexts use for communication. The published language is a separate artifact, not owned by any single context.

**When to use**: When multiple contexts need to exchange the same kind of data and you want a standardized format. Common in event-driven architectures where events are the published language.

**Trade-off**: The published language is a compromise. No context gets exactly the model it wants. Each context must translate between its internal ubiquitous language and the published language. The payoff is interoperability: any context that speaks the published language can integrate.

**Example**: An "OrderPlaced" event schema (JSON, Avro, Protobuf) that Sales publishes and Payments, Shipping, and Notification all consume. The schema is the published language. Each context translates the event into its own model.

#### Separate Ways

**Definition**: Two contexts have no integration. They operate independently. No shared data, no communication, no coordination.

**When to use**: When the cost of integration exceeds the benefit. If two contexts don't need to share data or coordinate, don't integrate them just because they're in the same system.

**Trade-off**: No integration cost but no shared functionality. Each context may duplicate data or logic that exists in the other. This is acceptable if the duplication is cheaper than the integration.

**Example**: The HR system and the Recommendation Engine. They have nothing to do with each other. Don't integrate them.

### Subdomains

Subdomains classify parts of the business by strategic importance. This classification drives investment decisions: where to build, where to buy, where to outsource.

| Type | Definition | Investment | Example |
|---|---|---|---|
| **Core Domain** | The part of the business that provides competitive advantage. This is why customers choose you over competitors. | Heavy investment. Build in-house. Invest in the best engineers. Model deeply. | For a bank: risk assessment models. For an e-commerce company: recommendation engine. For Uber: ride matching algorithm. |
| **Supporting Subdomain** | Necessary for the business to operate but not differentiating. Every competitor has something similar. | Moderate investment. Build in-house if off-the-shelf doesn't fit, but don't over-invest. | For a bank: customer onboarding UI. For e-commerce: order history viewer. For Uber: driver onboarding. |
| **Generic Subdomain** | Commodity capability. Solved problem. Every company needs it, nobody differentiates on it. | Minimal investment. Buy, use open source, or outsource. Do not build unless forced. | Authentication, payment processing, email delivery, logging, file storage. |

**Decision framework**: "If we built the best X in the world, would customers pay more for our product?" If yes, X is a core domain. If no but we still need X to operate, X is a supporting subdomain. If X is a solved problem that nobody differentiates on, X is generic.

**Scale Context**: At Solo/Startup, you may need to build generic subdomains because integrating with third-party services takes time you don't have. This is a temporary compromise, not an architectural decision. Plan to replace with off-the-shelf when you can afford the integration cost. At Growth and Scale, generic subdomains should be bought or outsourced.

**From**: Domain-Driven Design (Evans, 2003), DDD Distilled (Vernon, 2016)

### Context Map Visualization

Context maps use a consistent visual notation. Use this ASCII convention for documentation.

```
┌─────────────────────┐                    ┌─────────────────────┐
│                     │                    │                     │
│   Sales Context     │    Partnership     │  Inventory Context  │
│   (Core Domain)     │◄──────────────────►│  (Supporting)       │
│                     │                    │                     │
└──────────┬──────────┘                    └─────────────────────┘
           │
           │ Customer-Supplier
           │ (Sales = downstream/customer)
           ▼
┌─────────────────────┐                    ┌─────────────────────┐
│                     │                    │                     │
│  Product Catalog    │    Conformist      │  Payment Gateway    │
│  (Supporting)       │──────────────────►│  (External)         │
│                     │                    │                     │
└──────────┬──────────┘                    └─────────────────────┘
           │
           │ Open Host Service
           │ (REST API, Published Language: JSON Schema)
           ▼
┌─────────────────────┐
│                     │
│  Marketing Context  │
│  (Core Domain)      │
│                     │
│  ┌───────────────┐  │
│  │  ACL (Legacy  │  │──── Separate Ways ────► HR System
│  │  CRM Adapter) │  │
│  └───────────────┘  │
└─────────────────────┘

Relationship Legend:
◄──► Partnership    ──► Customer-Supplier (arrow points to downstream)
──► Conformist      ──► ACL (boxed inside consuming context)
──► OHS             ──► Published Language (label on arrow)
──► Separate Ways   ──► Shared Kernel (overlapping boxes, rarely shown)
```

**From**: Domain-Driven Design (Evans, 2003), Learning DDD (Khononov, 2021)


## Tactical DDD

Tactical DDD is about the building blocks inside a bounded context. These patterns implement the domain model. Use them when the domain is complex enough to justify them. For simple subdomains, simpler patterns (Transaction Script, Table Module) are appropriate.

### Entity

**Definition**: An object with a unique identity that persists across state changes. Two entities are equal if they have the same identity, regardless of their other attributes.

**When to Apply**: When an object has a lifecycle and its identity matters across state changes. A Customer who changes their email address is still the same Customer. An Order that moves from "pending" to "shipped" is still the same Order.

**Trade-off Summary**: Entities require identity management (generating IDs, looking up by ID, handling duplicates). This adds complexity compared to value objects. Use entities only when identity matters.

**Real-World Reference**: Bank accounts. An account's balance changes daily, but the account itself persists. You identify it by account number, not by its current balance.

```
// Entity: identity defined by OrderId, state changes over time
entity Order:
    identity: OrderId           // UUID, database sequence, or domain-specific identifier
    mutable state:
        customerId: CustomerId
        items: List[OrderItem]  // value objects
        status: OrderStatus     // Pending → Confirmed → Shipped → Delivered → Cancelled
        placedAt: DateTime
        total: Money            // value object

    // Behavior, not getters/setters
    confirm(): void
        precondition: status == OrderStatus.Pending
        status = OrderStatus.Confirmed
        addEvent(OrderConfirmed(this.id, this.customerId, now()))

    ship(trackingNumber: String): void
        precondition: status == OrderStatus.Confirmed
        status = OrderStatus.Shipped
        addEvent(OrderShipped(this.id, trackingNumber, now()))

    cancel(reason: String): void
        precondition: status in [OrderStatus.Pending, OrderStatus.Confirmed]
        status = OrderStatus.Cancelled
        addEvent(OrderCancelled(this.id, reason, now()))

// Identity equality: two Orders are the same if they have the same OrderId
equals(other: Order): Boolean = this.id == other.id
```

**Checklist**:
- [ ] Entity has a clear, unique identity
- [ ] Entity behavior is expressed as methods, not getters/setters
- [ ] Entity enforces its own invariants (preconditions on state transitions)

### Value Object

**Definition**: An object without identity, defined entirely by its attributes. Two value objects are equal if all their attributes are equal. Value objects are immutable.

**When to Apply**: When an object's meaning comes from its values, not its identity. Money, dates, addresses, email addresses, measurements, ranges. Also: when you want to encapsulate validation and behavior around a primitive type.

**Trade-off Summary**: Value objects add classes and instantiation overhead compared to primitives. The payoff is type safety (you can't pass a String where a Money is expected), centralized validation, and behavior encapsulation.

**Real-World Reference**: `java.time.LocalDate` in Java. Immutable. Equality by value. Behavior-rich (plusDays, isBefore, format). You never ask "which LocalDate is this?" because identity is irrelevant.

```
// Value object: no identity, defined by attributes, immutable
value object Money:
    attributes:
        amount: Decimal
        currency: Currency     // enum: USD, EUR, GBP, JPY

    // Structural equality: same amount + same currency = same Money
    equals(other: Money): Boolean =
        this.amount == other.amount AND this.currency == other.currency

    // Behavior: operations return new instances (immutable)
    add(other: Money): Money
        precondition: this.currency == other.currency
        return Money(this.amount + other.amount, this.currency)

    multiply(factor: Decimal): Money
        return Money(this.amount * factor, this.currency)

    // Validation at construction
    constructor(amount: Decimal, currency: Currency)
        precondition: amount >= 0
        this.amount = amount
        this.currency = currency

value object EmailAddress:
    attributes:
        value: String

    constructor(value: String)
        precondition: value matches emailRegex
        this.value = value.toLowerCase()

    domain(): String = value.split("@")[1]
    localPart(): String = value.split("@")[0]
```

**Checklist**:
- [ ] Value object is immutable (all operations return new instances)
- [ ] Equality is structural (all attributes compared)
- [ ] Validation happens at construction (impossible to create an invalid value object)
- [ ] Value object has domain behavior, not just data holders

### Aggregate

**Definition**: A cluster of entities and value objects with a single root entity (the aggregate root). The aggregate is the transactional consistency boundary: all changes within an aggregate must be consistent at the end of a transaction. External references point only to the aggregate root, never to internal entities.

**When to Apply**: When you have a group of objects that must be consistent together. An Order and its OrderItems must be consistent: you can't have an OrderItem that references a nonexistent Order, and the Order's total must equal the sum of its OrderItems' prices.

**Trade-off Summary**: Aggregates constrain how you access and modify objects (you must go through the root). This adds indirection but ensures consistency. The key trade-off is aggregate size: larger aggregates guarantee more consistency but create more contention and reduce throughput.

**Real-World Reference**: Git commits. A commit (aggregate root) contains a tree, blobs, author, message, and parent references. You never modify a blob directly. You create a new commit that references the blob. The commit is the consistency boundary.

**Rules for aggregate design**:
1. **Reference aggregates by identity only**: Store `orderId` not the `Order` object. Load the Order through its repository if you need it.
2. **Keep aggregates small**: Start with one entity per aggregate. Add a second entity only when a consistency invariant requires it. If an aggregate has 4+ entities, it's almost certainly too large.
3. **One aggregate per transaction**: Modify one aggregate per database transaction. If you need to modify two aggregates in the same business operation, use eventual consistency and domain events.
4. **The aggregate root enforces all invariants**: No code outside the aggregate can put the aggregate into an invalid state. The root's public methods are the only way to modify the aggregate.

```
// Aggregate: Order is the aggregate root
// Consistency boundary: Order and its OrderItems must be consistent

aggregate root Order:
    identity: OrderId
    // Internal entities, only accessible through the root
    items: List[OrderItem]         // entity (has identity within the aggregate)
    shippingAddress: Address       // value object
    status: OrderStatus
    total: Money

    // Factory method: creates the aggregate in a valid state
    static create(customerId: CustomerId, shippingAddress: Address): Order
        return Order(
            id = OrderId.generate(),
            customerId = customerId,
            items = [],
            shippingAddress = shippingAddress,
            status = OrderStatus.Pending,
            total = Money.zero(shippingAddress.country.currency)
        )

    // Only way to add an item — root enforces the invariant
    addItem(productId: ProductId, quantity: Int, unitPrice: Money): void
        precondition: status == OrderStatus.Pending
        precondition: quantity > 0
        item = OrderItem(OrderItemId.generate(), productId, quantity, unitPrice)
        items.append(item)
        recalculateTotal()         // invariant: total = sum of item totals

    recalculateTotal(): void
        total = items.fold(Money.zero(currency), (sum, item) => sum.add(item.subtotal()))

// Internal entity: exists only within the Order aggregate
entity OrderItem:
    identity: OrderItemId          // identity is local to this aggregate
    productId: ProductId           // reference by identity to Product aggregate
    quantity: Int
    unitPrice: Money

    subtotal(): Money = unitPrice.multiply(Decimal(quantity))

// WRONG: direct access to internal entity
order.items[0].quantity = 5        // FORBIDDEN: bypasses aggregate root

// RIGHT: access through aggregate root
order.addItem(productId, 5, unitPrice)  // root enforces invariants
```

**Checklist**:
- [ ] Aggregate root is the only entry point for modifications
- [ ] All invariants are enforced by the aggregate root
- [ ] References to other aggregates are by identity only
- [ ] Aggregate size: 1-3 entities maximum
- [ ] One aggregate modified per transaction

### Domain Event

**Definition**: Something that happened in the domain that domain experts care about. Named in past tense. Immutable. Carries the data needed for consumers to react.

**When to Apply**: When something happens in one bounded context that other contexts need to know about. When you need to trigger side effects without coupling the trigger to the effect. When you need an audit trail of what happened.

**Trade-off Summary**: Domain events decouple producers from consumers (producer doesn't know who's listening). This adds infrastructure (event bus, schema management) and eventual consistency (consumers react asynchronously). The payoff is loose coupling and independent evolvability.

**Naming convention**: Past tense, domain language. `OrderPlaced`, `PaymentReceived`, `ShipmentDelivered`, `CustomerRelocated`. Never `OrderCreatedEvent` (the "Event" suffix is redundant and not domain language). Never `OrderStatusChanged` (too generic, doesn't say what happened).

**Event persistence patterns**: (See software-architecture-distributed.md § Event Sourcing) for event sourcing and event store patterns. Domain events can be used without event sourcing (just publish them after persisting state). Event sourcing takes domain events further by using them as the primary source of truth.

```
// Domain event: immutable, past-tense, carries relevant data
domain event OrderPlaced:
    orderId: OrderId
    customerId: CustomerId
    items: List[OrderItemSnapshot]     // snapshot, not live objects
    total: Money
    placedAt: DateTime

// Published after the aggregate is persisted
// Consumers: Payment context (initiates payment), Shipping context (reserves capacity),
//            Notification context (sends confirmation email)

// Producer side (in Application Service):
placeOrder(command: PlaceOrderCommand):
    order = Order.create(command.customerId, command.shippingAddress)
    for item in command.items:
        order.addItem(item.productId, item.quantity, item.unitPrice)
    orderRepository.save(order)
    // After persistence, publish the event
    eventBus.publish(OrderPlaced(
        orderId = order.id,
        customerId = order.customerId,
        items = order.items.map(toSnapshot),
        total = order.total,
        placedAt = now()
    ))
```

**Checklist**:
- [ ] Event named in past tense using domain language
- [ ] Event is immutable
- [ ] Event carries all data consumers need (no need to query back)
- [ ] Event published after state is persisted (to avoid phantom events)

### Repository

**Definition**: An abstraction for aggregate persistence. One repository per aggregate root. The repository hides the storage mechanism behind a collection-like interface.

**When to Apply**: For every aggregate root that needs persistence. The repository is the boundary between the domain model and the persistence infrastructure.

**Trade-off Summary**: Repository adds an abstraction layer over the database. The payoff is that the domain model doesn't know about databases, ORMs, or SQL. You can change the storage mechanism without changing the domain model.

```
// Repository interface (in domain layer, no infrastructure dependencies)
interface OrderRepository:
    save(order: Order): void
    findById(id: OrderId): Order | null
    findByCustomerId(customerId: CustomerId): List[Order]
    findPendingOrders(): List[Order]

// Usage in Application Service:
confirmOrder(orderId: OrderId):
    order = orderRepository.findById(orderId)
    if order == null: throw OrderNotFound(orderId)
    order.confirm()
    orderRepository.save(order)     // repository handles the persistence details
```

**Checklist**:
- [ ] One repository per aggregate root (not per entity)
- [ ] Repository interface defined in domain layer, implementation in infrastructure
- [ ] Repository returns aggregates, not database rows

### Domain Service

**Definition**: A stateless operation that doesn't naturally belong to an entity or value object. Domain services contain domain logic, not infrastructure logic.

**When to Apply**: When a business operation involves multiple aggregates or when the logic doesn't fit cleanly into any single entity. If the logic can fit on an entity, put it on the entity. Domain services are for logic that spans entities.

**When NOT to Apply**: Don't use domain services as a dumping ground for all logic. Anemic domain models happen when entities have no behavior and domain services have everything. If you have many domain services, your entities are probably anemic.

```
// Domain service: pricing logic that involves multiple concerns
domain service PricingService:
    calculateDiscount(order: Order, customer: Customer): Money
        baseDiscount = customer.loyaltyTier.baseDiscount()
        volumeDiscount = if order.total > Money(1000, order.currency)
            then order.total.multiply(Decimal(0.05))
            else Money.zero(order.currency)
        seasonalDiscount = getSeasonalDiscount(now())
        // Domain logic that involves Customer, Order, and business rules
        return maxOf(baseDiscount, volumeDiscount, seasonalDiscount)
```

**Checklist**:
- [ ] Domain service is stateless
- [ ] Domain service contains domain logic (not orchestration, not infrastructure)
- [ ] Logic couldn't naturally fit on an existing entity or value object

### Application Service

**Definition**: Orchestrates domain objects to fulfill a use case. Thin layer. No business logic. Coordinates repositories, domain services, and domain events to execute a business operation.

**When to Apply**: Every use case needs an application service. The application service is the entry point for the application layer. Controllers/API handlers call application services.

**Trade-off Summary**: Application services add a layer between the UI/API and the domain. This indirection is justified because it keeps business logic out of controllers and infrastructure concerns out of the domain.

```
// Application service: orchestrates, does not contain business logic
application service OrderApplicationService:
    // Dependencies injected
    orderRepository: OrderRepository
    customerRepository: CustomerRepository
    pricingService: PricingService
    eventBus: EventBus

    placeOrder(command: PlaceOrderCommand): OrderId
        // 1. Load aggregates
        customer = customerRepository.findById(command.customerId)
        if customer == null: throw CustomerNotFound(command.customerId)

        // 2. Create aggregate (domain logic)
        order = Order.create(customer.id, command.shippingAddress)

        // 3. Modify aggregate (domain logic)
        for item in command.items:
            order.addItem(item.productId, item.quantity, item.unitPrice)

        // 4. Use domain service for cross-aggregate logic
        discount = pricingService.calculateDiscount(order, customer)
        order.applyDiscount(discount)

        // 5. Persist
        orderRepository.save(order)

        // 6. Publish event (side effects)
        eventBus.publish(OrderPlaced.from(order))

        return order.id
```

**Checklist**:
- [ ] Application service contains no business logic (all in domain objects)
- [ ] Application service manages transactions (begin/commit/rollback)
- [ ] Application service coordinates repositories, domain services, and events

### Factory

**Definition**: Encapsulates complex object creation logic. When constructing an aggregate requires multiple steps, validation, or external data, a factory keeps that complexity out of the aggregate's constructor.

**When to Apply**: When aggregate creation is complex enough that putting it in the constructor would violate the constructor's simplicity. When creation requires data from multiple sources. When there are multiple valid ways to create the same aggregate.

**Trade-off Summary**: Factory adds an extra class. Use it when the creation logic would otherwise pollute the aggregate or application service. For simple creation, use a static factory method on the aggregate itself.

```
// Factory: complex aggregate creation
factory OrderFactory:
    customerRepository: CustomerRepository
    productRepository: ProductRepository

    createFromQuote(quote: Quote): Order
        customer = customerRepository.findById(quote.customerId)
        if customer == null: throw CustomerNotFound(quote.customerId)
        order = Order.create(customer.id, customer.defaultShippingAddress)
        for quoteItem in quote.items:
            product = productRepository.findById(quoteItem.productId)
            if product == null: throw ProductNotFound(quoteItem.productId)
            if not product.isAvailable(): throw ProductUnavailable(product.id)
            order.addItem(product.id, quoteItem.quantity, product.currentPrice)
        return order
```

**Checklist**:
- [ ] Factory encapsulates complex creation logic
- [ ] Factory returns a fully valid aggregate (all invariants satisfied)
- [ ] For simple creation, use a static factory method on the aggregate instead


## DDD and Microservices

DDD and microservices are independent concepts that align powerfully. Bounded contexts are the best heuristic for microservice boundaries. A microservice that doesn't align with a bounded context is almost certainly wrong.

### Bounded Context to Service Boundary

**The alignment heuristic**: One bounded context per microservice is the strongest alignment, but it's not always correct. A bounded context can be implemented as multiple services (if the context has components with different scaling profiles). A microservice can contain multiple bounded contexts (if the contexts are tightly coupled and always deploy together). The heuristic is a starting point, not a rule.

**Decision framework**:
| Condition | Likely Mapping |
|---|---|
| One team owns the bounded context | One service (or modular monolith module) |
| The bounded context has high-change and low-change components with different scaling profiles | Multiple services within one context |
| Two bounded contexts always change together and share a deployment schedule | One service covering both contexts (consider merging contexts) |
| A bounded context has subdomains with different criticality | Separate services for core vs. supporting subdomains |

**When 1:1 is wrong**: A single bounded context for "Customer Management" might contain both a high-throughput customer lookup API (thousands of requests/second, simple reads) and a complex customer onboarding workflow (low throughput, complex business rules). Forcing these into one microservice means the simple lookup scales with the complex workflow. Split them into separate services within the same bounded context.

### Context Map to Service Communication

The context map relationships translate directly into microservice communication patterns:

| Context Map Relationship | Microservice Communication Pattern |
|---|---|
| Partnership | Synchronous API with negotiated contracts, shared ownership of the interface |
| Customer-Supplier | Upstream provides API, downstream adapts. Async preferred to decouple release schedules |
| Conformist | Downstream calls upstream API as-is. Expect breakage on upstream changes |
| Anti-Corruption Layer (ACL) | Adapter service or library that translates between models. Can be a standalone service |
| Open Host Service | Well-documented, versioned API. Multiple consumer support. Backward compatibility |
| Published Language | Shared schema repository (Protobuf, Avro, JSON Schema). Event schema registry |
| Separate Ways | No integration. Different services, different databases, no communication |

### Data Ownership

Each bounded context owns its data. No other context accesses it directly. This is the "Database per Service" pattern from microservices, applied at the bounded context level. (See software-architecture-distributed.md § Data Ownership)

**What "owns its data" means**:
- The bounded context is the sole writer to its database
- Other contexts read data through the context's API, not through direct database access
- If another context needs a copy of the data, it maintains its own read model, kept in sync via domain events
- The schema of a bounded context's database can change without affecting other contexts

**Data duplication is not a bug**: When the Sales context needs customer names and the Shipping context needs customer addresses, each maintains its own view. Sales subscribes to `CustomerRelocated` events to update its view. Shipping subscribes to `CustomerNameChanged` events. This duplication is the price of bounded context independence.

### Event Storming as Discovery

Event Storming is the most effective technique for discovering bounded contexts in a microservice migration. The process surfaces domain events, which naturally cluster into bounded contexts. (See § Event Storming) for the full methodology.

**For microservice decomposition**: (See software-architecture-distributed.md § Microservice Decomposition) for the decomposition strategies (by business capability, by subdomain, by transaction boundary). DDD provides the domain analysis. The Distributed Skill provides the architectural patterns for implementing the decomposition.

**From**: Learning DDD (Khononov, 2021), Building Microservices (Newman, 2015/2021)

### OSS Case Study: Axon Framework

**System**: Axon Framework (Java) — open-source framework for building DDD and event-driven microservices.

**Architectural Decision**: Axon enforces aggregate design by making aggregates the only units that can publish events and handle commands. The framework requires explicit command handlers, event handlers, and aggregate identifiers. It does not allow direct database access from outside the aggregate.

**Trade-off Rationale**: Axon chose framework-level enforcement of DDD patterns over developer discipline. Developers cannot accidentally bypass the aggregate root or publish events from the wrong layer because the framework prevents it.

**What They Gave Up**: Flexibility. You can't use Axon's event handling without using Axon's aggregate design. The framework is opinionated about how DDD should be implemented, which may not fit every team's style.

**What They Gained**: Consistency. Every Axon-based service has the same structure. New team members can read any service's code and understand the architecture. The framework prevents the most common DDD implementation mistakes (anemic aggregates, direct database access, missing event publication).

### OSS Case Study: Eventuate

**System**: Eventuate (Chris Richardson) — open-source platform for event-driven microservices with event sourcing and CQRS.

**Architectural Decision**: Eventuate treats domain events as the primary integration mechanism between microservices. Every service publishes events to a shared event store. Services subscribe to events they care about and maintain their own materialized views.

**Trade-off Rationale**: Eventuate chose event-driven integration with a shared event store over direct API calls. This eliminates point-to-point coupling between services: no service knows which other services consume its events.

**What They Gave Up**: Simplicity of synchronous communication. Debugging an event-driven system is harder than following a synchronous call chain. Eventual consistency means stale reads are possible. The event store is a single point of failure (mitigated by replication).

**What They Gained**: Services can evolve independently. New services can be added by subscribing to existing events (no changes to existing services). The event store provides a complete audit trail. Services can rebuild their state by replaying events.


## Event Storming

Event Storming is a collaborative workshop technique for discovering domain events, bounded contexts, and aggregates. It was created by Alberto Brandolini. It is fast, visual, and requires no UML or formal modeling skills. It works because domain events are the one thing everyone in the room (developers and domain experts) can agree on: things that happened.

### When to Use

- **Project inception**: Before writing any code, run an Event Storming workshop to discover the domain.
- **Redesigning domain boundaries**: When the current bounded contexts aren't working, Event Storming surfaces where the real boundaries are.
- **Migrating to microservices**: Event Storming identifies bounded contexts that become microservice candidates.
- **Onboarding new team members**: A 2-hour Big Picture Event Storming gives new developers a domain overview faster than reading documentation.
- **When the domain experts and developers don't agree on what the system does**: Event Storming makes disagreements visible and forces resolution.

### Workshop Format: Big Picture Event Storming

**Goal**: Discover domain events, identify hot spots, and draw initial bounded context boundaries.

**Setup**: A long wall or whiteboard. Unlimited orange, blue, yellow, pink, and lilac sticky notes. Markers. 6-12 participants including domain experts, developers, and a facilitator.

**Step-by-step facilitation guide**:

**Step 1: Domain Event Discovery (45-60 minutes)**

Everyone writes domain events on orange stickies and places them on the wall in rough chronological order (left to right). Rules: past tense only ("OrderPlaced" not "PlaceOrder"). Domain language only ("PolicyLapsed" not "PolicyStatusChangedToLapsed"). No filtering. No "that's not important." If a domain expert says it happened, it goes on the wall. One event per sticky.

The facilitator keeps the room focused: "What happened next?" "And then what?" "What else could happen?" Don't get stuck on one event. Keep moving.

**Step 2: Hot Spot Identification (15-20 minutes)**

Participants place pink stickies next to events where there's disagreement, confusion, or missing information. A hot spot is not a problem to solve in the workshop. It's a marker that says "we need to investigate this further." Examples: "How do we calculate the loyalty discount?" "What happens if the payment fails after 3 retries?" "Who owns the customer classification rules?"

**Step 3: Pivotal Events and Timeline (10-15 minutes)**

Identify pivotal events: events that mark a significant phase transition in the process. These become natural boundaries. Mark them with a horizontal line or a different color. Pivotal events are where bounded contexts often separate.

**Step 4: Bounded Context Boundaries (20-30 minutes)**

Draw lines around clusters of related events. Each cluster is a candidate bounded context. Name each context using domain language. Events that belong together (same ubiquitous language, same domain experts, same business rules) go in the same context. Events that use different language or involve different domain experts go in different contexts.

**Output**: A wall covered with domain events organized into bounded context clusters, with hot spots marked for follow-up. This is the input for the Design-Level Event Storming or for architecture documentation.

### Workshop Format: Design-Level Event Storming

**Goal**: Go deeper into one bounded context. Identify commands, aggregates, policies, and read models.

**Additional stickies**: Blue for commands, yellow for aggregates, lilac for policies (reactive logic: "when X happens, do Y"), green for read models (what users need to see).

**Step-by-step**:

**Step 1: Add commands (blue stickies)**. For each domain event, ask: "What caused this?" Place the command before the event. Format: imperative verb + noun. "PlaceOrder," "ConfirmShipment," "CancelReservation."

**Step 2: Add aggregates (yellow stickies)**. For each command-event pair, ask: "What thing handles this command and produces this event?" Place the aggregate between the command and the event. The aggregate is the thing that enforces the business rules.

**Step 3: Add policies (lilac stickies)**. For each event, ask: "What does this event trigger automatically?" A policy is an automated reaction: "When OrderPlaced, reserve inventory." Place the policy after the event, with an arrow to the command it triggers.

**Step 4: Add read models (green stickies)**. For each user interaction, ask: "What does the user need to see to make this decision?" Place the read model before the command it informs.

**Example sequence**:

```
[Green: Pending Orders List]
        │
        ▼
[Blue: PlaceOrder] ──► [Yellow: Order] ──► [Orange: OrderPlaced]
                                                   │
                                                   ▼
                                         [Lilac: Reserve Inventory]
                                                   │
                                                   ▼
                                         [Blue: ReserveItems] ──► [Yellow: Inventory] ──► [Orange: InventoryReserved]
```

### Post-Workshop: From Stickies to Code

The Event Storming board is a direct input for implementation:

- **Orange stickies (domain events)** → Domain event classes, event schemas
- **Yellow stickies (aggregates)** → Aggregate classes, aggregate roots
- **Blue stickies (commands)** → Command objects, API endpoints
- **Lilac stickies (policies)** → Event handlers, saga participants. (See software-architecture-distributed.md § Saga Pattern) for saga implementation
- **Green stickies (read models)** → Database views, materialized views, query endpoints. (See software-architecture-distributed.md § CQRS) for CQRS implementation
- **Pink stickies (hot spots)** → Backlog items for investigation, architecture decisions

**From**: Introducing Event Storming (Brandolini, 2013), Learning DDD (Khononov, 2021)


## DDD Anti-Patterns

### Anemic Domain Model

**Description**: Entities have only getters and setters. All business logic lives in services. The domain model is a bag of data with no behavior. This is the most common DDD failure mode.

**Why it happens**: Developers are taught to separate data and behavior (MVC, ORM entities). DDD requires putting them back together. Also: frameworks and ORMs encourage anemic models by making it easy to create entities with getters/setters and hard to encapsulate behavior.

**What to do instead**: Put behavior on entities. If an entity has a setter, ask: "Is there a domain concept that this setter represents?" Replace `order.setStatus(SHIPPED)` with `order.ship(trackingNumber)`. The method enforces invariants (can only ship a confirmed order) and publishes a domain event. The setter does neither.

**Detection signal**: Entities with only getters and setters. Service classes with names like `OrderService`, `CustomerService`, `PaymentService` that contain all the logic. More than 50% of methods on entities are accessors.

### God Aggregate

**Description**: One massive aggregate that encompasses everything in a bounded context. Contains 10+ entities. Every operation touches the God Aggregate. Database contention is extreme.

**Why it happens**: The desire for transactional consistency everywhere. "If I make everything one aggregate, I can guarantee consistency across all of it." Also: modeling the real world too literally. "A Customer has Orders, which have OrderItems, which reference Products, which have Categories, which..."

**What to do instead**: Split into smaller aggregates. Use eventual consistency between them. The rule: if two things don't need to be transactionally consistent with each other, they should be separate aggregates. A Customer and their Orders don't need to be consistent within a single transaction. A Customer can exist without Orders. An Order can be cancelled without modifying the Customer.

**Detection signal**: Aggregate has 4+ entities. Database transactions span multiple logical operations. High database contention on the aggregate's table. "Load the Customer" loads half the database.

### Shared Database Between Bounded Contexts

**Description**: Multiple bounded contexts read from and write to the same database tables. There are no context boundaries at the data layer. Changes to the schema in one context break another context.

**Why it happens**: Organizational inertia. "We already have one database." Also: the belief that a shared database is simpler than data duplication and eventual consistency. It is simpler in week 1. It is much more complex in month 6.

**What to do instead**: Each bounded context owns its schema (or its database). Other contexts access data through the context's API. If they need a local copy, they maintain a read model populated by domain events.

**Detection signal**: Multiple services connect to the same database. Schema migrations require coordination across multiple teams. One team's "optimization" breaks another team's query. Database tables have columns added for unrelated use cases.

### DDD Everywhere

**Description**: Applying tactical DDD patterns (entities, aggregates, value objects, repositories) to every part of the system, including generic and supporting subdomains where they add ceremony with no benefit.

**Why it happens**: "We're doing DDD" becomes "we use DDD patterns everywhere." Also: developers enjoy building rich domain models and apply them even where the domain is trivial.

**What to do instead**: Match the pattern to the subdomain complexity. Core domains get full tactical DDD. Supporting subdomains get simpler patterns (Transaction Script, Active Record). Generic subdomains get off-the-shelf solutions. A CRUD form for managing static reference data doesn't need aggregates and domain events.

**Detection signal**: Every module has the same structure (entity, repository, service, controller) regardless of complexity. The reference data module has the same architecture as the core pricing engine. Developers spend more time on boilerplate than on business logic.

### Ubiquitous Language Mismatch

**Description**: The code uses technical terms while the domain experts use domain terms. The code says `UserAccountManager.deactivateUser(userId)`. The domain expert says "a customer closed their account." The model and the business have diverged.

**Why it happens**: Developers model what's easy to model, not what the domain is. "User" is a concept every developer knows. "Policyholder" is domain-specific. Also: the team didn't have access to domain experts during development, so developers invented their own language.

**What to do instead**: Rename the code to match the domain language. `Policyholder.closeAccount(accountId)`. This sounds trivial. It's not. When the code speaks the domain language, domain experts can read it and spot errors. When the code speaks technical language, only developers can read it, and they don't know the domain well enough to spot errors.

**Detection signal**: Domain experts can't read the code (even with explanations). The code uses generic terms (User, Item, Status, Manager, Handler, Processor) where the business uses specific terms. The same concept has different names in the code and in conversations.

### Context Boundary Violation

**Description**: Code in one bounded context directly depends on the internal model of another bounded context. No ACL. No published language. Direct imports of another context's entities.

**Why it happens**: Convenience. "I just need the Customer's email address. Why should I call an API when I can import the Customer class?" Also: the bounded contexts were never explicitly defined, so developers don't know where the boundaries are.

**What to do instead**: Define explicit bounded context boundaries. Use ACLs at context boundaries. Reference other contexts by identity and API, never by internal model. If Context A needs data from Context B, Context A calls Context B's API or subscribes to Context B's events. Context A never imports Context B's entity classes.

**Detection signal**: Import statements that cross module boundaries into internal packages. "Just this one exception" becomes 50 exceptions. Changes in one module require changes in another "unrelated" module.


## DDD Checklist

Run this checklist at the end of DDD analysis and design. Every item is verifiable yes/no.

### Strategic DDD

- [ ] Bounded contexts identified and named using domain language
- [ ] Ubiquitous language documented per bounded context (key terms and their definitions)
- [ ] Context map produced showing all context relationships
- [ ] Each context relationship type explicitly chosen (Partnership, Customer-Supplier, Conformist, ACL, OHS, Published Language, Separate Ways) with rationale
- [ ] Anti-Corruption Layers identified for all legacy/external system integrations
- [ ] Subdomains classified: Core (heavy investment), Supporting (moderate investment), Generic (buy/outsource)
- [ ] Core domains clearly identified and resourced with the strongest team
- [ ] Context map visualization produced (ASCII or diagram)

### Tactical DDD

- [ ] Aggregates designed: each has a single root entity
- [ ] Aggregate boundaries defined by consistency invariants (not by data relationships)
- [ ] Aggregates are small (1-3 entities maximum)
- [ ] References between aggregates are by identity only
- [ ] One aggregate modified per transaction
- [ ] Domain events identified for significant state changes
- [ ] Domain events named in past tense using domain language
- [ ] Domain events carry all data consumers need
- [ ] Repositories defined: one per aggregate root
- [ ] Domain services used only for logic that spans multiple aggregates
- [ ] Application services are thin (no business logic)
- [ ] Factories used for complex aggregate creation

### Microservices Alignment

- [ ] Bounded context to service boundary mapping is explicit (1:1 or justified deviation)
- [ ] Each bounded context owns its data (no shared databases across contexts)
- [ ] Communication patterns between services match context map relationships
- [ ] Data duplication across contexts is intentional (populated by domain events), not accidental

### Event Storming

- [ ] Big Picture Event Storming completed (domain events discovered)
- [ ] Hot spots identified and documented
- [ ] Bounded context boundaries drawn from event clusters
- [ ] Design-Level Event Storming completed for core domains
- [ ] Commands, events, aggregates, policies, and read models identified
- [ ] Event Storming output mapped to implementation artifacts

### Anti-Pattern Detection

- [ ] No anemic domain models (entities have behavior, not just getters/setters)
- [ ] No God aggregates (no aggregate with 4+ entities)
- [ ] No shared databases between bounded contexts
- [ ] No DDD patterns applied to trivial CRUD subdomains
- [ ] Code uses ubiquitous language (domain terms, not technical terms)
- [ ] No context boundary violations (no direct imports of another context's internal model)


## Book Source Appendix

This table maps each section of this Skill to the primary and secondary books that informed it.

| Section | Primary Books | Secondary Books |
|---|---|---|
| DDD Philosophy & When to Apply | Domain-Driven Design (Evans, 2003), DDD Distilled (Vernon, 2016) | Learning DDD (Khononov, 2021) |
| Strategic DDD — Bounded Context | Domain-Driven Design (Evans, 2003), Implementing DDD (Vernon, 2013) | Learning DDD (Khononov, 2021) |
| Strategic DDD — Context Mapping | Domain-Driven Design (Evans, 2003), Implementing DDD (Vernon, 2013) | Learning DDD (Khononov, 2021) |
| Strategic DDD — Subdomains | Domain-Driven Design (Evans, 2003), DDD Distilled (Vernon, 2016) | Learning DDD (Khononov, 2021) |
| Tactical DDD — Entity, Value Object, Aggregate | Domain-Driven Design (Evans, 2003), Implementing DDD (Vernon, 2013) | Patterns, Principles, and Practices of DDD (Millett & Tune, 2015) |
| Tactical DDD — Domain Events | Implementing DDD (Vernon, 2013) | Domain-Driven Design (Evans, 2003) |
| Tactical DDD — Repository, Factory | Domain-Driven Design (Evans, 2003) | Implementing DDD (Vernon, 2013) |
| Tactical DDD — Domain Service, Application Service | Implementing DDD (Vernon, 2013) | Domain-Driven Design (Evans, 2003) |
| DDD and Microservices | Learning DDD (Khononov, 2021), Building Microservices (Newman, 2015/2021) | Implementing DDD (Vernon, 2013) |
| Event Storming | Introducing Event Storming (Brandolini, 2013), Learning DDD (Khononov, 2021) | Domain-Driven Design Distilled (Vernon, 2016) |
| DDD Anti-Patterns | Implementing DDD (Vernon, 2013), Learning DDD (Khononov, 2021) | Patterns, Principles, and Practices of DDD (Millett & Tune, 2015) |
| OSS Case Studies | Axon Framework documentation, Eventuate documentation (Richardson) | Microservices Patterns (Richardson, 2018) |

### Book Reference Key

- **Domain-Driven Design** (Eric Evans, 2003): The original. Introduced bounded contexts, ubiquitous language, entities, value objects, aggregates, repositories, domain services, factories, context mapping, and the strategic design philosophy. Still the definitive reference for the "why" behind DDD.
- **Implementing DDD** (Vaughn Vernon, 2013): The practical companion to Evans. Covers tactical patterns in depth with code examples. Introduced domain events as a first-class pattern. Essential for implementation guidance.
- **DDD Distilled** (Vaughn Vernon, 2016): A concise (~130 page) introduction to DDD. Best starting point for teams new to DDD. Covers the essentials: bounded contexts, subdomains, context mapping, aggregates, and Event Storming.
- **Learning DDD** (Vlad Khononov, 2021): Modern treatment of DDD with emphasis on microservices alignment, Event Storming, and practical heuristics for deciding when and how to apply DDD patterns. Strongest coverage of the DDD-microservices relationship.
- **Patterns, Principles, and Practices of DDD** (Scott Millett & Nick Tune, 2015): Deep tactical coverage with extensive code examples. Good for teams that have read Evans and Vernon and want implementation-level guidance.
- **Building Microservices** (Sam Newman, 2015, 2nd Ed. 2021): Not a DDD book but essential for understanding how bounded contexts map to microservices. Covers service decomposition, communication patterns, and distributed data management.
- **Introducing Event Storming** (Alberto Brandolini, 2013): The original Event Storming introduction. Available as a blog post and conference talk. Defines the sticky note colors, workshop format, and facilitation techniques.
- **Microservices Patterns** (Chris Richardson, 2018): Covers microservice patterns including event sourcing, CQRS, saga, and event-driven architecture. The Eventuate platform is Richardson's reference implementation.
