import {__api__urls} from "./api_url.js";
import {$, insert_notification_link, mynotify, generate_calendar, MyScheduler} from "./libs/cortlibs.js";
import {Time} from "./wztools/wztools.js";
import {_} from "../data/i18n.js";
try {
	import("./libs/addtocalendarv2.js");
}
catch (_unused) {
	console.info("Calendar not supported, upgrade your browser");
}

// time and date formatters
let dformatter = null;
let tformatter = null;
let time = new Time();

// API data
let data = null;

async function get_data() {
	try {
		data = await $().getJSON(__api__urls["bz"]);
		$("#bz-error").empty();
	}
	catch (error) {
		$("#bz-error").text("Failed to get the BZ status: " + error);
		return;
	}
}

let notified_10m = false;

async function feed_bz() {

	// Fetch API data only if needed
	let now = new Date();
	let now_ts = now.getTime() / 1000;
	if ( data === null || (data["bzendsat"] != 0 && now_ts > data["bzendsat"]) || now_ts > data["bzbegin"][0] )
		await get_data();

	let next_bzs_begin = data["bzbegin"];
	let next_bzs_end = data["bzend"];
	let bz_on = data["bzon"];

	// 1 minute offset due to minutely update, so actually 1 means 0
	if (bz_on) {
		let bz_ends_at = time.timestamp_ago(60 + data["bzendsat"]);
		$("#bz-countdown-status").text(_("ON"));
		$("#bz-countdown-status").attr("data-status", "on");
		$("#bz-countdown-countdown").text(`${_("Ends in")} ${bz_ends_at["human"]}`);
		if (bz_ends_at["hours"] == 0 && bz_ends_at["minutes"] <= 10 && bz_ends_at["minutes"] > 1 &&
			notified_10m === false) {
			notified_10m = true;
			mynotify(_("BZ status"), `${_("BZ ending in")} ${bz_ends_at["human"]}`, "bz");
		}
		if (bz_ends_at["hours"] == 0 && bz_ends_at["minutes"] == 1) {
			notified_10m = false;
			mynotify(_("BZ status"), _("BZ is about to end!"), "bz");
		}
	}
	else {
		$("#bz-countdown-status").text(_("OFF"));
		$("#bz-countdown-status").attr("data-status", "off");
		let next_bz_in = time.timestamp_ago(60 + next_bzs_begin[0]);
		$("#bz-countdown-countdown").text(`${_("Next BZ in")} ${next_bz_in["human"]}`);
		if (next_bz_in["hours"] == 0 && next_bz_in["minutes"] <= 10 && next_bz_in["minutes"] > 1 &&
		    notified_10m === false) {
			notified_10m = true;
			mynotify(_("BZ status"), `${_("BZ starting in")} ${next_bz_in["human"]}`, "bz");
		}
		if (next_bz_in["hours"] == 0 && next_bz_in["minutes"] == 1) {
			notified_10m = false;
			mynotify(_("BZ status"), _("BZ is about to start!"), "bz");
		}

	}

	// display future BZs
	let bz_next_future = "";
	for (let next_bz in next_bzs_begin) {
		let bz_begin_date = new Date(next_bzs_begin[next_bz] * 1000);
		let bz_end_date = new Date(next_bzs_end[next_bz] * 1000);
		let bz_begin_datetime = dformatter.format(bz_begin_date);
		let bz_end_time = tformatter.format(bz_end_date);
		let duration = (bz_end_date.getTime() - bz_begin_date.getTime()) / 1000;
		let calendar = generate_calendar(bz_begin_date.getTime() / 1000, "Battlezone", duration);
		bz_next_future += `<li>${bz_begin_datetime} - ${bz_end_time}
				   <span class="addtocalendar">${calendar}</span></li>`;
	}
	$("#bz-next-future").html(bz_next_future);

}

$(document).ready(function() {
	document.title = "CoRT - " + _("BZ status");
	$("#title").text(_("BZ status"));
	$("#bz-next-title").text(_("Next BZ:"));
	$("#bz-info").text(_("The page refreshes itself every minute."));

	let tz = localStorage.getItem("tz");
	let lang = localStorage.getItem("lang");
	dformatter = new Intl.DateTimeFormat(lang, {
		weekday: 'long', month: '2-digit', day: 'numeric',
		hour: '2-digit', minute: '2-digit', timeZone: tz
	});
	tformatter = new Intl.DateTimeFormat(lang, {
		hour: '2-digit', minute: '2-digit', timeZone: tz
	});

	insert_notification_link();
	const scheduler = new MyScheduler(1, 5, feed_bz);
	scheduler.force_run();
	scheduler.start_scheduling();
});

