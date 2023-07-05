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
	if (ts === null || ts == 0)
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

// undefined / null => N/A or 0
function naify(value, failover="0") {
	if (value === null || value === undefined)
		return failover;
	else
		return value;
}

function show_graphs(data, selector, onlyinteger=true) {
	let realms = ["Alsius", "Ignis", "Syrtis"];
	// skip 00:00 and 23:00 as it overflows
	let hours = [""];
	for (let i = 1; i < 23; i++) {
		let hour = String(i).padStart(2, "0");
		hours.push(`${hour}:00`);
	}
	let dataset = {
		labels: hours,
		series: [
			  data[realms[0]],
			  data[realms[1]],
			  data[realms[2]]
		]
	};
	let options = {
		fullWidth: true,
		chartPadding: {left: 15, top: 30, bottom: 0},
		axisY: {
			onlyInteger: onlyinteger,
			offset: 50
		},
		axisX: {
		}
	};
	let responsive = [
		["screen and (max-width: 800px)", {
			axisX: {
				labelInterpolationFnc: function (value) {
					let hour = Number(value.substring(0,2));
					if (hour % 2 == 0 && hour >= 1 && hour <= 22) {
						return hour;
					}
					else {
						return "";
					}
				}
			}
		}]
	];
	new Chartist.Line(selector, dataset, options, responsive);
}

async function display_stat() {

	try {
		var data = await $().getJSON(__api__urls["stats"]);
		$("#ws-info-error").empty();
	}
	catch (error) {
		$("#ws-info-error").html(`<b>Failed to get statistics:</b> <code>${error}</code>`);
		return;
	}

	// sync with statistics.txt
	let report_days = [7, 30];
	let realm_colors = get_realm_colors();

	let infos = data.splice(0, 1)[0];
	$("#ws-last-updated").text(ts_to_human(infos["generated"]));
	let now = new Date();
	if (now.getTime() / 1000 - infos["generated"] > 3 * 3600) {
		$("#ws-info-error").html(`<b>Nothing happened since the last 3 hours,
			<a href="https://championsofregnum.com/index.php?l=1&sec=3">
			NGE's page</a> is probably not working.</b>`);
	}


	for (let report = 0; report < data.length; report++) {
		let days = report_days[report];

		for (let realm in data[report]) {
			let r = data[report][realm];
			// Hide "last" entries out of the first 7 days report
			let last_invasion = "";
			let last_gem = "";
			if (report == 0) {
				last_invasion = `<tr>
					<td><b>${_("Last invasion")}</b></td>
					<td>${ts_to_human(r.invasions.last.date)}
					    (${naify(r.invasions.last.location, "N/A")})</td>
					</tr>`;
				last_gem = `<tr>
					<td><b>${_("Last gem stolen")}</b></td>
					<td>${ts_to_human(r.gems.stolen.last)}</td>
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
					<td>${translate_fort(r.forts.most_captured.name, false)}
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
					<td>${naify(r.gems.stolen.count)}</td>
				</tr>
				${last_gem}
				<tr>
					<td><b>${_("Dragon wishes")}</b></td>
					<td>${naify(r.wishes.count)}</td>
				</tr>
				<tr>
					<td><b>${_("Last dragon wish")}</b></td>
					<td>${ts_to_human(r.wishes.last)}</td>
				</tr>
				</table>
			`;
			$(`#ws-${days}d-${realm.toLowerCase()}`).empty();
			$(`#ws-${days}d-${realm.toLowerCase()}`).append(template);
		}
	}
	show_graphs(infos["activity"], "#ws-activity-chart");
	show_graphs(infos["invasions"], "#ws-invasion-chart", false);
}

$(document).ready(function() {
	display_stat();
});

setInterval(display_stat, 60 * 1000);
