#!/usr/bin/env python3

import gzip
import json
from pathlib import Path
import sys

# data file location and content
data_file = Path("../../var/trainer_saved_setups.txt")
data_txt = []
# trainer data location and content
trainer_datadir = Path("../../../data/trainer")
trainer_data = {}
# output directory and base filename (a .gz will be added for the compressed version)
output_dir = Path("../../var")
output_file = "trainerstats.json"
# END of setup

# some constants taken from the js trainer
constants = {
    "class_type_masks": {
        "hunter": 0x11,
        "marksman": 0x12,
        "conjurer": 0x21,
        "warlock": 0x22,
        "barbarian": 0x41,
        "knight": 0x42
        },
    "maxlevel": 60,
    "classes": ["knight", "barbarian", "conjurer", "warlock", "hunter", "marksman"]
    }
# dict output for API
api_dict = {}
# full output file
baseout = output_dir.joinpath(output_file)
# trainer "db" content
data = None

# Preload the "database"
with open(data_file) as f:
	data = f.readlines()
# Preload the existing stats
if baseout.exists():
    with open(baseout) as prev_json:
        api_dict = json.load(prev_json)
        lineno = api_dict["lineno"]
        if api_dict["lineno"] == len(data):
            sys.exit() # Quit if there is no new setup
        api_dict["lineno"] = len(data)
        data = data[lineno + 1:]
else:
    api_dict["lineno"] = len(data)

# Load the trainerdata sets
# get all trainer versions but < 1.33.6 (there was no data collection back
# then, 2 first versions)
versions = [d.name for d in trainer_datadir.iterdir() if d.is_dir() and not "beta" in str(d)]
versions = sorted(versions, key=lambda v: [int(x) for x in v.split(".")])[2:]
# then get all trainer datasets
for v in versions:
	with open(trainer_datadir.joinpath(v, "trainerdata.json")) as f:
		trainer_data[v] = json.load(f)

# prefill stats array
for version in versions:
	# Leave if there are already stats for that version
	if version in api_dict:
		continue
	api_dict[version] = {}
	for clas in constants["classes"]:
		api_dict[version][clas] = {}

# Time to compute things
for line in data:
	line = line.strip()
	setup = line.split(" ")
	version = setup.pop(0)
	clas = setup.pop(0)
	level = int(setup.pop(0))

	# skip the few versions when setup collection wasn't a thing
	if version not in versions:
		continue
	# skip empty setups, non lvl 60, and incomplete ones
	if (level < constants["maxlevel"]):
		continue
	else:
		level = constants["maxlevel"] # lvl 61 is raptor gem

	# at least if all powerpoints are used ...
	checksum = 0 # total power points used
	for i in range(1, len(setup), 2):
		# sum of all powerpoints used for all skill in the current tree
		ppsum = sum(int(x) for x in setup[i])
		checksum += ppsum
	# see trainer.js (determine if mage or the rest when it comes to pp)
	powerpoints = "32";
	if (constants["class_type_masks"][clas] & 0xF0) != 32:
		powerpoints = "80"
	ppoints = trainer_data[version]["points"]["power"][powerpoints][level - 1];
	if checksum != ppoints:
		continue; # incomplete

	base_skills = str(constants["class_type_masks"][clas] & 0xF0)
	class_skills = str(constants["class_type_masks"][clas])
	alltrees = trainer_data[version]["class_disciplines"][base_skills]
	alltrees = alltrees + trainer_data[version]["class_disciplines"][class_skills]

	# Parse everything and gather necessary info
	for tree in alltrees:
		disc_points = int(setup.pop(0))
		spell_points = list(setup.pop(0))
		counter = 0

		for spell in trainer_data[version]["disciplines"][tree]["spells"]:
			counter += 1
			points = int(spell_points.pop(0))
			currspell = spell["name"]

			if tree.endswith("WM"):
				if currspell.startswith("undefined"):
					continue  # skip unused WM slots
				# Determine if the power is available
				if counter * 2 - 1 <= disc_points:
					points = 5

			if currspell not in api_dict[version][clas]:
				api_dict[version][clas][currspell] = {}
				api_dict[version][clas][currspell]["frequency"] = [0, 0, 0, 0, 0, 0]

			# One more user of this spell at this level
			api_dict[version][clas][currspell]["frequency"][points] += 1

# Do global maths
for version in versions:
	for clas in constants["classes"]:
		for spell in api_dict[version][clas]:
			freq = api_dict[version][clas][spell]["frequency"]
			freqsum = sum(freq)
			notusing = freq[0]
			percentage = 100 - (notusing * 100) / freqsum
			api_dict[version][clas][spell]["percentage"] = f"{percentage:.2f}"


# Time to write our stats!
api_json = json.dumps(api_dict)
with open(baseout, "w") as f:
	f.write(api_json)
with gzip.open(baseout.with_suffix(baseout.suffix + ".gz"), "wt", compresslevel=2) as f:
	f.write(api_json)
