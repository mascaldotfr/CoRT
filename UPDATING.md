# TRAINER UPDATE PROCESS

Upgrade cycle when balance changes are released by NGE. Note that doing the
change will require you to know how to operate a webserver to test, and doing
some minor changes in the source code. While not complicated, you still need to
know these basics.

## Doing a balance update

### Create a new version

Copy the newest version folder in `data` to a new version number.

### Change the trainer data

Modify with the new `trainerdata.json` in that new folder with the new balance changes.

### Change the icons

Icons size is 47px width x 48px height. The ratio hasn't been kept to deal with
some artifacts as there are different icon styles used by the game (square, rounded,
with or without black border).

**It's not recommended to re-edit the images from the older version**, due to the
quality loss it implies. Lossless icons for all skills are available in the
[CoRT Icons pack](https://github.com/mascaldotfr/CoRT/releases).

That pack also includes a python script to automatically refresh skills icons from
your edited `trainerdata.json`. Its usage is explained in the pack's README, and
is the **heavily recommended method**.

### Making the new version available on the website

Update the array containing all available versions in `js/trainer.js` with the
newest version last.

## The version 66 problem

I don't want to spread fear among people, because it won't happen, yet i can't
left you ignorant of that fact.

You can't have more than 66 datasets versions with the current short URL
format. In the unlikely case we hit that limit, the simplest solution is to use
an extra parameter, let's say `g` as generation and move the versions in a
multidimensional array.

In js/trainer.js:

```javascript
let trainerdataversions = [
    [66 oldest versions, ...],
    [x newer versions, ...]
];
```

Then assume in `$(document).ready(...)` that an undefined `g` is
`trainerdataserversions[0]`, otherwise it's `trainerdataserversions[g]`.

On top of that you'll need to change `save_setup_to_url()` to add that
parameter for future saved URLs.
