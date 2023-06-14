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

function display_wz() {
	// Same order as the website
	realm_colors = {"Alsius": "blue", "Ignis": "red", "Syrtis": "green"};
	gems = []
	forts = []

	try {
		data = $().getJSON("https://hail.thebus.top/cortdata/warstatus.txt");
	}
	catch (error) {
		$("#wz-map").html(`<b>Failed to get the warstatus: <code>${error}</code>`);
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
		$(`#wz-${realm.toLowerCase()}`).html(`
				<h2>
				<span class="${realm_colors[realm]}">${realm}</span>&nbsp;
				${gems.splice(0, 6).join("")}
				</h2>
				<p>${forts.splice(0, 4).join("")}</p>
		`)
	}
	$("#wz-map-map").attr("src", "data/warstatus/base_map.jpg");
	noflickerimg(data["map_url"], "wz-map-map");

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
		events_html += `<p>
			<b>${datetime}</b>
			<span class="${owner_color}">${owner}</span>
			${_("has captured %s", `<span class="${location_color}">${captured}</span>`)}.
			</p>`;
	}
	$("#wz-events").html(events_html);
}

$(document).ready(function() {
	display_wz();
});

setInterval(display_wz, 60 * 1000)
