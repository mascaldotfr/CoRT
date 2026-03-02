# BZ

This page documents the BZ API endpoint, used by CoRT and CoRT-dc.

> [!TIP]
> I would recommend to take my code and reimplement it in whatever language you
> are using. It's super simple, and ensure a better reactivity for your app.
>
> It's here because I don't want to repeat myself in CoRT and CoRT-dc.


## URL

https://cort.ovh/api/bin/bz/bz.php

## Parameters

### `fake`

https://cort.ovh/api/bin/bz/bz.php?fake

If a `fake` parameter is provided, then BZ will be ON then OFF for 15 minutes
respectively. Note that BZ time themselves won't be changed. It's meant for
testing and development.

## Response format

See `/js/bz.js` for an example.

```
{
  "bzbegin": [Unix timestamp of all BZ beginning hours for the next 2 days],
  "bzend": [Corresponding ending times],
  "bzon": "boolean. True if is BZ is on otherwise False",
  "bzendsat": "int. If BZ is on, give the Unix timestamp corresponding to the end of the current BZ, otherwise 0",
  "schbegin" => "arr. Scheduled begin times for each BZ. See the source for reference",
  "schend" => "arr. Scheduled end times for each BZ. See the source for reference",
}
```
