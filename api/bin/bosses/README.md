# BOSSES API

This page documents the bosses API, used by CoRT and CoRT-dc.

## URL

https://cort.thebus.top/api/bin/bosses/bosses.php

## Deployment

Make sur you enabled PHP on your web server

## Response format

In JSON:

```json
{
  "prev_spawn": {
    "evendim": "int. Unix timestamp of previous respawn",
	[... daen, tk, server]
  },
  "next_spawns": {
    "evendim": [
      "int. Unix timestamp of the 3 next respawns for each boss",
	  [... 2 other respawns]
    ],
	[... daen, tk, server]
  },
  "next_boss": "str. name of next boss",
  "next_boss_ts": "int. Unix timestamp of the next boss respawn"
}
```

### Implementation

See `/js/bosses.js` for an example.
