# Champions of Regnum trainer (and more)

Since the famous regnumsentinel trainer is dead, all is left are operating
systems locked trainers, or the updated Inquisition trainer from the german
Regnum forum *(update: they ended up using this trainer instead)* but it has
some outdated mechanics.

This is a (simpler) knockoff of the regnumsentinel website trainer, this one
will be alive as long as GitHub exists and is free software. On top of that,
there are countdown pages for bosses, BZ and WZ statuses, and statistics.

The website just requires a webserver serving static files to run, everything
is run client side, with the exception of the WZ status and statistics (see the
`warstatus` directory) that can partly be replaced by a link to NGE's official
page, and anonymous setup collection (see the `collect` directory) which by
default only works for https://mascaldotfr.github.io and can be completely
skipped.

## Known issues

* ~display on mobile devices is weird due to flex in the WM skill row. it's not
  easy to fix, as even regnumsentinel had the issue. Use your device in
  landscape mode if it really bothers you.~ *This is fixed on most devices.*
* shared urls are long, this could be fixed by using an url shortener api, but
  free plans may be quickly limit rated and they're not permanent. I don't want
  to have a database server, since it then would require a separate server and
  a domain for such a feature, that could go down like regnumsentinel.

## Setting a local webserver

If you want to make changes to CoRT or run it locally, you can use python to
[create a temporary local webserver](https://developer.mozilla.org/en-US/docs/Learn/Common_questions/Tools_and_setup/set_up_a_local_testing_server#using_python).

## License

   This repo is released under the terms of the GNU Affero General Public
   License v3.0. The discipline/skill icons are the work of Nimble Giant
   Entertainement, and are used as fair use.

   Some parts of the site are MIT licensed as exceptions, please see their
   header files.

## Contributing

If you plan to bring code improvements:

0. The site should be *usable* despite obvious visual glitches with Firefox 52 (0),
   keep that in mind for the frontend, even if these requirements
   may change in the future. At least check at https://caniuse.com/ (1)
   I'll fix things if you struggle or didn't notice.
1. Keep things simple; simple code may be slower but given the simplicity of
   the proposed tools there is no bottleneck, and i don't want them when
   maintaining.
2. Keep the style consistent, even if sometimes it's gross like not using dot
   notation for hashes.
3. Javascript ecmascript version must not be greater than 8, please use
   [JSHint](https://jshint.com/install/) to check this out, or mention
   you didn't. Please avoid big polyfills the best you can. Linux usage:
   ```shell
   cd /tmp
   npm install jshint
   cd node_modules/jshint
   echo '{ "esversion"     : 8 }' > jshintrc
   ./jshint -c jshintrc /where/is/CoRT/js/*.js | grep esversion
   # Should return nothing
   ```
4. If you touch the python code, try to not adding extra modules as a dependency.

(0) Why this specific version and browser? This is the oldest version
supporting JS async functions, Chrome implement things earlier, and it works
under XP and Vista, avoiding IE polyfills, making it work almost everywhere.
Actually the trainer `<dialog>` is not displaying well and it's considered
acceptable to the point i don't want to add a 28kb polyfill. The oldest browser
a bug was reported against was Chrome 80 by the way (replaceChildren missing)
in 9 monthes, so we've mostly up to date users.

(1) You can also test by installing Win XP in a virtual machine, or use an old
   [Debian Live image which has already that version preloaded](https://cdimage.debian.org/cdimage/archive/9.2.0-live/amd64/iso-hybrid/debian-live-9.2.0-amd64-xfce.iso) in a virtual machine as well.

## Credits

* [Xia](https://github.com/xia) and Edward "[urkle](https://github.com/urkle)"
  Rudd, who wrote the first Inquisition trainer.
  [Anpu](https://github.com/Anpu) did a thing or two about it as well iirc.
* [Joshua2504](https://github.com/Joshua2504) and
  [Shaiko](https://github.com/Shaiko35) from https://cor-forum.de/ for keeping
  the spell database updated
* Slartibartfast, the regnumsentinel.com creator
