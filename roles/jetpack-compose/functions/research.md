---
name: research
description: Resolve a specific Android/Compose API uncertainty using current documentation and matching dependency source
priority: 15
---

# Research

Load `android-source-research` for the workflow. It routes to
`references/evidence-first-research.md` for evidence and citation rules and to
`references/source-research.md` for dependency resolution and source tracing. These are
shared with the source-tracer; do not maintain a second channel list or example citation here.

Start with one falsifiable question and the project's relevant resolved versions. For a
library/API question, resolve the library in Context7, then query the specific behavior.
Use the returned documentation URL and verify that its version applies. If coverage is
missing or implementation behavior remains uncertain, select the authoritative source or
small experiment that can resolve it; do not exhaust every channel as a ritual.

A dependency report identifies selected artifacts; it does not download their source JARs.
A source citation must identify an observed revision or matching artifact, not an invented
tag or path. Keep findings, inference and unavailable evidence distinct. Stop when evidence
is sufficient for the decision. Continue independent work and report a remaining limitation;
ask only for missing user intent or constraints that cannot be discovered.
