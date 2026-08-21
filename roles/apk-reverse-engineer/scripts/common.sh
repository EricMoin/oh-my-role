#!/usr/bin/env bash
# common.sh — shared helpers for the apk-reverse-engineer scripts.
# Source this from other scripts: source "$(dirname "$0")/common.sh"

set -o pipefail

# ---- colored logging (falls back to plain when not a TTY) ----
if [ -t 1 ]; then
  C_RED=$'\033[31m'; C_GRN=$'\033[32m'; C_YEL=$'\033[33m'; C_BLU=$'\033[34m'; C_DIM=$'\033[2m'; C_RST=$'\033[0m'
else
  C_RED=; C_GRN=; C_YEL=; C_BLU=; C_DIM=; C_RST=
fi

info()  { printf '%s[*]%s %s\n' "$C_BLU" "$C_RST" "$*"; }
ok()    { printf '%s[+]%s %s\n' "$C_GRN" "$C_RST" "$*"; }
warn()  { printf '%s[!]%s %s\n' "$C_YEL" "$C_RST" "$*" >&2; }
err()   { printf '%s[x]%s %s\n' "$C_RED" "$C_RST" "$*" >&2; }
die()   { err "$*"; exit 1; }
hr()    { printf '%s%s%s\n' "$C_DIM" "------------------------------------------------------------" "$C_RST"; }

have()  { command -v "$1" >/dev/null 2>&1; }

# require_tool <cmd> [hint] — die with an install hint if a tool is missing
require_tool() {
  local cmd="$1" hint="${2:-}"
  if ! have "$cmd"; then
    err "required tool not found: $cmd"
    [ -n "$hint" ] && warn "install: $hint"
    exit 2
  fi
}

# detect_os -> prints: macos | debian | fedora | arch | linux | unknown
detect_os() {
  case "$(uname -s)" in
    Darwin) echo macos ;;
    Linux)
      if   [ -f /etc/debian_version ]; then echo debian
      elif [ -f /etc/fedora-release ]; then echo fedora
      elif [ -f /etc/arch-release   ]; then echo arch
      else echo linux; fi ;;
    *) echo unknown ;;
  esac
}

# is_zip <file> — true if the file looks like a ZIP (APK/XAPK/AAB/JAR are ZIPs)
is_zip() { [ -f "$1" ] && head -c2 "$1" 2>/dev/null | grep -q 'PK'; }
