# Deply CoRT with no API (*noapi*)

## Requirement

A web server. That's it.

## Get the latest release version

Check out https://github.com/mascaldotfr/CoRT/releases/latest and take note of the
version tag.

You can follow up releases with this ATOM feed:
https://github.com/mascaldotfr/CoRT/releases.atom, or just check out CoRT's
discord server (#cort-updates channel).

## Prepare CoRT

Run these commands:

```shell
# set this to latest release !!
V=1.35.19-2.0rc1

# Set your domain name
D=example.com

cd /tmp

# Download and extract stuff
wget -qO- https://github.com/mascaldotfr/CoRT/archive/refs/tags/${V}.tar.gz | tar xvz

# Make your site use CoRT's "official" API instead of a local one
sed -i'' 's!\(.*let frontend_with_no_api =\) .*!\1 ["'${D}'"];!' CoRT-${V}/js/api_url.js
```

### Development version

Note that it's not recommended!

If you like a risky life, you can rework the lines above to use instead
https://github.com/mascaldotfr/CoRT/archive/refs/heads/main.tar.gz :)

## Install somewhere

You can now move and rename the prepared `/tmp/CoRT-<version>` wherever it's
fit.

## Updating CoRT

Invest some time to read
https://github.com/mascaldotfr/CoRT/wiki/CoRT-versioning to see wether it's
worth to upgrade, especially if your lazy.

In that *noapi* setup, it's pretty easy:

1. Prepare CoRT again
2. Put your updated version on your webserver
3. Delete the old CoRT
4. Rename the updated `CoRT-<version>` to `CoRT`

That's it.
