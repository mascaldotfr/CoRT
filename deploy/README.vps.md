# Deploying CoRT on a VPS

This one is targeted at people very comfy with hosting things. This is also
roughly how https://cort.ovh works. Unlike the other hosting docs, we're
here using the development version.

It's quite advanced, and it's recommended to read that file once before
starting anything. You may want to follow [the *integrated* README](README.integrated.md) instead.

## At first, be patient if you start from scratch

- WZ-related things should load within a minute with dummy events. That's
  normal.
- WZ stats will require a few days to even starting to be meaningful
- WZ full events logs are refreshed only after 24h if you made the mistake to
  not wait for the WZ status to be active and clicked the link!
- Trainer stats will require at least a full lvl 60 setup per class for the
  latest game version, and is refreshed only every 3 hours

It's recommended to prepopulate with existing official API data. Read further
about that.

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

Once set up, you can access it at http://127.0.0.1:2810/CoRT

### API Prepopulation

By default, the docker image prepopulates itself with data from the official
API. If that behaviour isn't wanted, use instead:

```shell
PREPOPULATE=no docker compose up --build
```

## Git stuff

Keep the `main` branch for upstream updates, and adapt them in your
`local` branch that will be *your* main branch.

### Initial setup

```shell
git clone https://codeberg.org/mascal/CoRT.git
cd CoRT
# Create a local branch (this is where your changes go)
git checkout -b local
# Ensure the upstream is properly set
git branch --set-upstream-to=origin/main local
```

### Do some changes

> [!CAUTION]
> You need to commit **any** change to the _local_ branch ASAP, or merging
> changes from _main_ will fail:

```shell
git checkout local
git add . && git commit -m "made a few local changes"
```

### Get updates from upstream

We need to be sure that the _local_ branch will used whatever happens, or the
original CoRT will be displayed instead.

```shell
git fetch origin --tags --force; git checkout local; git merge origin/main --strategy-option ours --no-edit
```
See the merge strategy options at https://git-scm.com/docs/git-merge#Documentation/git-merge.txt-ours

I don't recommend to merge automatically through cron or systemd timers, since
you may need to do manual changes from time to time.

