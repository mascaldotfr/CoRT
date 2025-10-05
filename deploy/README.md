# Deploy CoRT

## No API

If you don't want to host the API just copy or `git clone` CoRT in a
preexisting webserver directory. You're done.

## With your own API stuff (you know what you're doing)

> [!NOTE]
> Warzone stuff will take time to populate, especially the stats parts!

Same thing as "No API", but on top of that, see the respective deployment
docs:

- [warstatus](../api/bin/warstatus/README.md)
- [stats and events](../api/bin/warstatus/stats/README.md) -- I recommend you to fetch
  my own database and not starting from scratch.
- [trainer setups stats](..api/bin/collect/README.md)

Also ensure PHP is activated on your server, so bosses and BZ are populated.

### Git stuff

Because all `*.html` file contains preload instructions for the official
server, you'll need to remove them. Same thing for `../js/api_url.js`.

As such, keep the `main` branch for upstream updates, and adapt them in your
`local` branch that will be *your* main branch.

You'll need either a crontab or do manual merging as well. Here is how I do for
https://cort.thebus.top.

#### Initial setup

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

#### Do some changes

> [!CAUTION]
> You need to commit **any** change to the _local_ branch ASAP, or merging
> changes from _upstream_ will fail:

```shell
git checkout local
git add . && git commit -m "made a few local changes"
```

#### Get updates from upstream

We need to be sure that the _local_ branch will used whatever happens, or the
original CoRT will be displayed instead. Hence the awkward line:

```shell
(git checkout upstream && git pull origin main || git checkout local) && git checkout local && git merge upstream --strategy-option ours --no-edit
```
See the merge strategy options at https://git-scm.com/docs/git-merge#Documentation/git-merge.txt-ours

> [!CAUTION]
> If you automate it through `cron` or `systemd` timers, you may have a garbled
> website from time to time, depending how big are your local changes, and as
> such manual fixing will be required. Don't forget to use
> `/bin/sh -c '(git checkout ....)'` as well!

### Docker example (you need a little more help after all...)

> [!CAUTION]
> This example docker configuration is not recommended in production, but gives
> many little details about CoRT's configuration. It doesn't update itself
> automatically with new changes made to CoRT.

I have set up a basic docker container with everything needed in the `docker`
directory :

- a Dockerfile for all install related stuff from scratch
- a working configuration for caddy
- the necessary crontab magic

Once set up, you can access it at http://localhost:2810/CoRT

Some features like trainer stats or WZ data dumps will require you to run the
container until at least 6am the next day.
