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

function ts_to_human(ts) {
	if (ts === undefined)
		return "N/A";

	let then = new Date(ts * 1000);
	let now = new Date();
	let output = "";

	let diff = now.getTime() - then.getTime();
    	let days = Math.floor(diff /1000 / 60 / 60 /24);
	if (days > 0) output += String(days).padStart(2, "0") + _("d");
	diff -= days * 1000 * 60 * 60 * 24;
	let hours = Math.floor(diff / 1000 / 60 / 60);
	if (hours > 0) output += " " + String(hours).padStart(2, "0") + _("h");
	diff -= hours * 1000 * 60 * 60;
	let minutes = Math.floor(diff / 1000 / 60);
	if (minutes > 0) output += " " + String(minutes).padStart(2, "0") + _("m");
	diff -= minutes * 1000 * 60;

	if (output == "") output = "00m"; // very fresh data
	return _("%s ago", output);
}

// undefined => N/A or 0
function naify(value, failover="0") {
	if (value === undefined)
		return failover;
	else
		return value;
}

// Create translatable strings according to english order of words
// XXX Beware, not exactly the same a the wz status one
function translate_fort(fort) {
	let words = fort.split(" ");
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
	return _(fort_type, fort_name)
}

async function display_stat() {

	try {
		var data = await $().getJSON("https://hail.thebus.top/cortdata/warstatus/stats/statistics.txt");
		$("#ws-info-error").empty();
	}
	catch (error) {
		$("#ws-info-error").html(`<b>Failed to get statistics:</b> <code>${error}</code>`);
		return;
	}

	// sync with statistics.txt
	let report_days = [7, 30, 90];
	let realm_colors = {"Alsius": "blue", "Ignis": "red", "Syrtis": "green"};

	let infos = data.splice(0, 1)[0];
	$("#ws-last-updated").text(ts_to_human(infos["generated"]));


	for (let report = 0; report < data.length; report++) {
		let days = report_days[report];

		for (let realm in data[report]) {
			let r = data[report][realm];
			// Create possible missing base entries
			for (let item of ["gems", "wishes", "forts", "invasions"]) {
				if (!(item in r)) {
					r[item] = {};
				}
			}
			// Hide "last" entries out of the first 7 days report
			let last_invasion = "";
			let last_gem = "";
			let last_wish = "";
			if (report == 0) {
				last_invasion = `<tr>
					<td><b>${_("Last invasion")}</b></td>
					<td>${ts_to_human(r.invasions.last.date)}
					    (${naify(r.invasions.last.location, "N/A")})</td>
					</tr>`;
				last_gem = `<tr>
					<td><b>${_("Last gem stolen")}</b></td>
					<td>${ts_to_human(r.gems.stolen)}</td>
					</tr>`;
				last_wish = `<tr>
					<td><b>${_("Last dragon wish")}</b></td>
					<td>${ts_to_human(r.wishes.last)}</td>
					</tr>`;
			}
			let template = `
				<h3 class="${realm_colors[realm]}">${realm}</h3>
				<table>
				<tr>
					<td><b>${_("Forts captured")} (total)</b></td>
					<td>${naify(r.forts.total)}</td>
				</tr>
				<tr>
					<td><b>${_("Forts captured")}</b></td>
					<td>${naify(r.forts.captured)}</td>
				</tr>
				<tr>
					<td><b>${_("Most captured fort")}</b></td>
					<td>${translate_fort(r.forts.most_captured.name)}
					    (${naify(r.forts.most_captured.count, "N/A")})</td>
				</tr>
				<tr>
					<td><b>${_("Forts recovered")}</b></td>
					<td>${naify(r.forts.recovered)}</td>
				</tr>
				<tr>
					<td><b>${_("Has invaded")}</b></td>
					<td>${naify(r.invasions.count)}</td>
				</tr>
				${last_invasion}
				<tr>
					<td><b>${_("Has been invaded")}</b></td>
					<td>${naify(r.invasions.invaded.count)}</td>
				</tr>
				<tr>
					<td><b>${_("Stolen gems")}</b></td>
					<td>${naify(r.gems.count)}</td>
				</tr>
				${last_gem}
				<tr>
					<td><b>${_("Lost gems")}</b></td>
					<td>${naify(r.gems.lost)}</td>
				</tr>
				<tr>
					<td><b>${_("Dragon wishes")}</b></td>
					<td>${naify(r.wishes.count)}</td>
				</tr>
				${last_wish}
				</table>
			`;
			$(`#ws-${days}d-${realm.toLowerCase()}`).append(template);
		}
	}
}

display_stat();
