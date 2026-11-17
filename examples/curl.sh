#!/usr/bin/env bash
set -euo pipefail

if [ -z "${ATIS_RELAY_API_KEY:-}" ]; then
  echo "Set ATIS_RELAY_API_KEY to your ATIS Relay API key" >&2
  exit 1
fi

curl -sS "https://atisrelay.com/api/atis?icao=KSFO" \
  -H "X-Api-Key: ${ATIS_RELAY_API_KEY}"
echo
