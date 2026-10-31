# Deploy CoRT

## Intro

Note that this documentation targets Unix-like systems (macOS, Linux, BSD
etc.). Commands and script can be converted to powershell for Windows users.

CoRT's frontend and API can run locally on Windows 11 through XAMPP, but
it's not detailed due to the added complexity.


Also we're using the `3.2.0` release through the doc for *managed*,
*integrated* and *noapi* setups, so you'll need to adapt to the latest release
seen at https://codeberg.org/mascal/CoRT/releases

## Index

There are several documented ways to install CoRT:

*Installing witout API is no more supported, but the trainer will still be available*

1. [With API, on managed webhosting](README.managed.md) -- easy, doesn't need to setup a server
2. [With API, integrated in an already running server](README.integrated.md) -- intermediate
3. [With API using Docker, or any new server](README.vps.md) -- advanced if you want to tweak CoRT, it uses the development version by default

## Releasing and production

*That's quite my room to be honest...*

In [this document](release/README.md) is detailed how the release and
production tarballs are created. If one day you need to take over from me,
read this.

Deployment of the fully optimized production distribution (minified, optimized, with
CSS fused) for https://cort.ovh is not documented since it's up to anyone
deploying it. What I do personally is the following:

1. Do the stuff mentioned in [the production README](production/README.md), reading the Vite config in `production/` may help!!!
2. `rsync` the `dist` temporary directory with the live directory but excluding the `api/var/` subdirectory

You could use as well a variant of the *integrated* tutorial mentioned above.
