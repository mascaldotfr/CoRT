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


function utcScheduleToLocal(schbegin, schend, lang = "en") {

	// get next ocurrence of day index (0=Sun, 6=Sat) as Date()
	function nextDate(dayIndex) {
		let now = new Date();
		now.setUTCDate(now.getUTCDate() + (dayIndex + ( 7 - now.getUTCDay() )) % 7);
		now.setUTCHours(0, 0, 0, 0);
		return now;
	}

	// Step 1 : create & convert all utc timestamp to local display
	// Place them by local days in buckets, which may differ from UTC day
	// Array schbegin starts from Sun to stop in Sat
	const localBZs = [ [], [], [], [], [], [], [] ];
	for (let d = 0; d < schbegin.length; d++) {
		let begin = nextDate(d);
		let end = nextDate(d);
		for (let h = 0; h < schbegin[d].length; h++) {
			begin.setUTCHours(schbegin[d][h]);
			end.setUTCHours(schend[d][h]);
			// local conversion for display happens here:
			const display = `${String(begin.getHours()).padStart(2,0)}-${String(end.getHours()).padStart(2,0)}`;
			localBZs[begin.getDay()].push({
				"begin_ts": begin.getTime(),
				"end_ts": end.getTime(),
				"display": display,
				"highlight": false
			});
		}
	}

	// Step 2: order days with today first
	let todayIndex = new Date().getDay();
	const localOrderedBZs = [
		    ...localBZs.slice(todayIndex),
		    ...localBZs.slice(0, todayIndex)
	];

	// Step 2.5
	// Sort daily schedules
	// Then give all BZ days at least 3 BZ so they are properly aligned
	let blankBZ = {"display": " ", "highlight": false};
	for (let d = 0; d < localOrderedBZs.length; d++) {
		if (localOrderedBZs[d].length < 3) {
			// insert or add a blank BZ is TZ dependant
			const first_bz_at = new Date(localOrderedBZs[d][0]["begin_ts"]);
			let second_bz_at = null;
			// Some countries have 1 BZ per day like Afghanistan
			try {
				second_bz_at = new Date(localOrderedBZs[d][1]["begin_ts"]);
			}
			catch (_unused) {
				second_bz_at = first_bz_at;
			}
			if (first_bz_at.getHours() < 7) {
				if (second_bz_at.getHours() <= 17) {
					// LA, Sydney
					localOrderedBZs[d].push(blankBZ);
				}
				else {
					// Tokyo
					localOrderedBZs[d].splice(1, 0, blankBZ);
				}
			}
			else {
				// BsAs, PAris
				localOrderedBZs[d].unshift(blankBZ);
			}
		}
	}

	// Step 3: find the right BZ interval for highlighting
	let now = new Date();
	let in_24_hours = new Date(now);
	in_24_hours.setHours(in_24_hours.getHours() + 24);
	let found = false;
	for (let d = 0; d < localOrderedBZs.length; d++) {
		if (found)
			break;
		for (let h = 0; h < localOrderedBZs[d].length; h++) {
			let begin = new Date(localOrderedBZs[d][h]["begin_ts"]);
			let end = new Date(localOrderedBZs[d][h]["end_ts"]);
			// The calendar is rolling, in some case the first line
			// is in 6 days due to BZ going over midnight
			if (begin > in_24_hours)
				continue;
			if ((now >= begin && now < end) || (begin > now)) {
				// ^ BZ is ON || OFF
				localOrderedBZs[d][h]["highlight"] = true;
				found = true;
				break;
			}
		}
	}

	// Step 4: generate short day names in order
	let daynamesOrdered = [];
	const df = new Intl.DateTimeFormat(lang, {
		weekday: 'short'
	});
	for (let d = 0; d < 7; d++) {
		let thisDay = new Date();
		thisDay.setDate(thisDay.getDate() + d);
		daynamesOrdered[d] = df.format(thisDay);
	}

	return [ localOrderedBZs, daynamesOrdered ];
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
	const [localsch, daynames] = utcScheduleToLocal(data["schbegin"], data["schend"], lang);
	// clear the table
	document.querySelectorAll(".clearme").forEach(el => el.remove());

	for (let day = 0; day < 7; day++) {
		let daily_schedule = [];
		$(`#bz-sch${day}-day`).text(daynames[day]);
		// Display all the bz for that given day
		// start from the right from a display pov, but left for the
		// array
		for (let bzidx = 0; bzidx < localsch[day].length; bzidx++) {
			const that_bz = localsch[day][bzidx];
			let highlight = "";
			if (that_bz["highlight"])
				highlight = bz_on ? 'data-status="on"' : 'data-status="off"';
			daily_schedule.push(`<td ${highlight} class="clearme">${that_bz["display"]}`);

		}
		$(`#bz-sch${day}`).append(daily_schedule.join(""));
	}
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

