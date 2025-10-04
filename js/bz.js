import {__api__urls} from "./api_url.js";
import {$, insert_notification_link, mynotify, generate_calendar} from "./libs/cortlibs.js";
import {_} from "../data/i18n.js";

// time and date formatters
let dformatter = null;
let tformatter = null;

// API data
let data = null;

async function get_data() {
	try {
		data = await $().getJSON(__api__urls["bz"]);
		$("#bz-error").empty();
	}
	catch (error) {
		$("#bz-error").html("Failed to get the BZ status: " + error);
		return;
	}
}

let notified_10m = false;

function future_date(in_day, at_hour) {
	let d = new Date();
	return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), parseInt(d.getUTCDate()) + parseInt(in_day),
		        at_hour, 0, 0);
}

function mstohhmmss(ms) {
	let hms = { "hours": 0, "minutes": 0, "seconds": 0 };
	let seconds = ms / 1000;
	hms.hours = Math.floor(seconds / 3600);
	seconds -= hms.hours * 3600;
	hms.minutes = Math.floor(seconds / 60);
	seconds -= hms.minutes * 60;
	hms.seconds = Math.floor(seconds);
	for (let hms_element in hms) {
		hms[hms_element] = String(hms[hms_element]).padStart(2, "0");
	}
	return hms;
}

function date_difference_from_now(future_date) {
	let current_date = new Date();
	future_date = new Date(future_date);
	return mstohhmmss((future_date.getTime() - current_date.getTime()));
}

async function feed_bz(init=false) {

	let now = new Date();
	let now_ts = now.getTime() / 1000;
	// Fetch API data only if needed
	if ( data === null || (data["bzendsat"] != 0 && now_ts > data["bzendsat"]) || now_ts > data["bzbegin"][0] )
		await get_data();

	let next_bzs_begin = data["bzbegin"];
	let next_bzs_end = data["bzend"];
	let bz_on = data["bzon"];

	if (bz_on) {
		let bz_ends_at = date_difference_from_now(data["bzendsat"] * 1000)
		$("#bz-countdown-status").html(`<span class="green bold">${_("ON")}</span>`);
		$("#bz-countdown-countdown").text(`${_("Ends in")} ${bz_ends_at["hours"]}:${bz_ends_at["minutes"]}:${bz_ends_at["seconds"]}`);
		if (bz_ends_at["hours"] == 0 && bz_ends_at["minutes"] <= 10 && bz_ends_at["minutes"] >= 1 &&
			notified_10m === false) {
			notified_10m = true;
			mynotify(_("BZ status"), `${_("BZ ending in")} ${bz_ends_at["minutes"]}${_("m")}`, "bz");
		}
		if (bz_ends_at["hours"] == 0 && bz_ends_at["minutes"] == 0 && bz_ends_at["seconds"] == 0) {
			notified_10m = false;
			mynotify(_("BZ status"), _("BZ is closed!"), "bz");
		}
	}
	else {
		$("#bz-countdown-status").html(`<span class="red bold">${_("OFF")}</span>`);
		let next_bz_in = date_difference_from_now(next_bzs_begin[0] * 1000);
		$("#bz-countdown-countdown").text(`${_("Next BZ in")} ${next_bz_in["hours"]}:${next_bz_in["minutes"]}:${next_bz_in["seconds"]}`);
		if (next_bz_in["hours"] == 0 && next_bz_in["minutes"] <= 10 && next_bz_in["minutes"] >= 1 &&
		    notified_10m === false) {
			notified_10m = true;
			mynotify(_("BZ status"), `${_("BZ starting in")} ${next_bz_in["minutes"]}${_("m")}`, "bz");
		}
		if (next_bz_in["hours"] == 0 && next_bz_in["minutes"] == 0 && next_bz_in["seconds"] == 0) {
			notified_10m = false;
			mynotify(_("BZ status"), _("BZ started!"), "bz");
		}

	}

	// refresh future BZs only hourly
	if (now.getMinutes() + now.getSeconds() != 0 && init == false)
		return;
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
	feed_bz(true);
});

setInterval(feed_bz, 1000);
