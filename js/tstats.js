import {__api__frontsite, __api__frontsite_dir, __api__urls} from "./api_url.js";
import {$} from "./libs/cortlibs.js";
import {_} from "../data/i18n.js";
import {constants} from "./trainertools/constants.js";
import {__chartist_responsive} from "./libs/chartist.js";

var valid_trainerdatasets = constants.datasets;
// remove 1.33.2 and 1.33.3, setup collection wasn't a thing back then
valid_trainerdatasets.splice(0,2);
var stats = {};

function capitalize(string) {
	return string[0].toUpperCase() + string.slice(1);
}

async function download_stats() {
	try {
		stats = await $().getJSON(__api__urls["trainer_data_stats"]);
	}
	catch(err) {
		$("#ts-maingraph").html(`Failed to make the stats: <code>${err}</code> (check console)`);
		$("#ts-maingraph").addClass("red", "bold");
	}
}

function get_filters() {
	return {"version": $("#ts-version").val(),
		"class": $("#ts-class").val(),
		"power": $("#ts-power").val()};
}

function draw_maingraph() {
	let f = get_filters();
	let labels = Object.keys(stats[f["version"]][f["class"]]);
	// sort skills by usage
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
		axisY: { offset: 200 },
		axisX: { showLabel: false }
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
	document.title = "CoRT - " + _("Trainer statistics");
	$("#title").text(_("Trainer statistics"));
	$("#ts-oldstats-text").html(_("For stats on older versions of Regnum <a id='ts-oldstats-link'>check this site</a>."));
	$("#ts-oldstats-link").attr("href", "https://poludnica.shinyapps.io/configs/");
	$("#ts-oldstats-link").attr("target", "_blank");

	$("#ts-version-label").text(_("Version:"));
	$("#ts-class-label").text(_("Class:"));
	$("#ts-power-label").text(_("Power:"));
	$("#ts-center-title").text(_("Percentual use"));
	$("#ts-powergraph-x").text(_("Skill level (frequency)"));

	for (let version of valid_trainerdatasets.reverse())
		$("#ts-version").append(`<option value="${version}">${version}</option>`);
	for (let clas of constants.classes)
		$("#ts-class").append(`<option value="${clas}">${_(capitalize(clas))}</option>`);

	await download_stats();
	redraw_all();

	$("#ts-version").on("change", redraw_version);
	$("#ts-class").on("change", redraw_all);
	$("#ts-power").on("change", draw_powergraph);

});

