# Champions of Regnum trainer (and more)

Since the famous regnumsentinel trainer is dead, all is left are operating
systems locked trainers, or the updated Inquisition trainer from the german
Regnum forum *(update: they ended up using this trainer instead)* but it has
some outdated mechanics.

This is a (simpler) knockoff of the regnumsentinel website trainer, this one
will be alive as long as GitHub exists and is free software. On top of that,
there are countdown pages for bosses and battle zones (BZ).

It just requires a webserver serving static files to run, everything is run
client side.

## Known issues

* ~display on mobile devices is weird due to flex in the WM skill row. it's not
  easy to fix, as even regnumsentinel had the issue. Use your device in
  landscape mode if it really bothers you.~ *This is fixed on most devices.*
* shared urls are long, this could be fixed by using an url shortener api, but
  free plans may be quickly limit rated and they're not permanent. I don't want
  to have a database server, since it then would require a separate server and
  a domain, and could go down like regnumsentinel.

## Setting a local webserver

If you want to make changes to CoRT or run it locally, you can use python to
[create a temporary local webserver](https://developer.mozilla.org/en-US/docs/Learn/Common_questions/Tools_and_setup/set_up_a_local_testing_server#using_python).

## License

   This repo is released under the terms of the GNU Affero General Public
   License v3.0. The discipline/skill icons are the work of Nimble Giant
   Entertainement, and are used as fair use.

## Credits

* [Xia](https://github.com/xia) and Edward "[urkle](https://github.com/urkle)"
  Rudd, who wrote the first Inquisition trainer.
  [Anpu](https://github.com/Anpu) did a thing or two about it as well iirc.
* [Joshua2504](https://github.com/Joshua2504) and
  [Shaiko](https://github.com/Shaiko35) from https://cor-forum.de/ for keeping
  the spell database updated
* Slartibartfast, the regnumsentinel.com creator
