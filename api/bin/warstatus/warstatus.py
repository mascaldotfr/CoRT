#!/usr/bin/env python3

# Copyright (c) 2022-2024 mascal
#
# CoRT is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# CoRT is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with CoRT.  If not, see <http://www.gnu.org/licenses/>.

import copy
from datetime import datetime, timezone
import gzip
import json
import os
import sys
import traceback
from urllib.request import urlopen

from bs4 import BeautifulSoup

os.chdir(os.path.dirname(os.path.abspath(__file__)))

# File where to dump the status, relative to this script
outfile = "../../var/warstatus.json"
stats_db_file = "../../var/events.sqlite"
stats_outfile = "../../var/statistics.json"
stats_outfile_events = "../../var/allevents.json"
base_url = "https://www.championsofregnum.com/"
# Use True to allow unconditional successful runtime for debugging
# It propagates to stats.generate as well
debug_mode = False

def eprint(*args, **kwargs):
    print(*args, file=sys.stderr, **kwargs)

# return just the filename part of the url
def filename(url):
	return url.split('/').pop();

def main():
    try:
        with urlopen(base_url + "/index.php?l=1&sec=3", timeout=10) as response:
            upstream_html = response.read()
    except Exception as e:
        eprint("Failed to fetch the page ! " + traceback.format_exc())
        sys.exit(1)

    failure = {}
    status = {"forts": [], "gems": []}
    status["relics"] = {
            "Alsius": { "Imperia": None, "Aggersborg": None, "Trelleborg": None },
            "Ignis": { "Shaanarid": None, "Samal": None, "Menirah": None },
            "Syrtis": { "Eferias": None, "Herbred": None, "Algaros": None }
            }
    realms = ["Alsius", "Ignis", "Syrtis"] # in site order for forts
    realms_gem = ["Ignis", "Alsius", "Syrtis"] # in site order for gems images (gem_X.png)
    forts_names = []
    forts_icons = []

    page = BeautifulSoup(upstream_html, "html.parser")

    headers = page.find_all("div", {"class" : "war-status-realm"})
    i = 0
    for realm in headers:
        for gem in realm.find_all("img"):
            status["gems"].append(filename(gem.attrs["src"]))
        for relic in realm.next_sibling.next_sibling.find_all("img"):
            relic_name = relic.attrs["title"].split(" relic")[0]
            status["relics"][realms[i]][relic_name] = filename(relic.attrs["src"])
        i += 1
    # We don't care about relics failing as they're not important
    if len(status["gems"]) != 18:
        failure["gems"] =  f'Fetching gems failed: {status["gems"]}'

    icons = page.find_all("div", {"class" : "war-status-bulding-icons"})
    for icon_block in icons:
        for icon in icon_block.find_all("img"):
            forts_icons.append(filename(icon.attrs["src"]))

    names = page.find_all("div", {"class" : "war-status-bulding-name"})
    for name in names:
        forts_names.append(name.text)

    i = 0
    for item in forts_names:
        owner = ''.join(os.path.normpath(forts_icons[i]).split("/")[-1:])
        owner = owner.replace("keep_", "")
        owner = owner.replace(".gif", "").capitalize()
        if owner not in realms:
            failure["forts"] = f"Bad fort input: names => {forts_names} icons => {forts_icons}"
        location = realms[int(i / 4)]
        status["forts"].append({ "name": forts_names[i], "location": location,
                                 "owner":owner, "icon":forts_icons[i] })
        i += 1

    # Keeping the official map just in case
    # warmap = page.find("div", {"id" : "war_map-box-content"})

    # XXX EVENTS XXX

    status["map_changed"] = False
    status["gems_changed"] = False
    status["relics_changed"] = False
    old_status = {}
    events_log = []
    timestamp = int(datetime.now(timezone.utc).timestamp())

    if os.path.exists(outfile):
        with open(outfile, "r") as jsonfile:
            old_status = json.load(jsonfile)
            if "events_log" in old_status:
                events_log = copy.deepcopy(old_status["events_log"])

    # Fetching the data from NGE's website failed in a way or another. Bail out.
    if len(failure) != 0:
        eprint("Parsing failure: " + str(failure))
        if "forts" in failure and "gems" in failure:
            status = old_status
            status["failed"] = {"status": "fatal", "debug": json.dumps(failure)}
            writer(json.dumps(status), outfile)
            if not debug_mode:
                sys.exit(1)
        elif not "forts" in failure:
            # At least display forts, as they're mostly always available
            status["failed"] = {"status": "partial", "debug": json.dumps(failure)}

    # Forts events
    i = 0
    for fort in status["forts"]:
        if "forts" not in old_status or fort["owner"] != old_status["forts"][i]["owner"]:
            status["map_changed"] = True
            events_log.insert(0, { "date": timestamp, "name": fort["name"],
                                   "location": fort["location"], "owner": fort["owner"],
                                   "type": "fort" })
        i += 1

    # Gem events
    recovered_gems = {}
    i = 0
    for gem in status["gems"]:
        if "gems" in failure:
            break
        if "gems" not in old_status or len(old_status["gems"]) == 0 \
           or (gem != old_status["gems"][i] and not "gem_0" in gem):
            status["gems_changed"] = True
            gem_location = gem.replace("gem_", "")
            gem_location = gem_location.replace(".png", "")
            gem_location = realms_gem[int(gem_location) - 1]
            gem_owner = realms[int(i / 6)]
            # Example with i=17 (Syrtis #2 gem owned by Syrtis)
            # 17 (global) - 12 (realm offset) = 5
            gem_number = "1" if i - (int(i / 6) * 6) <= 2 else "2"
            events_log.insert(0, { "date": timestamp, "name": gem_number,
                                  "location": gem_location, "owner": gem_owner,
                                  "type": "gem" })
            # Store the amount of gems recovered by realm (used for dragon wish)
            if gem_owner == gem_location:
                if gem_owner in recovered_gems:
                    recovered_gems[gem_owner] += int(gem_number)
                else:
                    recovered_gems[gem_owner] = int(gem_number)
        i += 1
    # Fetching the gem info from NGE's web site failed, keep the old one
    if "gems" in failure and "gems" in old_status:
            status["gems"] = old_status["gems"]

    # Estimate a dragon wish. If two realms recovered gems during the same minute
    wisher = ""
    if len(recovered_gems) == 2:
        realms_full_gem_recovery = 0
        # Then check if each concerned realm has recovered their 2 gems
        for realm in recovered_gems:
            if recovered_gems[realm] == 3:
                realms_full_gem_recovery += 1
        # If the two realms get all their gems back then deduce the wisher
        if realms_full_gem_recovery == 2:
            potential_wishers = realms
            for realm in potential_wishers.copy():
                if realm in recovered_gems:
                    potential_wishers.remove(realm)
            wisher = potential_wishers[0]
            # Record the wish, ensure it has the same structure as other
            # events So stats.generate does not fail
            events_log.insert(0, { "date": timestamp, "name": "",
                                  "location": wisher, "owner": "",
                                  "type": "wish" })

    # Relic events
    for realm in status["relics"]:
        # If gems are not parseable, usually so are relics
        if "gems" in failure:
            break
        for relic in status["relics"][realm]:
            new_relic = status["relics"][realm][relic]
            old_relic = None
            if "relics" in old_status:
                old_relic = old_status["relics"][realm][relic]
            if "relics" not in old_status or (old_relic != new_relic):
                status["relics_changed"] = True
                output = { "date": timestamp, "name": relic, "owner": realm,
                          "location": None, "type": "relic" }
                output["location"] = "altar" if old_relic == None else "transit"
                events_log.insert(0, output)
    # Fetching the relics info from NGE's web site failed, keep the old one
    # Currently if gems fail, so do the relics
    if "gems" in failure and "relics" in old_status:
            status["relics"] = old_status["relics"]

    # Bail out if nothing changed
    if ( not status["relics_changed"] and not status["map_changed"] \
         and not status["gems_changed"] ) and not debug_mode:
           sys.exit(0)
    # Bail out if 12 or more events are recorded at the same time (post
    # failure recovery that leads to malformed status on official page)
    if len(old_status) != 0 and \
       len(events_log) - len(old_status["events_log"]) >= 12:
        eprint("Messed up upstream HTML or server reboot, write nothing")
        if not debug_mode:
            sys.exit(1)

    # Sort and store events
    events_log = sorted(events_log, key=lambda d: d["date"], reverse=True)
    # Initialize all events on the first run
    if len(old_status) == 0:
        status["events_log"] = events_log
    else:
        status["events_log"] = events_log[:100]

    status["generated"] = str(timestamp)

    writer(json.dumps(status), outfile)

    # Make statistics non mandatory
    try:
        # If it's our first run, avoid bogus stats.
        if not debug_mode and len(old_status) == 0:
            sys.exit(0)
        import stats.generate
        st, ev = stats.generate.statistics(status["events_log"],
                                           stats_db_file,
                                           force_rewrite = debug_mode)
        writer(st, stats_outfile)
        writer(ev, stats_outfile_events)
    except Exception as e:
        eprint(traceback.format_exc())
        sys.exit(1)

def writer(data, fname):
    with open(fname, "w") as f:
        f.write(data)
    with gzip.open(fname + ".gz", "wb", compresslevel=2) as f:
        f.write(data.encode())


try:
    main()
except Exception as err:
    # NGE's site totally not available
    eprint(traceback.format_exc())
    # Keep old status to help recovery later
    old_status = {}
    if os.path.exists(outfile):
        with open(outfile, "r") as jsonfile:
            old_status = json.load(jsonfile)
            # Don't rewrite every minute to allow caching if the error is still
            # the same
            if "failed" in old_status and old_status["failed"]["debug"] == str(err):
                sys.exit(1)
    old_status["failed"] = {"status": "fatal", "debug": json.dumps(str(err))}
    writer(json.dumps(old_status), outfile)

