/*
 * Copyright (c) 2023 mascal
 *
 * CoRT is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * CoRT is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with CoRT.  If not, see <http://www.gnu.org/licenses/>.
 */

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
	else if (__wevents__filter == "gems") {
		filtered = data.filter(i => i["type"] == "gem");
	}
	else if (__wevents__filter == "wishes") {
		filtered = data.filter(i => i["type"] == "wish");
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
		data = await $().getJSON("https://hail.thebus.top/cortdata/warstatus/stats/events.json");
		$("#we-info-error").empty();
	}
	catch (error) {
		$("#we-info-error").html(`<b>Failed to get the events:</b> <code>${error}</code>`);
		return;
	}
}

function date_change(direction) {
	let selector = document.getElementById("we-date");
	let index = selector.selectedIndex;
	index += direction == "next" ? 1 : -1;
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
		selector.options[index%selector.options.length].selected = true;
		$("#we-date").trigger("change");
	}
}

$(document).ready(async function() {
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

	let urlsearch = new URLSearchParams(window.location.search);
	let filter = urlsearch.get("f");
	if (!filter) {
		$("#we-filter").val("none");
		display_events();
	}
	else {
		$("#we-filter").val(filter);
		$("#we-filter").trigger("change");
	}

	$("#we-filter").on("change", function () {
		__wevents__filter = $("#we-filter").val();
		display_events();
	});
	$("#we-date").on("change", display_events)
});
