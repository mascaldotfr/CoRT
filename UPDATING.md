# UPDATE PROCESS


## TRAINER

Upgrade cycle when balance changes are released by NGE. Note that doing the
change will require you to know how to operate a webserver to test, and doing
some minor changes in the source code. While not complicated, you still need to
know these basics.

### Doing a balance update

There are shorter ways to do so, but this way you can update a new trainer
dataset beta after beta, until the final release, making 0-day releases of the
live version without spending a lot of time on the said release day.

#### Create a new version

As soon as the first beta/rc is released, remove the `data/beta` directory and
copy the newest version folder to `data/beta` (called "beta folder" later).

#### Change the trainer data

Modify the new `trainerdata.json` in the beta folder with the new balance
changes in [#experimental](https://discord.com/channels/542061814704373782/542403024417456138).

Until the final release is live, you can checkout `beta.html` to test things
out, beta after beta.

#### Change the icons

Icons size is 47px width x 48px height. The ratio hasn't been kept to deal with
some artifacts as there are different icon styles used by the game (square, rounded,
with or without black border).

**It's not recommended to re-edit the images from the older version**, due to the
quality loss it implies. Lossless icons for all skills are available in the
[CoRT Icons pack](https://github.com/mascaldotfr/CoRT/releases).

That pack also includes a python script to automatically refresh skills icons from
your edited `trainerdata.json`. Its usage is explained in the pack's README, and
is the **heavily recommended method**.

#### Making the new version available on the website once the new version is live

Copy the beta folder to `data/trainer/1.x.x` according to the new version number.

Update the array containing all available versions in
`js/trainertools/constants.js` with the newest version last.

That's it.


## BOSSES

It's very important to check out bosses respawns at least every 3 months, as
the respawn time is slowly drifting in the future.

Updating the bosses requires to change `js\bosses.js` with a Unix timestamp
corresponding to the observated boss respawn.

If you run MacOS or Linux, run this in a Terminal while waiting for the boss
and press `Ctrl-C` when you see it. The last number is the good Unix timestamp:

```shell
while :; do date +%s; sleep 1; done
```

Alternatively, you can check out [this website](https://time.is/Unix_time) but
you can't stop the counter.

### Speculative time fixing

> [!CAUTION]
> This assumes that respawn times drifting is linear, something that I can't
> confirm.

You can try to compensate the drifting with a single boss respawn by adding the
difference between the real respawn and estimated respawn to the 2 other
bosses. Press F12 in your browser on the CoRT bosses pages to get the estimated
respawn timestamp.
