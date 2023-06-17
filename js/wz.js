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


// Wait for an image to be loaded to be displayed
function noflickerimg(url, id) {
    let target = document.getElementById(id);
    let img = new Image();
    img.onload = function() { target.src = img.src };
    img.src = url;
}

// Create translatable strings according to english order of words
function translate_fort(fort) {
	let words = fort.split(" ");
	let fort_id = words.pop();
	let fort_name;
	let fort_type;
	if (words[1] == "Castle") {
		fort_name = words.shift();
		fort_type = "%s " + words.join(" ");
	}
	else {
		fort_name = words.pop();
		fort_type = words.join(" ") + " %s";
	}
	return _(fort_type, fort_name) + ` ${fort_id}`
}

async function display_wz(force_display) {
	// Same order as the website
	let realm_colors = {"Alsius": "blue", "Ignis": "red", "Syrtis": "green"};
	let gems = [];
	let forts = [];

	if (navigator.onLine === false) {
		$("#wz-info-error").html(`<b>You are offline, can't refresh the status.
			                  Will retry once you are online.</b>`);
		return;
	}
	try {
		var data = await $().getJSON("https://hail.thebus.top/cortdata/warstatus.txt");
		$("#wz-info-error").empty();
		// Do nothing if nothing changed compared to the last fetch
		if (data["map_changed"] === false && data["gems_changed"] === false &&
		    data["relics_changed"] === false && force_display !== true)
			return;
	}
	catch (error) {
		$("#wz-info-error").html(`<b>Failed to get the warstatus:</b> <code>${error}</code>`);
		return;
	}

	for (let gem of data["gems"]) {
		gems.push(`<img src="${gem}" class="wz-icon">`);
	}
	for (let fort of data["forts"]) {
		let icon = `<img src="${fort["icon"]}" class="wz-icon">`;
		let name = translate_fort(fort["name"]);
		forts.push(`${icon}&nbsp;${name}<br>`);
	}

	for (let realm of Object.keys(realm_colors)) {
		let relics = "";
		for (let relic of Object.keys(data["relics"][realm])) {
			let url = data["relics"][realm][relic];
			if (url !== null) {
				relics += `<img src="${url}" class="wz-icon">`;
			}
		}
		$(`#wz-${realm.toLowerCase()}`).html(`
				<h2>
				<span class="realmname ${realm_colors[realm]}">${realm}</span>
				<span class="gems">${gems.splice(0, 6).join("")}</span>
				<span class="relics">${relics}</span>
				</h2>
				<span class="forts">${forts.splice(0, 4).join("")}</span>
		`)
	}
	// Reload the map only if it changed, it needs to exist for the first
	// run, and data["map_changed"] may be false then
	if ($("#wz-map-map").attr("src") != data["map_url"]) {
		$("#wz-map-map").attr("src", "data/warstatus/base_map.jpg");
		noflickerimg(data["map_url"], "wz-map-map");
	}

	let events_html = `<h2 id="wz-events-header">
		<span class="purple">${_("Last server events (in your timezone):")} </span>
		</h2>
		<span>
		`;
	for (let anevent of data["events_log"]) {
		let dt = new Date(anevent["date"] * 1000);
		let date_options = {
			month: 'numeric', day: 'numeric',
			hour: '2-digit', minute: '2-digit' };
		let datetime = dt.toLocaleDateString(undefined, date_options);
		let owner = anevent["owner"];
		let owner_color = realm_colors[owner];
		let captured = anevent["name"];
		let location_color = realm_colors[anevent["location"]];
		events_html += `<b>${datetime}</b>&nbsp;`
		if (anevent["type"] == "fort" || anevent["type"] == "gem") {
			if (anevent["type"] == "fort") {
				captured = translate_fort(captured);
				// remove fort number
				captured = captured.substring(0, captured.lastIndexOf(" "));
			}
			else if (anevent["type"] == "gem") {
				captured = _("Gem") + " #" + captured;
			}
			let target = `<span class="${location_color}">${captured}</span>`;
			let action;
			if (anevent["location"] == anevent["owner"]) {
				action = _("has recovered %s", target);
			}
			else {
				action = _("has captured %s", target);
			}
			events_html += `<span class="${owner_color}">${owner}</span> ${action}.`;
		}
		else if (anevent["type"] == "relic") {
			let relic = `<span class="${location_color}">${_("%s's relic", captured)}</span>`;
			if (anevent["owner"] == "altar") {
				events_html += `${relic} ${_("is back to its altar.")}`;
			}
			else {
				events_html += `${relic} ${_("is in transit.")}`;
			}
		}
		events_html += `<br>`;
	}
	events_html += `</span>`;
	$("#wz-events").html(events_html);
}

$(document).ready(function() {
	display_wz(true);
});

// timer are stopped when phones and tablets are on sleep mode,
// force reload when they're woken up
if ("ontouchstart" in document.documentElement) {
	window.addEventListener("visibilitychange", (e) => {
		if (document.visibilityState == "visible")
			display_wz(true);
	});
}
// Same idea as above but when the connection is available again
window.addEventListener("online", (e) => {
	display_wz(true);
});

setInterval(display_wz, 60 * 1000)
