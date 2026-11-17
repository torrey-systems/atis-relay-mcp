#!/usr/bin/env node

import readline from "node:readline";

const MCP_URL = "https://atisrelay.com/mcp";
const PARSE_ERROR = -32700;
const INVALID_REQUEST = -32600;
const INTERNAL_ERROR = -32603;

let sessionId = null;

function hasOwn(object, key) {
  return Boolean(object) && Object.prototype.hasOwnProperty.call(object, key);
}

function hasRequestId(message) {
  if (Array.isArray(message)) {

    return message.some((item) => hasOwn(item, "id"));
  }

  return hasOwn(message, "id");
}

function requestId(message) {
  if (Array.isArray(message)) {
    const item = message.find((entry) => hasOwn(entry, "id"));

    if (item) {

      return item.id;
    }

    return null;
  }

  if (hasOwn(message, "id")) {

    return message.id;
  }

  return null;
}

function jsonRpcError(id, code, rpcMessage) {
  return {
    jsonrpc: "2.0",
    id,
    error: {
      code,
      message: rpcMessage,
    },
  };
}

function writeMessage(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function requestHeaders() {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
  };

  if (process.env.ATIS_RELAY_API_KEY) {

    headers["X-Api-Key"] = process.env.ATIS_RELAY_API_KEY;
  }

  if (sessionId) {

    headers["Mcp-Session-Id"] = sessionId;
  }

  return headers;
}

function parseSse(text) {
  const messages = [];

  for (const event of text.split(/\r?\n\r?\n/)) {
    const dataLines = [];

    for (const line of event.split(/\r?\n/)) {

      if (line.startsWith("data:")) {

        dataLines.push(line.slice(5).replace(/^ /, ""));
      }
    }

    if (!dataLines.length) {

      continue;
    }

    const data = dataLines.join("\n");

    if (!data || data === "[DONE]") {

      continue;
    }

    messages.push(JSON.parse(data));
  }

  return messages;
}

function isJsonRpcPayload(value) {
  if (Array.isArray(value)) {

    return value.length > 0 && value.every(isJsonRpcPayload);
  }

  return Boolean(value && typeof value === "object" && value.jsonrpc === "2.0");
}

async function readBodyMessages(response) {
  const contentType = (response.headers.get("content-type") || "").toLowerCase();
  const text = await response.text();

  if (!text) {

    return [];
  }

  if (contentType.includes("text/event-stream")) {

    return parseSse(text);
  }

  const parsed = JSON.parse(text);

  if (Array.isArray(parsed)) {

    return parsed;
  }

  return [parsed];
}

async function forward(message) {
  const expectsResponse = hasRequestId(message);

  try {
    const response = await fetch(MCP_URL, {
      method: "POST",
      headers: requestHeaders(),
      body: JSON.stringify(message),
    });
    const returnedSession = response.headers.get("mcp-session-id");

    if (returnedSession) {

      sessionId = returnedSession;
    }

    let messages = [];

    try {
      messages = await readBodyMessages(response);
    } catch {

      if (expectsResponse) {

        writeMessage(jsonRpcError(requestId(message), INTERNAL_ERROR, "Invalid response from hosted MCP server"));
      }

      return;
    }

    if (!expectsResponse) {

      return;
    }

    const rpcMessages = messages.filter(isJsonRpcPayload);

    if (rpcMessages.length) {

      for (const item of rpcMessages) {

        writeMessage(item);
      }

      return;
    }

    writeMessage(
      jsonRpcError(
        requestId(message),
        INTERNAL_ERROR,
        `Hosted MCP server returned HTTP ${response.status}`,
      ),
    );
  } catch (error) {

    if (expectsResponse) {

      writeMessage(
        jsonRpcError(
          requestId(message),
          INTERNAL_ERROR,
          error instanceof Error ? error.message : "Request to hosted MCP server failed",
        ),
      );
    }
  }
}

function parseLine(line) {
  const trimmed = line.trim();

  if (!trimmed) {

    return null;
  }

  return JSON.parse(trimmed);
}

const rl = readline.createInterface({
  input: process.stdin,
  crlfDelay: Infinity,
});

let queue = Promise.resolve();

rl.on("line", (line) => {
  queue = queue
    .then(async () => {
      let message;

      try {
        message = parseLine(line);
      } catch {

        writeMessage(jsonRpcError(null, PARSE_ERROR, "Parse error"));

        return;
      }

      if (!message) {

        return;
      }

      if (typeof message !== "object") {

        writeMessage(jsonRpcError(null, INVALID_REQUEST, "Invalid Request"));

        return;
      }

      await forward(message);
    })
    .catch((error) => {
      writeMessage(
        jsonRpcError(
          null,
          INTERNAL_ERROR,
          error instanceof Error ? error.message : "Internal error",
        ),
      );
    });
});

rl.on("close", () => {
  queue.then(() => process.exit(0));
});
