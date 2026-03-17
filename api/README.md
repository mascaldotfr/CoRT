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
- `reset_powers/reset_powers.php` clears site data

## Rate limits and other rules on official server API

> [!WARNING]
>
> **TLDR; I owe you nothing, you can deploy your own API if you don't agree,
> the source code is right here**

Endpoints are actually static and actualized minutely/hourly or more as needed,
it's useless to hammer them more than minutely. I totally assume and accept
long polling over websockets.

Use the API responsibly; planned sanction is a gentle "shadow" throttling most
of the time after a warning, unless you are totally not understanding the
big warning above.

Some old code using https://cort.ovh directly will still work, but you'll be
redirected, so update them if you can.
