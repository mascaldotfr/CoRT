import {__api__frontsite, __api__frontsite_dir, __api__urls} from "./api_url.js";
import {$} from "./lamaiquery.js";
import {_} from "./i18n.js";

// source it from trainer.js
var valid_trainerdatasets = ["1.33.2", "1.33.3", "1.33.6", "1.33.12"];
const classes = ["knight", "barbarian", "conjurer", "warlock", "hunter", "marksman"];
const class_type_masks = {
	'archer':0x10, 'hunter':0x11, 'marksman':0x12,
	'mage':0x20, 'conjurer':0x21, 'warlock':0x22,
	'warrior':0x40, 'barbarian':0x41, 'knight':0x42
};

var trainerdatasets = {};
var stats = {};
var data_txt = null;

function capitalize(string) {
	return string[0].toUpperCase() + string.slice(1);
}

function loading(txt) {
	$("#ts-maingraph").empty();
	if (txt == "")
		return;
	if (txt.startsWith("http"))
		txt = `<b>${_("Downloading")}</b> ${txt}`;
	$("#ts-maingraph").append(txt + "<br>");
}

async function make_stats() {
	let fetch_failed = "";
	try {
		for (let dset of valid_trainerdatasets) {
			let url = __api__frontsite + __api__frontsite_dir +
				  `/data/trainer/${dset}/trainerdata.json`;
			loading(url);
			trainerdatasets[dset] = await $().getJSON(url);
		}
		loading(__api__urls["trainer_data"]);
		data_txt = await $().get(__api__urls["trainer_data"]);
		data_txt = data_txt.split("\n");
		data_txt.pop(); // remove last empty line
	}
	catch(error) {
		$("#ts-error").html(`Failed to make the stats: <code>${error} ${fetch_failed}</code>`);
		return false;
	}

	loading(`<b>${_("Crunching numbers")}</b>`);
	// Prefill arrays
	for (let version of valid_trainerdatasets) {
		stats[version] = {};
		for (let clas of classes)
			stats[version][clas] = {};
	}

	for (let s of data_txt) {
		let setup = s.split(" ");
		let version = setup.shift();
		let clas = setup.shift();
		let level = setup.shift();

		// skip empty setups, non lvl 60
		let checksum = 0;
		for (let i = 1; i < setup.length / 2; i += 2)
			checksum += setup[i].split("").reduce((a,b) => a + b, 0);
		if (checksum == 0 || level < 60)
			continue;
		if (level > 60)
			level = 60; // Soul monger crystal case

		let base_skills = class_type_masks[clas] & 0xF0;
		let class_skills = class_type_masks[clas];
		let alltrees = trainerdatasets[version]["class_disciplines"][base_skills];
		alltrees = alltrees.concat(trainerdatasets[version]["class_disciplines"][class_skills]);

		// Parse everything and gather necessary infos
		for (let tree of alltrees) {
			let disc_points = setup.shift();
			let spell_points = setup.shift().split("");
			let counter = 0;

			for (let spell of trainerdatasets[version]["disciplines"][tree]["spells"]) {
				counter++;
				let points = parseInt(spell_points.shift());
				let currspell = spell["name"];
				if (tree.endsWith("WM")) {
					if (currspell.startsWith("undefined"))
						continue; // skip unused WM slots
					// Determine if the power is available
					if (counter * 2 - 1 <= disc_points)
						points = 5;
				}
				if (!(currspell in stats[version][clas])) {
					stats[version][clas][currspell] = {};
					stats[version][clas][currspell]["frequency"] = [0, 0, 0, 0, 0, 0];
				}
				stats[version][clas][currspell]["frequency"][points] += 1;
			}
		}
	}

	// Do global maths
	for (let version of valid_trainerdatasets) {
		for (let clas of classes) {
			for (let spell of Object.keys(stats[version][clas])) {
				let freqsum = stats[version][clas][spell]["frequency"].reduce((a,b) => a + b, 0);
				let notusing = stats[version][clas][spell]["frequency"][0];
				let percentage = 100 - (notusing * 100) / freqsum;
				stats[version][clas][spell]["percentage"] = percentage.toFixed(2);
			}
		}
	}
	loading("");
}

function get_filters() {
	return {"version": $("#ts-version").val(),
		"class": $("#ts-class").val(),
		"power": $("#ts-power").val()};
}

function draw_maingraph() {
	let f = get_filters();
	let labels = Object.keys(stats[f["version"]][f["class"]]);
	labels.sort((a, b) => stats[f["version"]][f["class"]][a]["percentage"] - stats[f["version"]][f["class"]][b]["percentage"]);
	let series = [];
	for (let power of labels)
		series.push(stats[f["version"]][f["class"]][power]["percentage"]);
	let dataset = {
		labels: labels.map(p => `${p} (${stats[f["version"]][f["class"]][p]["percentage"]}%)`),
		series:	[series]
	};
	let options = {
		horizontalBars: true,
		axisY: { offset: 200 }
	};
	new Chartist.BarChart("#ts-maingraph", dataset, options);
}

function draw_powergraph() {
	let f = get_filters();
	let power = f["power"];
	let labels = [];
	for (let label of [0, 1, 2, 3, 4, 5]) {
		try {
			labels.push(label + " (" + stats[f["version"]][f["class"]][f["power"]]["frequency"][label] + ")");
		}
		catch(error) {
			console.error(error);
			alert(_("No setups for that combo, bailing out!"));
			window.location.reload();
			return;
		}
	}
	let dataset = {
		labels: labels,
		series:	[stats[f["version"]][f["class"]][f["power"]]["frequency"]]
	};
	let options = {
		chartPadding: {left: 0, top: 30, bottom: 0},
		seriesBarDistance: 15,
		axisY: { onlyInteger: true }
	};
	new Chartist.BarChart("#ts-powergraph-graph", dataset, options);
	$("#ts-powername").text(power);
}

function refresh_powers() {
	let f = get_filters();
	let powerlist = stats[f["version"]][f["class"]];
	let options = "";
	for (let p of Object.keys(powerlist).sort())
		options += `<option value="${p}">${p}</option>`;
	$("#ts-power").html(options);
}

function redraw_all() {
	refresh_powers();
	draw_maingraph();
	draw_powergraph();
}

function redraw_version() {
	draw_maingraph();
	draw_powergraph();
}

$(document).ready(async function() {
	document.title = "CoRT - " + _("Trainer statistics")
	$("#title").text(_("Trainer statistics"));

	$("#ts-version-label").text(_("Version:"));
	$("#ts-class-label").text(_("Class:"));
	$("#ts-power-label").text(_("Power:"));
	$("#ts-center-title").text(_("Percentual use"));
	$("#ts-powergraph-x").text(_("Skill level (frequency)"));

	for (let version of valid_trainerdatasets.reverse())
		$("#ts-version").append(`<option value="${version}">${version}</option>`);
	for (let clas of classes)
		$("#ts-class").append(`<option value="${clas}">${_(capitalize(clas))}</option>`);

	if (await make_stats() != false)
		redraw_all();

	$("#ts-version").on("change", redraw_version);
	$("#ts-class").on("change", redraw_all);
	$("#ts-power").on("change", draw_powergraph);

});

