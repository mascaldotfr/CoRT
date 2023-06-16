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
    target = document.getElementById(id);
    img = new Image();
    img.onload = function() { target.src = img.src };
    img.src = url;
}

// Create translatable strings according to english order of words
function translate_fort(fort) {
	words = fort.split(" ");
	fort_id = words.pop();
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

function display_wz(force_display) {
	// Same order as the website
	realm_colors = {"Alsius": "blue", "Ignis": "red", "Syrtis": "green"};
	gems = []
	forts = []

	if (navigator.onLine === false) {
		$("#wz-info-error").html(`<b>You are offline, can't refresh the status.
			                  Will retry once you are online.</b>`);
		return;
	}
	try {
		data = $().getJSON("https://hail.thebus.top/cortdata/warstatus.txt");
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

	for (gem of data["gems"]) {
		gems.push(`<img src="${gem}" class="wz-icon">`);
	}
	for (fort of data["forts"]) {
		icon = `<img src="${fort["icon"]}" class="wz-icon">`;
		name = translate_fort(fort["name"]);
		forts.push(`${icon}&nbsp;${name}<br>`);
	}

	for (realm of Object.keys(realm_colors)) {
		relics = ""
		for (relic of Object.keys(data["relics"][realm])) {
			url = data["relics"][realm][relic];
			if (url !== null) {
				relics += `<img src="${url}" class="wz-icon">`;
			}
		}
		$(`#wz-${realm.toLowerCase()}`).html(`
				<h2>
				<span class="${realm_colors[realm]}">${realm}</span>&nbsp;
				${gems.splice(0, 6).join("")}&nbsp;${relics}
				</h2>
				<p>${forts.splice(0, 4).join("")}</p>
		`)
	}
	// Reload the map only if it changed, it needs to exist for the first
	// run, and data["map_changed"] may be false then
	if ($("#wz-map-map").attr("src") != data["map_url"]) {
		$("#wz-map-map").attr("src", "data/warstatus/base_map.jpg");
		noflickerimg(data["map_url"], "wz-map-map");
	}

	events_html = `<h2>
		<span class="purple"> ${_("Last server events (in your timezone):")} </span>
		</h2>
		`;
	for (anevent of data["events_log"]) {
		dt = new Date(anevent["date"] * 1000);
		date_options = {
			hour12: false, month: 'numeric', day: 'numeric',
			hour: '2-digit', minute: '2-digit' };
		datetime = dt.toLocaleDateString(undefined, date_options);
		owner = anevent["owner"];
		owner_color = realm_colors[owner];
		captured = anevent["name"];
		if (anevent["type"] == "fort") {
			captured = translate_fort(captured);
			// remove fort number
			captured = captured.substring(0, captured.lastIndexOf(" "));
		}
		else if (anevent["type"] == "gem") {
			captured = _("Gem") + " #" + captured;
		}
		location_color = realm_colors[anevent["location"]];
		events_html += `<p><b>${datetime}</b>&nbsp;`
		if (anevent["type"] != "relic") {
			target = `<span class="${location_color}">${captured}</span>`;
			if (anevent["location"] == anevent["owner"]) {
				action = _("has recovered %s", target);
			}
			else {
				action = _("has captured %s", target);
			}
			events_html += `<span class="${owner_color}">${owner}</span> ${action}.`;
		}
		else if (anevent["type"] == "relic") {
			relic = `<span class="${location_color}">${_("%s's relic", captured)}</span>`;
			if (anevent["owner"] == "altar") {
				events_html += `${relic} ${_("is back to its altar.")}`;
			}
			else {
				events_html += `${relic} ${_("is in transit.")}`;
			}
		}
		events_html += `</p>`;
	}
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
