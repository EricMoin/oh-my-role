#!/usr/bin/env bash
# fingerprint.sh — Phase 0 triage. Detect framework, HTTP stack, DI/serialization,
# native libs, obfuscation, and notable SDKs of an APK/XAPK — WITHOUT decompiling.
# Usage: bash fingerprint.sh <file.apk|file.xapk|file.aab>

source "$(dirname "$0")/common.sh"

f="${1:-}"
[ -z "$f" ] && die "usage: fingerprint.sh <file.apk|file.xapk|file.aab>"
[ -f "$f" ] || die "file not found: $f"
require_tool unzip "apt install unzip / brew install unzip"

# Prefer strings; degrade gracefully if absent.
STRINGS_BIN="strings"; have strings || STRINGS_BIN=""

listing="$(unzip -l "$f" 2>/dev/null)" || die "not a valid zip/apk: $f"

# For XAPK/AAB, list inner .apk entries (native libs hide in splits).
# Match only basename-style archive members, excluding the outer file path in the header.
inner_apks="$(printf '%s' "$listing" | awk '{print $NF}' | grep -E '\.apk$' | grep -v "$(basename "$f")" | sort -u)"

# Dump DEX strings once (base file). Works even under obfuscation.
dexstr=""
if [ -n "$STRINGS_BIN" ]; then
  dexstr="$(unzip -p "$f" 'classes*.dex' 2>/dev/null | "$STRINGS_BIN" 2>/dev/null | head -c 4000000)"
fi

has_file() { printf '%s' "$listing" | grep -qiE "$1"; }
has_str()  { printf '%s' "$dexstr"  | grep -qiE "$1"; }

hr; info "Fingerprint: $f"; hr

# ---- 1. Framework (decisive) ----
fw="Native (Java/Kotlin)"; fw_next="proceed to decompilation (jadx)"
if   has_file 'lib/.*/libflutter\.so|assets/flutter_assets/|libapp\.so'; then
  fw="Flutter"; fw_next="jadx is near-useless — analyze libapp.so with blutter / 'strings libapp.so'"
elif has_file 'assets/index\.android\.bundle|libreactnativejni\.so|libhermes\.so'; then
  fw="React Native"; fw_next="extract & beautify assets/index.android.bundle (hermes-dec if Hermes bytecode)"
elif has_file 'assets/www/|cordova\.js'; then
  fw="Cordova / Capacitor / Ionic"; fw_next="inspect web assets under assets/www/"
elif has_file 'assemblies/.*\.dll|libmonodroid\.so'; then
  fw="Xamarin / .NET MAUI"; fw_next="decompile .NET assemblies with ILSpy / dnSpy"
elif has_file 'libunity\.so|assets/bin/Data/Managed/'; then
  fw="Unity (IL2CPP)"; fw_next="Il2CppDumper + Ghidra"
fi
printf '  %-22s %s\n' "Framework:" "$fw"

# ---- 2. HTTP stack ----
stack=""
has_str 'retrofit2'            && stack="$stack Retrofit"
has_str 'okhttp3'             && stack="$stack OkHttp"
has_str 'com\.android\.volley' && stack="$stack Volley"
has_str 'io\.ktor'            && stack="$stack Ktor"
has_str 'apollographql|graphql' && stack="$stack GraphQL"
has_str 'okhttp3\.WebSocket|newWebSocket' && stack="$stack WebSocket"
printf '  %-22s %s\n' "HTTP stack:" "${stack:-? (obfuscated or none detected)}"

# ---- 3. DI / serialization ----
di=""
has_str 'dagger|hilt' && di="$di Dagger/Hilt"
has_str 'org\.koin'   && di="$di Koin"
has_str 'kotlinx\.serialization' && di="$di kotlinx.serialization"
has_str 'com\.squareup\.moshi'   && di="$di Moshi"
has_str 'com\.google\.gson'      && di="$di Gson"
has_str 'com\.fasterxml\.jackson' && di="$di Jackson"
printf '  %-22s %s\n' "DI / serialization:" "${di:-?}"

# ---- 4. Notable SDKs ----
sdk=""
has_str 'com\.appsflyer'     && sdk="$sdk AppsFlyer"
has_str 'io\.sentry'         && sdk="$sdk Sentry"
has_str 'com\.datadog'       && sdk="$sdk Datadog"
has_str 'com\.google\.firebase' && sdk="$sdk Firebase"
has_str 'com\.stripe'        && sdk="$sdk Stripe"
has_str 'com\.braintreepayments' && sdk="$sdk Braintree"
has_str 'rootbeer'           && sdk="$sdk RootBeer(root-detect)"
printf '  %-22s %s\n' "Notable SDKs:" "${sdk:-none flagged}"

# ---- 5. Native libraries (base + splits) ----
libs="$(printf '%s' "$listing" | grep -oE 'lib/[^/]+/[^ ]+\.so' | sed 's#lib/##' | sort -u)"
libcount=0; [ -n "$libs" ] && libcount="$(printf '%s\n' "$libs" | grep -c .)"
printf '  %-22s %s\n' "Native libs:" "$([ "$libcount" -gt 0 ] && echo "$libcount found" || echo none)"
[ -n "$libs" ] && printf '%s\n' "$libs" | sed 's/^/      /'
[ -n "$inner_apks" ] && { printf '  %-22s\n' "Inner APKs (splits):"; printf '%s\n' "$inner_apks" | sed 's/^/      /'; }

# ---- 6. Obfuscation estimate (short root packages in DEX strings) ----
obf="low"
if [ -n "$dexstr" ]; then
  short=$(printf '%s' "$dexstr" | grep -cE '^L[a-z]/[a-z]/|^L[a-z]{1,2};')
  if   [ "${short:-0}" -gt 400 ]; then obf="high"
  elif [ "${short:-0}" -gt 80  ]; then obf="moderate"; fi
fi
printf '  %-22s %s\n' "Obfuscation:" "$obf"

hr
info "Recommended next step:"
printf '    %s\n' "$fw_next"
if [ "$fw" = "Native (Java/Kotlin)" ]; then
  echo "    → bash decompile.sh \"$f\"   then structure-analysis / find-api-calls / security-scan"
  [ "$obf" != low ] && echo "    → obfuscated: after decompile, recover Kotlin names (see references/kotlin-name-recovery.md)"
fi
hr
