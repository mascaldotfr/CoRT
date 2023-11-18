/*
 * Copyright (c) 2022-2023 mascal
 *
 * CoRT is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * CoRT is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with CoRT.  If not, see <http://www.gnu.org/licenses/>.
 */

// The last respawn timestamp in UTC time
// You can update it by looking at your browser console and getting the last
// respawn timestamps. At least yearly, since the get_next_respawns() loop
// will run ~ 80 times/boss after all that time.
// Last checked: Eve: 2023-11-16, Daen: 2023-11-17, TK: 2023-08-30, Server: 2023-11-16 (+1800s)
first_respawns = { "thorkul": 1693428668,
		   "evendim": 1700158549,
		   "daen": 1699852489,
	           "server": 1700044200 };
next_respawns = { "evendim": [], "daen": [], "thorkul": [], "server": [] };
previous_respawns = first_respawns;
notified_10m = false;

function time_now() {
	return Math.floor(new Date().getTime() / 1000);
}

function unixstamp2human(unixstamp) {
	let dt = new Date(unixstamp * 1000);
	return dt.toLocaleDateString(localStorage.getItem("lang"), {
		hour12: false, weekday: 'long', month: 'long', day: 'numeric',
		hour: 'numeric', minute: 'numeric'});
}

function get_next_respawns(boss) {
	let tried_respawn = first_respawns[boss];
	let now = time_now();
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
	$(`#${boss} .lastspawn`).prepend(`<span class="faded"><i>${_("Last respawn")}:
		${unixstamp2human(previous_respawns[boss])}</i></span>`);
	for (let respawn in next_respawns[boss]) {
		let color = respawn == 0 ? "green" : "faded";
		$(`#${boss}_respawn`).append(`<p class="${color}"><b>
			${unixstamp2human(next_respawns[boss][respawn])}</b></p>`);
	}
	let next_respawn_in = {};
	let time_before_respawn = next_respawns[boss][0] - time_now();
	next_respawn_in.days = Math.floor(time_before_respawn / (24 * 3600));
	time_before_respawn -= next_respawn_in.days * 24 * 3600;
	next_respawn_in.hours = Math.floor(time_before_respawn / 3600);
	time_before_respawn -= next_respawn_in.hours * 3600;
	next_respawn_in.minutes = Math.floor(time_before_respawn / 60);
	for (let dt_elem in next_respawn_in) {
		next_respawn_in[dt_elem] = String(next_respawn_in[dt_elem]).padStart(2, "0");
	}
	// hide days and hours left if there is none of it
	next_respawn_in.days = next_respawn_in.days == "00" ? "" : next_respawn_in.days + _("d");
	next_respawn_in.hours = next_respawn_in.hours == "00" ? "" : next_respawn_in.hours + _("h");
	$(`#${boss}_countdown`).text(`${_("Next respawn in")}
		${next_respawn_in.days} ${next_respawn_in.hours} ${next_respawn_in.minutes}${_("m")}`);
	let bossname = boss.charAt(0).toUpperCase() + boss.slice(1);
	if (next_respawn_in.days == 0 && next_respawn_in.hours == 0) {
		if (next_respawn_in.minutes <= 10 && next_respawn_in.minutes >= 1 &&
		    notified_10m === false) {
			mynotify(_("Bosses status"), `${bossname}: ${_("Next respawn in")} ` +
				 `${next_respawn_in.minutes}${_("m")}`);
			notified_10m = true;
		}
		else if (next_respawn_in.minutes == 0) {
			mynotify(_("Bosses status"),`${bossname} ${_("should appear very soon!")}`);
			notified_10m = false;
		}
	}
}

function refresh_display() {
	let bosses_unordered = new Map()
	for (let boss in first_respawns) {
		$(`#${boss}_respawn`).empty();
		$(`#${boss} .lastspawn`).empty();
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
		$(`#${bosses_ordered[boss]}`).appendTo("#bosses_list");
	}
}

$(document).ready(function() {
	document.title = "CoRT - " + _("Bosses Countdown");
	$("#title").text(_("Bosses Countdown"));
	$("#bosses_info").text(_("The page refreshes itself every minute. Dates and times are in your timezone."));
	insert_notification_link();
	refresh_display();
});

setInterval(refresh_display, 60 * 1000)
