# WARSTATUS

There is no such things as an API for the war status, so that part has to be
run server side for CoRT, due to NGE not allowing cross origin request
([CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)).

`warstatus.py` fetches the official war status page and dump the gems/forts
status and map URLs in a file as JSON (see `outfile` in `warstatus.py`).

The output is meant to placed in a file reachable by a webserver.

You can see it in action at https://hail.thebus.top/cortdata/warstatus.txt --
informations are refreshed every minute.

## Requirements

- Python 3 (with beautifulsoup4; `python3-bs4` in debian packages)
- A server running Linux (it will work on Windows through different means but I don't use it)
- A web server that is able to serve static files and where CORS is enabled
  (see https://enable-cors.org/server.html), unless you serve CoRT and this
  "API endpoint" (*ahem*) on the same domain

## Deployment

1. Put `warstatus.py` in some place on your server
2. Ensure that you have some place that is reachable by your web server that
   can be written by the user that will execute `warstatus.py`
3. Log in as this user, then edit their crontab:
	```
	crontab -e
	```
4. Add the following line:
	```
	* * * * * /where/is/warstatus.py
	```

That's it.

## Response Format

It's advised to read /js/wz.js as well for exploitation.

```
{
    "forts": [ // forts in official site order
            {
                "name": "Fortication name (id) (ex: Castle Imperia (1))",
                "location": "Capitalised realm (ex: Alsius)",
                "owner": "Capitalised current owner of that for (ex: Syrtis)",
                "icon": "url to the fort icon"
            },
            [...11 other forts...]
    ],
    "gems": [ //gems in official site order, including the blank ones
            "url to the gem icon",
            [...17 other gems...]
    ],
    "map_url": "The current map URL with a parameter to bypass caching",
    "generated": "Unix timestamp representing the date and time when the response has been generated",
    "events_log": [ // The last 10 server events (fort and gem captures)
        {
            "date": "Unix timestamp",
            "name": "1 or 2, depending if it's the realm's first or second gem",
            "location": "Capitalised original realm of the gem (ex: Syrtis)",
            "owner": "Capitalised current owner realm of the gem (ex: Alsius)",
            "type": "It's either 'fort' or 'gem' depending on what is captured"
        },
        [... 24 other events...]
    ],
    map_changed: "boolean actually. Did the forts status changed since the last generation?",
    gem_changed: "same as map_changed, but for gems"
}
```

## BUGS

The code is terrible, and so is the original webpage :P
