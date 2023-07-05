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

let __wevents__seek = 0;
let __wevents__step = 100;
let __wevents__filter = "none";
let data;

function generate_events() {
	if (__wevents__filter == "none") {
		let slice = data.slice(__wevents__seek, __wevents__seek + __wevents__step);
		var html = humanise_events(slice, false);
		if (__wevents__seek + __wevents__step > data.length)
			__wevents__seek = data.length - __wevents__step;
		__wevents__seek += __wevents__step;
	}
	else {
		// Fetch everything in one swoop if they are filters
		var slice = data.slice(__wevents__seek, data.length);
		__wevents__seek = data.length;
	}
	if (__wevents__filter == "noforts") {
		let filtered = [];
		slice.filter(function (item) {
			if (item["name"].startsWith("Great Wall of") || item["type"] != "fort")
				filtered.push(item);
		});
		var html = humanise_events(filtered, false);
	}
	else if (__wevents__filter == "invas") {
		let filtered = [];
		slice.filter(function (item) {
			if (item["name"].startsWith("Great Wall of") && 
			    item["owner"] != item["location"])
				filtered.push(item);
		});
		var html = humanise_events(filtered, false);
	}
	else if (__wevents__filter == "gems") {
		let filtered = [];
		slice.filter(function (item) {
			if (item["type"] == "gem")
				filtered.push(item);
		});
		var html = humanise_events(filtered, false);
	}
	else if (__wevents__filter == "wishes") {
		let filtered = [];
		slice.filter(function (item) {
			if (item["type"] == "wish")
				filtered.push(item);
		});
		var html = humanise_events(filtered, false);
	}
	return html;
}

async function display_events(clear=false) {
	let realm_colors = get_realm_colors();

	try {
		data = await $().getJSON("https://hail.thebus.top/cortdata/warstatus/stats/events.json");
		$("#we-info-error").empty();
		let generated = new Date(data.shift()["generated"] * 1000);
		let datetime = generated.toLocaleTimeString(undefined,
			{hour: "2-digit", minute: "2-digit"});
		$("#we-info-updated").text(datetime);
	}
	catch (error) {
		$("#we-info-error").html(`<b>Failed to get the events:</b> <code>${error}</code>`);
		return;
	}

	if (clear === true) {
		$("#we-events").empty();
		$("#we-events").html(generate_events());
	}
	else {
		$("#we-events").append(generate_events());
	}
}

$(document).ready(function() {
	$("#we-filter").on("change", function () {
			__wevents__filter = $("#we-filter").val();
			__wevents__seek = 0;
			display_events(true);
	});
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
});



$(window).on("scroll", () => {
	if ( window.scrollY + window.innerHeight >= document.body.offsetHeight - 500) {
		display_events();
	}
});
