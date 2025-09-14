# Contributing

If you plan to bring code improvements:

0. The site should be *usable* despite obvious visual glitches with [Firefox 78](#why-using-firefox-78-as-a-baseline),
   and is expected to look as intended in the latest stable versions of major
   browsers (Chrome, Firefox, Edge, Safari, and on mobile as well). Keep that
   in mind for the frontend. At least check at https://caniuse.com/ .
1. Keep things simple; simple code may be slower but given the simplicity of
   the proposed tools there is no bottleneck, and i don't want them when
   maintaining.
2. Keep the style consistent, even if sometimes it's gross like not using dot
   notation for hashes.
3. Optionally use [JSHint](https://jshint.com/). Linux usage:
   ```shell
   cd /tmp
   npm install jshint
   cd node_modules/jshint
   echo '{ "esversion": 11, "sub": true }' > jshintrc
   ./bin/jshint -c jshintrc /where/is/CoRT/js/*.js
   ```
4. If you touch the python code, try to not adding extra modules as a dependency.

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

Don't forget to make it executable. This will update the versoin for each
commit, including non user facing changes.
