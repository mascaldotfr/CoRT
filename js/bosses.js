/*
 * Copyright (c) 2022 mascal
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

respawn_time = 109 * 3600;   // 109 hours
// As of 2022-10-29 here are the last respawn timestamp in UTC time.
// You can update it by looking at your browser console and getting the last
// respawn timestamps. At least yearly, since the get_next_respawns() loop
// will run ~ 80 times/boss after all that time.
first_respawns = { "thorkul": 1677732240, "evendim": 1677791100, "daen": 1677485220 };
next_respawns = { "evendim": [], "daen": [], "thorkul": [] };
previous_respawns = first_respawns;

function time_now() {
	return Math.floor(new Date().getTime() / 1000);
}

function unixstamp2human(unixstamp) {
	dt = new Date(unixstamp * 1000);
	return dt.toLocaleDateString("en-GB", {
		hour12: false, weekday: 'long', month: 'long', day: 'numeric',
		hour: 'numeric', minute: 'numeric'});
}

function get_next_respawns(boss) {
	tried_respawn = first_respawns[boss];
	now = time_now();
	while (true) {
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
	$(`#${boss} .lastspawn`).prepend(`<span class="faded"><i>Last respawn:
		${unixstamp2human(previous_respawns[boss])}</i></span>`);
	for (respawn in next_respawns[boss]) {
		color = respawn == 0 ? "green" : "faded";
		$(`#${boss}_respawn`).append(`<p class="${color}"><b>
			${unixstamp2human(next_respawns[boss][respawn])}</b></p>`);
	}
	next_respawn_in = {};
	time_before_respawn = next_respawns[boss][0] - time_now();
	next_respawn_in.days = Math.floor(time_before_respawn / (24 * 3600));
	time_before_respawn -= next_respawn_in.days * 24 * 3600;
	next_respawn_in.hours = Math.floor(time_before_respawn / 3600);
	time_before_respawn -= next_respawn_in.hours * 3600;
	next_respawn_in.minutes = Math.floor(time_before_respawn / 60);
	for (dt_elem in next_respawn_in) {
		next_respawn_in[dt_elem] = String(next_respawn_in[dt_elem]).padStart(2, "0");
	}
	// hide days and hours left if there is none of it
	next_respawn_in.days = next_respawn_in.days == "00" ? "" : next_respawn_in.days + "d";
	next_respawn_in.hours = next_respawn_in.hours == "00" ? "" : next_respawn_in.hours + "h";
	$(`#${boss}_countdown`).text(`Next respawn in
		${next_respawn_in.days} ${next_respawn_in.hours} ${next_respawn_in.minutes}m`);
}

function refresh_display() {
	bosses_unordered = new Map()
	for (boss in first_respawns) {
		$(`#${boss}_respawn`).empty();
		$(`#${boss} .lastspawn`).empty();
		next_respawns[boss] = [];
		get_next_respawns(boss);
		display_next_respawn(boss);
		// fetch all next respawns
		bosses_unordered.set(boss, next_respawns[boss][0]);
	}
	// sort by respawn time
	bosses_ordered = new Map([...bosses_unordered.entries()].sort((a, b) => a[1] - b[1]));
	// need only the bosses names
	bosses_ordered = [...bosses_ordered.keys()];
	// reorder the boss divs
	for (boss in bosses_ordered) {
		$(`#${bosses_ordered[boss]}`).appendTo("#bosses_list");
	}
}


$(document).ready(function() {
	refresh_display();
});

setInterval(refresh_display, 60 * 1000)
