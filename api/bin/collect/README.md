# Setup collector

`submit.php` is the source code for the setup collector. It receives a saved
setup through a HTTP POST request, and if it is "valid", add a line in
`../var/trainer_saved_setups.txt` , and returns an HTTP 200 code. If the setup
is invalid, then a HTTP 417 code is returned.

This is fully anonymized and only triggerred when using
https://mascaldotfr.github.io, unless you do the appropriate changes in the
source code (`submit.php` and `../../js/api_url.js`)

The client code [can be found here](https://github.com/mascaldotfr/CoRT/commit/677a0c6cac5f265a5cf7719857bf2db9a1b483e1).

The dataset is available [there](https://cort.thebus.top/api/var/trainer_saved_setups.txt)

Unlike `/api/warstatus` written in python, the collector is written in PHP, because
it's easier to deploy for people having a standard PHP enabled webhosting.

## Deployment

### Collector

- You need a PHP capable webserver and that's it. Put `submit.php` in some place on your server.
- The file is compressed to `../var/trainer_saved_setups.txt.gz` at every run.
  This is for people having static gzip compression enabled on their server (i
  let you google that as it's not mandatory but heavily recommended).
- In case you get a weird/hardened setup, don't forget to ensure that the user running
  php is allowed to write files in `../var/`.

### API

In order to display the trainer stats, you need to setup the API. It only
requires php, without further modules. The default output is to
`../var/trainerstats.json`. To make it run:

1. Log in as the user running CoRT things, then edit their crontab:
	```
	crontab -e
	```
2. Add the following line to make it run every 3 hours for exemple:
	```
	0 */3 * * * cd /where/is/CoRT/api/bin/collect && php trainer_stats.php
	```
3. Modify `../../js/api_url.js` with your own url

Official URL: https://cort.thebus.top/api/var/trainerstats.json

## Data exploitation

Note that this requires accessing the trainerdata sets on this repository,
because your exploitation code will require to sideload them.

Usage of multiple threads for parsing the same record will not work, but you
can use them for parsing multiple records in parallel, each in their own
thread/coroutine.

### Format

Each record is one line long, terminated with a newline, with fields separated
with spaces.

### Fields:

- **0**: the trainerdata version used
- **1**: the chosen class
- **2**: the chosen level (level 61 is for the Red Necromantic Crystal)
- **3 and later**: Trees order is the same as the website. trees are read
                   sequentially, in json order.
    - Odd indexes: skilltree level
    - Even indexes: concatenation of each skill powerpoints on 1 digit

## Implementations

### Python

A simple python exploit code can be found at [exploit.py](exploit.py) in this
directory. It is supposedly simple enough to understand. See also
[trainer_stats.py](trainer_stats.py) for the API code.

### Javascript

Pre-API [tstats.js](https://github.com/mascaldotfr/CoRT/blob/154b8cf8aea81fe9b3dc2c9a44c3fdc6b5fa2741/js/tstats.js).
