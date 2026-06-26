---
description: Quality attribute scenario guidance and trade-off vocabulary.
---

# Quality Attribute Guidance

Architecture work starts with quality attributes, not technologies. Convert vague goals into scenarios.

## Scenario Format
- Source: who or what triggers the scenario.
- Stimulus: the event or condition.
- Environment: normal, peak, degraded, incident, migration, or disaster state.
- Artifact: system, service, component, data store, team, or process affected.
- Response: what the system must do.
- Measure: measurable threshold.

Example:
`At peak traffic, when checkout receives 2x normal request volume, the order API accepts valid requests with p99 latency under 300ms and error rate under 0.1%.`

## Common Attributes
| Attribute | Architecture Question |
|---|---|
| Availability | What failures must the system survive? |
| Performance | Which operations have measurable latency or throughput targets? |
| Scalability | What grows: users, data, requests, teams, regions, integrations? |
| Modifiability | Which changes must be cheap and which can be expensive? |
| Security | What data, identities, and trust boundaries must be protected? |
| Operability | Can the team deploy, observe, debug, and recover the system? |
| Reliability | How does the system handle partial failure and retries? |
| Data integrity | What must never be lost, duplicated, corrupted, or misrepresented? |
| Cost | Which cost curve matters: infrastructure, delivery, operations, or migration? |

## Trade-off Prompts
- What quality attribute improves?
- What quality attribute gets worse?
- What new operational responsibility appears?
- What decision becomes harder to reverse?
- What can be deferred until evidence justifies it?
