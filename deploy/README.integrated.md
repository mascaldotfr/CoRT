# Integrate CoRT in an already existing server (*integrated*)

So you've an already existing VPS or fully fledged server and want to put CoRT
on it!

Technically, this kind of installation is the [managed one](README.managed.md)
with a dash of [VPS install](README.vps.md).

Target system is Debian where php runs as `www-data`, and the web root is
`/var/www/html`. `sudo` is installed. YMMV anyway depending on how much your
harden things.

**You can follow the [managed one](README.managed.md), only the preparation and
crontab part change.**

## Preparation and install

1. Ensure all PHP dependencies are installed. For that, check out the
   [Dockerfile](docker/Dockerfile) for all `php` packages.
2. Since we don't need a tarball, it's a tad simpler:

```shell
# Set this to the latest version
V=3.2.0
# Or instead use this if you have `jq` installed and want only stable releases
# V=`curl -s -X 'GET' \
#  'https://codeberg.org/api/v1/repos/mascal/CoRT/releases?draft=false&pre-release=false' \
#  -H 'accept: application/json' | jq -r '.[0].tag_name'`

cd /tmp

# Download and extract stuff
wget -qO- https://codeberg.org/mascal/CoRT/releases/download/${V}/CoRT-${V}.tar.gz | tar xvz

# Prepopulate with official API stuff
cd CoRT-${V}/api/var
wget    https://cort.ovh/api/var/trainer_saved_setups.txt \
        https://cort.ovh/api/var/events.sqlite \
        https://cort.ovh/api/var/warstatus.json \
        https://cort.ovh/api/var/statistics.json \
        https://cort.ovh/api/var/allevents.json
touch maintenance.txt

sudo mv /tmp/CoRT-${V} /var/www/html/CoRT
# Actually only /var/www/html/CoRT/api/var would need that but heh ...
sudo chown -R www-data:www-data /var/www/html/CoRT
```

## Crontab

As root, we let run the warstatus fetcher as `www-data`:

```shell
echo '* * * * * 	www-data php /var/www/html/CoRT/api/bin/warstatus/warstatus.php' > /etc/cron.d/cort-cron
chmod 0644  /etc/cron.d/cort-cron
```

All the rest don't change.
