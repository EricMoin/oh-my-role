#!/usr/bin/env bash
# setup-frida.sh — detect device + frida-server, create a matching frida-tools venv.
# Non-destructive by default. Usage: bash setup-frida.sh [--install-server]
# --install-server: if frida-server is absent on device, download+push it (needs adb root).

source "$(dirname "$0")/common.sh"

INSTALL_SERVER=0; [ "${1:-}" = "--install-server" ] && INSTALL_SERVER=1
VENV="$HOME/.local/share/frida-re/venv"

require_tool adb "$(bash "$(dirname "$0")/install-hint.sh" adb)"
require_tool python3 "$(bash "$(dirname "$0")/install-hint.sh" frida)"

hr; info "Frida setup"; hr

# 1. device
devs="$(adb devices | grep -w device | grep -v 'List' | wc -l | tr -d ' ')"
[ "${devs:-0}" -ge 1 ] || die "no device/emulator connected (adb devices)"
abi="$(adb shell getprop ro.product.cpu.abi 2>/dev/null | tr -d '\r')"
ok "device connected — abi: ${abi:-unknown}"

# 2. existing frida-server + version
srv_ver=""
if adb shell 'ls /data/local/tmp/frida-server' >/dev/null 2>&1; then
  srv_ver="$(adb shell '/data/local/tmp/frida-server --version' 2>/dev/null | tr -d '\r')"
  ok "frida-server on device: ${srv_ver:-present (version unknown)}"
else
  warn "no frida-server at /data/local/tmp/frida-server"
  if [ "$INSTALL_SERVER" -eq 1 ]; then
    have curl || die "curl needed to download frida-server"
    ver="$(python3 -c 'import urllib.request,json;print(json.load(urllib.request.urlopen("https://api.github.com/repos/frida/frida/releases/latest"))["tag_name"])' 2>/dev/null)"
    [ -n "$ver" ] || die "could not resolve latest frida version"
    case "$abi" in arm64-v8a) fa=arm64;; armeabi*) fa=arm;; x86_64) fa=x86_64;; x86) fa=x86;; *) fa="$abi";; esac
    url="https://github.com/frida/frida/releases/download/${ver}/frida-server-${ver}-android-${fa}.xz"
    tmp="$(mktemp -d)"; info "downloading frida-server $ver ($fa)"
    curl -fsSL "$url" -o "$tmp/fs.xz" || die "download failed: $url"
    have xz && xz -d "$tmp/fs.xz" || die "xz needed to decompress frida-server"
    adb push "$tmp/fs" /data/local/tmp/frida-server >/dev/null
    adb shell 'su -c "chmod 755 /data/local/tmp/frida-server"' 2>/dev/null || adb shell 'chmod 755 /data/local/tmp/frida-server'
    ok "pushed frida-server $ver — start it with: adb shell \"su -c '/data/local/tmp/frida-server &'\""
    srv_ver="$ver"
    rm -rf "$tmp"
  else
    warn "re-run with --install-server to auto-download+push it (needs root on device)"
  fi
fi

# 3. venv + matching frida-tools
python3 -m venv "$VENV"
pin=""; [ -n "$srv_ver" ] && pin="==$srv_ver"
info "installing frida-tools$pin into venv (never global)"
"$VENV/bin/pip" install --quiet --upgrade pip
"$VENV/bin/pip" install --quiet "frida-tools$pin" || "$VENV/bin/pip" install --quiet frida-tools
ok "venv ready: $VENV/bin/frida  (frida-ps -U to list processes)"

# 4. connectivity test (only if server likely running)
hr; info "Test: $VENV/bin/frida-ps -U   (start frida-server on device first if not running)"
