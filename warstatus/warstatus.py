#!/usr/bin/env python3

from datetime import datetime, timezone
from collections import OrderedDict
import json
import sys
from urllib.request import urlopen

from bs4 import BeautifulSoup

# File where to dump the status
outfile = "warstatus.txt"
# same order as the site
status = OrderedDict({"Alsius" : {}, "Ignis" : {}, "Syrtis" : {}})

def realm_dispatch(values, itemsperrealm, itemtype):
    realms = list(status.keys())
    for realm in range(0, len(realms)):
        offset = realm * itemsperrealm
        status[realms[realm]][itemtype] = values[offset:offset+itemsperrealm]

def main():
    with urlopen("https://championsofregnum.com/index.php?l=1&sec=3") as response:
        page = BeautifulSoup(response.read(), "html.parser")

        headers = page.findAll("div", {"class" : "war-status-realm"})
        results = []
        for realm in headers:
            for gem in realm.findAll("img"):
                results.append(gem.attrs["src"])
        realm_dispatch(results, 6, "gems")

        forts_icons = page.findAll("div", {"class" : "war-status-bulding-icons"})
        results = []
        for icon_block in forts_icons:
            for icon in icon_block.findAll("img"):
                results.append(icon.attrs["src"])
        realm_dispatch(results, 4, "forts_icons")

        forts_name = page.findAll("div", {"class" : "war-status-bulding-name"})
        results = []
        for name in forts_name:
            results.append(name.text)
        realm_dispatch(results, 4, "forts_names")

        # Ensure that we don't output nothing
        for realm in status.keys():
            for item in status[realm]:
                if len(status[realm][item]) == 0:
                    print("The output is wrong: " + str(status[realm]), file=sys.stderr)
                    sys.exit(1)

        # All per realm stuff should end here

        now = datetime.now(timezone.utc)
        warmap = page.find("div", {"id" : "war_map-box-content"})
        # The extra timestamp parameter is made to cache bust the map
        status["map_url"] = "https://championsofregnum.com/" + warmap.contents[1].attrs["src"] \
                            + "?" + str(int(now.timestamp()))
        status["generated"] = str(now)

        with open(outfile, "w") as jsonfile:
            json.dump(status, jsonfile)

main()
