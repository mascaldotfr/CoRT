import {__api__urls} from "./api_url.js";
import {$, generate_calendar, insert_notification_link, mynotify} from "./libs/cortlibs.js";
import {_} from "../data/i18n.js";
import {Time} from "./wztools/wztools.js";

// wztools
let time = new Time();

// date formatter
let dformatter = null;

let next_respawns = null;
let previous_respawns = null;
let nextboss_ts = 0;
let notified_10m = false;
let last_run = 0;

function unixstamp2human(unixstamp) {
	return dformatter.format(new Date(unixstamp * 1000));
}

async function get_next_respawns() {
	try {
		let data = await $().getJSON(__api__urls["bosses"]);
		next_respawns = data["next_spawns"];
		previous_respawns = data["prev_spawns"];
		nextboss_ts = data["next_boss_ts"];
		$("#boss-error").empty();
	}
	catch (error) {
		$("#boss-error").html("Failed to get the next bosses spawns: " + error)
		return;
	}
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

async function refresh_display() {

	// Prevent repeated execution if focus fires multiple times on wake-up
	let ts = Date.now();
	if (ts < last_run + 1000)
		return;
	else
		last_run = ts;

	// Fetch API data only if needed
	if (Date.now() / 1000 > nextboss_ts)
		await get_next_respawns();

	let bosses_unordered = new Map();
	for (let boss in next_respawns) {
		$(`#boss-${boss}-lastspawn`).empty();
		$(`#boss-${boss}-respawn`).empty();
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

	// Always ensure we have fresh countdown values, especially on mobile.
	// refresh_display decide if we also need to call the API.
	window.addEventListener("focus", refresh_display);
	window.addEventListener("visibilitychange", () => {
		// In case the page is not focused, but another UI element of it
		if (!document.hidden)
			refresh_display();
	});
});

setInterval(refresh_display, 60 * 1000);
