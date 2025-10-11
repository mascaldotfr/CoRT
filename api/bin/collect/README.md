# Setup collector

`submit.php` is the source code for the setup collector. It receives a saved
setup through a HTTP POST request, and if it is "valid", add a line in
`../var/trainer_saved_setups.txt` , and returns an HTTP 200 code. If the setup
is invalid, then a HTTP 417 code is returned.

This is fully anonymized and only triggerred when using
https://mascaldotfr.github.io, unless you do the appropriate changes in the
source code (`submit.php` and `../../js/api_url.js`)

The dataset is available
[there](https://cort.thebus.top/api/var/trainer_saved_setups.txt)

Statistics are already generated for use by CoRT and are publicly available at
https://cort.thebus.top/api/bin/collect/trainer_stats.php

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
