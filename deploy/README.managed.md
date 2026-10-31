# Deploy CoRT on managed webhosting (*managed*)

## Intro

In this README, you'll get details on how to deploy CoRT's frontend and API on
almost any managed webhoster. The free plan from https://www.planethoster.fr/
was used to illustrate this README.

Note that it's assumed you want to install CoRT in a `CoRT` subdirectory at
example.com.

## Webhoster requirements

- *Minutely cron jobs*, it's needed for WZ things. You just need one cron job.
  An alternative would be to tweak the CLI code to avoid HTTP 403 errors in
  `api/bin/warstatus/warstatus.php` and using a third party service that call
  the script (see https://cron-job.org/en/ for example).
- Providing access to *PHP 8+*, with the following modules: sqlite3, pdo,
  pdo\_sqlite, gzip; they're all pretty standard.
- Server specs or hosting plan don't really matter, as memory and CPU usage is
  very low. CoRT started on a VPS with only 512MB of ram and 2GB of disk.

### No need for composer!

While CoRT fetches PHP modules with composer, versioned release tarballs
already include dependencies, so you don't need composer. You also don't need
to tweak CoRT further, various things that only the official CoRT need have
been expurged.

## Get the latest release version

Check out https://codeberg.org/mascal/CoRT/releases and take note of the
version tag.

You can follow up releases with this ATOM feed:
https://codeberg.org/mascal/CoRT.rss, or just check out CoRT's
discord server (#cort-updates channel).

## Preparing CoRT

Run these commands or alternatively:

- checkout the [automated script](misc/managed_tarball)
- grab manually the latest **versioned** release and go to the next step

```shell
# Set this to the latest version
V=3.2.0
# Or instead use this if you have `jq` installed and want only stable releases
# V=`curl -X 'GET' \
#  'https://codeberg.org/api/v1/repos/mascal/CoRT/releases?draft=false&pre-release=false' \
#  -H 'accept: application/json' | jq -r '.[0].tag_name'`

cd /tmp

# Download and extract stuff
wget -qO- https://codeberg.org/mascal/CoRT/releases/download/${V}/CoRT-${V}.tar.gz | tar xvz

cd CoRT-${V}/api/var
touch maintenance.txt

# Create a tarball to upload to our webhoster, it's gonna be faster.
cd /tmp/CoRT-${V}

# Ensure we have a CoRT subdirectory in the final tarball. Quite obnoxious.
mkdir CoRT
mv * CoRT
tar cvzf /tmp/CoRT.tar.gz CoRT/*

# Clean up the working tree
cd /tmp
rm -rf CoRT-${V}
```

You now have a tarball at `/tmp/CoRT-<version>.tar.gz` containing everything
needed to serve the frontend and API.

## Uploading to your hosting provider

There is more than a way to do it, so let's just assume your hoster has a file manager.

Just upload the tarball and extract it in the web root directory of you website
(most often in the `public_html` directory). If you didn't use the script,
create an empty file named `maintenance.txt` in `CoRT/api/var`.

You can now visit https://example.com/CoRT/ and check out if everything is all
right.

## Setting a cronjob

This is the most annoying part.

You need to run `/api/bin/warstatus/warstatus.php` every minute; see your
hoster docs for that.

For example on my planethoster.fr testbed the command is:

```shell
php -q /home/my_username/public_html/CoRT/api/bin/warstatus/warstatus.php
```

You can't call `warstatus.php` as-is from outside (wget or browser), so call
directly php from the cli. Note that this behaviour is tweakable, but you gotta
change the source code.

## It's running

You have now your full stack CoRT, congrats!

## Updating CoRT

Invest some time to read
https://codeberg.org/mascal/CoRT/wiki/CoRT-versioning to see wether it's
worth to upgrade, especially if you're lazy.

### Use your own API data on upgrade

1. Get a CoRT tarball
2. Make a backup of the current `/CoRT/api/var` with your hoster file manager outside of `/CoRT`
3. Upload it to your hosting provider in the web root directory
4. Put your cronjob on monthly
5. Delete the old CoRT directory
6. Extract the tarball in the web root directory
7. Replace the `/CoRT/api/var` directory by your backup one
8. Don't forget to put your cronjob back to minutely!

