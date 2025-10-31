# BOSSES API

This page documents the bosses API endpoint, used by CoRT and CoRT-dc.

## URL

https://cort.thebus.top/api/bin/bosses/bosses.php

## Parameters

### `fake`

https://cort.thebus.top/api/bin/bosses/bosses.php?fake

If a `fake` parameter is provided, then the 3 standard bosses will respawn
every 3 minutes, at 1 minute from each others. It's meant for testing and
development.

## Response format

In JSON:

```
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
