
> [!IMPORTANT]
> **CoRT is in maintenance mode: no new features will be added, only minor fixes or data updates. The site will stay up though.**
>
> **If you want to bring further developments to CoRT, see https://github.com/CoR-Forum/CoRT.**

# Champions of Regnum trainer (and more)

Since the famous regnumsentinel trainer is dead, all is left are operating
systems locked trainers, or the updated Inquisition trainer from the german
Regnum forum *(update: they ended up using this trainer instead)* but it has
some outdated mechanics.

This is a (simpler) knockoff of the regnumsentinel website trainer, this one
will be alive as long as GitHub exists and is open source software. On top of
that, there are countdown pages for bosses and BZ, WZ status and statistics.

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

## Hidden pages

* **[tstats.html](https://mascaldotfr.github.io/CoRT/tstats.html)** is CoRT's own
  Trainer statistics page. For more infos on why it's not the default, see
  [the collect README](collect/README.md#Javascript).
* **[beta.html](https://mascaldotfr.github.io/CoRT/beta.html)** is a part of the
  [upgrade cycle process](UPDATING.md).
* **[tests.html](https://mascaldotfr.github.io/CoRT/tests.html)** includes
  various tests to check if we don't (re)introduce well known bugs.

## License

   This repo is released under the terms of the GNU Affero General Public
   License v3.0.
   Some parts of the site are MIT licensed as exceptions, please see their
   header files.

### External assets

   The discipline/skill icons are the work of Nimble Giant
   Entertainement, and are used as fair use.

   [Chartist](https://github.com/chartist-js/chartist) is dual licensed under
   MIT/WTFPL licenses terms.

   [Tippy](https://github.com/atomiks/tippyjs),
   [Popper](https://github.com/floating-ui/floating-ui)
   and [LZstring](https://github.com/pieroxy/lz-string) are MIT licensed.

   The [Game icons set](https://game-icons.net/) is licensed
   under the CC-BY 3.0 license terms.

## Credits

* [Xia](https://github.com/xia) and Edward "[urkle](https://github.com/urkle)"
  Rudd, who wrote the first Inquisition trainer.
  [Anpu](https://github.com/Anpu) did a thing or two about it as well iirc.
* [Joshua2504](https://github.com/Joshua2504) and
  [Shaiko](https://github.com/Shaiko35) from https://cor-forum.de/ for keeping
  the spell database updated
* Slartibartfast, the regnumsentinel.com creator, site that gave me big hints about
  the UI should be done.
