# Integrate CoRT in an already existing server (*integrated*)

So you've an already existing VPS or fully fledged server and want to put CoRT
on it!

Technically, this kind of installation is the [managed one](README.managed.md)
with a dash of [VPS install](README.vps.md).

Target system is Debian where php runs as `www-data`, and the web root is
`/var/www/html`. sudo is installed. YMMV anyway depending on how much your
harden things.

**You can follow the [managed one](README.managed.md), only the preparation and
crontab part change.**

## Preparation and install

1. Ensure all dependencies are installed. For that, check out the [Dockerfile](docker/Dockerfile).
2. Since we don't need a tarball, it's a tad simpler:

```shell
# Set this to the latest version
V=1.35.19-2.0rc1

cd /tmp

# Download and extract stuff
wget -qO- https://github.com/mascaldotfr/CoRT/releases/download/${V}/CoRT-${V}.tar.gz | tar xvz

# Prepopulate with official API stuff
cd CoRT-${V}/api/var
wget https://cort.thebus.top/api/var/trainer_saved_setups.txt
wget https://cort.thebus.top/api/var/events.sqlite
wget https://cort.thebus.top/api/var/warstatus.json
wget https://cort.thebus.top/api/var/statistics.json
wget https://cort.thebus.top/api/var/allevents.json

sudo mv /tmp/CoRT-${V} /var/www/html/CoRT
sudo chown www-data:www-data /var/www/html/CoRT
```

## Crontab

As root, we let run the warstatus fetcher as `www-data`:

```shell
echo '* * * * * 	www-data php /var/www/html/CoRT/api/bin/warstatus/warstatus.php' > /etc/cron.d/cort-cron
chmod 0644  /etc/cron.d/cort-cron
```

All the rest don't change.
