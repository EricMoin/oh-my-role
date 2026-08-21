#!/usr/bin/env bash
# find-api-calls.sh — sweep decompiled sources for API endpoints & network patterns.
# Usage: bash find-api-calls.sh <sources-dir> [--retrofit|--urls|--auth|--graphql|--websocket|--volley|--ktor|--all] [--context N]
# Default (--all): runs every category. Prints file:line hits grouped by category.

source "$(dirname "$0")/common.sh"

SRC="${1:-}"; shift 2>/dev/null || true
[ -z "$SRC" ] && die "usage: find-api-calls.sh <sources-dir> [--retrofit|--urls|--auth|--graphql|--websocket|--volley|--ktor|--all] [--context N]"
[ -d "$SRC" ] || die "sources dir not found: $SRC"

MODE="all"; CTX=0
while [ $# -gt 0 ]; do case "$1" in
  --retrofit|--urls|--auth|--graphql|--websocket|--volley|--ktor|--all) MODE="${1#--}"; shift ;;
  --context) CTX="$2"; shift 2 ;;
  *) shift ;;
esac; done

# Prefer ripgrep for speed; fall back to grep -r.
if have rg; then SEARCH() { rg -n --no-heading -C "$CTX" -e "$1" "$SRC" 2>/dev/null; }
else SEARCH() { grep -rnE -C "$CTX" "$1" "$SRC" 2>/dev/null; }; fi

section() { hr; info "$1"; hr; }

do_retrofit() { section "Retrofit endpoints (@GET/@POST/... — survive obfuscation)"
  SEARCH '@(GET|POST|PUT|DELETE|PATCH|HTTP|Url)\b'; }
do_urls() { section "Base URLs & hardcoded URLs"
  SEARCH 'https?://[A-Za-z0-9._~:/?#@!$&()*+,;=%-]+'; SEARCH 'baseUrl\('; }
do_auth() { section "Auth patterns (headers, tokens, keys)"
  SEARCH 'Authorization|Bearer |addHeader\(|X-Api-Key|api[_-]?key|apikey|access[_-]?token|refresh[_-]?token'; }
do_graphql() { section "GraphQL queries/mutations"
  SEARCH 'query |mutation |subscription |apollographql|\.graphql'; }
do_websocket() { section "WebSocket connections"
  SEARCH 'WebSocket|newWebSocket|okhttp3\.WebSocket|wss?://'; }
do_volley() { section "Volley requests"
  SEARCH 'StringRequest|JsonObjectRequest|JsonArrayRequest|Volley\.newRequestQueue'; }
do_ktor() { section "Ktor client calls"
  SEARCH 'HttpClient|client\.(get|post|put|delete)|urlString'; }

case "$MODE" in
  retrofit)  do_retrofit ;;
  urls)      do_urls ;;
  auth)      do_auth ;;
  graphql)   do_graphql ;;
  websocket) do_websocket ;;
  volley)    do_volley ;;
  ktor)      do_ktor ;;
  all) do_retrofit; do_urls; do_auth; do_graphql; do_websocket; do_volley; do_ktor
       hr; info "Now build the Tier-1 inventory table (all endpoints) + Tier-2 detail for auth/payment."
       info "See references/api-extraction-patterns.md for the documentation template." ;;
esac
