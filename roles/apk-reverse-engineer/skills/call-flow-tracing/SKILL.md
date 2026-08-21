---
name: call-flow-tracing
description: Phase 4 — trace execution from user-facing entry points down to network calls. Follow Activity/Application.onCreate → ViewModel/Presenter → Repository → API service → HTTP call, map Dagger/Hilt/Koin DI bindings, and anchor navigation in obfuscated code using string literals and Retrofit annotations (which are never obfuscated). 中文触发词：调用链、追踪调用、调用流程、追踪调用链、依赖注入、DI绑定、混淆追踪、从入口追踪
trigger: call flow|trace flow|follow call|call chain|trace from|di binding|dagger|hilt|koin|entry point trace|调用链|追踪调用|调用流程|追踪调用链|依赖注入|DI绑定|混淆追踪
---

# Phase 4: Trace Call Flows

Follow the path from a user action to the network. In a well-structured app this is
`Activity/Fragment → ViewModel/Presenter → Repository → API service → HTTP call`.

## 1. Start at entry points

- The **launcher Activity** (from Phase 3) — read its `onCreate()`, view setup, and
  click listeners.
- The **Application class** `onCreate()` — this is where the OkHttp/Retrofit client,
  base URL, interceptors (auth headers!), and DI container get initialized. Read it
  first; it frames everything downstream.

## 2. Follow the chain

```
onCreate() → view/binding setup → click/interaction listener
  → ViewModel method (or Presenter)
    → Repository / UseCase
      → API service interface (Retrofit @GET/@POST ...)
        → the actual HTTP call + interceptor stack
```

For Kotlin coroutines/Flow, follow `viewModelScope.launch { … }` → `suspend` repo
functions. For RxJava, follow the `.subscribe(...)` chains back to their source.

## 3. Map DI bindings

When Dagger/Hilt/Koin is used, the concrete implementation behind an interface is
declared in modules — find them to resolve "which class actually runs":

```bash
# Dagger/Hilt: @Module + @Provides / @Binds tell you the bound implementation
grep -rn '@Module\|@Provides\|@Binds\|@InstallIn' <output>/sources

# Koin: module { single { ... } factory { ... } }
grep -rn 'module {\|single<\|factory<\|viewModel<' <output>/sources
```

Build a small binding map: interface → implementation → where it's injected.

## 4. Anchor in obfuscated code

When class/method names are mangled, use things obfuscation cannot touch:

- **Retrofit annotations** — `@GET`, `@POST`, `@Path`, `@Query`, `@Header`,
  `@Body`, `@Url` survive intact; the annotated interface is your network map.
- **URL / path string literals** — `"/api/"`, `"https://"`, host names are never
  obfuscated.
- **Library API calls** — `OkHttpClient`, `Retrofit.Builder`, `addInterceptor`,
  `newCall`, `enqueue`, `execute` are stable anchors.
- **Kotlin metadata** — combine with the name-recovery map from Phase 3.

```bash
# Find the Retrofit interfaces and the client wiring even under obfuscation
grep -rn '@GET\|@POST\|@PUT\|@DELETE\|@PATCH\|@Headers\|@Url' <output>/sources
grep -rn 'Retrofit.Builder\|baseUrl(\|addInterceptor\|OkHttpClient' <output>/sources
```

## 5. Record the flow

For each traced feature, capture the path as a one-line chain and cite the files:

```
LoginActivity.onCreate (LoginActivity.java:48)
  → LoginViewModel.login()  (LoginViewModel.java:31)
    → UserRepository.login() (UserRepository.java:22)
      → AuthApi.login()  @POST("/v1/auth/login")  (AuthApi.java:14)
        → OkHttp client with AuthInterceptor adding "Authorization: Bearer …"
```

## Output of this phase

A call-flow map for the key features (always include the authentication flow),
each expressed as an entry-point → network chain with `file:line` citations and the
relevant DI bindings. Feeds directly into Phase 5 API documentation.
