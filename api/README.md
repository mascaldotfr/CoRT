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

## API endpoints

To get the whole list:

1. Open https://mascaldotfr.github.io/CoRT/
2. Open the dev tools (F12)
3. Paste this line in the console and press enter:

```js
(await import("./js/api_url.js")).__api__urls
```
