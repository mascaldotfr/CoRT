# Contributing

If you plan to bring code improvements:

0. The site should be *usable* despite obvious visual glitches with [Firefox 60](#why-using-firefox-60-as-a-baseline),
   and is expected to look as intended in the latest stable versions of major
   browsers (Chrome, Firefox, Edge, Safari, and on mobile as well). Keep that
   in mind for the frontend. At least check at https://caniuse.com/ .
1. Keep things simple; simple code may be slower but given the simplicity of
   the proposed tools there is no bottleneck, and i don't want them when
   maintaining.
2. Keep the style consistent, even if sometimes it's gross like not using dot
   notation for hashes.
3. The javascript used in CoRT must follow ECMAScript <= 8, please use
   [JSHint](https://jshint.com/) to check this out, or mention
   you didn't. Linux usage:
   ```shell
   cd /tmp
   npm install jshint
   cd node_modules/jshint
   echo '{ "esversion"     : 8 }' > jshintrc
   ./jshint -c jshintrc /where/is/CoRT/js/*.js | grep esversion
   # Should return nothing
   ```
4. If you touch the python code, try to not adding extra modules as a dependency.

### Why using Firefox 60 as a baseline

The oldest browser a valid bug was reported against was Chrome 80
(`element.replaceChildren()` missing), so we've mostly up to date users, thanks
to browser updating themselves. But the baseline is born from it.

Actually the site works even with Firefox 52 (XP/Vista), minus the charts. As
such, Firefox 60 (May 2018) was chosen because it was the closest ESR version
to 52 supporting the charts, and any bug report for a browser older than that
will be rejected.

You can use an old [Debian Live image which has already that version
preloaded](https://cdimage.debian.org/cdimage/archive/9.7.0-live/amd64/iso-hybrid/debian-live-9.7.0-amd64-xfce.iso)
in a virtual machine to test.

Note that this requirement will change over time, for example if TLS technology
changes and makes this version unable to connect to https sites.

