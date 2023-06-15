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
outfile = "warstatus.txt"
status = {"forts": [], "gems": []}
realms = ["Alsius", "Ignis", "Syrtis"] # in site order for forts
realms_gem = ["Ignis", "Alsius", "Syrtis"] # in site order for gems

def main():
    with urlopen("https://championsofregnum.com/index.php?l=1&sec=3") as response:
        page = BeautifulSoup(response.read(), "html.parser")
        forts_names = []
        forts_icons = []

        headers = page.findAll("div", {"class" : "war-status-realm"})
        for realm in headers:
            for gem in realm.findAll("img"):
                status["gems"].append(gem.attrs["src"])

        icons = page.findAll("div", {"class" : "war-status-bulding-icons"})
        for icon_block in icons:
            for icon in icon_block.findAll("img"):
                forts_icons.append(icon.attrs["src"])

        names = page.findAll("div", {"class" : "war-status-bulding-name"})
        for name in names:
            forts_names.append(name.text)

        if len(status["gems"]) == 0 or len(forts_names) == 0 or len(forts_icons) == 0 :
            print("The output is wrong: " + str(status["gems"]) + str(forts_names) + \
                                            str(forts_icons), file=sys.stderr)
            sys.exit(1)

        i = 0
        for item in forts_names:
            owner = ''.join(os.path.normpath(forts_icons[i]).split("/")[-1:])
            owner = owner.replace("keep_", "")
            owner = owner.replace(".gif", "").capitalize()
            location = realms[int(i / 4)]
            status["forts"].append({ "name": forts_names[i], "location": location,
                                     "owner":owner, "icon":forts_icons[i] })
            i += 1

        warmap = page.find("div", {"id" : "war_map-box-content"})

        # XXX EVENTS XXX

        status["map_changed"] = False
        status["gems_changed"] = False
        old_status = {}
        events_log = []
        timestamp = int(datetime.now(timezone.utc).timestamp())

        if os.path.exists(outfile):
            with open(outfile, "r") as jsonfile:
                old_status = json.load(jsonfile)
                if "events_log" in old_status:
                    events_log = old_status["events_log"]
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
        i = 0
        for gem in status["gems"]:
            if "gems" not in old_status or (gem != old_status["gems"][i] and not "gem_0" in gem):
                status["gems_changed"] = True
                gem_location = ''.join(os.path.normpath(gem).split("/")[-1:])
                gem_location = gem_location.replace("gem_", "")
                gem_location = gem_location.replace(".png", "")
                gem_location = realms_gem[int(gem_location) - 1]
                gem_owner = realms[int(i / 6)]
                # Example with i=17 (Syrtis #2 gem owned by Syrtis)
                # 17 (global) - 12 (realm offset) = 5
                gem_number = "1" if i - (int(i / 6) * 6) <= 2 else "2"
                events_log.insert(0, { "date": timestamp, "name": gem_number,
                                      "location": gem_location, "owner": gem_owner,
                                      "type": "gem" })
            i += 1

        # Sort and store events
        events_log = sorted(events_log, key=lambda d: d["date"], reverse=True)
        status["events_log"] = events_log[:10]

        # Define map url
        if status["map_changed"]:
            # The extra timestamp parameter is made to cache bust the old map
            status["map_url"] = "https://championsofregnum.com/" + \
                warmap.contents[1].attrs["src"] + "?" + str(timestamp)
        else:
            status["map_url"] = old_status["map_url"]

        status["generated"] = str(timestamp)

        with open(outfile, "w") as jsonfile:
            json.dump(status, jsonfile)

main()
