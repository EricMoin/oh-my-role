#!/usr/bin/env bash
# install-hint.sh — print the exact OS-appropriate install command for a dependency.
# Usage: bash install-hint.sh <java|jadx|dex2jar|vineflower|apktool|bundletool|adb|frida>

source "$(dirname "$0")/common.sh"

dep="${1:-}"; os="$(detect_os)"
[ -z "$dep" ] && die "usage: install-hint.sh <java|jadx|dex2jar|vineflower|apktool|bundletool|adb|frida>"

hint_macos() { case "$1" in
  java) echo "brew install openjdk@17" ;;
  jadx) echo "brew install jadx" ;;
  dex2jar) echo "brew install dex2jar" ;;
  vineflower) echo "brew install vineflower" ;;
  apktool) echo "brew install apktool" ;;
  bundletool) echo "brew install bundletool" ;;
  adb) echo "brew install android-platform-tools" ;;
  frida) echo "python3 -m venv ~/.local/share/frida-re/venv && ~/.local/share/frida-re/venv/bin/pip install frida-tools" ;;
esac; }

hint_debian() { case "$1" in
  java) echo "sudo apt install openjdk-17-jdk" ;;
  jadx) echo "download release jar: https://github.com/skylot/jadx/releases/latest (add bin/ to PATH)" ;;
  dex2jar) echo "download: https://github.com/pxb1988/dex2jar/releases/latest (add to PATH)" ;;
  vineflower) echo "download jar: https://github.com/Vineflower/vineflower/releases/latest ; export FERNFLOWER_JAR_PATH=..." ;;
  apktool) echo "https://ibotpeaches.github.io/Apktool/install/" ;;
  bundletool) echo "download jar: https://github.com/google/bundletool/releases/latest ; export BUNDLETOOL_JAR_PATH=..." ;;
  adb) echo "sudo apt install android-tools-adb" ;;
  frida) echo "python3 -m venv ~/.local/share/frida-re/venv && ~/.local/share/frida-re/venv/bin/pip install frida-tools" ;;
esac; }

hint_fedora() { case "$1" in
  java) echo "sudo dnf install java-17-openjdk-devel" ;;
  adb) echo "sudo dnf install android-tools" ;;
  *) hint_debian "$1" ;;
esac; }

hint_arch() { case "$1" in
  java) echo "sudo pacman -S jdk17-openjdk" ;;
  jadx) echo "sudo pacman -S jadx  (or AUR)" ;;
  adb) echo "sudo pacman -S android-tools" ;;
  *) hint_debian "$1" ;;
esac; }

case "$os" in
  macos)  cmd="$(hint_macos  "$dep")" ;;
  debian) cmd="$(hint_debian "$dep")" ;;
  fedora) cmd="$(hint_fedora "$dep")" ;;
  arch)   cmd="$(hint_arch   "$dep")" ;;
  *)      cmd="$(hint_debian "$dep")" ;;
esac

[ -z "$cmd" ] && die "unknown dependency: $dep"
info "Install $dep on $os:"
printf '    %s\n' "$cmd"
