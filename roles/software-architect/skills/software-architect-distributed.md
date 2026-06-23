---
name: software-architect-distributed
description: Distributed systems architecture for the Software Architect suite. Covers distributed fundamentals (8 fallacies, CAP/PACELC theorems, consistency models, consensus protocols, time in distributed systems), microservice decomposition strategies, distributed data patterns (Saga, CQRS, Event Sourcing, Outbox, CDC, Idempotency), resilience patterns (circuit breaker, bulkhead, retry, timeout, rate limiting, health checks, graceful degradation, chaos engineering), reactive systems, and event-driven architecture deep dive. Includes real-world OSS case studies from Kafka, Kubernetes, Envoy, Istio, and etcd.
---

## Distributed Systems Fundamentals

Distributed systems are systems where components located on networked computers communicate and coordinate their actions by passing messages. The fundamental challenge: everything that can go wrong in a single-machine system can go wrong, plus everything that can go wrong with a network.

Every distributed architecture decision starts with acknowledging the 8 fallacies and choosing which fallacies you will protect against and which you will accept.

### The 8 Fallacies of Distributed Computing

These are not "mistakes beginners make." These are assumptions that every distributed system designer makes, consciously or unconsciously, that the network will violate at some point.

| # | Fallacy | Reality | Architectural Response |
|---|---|---|---|
| 1 | The network is reliable | Networks drop packets, partitions happen, cables get unplugged | Retry with backoff, idempotency, circuit breakers |
| 2 | Latency is zero | Every network call adds milliseconds to seconds. Light speed is a hard limit | Batch requests, cache aggressively, colocate data and compute |
| 3 | Bandwidth is infinite | Network links have throughput limits. Large payloads saturate links | Paginate, compress, stream instead of batch-transfer |
| 4 | The network is secure | Every network boundary is an attack surface | mTLS, encryption in transit, zero-trust architecture (See software-architect-infrastructure.md § Zero Trust Architecture) |
| 5 | Topology doesn't change | Servers come and go. IPs change. DNS updates are not instant | Service discovery, load balancing, health checks |
| 6 | There is one administrator | Different teams administer different parts. Nobody has global visibility | Federation, delegation, clear ownership boundaries |
| 7 | Transport cost is zero | Serialization, deserialization, and protocol overhead are real CPU costs | Efficient serialization (Protobuf, Avro), connection pooling |
| 8 | The network is homogeneous | Different platforms, languages, and protocols must interoperate | Standard protocols, schema evolution, API versioning |

**When to apply**: Every distributed system, at any scale. These are not optional considerations. They are the physics of distributed computing.

**Scale context**: At Solo/Startup, fallacies 1 and 2 hurt the most (a naive RPC call that fails silently, a service that times out because nobody set a timeout). At Growth, fallacies 3 and 4 become critical (bandwidth between services, security at every boundary). At Scale, fallacies 5 and 6 dominate (dynamic topology, multi-team administration).

**Checklist**:
- [ ] Every network call has a timeout and a retry strategy
- [ ] Every network call is idempotent or explicitly non-idempotent with documentation
- [ ] Latency budgets are defined across call chains
- [ ] Payload sizes are bounded (pagination, compression, streaming)
- [ ] All inter-service communication is encrypted in transit
- [ ] Service discovery handles node addition and removal without restart

**From**: Distributed Systems (Tanenbaum & van Steen), Understanding Distributed Systems (Vitillo)

### CAP Theorem

The CAP theorem states that a distributed data store can provide at most two of three guarantees simultaneously during a network partition: Consistency (every read receives the most recent write), Availability (every request receives a non-error response, without guarantee of freshness), and Partition Tolerance (the system continues to operate despite network partitions).

**Reality check**: Network partitions are inevitable. You always get P. The real choice is CP vs AP: during a partition, do you sacrifice consistency or availability?

**CP Systems (Consistency + Partition Tolerance)**: When a partition occurs, the system blocks writes to maintain consistency. Reads always return the latest write. The system is unavailable during partitions for some operations.

| System | Consensus Protocol | Trade-off |
|---|---|---|
| etcd | Raft | Chose strong consistency for cluster configuration data. Unavailable during leader election (~seconds). If etcd gives you a value, it's correct. |
| ZooKeeper | ZAB (ZooKeeper Atomic Broadcast) | Chose consistency for coordination primitives. Nodes that can't reach the leader stop serving. |
| HBase | Multi-Paxos (via region servers) | Chose consistency for row-level atomicity. Unavailable for a region during failover. |
| Consul | Raft | Chose consistency for service discovery and KV store. Unavailable for writes during leader election. |

**AP Systems (Availability + Partition Tolerance)**: When a partition occurs, the system continues accepting reads and writes. Reads may return stale data. Writes may conflict. The application must handle inconsistency.

| System | Strategy | Trade-off |
|---|---|---|
| Cassandra | Last-write-wins, tunable consistency (per-operation consistency levels) | Chose availability: always writable, but reads may be stale. Application resolves conflicts. |
| DynamoDB | Quorum reads/writes (configurable), eventually consistent by default | Chose availability: continues serving during partitions. Strong consistency available as opt-in (costs latency). |
| CouchDB | Multi-Version Concurrency Control, eventual consistency via replication | Chose availability: always readable/writable. Conflict detection but not automatic resolution. |

**When to choose CP**: Configuration data (etcd), coordination (leader election, locks), financial ledgers, inventory systems where overselling is unacceptable, anything where wrong data is worse than no data.

**When to choose AP**: User-generated content, social feeds, recommendation engines, analytics, anything where stale data for a few seconds is acceptable and downtime is not.

**Scale context**: At Solo/Startup, a single-node database avoids the CP/AP choice entirely. At Growth, you choose CP or AP per data type, not per system. At Scale, you use hybrid approaches: CP for critical paths, AP for everything else.

**Checklist**:
- [ ] Is the CP vs AP choice explicitly documented for each data store?
- [ ] If CP: what is the failover strategy and how long does it take?
- [ ] If AP: how does the application handle stale reads and conflicting writes?
- [ ] Are there hybrid paths (strong consistency for critical operations, eventual for others)?

**From**: DDIA (Kleppmann), A Critique of the CAP Theorem (Brewer), CAP Twelve Years Later (Brewer)

### PACELC Extension

PACELC extends CAP by asking: "If there is a Partition (P), do you choose Availability (A) or Consistency (C)? Else (E), when there is no partition, do you choose Latency (L) or Consistency (C)?"

This is more practical than CAP because it addresses the normal operating state (no partition), not just the exceptional state (partition). Most of the time, there is no partition. The latency vs consistency trade-off in normal operation is the architect's daily concern.

| System | Partition Choice | Normal Choice | Design Philosophy |
|---|---|---|---|
| DynamoDB | PA (Available) | EL (Low Latency) | Always fast, eventually consistent. Strong consistency when you opt in. |
| BigTable / HBase | PC (Consistent) | EC (Consistent) | Always consistent, but slower reads during normal operation too. |
| Cassandra | PA/EL by default, configurable per operation | PA/EL default | Tunable: you pick per query. QUORUM = PC/EC, ONE = PA/EL. |
| MongoDB (pre-4.0) | PA (Available) | EC (Consistent) | Available during partitions, consistent during normal operation. |
| CockroachDB | PC (Consistent) | EC (Consistent) | Always consistent. Accepts higher latency for serializable isolation. |

**Trade-off**: PACELC forces you to acknowledge that even without partitions, distributed systems must choose between latency and consistency. A strongly consistent system pays a latency penalty for every operation (coordination, quorum, locking), not just during partitions.

**When PACELC matters most**: When your system's p99 latency budget is tight and you're considering whether to require strong consistency for every read. The answer is almost always: strong consistency for writes, tunable for reads.

**From**: Consistency Tradeoffs in Modern Distributed Database System Design (Abadi), DDIA (Kleppmann)

### Consistency Models

Consistency models define what guarantees a data store makes about the order and visibility of operations. The model you choose determines what your application can safely assume.

#### Strong Consistency (Linearizability)

Every read returns the most recent write. The system behaves as if there is a single copy of the data, even though there are multiple replicas. This is the strongest guarantee and the easiest to reason about. It is also the most expensive.

**When to apply**: Financial transactions, user authentication (a password change must be immediately visible), inventory reservation (can't sell the same item twice), leader election (only one leader at a time).

**When NOT**: When the latency cost exceeds the correctness benefit. If your users can tolerate seeing slightly stale data (social feeds, search results, recommendations), strong consistency is overpaying.

**Real-world**: etcd provides linearizable reads by default. CockroachDB provides serializable isolation (stronger than linearizability for transactions). Google Spanner provides external consistency (linearizability + causal ordering across the globe).

**Scale context**: At Solo/Startup, a single-node database gives you strong consistency for free. At Growth, you may need read replicas, which introduce replication lag and break strong consistency for reads. At Scale, strong consistency requires coordination (consensus, quorum, or TrueTime/atomic clocks), which adds latency.

#### Eventual Consistency

If no new updates are made, eventually all replicas will converge to the same value. "Eventually" can mean milliseconds, seconds, or minutes. The system makes no promise about when convergence happens or what reads see during convergence.

**When to apply**: DNS, CDN cache invalidation, social media timelines, search indexes, product catalogs (where prices change infrequently), any system where stale data is acceptable for short periods.

**When NOT**: When the business cannot tolerate stale reads. "Eventual" plus "the user sees wrong data and makes a bad decision" equals a support ticket.

**Real-world**: DNS (updates propagate over hours). Amazon DynamoDB's default consistency model. Cassandra with consistency level ONE.

**Trade-off**: Eventual consistency gives you low latency and high availability. You give up the ability to reason about data state at any given moment. Application code must handle stale reads, which adds complexity.

#### Causal Consistency

Operations that are causally related are seen by every replica in the same order. Operations that are not causally related (concurrent) may be seen in different orders. This is stronger than eventual consistency (it preserves cause-and-effect relationships) but weaker than strong consistency (concurrent operations can be ordered differently).

**When to apply**: Collaborative editing (a comment must appear after the post it comments on), chat applications (replies after messages), social networks (likes after posts).

**When NOT**: When the system has no causal relationships between operations (each operation is independent).

**Real-world**: MongoDB's causally consistent sessions. Amazon DynamoDB's transactions provide causal consistency. COPS (Clusters of Order-Preserving Servers) in geo-replicated key-value stores.

#### Read-Your-Writes Consistency

After you write a value, your subsequent reads will reflect that write. Other users may see stale data, but you always see your own writes. This is the minimum consistency guarantee that prevents user confusion ("I just changed my password but it's not working").

**When to apply**: User profile updates, password changes, shopping cart updates, any user-facing write where the user expects immediate feedback.

**Real-world**: Implemented via sticky sessions (route same user to same replica), reading from the primary after writes, or using logical timestamps to ensure the read replica has caught up to the write.

#### Monotonic Reads

Once you have seen a particular value, you will never see an older value on subsequent reads. Time does not go backward for a given user.

**When to apply**: Any system where seeing data "go backward" would be confusing. A user refreshing a page should not see data disappear.

**Real-world**: Often combined with read-your-writes. Implemented by tracking the highest timestamp seen and only reading from replicas that are at or past that timestamp.

**Checklist** (for all consistency models):
- [ ] Is the consistency model documented for every data flow?
- [ ] If eventual: what is the expected convergence time? How does the application handle stale reads?
- [ ] If causal: are causal relationships between operations modeled?
- [ ] Is read-your-writes implemented for all user-facing writes?

**From**: DDIA (Kleppmann), Understanding Distributed Systems (Vitillo)

### Consensus Protocols

Consensus is the problem of getting multiple nodes to agree on a single value or sequence of values. It is the foundation of replicated state machines, leader election, and distributed locking.

#### Paxos (Theory)

Paxos is the theoretical foundation of distributed consensus. It guarantees safety (no two nodes decide different values) but not liveness (it may not terminate if the network is unreliable enough). Paxos is notoriously difficult to understand and implement correctly. Most real-world systems use Raft or a Paxos variant instead of pure Paxos.

**Role**: Paxos is important as a concept and a proof that consensus is solvable. It is rarely implemented directly. Multi-Paxos (the optimization that reuses a leader across multiple proposals) is used in production systems.

**From**: The Part-Time Parliament (Lamport), Paxos Made Simple (Lamport)

#### Raft (Practical)

Raft was designed to be understandable. It decomposes consensus into three sub-problems: leader election, log replication, and safety. All consensus decisions flow through the leader.

**How Raft works**:
1. Nodes are in one of three states: Leader, Follower, or Candidate.
2. The cluster elects a Leader. The Leader accepts client writes and replicates them to Followers.
3. A write is committed when a majority of nodes (quorum) have persisted it.
4. If the Leader fails, a new election occurs. The new Leader's log must contain all committed entries.

**Trade-offs**: Raft trades availability during leader election (CP) for understandability. Leader election takes milliseconds to seconds. During election, writes are unavailable. Reads can be served from followers if stale reads are acceptable, or from the leader if linearizable reads are required.

**Real-world OSS**:
- **etcd**: Uses Raft for its key-value store. Every write goes through the Raft leader. Linearizable reads are served by the leader. Serialized reads can be served by followers. etcd chose Raft over Paxos for simplicity and auditability. Trade-off: leader election downtime (~seconds) vs operational simplicity.
- **Consul**: Uses Raft for its consensus store (service catalog, KV, health checks). Same trade-off as etcd.
- **TiKV** (the storage layer of TiDB): Uses Raft for replication. Each region (range of keys) has its own Raft group. This allows independent leader election per region, reducing the blast radius of a leader failure.
- **CockroachDB**: Uses Raft for range replication. Each range is a Raft group. Multiple Raft groups per node mean no single-leader bottleneck.

**Checklist**:
- [ ] Is the consensus protocol's quorum size appropriate for the failure tolerance needed?
- [ ] What is the expected leader election time and how does it affect availability?
- [ ] Are reads served from leader (linearizable) or followers (stale possible)?

**From**: In Search of an Understandable Consensus Algorithm (Ongaro & Ousterhout), DDIA (Kleppmann)

### Time in Distributed Systems

Time is hard in distributed systems because nodes have independent clocks that drift. You cannot trust wall clocks for ordering events across nodes.

#### Wall Clocks Are Unreliable

A node's system clock can drift (seconds per day), jump (NTP correction, leap seconds), or be completely wrong (dead CMOS battery, misconfiguration). Two events on different nodes cannot be reliably ordered by their timestamps.

**Rule**: Never use wall-clock timestamps for ordering, consensus, or correctness. Use them for human-readable logs and approximate ordering (within the same node).

#### Logical Clocks (Lamport Timestamps)

Lamport timestamps provide a partial ordering of events across nodes. Each node maintains a counter. When a node sends a message, it includes its counter. When a node receives a message, it sets its counter to `max(local, received) + 1`. This guarantees that if event A happens-before event B, then A's timestamp is less than B's timestamp.

**Limitation**: The converse is not true. If A's timestamp < B's timestamp, A may not have happened before B. Lamport timestamps provide a partial order, not a total order.

**When to apply**: Event ordering in systems where causal relationships matter and concurrent events are acceptable.

#### Vector Clocks

Vector clocks extend Lamport timestamps by tracking a counter per node. Instead of a single counter, each node maintains a vector `[c1, c2, ..., cn]` where `ci` is the count of events from node i. This allows detection of concurrent events: if neither vector clock dominates the other, the events are concurrent.

**When to apply**: Conflict detection in multi-leader replication, collaborative editing, version vectors for detecting write conflicts.

**Real-world**: Amazon DynamoDB uses vector clocks (version vectors) to detect conflicting writes. Riak uses dotted version vectors (an optimization of vector clocks).

#### Hybrid Logical Clocks (HLC)

HLC combines physical clocks with logical clocks. Each timestamp has a physical component (wall clock) and a logical component (counter). The physical component provides approximate real-time ordering. The logical component resolves ties when physical timestamps are identical.

**When to apply**: When you need something close to wall-clock time but with the ordering guarantees of a logical clock.

**Real-world**: CockroachDB uses HLC for transaction ordering. The physical component is close to wall-clock time (useful for humans). The logical component ensures a total order even when physical clocks are identical.

#### Google Spanner and TrueTime

Spanner uses atomic clocks and GPS receivers in each datacenter to bound clock uncertainty to a known interval (typically 1-7ms). This allows Spanner to provide external consistency (linearizability across the globe) without consensus on every read. TrueTime is a specialized hardware/software solution, not a general approach.

**Trade-off**: Spanner invested in specialized hardware (atomic clocks, GPS antennas) to avoid the latency of consensus on reads. For most systems, this is overkill. The cost of specialized hardware exceeds the benefit unless you genuinely need global linearizability with low latency.

**Checklist**:
- [ ] Are wall-clock timestamps used only for human-readable purposes, not correctness?
- [ ] Is event ordering across nodes based on logical/vector/HLC timestamps, not wall clocks?
- [ ] If vector clocks are used, is conflict resolution strategy defined?

**From**: Time, Clocks, and the Ordering of Events (Lamport), Spanner: Google's Globally-Distributed Database, DDIA (Kleppmann)

---

## Microservice Decomposition

Microservices are not an architectural style you choose because it's modern. They are a response to organizational scale: when a single team can no longer own the entire system, you decompose. The decomposition strategy determines whether you get the benefits (team autonomy, independent deployment, fault isolation) or the costs (network complexity, eventual consistency, operational overhead) without the benefits (distributed monolith).

### Decomposition Strategies

#### By Business Capability

Decompose around what the business does, not how the software is built. A business capability is something the organization does to deliver value: order management, payment processing, inventory management, customer notification.

**How to identify business capabilities**: Look at the organizational structure. What departments or teams exist? What do they own? Business capabilities are stable over time, even as implementation changes. Order management has always been a capability. How you implement it (monolith, microservice, serverless) changes.

**When to apply**: Organizations with clear business domains and dedicated teams per domain. The business capability boundary is the natural service boundary.

**When NOT**: When the organization is cross-functional and team boundaries don't align with business capabilities. Conway's Law applies: if the team structure doesn't match, the architecture won't either. (See software-architect-organization.md § Conway's Law)

#### By Subdomain (DDD)

Decompose using Domain-Driven Design's subdomain classification: core (competitive advantage), supporting (necessary but not differentiating), generic (commodity). This is the strongest decomposition heuristic when business complexity is the dominant challenge. (See software-architect-ddd.md § Subdomains)

**When to apply**: Complex business domains where the domain model is the primary source of complexity. Financial services, healthcare, logistics, insurance.

**When NOT**: CRUD applications, data-intensive applications where the domain is simple but the scale is large, systems where the primary challenge is technical (throughput, latency) rather than domain complexity.

#### By Data Ownership

Decompose around who owns which data. Each service owns its data and is the only service that reads/writes it directly. Other services access data through the owning service's API.

**When to apply**: When different parts of the system have different data consistency requirements, different data models, or different scaling profiles.

**When NOT**: When the data model is deeply interconnected and decomposing it would create excessive cross-service queries.

#### By Team Structure (Conway's Law)

Structure services to match team boundaries. If you have three teams, you will end up with roughly three services (or three modules in a monolith). The architecture will reflect the communication structure of the organization. This is not a strategy you choose. It is physics. (See software-architect-organization.md § Conway's Law)

**Real-world**: Amazon's "two-pizza team" rule: each team should be small enough to be fed by two pizzas (6-8 people). Each team owns one or more services. The service boundaries align with team boundaries. This is the Inverse Conway Maneuver: structure teams to produce the desired architecture.

**Checklist**:
- [ ] Is the decomposition strategy explicitly chosen and documented?
- [ ] Do service boundaries align with team boundaries (Conway's Law)?
- [ ] Does each service have clear data ownership?
- [ ] Are there cross-service queries that could be avoided by adjusting boundaries?

### Service Granularity

"How small is 'micro'?" is the wrong question. The right question: "What is the smallest unit that can be independently deployed, independently scaled, and owned by a single team without excessive coordination?"

#### The Goldilocks Principle

Too big: The service does too many things. Changes require coordination across the team. Scaling is coarse-grained. The database is a monolith.

Too small: Each endpoint is a service (nanoservices). Network overhead dominates. A simple feature touches 5 services. Operational complexity explodes.

Just right: The service maps to a bounded context (if using DDD), a business capability, or a team's ownership. The service can be reasoned about independently. Changes are typically contained within the service.

#### Bounded Context as Natural Boundary

A bounded context is the strongest heuristic for service boundaries. Within a bounded context, the model is consistent and the language is shared. Across bounded contexts, models differ and translation is explicit. (See software-architect-ddd.md § Bounded Context)

**Scale context**: At Solo/Startup, the entire application is one bounded context (or a few, in a modular monolith). At Growth, bounded contexts become service boundaries. At Scale, a single bounded context may span multiple services (if scaling or team size requires further decomposition within the context).

### Data Ownership

**Database per Service**: Each service owns its data and its database schema. No service directly accesses another service's database. Data sharing happens through the service's API, not through shared tables.

This is the single most important rule in microservice architecture. Violating it creates the distributed monolith: services that appear independent but are coupled through the database. Schema changes in one service break others. Deployment independence is an illusion.

**When to apply**: Growth and Scale tiers. At Solo/Startup, a shared database is acceptable and often preferable.

**When NOT**: At small scale where a shared database simplifies development and the team is small enough to coordinate schema changes.

**Real-world**: At Amazon, the "API mandate" (circa 2002) required all teams to expose their data only through service interfaces. No direct database access. No shared memory. No backdoors. This forced data ownership and enabled independent evolution.

### Communication Patterns

Choose the communication pattern per interaction, not per system. Different interactions within the same system may use different patterns.

#### Synchronous (Request/Response)

The caller waits for the response. If the callee is unavailable, the call fails. If the callee is slow, the caller is slow.

**Protocols**: REST (HTTP), gRPC (HTTP/2 + Protobuf), GraphQL (HTTP + query language).

**When to use**: When the caller needs the response to proceed. When the interaction is a query. When the latency of the callee is acceptable for the caller. When strong consistency is required.

**When NOT**: When the caller can proceed without the response. When the callee is unreliable or slow. When the interaction is a side effect, not a dependency.

**Trade-off**: Synchronous communication is simple to understand and implement. It creates temporal coupling: the caller and callee must both be available at the same time. It creates latency coupling: the caller's latency is the sum of the callee's latency plus network time.

#### Asynchronous (Messaging)

The caller sends a message and continues. The callee processes the message when it can. The caller does not wait for a response (or receives it asynchronously).

**Patterns**: Events (something happened), Commands (do something), Queries (tell me something, response via callback).

**Protocols**: Message queues (RabbitMQ, Amazon SQS), event streams (Kafka, Pulsar), webhooks (HTTP callbacks).

**When to use**: When the caller can proceed without the response. When the callee has different throughput or reliability characteristics. When you need to decouple deployment schedules. When you need guaranteed delivery with retry.

**When NOT**: When the caller must know the result before proceeding. When the interaction requires sub-millisecond latency. When the added infrastructure complexity outweighs the coupling benefit.

**Trade-off**: Asynchronous communication decouples services in time (they don't need to be available simultaneously) and in throughput (they can process at different rates). It adds complexity: eventual consistency, message ordering, duplicate handling, dead letter queues.

**Checklist**:
- [ ] Is the communication pattern (sync vs async) chosen per interaction with documented rationale?
- [ ] For sync calls: is there a timeout? A circuit breaker? A fallback?
- [ ] For async messages: is there a retry strategy? Idempotency? A dead letter queue?

### Service Mesh

A service mesh extracts cross-cutting communication concerns (mTLS, observability, traffic management, retries, circuit breaking) from application code into a sidecar proxy. The application communicates with its local proxy, and the proxies form the mesh.

```
┌──────────────┐         ┌──────────────┐
│  Service A   │         │  Service B   │
│              │         │              │
│  localhost   │────────▶│  localhost   │
│  :8080       │  mTLS   │  :8080       │
└──────┬───────┘         └──────┬───────┘
       │                        │
┌──────┴───────┐         ┌──────┴───────┐
│  Sidecar     │────────▶│  Sidecar     │
│  Proxy       │  mTLS   │  Proxy       │
│  (Envoy)     │         │  (Envoy)     │
└──────────────┘         └──────────────┘
       ▲                        ▲
       │                        │
       │   ┌──────────────┐     │
       └───│ Control Plane│─────┘
           │  (Istio)     │
           └──────────────┘
```

**Real-world OSS**:

**Istio** (Envoy-based): The most feature-complete service mesh. Uses Envoy as the data plane sidecar proxy and its own control plane (Pilot, Citadel, Galley). Istio provides mTLS, traffic routing (canary, A/B), fault injection, circuit breaking, rate limiting, and observability (metrics, traces, access logs).

Architectural decision: Istio separated the control plane from the data plane, using Envoy as the universal data plane. This allows independent evolution of control and data plane. Envoy handles the performance-critical data path. Istio handles configuration and policy.

Trade-off: Istio chose feature completeness over operational simplicity. Installing and operating Istio is complex. For a small team, the operational overhead may exceed the benefit. Istio is appropriate at Scale tier (50+ services) where the complexity is amortized across many services.

**Linkerd** (Rust-based): A simpler service mesh focused on operational simplicity. Uses its own Rust-based proxy (linkerd2-proxy) instead of Envoy. Linkerd provides mTLS, retries, timeouts, and basic observability. It does not provide the advanced traffic management features of Istio.

Architectural decision: Linkerd chose simplicity over feature breadth. A Rust-based proxy optimized for the specific use case rather than a general-purpose proxy. The result is lower resource usage and simpler operation, at the cost of fewer features.

Trade-off: Linkerd is appropriate at Growth tier (10-50 services) where you need mTLS and observability but can't justify Istio's operational complexity.

**When to use a service mesh**: When you have many services (20+) that need mTLS, when you need fine-grained traffic control (canary, circuit breaking at the network level), when your platform team can absorb the operational complexity.

**When NOT**: When you have fewer than 10 services (the overhead exceeds the benefit), when your services already have mTLS and observability built into libraries, when you don't have a platform team.

**Scale context**: At Solo/Startup, you don't need a service mesh. At Growth, consider Linkerd for mTLS and basic observability. At Scale, Istio becomes justifiable.

### API Gateway

An API gateway is the single entry point for external clients. It handles cross-cutting concerns at the edge: authentication, rate limiting, request routing, response aggregation, protocol translation.

**Real-world OSS**:

**Kong**: Open-source API gateway built on top of Nginx/OpenResty. Plugin-based architecture for extensibility (auth, rate limiting, logging, transformations). Kong chose extensibility over simplicity: the plugin system is powerful but configuring it correctly requires expertise.

**Envoy**: Originally designed as a sidecar proxy, but also used as an edge proxy (API gateway). Envoy's strength is L7 traffic management: sophisticated routing, load balancing, and observability. It is less focused on API management features (developer portal, API key management) and more on traffic control.

**When to use an API gateway**: When you have multiple services and want a unified entry point, when you need centralized auth and rate limiting, when clients need different data shapes (BFF pattern).

**When NOT**: When you have a single service, when your services are internal-only with no external clients, when your load balancer already provides the needed features.

**Checklist**:
- [ ] Is the API gateway a thin routing layer, not a business logic layer?
- [ ] Is authentication handled at the gateway (edge) or delegated to services?
- [ ] Are rate limits defined and documented?
- [ ] Is the gateway itself highly available (no single point of failure)?

**From**: Building Microservices (Newman), Microservices Patterns (Richardson)

---

## Distributed Data Patterns

Distributed data patterns address the hardest problem in distributed systems: maintaining data consistency across multiple services that each own their own data. Transactions that span services cannot use ACID guarantees. These patterns provide alternatives.

### Saga Pattern

A saga is a sequence of local transactions. Each local transaction updates data within a single service and publishes an event or message. Subsequent services react to the event and execute their local transaction. If a step fails, the saga executes compensating transactions to undo preceding steps.

Sagas do not provide isolation (another saga may see intermediate state). They provide eventual consistency: all steps will eventually succeed or all will be compensated.

#### Choreography (Decentralized)

Each service listens for events and decides independently whether to act. No central coordinator.

```
// Service A: Order Service
create_order(order):
    // Local transaction
    order_repo.save(order)
    // Publish event. Other services react independently.
    event_bus.publish("order.created", {
        order_id: order.id,
        customer_id: order.customer_id,
        items: order.items,
        total: order.total
    })

// Service B: Payment Service (listens for "order.created")
on_event("order.created", event):
    payment = payment_service.charge(event.customer_id, event.total)
    if payment.success:
        payment_repo.save(payment)
        event_bus.publish("payment.completed", { order_id: event.order_id, payment_id: payment.id })
    else:
        // Payment failed. Publish failure. Compensation handled by listeners.
        event_bus.publish("payment.failed", { order_id: event.order_id, reason: payment.error })

// Service A: Order Service (listens for "payment.failed")
on_event("payment.failed", event):
    order_repo.update_status(event.order_id, "cancelled")
    // Compensating action
    event_bus.publish("order.cancelled", { order_id: event.order_id })
```

**Strengths**: Loose coupling. Services don't know about each other. Easy to add new saga participants (they just listen for events). No single point of coordination.

**Weaknesses**: Hard to understand the end-to-end flow (it's distributed across multiple services). Hard to debug when something goes wrong. Cyclic dependencies possible if not carefully designed. No central visibility into saga state.

#### Orchestration (Centralized)

A central saga orchestrator tells each service what to do. The orchestrator manages the sequence, handles failures, and triggers compensation.

```
// Saga Orchestrator
execute_create_order_saga(order):
    // Step 1: Create order
    result = order_service.create(order)
    if result.failed:
        return failure("Order creation failed")
    saga_state = { order_id: result.order_id, status: "order_created" }

    // Step 2: Reserve inventory
    result = inventory_service.reserve(order.items)
    if result.failed:
        // Compensate: cancel order
        order_service.cancel(saga_state.order_id)
        return failure("Inventory reservation failed")

    // Step 3: Charge payment
    result = payment_service.charge(order.customer_id, order.total)
    if result.failed:
        // Compensate: release inventory, cancel order
        inventory_service.release(order.items)
        order_service.cancel(saga_state.order_id)
        return failure("Payment failed")

    // All steps succeeded
    order_service.confirm(saga_state.order_id)
    return success(saga_state)
```

**Strengths**: Centralized visibility into saga state. Easy to understand the flow (it's in one place). No cyclic dependencies. Easier to debug.

**Weaknesses**: The orchestrator is a single point of coordination (though not a single point of failure if it's stateless and its state is persisted). Risk of the orchestrator becoming a god object that knows too much about all services.

**When to use choreography**: Simple sagas (2-4 steps), when services are independently owned by different teams, when adding new saga participants should not require changing existing services.

**When to use orchestration**: Complex sagas (4+ steps), when you need centralized visibility, when the saga logic changes frequently, when compensation logic is non-trivial.

**Scale context**: At Solo/Startup, sagas are unnecessary (use ACID transactions in a monolith). At Growth, simple sagas with choreography. At Scale, orchestration for complex workflows, choreography for simple ones.

**Checklist**:
- [ ] Does every saga have a defined compensation strategy for each step?
- [ ] Is saga state persisted (so the saga can resume after a crash)?
- [ ] Are sagas idempotent (duplicate messages don't cause double execution)?
- [ ] Is there a timeout for saga completion? What happens if a saga hangs?

**From**: Microservices Patterns (Richardson), Software Architecture: The Hard Parts

### CQRS (Command Query Responsibility Segregation)

CQRS separates the model that handles writes (commands) from the model that handles reads (queries). The write model is optimized for consistency and business logic. The read model is optimized for the specific queries the application needs.

```
┌──────────┐  Command   ┌──────────────┐  Event    ┌──────────┐
│  Client  │───────────▶│  Write Model  │──────────▶│  Event   │
│          │            │  (Commands)  │           │  Bus     │
│          │            └──────────────┘           └────┬─────┘
│          │                                            │
│          │  Query     ┌──────────────┐  Subscribe     │
│          │◀───────────│  Read Model  │◀───────────────┘
└──────────┘            │  (Queries)   │
                        └──────────────┘
```

```
// Write side. Handles commands.
handle(command: PlaceOrder):
    // Validate business rules
    if !customer.is_active:
        return failure("Inactive customer")
    if !inventory.is_available(command.items):
        return failure("Insufficient inventory")

    // Generate events
    events = [
        OrderPlaced(order_id, customer_id, items, total),
        InventoryReserved(order_id, items)
    ]
    event_store.append(events)
    event_bus.publish(events)

// Read side. Handles queries. Projections built from events.
// Projection: OrderSummary (built from OrderPlaced, OrderShipped, etc.)
handle(query: GetOrderSummary, order_id):
    return order_summary_view.find(order_id)
    // This view is a denormalized, query-optimized representation
```

**When to apply**: When read and write patterns differ significantly (simple writes, complex reads). When read and write volumes are very different (heavy reads, light writes). When read and write models need different data stores. When you need separate scaling for reads and writes.

**When NOT**: When the application is simple CRUD. When the read and write models are nearly identical. When the added complexity (dual models, event propagation, eventual consistency between read and write sides) outweighs the benefit.

**Trade-off**: CQRS gives you independent optimization of reads and writes, independent scaling, and clean separation of concerns. You give up simplicity (two models instead of one), immediate consistency (the read model lags behind the write model), and you add infrastructure (event propagation mechanism).

**Scale context**: At Solo/Startup, CQRS is overkill. At Growth, consider CQRS for specific high-read/low-write paths. At Scale, CQRS becomes appropriate for the most demanding queries.

**From**: CQRS Documents (Greg Young), Microservices Patterns (Richardson)

### Event Sourcing

Instead of storing the current state, store the sequence of events that led to the current state. The current state is derived by replaying events. Events are immutable and append-only.

```
// Instead of storing:
//   account = { id: "123", balance: 100 }
//
// Store events:
//   [AccountOpened(id="123", initial_deposit=100)]
//   [Deposited(id="123", amount=50)]
//   [Withdrawn(id="123", amount=30)]
//
// Current state = replay events:
//   balance = 100 + 50 - 30 = 120
```

**Strengths**: Complete audit trail (every state change is recorded). Temporal queries ("what was the balance last Tuesday?"). Event replay for debugging, analytics, and new projections. No object-relational impedance mismatch (events are the source of truth).

**Weaknesses**: Event versioning complexity (events evolve, old events must still be replayable). Eventual consistency (projections lag behind events). Storage growth (events accumulate forever unless snapshotted). Learning curve (developers must think in events, not state).

**When to apply**: Audit-heavy domains (finance, healthcare, compliance). When temporal queries are required. When the domain is naturally event-driven. When you need to rebuild state for new use cases without changing the source of truth.

**When NOT**: Simple CRUD applications. When the domain doesn't benefit from event history. When the team lacks experience with event-driven thinking. When storage cost of keeping all events is prohibitive.

**Real-world**: EventStoreDB (specialized event store). Axon Framework (CQRS + Event Sourcing framework for JVM). Kafka can serve as an event store if configured with log compaction and infinite retention.

**Scale context**: At Solo/Startup, event sourcing is almost certainly overkill. At Growth, consider for audit-critical domains. At Scale, event sourcing becomes practical because the infrastructure and team expertise exist to support it.

**Checklist**:
- [ ] Is event versioning strategy defined (how do events evolve)?
- [ ] Are snapshots used to reduce replay time for long-lived aggregates?
- [ ] Is storage growth estimated and monitored?
- [ ] Do developers understand the event-first mental model?

**From**: Event Sourcing (Greg Young), Implementing Domain-Driven Design (Vernon), DDIA (Kleppmann)

### Outbox Pattern

The problem: you need to update the database and publish a message atomically. If you update the database then publish the message, a crash after the database write but before the message publish means the message is lost. If you publish the message then update the database, a crash after the publish but before the database write means you published an event for a transaction that never committed.

The solution: write the message to an outbox table in the same database transaction as the business data. A separate process (outbox publisher) reads the outbox table and publishes messages.

```
// Business logic + outbox in one transaction
transaction:
    // Business data
    order_repo.save(order)
    // Outbox entry. Same transaction ensures atomicity.
    outbox_repo.save({
        id: uuid(),
        aggregate_type: "Order",
        aggregate_id: order.id,
        event_type: "OrderPlaced",
        payload: { order_id: order.id, items: order.items },
        created_at: now()
    })

// Separate process: Outbox Publisher
// Runs on a schedule or tailing the outbox table
publish_outbox():
    messages = outbox_repo.fetch_unpublished(limit=100)
    for message in messages:
        event_bus.publish(message.event_type, message.payload)
        outbox_repo.mark_published(message.id)
```

**When to apply**: Any time you need to publish an event as a side effect of a database transaction and you cannot tolerate lost messages.

**When NOT**: When you can use Change Data Capture (CDC) instead (the database emits changes automatically). When the message publish is not critical (lost messages are acceptable).

**Real-world**: Debezium (CDC tool that eliminates the need for the outbox pattern by capturing database changes directly). Transactional Outbox in the Eventuate framework.

**From**: Microservices Patterns (Richardson), Designing Event-Driven Systems (Stopford)

### Change Data Capture (CDC)

CDC captures changes to a database and publishes them as events. Instead of the application writing to an outbox table, CDC monitors the database's transaction log (WAL in PostgreSQL, binlog in MySQL) and emits events for every committed change.

**Real-world**: **Debezium**: Connects to databases (MySQL, PostgreSQL, MongoDB, SQL Server), reads the transaction log, and publishes changes to Kafka. Debezium handles schema evolution, snapshotting, and connector management. Architectural decision: CDC shifts the responsibility for event publishing from the application to the infrastructure. This simplifies application code but adds infrastructure complexity.

**When to use CDC**: When you need to capture changes from an existing database without modifying application code. When you need a reliable, ordered stream of all database changes. When multiple downstream systems need to react to database changes.

**When NOT**: When the database changes don't map cleanly to domain events (raw row changes vs. meaningful business events). When the database doesn't support CDC (or the CDC tool doesn't support your database).

**From**: DDIA (Kleppmann), Designing Event-Driven Systems (Stopford)

### Idempotency

An idempotent operation produces the same result whether executed once or multiple times. In distributed systems, messages can be delivered more than once (at-least-once delivery). Every operation that receives messages must handle duplicates safely.

**Idempotency Keys**: The client generates a unique key for each operation. The server stores processed keys and ignores duplicates.

```
// Client
process_payment(customer_id, amount):
    idempotency_key = generate_uuid()
    response = payment_service.post("/payments", {
        customer_id: customer_id,
        amount: amount,
        idempotency_key: idempotency_key
    })
    // If timeout, retry with SAME idempotency key
    if response.timeout:
        retry_with_same_key(idempotency_key)

// Server
handle_payment(request):
    existing = idempotency_store.get(request.idempotency_key)
    if existing:
        return existing.response  // Return cached response, don't re-execute

    result = process_payment_internal(request)
    idempotency_store.save(request.idempotency_key, result)
    return result
```

**When to apply**: Every operation that receives messages from a queue or event stream. Every API endpoint that modifies state. Every operation that can be retried.

**When NOT**: Read-only operations (GET requests). Operations where duplicates are impossible (exactly-once delivery, which is a myth at scale).

**Checklist**:
- [ ] Does every state-modifying operation have an idempotency strategy?
- [ ] Are idempotency keys generated by the client, not the server?
- [ ] Is there a TTL on idempotency key storage (to bound storage growth)?
- [ ] Are retried requests using the same idempotency key as the original?

**From**: DDIA (Kleppmann), Stripe API Design (idempotency key pattern), Designing Event-Driven Systems (Stopford)

---

## Resilience Patterns

Resilience is the ability of a system to handle failure gracefully. In a distributed system, failure is not exceptional. It is normal. Every component must be designed to handle the failure of every component it depends on.

### Circuit Breaker

A circuit breaker prevents cascading failures by detecting when a downstream service is failing and failing fast instead of waiting for timeouts.

**States**:

```
        ┌──────────┐
        │  CLOSED  │ (normal operation, requests pass through)
        └────┬─────┘
             │ failures exceed threshold
             ▼
        ┌──────────┐
        │   OPEN   │ (requests fail immediately, no attempt to call downstream)
        └────┬─────┘
             │ timeout expires
             ▼
        ┌──────────────┐
        │  HALF-OPEN   │ (limited requests pass through to test if downstream recovered)
        └──────┬───────┘
               │
          ┌────┴────┐
          │         │
    success│         │failure
          ▼         ▼
     ┌────────┐  ┌────────┐
     │ CLOSED │  │  OPEN  │
     └────────┘  └────────┘
```

```
// Circuit breaker pseudocode
class CircuitBreaker:
    state = CLOSED
    failure_count = 0
    last_failure_time = null
    threshold = 5                // failures before opening
    timeout = 30_seconds         // time before half-open attempt

    call(operation):
        if state == OPEN:
            if (now() - last_failure_time) > timeout:
                state = HALF_OPEN  // Try again
            else:
                return error("Circuit breaker is open")

        try:
            result = operation()
            if state == HALF_OPEN:
                state = CLOSED      // Recovery confirmed
                failure_count = 0
            return result
        catch Failure:
            failure_count++
            last_failure_time = now()
            if failure_count >= threshold:
                state = OPEN
            throw
```

**When to apply**: Every synchronous call to an external service. Every database call. Every third-party API call.

**When NOT**: Calls that are not critical (failure is acceptable without circuit breaking). Calls to services that are designed to be called infrequently.

**Real-world**: Resilience4j (Java circuit breaker library), Polly (.NET resilience library), Hystrix (deprecated but the pattern lives on). Istio and Envoy provide circuit breaking at the service mesh level.

**Checklist**:
- [ ] Does every synchronous external call have a circuit breaker?
- [ ] Are circuit breaker thresholds tuned to the specific dependency (not one-size-fits-all)?
- [ ] Is there a fallback behavior when the circuit is open?
- [ ] Are circuit breaker events logged and monitored?

### Bulkhead

Bulkheads isolate failures by partitioning resources. If one partition fails (thread pool exhausted, connection pool saturated), other partitions are unaffected.

**Pattern**: Assign separate thread pools or connection pools per downstream dependency. Service A's thread pool for calling Service B is separate from Service A's thread pool for calling Service C. If Service B slows down and saturates its thread pool, Service C calls are unaffected.

**When to apply**: When a service calls multiple downstream dependencies and you need to prevent one slow dependency from starving others.

**When NOT**: When resource isolation adds more complexity than the risk justifies. When there are very few downstream dependencies.

**Real-world**: Resilience4j Bulkhead module. Kubernetes resource limits (CPU/memory limits per container) as a bulkhead at the infrastructure level.

### Retry with Backoff

When a call fails due to a transient error (network blip, temporary overload, brief outage), retry with increasing delays between attempts.

**Exponential backoff with jitter**: After each failure, wait longer before the next attempt. Add random jitter to prevent thundering herd (all clients retrying simultaneously).

```
// Retry with exponential backoff + jitter
retry_with_backoff(operation, max_attempts=3):
    for attempt in 1..max_attempts:
        try:
            return operation()
        catch TransientFailure:
            if attempt == max_attempts:
                throw  // All attempts exhausted
            // Exponential backoff: 100ms, 200ms, 400ms
            base_delay = 100ms * (2 ^ (attempt - 1))
            // Jitter: random 0-50% to prevent thundering herd
            jitter = random(0, base_delay * 0.5)
            sleep(base_delay + jitter)
```

**When to apply**: Transient failures only (network timeouts, 503 Service Unavailable, connection refused). Not for permanent failures (400 Bad Request, 401 Unauthorized, 404 Not Found).

**When NOT**: When the operation is not idempotent and retrying would cause duplicate side effects. When the downstream service is already overloaded (retries make it worse). When the failure is permanent (retrying won't help).

**Checklist**:
- [ ] Does every retry use exponential backoff with jitter?
- [ ] Is there a maximum number of retry attempts?
- [ ] Are retried operations idempotent?
- [ ] Is the retry budget bounded (not infinite retries)?

### Timeout

Every call that waits for a response must have a timeout. No timeout = infinite wait = resource leak. Set timeouts per call and budget them across the call chain.

**Budgeting timeouts across a call chain**: If Service A calls Service B, which calls Service C, and the total timeout is 3 seconds, allocate time across the chain: Service A → B: 2.8s, Service B → C: 2.5s. Each hop gets a timeout slightly less than the caller's timeout, leaving headroom for processing.

**When to apply**: Every network call. Every I/O operation. Every lock acquisition. Every resource wait.

**When NOT**: Never. Every blocking operation needs a timeout.

**Checklist**:
- [ ] Does every network call have an explicit timeout?
- [ ] Are timeouts tuned per dependency (database: 1s, third-party API: 5s, internal service: 500ms)?
- [ ] Are timeouts budgeted across call chains (each hop's timeout < caller's timeout)?
- [ ] Is the default timeout reasonable (not infinite, not too aggressive)?

### Rate Limiting

Rate limiting protects services from being overwhelmed by too many requests. It enforces a maximum request rate per client, per API key, per IP, or per service.

**Algorithms**:

- **Token Bucket**: Tokens are added to a bucket at a fixed rate (e.g., 10 tokens/second). Each request consumes a token. If the bucket is empty, the request is rejected. Bursts are allowed up to the bucket capacity.

- **Leaky Bucket**: Requests enter a queue (the bucket) and are processed at a fixed rate. If the queue is full, requests are dropped. This smooths bursty traffic into a steady stream.

- **Sliding Window**: Track the number of requests in the last N seconds. If the count exceeds the limit, reject. More accurate than fixed window (which has edge effects at window boundaries).

**When to apply**: Every public API. Every service that has limited capacity. Every multi-tenant system where one tenant should not starve others.

**Real-world**: Kong rate limiting plugin (token bucket). Envoy rate limiting (token bucket with Redis backend for distributed rate limiting). Guava RateLimiter (Java library).

**From**: Release It! (Nygard)

### Health Checks

Health checks tell the infrastructure whether a service instance can handle traffic. There are two types:

**Liveness**: Is the process running? ("Am I alive?") Used by orchestrators to decide whether to restart the instance. A failed liveness check means the process is dead or stuck and needs a restart.

**Readiness**: Can the process handle traffic? ("Am I ready to serve?") Used by load balancers and service meshes to decide whether to route traffic to the instance. A failed readiness check means the instance is alive but not ready (starting up, warming up, overloaded, dependent service unavailable).

**Real-world**: Kubernetes uses liveness probes (restartPolicy) and readiness probes (removed from Service endpoints). A common mistake: making the liveness check depend on external services. If the database is down, the liveness check fails, Kubernetes restarts the pod, and the restarted pod also can't reach the database. Infinite restart loop. Liveness should only check the process itself. Readiness can check dependencies.

**Checklist**:
- [ ] Does every service have both liveness and readiness endpoints?
- [ ] Does the liveness check depend ONLY on the process itself (not external dependencies)?
- [ ] Does the readiness check include critical dependencies (database, message broker)?
- [ ] Are health check timeouts and intervals configured?

### Graceful Degradation

When a dependency is unavailable, the service should degrade gracefully rather than fail completely. Serve partial results. Use cached data. Disable non-essential features. The system should get worse, not stop.

**Patterns**:
- **Stale cache**: Serve cached data when the source is unavailable. Mark the response as stale.
- **Feature toggles**: Disable non-critical features under load (recommendations, analytics, non-essential UI elements).
- **Fallback defaults**: Return sensible defaults when a dependency is unavailable.
- **Read-only mode**: When the write path is degraded, switch to read-only and queue writes for later.

**When to apply**: Every service that has dependencies. Define degradation behavior for each dependency.

**Checklist**:
- [ ] Is there a defined degradation behavior for each external dependency?
- [ ] Can the service operate in a degraded mode (read-only, stale cache, reduced features)?
- [ ] Is degraded mode communicated to users (not silently serving wrong data)?

### Chaos Engineering

Chaos engineering is the practice of intentionally injecting failures into a production system to verify that it handles them gracefully. If you don't test failure, you don't know if your resilience patterns work.

**Principles**:
- Start with a hypothesis: "If we terminate 50% of our database replicas, the application should continue serving reads without errors."
- Inject the failure in a controlled way (limited blast radius, ability to abort).
- Measure the impact against your SLOs.
- If the hypothesis is wrong, fix the system. Don't just stop injecting failures.

**Real-world**: Netflix Chaos Monkey (randomly terminates instances in production). Gremlin (commercial chaos engineering platform). Litmus (Kubernetes-native chaos engineering). Chaos Mesh (CNCF chaos engineering for Kubernetes).

**When to apply**: At Scale tier. Chaos engineering is an advanced practice. Don't start chaos engineering before you have basic resilience (timeouts, retries, circuit breakers) in place and reliable observability.

**When NOT**: At Solo/Startup. At Growth, start with game days (scheduled failure injection in a controlled environment) before moving to production chaos engineering.

**From**: Release It! (Nygard), Chaos Engineering (Rosenthal et al.)

---

## Reactive Systems

Reactive systems are designed to be responsive under all conditions. The Reactive Manifesto defines four traits: Responsive (respond in a timely manner), Resilient (stay responsive in the face of failure), Elastic (stay responsive under varying workload), and Message-Driven (use asynchronous message passing for loose coupling and backpressure).

### Reactive Manifesto

**Responsive**: The system responds in a consistent, timely manner. Responsiveness is the primary trait. The other three traits support responsiveness. A system that is not responsive is not usable.

**Resilient**: The system stays responsive when components fail. Resilience is achieved through replication, containment, isolation, and delegation. Failures are contained within components. Recovery is delegated to external components (supervisors).

**Elastic**: The system stays responsive under varying workload. It scales up when load increases and scales down when load decreases. Elasticity is achieved through dynamic resource allocation and location transparency (the system can move components without breaking communication).

**Message-Driven**: Components communicate via asynchronous message passing. This provides loose coupling, isolation, and backpressure. Message-driven communication is the foundation that enables resilience and elasticity.

### Reactive Streams

Reactive Streams is a specification for asynchronous stream processing with non-blocking backpressure. The key insight: a fast producer should not overwhelm a slow consumer. The consumer signals how many items it can handle, and the producer sends only that many.

**Backpressure**: The consumer controls the flow rate. The producer respects the consumer's capacity. This prevents buffer bloat, out-of-memory errors, and latency spikes caused by unbounded queues.

**When to apply**: High-throughput stream processing, data pipelines, real-time analytics, systems where producers and consumers have different throughput profiles.

**When NOT**: Simple request-response applications. Low-throughput systems where backpressure is unnecessary overhead.

### Actor Model

The actor model is a concurrency model where "actors" are the universal primitives. Each actor has isolated state, communicates only via asynchronous message passing, and can create other actors. Actors are organized in supervision hierarchies: parent actors supervise child actors and decide what to do when children fail.

**Key properties**:
- **Isolated state**: An actor's state is private. No shared memory. No locks.
- **Message passing**: All communication is asynchronous. Actors process one message at a time.
- **Supervision**: Parents supervise children. When a child fails, the parent decides: restart, stop, escalate, or resume.
- **Location transparency**: Actors can be local or remote. The calling code doesn't know or care.

**Real-world**: Akka (JVM actor framework, inspired by Erlang/OTP). Erlang/OTP (the original actor model implementation, designed for telecom systems with "five nines" availability). Orleans (Microsoft's virtual actor framework, actors are "activated" on demand).

**When to apply**: Systems that need fine-grained fault isolation. Systems with complex concurrency where shared-state concurrency (locks, mutexes) is error-prone. Systems that naturally map to stateful, message-processing entities (IoT devices, user sessions, game entities).

**When NOT**: Simple CRUD applications. Stateless request-response services. Systems where the team lacks experience with the actor model (the learning curve is real).

**Scale context**: At Solo/Startup, the actor model is overkill. At Growth, consider actors for specific subsystems with complex concurrency. At Scale, actor-based systems (Erlang/OTP, Akka Cluster) become practical for their fault tolerance guarantees.

**From**: Reactive Design Patterns (Kuhn), Designing Event-Driven Systems (Stopford)

---

## Event-Driven Architecture Deep Dive

Event-driven architecture (EDA) is an architectural style where components communicate by producing and consuming events. Events represent facts: something that happened. Components react to events by producing new events or executing commands.

### Event Types

**Domain Events**: Events that domain experts care about. They represent something meaningful in the business domain. "OrderPlaced", "PaymentReceived", "ShipmentDelivered". These are the core of event-driven systems and should be named in the ubiquitous language. (See software-architect-ddd.md § Domain Event)

**Integration Events**: Events published for external consumption by other bounded contexts or services. They are the public API of a service's event stream. Integration events should be stable and versioned. They should carry enough data for consumers to act without calling back.

**Event Notifications**: Minimal events that say "something happened" but carry no data. The consumer must call back to get details. "OrderUpdated" with just an order ID. Simple but creates coupling (consumer must make a synchronous call).

**Event-Carried State Transfer**: Events that carry all the data the consumer needs. "OrderPlaced" with full order details. The consumer can act without calling back. This reduces coupling but increases event size and data duplication.

**Guideline**: Prefer event-carried state transfer for cross-service events. The consumer should be able to react to the event without a synchronous callback. This is what makes systems truly decoupled.

### Event Schema Design

Events are the API contract between services. Schema changes must be managed carefully.

**Compatibility types**:
- **Forward compatibility**: Old consumers can read new events. Achieved by adding optional fields (with defaults) but never removing required fields.
- **Backward compatibility**: New consumers can read old events. Achieved by never removing fields that consumers expect and always providing defaults for new required fields.
- **Full compatibility**: Both forward and backward compatible. The gold standard for event schemas. Every change is additive and optional.

**Schema evolution strategies**:
- Use a schema registry (Confluent Schema Registry for Avro, AWS Glue Schema Registry) to enforce compatibility rules.
- Version events in the event type name: "OrderPlaced_v1", "OrderPlaced_v2". This is explicit but creates multiple event types that consumers must handle.
- Use a serialization format that supports schema evolution: Avro, Protobuf (additive only), JSON Schema (with careful management).

**When to apply**: Every event stream that has multiple consumers with different deployment schedules.

**Checklist**:
- [ ] Are event schemas versioned and managed in a schema registry?
- [ ] Is the compatibility strategy (forward, backward, full) documented?
- [ ] Are new fields always optional with defaults?
- [ ] Is there a deprecation process for old event types/fields?

### Event Ordering

Not all event streams need total ordering. Know what ordering guarantees you need and what you can live without.

**Partition-level ordering**: Events within the same partition (same key) are ordered. Events across partitions have no ordering guarantee. This is Kafka's default: order is guaranteed per partition, not across partitions. This is sufficient for most use cases if you partition by aggregate ID (all events for order #123 go to the same partition and are ordered).

**Causal ordering**: Causally related events are seen in the same order by all consumers. Unrelated (concurrent) events may be seen in different orders. This requires vector clocks or logical timestamps.

**Total ordering**: All events are seen in the same order by all consumers. This is the strongest guarantee and the most expensive. It requires a single writer or a consensus protocol.

**When to use partition-level ordering**: Most use cases. Partition by aggregate ID (order ID, customer ID). All events for a given aggregate are ordered.

**When to use total ordering**: When the business logic requires a global order (rare). Financial ledgers where the order of transactions across all accounts matters. This is expensive and should be avoided unless absolutely necessary.

### Kafka Architecture

Kafka is the de facto open-source event streaming platform. Understanding its architecture illuminates the trade-offs inherent in event-driven systems.

**Core design**:
- **Partitioned append-only log**: Kafka topics are split into partitions. Each partition is an ordered, immutable sequence of records. Records are appended to the end. This is the foundation of Kafka's performance: sequential disk I/O is fast, random I/O is slow.
- **Consumer groups**: Consumers in the same group divide partitions among themselves. Each partition is consumed by exactly one consumer in the group. This enables parallel consumption. If a consumer fails, its partitions are reassigned to other consumers (rebalancing).
- **Durability**: Records are written to disk and replicated across brokers. A record is committed when it has been replicated to a configurable number of brokers (replication factor).
- **Retention**: Records are retained for a configurable time or size. Unlike traditional message queues, messages are not deleted after consumption. This enables replay, reprocessing, and new consumers that read historical data.

**Exactly-once semantics**: Kafka supports exactly-once processing through a combination of idempotent producers (the producer assigns sequence numbers and the broker deduplicates), transactional writes (multiple partitions written atomically), and transactional consumption (consumers only read committed messages). Note: "exactly-once" in Kafka means "exactly-once within the Kafka ecosystem." External side effects (sending an email, calling an external API) still require idempotency.

**Topic compaction**: Instead of deleting old records by time, compaction keeps the latest record per key. This is useful for event-carried state transfer: consumers can read the latest state for every key without replaying the entire history.

**Architectural decisions and trade-offs**:
- Kafka chose availability and partition tolerance over consistency (AP in CAP terms). During a network partition, producers can still write to available partitions. The system remains available but may serve stale data.
- Kafka chose disk-based storage over in-memory for durability and replayability. This gives Kafka its "event store" capability (replay history) at the cost of higher latency compared to in-memory message brokers.
- Kafka chose pull-based consumption (consumers pull records) over push-based. This gives consumers control over their processing rate (backpressure) at the cost of polling latency.

**When to use Kafka**: When you need a durable, replayable event log. When you have multiple consumers of the same events. When you need high throughput (millions of messages/second). When you need to decouple producers and consumers in time (consumers can be hours behind).

**When NOT**: When you need low-latency, point-to-point messaging (use RabbitMQ or cloud-native queues). When you don't need event replay. When your team lacks Kafka operational expertise (Kafka is complex to operate at scale).

**Checklist**:
- [ ] Are topics partitioned by aggregate ID for ordering guarantees?
- [ ] Is the replication factor appropriate for the durability requirements?
- [ ] Is the retention policy appropriate for the use case (time-based vs compaction)?
- [ ] Are consumers designed for at-least-once delivery (idempotency)?
- [ ] Is the Kafka cluster sized for the expected throughput and storage?

**From**: Designing Event-Driven Systems (Stopford), Kafka: The Definitive Guide (Narkhede, Shapira, Palino)

---

## Distributed Systems Checklist

This is the master checklist for distributed systems architecture. Run through these items when designing or reviewing any distributed system.

### Consistency & Data

- [ ] Is the consistency model explicitly chosen and documented for each data flow?
- [ ] If eventual consistency: what is the expected convergence time? How does the application handle stale reads?
- [ ] If strong consistency: what is the latency cost? Is it acceptable?
- [ ] Is every distributed transaction replaced with a saga or compensating transaction?
- [ ] Does every saga have a defined compensation strategy for each step?
- [ ] Are idempotency keys used for all state-modifying operations?
- [ ] Is the outbox pattern or CDC used for reliable event publishing?
- [ ] Are event schemas versioned and compatible (forward, backward, or full)?
- [ ] Is data ownership per service enforced (no shared databases)?

### Communication

- [ ] Is the communication pattern (sync vs async) chosen per interaction with documented rationale?
- [ ] Does every synchronous call have a timeout?
- [ ] Are timeouts budgeted across call chains?
- [ ] Does every synchronous external call have a circuit breaker?
- [ ] Are retries used with exponential backoff and jitter?
- [ ] Are retried operations idempotent?
- [ ] Is there a fallback or degradation strategy for every external dependency?

### Resilience

- [ ] Are bulkheads used to isolate failures (separate thread pools per dependency)?
- [ ] Is rate limiting in place for every service that has capacity limits?
- [ ] Do all services have liveness and readiness health checks?
- [ ] Does the liveness check depend only on the process itself?
- [ ] Is there a graceful degradation strategy for each dependency?
- [ ] Are failure scenarios tested (chaos engineering or game days)?

### Architecture

- [ ] Are the 8 fallacies of distributed computing addressed in the design?
- [ ] Is the service decomposition strategy documented and aligned with team structure?
- [ ] Is the service mesh decision documented (use vs not use, which one, why)?
- [ ] Is the API gateway a thin routing layer, not a business logic layer?
- [ ] Is the event ordering strategy documented (partition-level, causal, total)?
- [ ] Is the scale context explicitly stated for all architectural decisions?
- [ ] Are cross-cutting concerns (auth, logging, tracing, monitoring) addressed consistently?

---

## Book Source Appendix

| Section | Primary Sources |
|---|---|
| Distributed Systems Fundamentals (8 Fallacies, CAP, PACELC, Consistency, Consensus, Time) | Distributed Systems (Tanenbaum & van Steen), Understanding Distributed Systems (Vitillo), Designing Data-Intensive Applications (Kleppmann) |
| Microservice Decomposition | Building Microservices, 2nd Ed. (Newman), Microservices Patterns (Richardson), Software Architecture: The Hard Parts (Ford, Richards, Sadalage, Dehghani) |
| Distributed Data Patterns (Saga, CQRS, Event Sourcing, Outbox, CDC, Idempotency) | Microservices Patterns (Richardson), Designing Data-Intensive Applications (Kleppmann), Designing Event-Driven Systems (Stopford) |
| Resilience Patterns (Circuit Breaker, Bulkhead, Retry, Timeout, Rate Limiting, Health Checks, Graceful Degradation, Chaos Engineering) | Release It!, 2nd Ed. (Nygard), Building Microservices (Newman) |
| Reactive Systems (Manifesto, Streams, Actor Model) | Reactive Design Patterns (Kuhn), Designing Event-Driven Systems (Stopford) |
| Event-Driven Architecture Deep Dive (Event Types, Schema Design, Ordering, Kafka) | Designing Event-Driven Systems (Stopford), Kafka: The Definitive Guide (Narkhede, Shapira, Palino) |
| Enterprise Integration Patterns (Message Channels, Routers, Transformers) | Enterprise Integration Patterns (Hohpe & Woolf) |
| Service Mesh (Istio, Envoy, Linkerd) | Building Microservices (Newman), Istio documentation, Envoy documentation |
