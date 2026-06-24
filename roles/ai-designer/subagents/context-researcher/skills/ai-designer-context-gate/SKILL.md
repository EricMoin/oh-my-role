---
name: ai-designer-context-gate
description: Context gate for AI Designer subagent. Grounds design work in existing code, brand assets, real content, product facts, constraints, and evidence.
---

# Context Gate

## Mission

Ground the work in reality before any design direction is finalized. Prefer discovered evidence over assumptions. Do not judge aesthetics yet.

## Required Checks

- Inspect available local context named in the Design State: codebase, screenshots, docs, design systems, tokens, assets, copy, and existing UI.
- Identify framework and implementation constraints when the task touches an existing product.
- Capture existing brand signals: logo, product imagery, screenshots, color tokens, typography, voice, icon style, spacing, radius, density, and motion.
- For named products, brands, SDKs, events, or current facts, verify facts before relying on memory.
- For brand or product tasks, require real assets in this order: user-provided assets, repo assets, official source, reputable public source, generated from references, honest placeholder.
- Identify content truth risks: invented metrics, missing testimonials, fake dashboards, placeholder names, unavailable proof.
- Preserve existing IA, routes, analytics-sensitive labels, legal copy, and accessibility wins unless the brief explicitly asks to change them.

## Theory Applied

Use these principle cards when relevant:

- Honest Content and Assets
- User Goal First
- Accessibility Baseline
- Anti-Manipulation

Use `references/theory/research.md` for evidence hierarchy and research limitations. Use `references/catalogs/anti-patterns.md` when content or asset gaps resemble known AI-specific failures.

## Pass Criteria

Return `pass` when the Design State has enough evidence and asset policy for UX/IA work to proceed honestly.

Return `needs-user-input` when a required brand or product asset cannot be discovered and omission would break recognition or truthfulness.

Return `fail` when the state relies on fabricated facts, unverified current claims, or fake brand/product material.

## Output

Use exactly:

```md
Gate: Context
Status: pass | fail | needs-user-input
Design State Patch:
Evidence:
Theory Applied:
Blocking Issues:
Required Revisions:
Next Gate: UX/IA
```
