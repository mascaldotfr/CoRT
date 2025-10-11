# APIs

## About

Each API has a README.md explaining what they do, and what they need to be
run.

It's written in 3 languages:

- Python for all WZ-related things. It's by far the most used
  language. It's strictly through cronjobs.
- PHP for the rest. When the overhead is low, it's run on demand. For heavier
  tasks it's called through cronjobs.

See the [deploy docs](../deploy/README.md) as well.

## READMEs list

### PHP

- [bosses](bin/bosses/README.md)
- [bz](bin/bz/README.md)
- [setups collector and trainer stats](bin/collect/README.md)

### Python

- [warstatus](bin/warstatus/README.md)
- [warzone stats and events](bin/warstatus/stats/README.md)

## API endpoints

To get the whole list:

1. Open https://mascaldotfr.github.io/CoRT/
2. Open the dev tools (F12)
3. Paste this line in the console and press enter:

```js
(await import("./js/api_url.js")).__api__urls
```
