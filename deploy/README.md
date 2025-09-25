# Deploy CoRT

## No API

If you don't want to host the API just copy or `git clone` CoRT in a
preexisting webserver directory. You're done.

If you don't use the `CoRT` subdirectory, you may want to modify
`js/api_url.js`'s `__api__frontsite_dir` variable.

## With your own API stuff (you know what you're doing)

> [!NOTE]
> Warzone stuff will take time to populate, especially the stats parts!

Same thing as "No API", but on top of that, see the respective deployment
docs:

- [warstatus](../warstatus/README.md)
- [stats and events](../warstatus/stats/README.md) -- I recommend you to fetch
  my own database and not starting from scratch.
- [trainer setups stats](../collect/README.md)

### Git stuff

Because all `*.html` file contains preload instructions for the official
server, you'll need to remove them. Same thing for `../js/api_url.js`.

As such, keep the `main` branch for upstream updates, and adapt them in your
`local` branch that will be *your* main branch. YMMV, but if you got an example,
please PR what you did.

You'll need either a crontab or do manual merging as well.

### Docker example (you need a little more help after all...)

> [!CAUTION]
> This example docker configuration is not recommended in production, but gives
> many little details about CoRT's configuration.

I have set up a basic docker container with everything needed in the `docker`
directory :

- a Dockerfile for all install related stuff from scratch
- a working configuration for caddy
- the necessary crontab magic

You can access it at http://localhost:2810/CoRT
