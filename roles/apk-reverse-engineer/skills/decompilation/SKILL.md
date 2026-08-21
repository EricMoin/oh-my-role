---
name: decompilation
description: Phase 2 — decompile APK/XAPK/AAB/DEX/JAR/AAR. Choose jadx (default, fast, handles resources), Fernflower/Vineflower (higher-quality Java for complex code), or both for comparison. Covers deobfuscation, XAPK/split-bundle handling, AAB→APK conversion, and an engine-selection table. 中文触发词：反编译、jadx反编译、反编译APK、反编译AAB、反编译DEX、反编译JAR、双引擎对比、去混淆
trigger: decompile|jadx|fernflower|vineflower|dex2jar|bundletool|decompile apk|decompile aab|decompile dex|decompile jar|decompile aar|deobfuscate|反编译|反编译APK|反编译AAB|反编译DEX|双引擎|去混淆
---

# Phase 2: Decompile

> **Automation:** `bash scripts/decompile.sh [--engine jadx|fernflower|both] [--deobf] [--no-res] <file>`
> handles APK/XAPK/AAB/DEX/JAR/AAR, auto-extracts XAPK/AAB, and detects split-wrappers.
> Full CLI options and per-tool detail: `references/jadx-usage.md`.

Turn compiled Android artifacts back into readable Java. Two engines, used
individually or together: **jadx** (broad Android coverage, resources, fast) and
**Fernflower/Vineflower** (higher-quality Java on lambdas/generics/streams).

## Input formats

| Format | Handling |
|---|---|
| `.apk` | Direct to jadx |
| `.dex` | Direct to jadx; or dex2jar → Fernflower |
| `.jar` / `.aar` | Fernflower gives the best output; jadx also works |
| `.xapk` | ZIP of base + split APKs — extract, decompile each (base carries the code) |
| `.aab` | Use bundletool to build a universal APK first, then decompile |

## jadx (default first pass)

```bash
# Standard decompile (code + resources) into a named output dir
jadx -d app-decompiled app.apk

# Obfuscated app: enable deobfuscation for stable synthetic names
jadx -d app-decompiled --deobf app.apk

# Fast, code-only overview of a large APK (skip resources)
jadx --no-res -d app-decompiled app.apk
```

Output layout: sources under `app-decompiled/sources/`, resources (incl.
`AndroidManifest.xml`) under `app-decompiled/resources/`.

## Fernflower / Vineflower (higher-quality Java)

Fernflower decompiles **JARs**, so for an APK/DEX you first convert with dex2jar:

```bash
# APK/DEX → JAR
d2j-dex2jar app.apk -o app.jar

# JAR → Java with Vineflower
java -jar "$FERNFLOWER_JAR_PATH" app.jar out-fernflower/
```

Use Fernflower directly on library `.jar`/`.aar` files.

## AAB and XAPK

```bash
# AAB → universal APK, then decompile the APK
java -jar "$BUNDLETOOL_JAR_PATH" build-apks --bundle=app.aab --output=app.apks \
     --mode=universal
unzip app.apks -d apks_out && jadx -d app-decompiled apks_out/universal.apk

# XAPK: extract and decompile the base APK (splits are usually ABI/lang/density only)
unzip app.xapk -d xapk_out
jadx -d app-decompiled xapk_out/base.apk   # or the largest inner APK carrying code
```

**Split/bundle wrapper gotcha:** some APKs are thin wrappers — the outer APK
contains `base.apk` + `split_config.*.apk` inside. If jadx yields very few Java
files (≤10), the real code is in the inner `base.apk`; extract and re-decompile
that. Skip config-only splits (ABI, language, density).

## apktool (resources / smali, when jadx falls short)

```bash
# Decode resources + smali (great for AndroidManifest, XML, and byte-level edits)
apktool d app.apk -o app-apktool
```

Use apktool when you need faithfully-decoded resources, or smali for patching.

## Engine-selection strategy

| Situation | Engine |
|---|---|
| First pass on any APK | `jadx` (fastest, handles resources) |
| JAR/AAR library analysis | Fernflower/Vineflower (better Java) |
| jadx output has warnings / broken methods | **both** — compare, pick the better per class |
| Complex lambdas, generics, streams | Fernflower/Vineflower |
| Quick overview of a large APK | `jadx --no-res` |
| Need faithful resources or smali patching | apktool |

When you run **both**, put outputs in `out/jadx/` and `out/fernflower/`; for any
class jadx flags with warnings, read the Fernflower version.

## Output of this phase

A decompiled tree (`sources/` + `resources/`), a note on which engine was used and
why, and the estimated obfuscation level — carried into Phase 3.
