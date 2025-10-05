# APIs

## About

Each API has a README.md explaining what they do, and what they need to be
run.

It's written in 3 languages:

- PHP for simple and fast code with no overhead
- Python for queries that would be slow as well with PHP, because it has all
  batteries included. It's by far the most used language.
- Shell when it's the most practical

PHP is called dynamically at each API call. Shell and Python are called through
task scheduling. If you think it's a mess it has run reliably for more than 2
years as I've written this ;)

See the [deploy docs](../deploy/README.md) as well.

## READMEs list

- [bosses](bin/bosses/README.md)
- [bz](bin/bz/README.md)
- [setups collector and trainer stats](bin/collect/README.md)
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
