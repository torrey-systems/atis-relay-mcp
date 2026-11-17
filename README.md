# ATIS Relay API

[![torrey-systems/atis-relay-mcp MCP server](https://glama.ai/mcp/servers/torrey-systems/atis-relay-mcp/badges/score.svg)](https://glama.ai/mcp/servers/torrey-systems/atis-relay-mcp)

REST API for D-ATIS, transcribed ATIS and AWOS, METAR, TAF, airports, NOTAMs, SIGMET, AIRMET, PIREP, NAS status, and live traffic. Operated by Torrey Systems, LLC.

Unofficial. Not for operational use. Confirm on frequency.

Getting started guide: https://atisrelay.com/getting-started

Full docs: https://atisrelay.com/api_docs

OpenAPI spec: https://atisrelay.com/openapi.json ([YAML](https://atisrelay.com/openapi.yaml))

## Quick start

1. Create a free account at https://atisrelay.com/signup
2. Issue a key under Account, API key: https://atisrelay.com/account/api-key
3. Export the key and call D-ATIS for KSFO:

```bash
export ATIS_RELAY_API_KEY="your-key"
./examples/curl.sh
```

Response:

```json
{
  "atis": {
    "airportID": "KSFO",
    "atisCode": "B",
    "letter": "B",
    "dataBody": "SFO ATIS INFO B 1656Z. ..."
  },
  "departure": null,
  "arrival": null,
  "official": false,
  "notice": "Unofficial. Not for operational use. Confirm on frequency."
}
```

## Authentication

Send the key on every request:

```
X-Api-Key: $ATIS_RELAY_API_KEY
```

One key per account. Keys can be revoked from the same account page.

## Examples

Scripts in `examples/` read `ATIS_RELAY_API_KEY` from the environment. They never hardcode keys.

```bash
export ATIS_RELAY_API_KEY="your-key"
./examples/curl.sh
node examples/node/fetch.mjs
python examples/python/get_datis.py
ruby examples/ruby/get_datis.rb
```

`examples/python/get_datis.py` needs `requests` (`pip install requests`). The Node and Ruby scripts use the language standard library.

## Plans

| Plan | Per minute | Per day | Phone-line dials |
| --- | --- | --- | --- |
| Free | 10 | 500 | Cannot start a new phone-line dial |
| ATIS Relay Plus | 30 | 1000 | 100 new dials per UTC month |
| Commercial | 60 | No daily included allowance | No monthly dial cap |

ATIS Relay Plus is $5.99/month. Commercial is usage-based. See https://atisrelay.com/developers and https://atisrelay.com/pricing/usage.

Live traffic is available to any valid API key. `GET /api/datis/all` and `GET /api/notams` need ATIS Relay Plus or Commercial.

## MCP

A read-only remote MCP server is at https://atisrelay.com/mcp using Streamable HTTP. It exposes 31 read-only tools that map to GET endpoints. Discovery methods initialize, notifications/initialized, tools/list, and ping work without a key. Tool calls require `X-Api-Key` or `Authorization: Bearer`. The MCP server never starts a phone-line dial and never creates subscriptions or webhooks.

```json
{
  "mcpServers": {
    "atis-relay": {
      "url": "https://atisrelay.com/mcp",
      "headers": {
        "X-Api-Key": "$ATIS_RELAY_API_KEY"
      }
    }
  }
}
```

Replace `$ATIS_RELAY_API_KEY` with your key.

## Use with Claude Desktop / Cursor

Remote Streamable HTTP, with the API key in `X-Api-Key`:

```json
{
  "mcpServers": {
    "atis-relay": {
      "url": "https://atisrelay.com/mcp",
      "headers": {
        "X-Api-Key": "$ATIS_RELAY_API_KEY"
      }
    }
  }
}
```

Local stdio or Docker, with `ATIS_RELAY_API_KEY` in the environment. Discovery works without a key. Tool calls need a key.

```json
{
  "mcpServers": {
    "atis-relay": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "ATIS_RELAY_API_KEY",
        "atis-relay-mcp"
      ],
      "env": {
        "ATIS_RELAY_API_KEY": "your-key"
      }
    }
  }
}
```

Build the image with `docker build -t atis-relay-mcp .`. To run the bridge on the host instead, use `"command": "node"` and `"args": ["src/index.js"]` from this repository, with the same `env` map.

## OpenAPI spec

This directory does not vendor a snapshot of the spec. Fetch the live document:

- https://atisrelay.com/openapi.json
- https://atisrelay.com/openapi.yaml

See `openapi.json` in this directory for those URLs.

## License

MIT. Copyright (c) 2026 Torrey Systems, LLC.
