import {__api__urls} from "./api_url.js";
import {$} from "./libs/lamaiquery.js";
import {_} from "./libs/i18n.js";
import {get_realm_colors, get_realms} from "./wztools/constants.js";
import {translate_fort} from "./wztools/translate_forts.js";
import {timestamp_ago, timestamp_now} from "./wztools/time.js";
import {$onlinemanager} from "./libs/onlinemanager.js";
import {__chartist_responsive} from "./libs/chartist.js";

// sync with statistics.json
let report_days = [7, 30, 90];

let tz = localStorage.getItem("tz");
let realm_colors = get_realm_colors();
let realms = get_realms();

// undefined / null => N/A or 0
function naify(value, failover="0") {
	if (value === null || value === undefined)
		return failover;
	else
		return value;
}

// convert UTC stats to "local" time for hourly graphs
function localize_timelines(utclines) {
	let localizedlines = new Array();
	let date = new Date();
	for (let realm in utclines) {
		let localline = [];
		for (let hour in utclines[realm]) {
			date.setUTCHours(hour, 0, 0, 0);
			let date_options = {hour12: false, hour: 'numeric', minute: 'numeric', timeZone: tz};
			let localhour = date.toLocaleTimeString(undefined, date_options);
			localhour = localhour.replace(/:\d+.+$/, "");
			localhour = localhour.replace(/^0/, "");
			localline[localhour] = utclines[realm][hour];
		}
		localizedlines.push(localline);
	}
	return localizedlines;
}

function show_graphs_hourly(data, selector, onlyinteger=true) {
	// skip 00:00 and 23:00 as it overflows
	let hours = [""];
	for (let i = 1; i < 23; i++)
		hours.push(String(i).padStart(2, "0"));
	let dataset = {
		labels: hours,
		series: localize_timelines([ data[realms[0]], data[realms[1]], data[realms[2]] ])
	};
	let options = {
		fullWidth: true,
		chartPadding: {left: 0, top: 30, bottom: 0},
		axisY: {
			onlyInteger: onlyinteger,
			offset: 50
		}
	};
	let responsive = [];
	if (__chartist_responsive)
		responsive = [
			["screen and (max-width: 1600px)", {
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
	new Chartist.LineChart(selector, dataset, options, responsive)
}

function show_graphs_fortsheld_byfort(data, selector) {
	// same order as generate.py get_fortsheld()
	let forts = ["Aggersborg", "Trelleborg", "Imperia",
		     "Samal", "Menirah", "Shaanarid",
		     "Herbred", "Algaros", "Eferias"];
	let dataset = {
		labels: forts,
		series: realms.map(f => data[f])
	};
	let options = {
		chartPadding: {left: 0, top: 30, bottom: 0},
		seriesBarDistance: 15,
	};
	let responsive = [];
	if (__chartist_responsive)
		responsive = [
			["screen and (max-width: 1600px)", {
				seriesBarDistance: 10,
				axisX: { labelInterpolationFnc: v => v.slice(0,3) }
			}]
		];
	new Chartist.BarChart(selector, dataset, options, responsive);
}

function show_graphs_fortsheld_byrealm(data, selector) {
	let series = realms.map(f => data[f]);
	let dataset = {
		series: series
	};
	let options = {
		donut: true,
		donutWidth: 60,
		startAngle: 270,
		showLabel: true
	};
	new Chartist.PieChart(selector, dataset, options);
}

function table_factory(rows, selector, realm) {
	let table = `<h3 class="${realm_colors[realm]}">${realm}</h3><table>`;
	for (let row of rows) {
		if (row[0] == null || row[1] == null)
			continue;
		table += `<tr><td class="bold">${_(row[0])}</td><td>${row[1]}</td></tr>`;
	}
	table += "</table>";
	$(selector).empty();
	$(selector).append(table);
}

async function display_stat() {

	if ($onlinemanager.online() === false) {
		$("#ws-info-error").html($onlinemanager.offlineMessage +
					 " " + $onlinemanager.willRetryMessage);
		return;
	}
	try {
		var data = await $().getJSON(__api__urls["stats"]);
		$("#ws-info-error").empty();
	}
	catch (error) {
		$("#ws-info-error").html(`<b>Failed to get statistics:</b> <code>${error}</code>`);
		return;
	}

	let infos = data.splice(0, 1)[0];
	let some_time_ago = timestamp_ago(infos["generated"], true);
	$("#ws-last-updated").text(some_time_ago["human"]);
	if (timestamp_now() - infos["generated"] > 3 * 3600) {
		$("#ws-info-error").html(`<b>Nothing happened since the last 3 hours,
			<a href="https://www.championsofregnum.com/index.php?l=1&sec=3" target="_blank">
			NGE's page</a> is probably not working.</b>`);
	}

	for (let report = 0; report < data.length; report++) {
		let days = report_days[report];

		for (let realm in data[report]) {
			let r = data[report][realm];
			let rows = [
				["Forts captured (total)", naify(r["forts"]["total"])],
				["Forts captured", naify(r["forts"]["captured"])],
				["Most captured fort",
					`${translate_fort(r["forts"]["most_captured"]["name"], false)}
					    (${naify(r["forts"]["most_captured"]["count"], "N/A")})`],
				["Forts recovered", naify(r["forts"]["recovered"])],
				["Has invaded", naify(r["invasions"]["count"])],
				["Has been invaded", naify(r["invasions"]["invaded"]["count"])],
				["Stolen gems", naify(r["gems"]["stolen"]["count"])],
				["Dragon wishes", naify(r["wishes"]["count"])],
			];
			table_factory(rows, `#ws-${days}d-${realm.toLowerCase()}`, realm);
			if (report == data.length - 1) {
				let rows = [
					["Invasion", `${naify(timestamp_ago(r["invasions"]["last"]["date"], true).human, "N/A")}
							    (${naify(r["invasions"]["last"]["location"], "N/A")})`],
					["Gem stolen",
							`${naify(timestamp_ago(r["gems"]["stolen"]["last"], true).human, "N/A")}`],
					["Dragon wish",
							`${naify(timestamp_ago(r["wishes"]["last"], true).human, "N/A")}`]];
				let now = new Date();
				let earliest_date = (now.getTime() / 1000) - (days * 3600 * 24);
				if (r["wishes"]["last"] <= earliest_date) // out of bound wish
					rows[2][1] = `<span class="blink">☠${rows[2][1]}☠</span>`;
				table_factory(rows, `#ws-last-${realm.toLowerCase()}`, realm);
			}
		}
	}

	show_graphs_hourly(infos["activity"], "#ws-forts-chart");
	show_graphs_hourly(infos["invasions"], "#ws-invasions-chart", false);
	show_graphs_hourly(infos["gems"], "#ws-gems-chart");
	show_graphs_hourly(infos["wishes"], "#ws-wishes-chart");
	show_graphs_fortsheld_byfort(infos["fortsheld"]["count"], "#ws-fortsheld-count-chart");
	show_graphs_fortsheld_byfort(infos["fortsheld"]["average"], "#ws-fortsheld-avg-chart");
	show_graphs_fortsheld_byrealm(infos["fortsheld"]["total"], "#ws-fortsheld-total-chart");
}

$(document).ready(function() {
	document.title = "CoRT - " + _("WZ statistics")
	$("#title").text(_("WZ statistics"));
	$("#ws-info-info").text(_("The page refreshes itself every minute.") +
		                " " + _("Last event:"));
	let ilinks = [];
	ilinks.push({"id": "#ws-last", txt: _("Latest key events")});
	for (let day of report_days) {
		let txt = _("Last %s days", day)
		ilinks.push({ "id": `#ws-${day}d-title`, "txt": txt});
	}
	let max_report_days = Math.max(...report_days);
	ilinks.push({"id": "#ws-forts-title", "txt":
		_("Net average of fortifications captured per hour on the last %s days",
		  max_report_days)});
	ilinks.push({"id": "#ws-invasions-title", "txt":
		_("Net average of invasions per hour on the last %s days",
		   max_report_days)});
	ilinks.push({"id": "#ws-gems-title", "txt":
		_("Total stolen gems per hour on the last %s days",
		   max_report_days)});
	ilinks.push({"id": "#ws-wishes-title", "txt":
		_("Total dragon wishes per hour on the last %s days",
		   max_report_days)});
	ilinks.push({"id": "#ws-fortsheld-count-title", "txt":
		_("Total count of captured enemy forts on the last %s days",
		   max_report_days)});
	ilinks.push({"id": "#ws-fortsheld-avg-title", "txt":
		_("Average fort holding time on the last %s days (in minutes)",
		   max_report_days)});
	ilinks.push({"id": "#ws-fortsheld-total-title", "txt":
		_("Total forts holding time on the last %s days (in hours)",
		   max_report_days)});

	$("#ws-index-title").text(_("Index"));
	for (let link in ilinks) {
		let l = ilinks[link];
		$(l["id"]).text(`<a href="#ws-index-list">${l["txt"]}</a>`);
		$(l["id"]).append(`<a id="${l["id"]}"></a>`);
		$("#ws-index-list").append(`<li><a href="${l["id"]}">${l["txt"]}</a></li>`);
	}

	display_stat();
});

$onlinemanager.whenBackOnline(display_stat);

setInterval(display_stat, 60 * 1000);
