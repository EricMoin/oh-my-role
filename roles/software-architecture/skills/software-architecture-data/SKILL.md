---
name: software-architecture-data
description: Data architecture for the Software Architecture suite. Covers data modeling fundamentals (relational, document, wide-column, graph, key-value, time-series), database internals at architect level (storage engines, indexes, transaction isolation, WAL, MVCC), replication strategies, partitioning/sharding, caching architecture, stream processing, system design methodology, and scalability patterns. Includes real-world OSS case studies from PostgreSQL, Redis, Elasticsearch, ClickHouse, TiDB, CockroachDB, and Vitess.
---

## Data Architecture Overview

Data architecture is the set of decisions that determine how data is stored, accessed, replicated, partitioned, cached, and processed at scale. It is the most difficult part of architecture to change. You can rewrite a service in a new language. You can swap a message queue for another. But migrating a database with years of production data and dozens of downstream consumers is a multi-year effort. Data architecture decisions are one-way doors. Invest proportionally.

This Skill covers the full stack of data architecture concerns: which data model fits your access patterns, how databases work internally (at the level an architect needs to decide among them), how to replicate and partition data for scale, how to cache, how to process streams, and how to systematically design data-intensive systems.

### What This Skill Owns

Per the Principle Ownership Map (See software-architecture-core.md § Principle Ownership Map), this Skill is the Home for:

- **Database per Service**: Microservice data isolation strategy
- **Polyglot Persistence**: Using different data stores for different workloads
- **Data Partitioning (Sharding)**: Splitting data across multiple nodes
- **Caching Strategies**: Cache placement, invalidation, and topology patterns

### What This Skill References (Does Not Redefine)

- **CAP Theorem, PACELC Theorem**: (See software-architecture-distributed.md § CAP Theorem)
- **Event Sourcing, CQRS**: (See software-architecture-distributed.md § Event Sourcing)
- **Saga Pattern**: (See software-architecture-distributed.md § Saga Pattern)
- **Idempotency**: (See software-architecture-distributed.md § Idempotency)
- **Domain Events**: (See software-architecture-ddd.md § Domain Event)
- **Aggregate Design**: (See software-architecture-ddd.md § Aggregate)
- **Immutability**: (See software-architecture-core.md § Principle Ownership Map — Home: software-architecture-patterns)


## Data Modeling Fundamentals

Data modeling is the process of structuring data to serve specific access patterns. The cardinal mistake is choosing a database first and then adapting your data model to fit it. The correct sequence: access patterns -> data model -> database choice. Each data model optimizes for a specific set of access patterns at the expense of others.

### The Six Core Data Models

#### Relational Model

**Definition**: Data organized into tables (relations) with rows and columns, connected by foreign keys. Normalized to eliminate redundancy. Queried with declarative SQL.

**When to Apply**: Your data has well-defined structure and relationships. You need ACID transactions. You need ad-hoc queries (you don't know all your queries upfront). You need strong consistency guarantees. This is the default model for most business applications.

**When NOT to Apply**: Your access pattern is purely key-value lookups (Redis is simpler). Your data is deeply nested and rarely queried across nesting boundaries (document model). Your write throughput exceeds what a single relational database can handle and your data has no relationships (wide-column).

**Trade-offs**: Normalization reduces data duplication but adds join complexity. ACID transactions provide consistency at the cost of write throughput and horizontal scalability. Schema enforcement prevents data corruption but slows iteration in early-stage products.

**Real-World OSS Example**: PostgreSQL. Chose: relational model with full ACID, extensible type system, and rich indexing (B-Tree, Hash, GiST, GIN, BRIN, SP-GiST). Gave up: horizontal write scalability (single-node writes by default), schema flexibility. Gained: the most battle-tested relational database, used by every industry for every workload.

**Scale Context**: At Solo/Startup, a single relational database handles all data (shared schema). At Growth, read replicas for query-heavy workloads; separate schemas per bounded context. At Scale, database per service with relational databases for transactional workloads and specialized stores for analytics, search, and caching.

**Checklist**:
- [ ] Are relationships between entities explicitly modeled (foreign keys)?
- [ ] Is the schema normalized to at least 3NF before deliberate denormalization?
- [ ] Are transactions used where consistency across multiple writes is required?
- [ ] Is the access pattern primarily multi-row queries with joins?

#### Document Model

**Definition**: Data stored as self-contained documents (JSON, BSON), typically with a schema that is enforced at the application level rather than the database level. Documents are accessed by primary key or by querying within document fields.

**When to Apply**: Your data is naturally hierarchical (a record and all its sub-records are always read together). Your schema evolves frequently. You have heterogeneous records (different fields per document type). One-to-many relationships where the "many" side is always accessed through the "one."

**When NOT to Apply**: You have many-to-many relationships. You need joins across documents (some document databases support limited joins, but performance degrades). You need ACID transactions across multiple documents (most document databases have limited multi-document transaction support). Your queries are primarily analytical (aggregation across many documents).

**Trade-offs**: Schema flexibility accelerates early development but shifts schema validation burden to application code. Denormalized/nested data eliminates joins for the primary access pattern but creates data duplication (and update anomalies) when the same data appears in multiple documents.

**Real-World Reference**: MongoDB. Chose: BSON document model with secondary indexes and aggregation pipeline. Gave up: joins (until v3.2), multi-document ACID transactions (until v4.0), SQL compatibility. Gained: flexible schema for rapidly evolving data models, natural fit for JSON-based APIs, good write throughput for document-sized updates.

**Scale Context**: At Solo/Startup, document databases shine (rapid iteration, schema flexibility). At Growth, beware of data duplication across documents; consider refactoring to a relational model if many-to-many relationships emerge. At Scale, use document databases for specific bounded contexts where the document model is the natural fit (user profiles, product catalogs, content management).

**Checklist**:
- [ ] Is the access pattern one-document-at-a-time (no cross-document joins)?
- [ ] Are the "many" sides of one-to-many relationships always accessed through the "one"?
- [ ] Is schema flexibility a genuine requirement (not just "we haven't designed the schema yet")?
- [ ] Is the data naturally hierarchical and self-contained?

#### Wide-Column Model

**Definition**: Data organized into rows with dynamic column families. Each row can have a different set of columns. Columns are grouped into column families that are stored together on disk. Optimized for write-heavy workloads with known query patterns.

**When to Apply**: Write-heavy analytical workloads. Time-series data with high write throughput. Known query patterns (you design column families for specific queries). Massive scale requirements (petabytes of data across hundreds of nodes).

**When NOT to Apply**: You need ad-hoc queries (wide-column databases require query patterns to be designed upfront). You need ACID transactions (most wide-column databases offer eventual consistency). Your data has complex relationships (no joins). You have a small team and don't need petabyte scale.

**Trade-offs**: Extreme write scalability and predictable read performance at the cost of query flexibility. Schema must be designed around query patterns, not logical data relationships. This is the highest-operational-cost model: requires specialized expertise and significant infrastructure investment.

**Real-World Reference**: Apache Cassandra. Chose: wide-column model with eventual consistency, tunable consistency per operation, and linear write scalability. Gave up: joins, ACID transactions (limited lightweight transactions added later), ad-hoc queries, SQL. Gained: linear horizontal scalability for writes, multi-datacenter replication, operational simplicity at scale (no single point of failure).

**Scale Context**: At Solo/Startup, almost never appropriate. The operational cost exceeds the benefit. At Growth, consider for specific high-write workloads (event logging, metrics). At Scale, primary use case: time-series data, IoT telemetry, recommendation engines, fraud detection.

**Checklist**:
- [ ] Are all query patterns known before schema design?
- [ ] Is write throughput the primary scaling concern?
- [ ] Is the operational investment (specialized team, infrastructure) justified by the scale requirement?
- [ ] Are ad-hoc queries NOT required?

#### Graph Model

**Definition**: Data stored as nodes (entities) and edges (relationships), both of which can have properties. Optimized for traversal queries: "find all friends of friends who bought this product."

**When to Apply**: Your data is relationship-heavy and queries traverse these relationships multiple hops deep. Examples: social networks, recommendation engines, fraud detection (finding patterns in transaction networks), knowledge graphs, network topology analysis.

**When NOT to Apply**: Your queries are primarily single-hop (relational databases handle this fine). Your data volume is modest and relationships are simple. You need high write throughput on relationship data (graph databases optimize for reads/traversals, not writes).

**Trade-offs**: Traversal queries that would require dozens of self-joins in SQL execute efficiently. But writes (especially edge creation) are slower because indexes must be updated. Graph databases are optimized for OLTP graph traversals, not OLAP graph analytics (use graph processing frameworks for batch graph analytics).

**Real-World Reference**: Neo4j. Chose: native graph storage (index-free adjacency) with Cypher query language. Gave up: horizontal scalability (single-node writes, limited sharding), general-purpose query flexibility. Gained: sub-millisecond traversals for multi-hop queries that would be impossible in a relational database.

**Scale Context**: At Solo/Startup, a relational database with recursive CTEs handles most graph queries. At Growth, introduce a graph database for the specific bounded context that needs deep traversals. At Scale, graph database as a specialized store within a polyglot persistence strategy.

**Checklist**:
- [ ] Do queries traverse relationships 3+ hops deep?
- [ ] Are relationships first-class entities (not just foreign keys)?
- [ ] Is the domain inherently a graph (social network, recommendation, dependency tree)?
- [ ] Is the workload OLTP (point traversals) rather than OLAP (batch graph analytics)?

#### Key-Value Model

**Definition**: The simplest data model. A distributed hash table: every record has a key and an opaque value. No schema, no query language beyond GET and PUT. The database doesn't know or care what's inside the value.

**When to Apply**: Access pattern is purely key-based lookups. Latency must be sub-millisecond. Data is simple (session data, configuration, counters, feature flags). You need extremely high throughput for simple operations.

**When NOT to Apply**: You need to query by anything other than the primary key. You need relationships between records. You need transactions across multiple keys. You need to iterate over ranges of keys efficiently.

**Trade-offs**: Maximum performance for key-based access at the cost of zero query flexibility. The database cannot help you find data; you must know the key. If you need to list users by email domain, you must build and maintain that index yourself (or use a secondary data store).

**Real-World OSS Example**: Redis. Chose: in-memory key-value store with rich data structures (strings, hashes, lists, sets, sorted sets, streams, HyperLogLog). Gave up: durability guarantees (configurable via RDB/AOF persistence, but designed for speed, not durability), query flexibility, disk-based storage economics. Gained: sub-millisecond latency, 100K+ operations per second per instance, the simplest possible mental model.

**Scale Context**: At Solo/Startup, use for caching and session storage. At Growth, use for caching, rate limiting, leaderboards, real-time counters. At Scale, Redis Cluster for horizontal scaling, separate instances per workload type, Sentinel or Cluster for high availability.

**Checklist**:
- [ ] Is every access pattern a key-based lookup (no secondary queries)?
- [ ] Is sub-millisecond latency required?
- [ ] Is data loss tolerance acceptable (or are persistence settings configured)?
- [ ] Is the data model simple enough to be represented as key-value pairs?

#### Time-Series Model

**Definition**: Data indexed primarily by timestamp. Optimized for append-only writes, time-range queries, and downsampling (aggregating data over time windows). Retention policies automatically expire old data.

**When to Apply**: Metrics, monitoring data, IoT sensor data, financial tick data, application logs, event streams. Any data where time is the primary access dimension and writes are append-only.

**When NOT to Apply**: You need to update historical data (time-series databases are optimized for append, not update). You need complex joins across non-time dimensions. Your queries are not time-range based.

**Trade-offs**: Exceptional write throughput and time-range query performance at the cost of update flexibility and cross-entity joins. Data is typically immutable after write (append-only model). Retention policies automate data lifecycle management but mean you lose granularity over time.

**Real-World OSS Example**: ClickHouse. Chose: columnar storage with vectorized query execution, MergeTree engine family, and SQL interface. Gave up: update/delete performance (asynchronous mutations), OLTP workloads, ACID transactions. Gained: 100-1000x faster analytical queries than row-based databases, real-time data ingestion at millions of rows per second, extreme compression ratios (10x or more).

**Scale Context**: At Solo/Startup, a relational database with time-indexed tables is sufficient. At Growth, introduce a time-series database for metrics and monitoring data. At Scale, time-series databases as a core infrastructure component for observability, analytics, and real-time dashboards.

**Checklist**:
- [ ] Is time the primary dimension for all queries?
- [ ] Are writes append-only (no updates to historical data)?
- [ ] Are retention policies defined (how long to keep data, at what granularity)?
- [ ] Are queries primarily aggregations over time ranges?

### Data Model Selection Guide

The selection sequence must be: **access patterns -> data model -> database choice**. Never reverse this.

| Access Pattern | Recommended Model | Example Databases | Anti-Pattern Model |
|---|---|---|---|
| Key-based lookups, sub-ms latency | Key-Value | Redis, DynamoDB | Relational (overkill) |
| Multi-row queries, joins, ACID transactions | Relational | PostgreSQL, MySQL | Document (joins are painful) |
| Hierarchical data, one-document reads, evolving schema | Document | MongoDB, Couchbase | Relational (rigid schema) |
| Write-heavy, known query patterns, petabyte scale | Wide-Column | Cassandra, HBase | Relational (can't scale writes) |
| Deep relationship traversals (3+ hops) | Graph | Neo4j, JanusGraph | Relational (dozens of self-joins) |
| Time-indexed, append-only, aggregations over time ranges | Time-Series | ClickHouse, TimescaleDB | Relational (row-based is slow for column aggregations) |
| Full-text search, fuzzy matching, relevance ranking | Search Engine | Elasticsearch | Relational (LIKE queries don't scale) |

### Polyglot Persistence

**Definition**: Using different data stores for different workloads within the same system. Not every piece of data belongs in a relational database. Not every query needs ACID. Match the store to the workload.

**When to Apply**: Your system has clearly different data access patterns (transactional vs. analytical, relational vs. document, real-time vs. batch). You have the operational capability to run multiple database technologies. The benefit of specialized stores outweighs the operational cost.

**When NOT to Apply**: Your team is small (under 10 engineers) and the operational cost of multiple databases exceeds the benefit. Your workloads are all served adequately by a single database type. You're introducing polyglot persistence because it's "architecturally correct," not because a workload requires it.

**Trade-offs**: Each additional database adds operational complexity: backups, monitoring, failover, upgrades, security patching, expertise requirements. The benefit (better performance, simpler queries, appropriate consistency model) must justify this cost. Three databases that each serve one workload well is better than one database that serves all three poorly.

**Real-World Reference**: Amazon's architecture. Product catalog in DynamoDB (key-value, massive scale), order processing in relational databases (ACID), search in Elasticsearch (full-text), analytics in Redshift (columnar). Each store chosen for a specific access pattern.

**Scale Context**: At Solo/Startup, one database (relational) is the right default. At Growth, introduce a second store (Redis for caching, Elasticsearch for search) when the workload demands it. At Scale, polyglot persistence is the norm: each bounded context owns its data stores, chosen for its specific access patterns.

**Checklist**:
- [ ] Does each data store serve a distinct, measurable access pattern that another store cannot serve well?
- [ ] Is the operational cost of each additional database justified by the performance/query benefit?
- [ ] Does the team have (or plan to acquire) expertise in each database technology?
- [ ] Is there a plan for cross-store data consistency (if data exists in multiple stores)?


## Database Internals at Architect Level

An architect does not need to implement a storage engine. But an architect must understand storage engines well enough to choose among them, predict their behavior under load, and diagnose when they go wrong. This section covers the internals that drive architectural decisions.

### Storage Engines: B-Tree vs. LSM-Tree

Every database has a storage engine. The two dominant families are B-Tree and LSM-Tree. The choice between them is the single most impactful decision in database selection after the data model.

**Definition**: B-Tree is a balanced tree structure where data is stored in fixed-size pages (typically 4KB-16KB) on disk. Reads navigate from root to leaf. Writes modify pages in place. LSM-Tree (Log-Structured Merge-Tree) writes data sequentially to an in-memory memtable, flushes to sorted SSTables on disk, and periodically compacts SSTables in the background.

**When to Apply B-Tree**: Read-heavy workloads where latency must be predictable. Write throughput is moderate. You need strong transactional support (B-Trees are the default in relational databases with ACID). Updates are common (B-Trees handle in-place updates efficiently).

**When to Apply LSM-Tree**: Write-heavy workloads with high throughput. Reads can tolerate slightly higher and more variable latency. Storage space is a concern (LSM-Trees compress better). You can accept occasional write stalls during compaction.

**Trade-offs**:

| Dimension | B-Tree | LSM-Tree |
|---|---|---|
| Read speed | Faster (predictable page lookups) | Slower (must check multiple SSTables + bloom filters) |
| Write speed | Slower (random writes, write amplification from page splits) | Faster (sequential writes to memtable, batch flushes) |
| Space amplification | Higher (fragmented pages, reserved space per page) | Lower (sequential packing, better compression) |
| Write amplification | Lower for updates, higher for inserts causing splits | Higher (data rewritten multiple times during compaction) |
| Predictability | High (consistent performance) | Lower (compaction can cause latency spikes) |
| Transaction support | Native (page-level locking, MVCC) | Requires additional layer |

**Real-World OSS Examples**:
- **B-Tree**: PostgreSQL (default), MySQL InnoDB. Most relational databases.
- **LSM-Tree**: RocksDB (Facebook), LevelDB (Google), Cassandra, ClickHouse (MergeTree is LSM-inspired), TiDB (TiKV uses RocksDB).

**System**: PostgreSQL's B-Tree implementation.
**Architectural Decision**: Chose B-Tree as the default index type and table storage (heap + B-Tree indexes).
**Trade-off Rationale**: PostgreSQL is a general-purpose relational database. The majority of workloads are read-heavy OLTP. B-Tree provides predictable read latency and efficient in-place updates for UPDATE-heavy workloads. PostgreSQL also supports GiST, GIN, BRIN, and SP-GiST indexes for specialized workloads, but B-Tree is the default for good reason.
**What They Gave Up**: Write throughput (compared to LSM-Tree), storage efficiency (page fragmentation).
**What They Gained**: Predictable read latency, mature transaction support (MVCC on heap pages), decades of battle-tested reliability.

**Scale Context**: At Solo/Startup, B-Tree is the safe default (PostgreSQL, MySQL). At Growth, consider LSM-Tree for write-heavy subsystems (time-series data, event logs). At Scale, use both: B-Tree for OLTP, LSM-Tree for OLAP and high-write workloads.

**Checklist**:
- [ ] Is the workload read-heavy (B-Tree) or write-heavy (LSM-Tree)?
- [ ] Is predictable latency required (B-Tree) or is occasional latency variability acceptable (LSM-Tree)?
- [ ] Is storage cost a significant concern (LSM-Tree compresses better)?
- [ ] Are transactions required (B-Tree provides stronger native support)?

### Indexes: Types and Selection

Indexes are data structures that accelerate reads at the cost of slower writes and additional storage. Every index is a trade-off. The architect's job: choose indexes that serve the actual query patterns, not every possible query.

**B-Tree Index**: The default. Supports equality and range queries. Used by every relational database. Best for: ordered scans, range queries, prefix matching. Limitation: not efficient for multi-dimensional queries.

**Hash Index**: O(1) point lookups. Faster than B-Tree for exact-match equality queries. Used by: Redis, hash indexes in PostgreSQL, Memcached. Best for: key-value lookups. Limitation: no range queries, no ordering.

**Bloom Filter**: Probabilistic data structure that answers "this key definitely does NOT exist" or "this key MIGHT exist." Memory-efficient way to avoid expensive disk reads for non-existent keys. Used by: Cassandra, RocksDB, ClickHouse, HBase. Best for: reducing disk I/O for point lookups, especially for keys that don't exist.

**Bitmap Index**: Represents column values as bit vectors. Efficient for low-cardinality columns (status, category, boolean flags) where queries combine multiple conditions with AND/OR. Used by: PostgreSQL (via extensions), ClickHouse, Oracle. Best for: OLAP queries on low-cardinality dimensions. Limitation: inefficient for high-cardinality columns, expensive to update.

**GIN (Generalized Inverted Index)**: PostgreSQL-specific. Indexes composite values: arrays, JSONB, full-text search. Best for: "contains" queries ("find all documents containing this word," "find all rows where array contains this element"). Limitation: slower writes (must update multiple index entries per row).

**GiST (Generalized Search Tree)**: PostgreSQL-specific. Extensible index framework. Supports geometric data, full-text search, custom data types. Used by: PostGIS (geospatial indexes). Best for: custom data types with non-standard comparison operators.

**Inverted Index**: The foundation of full-text search. Maps each term to the list of documents containing it. Used by: Elasticsearch (Lucene). Best for: full-text search, relevance-ranked retrieval. Limitation: large index size, expensive updates.

**Decision Table: Which Index for Which Query Pattern**:

| Query Pattern | Index Type | Example Database |
|---|---|---|
| Exact key lookup | Hash, B-Tree | Redis, PostgreSQL |
| Range scan (A to B) | B-Tree | PostgreSQL, MySQL |
| Prefix search ("abc%") | B-Tree | PostgreSQL, MySQL |
| Full-text search ("data architecture") | Inverted Index (GIN, Lucene) | PostgreSQL GIN, Elasticsearch |
| Contains (array, JSONB) | GIN | PostgreSQL |
| Geospatial (within radius, intersects) | GiST | PostgreSQL + PostGIS |
| Low-cardinality column combinations | Bitmap | ClickHouse, PostgreSQL |
| Multi-dimensional (lat + long + time) | Composite B-Tree, specialized spatial | PostgreSQL, ClickHouse |

**Real-World OSS Example**: Elasticsearch (Lucene). Chose: inverted index with term frequency, document frequency, and field-length normalization for relevance scoring (TF-IDF/BM25). Gave up: ACID transactions, update performance (Lucene segments are immutable; updates are delete + reindex), storage efficiency. Gained: sub-second full-text search across billions of documents, relevance-ranked results, aggregations, and the most mature search engine ecosystem.

**Checklist**:
- [ ] Does every index serve at least one specific query pattern?
- [ ] Have unused indexes been removed (they cost write throughput and storage)?
- [ ] Are composite indexes designed with column order matching query patterns?
- [ ] Is the write amplification from indexes acceptable for the write throughput requirements?

### Transaction Isolation Levels

Transactions group multiple operations into a single logical unit. Isolation levels control how concurrent transactions interact. Weaker isolation = better performance, more anomalies. Stronger isolation = fewer anomalies, lower performance.

**Read Uncommitted**: A transaction can read uncommitted data from other transactions. Anomalies: dirty reads (reading data that will be rolled back). Use case: almost never. The cost of Read Committed is negligible.

**Read Committed**: A transaction only sees committed data from other transactions. Anomalies prevented: dirty reads. Anomalies still possible: non-repeatable reads (same query within a transaction returns different results because another transaction committed an update), phantom reads (same query returns different rows because another transaction inserted/deleted). Use case: default in PostgreSQL. Adequate for most OLTP workloads.

**Repeatable Read**: A transaction sees the same data for the duration of the transaction, even if other transactions commit changes. Anomalies prevented: dirty reads, non-repeatable reads. Anomalies still possible: phantom reads (in standard SQL; PostgreSQL's Repeatable Read prevents phantoms), write skew (two transactions read overlapping data and make conflicting writes based on what they read). Use case: reporting queries that must see a consistent snapshot, backup operations, data migration scripts.

**Serializable**: Transactions execute as if they were run serially, one after another. All anomalies prevented. Implementations: pessimistic (lock everything, rarely used), optimistic (detect conflicts at commit time, used by PostgreSQL's Serializable Snapshot Isolation), or strict two-phase locking. Use case: financial transactions, inventory management, any operation where inconsistency could have business or legal consequences.

**Isolation Level Comparison**:

| Level | Dirty Read | Non-Repeatable Read | Phantom Read | Write Skew | Performance |
|---|---|---|---|---|---|
| Read Uncommitted | Yes | Yes | Yes | Yes | Fastest |
| Read Committed | No | Yes | Yes | Yes | Fast (default) |
| Repeatable Read | No | No | PostgreSQL: No | Yes | Moderate |
| Serializable | No | No | No | No | Slowest |

**Scale Context**: At Solo/Startup, Read Committed is the safe default. At Growth, identify transactions that need stronger isolation (financial operations, inventory). At Scale, Serializable for critical financial paths, Read Committed for everything else. Never weaken isolation for performance without explicit acceptance of the anomaly risk.

**Checklist**:
- [ ] Is the default isolation level (usually Read Committed) appropriate for the workload?
- [ ] Are transactions that require Serializable isolation explicitly identified?
- [ ] Are the specific anomalies that could occur at the chosen isolation level understood and accepted?
- [ ] Is there a plan for handling transactions that fail under Serializable isolation (retry logic)?

### WAL (Write-Ahead Log)

**Definition**: A durability mechanism. Before any data modification is applied to the actual data files (heap, indexes), it is first written to an append-only log. If the database crashes, the WAL is replayed to recover committed transactions that were not yet written to data files.

**When to Apply**: Any database that guarantees durability. This is not optional. Without a WAL, a crash loses all in-flight transactions and potentially corrupts data structures that were mid-modification.

**Architectural Significance**: The WAL is the primary source of truth during recovery. The data files are a cache of the WAL. This has implications: (1) write throughput is bounded by WAL write speed, (2) WAL size directly impacts recovery time, (3) WAL is used for replication (streaming replication in PostgreSQL sends WAL records to replicas).

**Real-World OSS Example**: PostgreSQL's WAL. Every change (INSERT, UPDATE, DELETE, DDL) generates WAL records. WAL is written sequentially to disk (good for HDDs and SSDs). Checkpoints periodically flush dirty pages from memory to data files, allowing old WAL segments to be recycled. WAL-based replication (physical or logical) is the foundation of PostgreSQL replication.

**Checklist**:
- [ ] Is WAL configured with appropriate `fsync` settings (never disable for production)?
- [ ] Is WAL size and checkpoint frequency tuned for recovery time objectives?
- [ ] Is WAL archiving configured for point-in-time recovery (PITR)?

### MVCC (Multi-Version Concurrency Control)

**Definition**: Instead of locking rows during writes, MVCC creates new versions of rows. Readers see a consistent snapshot of the database as it existed at the start of their transaction, regardless of concurrent writes. Writers don't block readers. Readers don't block writers.

**When to Apply**: Any database with concurrent read and write workloads. This is the dominant concurrency control mechanism in modern relational databases.

**Trade-offs**: MVCC eliminates most read-write contention (no read locks) at the cost of storage overhead (multiple versions of each row exist simultaneously) and the need for garbage collection (vacuum in PostgreSQL, purge in MySQL InnoDB). If vacuum falls behind, table bloat degrades performance and can cause transaction ID wraparound (a critical failure mode in PostgreSQL).

**Real-World OSS Example**: PostgreSQL's MVCC. Each row has `xmin` (transaction ID that created it) and `xmax` (transaction ID that deleted/updated it). A transaction sees only rows where `xmin` is committed and `xmax` is not set or is set by an uncommitted transaction. VACUUM reclaims space from dead tuples. Gave up: storage overhead (dead tuples consume space until vacuumed), vacuum maintenance overhead. Gained: concurrent reads and writes without blocking, consistent snapshots for long-running queries.

**Checklist**:
- [ ] Is vacuum/cleanup configured and monitored (PostgreSQL: autovacuum, MySQL: purge thread)?
- [ ] Are long-running transactions avoided (they prevent old row versions from being cleaned)?
- [ ] Is transaction ID wraparound risk monitored (PostgreSQL specific)?

### Database Internals Summary: Architectural Impact

| Internals Concept | Architectural Decision It Drives |
|---|---|
| B-Tree vs. LSM-Tree | Database choice for write-heavy vs. read-heavy workloads |
| Index types | Which queries the database can serve efficiently |
| Isolation levels | Consistency guarantees for multi-statement operations |
| WAL | Durability guarantees, replication mechanism, recovery time |
| MVCC | Concurrency model (readers vs. writers), storage overhead, maintenance (vacuum) |


## Replication

Replication keeps copies of the same data on multiple nodes. Purpose: increase availability (if one node fails, others serve reads), increase read throughput (distribute reads across replicas), reduce latency (place data geographically close to users), or all three. Replication is a fundamental distributed systems primitive. Its core challenge: keeping replicas consistent in the face of network delays and failures.

### Single-Leader Replication

**Definition**: One node is the leader (primary). All writes go to the leader. The leader propagates changes to followers (replicas). Reads can go to the leader (strong consistency) or to followers (eventual consistency, better read throughput).

**When to Apply**: Your workload is read-heavy and you can tolerate eventual consistency for reads. Write throughput is modest (bounded by a single leader). You need operational simplicity (single-leader is the simplest replication model). This is the default replication model for most relational databases.

**When NOT to Apply**: Write throughput exceeds what a single node can handle. You need multi-datacenter active-active writes. You cannot tolerate any replication lag (reads must always reflect the latest write).

**Trade-offs**: Simple to implement and operate. Consistent writes (single writer). Leader is a bottleneck for writes and a single point of failure (failover is needed). Replication lag means followers may serve stale data.

**Real-World OSS Example**: PostgreSQL streaming replication. WAL records streamed from primary to replicas. Synchronous replication (commit waits for replica acknowledgment) for durability, asynchronous for performance. Gave up: multi-writer scalability. Gained: battle-tested, simple to operate, widely understood.

**Scale Context**: At Solo/Startup, single instance (no replication needed). At Growth, read replicas for query offloading. At Scale, read replicas with connection pooling (PgBouncer), synchronous replication for critical data, multi-region read replicas for geographic latency reduction.

**Checklist**:
- [ ] Is failover configured and tested (manual or automated)?
- [ ] Is replication lag monitored?
- [ ] Are reads that require strong consistency directed to the leader?
- [ ] Is replication synchronous or asynchronous? Is the durability trade-off understood?

### Multi-Leader Replication

**Definition**: Multiple nodes accept writes. Each leader propagates its writes to other leaders. Conflict resolution is required when two leaders accept conflicting writes for the same record.

**When to Apply**: Multi-datacenter deployments where users in each datacenter need low-latency writes. Offline-capable applications (each device is a "leader" that syncs when reconnected). Collaborative editing (each user's session is a leader).

**When NOT to Apply**: You can't tolerate write conflicts (conflict resolution is inevitable in multi-leader). Your workload has frequent updates to the same records from different locations. You can meet latency requirements with single-leader + read replicas in remote datacenters.

**Trade-offs**: Better write availability and lower write latency in multi-datacenter deployments. But conflict resolution adds application complexity. Some conflicts cannot be resolved automatically (two users editing the same field to different values). Multi-leader is almost always more complex than it first appears.

**Checklist**:
- [ ] Is a conflict resolution strategy defined (LWW, CRDT, application-specific merge)?
- [ ] Are conflict rates monitored?
- [ ] Is the operational complexity of multi-leader justified by the latency/availability requirements?

### Leaderless Replication

**Definition**: No node is designated leader. Any replica can accept writes. Reads and writes are sent to multiple replicas in parallel. Consistency is achieved through quorum: if R + W > N (where N is total replicas, R is read quorum, W is write quorum), every read sees the latest write.

**When to Apply**: You need high write availability (no leader failover downtime). You can tolerate eventual consistency with tunable consistency per operation. Your system is designed for multi-datacenter deployment with high fault tolerance.

**When NOT to Apply**: You need strong consistency guarantees for every operation. Your team is small and the operational complexity of leaderless systems is unjustified.

**Trade-offs**: No leader failover. Higher availability during network partitions. But consistency is probabilistic (based on quorum configuration), conflict resolution is required for concurrent writes, and "sloppy quorums" (accepting writes to nodes outside the designated N) can violate the R + W > N guarantee. Read repair and anti-entropy mechanisms are required to heal inconsistencies.

**Real-World Reference**: Amazon Dynamo (the architecture paper, not the AWS service). Chose: leaderless replication with consistent hashing, hinted handoff, and tunable consistency. Gave up: strong consistency (eventual by default), simple mental model. Gained: always writable (high availability for the shopping cart use case), linear scalability.

**Scale Context**: At Solo/Startup, leaderless is overkill. At Growth, rarely needed. At Scale, used by systems that must be always writable (Cassandra, DynamoDB, Riak).

**Checklist**:
- [ ] Is the quorum configuration (N, R, W) chosen based on consistency and availability requirements?
- [ ] Is read repair or anti-entropy configured to heal inconsistencies?
- [ ] Are hinted handoffs monitored (they indicate node failures)?
- [ ] Is the "sloppy quorum" behavior understood (if enabled)?

### Replication Lag: Consistency Guarantees

Replication is asynchronous by default (for performance). This means replicas lag behind the leader. An application that reads from a replica may see stale data. Several consistency models mitigate this.

**Read-After-Write Consistency**: After a user writes data, their subsequent reads see that write. Implementation: read the user's own writes from the leader, or track the timestamp of the last write and wait for the replica to catch up.

**Monotonic Reads**: A user never sees data "go backward in time" (read from a replica that is ahead, then from one that is behind). Implementation: always read from the same replica for a given user.

**Consistent Prefix Reads**: Reads reflect causal order. If write A happened before write B, no read sees B without A. Relevant when writes have causal dependencies (e.g., a comment and its parent post). Implementation: ensure causally related writes go to the same partition.

**Replication Strategy Decision Table**:

| Strategy | Consistency | Write Throughput | Operational Complexity | Best For |
|---|---|---|---|---|
| Single-Leader | Strong (leader reads) / Eventual (replica reads) | Moderate (bottlenecked by leader) | Low | Default. Most applications. |
| Multi-Leader | Eventual with conflicts | High (multiple writers) | High | Multi-datacenter, offline-capable apps |
| Leaderless | Tunable (quorum) | High (any node accepts writes) | High | Always-writable systems, high availability |

**Checklist**:
- [ ] Is replication lag monitored and alerted on?
- [ ] Are consistency requirements per read operation documented (read-after-write, monotonic, consistent prefix)?
- [ ] Is the replication strategy documented with rationale?
- [ ] For asynchronous replication: is the maximum acceptable replication lag defined?


## Partitioning (Sharding)

Partitioning splits a dataset across multiple nodes so that no single node holds all the data. Purpose: scale writes beyond what a single machine can handle, scale storage beyond a single disk, and increase availability by reducing the blast radius of a node failure. Partitioning is the hardest scalability problem. Get it right early, or pay a migration cost measured in months.

### Partitioning Strategies

#### Range Partitioning

**Definition**: Assign contiguous ranges of the partition key to each node. Example: users A-F on node 1, G-M on node 2, N-Z on node 3. The partition boundaries are defined manually or automatically.

**When to Apply**: Queries frequently access contiguous ranges of keys (time-based queries, alphabetical scans). You need efficient range scans across partitions (the database can route to the specific partition rather than scatter-gather).

**When NOT to Apply**: Your key distribution is skewed (e.g., some ranges are much hotter than others). If user IDs starting with "A" generate 10x more traffic than "Z," range partitioning creates hot spots.

**Trade-offs**: Efficient range queries across partitions. But hot spots if key distribution is not uniform. Rebalancing requires splitting or merging ranges, which can be operationally complex.

**Checklist**:
- [ ] Is the partition key distribution uniform (no hot ranges)?
- [ ] Are range queries common in the workload?
- [ ] Is there a plan for rebalancing when a range becomes too large?

#### Hash Partitioning

**Definition**: Apply a hash function to the partition key. The hash value determines the partition. Example: `hash(user_id) % num_partitions`. This distributes data uniformly across partitions, eliminating hot spots.

**When to Apply**: Your workload has no range query patterns. Uniform data distribution is critical. You can accept that range queries require scatter-gather (query all partitions and merge results).

**When NOT to Apply**: You need efficient range scans. You frequently add or remove nodes (hash-based partitioning with modulo requires repartitioning all data when the number of nodes changes; use consistent hashing instead).

**Trade-offs**: Uniform data distribution eliminates hot spots but destroys key ordering. Range queries must be sent to every partition (scatter-gather). Adding/removing nodes with modulo hash requires massive data migration (every key's partition changes).

**Checklist**:
- [ ] Is the hash function uniform (no clustering of hash values)?
- [ ] Is the absence of range queries acceptable?
- [ ] Is the partition count fixed, or does the strategy handle node addition without full repartitioning?

#### Consistent Hashing

**Definition**: Nodes and keys are both hashed onto a ring. A key is assigned to the first node encountered clockwise from the key's hash position. When a node is added or removed, only keys in the immediate neighborhood are reassigned, not the entire dataset.

**When to Apply**: You need to add and remove nodes frequently without massive data migration. Your system is a distributed cache or a distributed key-value store where node churn is expected.

**When NOT to Apply**: You need efficient range queries. The ring-based assignment adds complexity compared to simple hash partitioning.

**Trade-offs**: Minimizes data movement during cluster changes. But key distribution can be uneven (some nodes get larger ring segments). Virtual nodes (vnodes) mitigate this: each physical node is assigned multiple positions on the ring.

**Real-World Reference**: Dynamo-style systems (Cassandra, Riak), Discord's migration from Cassandra to ScyllaDB.

**Checklist**:
- [ ] Are virtual nodes used to ensure uniform distribution?
- [ ] Is the number of vnodes per physical node configured based on heterogeneity (different node capacities)?
- [ ] Is the rebalancing cost understood and benchmarked?

### Rebalancing Strategies

When nodes are added or removed, partitions must be redistributed. The strategy determines how much data moves and how long it takes.

**Fixed Partitions**: Create many more partitions than nodes (e.g., 1000 partitions for 10 nodes). When a node is added, move a few partitions from existing nodes to the new node. Used by: Elasticsearch (shards), Vitess (shards). Advantage: simple. Disadvantage: partition count is fixed at creation; choosing the right number is hard (too few = limited scalability, too many = overhead per partition).

**Dynamic Splitting**: Partitions grow until they reach a size threshold, then split. Used by: HBase, MongoDB (hashed sharding with chunk migration), CockroachDB (ranges). Advantage: adapts to data growth. Disadvantage: splitting and merging add operational complexity.

**Partition-by-Node**: Each node gets a fixed number of partitions. When a node is added, the new node takes a subset of partitions from each existing node. Used by: Cassandra (vnodes), Redis Cluster (hash slots). Advantage: uniform distribution. Disadvantage: data movement is proportional to the number of partitions, not the data size.

| Strategy | Data Movement | Flexibility | Complexity | Best For |
|---|---|---|---|---|
| Fixed Partitions | Move entire partitions | Fixed at creation | Low | Known scale ceiling |
| Dynamic Splitting | Split/merge ranges | Adapts to data growth | Medium | Unknown growth patterns |
| Partition-by-Node | Proportional to partition count | High (vnodes) | Medium | Elastic clusters |

### Cross-Partition Queries

The hardest part of partitioning is queries that span multiple partitions.

**Scatter-Gather**: Send the query to all partitions, execute it locally on each, merge the results. Used for: queries with no partition key filter. Cost: O(num_partitions) overhead. Mitigation: parallel execution, limit the fan-out with careful schema design.

**Denormalization**: Store related data together in the same partition so that queries don't need to cross partitions. Trade-off: data duplication, update complexity (must update all copies). Used when: the query pattern is known and performance is critical.

**Secondary Indexes**: Allow queries on non-partition-key columns.
- **Local Secondary Indexes**: Each partition indexes only its own data. Query must be sent to all partitions. Good for: queries that also include the partition key.
- **Global Secondary Indexes**: A separate partitioned index covering all data. Query goes to the index first, then to the data partitions. Good for: queries on non-partition-key columns. Bad for: write amplification (every write must update both the data partition and the index partition).

### Real-World OSS Partitioning Case Studies

**System**: Vitess (MySQL sharding for YouTube-scale workloads).
**Architectural Decision**: Shard MySQL databases with application-transparent routing through VTGate proxy. Each shard is a fully functional MySQL instance. Fixed partition count with hash-based sharding.
**Trade-off Rationale**: YouTube needed MySQL's relational model and ACID transactions but at a scale no single MySQL instance could handle. Vitess adds a sharding layer on top without modifying MySQL itself.
**What They Gave Up**: Cross-shard joins (must be done in application code or avoided by design), cross-shard transactions (limited 2PC support), operational simplicity (Vitess adds proxy, topology, and management components).
**What They Gained**: Horizontal write scalability for MySQL, battle-tested at YouTube/Google scale, gradual migration path (start unsharded, add sharding when needed).

**System**: CockroachDB (distributed SQL with automatic sharding).
**Architectural Decision**: Automatic range-based partitioning (each range is ~512MB). Ranges are replicated via Raft consensus. SQL queries are transparently distributed across ranges.
**Trade-off Rationale**: Make a SQL database that scales horizontally without manual sharding. Uses Raft for strong consistency across replicas and ranges. The database handles partitioning automatically; the application sees a single logical SQL database.
**What They Gave Up**: Absolute performance (Raft consensus adds latency vs. single-node PostgreSQL), operational simplicity (distributed system), some PostgreSQL compatibility.
**What They Gained**: Horizontal scalability without application-level sharding, strong consistency (serializable isolation), survivability (automatic failover via Raft).

**System**: TiDB (distributed SQL, MySQL compatible).
**Architectural Decision**: Separation of compute (TiDB server, stateless SQL layer) and storage (TiKV, distributed KV store with Raft-based replication). Data is range-partitioned across TiKV nodes.
**Trade-off Rationale**: MySQL compatibility at scale. Separate compute from storage so each can scale independently. Raft-based replication for strong consistency.
**What They Gave Up**: Operational complexity (three components: TiDB, TiKV, PD), latency (network round trips for distributed queries).
**What They Gained**: MySQL wire compatibility, horizontal scalability, strong consistency, auto-sharding, online DDL.

### Partitioning Decision Framework

1. **Partition key**: Which column(s) determine partition assignment? Must be present in every query for single-partition routing. If not, accept scatter-gather overhead.
2. **Partition strategy**: Range (for range queries) vs. hash (for uniform distribution) vs. consistent hashing (for elastic clusters).
3. **Partition count**: Fixed (simpler) vs. dynamic (more flexible). Err on the side of more partitions (you can't add more later with fixed partitioning).
4. **Cross-partition queries**: Accept scatter-gather, denormalize, or add global secondary indexes. Each has a cost.
5. **Rebalancing**: How does the system redistribute data when nodes change? Test this at production scale before you need it.


## Caching Architecture

Caching stores the result of an expensive operation so that subsequent requests can be served faster. It is the most effective performance optimization available. It is also the hardest to get right: cache invalidation is one of the two hard problems in computer science (along with naming things and off-by-one errors). Every cache is a trade-off between freshness and performance.

### Cache Strategies

#### Cache-Aside (Lazy Loading)

**Definition**: The application checks the cache first. On cache miss, the application fetches data from the source, populates the cache, and returns the result. The cache is passive; the application manages the cache population logic.

**When to Apply**: Most general-purpose caching. Read-heavy workloads. You want to cache only what's actually requested (not pre-populate everything). The cache failure mode (cache-aside degrades to source-only) is acceptable.

**When NOT to Apply**: You need strong consistency (cache-aside always has a window of staleness). Write-heavy workloads (cache-aside doesn't help with writes). You can't tolerate the latency spike of a cache miss (consider read-through instead).

**Pseudocode (Cache-Aside)**:
```
get(key):
    value = cache.get(key)
    if value is not null:
        return value                          // cache hit

    value = database.query("SELECT ... WHERE key = ?", key)
    if value is not null:
        cache.set(key, value, ttl=300)        // populate cache, 5-min TTL
    return value
```

**Checklist**:
- [ ] Is the cache miss path resilient (can the database handle the load if the cache is empty)?
- [ ] Is the TTL chosen based on acceptable staleness, not arbitrarily?
- [ ] Is the cache populated only with data that is actually read (lazy loading)?

#### Read-Through

**Definition**: The cache sits between the application and the database. The application reads from the cache. On miss, the cache (not the application) fetches from the database and populates itself.

**When to Apply**: You want the application to be cache-agnostic (no cache logic in application code). Read-heavy workloads where the data model is simple (key-value lookups).

**When NOT to Apply**: Complex queries that don't map cleanly to cache keys. The cache becomes a critical path dependency (if the cache layer fails, the system is down).

**Checklist**:
- [ ] Is the cache layer highly available (not a single point of failure)?
- [ ] Does the data model map cleanly to cache keys?
- [ ] Is the cache miss latency (fetch from DB + populate cache) acceptable?

#### Write-Through

**Definition**: The application writes to the cache. The cache synchronously writes to the database. Data is never stale (the cache always has the latest write). But write latency includes both cache and database writes.

**When to Apply**: You need cache consistency (reads always reflect the latest write). Write throughput is moderate (every write hits both cache and database).

**When NOT to Apply**: Write-heavy workloads (every write is now two writes). The cache is for read performance, not write consistency (use write-behind instead).

**Checklist**:
- [ ] Is the write latency (cache + database) acceptable?
- [ ] Is write throughput within the combined capacity of cache and database?
- [ ] Is the cache used for reads that require strong consistency?

#### Write-Behind (Write-Back)

**Definition**: The application writes to the cache. The cache asynchronously writes to the database in batches. Write latency is cache-only (fast). But data can be lost if the cache crashes before flushing to the database.

**When to Apply**: Write-heavy workloads where write latency must be minimal. You can tolerate potential data loss (or the cache has persistence). Batch-oriented writes (aggregating multiple updates before writing to the database).

**When NOT to Apply**: You cannot tolerate data loss. You need immediate consistency (writes are not visible in the database until flushed). Regulatory requirements mandate durable writes.

**Checklist**:
- [ ] Is the data loss window (cache crash before flush) documented and accepted?
- [ ] Is the cache configured with persistence (if data loss is unacceptable)?
- [ ] Is the flush interval tuned for the trade-off between data loss window and write amplification?

#### Refresh-Ahead

**Definition**: The cache proactively refreshes hot keys before they expire. When a key is accessed near its expiration time, the cache asynchronously refreshes it from the database, preventing a cache miss.

**When to Apply**: Hot keys that would cause a thundering herd on expiration. Keys that are expensive to compute and frequently accessed. You can tolerate occasional staleness.

**When NOT to Apply**: Simple workloads where cache misses are fast enough. Keys that are cheap to compute.

**Checklist**:
- [ ] Is the refresh-ahead threshold (e.g., refresh when 80% of TTL has elapsed) tuned?
- [ ] Is the async refresh mechanism non-blocking (doesn't slow down the current request)?

### Cache Invalidation

Cache invalidation is the hardest problem in caching. Every caching strategy must answer: when and how does stale data get removed or updated?

**TTL-Based (Time-to-Live)**: Simplest strategy. Data expires after a fixed duration. Trade-off: shorter TTL = fresher data, more cache misses. Longer TTL = better hit rate, more staleness. Acceptable for: data where staleness is tolerable (user profiles, product listings, configuration). Not acceptable for: data requiring strong consistency (inventory, pricing during flash sales, authentication tokens).

**Event-Based**: Invalidate or update cache entries when the underlying data changes. The database emits events (or the application publishes them) when data is modified. Cache consumers subscribe and update/invalidate. Trade-off: guarantees consistency but adds complexity (event infrastructure, eventual consistency of the invalidation itself). Acceptable for: data where consistency matters and the event infrastructure exists.

**Version-Based**: Each cache entry has a version number. The application checks the version before using cached data. If the version has changed, it fetches fresh data. Trade-off: requires version tracking infrastructure, adds a check to every read. Acceptable for: data with natural versioning (documents, configurations) where versions can be cheaply compared.

**Checklist**:
- [ ] Is the invalidation strategy documented per cache?
- [ ] Is the maximum staleness (TTL) chosen based on business requirements, not arbitrary defaults?
- [ ] Is there a plan for handling cache inconsistency (stale data served to users)?
- [ ] For event-based invalidation: what happens if an invalidation event is lost?

### Cache Topologies

**Local (In-Process) Cache**: Cache lives in the application's memory. Fastest possible access (no network). But: cache is lost on restart, not shared across instances, limited by process memory. Use for: hot, small, relatively static data (configuration, feature flags, reference data). Example: Guava Cache (Java), Caffeine (Java), Python lru_cache.

**Distributed Cache**: Cache is a separate service shared by all application instances. Slower than local (network round trip) but shared, survives application restarts, can be much larger. Use for: session data, database query results, computed values. Example: Redis, Memcached.

**CDN (Content Delivery Network)**: Cache static assets (images, CSS, JS, videos) at edge locations close to users. Use for: static content, API responses that are the same for all users. Trade-off: reduced origin load and lower latency for users, but stale content if purge is not fast enough.

**Multi-Tier Cache**: Combine local and distributed caches. L1: local cache (fastest, smallest). L2: distributed cache (slower, larger). L3: database (slowest, largest). Each tier absorbs misses from the tier above. Trade-off: complexity of managing multiple tiers, potential for inconsistency between tiers.

### Cache Stampede (Thundering Herd)

**Definition**: Multiple cache misses for the same key occur simultaneously (or a hot key expires), triggering a flood of identical expensive queries to the database. This can overwhelm the database and cascade into a system failure.

**Solutions**:
- **Locking (Mutex)**: On cache miss, only one request is allowed to fetch from the database and populate the cache. Other requests wait for the lock or serve stale data.
- **Probabilistic Early Expiration**: When a key is accessed and its TTL is near expiration, probabilistically refresh it early. The probability increases as expiration approaches. Spreads out the refresh load.
- **Cache Warm-Up**: Pre-populate the cache with hot data before it's requested (on startup, after deployment). Prevents cold-start stampedes.

**Checklist**:
- [ ] Are hot keys identified (keys that would cause a stampede on expiration)?
- [ ] Is a cache stampede mitigation strategy implemented (locking, probabilistic early expiration)?
- [ ] Is the database protected against stampede-level load (rate limiting, circuit breaker)?

### Real-World OSS Case Study: Redis Architecture

**System**: Redis (in-memory data structure store).
**Architectural Decision**: Single-threaded event loop for command processing. All data structures (strings, hashes, lists, sets, sorted sets, streams, HyperLogLog, bitmaps, geospatial indexes) are in-memory with optional disk persistence.
**Trade-off Rationale**: Single-threaded execution eliminates locking overhead and race conditions. Every command is atomic by default (no concurrent modification within a single instance). This is the key insight: Redis chose simplicity and raw speed over multi-core parallelism within a single instance. Multi-core scaling is achieved through sharding (Redis Cluster) or running multiple instances.
**What They Gave Up**: Multi-core utilization within a single instance (a single Redis instance uses one CPU core for command processing), durability guarantees (persistence is async by default, RDB snapshots and AOF are configurable but not the default optimization target), large dataset economics (RAM is more expensive than SSD).
**What They Gained**: Sub-millisecond latency for most operations, predictable performance (no GC pauses, no lock contention), the simplest possible concurrency model (no deadlocks, no race conditions, atomic operations by default), and the most widely deployed caching infrastructure in the world.
**Persistence Trade-offs**: RDB (point-in-time snapshots) is fast for recovery but loses data since the last snapshot. AOF (append-only file of every write command) is more durable but larger and slower for recovery. The default recommendation: use both, with AOF for durability and RDB for fast restarts.
**Cluster Architecture**: Redis Cluster shards data across 16,384 hash slots. Each key is hashed to a slot. Each slot is assigned to a master node (with optional replicas). The client is slot-aware and routes commands directly to the correct node. Gave up: multi-key operations across slots (transactions, unions, intersections across different hash slots). Gained: linear horizontal scalability without a proxy layer.


## Stream Processing

Stream processing handles data that arrives continuously and must be processed in near-real-time. It is the complement to batch processing: batch asks "what happened yesterday?" Stream asks "what's happening right now?"

### Stream vs. Batch

**Stream Processing**: Unbounded, continuous data. Events are processed as they arrive. Latency: milliseconds to seconds. Use cases: fraud detection, real-time dashboards, anomaly detection, real-time recommendations, monitoring and alerting.

**Batch Processing**: Bounded, finite data. Data is collected over a period, then processed in bulk. Latency: minutes to hours. Use cases: daily reports, ETL pipelines, model training, data warehousing, end-of-day reconciliation.

**Lambda Architecture**: Run both a stream layer (real-time, approximate) and a batch layer (delayed, accurate). Merge results at query time. Trade-off: you get both speed and accuracy but maintain two separate codebases that must produce compatible results. This is operationally expensive.

**Kappa Architecture**: Use a single stream processing system for all data. "Batch" is just replaying the stream from the beginning (or a specific offset). Trade-off: simpler (one codebase) but requires a stream processing system that supports replay and exactly-once semantics. This is the modern default; Lambda is a legacy pattern.

### Stream Processing Concepts

**Event Time vs. Processing Time**: Event time is when the event actually happened (recorded in the event). Processing time is when the system received and processed the event. The difference (skew) matters for correctness: "how many orders in the last hour?" means event-time hour, not processing-time hour.

**Watermarks**: A watermark is a threshold that says "all events with event time earlier than T have been observed." Watermarks allow the system to close time windows and emit results, even if some events are late. Late events (arriving after the watermark) can be discarded or handled as a side output.

**Windowing**: Dividing the infinite stream into finite chunks for aggregation.
- **Tumbling Windows**: Fixed-size, non-overlapping. Example: "orders per minute." Every event belongs to exactly one window.
- **Sliding Windows**: Fixed-size, overlapping. Example: "orders in the last 5 minutes, updated every minute." Events belong to multiple windows.
- **Session Windows**: Dynamic-size, based on activity gaps. Example: "user session" ends after 30 minutes of inactivity. Window boundaries are determined by data, not time intervals.

**Exactly-Once Processing**: The holy grail of stream processing: every event is processed exactly once, even in the face of failures. Implementations: idempotent writes + transactional output (Kafka transactions), or checkpoint-based (Flink). Trade-off: exactly-once adds latency and complexity. Many systems are fine with at-least-once + idempotent consumers.

### Stream Processing Frameworks

| Framework | Type | Processing Model | Exactly-Once | Best For |
|---|---|---|---|---|
| Kafka Streams | Library (embedded in application) | Event-at-a-time | Yes (with Kafka transactions) | Microservices, simple stream processing, teams already using Kafka |
| Apache Flink | Framework (standalone cluster) | Event-at-a-time with checkpointing | Yes | Complex event processing, stateful operations, large-scale pipelines |
| Spark Streaming | Framework (standalone cluster) | Micro-batch | Yes (with checkpointing) | Teams already using Spark for batch, hybrid batch/stream workloads |

**When to choose Kafka Streams**: You already use Kafka. Your stream processing logic is simple (filter, transform, aggregate, join streams). You don't want to operate a separate cluster. Your team is comfortable with Java.

**When to choose Flink**: You need sophisticated event-time processing (watermarks, complex windowing). You have high-throughput, low-latency requirements. You need exactly-once stateful processing. You have the operational capacity to run a Flink cluster.

**When to choose Spark Streaming**: You already use Spark for batch processing and want to reuse the same code and infrastructure. Your latency requirements are moderate (seconds, not milliseconds). Micro-batch latency is acceptable.

**Checklist**:
- [ ] Is the choice between stream and batch processing explicit and documented?
- [ ] Are event time and processing time distinguished where correctness depends on it?
- [ ] Is a windowing strategy chosen (tumbling, sliding, session) based on the query requirements?
- [ ] Is the processing guarantee (at-most-once, at-least-once, exactly-once) documented and appropriate?
- [ ] For exactly-once: is the cost (latency, complexity) justified?


## System Design Methodology

This section provides a repeatable, structured approach to designing large-scale data-intensive systems. It is a decision framework, not a recipe. The methodology applies to greenfield design, architecture reviews, and system design interviews.

### The 7-Step Approach

**Step 1: Clarify Requirements and Constraints**

Before designing anything, define what you're building. Ask: what does the system do? Who uses it? What are the hard constraints?

Key questions:
- Functional requirements: what features must the system support?
- Non-functional requirements: latency, throughput, availability, consistency, durability requirements. Quantify each. "Low latency" is not a requirement. "p99 < 200ms for reads" is.
- Scale: how many users? How many requests per second? Read-to-write ratio? Data volume? Growth rate?
- Constraints: team size, timeline, technology preferences, regulatory requirements.

Output: a one-paragraph problem statement that anyone can understand.

**Step 2: Estimate Scale (Back-of-Envelope)**

Translate requirements into numbers. These are estimates, not precise calculations. Purpose: identify the order of magnitude for each resource dimension.

Key estimations:
- **QPS (Queries Per Second)**: Daily active users * average requests per user per day / seconds per day. Example: 10M DAU * 20 requests/day = 200M requests/day = ~2,300 QPS average. Peak QPS is typically 2-3x average.
- **Storage**: Average data size per record * number of records * replication factor. Example: 1KB per user * 100M users = 100GB raw. With 3x replication = 300GB. Add indexes, overhead: ~500GB.
- **Bandwidth**: QPS * average response size. Example: 2,300 QPS * 50KB = 115 MB/s.
- **Memory**: Working set size (data that must be in cache for performance). Rule of thumb: 20% of data is hot (80/20 rule). Cache should hold the hot set.

**Latency Numbers Every Architect Must Know**:

| Operation | Latency | Relative |
|---|---|---|
| L1 cache reference | 1 ns | 1 second |
| L2 cache reference | 4 ns | 4 seconds |
| RAM access | 100 ns | 100 seconds |
| SSD random read | 100 µs | 28 hours |
| Network round trip (same DC) | 500 µs | 6 days |
| Disk seek (HDD) | 10 ms | 12 weeks |
| Network round trip (cross-US) | 150 ms | 5 years |

This table is the single most important tool for architectural reasoning about performance. Every nanosecond, microsecond, and millisecond is a factor of 1000. A disk seek is 100,000x slower than an L1 cache access. These orders of magnitude drive architecture: keep hot data in memory, batch disk writes, minimize network round trips.

**Powers of 2 Every Architect Should Know**:

| Power | Approximate Value | Mnemonic |
|---|---|---|
| 2^10 | 1,024 | 1 KB |
| 2^20 | 1,048,576 | 1 MB |
| 2^30 | 1,073,741,824 | 1 GB |
| 2^40 | 1,099,511,627,776 | 1 TB |
| 2^50 | 1,125,899,906,842,624 | 1 PB |

**Step 3: Define API Contract**

Define the interface between the system and its consumers. This is the contract. It doesn't need to be exhaustive; focus on the 2-3 most important operations.

For each API endpoint: HTTP method, path, request parameters, response format, error codes. Example:
- `POST /api/v1/shorten` - Create short URL. Body: `{ "long_url": "..." }`. Response: `{ "short_url": "..." }`. Errors: 400 (invalid URL), 429 (rate limited).
- `GET /:short_code` - Redirect to long URL. Response: 302 redirect. Errors: 404 (not found), 410 (expired).

**Step 4: Design High-Level Architecture (C4 Level 2)**

Draw the containers: the major deployable/runnable units and how they connect. (See software-architecture-core.md § C4 Model)

For a typical data-intensive system, the containers include: load balancer, API servers, database (primary), cache, message queue, blob storage, CDN. Identify which container owns which responsibility. Label communication protocols.

**Step 5: Deep Dive into Critical Components**

For the 2-3 most architecturally significant components, go deeper. Ask:
- **Database**: Data model, indexing strategy, partitioning strategy, replication strategy, consistency requirements per operation.
- **Cache**: Strategy (cache-aside, write-through), invalidation (TTL, event-based), topology (distributed, local), cache stampede protection.
- **Message Queue**: Delivery guarantees (at-least-once, exactly-once), partitioning (by what key?), consumer groups, dead letter queue.

For each critical component: define the data flow step by step. Example for URL shortener write path:
1. Client -> API: POST /api/v1/shorten (HTTPS)
2. API validates URL, checks rate limiter (Redis)
3. API generates short code (base62 encoding of a unique ID)
4. API writes mapping to database: (short_code, long_url, created_at, expires_at, user_id)
5. API writes to cache: short_code -> long_url (cache-aside, TTL = expiration time)
6. API returns short URL to client

**Step 6: Address Bottlenecks and Single Points of Failure**

For each component, ask: what happens if this fails? What happens if this becomes a bottleneck?

- **Database**: Single point of failure? Add replication (leader + replicas, automatic failover). Write bottleneck? Add sharding (partition by user ID or short code prefix). Read bottleneck? Add read replicas + cache.
- **Cache**: Single point of failure? Add Redis Sentinel or Cluster. Cold start? Pre-warm from database.
- **API servers**: Single point of failure? Add multiple instances behind a load balancer. Bottleneck? Add more instances (horizontal scaling, stateless).
- **Load balancer**: Single point of failure? Add redundant load balancers with failover (DNS, floating IP).

**Step 7: Discuss Trade-offs and Alternatives**

Explicitly state what you chose, what you gave up, and what you'd do differently at different scales. This is the most important step. It demonstrates architectural thinking, not just pattern matching.

Example: "We chose a relational database (PostgreSQL) for the URL shortener because the data model is relational (user -> URLs) and we need ACID for URL creation with collision detection. We gave up horizontal write scalability (single-node writes). At 100K writes/second, we would shard by user ID. At 1M writes/second, we would consider a distributed key-value store with application-level uniqueness checking."

### Common System Design Patterns

#### URL Shortener

Key architectural decisions:
- **ID generation**: Auto-increment (single point of contention), UUID (long), Snowflake ID (distributed, time-sortable), or hash of URL (collisions possible). For most cases: Snowflake or a distributed unique ID service.
- **Short code encoding**: Base62 (alphanumeric) for human-readable URLs. Base64 for shorter but less readable.
- **Redirect**: Cache hot URLs (80% of traffic goes to 20% of URLs). Cache-aside with TTL = URL expiration. Database for cold URLs.
- **Analytics**: Async click tracking via message queue (don't slow down the redirect).

#### Rate Limiter

Key architectural decisions:
- **Algorithm**: Token bucket (bursty traffic, simple), sliding window log (accurate but memory-heavy), sliding window counter (approximate, memory-efficient). Token bucket is the most common choice.
- **Storage**: Redis (atomic increment, TTL for window expiration, distributed). Local memory for single-server. Centralized Redis for distributed.
- **Rate limit headers**: `X-RateLimit-Remaining`, `X-RateLimit-Reset` in response headers so clients can self-regulate.
- **Distributed rate limiting**: If using Redis, a single Redis instance is the source of truth. For higher throughput, shard by user ID or API key.

#### Notification System

Key architectural decisions:
- **Message queue**: Decouple notification triggers from delivery. Each notification type (email, push, SMS) has its own consumer group.
- **Delivery guarantees**: At-least-once delivery (retry with exponential backoff). Idempotency key in notification payload to prevent duplicate sends.
- **Third-party integration**: Each notification channel (email provider, push notification service, SMS gateway) is a separate adapter with its own retry logic, circuit breaker, and fallback.
- **User preferences**: Store per-user, per-channel preferences. Check before sending.

#### Chat System

Key architectural decisions:
- **Connection model**: WebSocket for real-time bidirectional communication. Long polling as fallback. HTTP for historical messages.
- **Message storage**: Time-series partitioned by conversation ID. Recent messages in cache (Redis sorted set by timestamp). Older messages in database with range queries.
- **Group chat**: Fan-out: for small groups, write to each recipient's inbox. For large groups, single message store + pull-based delivery.
- **Online presence**: Heartbeat-based (WebSocket ping/pong). Presence status in Redis with TTL. Last seen timestamp.

#### News Feed

Key architectural decisions:
- **Feed generation**: Fan-out on write (push): when a user posts, write to all followers' feeds. Fan-out on read (pull): when a user loads their feed, aggregate from followed users. Hybrid: push to active users, pull for inactive users.
- **Feed storage**: Time-sorted list per user (Redis sorted set or Cassandra wide-column). Limited to recent N items (e.g., 1000). Older items paginated from database.
- **Celebrity problem**: Users with millions of followers. Don't push their posts to all followers (fan-out cost is prohibitive). Pull their posts on read, merge into the feed.
- **Ranking**: Separate storage for post metadata (engagement metrics) from feed content. Ranking service scores posts. Feed is a ranked subset, not the full chronological list.

#### Search Autocomplete

Key architectural decisions:
- **Data structure**: Trie (prefix tree) for efficient prefix matching. Top-K results per prefix, precomputed and cached.
- **Storage**: In-memory (Redis) for low latency. Trie serialized to a key-value store for persistence. Rebuild trie from database on restart.
- **Query flow**: Client sends prefix on every keystroke -> API queries trie for top-K matches -> returns results. Debounce client requests (don't query on every keystroke, wait for pause).
- **Personalization**: Merge global top-K with user-specific top-K (user's recent searches, user's friends). Weighted scoring.
- **Scale**: Partition trie by first 1-2 characters. Each partition is independent. Aggregate results from the relevant partition only (not all partitions).


## Scalability Patterns

Scalability is the system's ability to handle growth by adding resources. The patterns in this section are the architectural primitives for scaling data-intensive systems.

### AKF Scale Cube

The AKF Scale Cube (from *The Art of Scalability* by Abbott & Fisher) provides three orthogonal axes for scaling a system. Most systems use a combination of all three.

```
                    Y-axis (Functional Decomposition)
                    /|
                   / |
                  /  |
                 /   |
                /    |
               /     |
              /      |
             /       |
            /________|_________ X-axis (Horizontal Duplication)
            |        /
            |       /
            |      /
            |     /
            |    /
            |   /
            |  /
            | /
            |/
            Z-axis (Data Partitioning)
```

**X-axis (Horizontal Duplication)**: Run multiple identical copies of the service behind a load balancer. Each copy handles a share of the traffic. This is the simplest scaling approach. Requires: stateless services. Limitation: doesn't help with data scaling (all instances share the same database).

**Y-axis (Functional Decomposition)**: Split the system by function or bounded context. User service, order service, payment service. Each service can be scaled independently on its X-axis. This is the microservices approach. Requires: well-defined service boundaries, API contracts. Limitation: adds network complexity, eventual consistency challenges.

**Z-axis (Data Partitioning)**: Split by data attribute (user ID, geography, tenant). Each partition handles a subset of the data. This is sharding. Requires: partition-aware routing, cross-partition query strategy. Limitation: application complexity, rebalancing.

**When to use each axis**:
- Start with X-axis: run multiple copies of a monolith. Simple, effective.
- When the monolith's complexity becomes the bottleneck, add Y-axis: split into services.
- When data volume or write throughput exceeds what a single database can handle, add Z-axis: partition the data.

### Load Balancing

**Algorithms**:
- **Round-Robin**: Distribute requests evenly in order. Simple, works well for homogeneous backends. Fails for heterogeneous backends (different capacities) or sticky sessions.
- **Least Connections**: Send to the backend with the fewest active connections. Better for heterogeneous backends or long-lived connections. Requires tracking connection counts.
- **Consistent Hashing**: Hash the request (by client IP, user ID, or request key) and route to the same backend. Useful for: sticky sessions without server-side state, cache affinity (same user hits the same cache node). Trade-off: uneven load distribution if the hash function is not uniform.

**L4 vs. L7 Load Balancing**:
- **L4 (Transport Layer)**: Routes based on IP and port. Faster (less processing), but no awareness of HTTP headers, URL paths, or cookies. Use for: TCP/UDP traffic, simple routing, high throughput.
- **L7 (Application Layer)**: Routes based on HTTP headers, URL paths, cookies. Slower (must parse HTTP), but enables: path-based routing (/api/* to one cluster, /static/* to another), header-based routing, session stickiness, TLS termination. Use for: HTTP/HTTPS traffic, API gateways, microservice routing.

### Connection Pooling

Database connections are expensive to create (TCP handshake, authentication, session setup). Connection pools maintain a set of persistent connections that are reused across requests.

**Key parameters**:
- **Pool size**: Too small = connections are a bottleneck (requests wait for a connection). Too large = database overload (each connection consumes database memory and CPU). Rule of thumb: pool size = (CPU cores on database * 2) + (number of disks). This is a starting point; benchmark your actual workload.
- **Connection timeout**: How long a request waits for a connection from the pool before failing. Set based on your p99 latency target.
- **Idle timeout**: How long an idle connection is kept open. Too long = wasted database resources. Too short = frequent connection creation.
- **Validation**: Test connections before use (is the connection still alive?). Prevents errors from stale connections (database restarted, network interruption).

**Real-World Tools**: PgBouncer (PostgreSQL), HikariCP (Java), R2DBC (reactive database connectivity).

### Asynchronous Processing

Not every operation needs to complete synchronously. Defer non-critical work to background processing to reduce response latency and smooth load spikes.

**Work Queues**: The producer enqueues a job. A worker dequeues and processes it asynchronously. Use for: sending emails, generating reports, processing uploads, updating search indexes. Tools: RabbitMQ, Redis (with Bull/BullMQ), Amazon SQS.

**Deferred Processing**: Schedule work for later execution. Use for: retry with exponential backoff, scheduled maintenance, delayed notifications. Implementation: message queue with delay/visibility timeout.

**Batch Jobs**: Process data in bulk, not one at a time. Use for: daily reports, data aggregation, bulk email, data cleanup. Implementation: cron jobs, workflow orchestrators (Airflow, Temporal).

**Design Rules**:
- Async work should be idempotent (reprocessing the same job twice produces the same result). (See software-architecture-distributed.md § Idempotency)
- Async work should have a dead letter queue for jobs that fail repeatedly.
- Async work should be monitored: queue depth, processing rate, failure rate, age of oldest message.


## Data Architecture Checklist

Run this checklist during Phase 5 (Validate) of the architecture workflow. (See software-architecture-core.md § Architecture Workflow) Every item is a yes/no verifiable question.

### Critical (Must Pass)

1. [ ] **Data model chosen based on access patterns**: The data model (relational, document, key-value, etc.) was selected by analyzing access patterns, not by familiarity or habit. The selection sequence was: access patterns -> data model -> database choice.
2. [ ] **Consistency model documented per store**: For each data store, the consistency requirement (strong, eventual, read-your-writes, monotonic reads) is documented. Where eventual consistency is used, the maximum acceptable staleness is specified.
3. [ ] **Partitioning strategy defined**: If the data store is partitioned, the partition key, partition strategy, and rebalancing approach are documented. Cross-partition query patterns are addressed (scatter-gather, denormalization, secondary indexes).
4. [ ] **Replication strategy defined**: The replication strategy (single-leader, multi-leader, leaderless) is documented with rationale. Replication lag implications are addressed (which reads can tolerate staleness, which cannot).
5. [ ] **Cache invalidation strategy defined**: Every cache has a documented invalidation strategy (TTL, event-based, version-based). The maximum staleness is specified and justified by business requirements.
6. [ ] **Storage, throughput, and latency estimated**: Back-of-envelope estimates exist for: total storage at 1x, 10x, and 100x growth; peak QPS (reads and writes); p50/p99 latency targets for critical paths.
7. [ ] **No single point of failure in the data path**: Every component in the critical data path (database, cache, message queue) has a documented failure mode and recovery strategy.
8. [ ] **Data integrity guarantees documented**: For each data store, the durability guarantee (synchronous replication, async with data loss window, in-memory only) is documented and accepted.

### Important (Should Pass)

1. [ ] **Index strategy serves actual query patterns**: Every index maps to at least one specific query. Unused indexes are identified and removed.
2. [ ] **Connection pooling configured**: Database connection pools are sized based on expected concurrency, not defaults. Pool exhaustion is monitored.
3. [ ] **Cache stampede mitigation implemented**: Hot keys are identified. A strategy (locking, probabilistic early expiration) prevents stampede on expiration or cold start.
4. [ ] **Data lifecycle management defined**: Retention policies, archival strategies, and data deletion workflows are defined for all data stores.
5. [ ] **Stream processing guarantees documented**: If stream processing is used, the processing guarantee (at-least-once, exactly-once) is documented and implemented.
6. [ ] **Backup and recovery tested**: Backup strategy is documented. Recovery time objective (RTO) and recovery point objective (RPO) are defined. Restore has been tested.
7. [ ] **Migration path for data model changes**: A strategy exists for evolving the data model (schema migrations, rolling upgrades, backward compatibility).
8. [ ] **Monitoring for data-specific metrics**: Replication lag, cache hit rate, connection pool utilization, query latency percentiles, dead tuple ratio (PostgreSQL), compaction queue (Cassandra).

### Contextual (Consider)

1. [ ] **Polyglot persistence justified**: Each additional database type has a documented justification tied to a specific access pattern that the primary database cannot serve well.
2. [ ] **Data locality considered**: Data placement considers geographic latency (multi-region replication, CDN for static data, data residency requirements).
3. [ ] **Hot partition mitigation**: For partitioned data, hot partitions are identified and a mitigation strategy exists (salting, further partitioning, caching).
4. [ ] **Cross-datacenter consistency**: If data is replicated across datacenters, the consistency model across datacenters is documented (strong within DC, eventual across DCs, etc.).
5. [ ] **Data encryption documented**: Encryption at rest and in transit is specified for all data stores. Key management strategy is documented.
6. [ ] **Data access audit trail**: For sensitive data, an audit trail strategy is defined (who accessed what data, when, and why).


## Book Source Appendix

This table maps each section of this Skill to the primary and secondary books that informed it.

| Section | Primary Books | Secondary Books |
|---|---|---|
| Data Architecture Overview | (Original, established by this Skill, informed by all below) | Software Architecture: The Hard Parts (Ford et al.) |
| Data Modeling Fundamentals | Designing Data-Intensive Applications (Kleppmann) | Database Internals (Petrov), NoSQL Distilled (Sadalage & Fowler) |
| Database Internals at Architect Level | Database Internals (Petrov), Designing Data-Intensive Applications (Kleppmann) | PostgreSQL 14 Internals (Rogov), High Performance MySQL (Schwartz et al.) |
| Replication | Designing Data-Intensive Applications (Kleppmann) | Database Internals (Petrov), Cassandra: The Definitive Guide (Hewitt) |
| Partitioning (Sharding) | Designing Data-Intensive Applications (Kleppmann) | The Art of Scalability (Abbott & Fisher), Database Internals (Petrov) |
| Caching Architecture | Designing Data-Intensive Applications (Kleppmann) | System Design Interview Vol. 1 (Xu), Web Scalability for Startup Engineers (Ejsmont) |
| Stream Processing | Streaming Systems (Akidau), Designing Data-Intensive Applications (Kleppmann) | Kafka: The Definitive Guide (Narkhede et al.) |
| System Design Methodology | System Design Interview Vol. 1 & 2 (Xu) | Designing Data-Intensive Applications (Kleppmann), Web Scalability for Startup Engineers (Ejsmont) |
| Scalability Patterns | The Art of Scalability (Abbott & Fisher), Web Scalability for Startup Engineers (Ejsmont) | System Design Interview Vol. 1 & 2 (Xu) |
| Data Architecture Checklist | (Original, established by this Skill, informed by all above) | Software Architecture in Practice (Bass et al.) |
| Book Source Appendix | (Original, established by this Skill) | N/A |

### Book Reference Key

- **Designing Data-Intensive Applications** (Kleppmann, 2017): The definitive book on data systems. Covers data models, storage engines, replication, partitioning, transactions, consensus, batch and stream processing. Every data architect must read this.
- **Database Internals** (Petrov, 2019): Deep dive into how databases work: storage engines (B-Tree, LSM-Tree), distributed systems primitives (consensus, leader election, failure detection), transaction processing. The architect-level internals reference.
- **System Design Interview Vol. 1 & 2** (Xu, 2020/2022): Structured approach to system design with worked examples. Back-of-envelope estimation, API design, deep dives on specific systems. Practical, interview-focused, but the methodology applies to real architecture.
- **The Art of Scalability** (Abbott & Fisher, 2015): The AKF Scale Cube, organizational scalability, process scalability. The definitive book on scaling organizations and systems together.
- **Web Scalability for Startup Engineers** (Ejsmont, 2015): Pragmatic scalability patterns for growing systems. Covers caching, asynchronous processing, database scaling, CDN. Engineer-focused, practical.
- **Streaming Systems** (Akidau, 2018): The definitive book on stream processing. Event time vs. processing time, watermarks, triggers, exactly-once processing. Written by the Google MillWheel/Dataflow team.
- **Software Architecture: The Hard Parts** (Ford, Richards, Sadalage, Dehghani, 2021): Data architecture in distributed systems, service granularity, trade-off analysis for data decisions.
- **NoSQL Distilled** (Sadalage & Fowler, 2012): Concise overview of NoSQL data models, consistency models, and when to use each. Dated but still useful for the mental models.
- **PostgreSQL 14 Internals** (Rogov, 2022): Deep PostgreSQL internals: MVCC, vacuum, WAL, query execution, indexing. The architect-level PostgreSQL reference.
- **Cassandra: The Definitive Guide** (Hewitt, 2022): Cassandra architecture, data modeling, tuning, operations. The reference for wide-column databases.
- **Kafka: The Definitive Guide** (Narkhede, Shapira, Palino, 2022): Kafka architecture, producers, consumers, streams, operations. The reference for Kafka-based systems.
