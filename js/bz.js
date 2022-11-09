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

// XXX ALL TIMES ARE UTC INTERNALLY
// SUNDAY = 0 SATURDAY = 6

bz_begin = [ 	[13, 18],
		[3, 13, 20],
		[13, 18],
		[12, 20],
		[3, 13, 18],
		[13, 20],
		[3, 13, 20] 	];
		
bz_end = [	[16, 21],
		[6, 16, 23],
		[16, 21],
		[16, 23],
		[6, 16, 21],
		[16, 23],
		[6, 16, 23] 	];


function future_date(in_day, at_hour) {
	d = new Date();
	return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), parseInt(d.getUTCDate()) + parseInt(in_day),
		        at_hour, 0, 0);
}

function mstohhmmss(ms) {
	hms = { "hours": 0, "minutes": 0, "seconds": 0 };
	seconds = ms / 1000;
	hms.hours = Math.floor(seconds / 3600);
	seconds -= hms.hours * 3600;
	hms.minutes = Math.floor(seconds / 60);
	seconds -= hms.minutes * 60;
	hms.seconds = Math.floor(seconds);
	for (hms_element in hms) {
		hms[hms_element] = String(hms[hms_element]).padStart(2, "0");
	}
	return hms;
}

function date_difference_from_now(future_date) {
	future_date = new Date(future_date);
	current_date = new Date();
	return mstohhmmss((future_date.getTime() - current_date.getTime()));
}

function feed_bz() {
	next_bzs_begin = [];
	next_bzs_end = [];
	bz_on = false;
	bz_ends_at = 0;
	$("#bz_status").empty();
	$("#next_bz").empty();
	$("#future_bzs").empty();

	current_date = new Date();
	current_day = parseInt(current_date.getUTCDay());
	current_hour = parseInt(current_date.getUTCHours());
	tomorrow = current_day + 1 <= 6 ? current_day + 1 : 0;
	// is bz on ?
	for (let hour in bz_begin[current_day]) {
		if (current_hour >= bz_begin[current_day][hour] &&
		    current_hour < bz_end[current_day][hour] ) {
			bz_on = true;
			bz_ends_at = date_difference_from_now(future_date(0, bz_end[current_day][hour]));
			break;
		}
	}
	// compute future bzs
	future_bz_days = [current_day, tomorrow];
	for (const day of future_bz_days) {
		for (let hour in bz_begin[day]) {
			if (day == current_day && parseInt(bz_begin[day][hour]) <= current_hour) {
				// skip passed or current bz of the day
				continue;
			}
			next_bzs_begin.push(future_date(future_bz_days.indexOf(day), bz_begin[day][hour]));
			next_bzs_end.push(future_date(future_bz_days.indexOf(day), bz_end[day][hour]));
		}
	}
	
	if (bz_on) {
		$("#bz_status").html(`<span class="green"><b>ON</b></span>`);
		$("#next_bz").text(`Ends in ${bz_ends_at.hours}:${bz_ends_at.minutes}:${bz_ends_at.seconds}`);
	}
	else {
		$("#bz_status").html(`<span class="red"><b>OFF</b></span>`);
		next_bz_in = date_difference_from_now(next_bzs_begin[0]);
		$("#next_bz").text(`Next BZ in ${next_bz_in.hours}:${next_bz_in.minutes}:${next_bz_in.seconds}`);
	}
	for (next_bz in next_bzs_begin) {
		bz_begin_date = new Date(next_bzs_begin[next_bz]);
		bz_end_date = new Date(next_bzs_end[next_bz]);
		date_options = {
			hour12: false, weekday: 'long', month: 'long', day: 'numeric',
			hour: '2-digit', minute: '2-digit'};
		interval = `<li>${bz_begin_date.toLocaleDateString("en-GB", date_options)} - 
			    ${String(bz_end_date.getHours()).padStart(2, "0")}:${String(bz_end_date.getMinutes()).padStart(2, "0")}</li>`
		$("#future_bzs").append(interval);
	}

	//console.log("bz is on?", bz_on, "bz_ends_at?", bz_ends_at, "next bz in", next_bz_in);
}

$(document).ready(function() {
	feed_bz();
});

setInterval(feed_bz, 1000)
