# BOSSES API

This page documents the bosses API endpoint, used by CoRT and CoRT-dc.

## URL

https://cort.ovh/api/bin/bosses/bosses.php

## Parameters

### `fake`

https://cort.ovh/api/bin/bosses/bosses.php?fake

If a `fake` parameter is provided, then Daen and Evendim will respawn every 30
minutes, at 15 minutes from each other. TK and server won't be available. It's
meant for testing and development.

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
      "int. Unix timestamp of the 4 next respawns for each boss",
	  [... 3 other respawns]
    ],
	[... daen, tk, server]
  },
  "next_boss": "str. name of next boss",
  "next_boss_ts": "int. Unix timestamp of the next boss respawn"
}
```

### Implementation

See `/js/bosses.js` for an example.
