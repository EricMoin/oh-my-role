---
name: legal-authorization
description: Authorization and lawful-use gate for Android reverse engineering. Apply BEFORE any substantive analysis to confirm the work is lawful — security research, education, CTF, interoperability, or analysis of an app you own or are authorized to assess. 中文触发词：授权检查、合法使用、逆向合规、授权范围、法律边界
trigger: authorization|authorized|legal use|lawful|scope|permission|is this legal|can I reverse|合法|授权|逆向合规|授权范围|法律边界|合规
---

# Legal & Authorization Gate

Reverse engineering is a lawful, valuable discipline — for security research,
education, CTF, malware analysis, interoperability, and auditing software you own
or are hired to assess. It is **not** a tool for piracy, credential theft, DRM
circumvention for redistribution, or attacking systems you have no right to touch.
Apply this gate before doing substantive work on any target.

## The authorization check (do this first)

Establish, briefly, on what basis the analysis is authorized. One of these should hold:

1. **Ownership** — the user built the app or their organization owns it.
2. **Explicit authorization** — a pentest engagement, bug-bounty program in scope,
   or written permission from the owner.
3. **Research / education** — malware analysis, a CTF challenge, a deliberately
   vulnerable training app, or a personal-learning teardown of an app the user
   legitimately possesses and analyzes privately.
4. **Interoperability / self-defense** — understanding an app running on the user's
   own device (e.g., what data it exfiltrates), consistent with local law.

If none obviously applies, **ask** what the target is and the basis for analyzing
it before proceeding.

## When to decline or warn

Decline, or warn clearly and ask for confirmation, when the request points at:

- Bypassing licensing/DRM on someone else's paid app **to redistribute or pirate** it.
- Extracting another party's secrets to impersonate them, forge requests, or defraud.
- Attacking a third-party production backend discovered during analysis (extracted
  endpoints are for understanding, not for unauthorized access or abuse).
- Harvesting credentials, PII, or payment data from an app the user has no right to.
- Removing anti-cheat / anti-tamper to gain unfair advantage in live multiplayer.

Extracting API endpoints or bypassing SSL pinning **for local analysis** is normal
and fine. Using those findings to hit a backend you are not authorized to access is
a separate act — flag that boundary.

## Handling findings responsibly

- **Secrets found** (API keys, tokens, credentials): report their presence and
  location as a *finding*; do not use them against live systems without authorization.
  For your own app, recommend rotation and server-side enforcement.
- **Vulnerabilities in third-party apps**: recommend coordinated disclosure to the
  vendor; do not weaponize.
- **Evidence hygiene**: keep decompiled output and reports local; do not upload a
  third party's proprietary code to public services without cause.

## One-line posture

> Analyze freely what you own or are authorized to; understand, don't abuse, what
> you don't. When in doubt about scope, ask before you act.
