import {$, generate_calendar, insert_notification_link, mynotify} from "./libs/cortlibs.js";
import {_} from "../data/i18n.js";
import {Time} from "./wztools/wztools.js";

// wztools
let time = new Time();

// date formatter
let dformatter = null;

// The last respawn timestamp in UTC time
// You can update it by looking at your browser console and getting the last
// respawn timestamps. At least yearly, since the get_next_respawns() loop
// will run ~ 80 times/boss after all that time.
// Last checked: Eve: 2025-09-14, Daen: 2025-09-10, TK: 2025-10-01, Server: 2025-09-14 (+37m)
const first_respawns = { "thorkul": 1759352531,
			 "evendim": 1757842340,
			 "daen": 1757536010,
			 "server": 1757498400 + 37 * 60 };
let next_respawns = { "evendim": [], "daen": [], "thorkul": [], "server": [] };
let previous_respawns = first_respawns;
let notified_10m = false;

function unixstamp2human(unixstamp) {
	return dformatter.format(new Date(unixstamp * 1000));
}

function get_next_respawns(boss) {
	let tried_respawn = first_respawns[boss];
	let now = time.timestamp_now();
	let respawn_time = 0;
	while (true) {
		if (boss == "server")
			respawn_time = 168 * 3600; // 1 week
		else
			respawn_time = 109 * 3600; // 109 hours
		tried_respawn += respawn_time;
		if (tried_respawn >= now)
			next_respawns[boss].push(tried_respawn);
		if (next_respawns[boss].length == 3)
			break;
	}
	previous_respawns[boss] = next_respawns[boss][0] - respawn_time;
	console.log(boss, "previous respawn (to put in js file) is",
		previous_respawns[boss]);
}

function display_next_respawn(boss) {
	$(`#boss-${boss}-lastspawn`).text(`${_("Last respawn")}:
		${unixstamp2human(previous_respawns[boss])}`);
	let next_respawn_in = time.timestamp_ago(next_respawns[boss][0]);
	let next_respawns_html = `<li class="red bold">${_("Next respawn in")} ${next_respawn_in.human}</li>`;
	for (let respawn in next_respawns[boss]) {
		let calendar = generate_calendar(next_respawns[boss][respawn], boss, 900);
		let color = respawn == 0 ? "green" : "faded";
		next_respawns_html += `<li class="${color} bold">
			${unixstamp2human(next_respawns[boss][respawn])}
			<span class="addtocalendar">${calendar}</span></li>`;
	}
	$(`#boss-${boss}-respawn`).append(next_respawns_html);
	let bossname = boss.charAt(0).toUpperCase() + boss.slice(1);
	if (next_respawn_in["days"] == 0 && next_respawn_in["hours"] == 0) {
		if (next_respawn_in["minutes"] <= 10 && next_respawn_in["minutes"] >= 1 &&
		    notified_10m === false) {
			mynotify(_("Bosses status"), `${bossname}: ${_("Next respawn in")} ` +
				 `${next_respawn_in["minutes"]}${_("m")}`, "bosses");
			notified_10m = true;
		}
		else if (next_respawn_in["minutes"] == 0) {
			mynotify(_("Bosses status"),`${bossname} ${_("should appear very soon!")}`, "bosses");
			notified_10m = false;
		}
	}
}

function refresh_display() {
	let bosses_unordered = new Map();
	for (let boss in first_respawns) {
		$(`#boss-${boss}-lastspawn`).empty();
		$(`#boss-${boss}-respawn`).empty();
		next_respawns[boss] = [];
		get_next_respawns(boss);
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
	document.title = "CoRT - " + _("Bosses respawn countdown");
	$("#title").text(_("Bosses respawn countdown"));
	$("#boss-info").text(_("The page refreshes itself every minute."));
	dformatter = new Intl.DateTimeFormat(localStorage.getItem("lang"), {
		hour12: false, weekday: 'long', month: 'long', day: 'numeric',
		hour: 'numeric', minute: 'numeric', timeZone: localStorage.getItem("tz")
	});

	insert_notification_link();
	refresh_display();
});

setInterval(refresh_display, 60 * 1000);
