import {$} from "./libs/lamaiquery.js";
import {_} from "./libs/i18n.js";
import {insert_notification_link, mynotify} from "./libs/notify.js";
import {timestamp_now, timestamp_ago} from "./wztools/time.js";

// The last respawn timestamp in UTC time
// You can update it by looking at your browser console and getting the last
// respawn timestamps. At least yearly, since the get_next_respawns() loop
// will run ~ 80 times/boss after all that time.
// Last checked: Eve: 2024-02-24, Daen: 2024-02-25, TK: 2024-02-24, Server: 2024-02-25 (+37m)
const first_respawns = { "thorkul": 1708732423,
		   	 "evendim": 1708791467,
			 "daen": 1708877797,
			 "server": 1708509600 + 37 * 60 };
let next_respawns = { "evendim": [], "daen": [], "thorkul": [], "server": [] };
let previous_respawns = first_respawns;
let notified_10m = false;

function unixstamp2human(unixstamp) {
	let dt = new Date(unixstamp * 1000);
	return dt.toLocaleDateString(localStorage.getItem("lang"), {
		hour12: false, weekday: 'long', month: 'long', day: 'numeric',
		hour: 'numeric', minute: 'numeric'});
}

function get_next_respawns(boss) {
	let tried_respawn = first_respawns[boss];
	let now = timestamp_now();
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
	$(`#boss-${boss}-lastspawn`).prepend(`<span class="faded"><i>${_("Last respawn")}:
		${unixstamp2human(previous_respawns[boss])}</i></span>`);
	for (let respawn in next_respawns[boss]) {
		let color = respawn == 0 ? "green" : "faded";
		$(`#boss-${boss}-respawn`).append(`<p class="${color}"><b>
			${unixstamp2human(next_respawns[boss][respawn])}</b></p>`);
	}
	let next_respawn_in = timestamp_ago(next_respawns[boss][0]);
	$(`#boss-${boss}-countdown`).text(`${_("Next respawn in")} ${next_respawn_in.human}`);
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
	let bosses_unordered = new Map()
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
	document.title = "CoRT - " + _("Bosses Countdown");
	$("#title").text(_("Bosses Countdown"));
	$("#boss-info").text(_("The page refreshes itself every minute. Dates and times are in your timezone."));
	insert_notification_link();
	refresh_display();
});

setInterval(refresh_display, 60 * 1000)
