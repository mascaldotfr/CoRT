# Contributing

If you plan to bring code improvements:

0. The site should be *usable* despite obvious visual glitches with [Firefox 78](#why-using-firefox-78-as-a-baseline),
   and is expected to look as intended in the latest stable versions of major
   browsers (Chrome, Firefox, Edge, Safari, and on mobile as well). Keep that
   in mind for the frontend. At least check at https://caniuse.com/ .
1. Keep things simple:
  - Simple code may be slower but given the simplicity of
    the proposed tools there is no bottleneck, and i don't want them when
    maintaining
  - CoRT is vanilla JS, It will stay this way, because that
    code can work on a 2020 software stack and browser and will very likely
    work in a 2030 one, unlike frameworks that do breaking changes every year.
  - A CoRT installation should be easily movable, and should be run simply from
    its own directory, assuming PHP is working and has the necessary modules.
    It has even its own bundler for production (see
    `/deploy/release/create_release.py`) to not depends on ever changing
    bundlers and stuff.
  - At this point, you probably already got it, **CoRT is a long term project
    with no real hype, excepted high resilience.**
2. Keep the style consistent, even if sometimes it's gross like :
  - Snakecase (Python made me do this)
  - Not using dot notation for hashes (also python), excepted for string construction
  - I come from ES3. That's 1999; as such use of modern `const/let` is known to
    be flaky around the codebase as CoRT learnt me _modern_ JS, in the field.
    I'm correcting stuff as I need to change code, but don't touch what's
    working. I tend to use `const` for really read only objects and `let`
    otherwise, so anyway I'm not very orthodox.
3. Optionally use [JSHint](https://jshint.com/). Linux usage:
   ```shell
   cd /tmp
   npm install jshint
   cd node_modules/jshint
   echo '{ "esversion": 11, "sub": true }' > jshintrc
   ./bin/jshint -c jshintrc /where/is/CoRT/js/*.js
   ```

### Why using Firefox 78 as a baseline

The oldest browser a valid bug was reported against was Chrome 80
(`element.replaceChildren()` missing), so we've mostly up to date users, thanks
to browser updating themselves. But the baseline is born from it.

Firefox 78 (June 2020) was chosen because it was the minimal version of Firefox
supporting all the site features, and any bug report for a browser older than
that will be rejected.

You can use an old [Debian Live image which has already that version
preloaded](https://cdimage.debian.org/mirror/cdimage/archive/11.0.0-live/amd64/iso-hybrid/debian-live-11.0.0-amd64-xfce.iso)
in a virtual machine to test.

Note that this requirement will change over time, for example if TLS technology
changes and makes this version unable to connect to https sites.

### Commit hook for versioning in the footer

This is mostly a note to myself.

You can use that pre-commit hook in `/where/is/CoRT/.git/hooks/pre-commit` on
GNU coreutils based systems:

```shell
#!/bin/sh
# Get root of the repo work tree (allow the hook to work when committing in subfolders)
GIT_WORK_TREE="$(readlink -f "`dirname ${GIT_INDEX_FILE}`/..")"
version=`env TZ=UTC LANG=C date +%Y%m%d.%H%M%S`
sed -i -E 's/(<!--VERSION-->Version: ).+/\1'"${version}"'/' "${GIT_WORK_TREE}/js/menu.js"
git add "${GIT_WORK_TREE}/js/menu.js"
echo "Updated last commit date"
```

Don't forget to make it executable. This will update the version for each
commit, including non user facing changes.
