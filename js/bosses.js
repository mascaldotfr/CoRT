import {$} from "./libs/lamaiquery.js";
import {_} from "./libs/i18n.js";
import {UITools} from "./libs/uitools.js";
import {MyScheduler} from "./libs/myscheduler.js";
import {MyNotify} from "./libs/mynotify.js";
import {Time} from "./libs/time.js";
import {BossesRespawns} from "./libs/bossesrespawns.js";
import {Tabs} from "./libs/tabs.js";


class Calendar {
	// A very simple calendar module generating .ics files.
	// License : MIT
	static generate_uid() {
		const ts = Date.now().toString(36);
		const random = Math.random().toString(36).substring(2, 10);
		return `${ts}${random}@${window.location.hostname}`;
	}

	// Format a Unix timestamp (seconds) as iCalendar UTC date-time: YYYYMMDDTHHMMSSZ
	static format_utc_ics_datetime(unix_ts) {
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
	static escape_text(text) {
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
	static generate_ics(title, start, end) {
		const dt_start = this.format_utc_ics_datetime(start);
		const dt_end = this.format_utc_ics_datetime(end);
		const safe_title = "[CoR] " + this.escape_text(title);
		const uid = this.generate_uid();

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

	static create_link(title, start, end, filename = "event.ics" ) {
		const ics = this.generate_ics(title, start, end);
		const safe_filename = filename.endsWith('.ics') ? filename : `${filename}.ics`;
		const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		return {"href": url, filename: safe_filename};
	}

	static delete_all_links() {
		// Free all the page link blobs, to free some memory
		const links = document.querySelectorAll('a[href^="blob:"]');
		links.forEach(link => {
			URL.revokeObjectURL(link.href);
		});
	}
}

const notify = new MyNotify("notify_bosses");
const time = new Time();

// date formatter
let dformatter = null;
let tformatter = null;

let next_respawns = null;
let previous_respawns = null;
let nextboss_ts = 0;
let notified_10m = false;
let last_notification_ts = 0;


// Bosses URL location for timeline view
const boss_images = {
	"daen": "data/bosses/daen.1.webp",
	"evendim": "data/bosses/evendim.1.webp",
	"thorkul": "data/bosses/thorkul.1.webp",
	"server": "data/bosses/server.1.webp"
};

function unixstamp2human(unixstamp) {
	return dformatter.format(new Date(unixstamp * 1000));
}

async function get_next_respawns() {
	if (document.hidden && !notify.can_emit())
		return;

	try {
		let data = BossesRespawns.get_schedule(4);
		next_respawns = data["next_spawns"];
		previous_respawns = data["prev_spawns"];
		nextboss_ts = data["next_boss_ts"];
		$("#boss-error").empty();
		const datetime = tformatter.format(Date.now());
		$("#bosses-info-updated").text(datetime);
	}
	catch (error) {
		$("#boss-error").text("Failed to calculate boss spawns: " + error);
		UITools.defer();
		return;
	}
}

// Per boss -- this also notifies
function display_next_respawn(boss) {
	$(`#boss-${boss}-lastspawn`).text(`${_("Last respawn")}: ${unixstamp2human(previous_respawns[boss])}`);
	let next_respawn_in = time.timestamp_ago(next_respawns[boss][0], false, true);
	$(`#boss-${boss}-nextspawn`).text(`${_("Next respawn in")} ${next_respawn_in.human}`);
	for (let i = 0; i < next_respawns[boss].length; i++) {
		const respawn_ts = next_respawns[boss][i];
		const respawn_datetime = new Date(respawn_ts * 1000);
		const uc_boss = boss[0].toUpperCase() + boss.slice(1);
		const cal = Calendar.create_link(uc_boss, respawn_ts, respawn_ts + 900,
			`${uc_boss}_${respawn_datetime.toISOString()}`);
		$(`#boss-${boss}-nextspawn-${i}`).text(unixstamp2human(respawn_ts));
		const cal_sel = $(`#boss-${boss}-nextspawn-${i}-calendar`);
		cal_sel.attr("href", cal["href"]);
		cal_sel.attr("download", cal["filename"]);
	}

	// Notifications
	let bossname = boss.charAt(0).toUpperCase() + boss.slice(1);
	if (next_respawn_in["days"] == 0 && next_respawn_in["hours"] == 0) {
		if (next_respawn_in["minutes"] <= 10 && next_respawn_in["minutes"] > 1 &&
		    notified_10m === false) {
			notify.emit(_("Bosses"), `${bossname}: ${_("Next respawn in")} ` +
				 `${next_respawn_in["minutes"]}${_("m")}`, "bosses");
			last_notification_ts = Date.now();
			notified_10m = true;
		}
		else if (next_respawn_in["minutes"] == 1) {
			// Avoid notification spam on focus during the last minute
			const now = Date.now();
			if (now > last_notification_ts + 60000) {
				notify.emit(_("Bosses"),`${bossname} ${_("should appear very soon!")}`, "bosses");
				last_notification_ts = now;
			}
			notified_10m = false;
		}
	}
}

function display_timeline() {
	let all_respawns = [];
	let server_count = 0;

	for (let boss in next_respawns) {
		const uc_boss = boss[0].toUpperCase() + boss.slice(1);
		// jshint -W083
		next_respawns[boss].forEach((ts) => {
			// We don't need more than 2 bosses (weekly vs 69h)
			if (boss === "server" && server_count >= 1) return;
			let dt = new Date(ts * 1000);
			all_respawns.push({
				img: boss_images[boss],
				name: uc_boss,
				ts: ts,
				cal: Calendar.create_link(uc_boss, ts, ts + 900,
				     `${uc_boss}_${dt.toISOString()}`)
			});
			if (boss === "server") server_count++;
		});
		// jshint +W083
	}

	// Sort by ascending time
	all_respawns.sort((a, b) => a.ts - b.ts);

	let rows = [];
	for (let spawn of all_respawns) {
		let dt = new Date(spawn["ts"] * 1000);
		rows.push(`<tr>
			<td><img src="${spawn.img}" title="${spawn.name}" style="height: 3ex">
			<td class="center">${dformatter.format(dt)}
			<td><a href="${spawn.cal.href}" download="${spawn.cal.filename}"
				class="addtocalendar" title="Add to Calendar">&#128197;</a>
			</tr>`);
	}
	return rows.join("");
}

async function refresh_display() {
	await get_next_respawns();
	Calendar.delete_all_links();

	// XXX Per boss
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
	}

	// XXX Timeline
	$("#boss-tl-table").html(display_timeline());

	// XXX Finally
	if (bosses_ordered.length > 0) { // if there was no error during fetch then
		UITools.unskeleton();
		UITools.defer();
	}
}

$(document).ready(function() {
	document.title = _("Bosses respawn times") + _(" - CoRT - Champions of Regnum tools");
	$("#title").text(_("Bosses respawn times"));
	$("#bosses-info-info").text(_("Last updated:"));
	$("#boss-per-boss-tab").text(_("Per boss"));
	$("#boss-tl-tab").text(_("Chronologic"));
	$("#tabs-title").text(_("View:"));
	Tabs.wire();

	const style = document.createElement("style");
	style.textContent = ".addtocalendar { text-decoration: none; }";
	document.head.appendChild(style);

	const lang = localStorage.getItem("lang") || navigator.language || "en-GB";
	const tz = localStorage.getItem("tz") || Intl.DateTimeFormat().resolvedOptions().timeZone;

	dformatter = new Intl.DateTimeFormat(localStorage.getItem("lang"), {
		timeZone: localStorage.getItem("tz"),
		hour12: false, weekday: 'long', month: 'long', day: 'numeric',
		hour: 'numeric', minute: 'numeric',
	});
	tformatter = new Intl.DateTimeFormat(localStorage.getItem("lang"), {
		timeZone: localStorage.getItem("tz"),
		hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
	});

	notify.insert_notification_link();
	refresh_display();
	$("#boss-info").show();
	const scheduler = new MyScheduler(0, 1, refresh_display);
	scheduler.start_scheduling();
});
