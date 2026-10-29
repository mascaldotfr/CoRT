# APIs

## About

Each API endpoint has a README.md explaining what they do.

The whole API is written in PHP.

See the [deploy docs](../deploy/README.md) as well if you want to deploy it.

## Static API vs event-driven API (SSE)

This README covers the *static* API, which is the one https://cort.ovh uses and
<b><u>and is private, heavily guarded</u></b>. This one is really good on a CDN
because you can easily replicate the API data around the world since it's just
files.

If you need an event driven access to the API for the WZ endpoints, checkout
the [SSE README](SSE.md). Note that it only exists at https://cort.ovh, third
party installations of CoRT doesn't have this.

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
> **TL;DR:** This API is made for CoRT internal use only. It's documented for
> use on your own server.
>
> If you're going public, deploy your own API, the source code is right here.
> Deployment instructions are in `/deploy`, or do you own stuff starting from my
> code.
> Don't thank me later for the independence, not being a single point of
> failure for the whole Regnum community is a good one already <3


