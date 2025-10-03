#!/usr/bin/env python3

# Show the war status and latest events in a terminal
# Requires the "blessed" python module (python3-blessed)
# Press ctrl+c to quit

from datetime import datetime as dt
import json
import re
import time
from urllib.request import urlopen

from blessed import Terminal
t = Terminal()

# Remove fortifications numbers
def remove_fort_nr(string):
    return re.sub(r" \(\d+\)$", "", string)

def format_item(string):
    realm = t.cyan
    string = remove_fort_nr(string)
    if re.search(r"(Ignis|Sam|Sha|Men)", string):
        realm = t.red
    elif re.search(r"(Syrtis|Her|Efe|Alg)", string):
        realm = t.green
    if re.search(r"(Great Wall)", string):
        realm = t.underline + realm
    return f"""{t.bold}{realm}{string}{t.normal}"""

def main():
        print(t.clear())
        with t.cbreak(), t.hidden_cursor(), t.fullscreen():
            while True:
                with urlopen("https://cort.thebus.top/api/var/warstatus.json") as response:
                    messages = []
                    data = json.loads(response.read())

                    """ LAST EVENTS """
                    for event in data["events_log"][:24]:
                        timedate = dt.fromtimestamp(event["date"]).strftime("[%d/%m %H:%M]")
                        if event["type"] in ("gem", "fort"):
                            captured = "captured"
                            if event["type"] == "gem":
                                event["name"] = f"""{event["location"]}'s gem #{event["name"]}"""
                            if event["owner"] == event["location"]:
                                captured = "recovered"
                            owner = format_item(event["owner"])
                            name = format_item(event["name"])
                            messages.append(f"""{timedate} {owner} has {captured} {name}""")
                        elif event["type"] == "relic":
                            location = "back in its altar"
                            if event["location"] != "altar":
                                location = "in transit"
                            name = format_item(event["name"] + "'s relic")
                            messages.append(f"""{timedate} {name} is {location}""")
                        elif event["type"] == "wish":
                            location = format_item(event["location"])
                            messages.append(f"""{t.reverse}{timedate} {t.reverse}{location}{t.reverse} made a dragon wish!{t.normal}""")
                    print(t.clear() + t.move_y(0), end="")
                    for line in range(0, len(messages)):
                        print(t.move_x(21) + messages[line])

                    """ WZ STATUS """
                    realms = ["Alsius", "Ignis", "Syrtis"]
                    rcolors = ["", t.cyan, t.red, t.green]
                    # Gems numbers are in a different order : gem_\d.png
                    rcolors_gems = ["", t.red, t.cyan, t.green]
                    print(t.move_xy(0, 5), end="")
                    for rid in range(0, len(realms)):
                        # HEADER
                        print(t.reverse + format_item(realms[rid]))
                        # GEMS
                        print("G: ", end="")
                        for gem in data["gems"][rid * 6:rid * 6 + 6]:
                            gem_realm = re.search(r"gem_(\d).+", gem).groups()[0]
                            if gem_realm != "0":
                                color_gem = t.bold + rcolors_gems[int(gem_realm)]
                                print(f"""{color_gem}@{t.normal}""", end="")
                        print()
                        # RELICS
                        print("R: ", end="")
                        for relic in data["relics"][realms[rid]]:
                            if relic != None:
                                print(format_item(relic[0:3]), end=" ")
                        print()
                        # FORTS
                        print("F: ", end="")
                        for fort in data["forts"]:
                            if fort["location"] == realms[rid]:
                                fort_color = rcolors[realms.index(fort["owner"]) + 1]
                                fort_name = re.sub(r"(Great|Fort|Castle| )", "", fort["name"])
                                fort_name = remove_fort_nr(fort_name)[0:3]
                                print(f"""{t.bold}{fort_color}{fort_name}{t.normal}""", end=" ")
                        print()
                        print()

                print(f"""{t.move_xy(0, 24)}{t.reverse}{t.bold}{t.darkgray}{t.center("...Press Ctrl+c to quit...", width=79)}{t.normal}""")
                time.sleep(60)

try:
    main()
except KeyboardInterrupt:
    pass
