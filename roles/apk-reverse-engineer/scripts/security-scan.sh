#!/usr/bin/env bash
# security-scan.sh — heuristic security audit over decompiled sources + manifest.
# Usage: bash security-scan.sh <decompiled-dir-or-sources>
# Flags: TLS/pinning, disabled verification, secrets, debug flags, weak crypto,
# Fragment Injection, insecure storage. Findings are heuristic — confirm each by hand.

source "$(dirname "$0")/common.sh"

ROOT="${1:-}"
[ -z "$ROOT" ] && die "usage: security-scan.sh <decompiled-dir-or-sources>"
[ -d "$ROOT" ] || die "dir not found: $ROOT"

# Resolve sources dir and manifest location whether given the root or the sources dir.
SRC="$ROOT"; [ -d "$ROOT/sources" ] && SRC="$ROOT/sources"
MANIFEST="$(find "$ROOT" -maxdepth 4 -name AndroidManifest.xml 2>/dev/null | head -1)"

if have rg; then S() { rg -n --no-heading -e "$1" "$SRC" 2>/dev/null; }
else S() { grep -rnE "$1" "$SRC" 2>/dev/null; }; fi

FINDINGS=0
finding() { # finding <SEV> <title> <evidence-multiline>
  local sev="$1" title="$2"; shift 2
  local col="$C_YEL"; [ "$sev" = HIGH ] && col="$C_RED"; [ "$sev" = LOW ] && col="$C_DIM"
  printf '%s[%s]%s %s\n' "$col" "$sev" "$C_RST" "$title"
  [ -n "$*" ] && printf '%s\n' "$*" | sed 's/^/      /' | head -12
  FINDINGS=$((FINDINGS+1))
}

hr; info "Security scan: $ROOT"; [ -n "$MANIFEST" ] && info "manifest: $MANIFEST"; hr

# 1. Disabled TLS verification (HIGH)
h="$(S 'checkServerTrusted|ALLOW_ALL_HOSTNAME_VERIFIER|trustAllCerts|X509TrustManager' | head -8)"
[ -n "$h" ] && finding HIGH "Possible disabled/permissive TLS verification (MITM risk)" "$h"

# 2. Pinning present (INFO/good)
h="$(S 'CertificatePinner|certificatePinner|sslPinning' | head -5)"
[ -n "$h" ] && finding LOW "Certificate pinning present (note pins/location; bypass covered by Frida phase)" "$h"

# 3. Exposed secrets (HIGH/MED)
h="$(S '(api[_-]?key|client[_-]?secret|password|passwd|secret|AKIA[0-9A-Z]{16}|-----BEGIN)' | grep -viE 'passwordField|hint|R\.string' | head -10)"
[ -n "$h" ] && finding HIGH "Potential hardcoded secrets/keys" "$h"

# 4. Weak / misused crypto (MED)
h="$(S 'AES/ECB|DESede|"DES"|MessageDigest\.getInstance\("MD5"|"SHA1"|new SecureRandom\(\)|new Random\(\)' | head -8)"
[ -n "$h" ] && finding MED "Weak or misused cryptography (ECB / MD5 / SHA-1 / Random)" "$h"

# 5. Fragment Injection (HIGH)
h="$(S 'extends PreferenceActivity|isValidFragment' | head -8)"
[ -n "$h" ] && finding HIGH "PreferenceActivity present — verify isValidFragment override (Fragment Injection)" "$h"

# 6. Insecure storage (MED)
h="$(S 'MODE_WORLD_READABLE|MODE_WORLD_WRITEABLE|getExternalStorage' | head -6)"
[ -n "$h" ] && finding MED "Insecure storage flags / external storage use" "$h"

# 7. Manifest checks
if [ -n "$MANIFEST" ]; then
  grep -q 'android:debuggable="true"' "$MANIFEST" && finding HIGH "android:debuggable=\"true\" in manifest" "$MANIFEST"
  grep -q 'android:allowBackup="true"' "$MANIFEST" && finding MED "android:allowBackup=\"true\" (adb backup exfiltration)" "$MANIFEST"
  grep -q 'cleartextTrafficPermitted="true"' "$MANIFEST" && finding MED "cleartext traffic permitted" "$MANIFEST"
  exp="$(grep -oE 'android:name="[^"]+"[^>]*android:exported="true"' "$MANIFEST" | head -8)"
  [ -n "$exp" ] && finding LOW "Exported components (attack surface — verify permission + input validation)" "$exp"
fi

hr
if [ "$FINDINGS" -eq 0 ]; then ok "No heuristic findings. Still review manually — absence of a match is not proof of safety."
else warn "$FINDINGS finding group(s). Each is heuristic — confirm with file:line context and the security-audit skill."; fi
