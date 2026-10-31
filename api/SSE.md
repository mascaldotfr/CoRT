# SSE stream

Server-Sent Events (SSE) push updates from the server over a single
HTTP connection, instead of polling.

It's available for the all the WZ API endpoints (status, stats, and events).

Other API endpoints are not covered. The SSE server is closed source and
not used by CoRT: notifications mostly go through Discord, API fetches are
rarely repeated, and the CDN is faster than the server outside Europe.

## Rules

- Open to everyone, within the limits below.
- **6 concurrent connections per IP**, shared across all covered endpoints (one
  production + one test connection per endpoint). IPv6 addresses are rate
  limited per /64 prefix, IPv4 per address.
- **10 connections (or attempts) per minute**.
- Exceeding these limits, whether in parallel or by reconnecting in a tight
  loop, blocks your IP until the excess connections close. Repeated abuse
  leads to progressively longer bans.

Beyond these limits, the server responds with `429 Too Many Requests` and
refuses the connection: wait 1 minute before retrying. For other connection
errors, wait 10 seconds.

## Infrastructure restrictions

Requests from known CDN or serverless providers (Vercel, Cloudflare, AWS,
etc.) are blocked, alongside standard CORS restrictions. CORS errors or
outright rejections are expected behavior, not bugs.

For a real application, this is generally fine, as long as each stream URL is
opened only once, through a singleton shared across all your views, since
it's the user IP which is used.

For a website, use a VPS and relay the streams to your users. Or
[deploy your own API](../deploy/README.md).

Given the low traffic, any attempt to evade the restrictions will be detected
by the WAF and the checking agent.

## SSE URLs

| What          | URL                                   |
|---------------|---------------------------------------|
| WZ status     | https://api.cort.ovh/sse/wstatus.json |
| WZ statistics | https://api.cort.ovh/sse/stats.json   |
| WZ events     | https://api.cort.ovh/sse/events.json  |

- Response format is identical to the static API, as a reminder, you can find
  the response formats here :
    - [warstatus](bin/warstatus/README.md)
    - [warzone stats and events](bin/warstatus/stats/README.md)

- On connection, the server sends the API data in its first reply, so you
  don't need to call the static API separately.

## Node.js example

```js
// npm install eventsource

const EventSource = require('eventsource').EventSource;

const SSE_URL = 'https://api.cort.ovh/sse/wstatus.json';
const RETRY_DELAY_MS = 10_000;      // 10 s
const RATE_LIMIT_DELAY_MS = 60_000; // 1 min

function connect() {
  const es = new EventSource(SSE_URL);

  es.onopen = () => console.log('Connection opened');
  es.onmessage = (e) => console.log('Data received:', e.data);

  es.onerror = (err) => {
    es.close(); // prevent the library from retrying on its own

    if (err && err.status === 429) {
      console.error('429 Too Many Requests, retrying in 1 min');
      setTimeout(connect, RATE_LIMIT_DELAY_MS);
    } else {
      console.error('Connection error, retrying in 10 s');
      setTimeout(connect, RETRY_DELAY_MS);
    }
  };
}

connect();
```

It's a fairly low effort for any AI to write a relay for this, if you want to
stream it to your users.

If you build a relay for your users, **be aware**: cache the last received
data and send it to each new client, otherwise they'll have to wait for the
next WZ change.

## curl example

```shell
curl -N "https://api.cort.ovh/sse/wstatus.json"
```
