import {__api__urls, __api__base} from "./api_url.js";
import {$} from "./libs/lamaiquery.js";
import {_} from "./libs/i18n.js";
import {HumaniseEvents} from "./wztools/wztools.js";

let data = null;
let humaniser = new HumaniseEvents();

function resolve_filter() {
	let storedfilter = localStorage.getItem("wevents_filter");
	if (storedfilter === null) {
		storedfilter = "none";
		localStorage.setItem("wevents_filter", "none");
	}
	$("#we-filter").val(storedfilter);
}

function display_events() {
	let storedfilter = localStorage.getItem("wevents_filter");
	let filtered = [];
	if (storedfilter == "none") {
		filtered = data;
	}
	else if (storedfilter == "noforts") {
		filtered = data.filter(i => i["name"].startsWith("Great Wall of") ||
					    i["type"] != "fort");
	}
	else if (storedfilter == "invas") {
		filtered = data.filter(i => i["name"].startsWith("Great Wall of") &&
					    i["owner"] != i["location"]);
	}
	else if (storedfilter == "relics") {
		filtered = data.filter(i => i["type"] == "relic");
	}
	else if (storedfilter == "gems") {
		filtered = data.filter(i => i["type"] == "gem");
	}
	else if (storedfilter == "wishes") {
		filtered = data.filter(i => i["type"] == "wish");
	}
	else if (storedfilter.startsWith("r:")) {
		let realm = storedfilter.split(":")[1];
		filtered = data.filter(i => i["owner"] == realm);
	}
	else if (storedfilter.startsWith("f:")) {
		let name = storedfilter.split(":")[1];
		filtered = data.filter(i => i["name"].indexOf(name) != -1);
	}
	let html = humaniser.humanise_events(filtered, false);
	if (html.length == 0)
		html = _("No matching event found!");
	$("#we-events").empty();
	$("#we-events").html(html);
}

async function get_data() {
	try {
		data = await $().getJSON(__api__urls["events"]);
		$("#we-info-error").empty();
	}
	catch (error) {
		$("#we-info-error").html(`<b>Failed to get the events:</b> <code>${error}</code>`);
		return;
	}
}

$(document).ready(async function() {
	document.title = "CoRT - " + _("WZ events");
	$("#title").text(_("WZ events"));
	$("#we-info-info").text(
		_("All events over the last 14 days.") +
		" " + _("Last updated:") + " ");
	$("#we-data-dump").html(`
		<a href="${__api__base}/var/dumps" target="blank">
		${_("Download all events data")}</a>`);
	$("#we-filter-label").text(_("Filter:"));
	let options = { "Global": [
				["none", _("None")],
				["noforts", _("No forts")],
				["invas", _("Invasions only")],
				["relics", _("Relics only")],
				["gems", _("Gems only")],
				["wishes", _("Dragon wishes only")] ],
			"Realms": [
				["r:Alsius", "Alsius"],
				["r:Ignis", "Ignis"],
				["r:Syrtis", "Syrtis"] ],
			"Forts": [
				["f:Imperia", "Imperia"],
				["f:Aggersborg", "Aggersborg"],
				["f:Trelleborg", "Trelleborg"],
				["f:Menirah", "Menirah"],
				["f:Shaanarid", "Shaanarid"],
				["f:Samal", "Samal"],
				["f:Algaros", "Algaros"],
				["f:Herbred", "Herbred"],
				["f:Eferias", "Eferias"] ]
	};
	let options_html = "";
	for (let group in options) {
		options_html += `<optgroup label="${_(group)}">`;
		for (let o of options[group])
			options_html += `<option value="${o[0]}">${o[1]}</option>`;
		options_html += "</optgroup>";
	}
	$("#we-filter").append(options_html);

	await get_data();
	let tz = localStorage.getItem("tz");
	let generated = new Date(data.shift()["generated"] * 1000);
	generated = generated.toLocaleTimeString(undefined,
		{hour: "2-digit", minute: "2-digit", timeZone: tz});
	$("#we-info-updated").text(generated);

	$("#we-filter").on("change", function () {
		localStorage.setItem("wevents_filter", $("#we-filter").val());
		display_events();
	});

	resolve_filter();
	display_events();
});
