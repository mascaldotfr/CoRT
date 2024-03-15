import {__api__urls} from "./api_url.js";
import {$} from "./libs/lamaiquery.js";
import {_} from "./libs/i18n.js";
import {humanise_events} from "./wztools/events.js";

let __wevents__filter = "none";
let __wevents__dates = [];
let data = null;

function day_filter(events, dayts) {
	let base_ts = new Date(dayts * 1000);
	base_ts.setHours(0, 0, 0);
	let min_ts = Math.floor(base_ts.getTime() / 1000);
	base_ts.setHours(23, 59, 59);
	let max_ts = Math.floor(base_ts.getTime() / 1000);
	return events.filter(i => i["date"] >= min_ts && i["date"] <= max_ts);
}

function display_events() {
	let filtered = [];
	if (__wevents__filter == "none") {
		filtered = data;
	}
	else if (__wevents__filter == "noforts") {
		filtered = data.filter(i => i["name"].startsWith("Great Wall of") ||
					    i["type"] != "fort");
	}
	else if (__wevents__filter == "invas") {
		filtered = data.filter(i => i["name"].startsWith("Great Wall of") &&
					    i["owner"] != i["location"]);
	}
	else if (__wevents__filter == "relics") {
		filtered = data.filter(i => i["type"] == "relic");
	}
	else if (__wevents__filter == "gems") {
		filtered = data.filter(i => i["type"] == "gem");
	}
	else if (__wevents__filter == "wishes") {
		filtered = data.filter(i => i["type"] == "wish");
	}
	else if (__wevents__filter.startsWith("r:")) {
		let realm = __wevents__filter.split(":")[1];
		filtered = data.filter(i => i["owner"] == realm);
	}
	else if (__wevents__filter.startsWith("f:")) {
		let name = __wevents__filter.split(":")[1];
		filtered = data.filter(i => i["name"].indexOf(name) != -1);
	}
	let ondate = $("#we-date").val();
	if (ondate != "none")
		filtered = day_filter(filtered, ondate);
	let html = humanise_events(filtered, false);
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

// when direction is undefined the <option> has been directly chosen by the
// user and doesn't need a trigger event to notify the change as well
function date_change(direction) {
	let selector = document.getElementById("we-date");
	let index = selector.selectedIndex;
	if (direction !== undefined) {
		index += direction == "next" ? 1 : -1;
		selector.options[index%selector.options.length].selected = true;
	}
	if (index < 0) {
		$("#we-prev-day").hide();
	}
	else if (index >= __wevents__dates.length) {
		$("#we-next-day").hide();
	}
	else { // valid value
		if (index != 0)
			$("#we-prev-day").show();
		else
			$("#we-prev-day").hide();
		if (index < __wevents__dates.length - 1)
			$("#we-next-day").show();
		else
			$("#we-next-day").hide();
		if (direction !== undefined)
			$("#we-date").trigger("change");
	}
}

$(document).ready(async function() {
	document.title = "CoRT - " + _("WZ events");
	$("#title").text(_("WZ events"));
	$("#we-info-info").text(
		_("All events over the last 30 days.") +
		" " + _("Last updated:") + " ");
	$("#we-filter-label").text(_("Filter:"));
	$("#we-date-label").text(_("Date:"));
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
	let generated = new Date(data.shift()["generated"] * 1000);
	generated = generated.toLocaleTimeString(undefined,
		{hour: "2-digit", minute: "2-digit"});
	$("#we-info-updated").text(generated);

	let now = new Date();
	now.setHours(0, 0, 0);
	let dtformat = {day: "2-digit", month: "2-digit"};
	let first_event = new Date(data.slice(-1)[0]["date"] * 1000);
	let generate_days = (now.getTime() - first_event.getTime()) / (1000 * 3600 * 24);
	let day_select_html = "";
	generate_days = Math.ceil(generate_days) + 1;
	for (let i = 0; i < generate_days; i++) {
		let previous = new Date();
		previous.setDate(now.getDate() - i);
		previous.setHours(0, 0, 0);
		let previous_ts = previous.getTime() / 1000;
		__wevents__dates.push(previous_ts);
		day_select_html += `
			<option value="${previous_ts}">
				${previous.toLocaleDateString(undefined, dtformat)}
			</option>`;
	}
	$("#we-date").append(day_select_html);


	$("#we-filter").on("change", function () {
		__wevents__filter = $("#we-filter").val();
		display_events();
	});
	$("#we-date").on("change", function () {
		date_change();
		display_events();
	});
	["prev", "next"].forEach(day => {
		$(`#we-${day}-day`).on("click", () => date_change(day));
	});

	let urlsearch = new URLSearchParams(window.location.search);
	let filter = urlsearch.get("f");
	if (!filter) {
		$("#we-filter").val("none");
		display_events();
	}
	else {
		console.log("filter found");
		$("#we-filter").val(filter);
		$("#we-filter").trigger("change");
	}
});
