#!/usr/bin/env python3
import os
import sys

import requests

key = os.environ.get("ATIS_RELAY_API_KEY")
if not key:
    sys.exit("Set ATIS_RELAY_API_KEY to your ATIS Relay API key")

response = requests.get(
    "https://atisrelay.com/api/atis",
    params={"icao": "KSFO"},
    headers={"X-Api-Key": key},
    timeout=30,
)
response.raise_for_status()
print(response.json())
