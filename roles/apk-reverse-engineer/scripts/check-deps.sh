#!/usr/bin/env bash
# check-deps.sh — verify the Android RE toolchain and emit machine-readable status.
# Usage: bash check-deps.sh
# Exit: 0 all mandatory present | 1 a mandatory tool is missing.
# Machine-readable lines: INSTALL_REQUIRED:<dep> / INSTALL_OPTIONAL:<dep>

source "$(dirname "$0")/common.sh"

MISSING_REQUIRED=0

check() { # check <cmd> <required|optional> <label>
  local cmd="$1" tier="$2" label="$3" ver=""
  if have "$cmd"; then
    ver="$("$cmd" --version 2>&1 | head -1 | cut -c1-40)"
    ok "$label ($cmd) — ${ver:-present}"
  else
    if [ "$tier" = required ]; then
      err "$label ($cmd) — MISSING (required)"
      echo "INSTALL_REQUIRED:$cmd"
      MISSING_REQUIRED=1
    else
      warn "$label ($cmd) — missing (optional, recommended)"
      echo "INSTALL_OPTIONAL:$cmd"
    fi
  fi
}

hr; info "Android reverse-engineering toolchain check ($(detect_os))"; hr

# Java: need 17+
if have java; then
  jv="$(java -version 2>&1 | head -1)"
  maj="$(printf '%s' "$jv" | grep -oE '"[0-9]+' | tr -d '"' | head -1)"
  if [ "${maj:-0}" -ge 17 ] 2>/dev/null; then ok "Java JDK — $jv"; else warn "Java present but <17: $jv (jadx/Fernflower need 17+)"; echo "INSTALL_REQUIRED:java"; MISSING_REQUIRED=1; fi
else
  err "Java JDK — MISSING (required)"; echo "INSTALL_REQUIRED:java"; MISSING_REQUIRED=1
fi

check jadx        required "jadx decompiler"
check d2j-dex2jar optional "dex2jar"
check vineflower  optional "Vineflower/Fernflower"
check apktool     optional "apktool"
check bundletool  optional "bundletool (AAB)"
check adb         optional "adb (platform-tools)"
check python3     optional "Python 3 (Frida venv)"
check frida       optional "frida client"

hr
if [ "$MISSING_REQUIRED" -eq 0 ]; then
  ok "All mandatory tools present — ready to decompile."
  exit 0
else
  err "Missing mandatory tool(s). Install them, then re-run. See scripts/install-hint.sh <dep>."
  exit 1
fi
