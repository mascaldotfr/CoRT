# Deploy CoRT

## Intro

Note that this documentation targets Unix-like systems (macOS, Linux, BSD
etc.). CoRT's frontend and API can run locally on Windows 11 through XAMPP, but
it's not detailed due to the added complexity.

Also we're using the `3.2.0` release through the doc for *managed*,
*integrated* and *noapi* setups, so you'll need to adapt to the latest release
seen at https://codeberg.org/mascal/CoRT/releases

## Index

There are several documented ways to install CoRT:

1. [Without API](README.noapi.md) -- not recommended, very easy but not very performing
2. [With API, on managed webhosting](README.managed.md) -- easy
3. [With API, integrated in an already running server](README.integrated.md) -- intermediate
4. [With API using Docker, or any new server](README.vps.md) -- advanced, use development version by default

## Releasing and production

In [this document](release/README.md) is detailed how the release and
production tarballs are created. If one day you need to take over from me,
read this.

That's quite my room to be honest...

Deployment of the fully optimized production tarball (minified, optimized, with
CSS fused) for https://cort.ovh is not documented since it's up to anyone
deploying it. What I do personally is the following:

1. Generate the production tarball
2. Extract it in a temporary directory
3. `rsync` that temporary directory with the live directory but excluding the `api/var/` subdirectory

You could use as well a variant of the *integrated* tutorial mentioned above.

