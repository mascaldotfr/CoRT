# Deply CoRT with no API (*noapi*)

## Requirement

A web server. That's it.

## Get the latest release version

Check out https://codeberg.org/mascal/CoRT/releases and take note of the
version tag.

You can follow up releases with this ATOM feed:
https://codeberg.org/mascal/CoRT.rss, or just check out CoRT's
discord server (#cort-updates channel).

## Prepare CoRT

Run these commands (you can also checkout [this script](misc/noapi_auto) if you
want to automate it):

```shell
# Set this to the latest version
V=3.2.0
# Or instead use this if you have `jq` installed and want only stable releases
# V=`curl -X 'GET' \
#  'https://codeberg.org/api/v1/repos/mascal/CoRT/releases?draft=false&pre-release=false' \
#  -H 'accept: application/json' | jq -r '.[0].tag_name'`

cd /tmp
# Download and extract stuff
# Since it's *noapi* exclude API and PHP dependencies
wget -qO-  https://codeberg.org/mascal/CoRT/releases/download/${V}/CoRT-${V}.tar.gz | tar xz \
	--exclude "api" --exclude "vendor"

# Make your site use CoRT's "official" API instead of a local one. If you plan
to run CoRT on http://localhost, you don't need to do that.
# Set your domain name
D=example.com
sed -i'' 's!\(.*let frontend_with_no_api =\) .*!\1 ["'${D}'"];!' CoRT-${V}/js/libs/cortlibs.js
```

### Development version

Note that it's not recommended!

If you like a risky life, you can rework the lines above to use instead
https://codeberg.org/mascal/CoRT/archive/main.tar.gz ;)

## Install somewhere

You can now move and rename the prepared `/tmp/CoRT-<version>` wherever it's
fit.

## Updating CoRT

Invest some time to read
https://codeberg.org/mascal/CoRT/wiki/CoRT-versioning to see wether it's
worth to upgrade, especially if your lazy.

In that *noapi* setup, it's pretty easy:

1. Prepare CoRT again
2. Put your updated version on your webserver
3. Delete the old CoRT
4. Rename the updated `CoRT-<version>` to `CoRT`

That's it.
