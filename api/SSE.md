# SSE stream

Server-Sent Events (SSE) let you receive updates pushed by the server over a
single HTTP connection, instead of polling. This stream is only available for
the following endpoints:

- [warstatus](../bin/warstatus/README.md)
- [warzone stats and events](../bin/warstatus/stats/README.md)

Other endpoints of the API are not covered by the stream.

Note that the SSE server is closed source, and is not used by CoRT. The reason
is that people aren't using notifications on the website, but on my discord
channels, so API fetches aren't much repeated and the CDN is faster than my
server out of Europe.

## Rules

- Open to everyone, within the limits below.
- **6 concurrent connections per IP**, shared across all covered endpoints.
  (that gives you one production + one test connection for each endpoint)
- **10 connections (or attempts) per minute**
- Opening more connections than that, whether in parallel or by reconnecting in
  a tight loop, gets your IP refused until excess connections close, and if
  repeated too much will lead you to a ban that will progressively increase in
  duration.

Beyond the 6-connection limit or 10 connection attempts per minute, the server
responds with `429 Too Many Requests` and refuses the new connection. Wait 1
minute before retrying. For other connection errors, wait 10 seconds. (see the
example below).

## Infrastructure Restrictions

Requests from known CDN or serverless providers (Vercel, Cloudflare,
AWS, etc.) are blocked outright, alongside standard CORS restrictions. If you
encounter CORS errors or flat-out rejections, that is expected behavior, not a
bug.

To make things simple, if you use it in a real application, we're all good, for a
website you'll have to use a VPS and relay streams to your users.

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

## Quick nodejs example

```js
// npm install eventsource

const EventSource = require('eventsource').EventSource;

const SSE_URL = 'https://api.cort.ovh/sse/wstatus.json';
const RETRY_DELAY_MS = 10_000;     // 10 s
const RATE_LIMIT_DELAY_MS = 60_000; // 1 min

function connect() {
  const es = new EventSource(SSE_URL);

  es.onopen = () => {
    console.log('Connection opened');
  };

  es.onmessage = (e) => {
    console.log('Data received:', e.data);
  };

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
stream it to your users. **Beware** if you want to build a relay, cache the
last received data and send it to the client when they connect or they gotta
wait for the next WZ change.

## curl example

```shell
curl -N "https://api.cort.ovh/sse/wstatus.json"
```
