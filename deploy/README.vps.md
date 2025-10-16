# Deploying CoRT on a VPS

This one is target at people very comfy with hosting things. This also roughly
how https://cort.thebus.top works. Unlike the other hosting docs, we're here
using the development version.

## At first, be patient

- WZ-related things should load within a minute with dummy events. That's
  normal.
- WZ stats will require a few days to even starting to be meaningful
- WZ full events logs are refreshed only after 24h if you made the mistake to
  not wait for the WZ status to be active and clicked the link!
- Trainer stats will require at least a full lvl 60 setup per class for the
  latest game version, and is refreshed only every 3 hours

If you want to test with really populated stuff and already installed CoRT,
download the following files and put them in `/api/var`:

- the WZ events db @ https://cort.thebus.top/api/var/events.sqlite and ensure
  it belongs to the `cort` user
- the trainer saved setups @
  https://cort.thebus.top/api/var/trainer_saved_setups.txt and ensure it
  belongs to the user running php (Debian: `www-data`)

## Docker example (to be used for non Docker install too)

> [!CAUTION]
> This example docker configuration is not recommended in production, but
> explains how to setup CoRT. It doesn't update itself automatically with new
> changes made to CoRT.

I have set up a basic docker container with everything needed in the `docker`
directory :

- a [Dockerfile](docker/Dockerfile) for all install related stuff from scratch.
  **It's also the best guide on how to setup CoRT without Docker.**
- a working configuration for caddy, including CORS stuff if the website and
  the API aren't on the same site.
- the necessary crontab magic

Once set up, you can access it at http://localhost:2810/CoRT

## Git stuff

Because all `*.html` file contains preload instructions for the official
server, you'll need to remove them.

As such, keep the `main` branch for upstream updates, and adapt them in your
`local` branch that will be *your* main branch.

You'll need either a crontab or do manual merging as well. Here is how I do for
https://cort.thebus.top.

### Initial setup

```shell
git clone https://github.com/mascaldotfr/CoRT.git
cd CoRT
# Move the original main branch to upstream
git branch -m main upstream
# Ensure the upstream is properly set
git branch --set-upstream-to=origin/main upstream
# Create a local branch (this is where your changes go)
git checkout -b local
```

### Do some changes

> [!CAUTION]
> You need to commit **any** change to the _local_ branch ASAP, or merging
> changes from _upstream_ will fail:

```shell
git checkout local
git add . && git commit -m "made a few local changes"
```

### Get updates from upstream

We need to be sure that the _local_ branch will used whatever happens, or the
original CoRT will be displayed instead. Hence the awkward line:

```shell
(git checkout upstream && git pull origin main || git checkout local) && git checkout local && git merge upstream --strategy-option ours --no-edit
```
See the merge strategy options at https://git-scm.com/docs/git-merge#Documentation/git-merge.txt-ours

I don't recommend to merge automatically through cron or systemd timers, since
you may need to do manual changes from time to time.

