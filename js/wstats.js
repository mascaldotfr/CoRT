import {__api__urls} from "./api_url.js";
import {$} from "./libs/cortlibs.js";
import {_} from "../data/i18n.js";
import {Constants, TranslateForts, Time} from "./wztools/wztools.js";
import {__chartist_responsive} from "./libs/chartist.js";

// sync with statistics.json
let report_days = [7, 30, 90];

// wztools
let constants = new Constants();
let xlator = new TranslateForts();
let time = new Time();

let realm_colors = constants.realm_colors;
let realms = constants.realm_names;

let tformatter = null;

// undefined / null => N/A or 0
function naify(value, failover="0") {
	if (value === null || value === undefined)
		return failover;
	else
		return value;
}

// convert UTC stats to "local" time for hourly graphs
function localize_timelines(utclines) {
	let localizedlines = [];
	let date = new Date();
	for (let realm in utclines) {
		let localline = [];
		for (let hour in utclines[realm]) {
			date.setUTCHours(hour, 0, 0, 0);
			// Number to remove leading zeroes
			const localhour = Number(tformatter.format(date));
			localline[localhour] = utclines[realm][hour];
		}
		localizedlines.push(localline);
	}
	return localizedlines;
}

function show_graphs_hourly(data, selector, onlyinteger=true) {
	let hours = [];
	for (let i = 0; i <= 23; i++)
		hours.push(String(i));
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
						const hour = Number(value);
						if (hour % 2 == 0 && hour <= 22) {
							return hour;
						}
						else {
							return "";
						}
					}
				}
			}]
		];
	new Chartist.LineChart(selector, dataset, options, responsive);
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
	let table = [`<h3 class="${realm_colors[realm]}">${realm}</h3><table>`];
	for (let row of rows) {
		if (row[0] == null || row[1] == null)
			continue;
		table.push(`<tr><td class="bold">${_(row[0])}</td><td>${row[1]}</td></tr>`);
	}
	table.push("</table>");
	$(selector).html(table.join(""));
}

async function display_stat(force = false) {
	// The page is hidden, just do nothing; the focus event listener will
	// update when needed
	if (!force && document.hidden)
		return;

	let data = null;

	try {
		data = await $().getJSON(__api__urls["stats"]);
		$("#ws-info-error").empty();
	}
	catch (error) {
		$("#ws-info-error").html(`<b>Failed to get statistics:</b> <code>${error}</code>`);
		return;
	}

	let infos = data.splice(0, 1)[0];
	let some_time_ago = time.timestamp_ago(infos["generated"], true);
	$("#ws-last-updated").text(some_time_ago["human"]);
	if (time.timestamp_now() - infos["generated"] > 3 * 3600) {
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
					`${xlator.translate_fort(r["forts"]["most_captured"]["name"], false)}
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
					["Invasion", `${naify(time.timestamp_ago(r["invasions"]["last"]["date"], true).human, "N/A")}
							    (${naify(r["invasions"]["last"]["location"], "N/A")})`],
					["Gem stolen",
							`${naify(time.timestamp_ago(r["gems"]["stolen"]["last"], true).human, "N/A")}`],
					["Dragon wish",
							`${naify(time.timestamp_ago(r["wishes"]["last"], true).human, "N/A")}`]];
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
	document.title = "CoRT - " + _("WZ statistics");
	$("#title").text(_("WZ statistics"));
	$("#ws-info-info").text(_("The page refreshes itself every minute.") +
		                " " + _("Last event:"));

	tformatter = new Intl.DateTimeFormat("en-GB", {
		hour12: false, hour: '2-digit',
		timeZone: localStorage.getItem("tz")
	});

	let ilinks = [];
	ilinks.push({"id": "#ws-last", txt: _("Latest key events")});
	for (let day of report_days) {
		let txt = _("Last %s days", day);
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
		// Add link to each graph / stat title
		$(l["id"]).html(`<a href="#ws-index-list">${l["txt"]}</a>`);
		// Add to index card
		$("#ws-index-list").append(`<li><a href="${l["id"]}">${l["txt"]}</a></li>`);
	}


	display_stat(true);
	// Always ensure we have fresh data, particulary on mobile, with a 5s
	// debounce
	let last_focus = Date.now();
	function force_refresh() {
		const ts = Date.now();
		if (ts - last_focus > 5000 && !document.hidden) {
			last_focus = ts;
			display_stat(true);
		}
	}
	window.addEventListener("focus", force_refresh);
	// In case the page is not focused, but another UI element of it
	window.addEventListener("visibilitychange", force_refresh);
});

setInterval(display_stat, 60 * 1000);
