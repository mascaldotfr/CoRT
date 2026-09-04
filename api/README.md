# APIs

## About

Each API endpoint has a README.md explaining what they do.

The whole API is written in PHP.

See the [deploy docs](../deploy/README.md) as well if you want to deploy it.

## READMEs list

- [setups collector and trainer stats](bin/collect/README.md)
- [bosses](bin/bosses/README.md)
- [bz](bin/bz/README.md)
- [warstatus](bin/warstatus/README.md)
- [warzone stats and events](bin/warstatus/stats/README.md)
- [sentinel](bin/sentinel/README.md)

Special stuff:

- [put a maintenance message](MAINTENANCE.md)

## Rate limits and other rules on official server API

> [!WARNING]
>
> **TLDR; I owe you nothing, you can deploy your own API if you get banned,
> the source code is right here**

The data behind these endpoints is static and only refreshes every minute or
hour (depending on the endpoint), so hammering them more often than that does
literally nothing for you. Short polling is totally fine — I'm not expecting
anyone to set up websockets for this.

The limits are generous. If you're using the API like a normal person, you
won't come close to hitting them. If you do trip a 429 and keep going anyway,
my WAF will hand you a 4-hour ban. Don't test it.

Requests from known CDN/hosting/serverless providers (Vercel, Cloudflare, AWS,
etc.) are blocked outright, on top of CORS restrictions. So if you're building
a website on this and running into CORS errors or flat-out rejections — that's
expected, not a bug. You'll need to fetch and cache the data yourself from
infrastructure that isn't a CDN (a small VPS, your own server, whatever) and
serve it to your frontend from there. If you're using an AI coding assistant,
don't just ask it about CORS — give it the real constraint. Paste something
like:

> "I need to fetch data from a third-party API in my [frontend framework] app.
> The API has CORS restrictions and blocks requests from CDN/serverless IP
> ranges (Vercel, Cloudflare, AWS, etc.), so I can't call it from the browser
> or from serverless functions. How do I set up a backend or proxy on non-CDN
> infrastructure (like a small VPS) to fetch and cache this data, then serve it
> to my frontend?"

That'll get you a working answer instead of a generic "just make a serverless
proxy" suggestion that won't actually work here.

A couple of endpoints get stricter limits: the daily dump generator and
`events.sqlite` are capped at 5 downloads/hour, since there's no reason to pull
them more often than that.

