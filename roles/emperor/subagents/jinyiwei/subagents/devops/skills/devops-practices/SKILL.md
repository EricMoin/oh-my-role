---
name: devops-practices
description: DevOps practitioner knowledge — CI/CD patterns, container best practices, Kubernetes, IaC, deployment strategies, and observability
---

# DevOps Practices

Practitioner-level domain knowledge for the DevOps department. Load this skill for implementation guidance on infrastructure and deployment tasks.

## CI/CD Pipeline Patterns

### Pipeline Structure
- **Stage-based**: lint → build → test → security scan → deploy. Each stage gates the next.
- **Job dependencies**: express as DAG, not linear chain. Parallelize independent jobs.
- **Artifact passing**: build once, pass artifact downstream. Never rebuild in deploy stage.
- **Environment promotion**: promote the SAME artifact through dev → staging → prod. Never rebuild per environment.

### Common Pitfalls
- Hardcoding secrets in pipeline config — use secret management (GitHub Secrets, GitLab CI variables, Vault)
- Running tests after deploy instead of before
- No rollback step — always define how to undo a deployment
- Monolithic pipeline — split into reusable workflows/templates

## Container Best Practices

### Dockerfile Patterns
- **Multi-stage builds**: separate build dependencies from runtime image. Final image should be minimal.
- **Layer ordering**: put rarely-changing layers (dependencies) before frequently-changing ones (source code) for cache efficiency.
- **Non-root user**: never run containers as root. Create a dedicated user.
- **Health checks**: add HEALTHCHECK instruction for orchestration-aware health.
- **.dockerignore**: exclude node_modules, .git, test files, local env files from build context.

### Image Optimization
- Use specific base image tags (e.g., `node:20-alpine`), never `latest`
- Minimize layers: combine RUN commands with && where logical
- Clean up package manager caches in the same layer
- Target final image size under 200MB for application containers where feasible

## Kubernetes Patterns

### Manifest Structure
- **Declarative**: always use declarative manifests (kubectl apply), never imperative (kubectl create/run)
- **Labels and selectors**: consistent labeling scheme (app, version, environment, tier)
- **Resource requests and limits**: always set CPU/memory requests. Set limits cautiously — too tight causes OOM kills.
- **Probes**: readiness probe (can serve traffic), liveness probe (is the process alive). Configure initialDelaySeconds for slow-starting apps.
- **ConfigMaps for config, Secrets for sensitive data**: never put config values directly in Pod spec.

### Deployment Strategies
- **Rolling update** (default): gradually replace old pods. Set maxSurge and maxUnavailable.
- **Blue-green**: two environments, switch traffic instantly. Requires 2x resources.
- **Canary**: route small percentage of traffic to new version, monitor, increase. Use service mesh or ingress controller for traffic splitting.
- **Recreate**: take down old, bring up new. Downtime but simplest. Use only for non-critical workloads.

### Common Pitfalls
- No PodDisruptionBudget for high-availability workloads
- Missing resource limits → noisy neighbor problems
- Using latest tag → non-reproducible deployments
- No namespace isolation between environments

## Infrastructure as Code

### Terraform Patterns
- **State management**: use remote state (S3+DynamoDB, Terraform Cloud). Never local state in production.
- **Module composition**: one module per logical component (network, database, app). Compose modules into environments.
- **Variable validation**: validate all input variables with type constraints and custom validation.
- **Workspace separation**: separate workspaces per environment. Never share state across environments.
- **`terraform plan` before `terraform apply`**: always review planned changes. Use `-out` to save and apply the exact plan.

### Pulumi / CloudFormation
- Same principles apply: modular, parameterized, environment-separated.
- CloudFormation: use nested stacks for complex infrastructure. Enable drift detection.

### Common Pitfalls
- Hardcoding region/account IDs — use variables and data sources
- No state locking → concurrent modifications corrupt state
- `terraform destroy` without review — always plan destroy first

## Deployment Automation

### Release Scripts
- Make deployments idempotent: running twice should be safe
- Include pre-deploy validation (config check, dependency check) and post-deploy verification (health check, smoke test)
- Implement automatic rollback on health check failure
- Log every deployment with timestamp, version, environment, operator

### Zero-Downtime Deployment
- Health check must pass before traffic is routed to new instances
- Graceful shutdown: old instances drain connections before terminating
- Database migrations must be backward-compatible during rollout

## Observability

### Three Pillars
- **Metrics**: RED (Rate, Errors, Duration) for services. USE (Utilization, Saturation, Errors) for resources.
- **Logs**: structured JSON logs with correlation IDs. Centralized collection.
- **Traces**: distributed tracing across service boundaries. Sample in high-volume production.

### Alerting
- Alert on symptoms (user-visible problems), not causes (high CPU alone)
- Every alert should be actionable — if you can't fix it, don't alert on it
- Define SLOs and alert on error budget burn rate, not raw thresholds
- Include runbook links in alert notifications

## Secret Management
- Never commit secrets to version control — use .gitignore and secret scanning
- Use environment-specific secret stores (Vault, AWS Secrets Manager, Kubernetes Secrets with encryption)
- Rotate secrets regularly with automated tooling
- Provide secret structure (keys, format) in config templates without exposing values
