import {__api__urls} from "./api_url.js";
import {$, MyNotify, MyScheduler, Time} from "./libs/cortlibs.js";
import {_} from "../data/i18n.js";

class Calendar {
	// A very simple calendar module generating .ics files.
	// License : MIT

	constructor() {
		// CSS
		document.addEventListener("DOMContentLoaded", function () {
			const style = document.createElement("style");
			style.textContent = ".addtocalendar { text-decoration: none; }";
			document.head.appendChild(style);
		});
	}

	#generate_uid() {
		const ts = Date.now().toString(36);
		const random = Math.random().toString(36).substring(2, 10);
		return `${ts}${random}@${window.location.hostname}`;
	}

	// Format a Unix timestamp (seconds) as iCalendar UTC date-time: YYYYMMDDTHHMMSSZ
	#format_utc_ics_datetime(unix_ts) {
		const date = new Date(parseInt(unix_ts) * 1000); // Convert to milliseconds
		const y = date.getUTCFullYear();
		const m = String(date.getUTCMonth() + 1).padStart(2, "0");
		const d = String(date.getUTCDate()).padStart(2, "0");
		const h = String(date.getUTCHours()).padStart(2, "0");
		const min = String(date.getUTCMinutes()).padStart(2, "0");
		const s = String(date.getUTCSeconds()).padStart(2, "0");
		return `${y}${m}${d}T${h}${min}${s}Z`;
	}

	// Escape text for iCalendar
	#escape_text(text) {
		return String(text)
			.replace(/\\/g, "\\\\")
			.replace(/;/g, "\\;")
			.replace(/,/g, "\\,")
			.replace(/\n/g, "\\n");
	}

	/*
	 * Generate iCalendar string (UTC) with 10m and 1H reminders
	 * title - title and description
	 * start — Unix timestamp (seconds)
	 * end — Unix timestamp (seconds)
	 */
	#generate_ics(title, start, end) {
		const dt_start = this.#format_utc_ics_datetime(start);
		const dt_end = this.#format_utc_ics_datetime(end);
		const safe_title = "[CoR] " + this.#escape_text(title);
		const uid = this.#generate_uid();

		return [
			"BEGIN:VCALENDAR",
			"VERSION:2.0",
			"CALSCALE:GREGORIAN",
			"PRODID:-//CoRT//EN",
			"BEGIN:VEVENT",
			`UID:${uid}`,
			`SUMMARY:${safe_title}`,
			`DTSTART:${dt_start}`,
			`DTEND:${dt_end}`,
			// 10m alarm
			"BEGIN:VALARM",
			"TRIGGER:-PT10M",
			`DESCRIPTION:${safe_title}`,
			"ACTION:DISPLAY",
			"END:VALARM",
			// 1h alarm, only supported in a few clients
			"BEGIN:VALARM",
			"TRIGGER:-PT1H",
			`DESCRIPTION:${safe_title}`,
			"ACTION:DISPLAY",
			"END:VALARM",
			"END:VEVENT",
			"END:VCALENDAR"
		].join("\n");
	}

	create_link(title, start, end, filename = "event.ics" ) {
		const ics = this.#generate_ics(title, start, end);
		const encoded = encodeURIComponent(ics.trim().replace(/\r\n|\r/g, '\n'));
		const href = `text/calendar;charset=utf-8,${encoded}`;
		const safe_filename = filename.endsWith('.ics') ? filename : `${filename}.ics`;
		return `<a href="data:${href}" class="addtocalendar" download="${safe_filename}"
			title="Add to Calendar">📅</a>`;
	}
}

// wztools
let time = new Time();

//cortlibs
const notify = new MyNotify();

// local
const calendar = new Calendar();
// date formatter
let dformatter = null;

let next_respawns = null;
let previous_respawns = null;
let nextboss_ts = 0;
let notified_10m = false;
let last_notification_ts = 0;
let bosses_img_loaded = false;

function unixstamp2human(unixstamp) {
	return dformatter.format(new Date(unixstamp * 1000));
}

// Floor to minute any Unix timestamp given for any non-null types
function minute_floor(v) {
	if (Array.isArray(v))
		return v.map(function(ts) {
			return Math.floor(ts / 60) * 60;
		});

	if (typeof v === "number")
		return Math.floor(v / 60) * 60;

	if (typeof v === "object" && v !== null) {
		let result = {};
		for (let key in v) {
			if (v.hasOwnProperty(key) && typeof v[key] === "number")
				result[key] = Math.floor(v[key] / 60) * 60;
			else
				 // keep non-numbers as-is
				result[key] = v[key];
		}
		return result;
	}
	throw new TypeError("minute_floor: expected number, array, or plain object");
}

async function get_next_respawns() {
	try {
		let data = await $().getJSON(__api__urls["bosses"]);
		next_respawns = minute_floor(data["next_spawns"]);
		previous_respawns = minute_floor(data["prev_spawns"]);
		nextboss_ts = minute_floor(data["next_boss_ts"]);
		$("#boss-error").empty();
	}
	catch (error) {
		$("#boss-error").text("Failed to get the next bosses spawns: " + error)
		return;
	}
}

// 1 minute offset due to minutely update, so actually 1 means 0
function display_next_respawn(boss) {
	$(`#boss-${boss}-lastspawn`).text(`${_("Last respawn")}: ${unixstamp2human(previous_respawns[boss])}`);
	let next_respawn_in = time.timestamp_ago(next_respawns[boss][0], false, true);
	$(`#boss-${boss}-nextspawn`).text(`${_("Next respawn in")} ${next_respawn_in.human}`);
	for (let i = 0; i < next_respawns[boss].length; i++) {
		const respawn_ts = next_respawns[boss][i];
		const respawn_datetime = new Date(respawn_ts * 1000);
		const uc_boss = boss[0].toUpperCase() + boss.slice(1);
		const calhtml = calendar.create_link(uc_boss, respawn_ts, respawn_ts + 900,
			`${uc_boss}_${respawn_datetime.toISOString()}`);
		$(`#boss-${boss}-nextspawn-${i}`).text(unixstamp2human(respawn_ts));
		$(`#boss-${boss}-nextspawn-${i}-calendar`).html(calhtml);
	}
	let bossname = boss.charAt(0).toUpperCase() + boss.slice(1);
	if (next_respawn_in["days"] == 0 && next_respawn_in["hours"] == 0) {
		if (next_respawn_in["minutes"] <= 10 && next_respawn_in["minutes"] > 1 &&
		    notified_10m === false) {
			notify.emit(_("Bosses status"), `${bossname}: ${_("Next respawn in")} ` +
				 `${next_respawn_in["minutes"]}${_("m")}`, "bosses");
			last_notification_ts = Date.now();
			notified_10m = true;
		}
		else if (next_respawn_in["minutes"] == 1) {
			// Avoid notification spam on focus during the last minute
			const now = Date.now();
			if (now > last_notification_ts + 60000) {
				notify.emit(_("Bosses status"),`${bossname} ${_("should appear very soon!")}`, "bosses");
				last_notification_ts = now;
			}
			notified_10m = false;
		}
	}
}

async function refresh_display() {

	// Fetch API data only if needed
	if (Date.now() / 1000 > nextboss_ts)
		await get_next_respawns();

	// Lazy load bosses
	if (!bosses_img_loaded) {
		for (let boss in next_respawns)
			$(`#boss-${boss}-img`).attr("src", `data/bosses/${boss}.webp`);
		bosses_img_loaded = true;
	}

	let bosses_unordered = new Map();
	for (let boss in next_respawns) {
		display_next_respawn(boss);
		// fetch all next respawns
		bosses_unordered.set(boss, next_respawns[boss][0]);
	}
	// sort by respawn time
	let bosses_ordered = new Map([...bosses_unordered.entries()].sort((a, b) => a[1] - b[1]));
	// need only the bosses names
	bosses_ordered = [...bosses_ordered.keys()];
	// reorder the boss divs
	for (let boss in bosses_ordered) {
		$(`#boss-${bosses_ordered[boss]}`).appendTo("#boss-list");
		$(`#boss-${bosses_ordered[boss]}`).show();
	}
}

$(document).ready(function() {
	document.title = _("Bosses respawn times") + _(" - CoRT - Champions of Regnum tools");
	$("#title").text(_("Bosses respawn times"));
	$("#boss-info").text(_("The page refreshes itself every minute."));
	dformatter = new Intl.DateTimeFormat(localStorage.getItem("lang"), {
		hour12: false, weekday: 'long', month: 'long', day: 'numeric',
		hour: 'numeric', minute: 'numeric', timeZone: localStorage.getItem("tz")
	});

	notify.insert_notification_link();
	const scheduler = new MyScheduler(1, 5, refresh_display);
	scheduler.force_run(true);
	scheduler.start_scheduling();
});
