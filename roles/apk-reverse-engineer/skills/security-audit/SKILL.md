---
name: security-audit
description: Phase 6 — audit a decompiled app for security issues. Check SSL/certificate pinning and disabled TLS verification, exposed secrets/API keys, debug flags, weak/misused crypto, Fragment Injection (exported PreferenceActivity + isValidFragment), exported components, and insecure storage. Report findings with severity and file:line evidence. 中文触发词：安全审计、安全分析、证书固定、SSL Pinning、密钥泄露、硬编码密钥、弱加密、Fragment注入、导出组件、安全检查
trigger: security audit|security analysis|ssl pinning|certificate pinning|disabled ssl|exposed secret|hardcoded key|weak crypto|fragment injection|exported component|insecure storage|安全审计|安全分析|证书固定|密钥泄露|弱加密|Fragment注入|导出组件|安全检查
---

# Phase 6: Security Audit

> **Automation:** `bash scripts/security-scan.sh <decompiled-dir>` runs every heuristic
> check below (TLS, secrets, crypto, Fragment Injection, manifest flags, exported
> components) and prints severity-tagged findings. Findings are heuristic — confirm each
> with file:line context. Bypass playbook for pinning/root/etc.: `references/protection-bypass-playbook.md`.

Systematically check the decompiled app for common Android security weaknesses.
Report each finding with a **severity**, the **evidence** (`file:line` or manifest
attribute), and a concrete **recommendation**. This is analysis for defense — see
`legal-authorization` for the boundary between finding and abuse.

## 1. TLS / certificate pinning & verification

```bash
SRC=<output>/sources
# Pinning present (good) — note the pins and where they're enforced
grep -rn 'CertificatePinner\|sslPinning\|pinning\|network_security_config' "$SRC"
# Verification DISABLED (bad) — trust-all managers, hostname bypass
grep -rn 'TrustManager\|checkServerTrusted\|ALLOW_ALL_HOSTNAME_VERIFIER\|HostnameVerifier\|setHostnameVerifier\|trustAllCerts' "$SRC"
```

- **Disabled verification** (empty `checkServerTrusted`, allow-all hostname verifier)
  → **High**: MITM-able.
- **No pinning** on a security-sensitive app → **Medium** (context-dependent).
- Also read the `networkSecurityConfig` XML for `cleartextTrafficPermitted="true"`
  and `<trust-anchors>` that trust user CAs.

## 2. Exposed secrets

```bash
grep -rEn '(api[_-]?key|secret|password|passwd|token|client[_-]?secret|aws_|AKIA[0-9A-Z]{16}|-----BEGIN)' "$SRC"
# Plus every BuildConfig.java (see structure-analysis) and res/values/strings.xml
grep -rn '' <output>/resources/res/values/strings.xml 2>/dev/null | grep -Ei 'key|secret|token|url'
```

Client-side secrets are extractable by definition → **Medium/High** depending on what
the key unlocks. Recommend server-side enforcement and rotation for owned apps.

## 3. Debug & tamper flags

- `android:debuggable="true"` in the manifest → **High** (attach a debugger freely).
- `android:allowBackup="true"` with sensitive data → **Medium** (adb backup exfiltration).
- Leftover `BuildConfig.DEBUG` gated logging of tokens/PII → **Low/Medium**.

## 4. Weak / misused cryptography

```bash
grep -rn 'DES\|"AES/ECB\|MD5\|SHA1"\|Cipher.getInstance\|IvParameterSpec\|SecretKeySpec\|Random()' "$SRC"
```

Flag: ECB mode, hardcoded keys/IVs, `MD5`/`SHA-1` for security, `java.util.Random`
for tokens, DES/3DES.

## 5. Fragment Injection (classic, still found)

An **exported** `PreferenceActivity` (or subclass) with a missing or permissive
`isValidFragment()` lets an attacker load arbitrary fragments via an Intent extra.

```bash
# Find PreferenceActivity subclasses and check isValidFragment overrides
grep -rn 'extends PreferenceActivity\|isValidFragment' "$SRC"
```

- Exported `PreferenceActivity` **without** an `isValidFragment` override, or one
  that returns `true` unconditionally → **High**.
- Also flag dynamic fragment instantiation driven by `getIntent().getStringExtra(...)`.
- Confirmation playbook: `adb shell am start -n <pkg>/<activity> --es
  ":android:show_fragment" <targetFragment>` and observe.

## 6. Exported components (attack surface)

From the manifest (Phase 3): any `android:exported="true"` Activity/Service/Receiver/
Provider, or one with an intent-filter and no explicit `exported=false`, is reachable
by other apps. Check that each enforces a permission and validates its inputs.
Exported `ContentProvider` without `android:permission` → **High** (data exposure).

## 7. Insecure storage

```bash
grep -rn 'MODE_WORLD_READABLE\|MODE_WORLD_WRITEABLE\|getExternalStorage\|SharedPreferences' "$SRC"
```

World-readable prefs/files or secrets written to external storage → **Medium/High**.

## Output of this phase

A findings list, each with: **severity** (High/Medium/Low), **title**, **evidence**
(`file:line` or manifest attribute), and a **recommendation**. Summarize the overall
risk posture at the top.
