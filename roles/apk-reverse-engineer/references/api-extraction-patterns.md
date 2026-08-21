# API Extraction Patterns Reference

Deep-dive companion to the `api-extraction` skill: library-specific search patterns and
the full documentation template. The `scripts/find-api-calls.sh` helper runs most of
these sweeps for you; this doc explains what each pattern means and how to read the hits.

## Library-specific patterns

### Retrofit (the cleanest source of truth)

Retrofit HTTP annotations are **never obfuscated** — the annotated interface is a
literal map of the backend.

```
@GET("/v1/users/{id}")            # path + method
@POST @PUT @DELETE @PATCH @HTTP   # other verbs (@HTTP for custom)
@Path("id") @Query("page")        # params
@Header("Authorization") @Headers # headers
@Body                             # request body type
@Url                              # dynamic full URL (endpoint not in annotation)
```

Read the interface top-to-bottom: each method = one endpoint. The return type
(`Call<T>`, `Single<T>`, `suspend fun ...: T`, `Response<T>`) names the response model.

The base URL is set at build time — find it:

```
Retrofit.Builder() ... .baseUrl("https://api.example.com/")
```

### OkHttp (direct calls, or under Retrofit)

```
Request.Builder().url(...).method(...).build()
client.newCall(request).enqueue(...) / .execute()
Interceptor / addInterceptor(...)   # where auth headers are injected
```

Interceptors are gold: `Authorization: Bearer <token>` and custom signing usually live
in an `Interceptor.intercept()`.

### Volley

```
StringRequest / JsonObjectRequest / JsonArrayRequest(method, url, ...)
Volley.newRequestQueue(context)
getHeaders() override            # auth headers
```

### Ktor client (Kotlin / KMP)

```
HttpClient(...) { }
client.get("...") / client.post("...") { }
url { ... } / header("Authorization", ...)
```

### GraphQL (Apollo)

```
query Foo { ... } / mutation Bar { ... }   # in .graphql files or generated code
ApolloClient.builder().serverUrl(...)
```

Look under `assets/` and generated `*Query`/`*Mutation` classes.

### WebSocket

```
okhttp3.WebSocket / newWebSocket(request, listener)
wss://host/path
```

## Anchoring in obfuscated apps

When class names are mangled, pivot on things that survive R8/ProGuard:

- Retrofit annotations and URL string literals (never obfuscated).
- Kotlin `@Metadata` / `@DebugMetadata` (see `kotlin-name-recovery.md`).
- Library entry points (`OkHttpClient`, `Retrofit.Builder`, `newCall`).

## The two-tier documentation model

### Tier 1 — flat inventory (ALWAYS produce this)

One row per endpoint; `?` when unknown. Cheap even on 100+ paths.

| Host | Method | Path | Auth | Source file |
|------|--------|------|------|-------------|
| `api.example.com` | GET | `/v1/users/profile` | Bearer | `com/example/api/UserApi.java:22` |
| `api.example.com` | POST | `/v1/auth/login` | none | `com/example/api/AuthApi.java:14` |

### Tier 2 — per-endpoint detail (only ~10 high-value endpoints)

Reserve for: the full auth flow (login/refresh/logout/OTP/register), payment/checkout,
anything the user asked about, and anything unusual (custom signing, odd headers).

```markdown
### `POST /v1/auth/login`

- **Source**: `com.example.api.AuthApi` (AuthApi.java:14)
- **Base URL**: `https://api.example.com/v1`
- **Path params**: —
- **Query params**: —
- **Headers**: `Content-Type: application/json`
- **Request body**: `{ "email": "string", "password": "string" }`
- **Response**: `ApiResponse<AuthToken>` — { accessToken, refreshToken, expiresIn }
- **Auth scheme**: none to obtain token; subsequent calls use `Authorization: Bearer <accessToken>`
- **Called from**: `LoginActivity → LoginViewModel → UserRepository → AuthApi`
- **Notes**: refresh handled by `TokenAuthenticator` (OkHttp Authenticator)
```

**Budget rule**: don't exceed ~10 Tier-2 entries unless asked. Tier 1 for everything +
a Tier-2 deep dive on auth and 1–2 key flows is what most consumers actually want.

## Deliverable checklist

- [ ] Tier-1 table covering every endpoint
- [ ] Tier-2 detail for auth + key flows
- [ ] Base URL(s) and the auth scheme (how tokens are obtained and attached)
- [ ] Any custom request signing / non-standard headers, with the file that implements it
