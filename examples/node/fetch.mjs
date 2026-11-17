const key = process.env.ATIS_RELAY_API_KEY;

if (!key) {
  console.error("Set ATIS_RELAY_API_KEY to your ATIS Relay API key");
  process.exit(1);
}

const url = new URL("https://atisrelay.com/api/atis");
url.searchParams.set("icao", "KSFO");

const response = await fetch(url, {
  headers: { "X-Api-Key": key }
});

if (!response.ok) {
  const body = await response.text();
  throw new Error(`HTTP ${response.status}: ${body}`);
}

console.log(JSON.stringify(await response.json(), null, 2));
