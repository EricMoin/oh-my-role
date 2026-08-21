---
name: api-extraction
description: Phase 5 — find and document all backend API endpoints. Extract Retrofit, OkHttp, Volley, Ktor, GraphQL, WebSocket calls, hardcoded URLs, and auth headers, then document with a two-tier model — a Tier-1 flat inventory of every endpoint plus Tier-2 per-endpoint deep dives for only the ~10 high-value ones (auth, payment, user-requested). 中文触发词：提取API、接口提取、提取接口、API文档、端点清单、Retrofit接口、GraphQL、接口文档、两级文档
trigger: extract api|find endpoints|api endpoints|document api|retrofit endpoints|graphql|websocket|hardcoded url|auth header|api inventory|提取API|接口提取|提取接口|API文档|端点清单|接口文档
---

# Phase 5: Extract & Document APIs

> **Automation:** `bash scripts/find-api-calls.sh <sources> [--retrofit|--urls|--auth|--graphql|--websocket|--volley|--ktor|--all]`
> sweeps for every network pattern. Library-specific patterns and the full documentation
> template: `references/api-extraction-patterns.md`.

Find every endpoint the app talks to, then document it at the right depth. On apps
with 100+ paths, deep-diving each one is prohibitively expensive and rarely wanted —
use the two-tier model.

## Broad sweep

```bash
SRC=<output>/sources

# Retrofit interfaces (the cleanest source of truth)
grep -rn '@GET\|@POST\|@PUT\|@DELETE\|@PATCH\|@HTTP\|@Url' "$SRC"

# Base URLs and hardcoded URLs / hosts
grep -rEn 'https?://[A-Za-z0-9._~:/?#@!$&()*+,;=%-]+' "$SRC"
grep -rn 'baseUrl(' "$SRC"

# OkHttp direct calls
grep -rn 'Request.Builder\|\.url(\|newCall(\|\.enqueue(\|\.execute(' "$SRC"

# Volley
grep -rn 'StringRequest\|JsonObjectRequest\|JsonArrayRequest\|Volley.newRequestQueue' "$SRC"

# Ktor client
grep -rn 'HttpClient\|client.get\|client.post\|urlString' "$SRC"

# GraphQL (queries/mutations, Apollo)
grep -rn 'query \|mutation \|subscription \|apollographql\|\.graphql' "$SRC"

# WebSocket
grep -rn 'WebSocket\|newWebSocket\|okhttp3.WebSocket\|wss\?://' "$SRC"

# Auth patterns
grep -rn 'Authorization\|Bearer \|addHeader(\|X-Api-Key\|api_key\|apikey\|token' "$SRC"
```

## Two-tier documentation model

### Tier 1 — flat inventory (ALWAYS)

One table covering **every** discovered endpoint, one line each. Use `?` when a
column can't be determined. This answers "what does the backend look like" in one
screen and is cheap to produce even for a large app.

| Host | Method | Path | Auth | Source file |
|------|--------|------|------|-------------|
| `api.example.com` | GET | `/v1/users/profile` | Bearer | `com/example/api/UserApi.java:22` |
| `api.example.com` | POST | `/v1/auth/login` | none | `com/example/api/AuthApi.java:14` |

### Tier 2 — per-endpoint detail (only for high-value endpoints)

Reserve the detailed format for the few that matter:

- the full **authentication** flow (login, refresh, logout, OTP/SMS, register, anonymous)
- **payment / checkout / order-creation** endpoints
- anything the **user explicitly asked about**
- anything **unusual** seen during the scan (custom signing, odd headers)

```markdown
### `POST /v1/auth/login`

- **Source**: `com.example.api.AuthApi` (AuthApi.java:14)
- **Base URL**: `https://api.example.com/v1`
- **Path params**: —
- **Query params**: —
- **Headers**: `Content-Type: application/json`
- **Request body**: `{ "email": "string", "password": "string" }`
- **Response**: `ApiResponse<AuthToken>` (accessToken, refreshToken, expiresIn)
- **Called from**: `LoginActivity → LoginViewModel → UserRepository → AuthApi`
```

**Default budget:** do not produce Tier-2 entries for more than ~10 endpoints unless
asked. Tier 1 for everything, plus a Tier-2 deep dive on auth + 1–2 key flows, is
what most consumers of this work actually want.

## Output of this phase

1. Tier-1 inventory table of all endpoints.
2. Tier-2 detail for auth + the few high-value flows.
3. Notes on base URLs, auth scheme, and any custom request signing.
