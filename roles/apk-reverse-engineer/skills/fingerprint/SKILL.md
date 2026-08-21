---
name: fingerprint
description: Phase 0 triage — fingerprint an APK/XAPK before decompiling. Detect the mobile framework (Flutter / React Native / Cordova / Xamarin / native Java-Kotlin), HTTP stack, DI/serialization, obfuscation level, third-party SDKs, and native libraries, then route to the right tooling. Decompiling Java is useless for non-native apps. 中文触发词：应用指纹、框架识别、指纹识别、判断框架、加固检测、原生库、初步分析
trigger: fingerprint|framework detection|what kind of app|is this flutter|react native|native or|triage apk|identify framework|obfuscation level|应用指纹|框架识别|指纹识别|判断框架|加固检测|初步分析
---

# Phase 0: Fingerprint the App

> **Automation:** `bash scripts/fingerprint.sh <file.apk|file.xapk|file.aab>` runs this
> whole phase — framework, HTTP stack, DI/serialization, native libs (incl. splits),
> obfuscation estimate, notable SDKs, and a recommended next step — without decompiling.
> Run it first on any new target; the manual checks below explain what it reports.

**Always run this before installing tools or decompiling.** Decompiling to Java is
mostly useless for Flutter, React Native, Cordova/Capacitor, and Xamarin apps — the
real code lives in `libapp.so`, a JS bundle, or .NET assemblies, not in the DEX.
Five minutes of fingerprinting saves an hour of decompiling the wrong thing.

## What to inspect

An APK/XAPK is a ZIP. List its contents and look for framework markers, HTTP-stack
strings, and native libraries.

```bash
# List archive contents (APK or XAPK)
unzip -l app.apk | less

# For XAPK/split bundles, native libs may live in config.<abi>.apk, not base.apk
unzip -l app.xapk
```

## Framework markers (the decisive check)

| Framework | Marker in the archive | Where the real code is |
|---|---|---|
| **Flutter** | `lib/**/libflutter.so`, `lib/**/libapp.so`, `assets/flutter_assets/` | `libapp.so` — use `blutter`, `strings libapp.so`; jadx is near-useless |
| **React Native** | `assets/index.android.bundle`, `lib/**/libreactnativejni.so`, `libhermes.so` | JS bundle — extract & beautify JS; `hermes-dec` if Hermes bytecode |
| **Cordova / Capacitor / Ionic** | `assets/www/` (HTML/JS/CSS), `cordova.js` | Web assets under `assets/www/` |
| **Xamarin / .NET MAUI** | `assemblies/*.dll`, `lib/**/libmonodroid.so` | .NET assemblies — use `ILSpy` / `dnSpy` |
| **Unity** | `lib/**/libunity.so`, `assets/bin/Data/Managed/` | IL2CPP — `Il2CppDumper` + Ghidra |
| **Native Java / Kotlin** | `classes*.dex` with real app packages, no framework `.so` above | DEX — proceed to jadx (the standard path) |

If the app is Flutter / RN / Cordova / Xamarin / Unity, **stop the Java path** and
switch to the framework-appropriate tooling. Phases 2–7 assume a native app.

## HTTP stack (works even under obfuscation — scan DEX strings)

```bash
# Pull readable strings from the DEX and grep for network-stack fingerprints
unzip -p app.apk 'classes*.dex' | strings | grep -Ei \
  'retrofit2|okhttp3|com\.android\.volley|io\.ktor|apollographql|OkWebSocket|graphql'
```

| Signal | Meaning |
|---|---|
| `retrofit2`, `Retrofit$Builder` | Retrofit — endpoints in annotated interfaces |
| `okhttp3`, `OkHttpClient` | OkHttp (often under Retrofit) |
| `com.android.volley` | Volley |
| `io.ktor.client` | Ktor client (common in Kotlin Multiplatform) |
| `apollographql` / `graphql` | GraphQL client |

## DI / serialization signals

`strings` on the DEX also reveals: `dagger`, `hilt_aggregated`, `koin`,
`kotlinx.serialization`, `com.squareup.moshi`, `com.google.gson`,
`com.fasterxml.jackson`. These tell you where models and bindings live.

## Obfuscation level (quick estimate)

After a first decompile (or via `strings`), a large number of single-letter
root packages (`a.a.a`, `b.c`, `o0O0`) and single-char class/method names means
R8/ProGuard obfuscation is on — plan for Kotlin metadata recovery (see
`structure-analysis`) and string-anchor tracing (see `call-flow-tracing`).

## Notable third-party SDKs

Watch for `com.appsflyer`, `io.sentry`, `com.datadog`, `com.google.firebase`,
payment SDKs (`com.stripe`, `com.braintreepayments`, WeChat/Alipay), and
support/chat SDKs. These frame what the app does and where sensitive flows live.

## Output of this phase

A one-screen verdict: **framework**, **HTTP stack**, **DI/serialization**,
**obfuscation estimate**, **native libs present (incl. splits)**, **notable SDKs**,
and a **recommended next step** (proceed to jadx, or switch to framework tooling).
