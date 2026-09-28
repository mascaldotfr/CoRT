# Contributing

**CoRT is a long-term project: no hype, just high resilience.**

If you plan to bring code improvements:

0. The site should be *usable* despite obvious visual glitches with [Firefox 78](#why-using-firefox-78-as-a-baseline),
   and is expected to look as intended in the latest stable versions of major
   browsers (Desktop/Mobile). Keep that in mind for the frontend.
1. Keep things simple:
    - Simple code may be slower, but given the simplicity of the tools, there
      is no bottleneck. I prioritize maintainability over micro-optimizations.
    - CoRT is vanilla JS, and will stay that way. What worked in 2022 when the
      project started will probably still work in 2032, unlike ever-changing
      frameworks.
    - A CoRT installation should be easily movable and run simply from its own
      directory, assuming PHP is working and has the necessary modules.
    - CoRT uses Vite (v5, chosen for its stability and baseline support) only
      for production builds. No build step is required for development or local
      deployment.
2. Keep the style consistent, even if sometimes it's gross like :
    - Snakecase (Python made me do this)
    - Not using dot notation for hashes (also python), except for string
      construction
    - I come from ES3. That's 1999; as such use of modern `const/let` is known
      to be flaky around the codebase as CoRT taught me _modern_ JS, in the
      field.

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
