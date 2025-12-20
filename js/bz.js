import {__api__urls} from "./api_url.js";
import {$, insert_notification_link, mynotify, MyScheduler} from "./libs/cortlibs.js";
import {Time} from "./wztools/wztools.js";
import {_} from "../data/i18n.js";

// time and date formatters
let dformatter = null;
let tformatter = null;
let time = new Time();

// API data
let data = null;

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

function reorder_schedule(bz_begin, bz_end) {
	const today = new Date().getDay(); // 0 = Sunday
	const orderedBegin = [];
	const orderedEnd = [];

	for (let i = 0; i < 7; i++) {
		const dayIndex = (today + i) % 7;
		orderedBegin.push([...bz_begin[dayIndex]]); // shallow copy of inner array
		orderedEnd.push([...bz_end[dayIndex]]);
	}

	return [orderedBegin, orderedEnd];
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

	// display schedule
	const [schbegin, schend] = reorder_schedule(data["schbegin"], data["schend"]);
	let today = new Date();
	for (let day = 0; day < 7; day++) {
		let current_day = new Date(today);
		current_day.setDate(today.getDate() + day);
		$(`#bz-sch${day}-day`).text(dformatter.format(current_day));
		// Display all the bz for that given day
		// start from the right from a display pov, but left for the
		// table
		let offset = schbegin[day].length - 1;
		for (let bzidx = 0; bzidx < schbegin[day].length; bzidx++) {
			let current_begin_hour = new Date(current_day);
			current_begin_hour.setUTCHours(schbegin[day][bzidx], 0, 0, 0);
			let current_end_hour = new Date(current_day);
			current_end_hour.setUTCHours(schend[day][bzidx], 0, 0, 0);
			let selector = $(`#bz-sch${day}-bz${offset}`);
			selector.html(`
				${tformatter.format(current_begin_hour)}-${tformatter.format(current_end_hour)}`);
			selector.attr("data-begin", current_begin_hour.getTime());
			selector.attr("data-end", current_end_hour.getTime());
			offset--;
		}
	}
	highlight_interval();
}

$(document).ready(function() {
	document.title = "CoRT - " + _("BZ status");
	$("#title").text(_("BZ status"));
	$("#bz-schedule-title").text(_("Schedule"));
	$("#bz-info").text(_("The page refreshes itself every minute."));

	let tz = localStorage.getItem("tz");
	let lang = localStorage.getItem("lang");
	dformatter = new Intl.DateTimeFormat(lang, {
		weekday: 'short', timeZone: tz
	});
	tformatter = new Intl.DateTimeFormat("en", {
		hour: 'numeric', timeZone: tz, hour12: false
	});

	insert_notification_link();
	const scheduler = new MyScheduler(1, 5, feed_bz);
	scheduler.force_run();
	scheduler.start_scheduling();
});

