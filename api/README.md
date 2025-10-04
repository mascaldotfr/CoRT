# APIs

## About

Each APIs have a README.md explaining what they do, and what they need to be
run.

It's written in 3 languages:

- PHP for simple and fast code with no overhead
- Python for queries that would be slow as well with PHP, because it has all
  batteries included. It's by far the most used language.
- Shell when it's the most practical

PHP is called dynamically at each API call. Shell and Python are called through
task scheduling. If you think it's a mess it has run reliably for more than 2
years as I'm written this.

See the [deploy docs](../deploy/README.md) as well.

## API endpoints

(See `../js/api_urls`)
