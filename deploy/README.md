# Deploy CoRT

## Intro
Note that this documentation targets Unix-like systems (macOS, Linux, BSD
etc.). CoRT *should* run on Windows through XAMPP and by using the managed
webhosting guide using powershell or by hand, which is not detailed.

Also we're using the `1.35.19-2.0rc1` release through the doc for *managed* and
*noapi* setups, so you'll need to adapt to the latest release seen at
https://github.com/mascaldotfr/CoRT/releases/latest

## Index

There are 3 documented ways to install CoRT:

1. [Without API](README.noapi.md) -- very easy
2. [With API, on managed webhosting](README.managed.md) -- easy
3. [Docker, or any server](README.vps.md) -- advanced


## Updating CoRT

Invest some time to read
https://github.com/mascaldotfr/CoRT/wiki/CoRT-versioning to see wether it's
worth to fully upgrade, especially if your lazy.

In that *noapi* setup, it's pretty easy:

1. Prepare CoRT again
2. Put your updated version on your webserver
3. Delete the old CoRT
4. Rename the updated `CoRT-<version>` to `CoRT`

That's it.

