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
> **TLDR; I owe you nothing, you can deploy your own API if you get busted,
> the source code is right here**

Endpoints are actually static and actualized minutely/hourly or more as needed,
it's useless to hammer them more than minutely. I totally assume and accept
short polling over websockets.

The limits are generous; you shouldn't meet them if you are using the API
responsibly. Hitting too hard a 429 will hit my WAF, you'll get a 4 hours ban.

Note that you'll have to host your own data if you plan to use the API for your
website, for any vibe coder out there, ask that to your project: *how can i use
some api data when cors is enabled on an api server i don't own and have
no control of?*.

**Note that some endpoints like the dump generator (updated daily anyway) and
events.sqlite have a stronger rate limiting (5 downloads per hour).**
