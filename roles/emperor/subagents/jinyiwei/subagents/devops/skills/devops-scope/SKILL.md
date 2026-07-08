---
name: devops-scope
description: Scope boundary for the DevOps department — CI/CD, infrastructure, deployment, and environment configuration
---

# DevOps Department Scope

## In-Scope

- CI/CD pipeline configuration (GitHub Actions, GitLab CI, Jenkins, CircleCI)
- Container configuration (Dockerfile, docker-compose, container optimization)
- Kubernetes manifests, Helm charts, Kustomize
- Infrastructure as Code (Terraform, Pulumi, CloudFormation, Ansible)
- Deployment scripts and release automation
- Environment configuration (.env templates, config maps, secrets management structure)
- Build automation (Makefiles, build scripts, dependency caching)
- Monitoring and observability setup (Prometheus, Grafana, OpenTelemetry, log pipelines)
- Health check and readiness probe configuration

## Out-of-Scope

- Application business logic (route to backend)
- UI components and styling (route to ui)
- Test logic and test cases (route to test)
- Database schema design and migrations (route to data)
- Documentation prose (route to docs)
- Code linting and formatting rules (route to quality)
- Security vulnerability scanning and audits (route to security)

## Grey Zones

- Build scripts that modify application code: document the changes needed, do not modify app code directly. Coordinate with backend.
- Environment configuration that touches application settings: implement the config layer, document what the application team needs to consume.
- Monitoring instrumentation in application code: add the instrumentation hooks, document the integration points for the application team.

## Destructive Operations — HALT and Report

The following operations MUST NOT be executed without explicit authorization:
- Production deployments or releases
- Environment teardown or deletion
- Secret rotation or revocation
- Infrastructure destruction (terraform destroy, k8s namespace deletion)
- Force-pushing container images or overwriting tags
- Database connection string changes in production configs

If a subtask requires any of these, STOP. Report it as a required-but-unauthorized destructive operation in the result fence. The orchestrator routes it through user approval.

## Evidence Requirements

- lsp_diagnostics on all changed config files (YAML, JSON, HCL, Dockerfile)
- Config validation: run `docker build`, `terraform plan`, `helm lint`, `kubectl apply --dry-run`, or equivalent validation commands
- Pipeline syntax validation where applicable
