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
  (One production + one test connection for each endpoint)
- Opening more connections than that, whether in parallel or by reconnecting
  in a tight loop, gets your IP refused until excess connections close.
- The same infrastructure restrictions as the rest of the API apply (CDN and
  serverless providers blocked, standard CORS rules).


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

## Refused connections

Beyond the 6-connection limit, the server responds with `429 Too Many Requests`
and refuses the new connection. Wait before retrying, and back off
progressively rather than reconnecting immediately.

## Quick nodejs example

```js
// npm install eventsource reconnecting-eventsource

const EventSourcePolyfill = require('eventsource').EventSource;
const ReconnectingEventSource = require('reconnecting-eventsource').default;

const es = new ReconnectingEventSource('https://api.cort.ovh/sse/wstatus.json', {
  eventSourceClass: EventSourcePolyfill,
  max_retry_time: 5000
});

es.onmessage = (e) => {
  console.log('Data received:', e.data);
};
```

## curl example

```shell
curl -N "https://api.cort.ovh/sse/wstatus.json"
```
