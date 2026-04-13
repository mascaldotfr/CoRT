import {$, _, api} from "./libs/cortlibs.js";
import {HumaniseEvents} from "./wztools/wztools.js";

let data = null;
let last_fetch_ts = 0;
const humaniser = new HumaniseEvents();

function resolve_filter() {
	let storedfilter = localStorage.getItem("wevents_filter");
	if (storedfilter === null) {
		storedfilter = "none";
		localStorage.setItem("wevents_filter", "none");
	}
	$("#we-filter").val(storedfilter);
}

function display_events() {
	const storedfilter = localStorage.getItem("wevents_filter");
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
	const we_events = $("#we-events");
	if (filtered.length == 0) {
		we_events.html(_("No matching event found!"));
	}
	else {
		we_events.empty();
		// We have THOUSANDS of DOM nodes to add if no filter is chosen.
		// We batch the injection and use setTimeout to yield control back
		// to the browser between chunks. This allows progressive rendering
		// and keeps the UI responsive; otherwise, everything would be
		// injected in a single synchronous task, causing a visible freeze.
		const batch_length = 200;
		for (let i = 0; i < filtered.length; i += batch_length) {
			const batch = filtered.slice(i, i + batch_length);
			setTimeout(function () {
				we_events.append(humaniser.humanise_events(batch, false));
			}, 0);
		}
	}
}

async function get_data() {
	try {
		const cached = JSON.parse(localStorage.getItem("wevents_api_result"))
		const now = Date.now();
		// Refetch at best every minute
		// XXX If you read this and CoRT is >= 3.8, the undefined check
		// can be removed, it was for a transition to more meaningful names
		if (cached !== null && cached["timestamp"] !== undefined && (now - cached["timestamp"] ) <= 60_000) {
			data = cached["payload"];
			last_fetch_ts = cached["timestamp"];
		}
		else {
			last_fetch_ts = now;
			data = await $().getJSON(api.urls["events"]);
			const to_store = {"timestamp": now, "payload": data};
			localStorage.setItem("wevents_api_result", JSON.stringify(to_store));
		}
		$("#we-info-error").empty();
	}
	catch (error) {
		$("#we-info-error").html(`<b>Failed to get the events:</b> <code>${error}</code>`);
		return;
	}
}

$(document).ready(async function() {
	document.title = _("WZ events") + _(" - CoRT - Champions of Regnum tools");
	$("#title").text(_("WZ events"));
	$("#we-info-info").text(
		_("All events over the last 10 days.") +
		" " + _("Last updated:") + " ");
	$("#we-data-dump").attr("href", api.urls["events_dump"]);
	$("#we-data-dump").text(_("Download all events data"));
	$("#we-floppy").show();
	$("#we-filter-label").text(_("Filter:"));
	const options = { "Global": [
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
	let options_html = [];
	for (let group in options) {
		options_html.push(`<optgroup label="${_(group)}">`);
		for (let o of options[group])
			options_html.push(`<option value="${o[0]}">${o[1]}</option>`);
		options_html.push("</optgroup>");
	}
	$("#we-filter").append(options_html.join(""));

	await get_data();
	if (data !== null) {
		const tz = localStorage.getItem("tz");
		// Drop generation time, it was used before but can be quite misleading
		// I don't want to up major just for that, and it can still have it's use
		data.shift();
		const now = new Date(last_fetch_ts);
		const last_update = now.toLocaleTimeString(undefined,
				    {hour: "2-digit", minute: "2-digit", second: "2-digit",
				     timeZone: tz});
		$("#we-info-updated").text(last_update);

		$("#we-filter").on("change", function () {
			localStorage.setItem("wevents_filter", $("#we-filter").val());
			display_events();
		});

		resolve_filter();
		display_events();
	}

	import("./defer.js");
});
