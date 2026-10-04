# APIs

## About

Each API endpoint has a README.md explaining what they do.

The whole API is written in PHP.

See the [deploy docs](../deploy/README.md) as well if you want to deploy it.

## READMEs list

- [setups collector and trainer stats](bin/collect/README.md)
- [warstatus](bin/warstatus/README.md)
- [warzone stats and events](bin/warstatus/stats/README.md)
- [sentinel](bin/warstatus/README.sentinel.md)

Special stuff:

- [put a maintenance message](MAINTENANCE.md)

## Rate limits and other rules on official server API

> [!WARNING]
>
> **TL;DR:** This API is made for CoRT internal use only. Individual users are
> *tolerated* if they behave.
>
> If you're going public, you must deploy your own API, the source code is
> right here. Don't thank me later for the independence, not being a single
> point of failure for the whole Regnum community is a good one already <3

### Polling

The data behind these endpoints is static and only refreshes every
minute or hour. Hammering them faster than that achieves nothing. Short polling
is perfectly fine; WebSockets/SSE are overkill and unnecessary for CoRT usage
itself (no one use notifications).

### Infrastructure Restrictions

Requests from known CDN or serverless providers (Vercel, Cloudflare,
AWS, etc.) are blocked outright, alongside standard CORS restrictions. If you
encounter CORS errors or flat-out rejections, that is expected behavior, not a
bug.

Given the site's low traffic, I'll see you if you try to evade it ;)

As I said earlier, you're better off deploying your own API in such cases.

### Strict Limits

Heavy endpoints, specifically the daily dump generator and `events.sqlite`, are
strictly capped at 5 downloads per hour. There is no valid reason to pull them
more frequently.
