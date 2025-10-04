# BZ

This page documents the BZ API.

## URL

https://cort.thebus.top/api/bin/bz/bz.php

## Deployment

Ensure PHP is enabled on your webserver

## Response format

See `/js/bz.js` for an example.


```
{
  "bzbegin": [Unix timestamp of all BZ beginning hours for the next 2 days],
  "bzend": [Corresponding ending times],
  "bzon": "boolean. True if is BZ is on otherwise False",
  "bzendsat": "int. If BZ is on, give the Unix timestamp corresponding to the end of the current BZ, otherwise 0",
}
```
