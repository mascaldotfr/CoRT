# Setup collector

`submit.php` is the source code for the setup collector. It receives a saved
setup through a HTTP POST request, and if it is valid, add a line in `data.txt`
in the same directory as the script itself, and returns an HTTP 200 code. If
the setup is invalid, then an HTTP 417 code is returned.

This is fully anonymized and only triggerred when using
https://mascaldotfr.github.io, unless you do the appropriate changes in the
source code (`submit.php` and `../js/api_url.js`)

The client code [can be found here](https://github.com/mascaldotfr/CoRT/commit/677a0c6cac5f265a5cf7719857bf2db9a1b483e1).

The dataset is available at: https://hail.thebus.top/CoRT/collect/data.txt

Unlike `/warstatus` written in python, the collector is written in PHP, because
it's easier to deploy for people having a standard PHP enabled webhosting.

## Deployment

- You need a PHP capable webserver and that's it. Put `submit.php` in some place on your server.
- The file is compressed to `data.txt.gz` at every run. This for people having
  static gzip compression enabled on their server (i let you google that as
  it's not mandatory but heavily recommended).
- In case you get a weird/hardened setup, don't forget to ensure that the user running
  php is allowed to write files in the same directory than `submit.php`.

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
directory. It is supposedly simple enough to understand.

### Javascript

A faster and leaner version of [Halvdan's trainer stat
page](https://poludnica.shinyapps.io/configs/) is available in this repository,
see [tstats.js](../js/tstats.js). You can check it out at https://mascaldotfr.github.io/CoRT/tstats.html.

Halv's page is still used by default because it has stats older than CoRT and
has more features, but i wanted to do an open source implementation of it.


