---
name: environment-setup
description: Phase 1 — verify and install the Android RE toolchain. Java JDK 17+, jadx, Vineflower/Fernflower, dex2jar, bundletool, apktool, adb, and Frida (frida-server on device + frida-tools in a venv). Detects OS/package manager and prefers no-sudo local installs. 中文触发词：环境配置、安装工具、依赖检查、安装jadx、安装frida、工具链、配置环境
trigger: install jadx|install frida|setup tools|environment setup|check deps|dependencies|toolchain|install apktool|frida-server|环境配置|安装工具|依赖检查|安装jadx|安装frida|工具链|配置环境
---

# Phase 1: Environment & Toolchain Setup

> **Automation:** `bash scripts/check-deps.sh` verifies the whole toolchain and emits
> machine-readable `INSTALL_REQUIRED:`/`INSTALL_OPTIONAL:` lines; `bash scripts/install-hint.sh <dep>`
> prints the exact OS-appropriate install command; `bash scripts/setup-frida.sh` handles
> the Frida device+venv setup. The reference tables below explain each tool.

Confirm required tools exist before decompiling; install what is missing; report
clear, OS-appropriate instructions rather than failing opaquely.

## The toolchain

### Mandatory

| Tool | Min version | Purpose |
|---|---|---|
| Java JDK | 17+ | Runtime for jadx and Fernflower/Vineflower |
| jadx | any | Primary decompiler (APK/DEX/JAR/AAR → Java) |

### Recommended

| Tool | Purpose |
|---|---|
| Vineflower (Fernflower fork) | Higher-quality decompilation for lambdas, generics, complex Java |
| dex2jar | Convert DEX → JAR (needed to run Fernflower on APK/DEX) |
| bundletool | Convert AAB (App Bundle) → universal APK |
| apktool | Resource decoding (XML, drawables) when jadx falls short |
| adb (platform-tools) | Pull APKs from a connected device; drive Frida on-device |

### Dynamic analysis (Phase 7)

| Tool | Purpose |
|---|---|
| Python 3.8+ | Runtime for frida-tools (always in a venv, never global) |
| frida-server | Runs on the device/emulator |
| frida-tools | Client CLI — install a version matching the server |

## Verify what's present

```bash
java -version            # need 17+
jadx --version
d2j-dex2jar --version    # dex2jar
apktool --version
adb version
which vineflower bundletool 2>/dev/null
python3 -m venv --help >/dev/null 2>&1 && echo "venv OK"
```

## Install (prefer no-sudo, local installs)

**macOS (Homebrew):**
```bash
brew install openjdk@17 jadx vineflower dex2jar apktool android-platform-tools
# bundletool:
brew install bundletool
```

**Ubuntu/Debian:**
```bash
sudo apt install openjdk-17-jdk
# jadx / apktool: prefer the official release jars added to PATH:
#   jadx:    https://github.com/skylot/jadx/releases/latest
#   apktool: https://ibotpeaches.github.io/Apktool/install/
# dex2jar: https://github.com/pxb1988/dex2jar/releases/latest
# adb:
sudo apt install android-tools-adb
```

**Fedora:** `sudo dnf install java-17-openjdk-devel` · **Arch:** `sudo pacman -S jdk17-openjdk`

For JAR-based tools, set the path env vars where scripts expect them:
```bash
export FERNFLOWER_JAR_PATH="$HOME/vineflower/vineflower.jar"
export BUNDLETOOL_JAR_PATH="$HOME/bundletool/bundletool.jar"
```

## Frida setup (only when doing dynamic analysis)

Detect the environment before changing anything — most users already have a
`frida-server` on device; match the client to it to avoid version-mismatch errors.

```bash
# 1. Device connected? get architecture (arm64, x86_64, ...)
adb devices
adb shell getprop ro.product.cpu.abi

# 2. Existing frida-server on device + its version
adb shell ls /data/local/tmp/frida-server 2>/dev/null
adb shell /data/local/tmp/frida-server --version 2>/dev/null

# 3. Create a venv (NEVER install frida-tools globally)
python3 -m venv ~/.local/share/frida-re/venv

# 4. Install frida-tools matching the server version
~/.local/share/frida-re/venv/bin/pip install "frida-tools==<server-version>"

# 5. Verify connectivity
~/.local/share/frida-re/venv/bin/frida-ps -U
```

If no `frida-server` is on the device, download the release matching the device
ABI + your frida version from `https://github.com/frida/frida/releases`, push it to
`/data/local/tmp/frida-server`, `chmod 755`, and run it as root.

## Rule

Do not proceed to Phase 2 until all **mandatory** tools verify OK. Ask the user
before installing **recommended** optional tools; Vineflower and dex2jar are worth it.
