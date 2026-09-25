import {UITools} from "./libs/uitools.js";
import {$} from "./libs/lamaiquery.js";
import {api} from "./libs/api.js";
import {_} from "./libs/i18n.js";
import {TrainerConstants} from "./trainertools/trainertools.js";
import {__chartist_responsive} from "./libs/chartist.js";

// remove 1.33.2 and 1.33.3, setup collection wasn't a thing back then
var valid_trainerdatasets = TrainerConstants.datasets.slice(2).reverse()
var stats = {};
var lang = "en";

function capitalize(string) {
	return string[0].toUpperCase() + string.slice(1);
}

async function download_stats() {
	try {
		const cached = JSON.parse(localStorage.getItem("tstats_api_result"));
		const now = Date.now();
		// Refresh at best every hour (3hrs server side)
		if (cached !== null && (now - cached["timestamp"] ) <= 3600000) {
			stats = cached["payload"];
		}
		else {
			stats = await $().getJSON(api.urls["trainer_data_stats"]);
			const to_store = {"timestamp": now, "payload": stats};
			localStorage.setItem("tstats_api_result", JSON.stringify(to_store));
		}
		return true;
	}
	catch(err) {
		$("#ts-error-info").html(`Failed to make the stats: <code>${err}</code> (check console)`);
		return false;
	}
}

function get_filters() {
	return {"version": $("#ts-version").val(),
		"class": $("#ts-class").val(),
		"power": $("#ts-power").val()};
}

function draw_maingraph() {
	let f = get_filters();
	let class_infos = stats[f["version"]][f["class"]];
	let labels = Object.keys(class_infos);
	// sort skills by usage
	labels.sort((a, b) => class_infos[a]["p"] - class_infos[b]["p"]);
	let series = [];
	for (let power of labels)
		series.push(class_infos[power]["p"]);
	let dataset = {
		labels: labels.map(p => {
			const name = stats["skill_names"][p][lang] || stats["skill_names"][p]["en"];
			return `${name} (${class_infos[p]["p"]}%)`;
		}),
		series:	[series]
	};
	let options = {
		horizontalBars: true,
		axisY: { offset: 200 },
		axisX: { showLabel: false }
	};
	new Chartist.BarChart("#ts-maingraph", dataset, options);
}

function draw_powergraph() {
	let f = get_filters();
	const power = f["power"];
	// Translation for a skill name is available
	let power_id = stats["skill_names"].findIndex((skill) => skill[lang] === power);
	// Default to english when it isn't
	if (power_id === -1 && lang !== "en")
		power_id = stats["skill_names"].findIndex((skill) => skill["en"] === power);

	let labels = [];
	for (let label of [0, 1, 2, 3, 4, 5]) {
		try {
			labels.push(label + " (" + stats[f["version"]][f["class"]][power_id]["f"][label] + ")");
		}
		catch(error) {
			console.error(error);
			alert(_("No setups for that combo, bailing out!"));
			return;
		}
	}
	let dataset = {
		labels: labels,
		series:	[stats[f["version"]][f["class"]][power_id]["f"]]
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
	let options = [];
	for (let p of Object.keys(powerlist)) {
		const skill_name = stats["skill_names"][p][lang] || stats["skill_names"][p]["en"];
		options.push(`<option value="${skill_name}">${skill_name}</option>`);
	}
	$("#ts-power").html(options.sort().join(""));
}

function redraw_all() {
	refresh_powers();
	draw_maingraph();
	draw_powergraph();
}

function redraw_version() {
	refresh_powers();
	draw_maingraph();
	draw_powergraph();
}

$(document).ready(async function() {
	document.title = _("Trainer statistics") + _(" - CoRT - Champions of Regnum tools");
	$("#title").text(_("Trainer statistics"));

	$("#ts-version-label").text(_("Version:"));
	$("#ts-class-label").text(_("Class:"));
	$("#ts-power-label").text(_("Power:"));
	$("#ts-center-title").text(_("Percentual use"));
	$("#ts-powergraph-x").text(_("Skill level (frequency)"));

	for (let version of valid_trainerdatasets)
		$("#ts-version").append(`<option value="${version}">${version}</option>`);
	for (let clas of TrainerConstants.classes)
		$("#ts-class").append(`<option value="${clas}">${_(capitalize(clas))}</option>`);

	lang = localStorage.getItem("lang");
	const stats_are_ok = await download_stats();
	if (stats_are_ok)
		redraw_all();
	UITools.unskeleton();
	UITools.defer();

	$("#ts-version").on("change", redraw_version);
	$("#ts-class").on("change", redraw_all);
	$("#ts-power").on("change", draw_powergraph);

});

