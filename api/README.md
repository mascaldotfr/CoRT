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

## API endpoints

To get the whole list:

1. Open https://cort.ovh
2. Open the dev tools (F12)
3. Paste this line in the console and press enter:

```js
(await import("./js/libs/cortlibs.js")).api.urls
```

## Rate limits and other rules on official server API

*These limits are set at the webserver level, if you set your own API server,
they won't apply.*

> [!WARNING]
> If you plan to use the official API server in environments where asynchronous
> user events (clicks and stuff in apps and website) trigger direct API calls,
> you *should* implement a [debounce mechanism](https://developer.mozilla.org/en-US/docs/Glossary/Debounce) to
> avoid rate limits.

### Rate limits

The rate limits by host are:

- 30 queries / minute for dynamic (php) queries
- 30 queries / minute for static queries (json, csv etc.)

The rate limits for these 2 are separated, meaning that you can issue 30 dynamic
and 30 static requests per minute and per host.

> [!CAUTION]
> Going over the rate limit will make the official webserver abort the
> connection without any form of info if you're still calling further the API.
> You're grounded until the next minute + a random jitter.

### Other rules

**A user agent needs to be set to access the API**. This may be the name of
your app, a non browser name (like `curl/1.2.3`) or whatever. This is for
API statistics purpose.

I don't want to overburden potential third parties users, so please use the API
responsibly.
