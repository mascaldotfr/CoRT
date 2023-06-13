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
	realm_infos = {"Alsius": "blue", "Ignis": "red", "Syrtis": "green"};
	try {
		data = $().getJSON("https://hail.thebus.top/cortdata/warstatus.txt");
	}
	catch (error) {
		$("#wz-map").html(`<b>Failed to get the warstatus: <code>${error}</code>`);
		return;
	}
	for (realm of Object.keys(realm_infos)) {
		gems = ""
		forts = ""
		for (gem of data[realm]["gems"]) {
			// Don't display empty gem slots
			if (gem.search("gem_0") == -1)
				gems += `<img src="${gem}" class="wz-icon">`;
		}
		for (fort in data[realm]["forts_icons"]) {
			icon = `<img src="${data[realm]["forts_icons"][fort]}" class="wz-icon">`;
			name = translate_fort(data[realm]["forts_names"][fort]);
			forts += `${icon}&nbsp;${name}<br>`;
		}
		$(`#wz-${realm.toLowerCase()}`).html(`
			<h2><span class="${realm_infos[realm]}">${realm}</span>&nbsp;${gems}</h2>
			<p>${forts}</p>
			`)
	}
	$("#wz-map").html(`<img src="${data["map_url"]}" alt="WZ map">`);
}

$(document).ready(function() {
	display_wz();
});

setInterval(display_wz, 60 * 1000)
