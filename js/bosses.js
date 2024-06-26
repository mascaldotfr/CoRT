import {$} from "./libs/lamaiquery.js";
import {_} from "./libs/i18n.js";
import {insert_notification_link, mynotify} from "./libs/notify.js";
import {generate_calendar} from "./libs/calendar.js";
import {timestamp_now, timestamp_ago} from "./wztools/time.js";
import {__api__base} from "./api_url.js"; // XXX AQUAMAN

// The last respawn timestamp in UTC time
// You can update it by looking at your browser console and getting the last
// respawn timestamps. At least yearly, since the get_next_respawns() loop
// will run ~ 80 times/boss after all that time.
// Last checked: Eve: 2024-05-11, Daen: 2024-05-11, TK: 2024-05-11, Server: 2024-05-11 (+37m)
// XXX AQUAMAN TBD
const first_respawns = { "thorkul": 1715403300,
			 "evendim": 1715462390,
			 "daen": 1715156280,
			"aquaman": 1717858800,
			 "server": 1715162400 + 37 * 60 };
let next_respawns = { "evendim": [], "daen": [], "thorkul": [], "server": [] };
let previous_respawns = first_respawns;
let notified_10m = false;

function unixstamp2human(unixstamp) {
	let dt = new Date(unixstamp * 1000);
	let lang = localStorage.getItem("lang");
	let tz = localStorage.getItem("tz");
	return dt.toLocaleDateString(lang, {
		hour12: false, weekday: 'long', month: 'long', day: 'numeric',
		hour: 'numeric', minute: 'numeric', timeZone: tz});
}

function get_next_respawns(boss) {
	let tried_respawn = first_respawns[boss];
	let now = timestamp_now();
	let respawn_time = 0;
	while (true) {
		if (boss == "server")
			respawn_time = 168 * 3600; // 1 week
		else if (boss == "aquaman")
			respawn_time = 22.5 * 3600;
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
	if (boss != "aquaman")
		return;
	for (let i of [...Array(22).keys()]) {
		let prevprevprev = new Date((previous_respawns["aquaman"] - respawn_time * i) * 1000);
		console.log("[DEBUG]", "prevprevprev respawn: ", prevprevprev);
	}
}

function display_next_respawn(boss) {
	$(`#boss-${boss}-lastspawn`).prepend(`<span class="faded"><i>${_("Last respawn")}:
		${unixstamp2human(previous_respawns[boss])}</i></span>`);
	for (let respawn in next_respawns[boss]) {
		let calendar = generate_calendar(next_respawns[boss][respawn], boss, 900);
		let color = respawn == 0 ? "green" : "faded";
		$(`#boss-${boss}-respawn`).append(`<p class="${color}"><b>
			${unixstamp2human(next_respawns[boss][respawn])}</b>${calendar}</p>`);
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
		$("#boss-aquaman-ask").empty(); // XXX AQUAMAN
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
	// XXX AQUAMAN
	$("#boss-aquaman-ask").append(`
		<p class="faded italic">${_("All times are estimates for now, help me improve it!")}</p>
		<p><b class="red"> ${_("I've just seen Aquaman in...")}</b></p>`);
	for (let realm of ["Alsius", "Ignis", "Syrtis"]) {
		$("#boss-aquaman-ask").append(`<p><button id="aquaman_${realm}">${realm}</button></p>`);
		$(`#aquaman_${realm}`).on("click", (event) => {
			let realm = event.target.innerText;
			let dummy = $().get(__api__base + "/aquaman/" + realm);
			window.alert(_("Thank you for telling me you've seen Aquaman in %s!", realm));
		});
	}
}

$(document).ready(function() {
	document.title = "CoRT - " + _("Bosses Countdown");
	$("#title").text(_("Bosses Countdown"));
	$("#boss-info").text(_("The page refreshes itself every minute."));

	insert_notification_link();
	refresh_display();
});

setInterval(refresh_display, 60 * 1000)
