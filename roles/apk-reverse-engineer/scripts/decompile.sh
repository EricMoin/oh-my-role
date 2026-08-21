#!/usr/bin/env bash
# decompile.sh — decompile APK/XAPK/AAB/DEX/JAR/AAR with jadx (default),
# Fernflower/Vineflower, or both. Handles XAPK/AAB extraction and split-bundle detection.
# Usage: bash decompile.sh [OPTIONS] <file>
#   -o <dir>          output dir (default: <file>-decompiled)
#   --deobf           enable jadx deobfuscation (obfuscated apps)
#   --no-res          code only, skip resources (faster)
#   --engine ENGINE   jadx (default) | fernflower | both

source "$(dirname "$0")/common.sh"

OUT=""; DEOBF=0; NORES=0; ENGINE="jadx"; SRC=""
while [ $# -gt 0 ]; do
  case "$1" in
    -o) OUT="$2"; shift 2 ;;
    --deobf) DEOBF=1; shift ;;
    --no-res) NORES=1; shift ;;
    --engine) ENGINE="$2"; shift 2 ;;
    -h|--help) grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) SRC="$1"; shift ;;
  esac
done
[ -z "$SRC" ] && die "usage: decompile.sh [OPTIONS] <file>  (see --help)"
[ -f "$SRC" ] || die "file not found: $SRC"
[ -z "$OUT" ] && OUT="${SRC%.*}-decompiled"

work=""; cleanup() { [ -n "$work" ] && rm -rf "$work"; }; trap cleanup EXIT
ext="${SRC##*.}"; ext="$(printf '%s' "$ext" | tr 'A-Z' 'a-z')"
target="$SRC"

# --- AAB -> universal APK ---
if [ "$ext" = aab ]; then
  require_tool java
  [ -n "${BUNDLETOOL_JAR_PATH:-}" ] || have bundletool || die "bundletool needed for AAB (set BUNDLETOOL_JAR_PATH or install bundletool)"
  work="$(mktemp -d)"; info "AAB detected — building universal APK with bundletool"
  if have bundletool; then bundletool build-apks --bundle="$SRC" --output="$work/app.apks" --mode=universal
  else java -jar "$BUNDLETOOL_JAR_PATH" build-apks --bundle="$SRC" --output="$work/app.apks" --mode=universal; fi
  unzip -o "$work/app.apks" -d "$work/apks" >/dev/null
  target="$(ls "$work"/apks/universal.apk 2>/dev/null || ls "$work"/apks/*.apk | head -1)"
  ok "universal APK: $target"
fi

# --- XAPK -> pick the base/largest inner APK ---
if [ "$ext" = xapk ]; then
  require_tool unzip
  work="${work:-$(mktemp -d)}"; info "XAPK detected — extracting inner APKs"
  unzip -o "$SRC" -d "$work/xapk" >/dev/null
  target="$(ls "$work"/xapk/base.apk 2>/dev/null || ls -S "$work"/xapk/*.apk 2>/dev/null | head -1)"
  [ -f "$target" ] || die "no inner APK found in XAPK"
  ok "base APK: $target"
fi

run_jadx() {
  require_tool jadx "$(bash "$(dirname "$0")/install-hint.sh" jadx)"
  local dst="$1" args=(-d "$dst")
  [ "$DEOBF" -eq 1 ] && args+=(--deobf)
  [ "$NORES" -eq 1 ] && args+=(--no-res)
  info "jadx ${args[*]} $target"
  jadx "${args[@]}" "$target" || warn "jadx reported warnings (partial output is normal)"
  ok "jadx output: $dst/sources  (resources: $dst/resources)"
}

run_fernflower() {
  require_tool java
  local dst="$1" jar="$target"
  if [ "$ext" != jar ]; then
    require_tool d2j-dex2jar "$(bash "$(dirname "$0")/install-hint.sh" dex2jar)"
    work="${work:-$(mktemp -d)}"; jar="$work/app.jar"
    info "dex2jar: $target -> $jar"; d2j-dex2jar "$target" -o "$jar" -f
  fi
  local FF="${FERNFLOWER_JAR_PATH:-}"
  [ -n "$FF" ] || { have vineflower && FF=""; }
  mkdir -p "$dst"
  if have vineflower; then info "vineflower $jar -> $dst"; vineflower "$jar" "$dst"
  elif [ -n "$FF" ]; then info "fernflower(jar) $jar -> $dst"; java -jar "$FF" "$jar" "$dst"
  else die "Vineflower/Fernflower not found (install vineflower or set FERNFLOWER_JAR_PATH)"; fi
  ok "fernflower output: $dst"
}

hr; info "Decompiling ($ENGINE): $SRC -> $OUT"; hr
case "$ENGINE" in
  jadx)       run_jadx "$OUT" ;;
  fernflower) run_fernflower "$OUT" ;;
  both)       run_jadx "$OUT/jadx"; run_fernflower "$OUT/fernflower"
              info "compare: review classes with jadx warnings in the fernflower output" ;;
  *) die "unknown engine: $ENGINE (use jadx|fernflower|both)" ;;
esac

# --- split-wrapper detection: too few Java files => inner base.apk carries the code ---
if [ "$ENGINE" != fernflower ]; then
  srcdir="$OUT/sources"; [ "$ENGINE" = both ] && srcdir="$OUT/jadx/sources"
  if [ -d "$srcdir" ]; then
    jcount=$(find "$srcdir" -name '*.java' 2>/dev/null | head -20 | wc -l | tr -d ' ')
    if [ "${jcount:-0}" -le 10 ] && unzip -l "$target" 2>/dev/null | grep -q 'base\.apk'; then
      warn "very few Java files + inner base.apk present — this is a split wrapper."
      warn "re-run on the inner base.apk: unzip '$target' base.apk && bash decompile.sh base.apk"
    fi
  fi
fi
hr; ok "Done. Next: structure-analysis, then find-api-calls.sh and security-scan.sh on $OUT/sources"
