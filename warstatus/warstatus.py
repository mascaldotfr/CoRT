#!/usr/bin/env python3

# Copyright (c) 2023 mascal
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

from datetime import datetime, timezone
import json
import os
import sys
from urllib.request import urlopen

from bs4 import BeautifulSoup

# File where to dump the status
outfile = "warstatus.json"
base_url = "https://championsofregnum.com/"

# return just the filename part of the url
def filename(url):
	return url.split('/').pop();

def main():
    with urlopen("https://championsofregnum.com/index.php?l=1&sec=3") as response:
        failure = ""
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

        page = BeautifulSoup(response.read(), "html.parser")

        headers = page.findAll("div", {"class" : "war-status-realm"})
        i = 0
        for realm in headers:
            for gem in realm.findAll("img"):
                status["gems"].append(filename(gem.attrs["src"]))
            for relic in realm.next_sibling.next_sibling.findAll("img"):
                relic_name = relic.attrs["title"].split(" relic")[0]
                status["relics"][realms[i]][relic_name] = filename(relic.attrs["src"])
            i += 1
        if len(status["gems"]) != 18:
            failure += f'Fetching gems failed: {status["gems"]}'

        icons = page.findAll("div", {"class" : "war-status-bulding-icons"})
        for icon_block in icons:
            for icon in icon_block.findAll("img"):
                forts_icons.append(filename(icon.attrs["src"]))

        names = page.findAll("div", {"class" : "war-status-bulding-name"})
        for name in names:
            forts_names.append(name.text)

        i = 0
        for item in forts_names:
            owner = ''.join(os.path.normpath(forts_icons[i]).split("/")[-1:])
            owner = owner.replace("keep_", "")
            owner = owner.replace(".gif", "").capitalize()
            if owner not in realms:
                failure += f"Bad input: names => {forts_names} icons => {forts_icons}"
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
                    events_log = old_status["events_log"]

        # Fetching the data from NGE's website failed in a way or another. Bail out.
        if len(failure) != 0:
            status = old_status
            status["failed"] = failure
            with open(outfile, "w") as jsonfile:
                json.dump(status, jsonfile)
            sys.exit(1)

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

        # Sort and store events
        events_log = sorted(events_log, key=lambda d: d["date"], reverse=True)
        status["events_log"] = events_log[:25]

        status["generated"] = str(timestamp)

        with open(outfile, "w") as jsonfile:
            json.dump(status, jsonfile)

        # Make statistics non mandatory
        try:
            # Don't record stats if we're recovering from a NGE's page failure
            # Or if it's our first run
            if len(old_status) == 0 or "failed" in old_status:
                sys.exit(0)
            import stats.generate
        except Exception as e:
            print(e)
            sys.exit(1)
        stats.generate.statistics(status["events_log"])

main()
