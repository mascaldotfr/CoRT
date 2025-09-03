import {$, insert_notification_link, mynotify, generate_calendar} from "./libs/cortlibs.js";
import {_} from "../data/i18n.js";

// XXX ALL TIMES ARE UTC INTERNALLY
// SUNDAY = 0 SATURDAY = 6
let bz_begin = [ 	[13, 18],
			[3, 13, 20],
			[13, 18],
			[13, 20],
			[3, 13, 18],
			[13, 20],
			[3, 13, 20] 	];

let bz_end = [		[16, 21],
			[6, 16, 23],
			[16, 21],
			[16, 23],
			[6, 16, 21],
			[17, 23],
			[6, 16, 23] 	];

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

function feed_bz(init=false) {
	let next_bzs_begin = [];
	let next_bzs_end = [];
	let bz_on = false;
	let bz_ends_at = 0;
	let tz = localStorage.getItem("tz");
	let date_options = {
		weekday: 'long', month: '2-digit', day: 'numeric',
		hour: '2-digit', minute: '2-digit', timeZone: tz};
	let time_options = {hour: '2-digit', minute: '2-digit', timeZone: tz};
	let lang = localStorage.getItem("lang");

	let current_date = new Date();
	let current_day = parseInt(current_date.getUTCDay());
	let current_hour = parseInt(current_date.getUTCHours());
	let tomorrow = current_day + 1 <= 6 ? current_day + 1 : 0;
	let aftertomorrow = tomorrow + 1 <= 6 ? tomorrow + 1 : 0;
	// is bz on ?
	for (let hour in bz_begin[current_day]) {
		if (current_hour >= bz_begin[current_day][hour] &&
		    current_hour < bz_end[current_day][hour] ) {
			bz_on = true;
			bz_ends_at = date_difference_from_now(future_date(0, bz_end[current_day][hour]));
			break;
		}
	}
	// compute future bzs
	let future_bz_days = [current_day, tomorrow, aftertomorrow];
	for (let day of future_bz_days) {
		for (let hour in bz_begin[day]) {
			if (day == current_day && parseInt(bz_begin[day][hour]) <= current_hour) {
				// skip passed or current bz of the day
				continue;
			}
			next_bzs_begin.push(future_date(future_bz_days.indexOf(day), bz_begin[day][hour]));
			next_bzs_end.push(future_date(future_bz_days.indexOf(day), bz_end[day][hour]));
		}
	}

	if (bz_on) {
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
		var next_bz_in = date_difference_from_now(next_bzs_begin[0]);
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
	if (current_date.getMinutes() + current_date.getSeconds() != 0 && init == false)
		return;
	// display future BZs
	let bz_next_future = "";
	for (let next_bz in next_bzs_begin) {
		let bz_begin_date = new Date(next_bzs_begin[next_bz]);
		let bz_end_date = new Date(next_bzs_end[next_bz]);
		let bz_begin_datetime = bz_begin_date.toLocaleDateString(lang, date_options);
		let bz_end_time = bz_end_date.toLocaleTimeString(lang, time_options);
		let duration = (bz_end_date.getTime() - bz_begin_date.getTime()) / 1000;
		let calendar = generate_calendar(bz_begin_date.getTime() / 1000, "Battlezone", duration);
		bz_next_future += `<li>${bz_begin_datetime} - ${bz_end_time}
				   <span class="addtocalendar">${calendar}</span></li>`;
	}
	$("#bz-next-future").html(bz_next_future);

	//console.log("bz is on?", bz_on, "bz_ends_at?", bz_ends_at, "next bz in", next_bz_in);
}

$(document).ready(function() {
	document.title = "CoRT - " + _("BZ status");
	$("#title").text(_("BZ status"));
	$("#bz-next-title").text(_("Next BZ:"));
	insert_notification_link();
	feed_bz(true);
});

setInterval(feed_bz, 1000)
