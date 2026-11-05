---
name: api-writing
description: API reference method — source hierarchy, reference outline, endpoint template, authentication, errors, pagination, versioning, verification, and review checklist. Load before writing or reviewing API reference.
---

# API Writing

## 1. Source hierarchy

When sources disagree, the higher rung wins and the conflict is reported, never averaged:

1. The running service and its contract tests, exercised for the documented call.
2. The OpenAPI description, schema, IDL, or protocol definition.
3. Route definitions, request/response types, serializers, and validation code.
4. Unit and integration tests that assert status codes, payloads, and errors.
5. Existing reference pages. Treat them as claims until checked.

Record the service version, commit, environment, and base URL behind every verified entry. A
reference written against an unknown version is not reference; it is rumor.

## 2. Reference outline

Use this order unless the project already has a reference structure:

1. Overview: what the API does, who calls it, and the first successful call.
2. Base URL, environments, and version identifier.
3. Authentication and authorization: scheme, token location, scopes, expiry.
4. Common conventions: content type, encoding, headers, idempotency, timestamps, IDs.
5. Endpoints grouped by resource, each in the endpoint template.
6. Shared schemas: fields, types, constraints, nullability, defaults, units.
7. Error catalog.
8. Rate limits, pagination, filtering, and sorting.
9. SDK, CLI, or shell examples that a reader can run.
10. Change pointer: where versions, deprecations, and migration notes live.

## 3. Endpoint template

Every endpoint entry answers the same questions in the same order:

```text
### METHOD /path

Purpose: the task this endpoint performs, in one sentence.
Auth: required scheme and scope, or "none".

Path parameters
| Name | Type | Required | Description |

Query parameters
| Name | Type | Required | Default | Description |

Request body
| Field | Type | Required | Default | Description | Constraints |

Request example
Response example
Status codes
Error codes
Notes: side effects, idempotency, ordering, eventual consistency, limits.
```

Rules:

- Mark required and optional explicitly; do not leave it to inference.
- Give types, defaults, allowed values, units, and nullability where they exist.
- Show one complete request and one complete response, not a fragment with "...".
- List only status codes the endpoint can actually return; verify against code or tests.
- For each error, link to the catalog entry rather than restating it differently.

## 4. Authentication

- Name the scheme exactly as a caller must implement it: bearer token, API key header, HMAC
  signature, OAuth scope.
- State where the credential goes, what it authorizes, and how it expires or refreshes.
- Show 401 and 403 examples and explain the difference in this API.
- Redact real credentials everywhere. Use `sk_live_...` or an explicit placeholder.
- Document clock skew, signature canonicalization, and replay windows when relevant.

## 5. Error catalog

One table, one row per code:

| Code | HTTP | Meaning | Cause | Fix |
|---|---|---|---|---|

- Separate validation, authentication, authorization, not-found, conflict, rate-limit, and server
  errors.
- Use the service's real code strings. If the service returns only a message, say so.
- "Something went wrong" is not a meaning. State the condition the caller can act on.
- Note retryability per row: safe to retry, retry after a delay, or never retry.
- Keep the catalog sorted and reference it from every endpoint entry.

## 6. Pagination, limits, and versioning

Pagination:

- State cursor or offset style, parameter names, page size default and maximum, and the response
  envelope.
- Explain how to detect the end and how stable the cursor is under writes.
- Show a full page plus the next-page call.

Limits:

- Document rate-limit units, window, headers, and the response when exceeded.
- Document payload size, timeout, and concurrency limits that callers must design around.

Versioning:

- Say where the version lives: path, header, or media type.
- Record the current version, the deprecation policy, and the sunset signal.
- Link to migration guidance instead of duplicating it.

## 7. Verification

- Lint or parse the OpenAPI document when the project provides a command.
- Compile or run every SDK and shell example; do not ship a snippet that was never executed.
- Compare documented status codes and error codes with tests or the running service.
- Validate example payloads against the schema.
- Check every link and every referenced file path.
- Record what ran, its output, and the environment. Mark anything unrun as unverified.

## 8. Checklist

- [ ] A reader can make the first successful call from the overview alone.
- [ ] Every endpoint has method, path, auth, parameters, request and response examples, statuses,
      and errors.
- [ ] Every field is typed, required/optional is explicit, and defaults are real.
- [ ] Authentication, token lifetime, and scope failures are covered.
- [ ] The error catalog matches the service codes.
- [ ] Pagination and rate limits are described with real parameters and headers.
- [ ] Versioning and the change pointer are current.
- [ ] Examples are runnable and redacted.
- [ ] Unverified facts are listed, not smoothed over.

## 9. Anti-patterns

- A parameter table generated from guesses, with invented types or defaults.
- "See the code" where the contract should be stated.
- Mixing v1 and v2 examples on one page without labeling them.
- Listing every HTTP status the framework supports instead of the ones this endpoint returns.
- Error documentation that repeats the HTTP status text and stops there.
- Authentication described as "use your API key" with no header name, prefix, or failure example.
- Examples with real customer data, live tokens, or internal hostnames.
- Pagination described without a next-page example.
- Version history that stops at the version the author remembers.
