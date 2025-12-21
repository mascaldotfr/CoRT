import {__api__urls} from "./api_url.js";
import {$, insert_notification_link, mynotify, MyScheduler} from "./libs/cortlibs.js";
import {Time} from "./wztools/wztools.js";
import {_} from "../data/i18n.js";

// formatters
let lang = localStorage.getItem("lang");
let time = new Time();

// API data
let data = null;

// notification sent within 10 minutes?
let notified_10m = false;


// Highlight the next bz event (it's magic don't ask)
function highlight_interval(container = document, clas = "highlight") {
	const now = Date.now();
	const items = Array.from(container.querySelectorAll('[data-begin][data-end]'));

	const validItems = items
		.map(item => {
			const start = Number(item.dataset.begin);
			const end = Number(item.dataset.end);
			return { item, start, end, valid: !isNaN(start) && !isNaN(end) };
		})
		.filter(entry => entry.valid);

	const activeItems = validItems.filter(({ start, end }) => start <= now && now <= end);

	if (activeItems.length > 0) {
		for (const { item } of validItems) {
			item.classList.toggle(clas, activeItems.some(e => e.item === item));
		}
	}
	else {
		const upcomingItems = validItems.filter(({ start }) => start > now);
		let nextItem = null;
		if (upcomingItems.length > 0) {
			nextItem = upcomingItems.reduce((earliest, current) =>
				current.start < earliest.start ? current : earliest
			).item;
		}
		for (const { item } of validItems) {
			item.classList.toggle(clas, item === nextItem);
		}
	}
}


// more magic
function utcScheduleToLocal(schbegin, schend, lang = "en") {
	const now = new Date();

	// Define the local week we want to display: Sunday to Saturday containing "now" or next event
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const dayOfWeek = today.getDay();
	let displaySunday;

	// On Saturday after 18h, show next week
	if (dayOfWeek === 6 && now.getHours() >= 18) {
		displaySunday = new Date(today);
		displaySunday.setDate(today.getDate() + 1);
	} else {
		displaySunday = new Date(today);
		displaySunday.setDate(today.getDate() - dayOfWeek);
	}
	displaySunday.setHours(0, 0, 0, 0);
	const displayNextSunday = new Date(displaySunday);
	displayNextSunday.setDate(displaySunday.getDate() + 7);

	// Output buckets for this local week (Sun=0 ... Sat=6)
	const result = [[], [], [], [], [], [], []];

	// Generate UTC events for days that could fall into this local week
	// UTC days from (displaySunday - 1 day) to (displayNextSunday + 1 day)
	const utcStart = new Date(displaySunday);
	utcStart.setDate(displaySunday.getDate() - 1);
	utcStart.setUTCHours(0, 0, 0, 0);

	// Generate 9 UTC days
	for (let i = 0; i < 9; i++) {
		const utcDate = new Date(utcStart);
		utcDate.setUTCDate(utcStart.getUTCDate() + i);
		const utcDay = utcDate.getUTCDay();

		const begins = schbegin[utcDay] || [];
		const ends   = schend[utcDay]   || [];

		for (let j = 0; j < Math.min(begins.length, ends.length); j++) {
			let begin_ts = Date.UTC(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate(), begins[j]);
			let end_ts   = Date.UTC(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate(), ends[j]);

			// Handle overnight in UTC
			if (ends[j] <= begins[j]) {
				end_ts = Date.UTC(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate() + 1, ends[j]);
			}

			const beginLocal = new Date(begin_ts);

			// Only include if it falls in the display week
			if (beginLocal < displaySunday || beginLocal >= displayNextSunday) {
				continue;
			}

			const localDayIndex = beginLocal.getDay(); // 0 = Sunday
			const endLocal = new Date(end_ts);

			const display = `${String(beginLocal.getHours()).padStart(2, '0')}-${String(endLocal.getHours()).padStart(2, '0')}`;
			const weekday = beginLocal.toLocaleDateString(lang, { weekday: 'short' });

			result[localDayIndex].push({
				begin_ts,
				end_ts,
				display,
				weekday
			});
		}
	}

	// Sort each day
	for (let i = 0; i < 7; i++) {
		result[i].sort((a, b) => a.begin_ts - b.begin_ts);
	}

	return result;
}

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

	// display schedule
	const localsch = utcScheduleToLocal(data["schbegin"], data["schend"], lang);

	for (let day = 0; day < 7; day++) {
		$(`#bz-sch${day}-day`).text(localsch[day][0]["weekday"]);
		// Display all the bz for that given day
		// start from the right from a display pov, but left for the
		// array
		let offset = localsch[day].length - 1;
		for (let bzidx = 0; bzidx < localsch[day].length; bzidx++) {
			const that_bz = localsch[day][bzidx];
			let selector = $(`#bz-sch${day}-bz${offset}`);
			selector.text(that_bz["display"]);
			selector.attr("data-begin", that_bz["begin_ts"]);
			selector.attr("data-end", that_bz["end_ts"]);
			offset--;
		}
	}
	highlight_interval();
}

$(document).ready(function() {
	document.title = "CoRT - " + _("BZ status");
	$("#title").text(_("BZ status"));
	$("#bz-schedule-title").text(_("Schedule"));
	$("#bz-hours").text(_("All hours are local"));
	$("#bz-info").text(_("The page refreshes itself every minute."));

	// TZ doesn't apply here
	$("#tz").hide();

	insert_notification_link();
	const scheduler = new MyScheduler(1, 5, feed_bz);
	scheduler.force_run();
	scheduler.start_scheduling();
});

