# WARSTATUS

There is no such things as a public API for the war status, so that part has to
be run server side for CoRT, due to NGE not allowing cross origin request
([CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)).

`warstatus.php` fetches the official war status page and dump the gems/forts
status in a file as JSON (see `outfile` in `warstatus.php`). It's used only
through the PHP CLI, it will return HTTP 403 if called through a browser.

You can see it in action at https://cort.ovh/api/var/warstatus.json --
informations are refreshed every minute.

The `stats` directory includes the code used to generate the WZ statistics, and
has its own README, but also needs `warstatus.php` to work in order to generate
statistics.

## Response Format

Note that the API is [static](https://www.seancdavis.com/posts/lets-talk-about-static-apis/).

Clearly the format has been optimized for display on the site and try to play
well with NGE inconsistent website code, sacrificing a bit of the consistency.


```
{
    "forts": [ // forts in official site order
            {
                "name": "Fortication name (id) (ex: Castle Imperia (1))",
                "location": "Capitalised realm (ex: Alsius)",
                "owner": "Capitalised current owner of that for (ex: Syrtis)",
                "icon": "icon filename"
            },
            [...11 other forts...]
    ],
    "gems": [ //gems in official site order, including the blank ones
            "icon filename",
            [...17 other gems...]
    ],
    "events_log": [ // The last 100 server events (fort, gem and relic captures, wish)
        {
            "date": "Unix timestamp",
            "name": "forts: fortification name | gem: gem number | relic: relic name | wish: empty",
            "location": "Capitalised original realm of the fort/gem/relic (ex: Syrtis), name of the wisher otherwise",
            "owner": "gem/fort: Capitalised current owner realm of the gem/fort (ex: Alsius)
                      relic: either 'transit' or 'altar'
                      wish: empty",
            "type": "It's either 'fort' or 'gem' or 'relic' or 'wish' depending on what is captured"
        },
        [...99 other events...]
    ],
    "relics": [ // The current relic status
        "Alsius": {
            "Imperia": null if in transit, else filename of the relic image,
            [...The 2 other relics...]
        },
        [...The 2 other realms...]
    ],
    map_changed: "boolean actually. Did the forts status changed since the last generation?",
    gems_changed: "same as map_changed, but for gems",
    relics_changed: "same as map_changed, but for relics",
    "generated": "Unix timestamp representing the date and time when the response has been generated",
    "failed": "If present, NGE's site is probably in bad shape because the data integrity is wrong
               This contains the debug infos."
}
```

## EXPLOITATION EXAMPLES

### Javascript

* See `../js/wz.js`

### Python

* See `./demos/ro_status.py`. It requires the "blessed" module to be installed. It
  displays all elements that you can find on the website but the map in a
  terminal in barely 100 lines of code.

## BUGS

The code is terrible, and so is the original webpage :P
