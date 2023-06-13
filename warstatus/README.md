# WARSTATUS

There is no such things as an API for the war status, so that part has to be run server side for CoRT, due to NGE not allowing cross origin request ([CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)).

`warstatus.py` fetches the official war status page and dump the gems/forts status and map URLs in a file as JSON (see `outfile` in `warstatus.py`).

The output is meant to placed in a file reachable by a webserver. The format is straightforward: just the needed images URLs in the same order as NGE's page sorted by realm, the map url, and date/time of generation.

You can see it in action at https://hail.thebus.top/cortdata/warstatus.txt -- informations are refreshed every multiple of 2 minutes.
## Requirements

- Python 3 (with beautifulsoup4; `python3-bs4` in debian packages)
- A server running Linux (it will work on Windows through different means but I don't use it)
- A web server that is able to serve static files and where CORS is enabled (see https://enable-cors.org/server.html), unless you serve CoRT and this "API endpoint" (*ahem*) on the same domain

### Deployment

1. Put `warstatus.py` in some place on your server
2. Ensure that you have some place that is reachable by your web server that can be written by the user that will execute `warstatus.py`
3. Log in as this user, then edit their crontab:
	```
	crontab -e
	```
4. Add the following line:
	```
	*/2 * * * * /where/is/warstatus.py
	```

That's it.

### BUGS

The code is terrible, and so is the original webpage :P
