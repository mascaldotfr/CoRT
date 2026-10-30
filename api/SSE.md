# SSE stream

Server-Sent Events (SSE) let you receive updates pushed by the server over a
single HTTP connection, instead of polling. This stream is only available for
the following endpoints:

- [warstatus](../bin/warstatus/README.md)
- [warzone stats and events](../bin/warstatus/stats/README.md)

Other endpoints of the API are not covered by the stream.

Note that the SSE server is closed source, and is not used by CoRT. The reason
is that people aren't using notifications on the website, but on my discord
channels, so API fetches aren't much repeated.

## Rules

- Open to everyone, within the limits below.
- **6 concurrent connections per IP**, shared across all covered endpoints.
  (that gives you one production + one test connection for each endpoint)
- Opening more connections than that, whether in parallel or by reconnecting
  in a tight loop, gets your IP refused until excess connections close.

## Infrastructure Restrictions

Requests from known CDN or serverless providers (Vercel, Cloudflare,
AWS, etc.) are blocked outright, alongside standard CORS restrictions. If you
encounter CORS errors or flat-out rejections, that is expected behavior, not a
bug.

Given the site's low traffic, I'll see you if you try to evade it, and so will my
WAF and checking agent.


## SSE URLs

|      WHAT         |                         URL                          |
|-------------------|------------------------------------------------------|
|   WZ status       | https://api.cort.ovh/sse/wstatus.json                |
|   WZ statistics   | https://api.cort.ovh/sse/stats.json                  |
|   WZ events       | https://api.cort.ovh/sse/events.json                 |

- The replies are in the same format than the static API.
- When your code connects to the endpoint, the server sends the API data
  in its first reply, so you don’t need to request the static API
  separately.

**Beware** if you want to build a relay, cache the last received data and send
it to the client when they connect or they gotta wait for the next WZ change.

## Refused connections

Beyond the 6-connection limit, the server responds with `429 Too Many Requests`
and refuses the new connection. Wait before retrying, and back off
progressively rather than reconnecting immediately.

## Quick nodejs example

```js
// npm install eventsource

const EventSource = require('eventsource').EventSource;

const SSE_URL = 'https://api.cort.ovh/sse/wstatus.json';
const RECONNECT_DELAY_MS = 5000;

function connect() {
  const es = new EventSource(SSE_URL);

  es.onopen = () => {
    console.log('Connection opened');
  };

  es.onmessage = (e) => {
    console.log('Data received:', e.data);
  };

  es.onerror = (err) => {
    console.error('Connection error, reconnecting in', RECONNECT_DELAY_MS, 'ms');
    es.close();
    setTimeout(connect, RECONNECT_DELAY_MS);
  };
}

connect();
```

It's too long to put the code here and Codeberg is very strict about it, but
it's a fairly low effort for any AI to write a relay for this, if you want to
stream it to your users.

## curl example

```shell
curl -N "https://api.cort.ovh/sse/wstatus.json"
```
