respawn_time = 109 * 3600;   // 109 hours
// As of 2022-10-29 here are the last respawn timestamp in UTC time.
// You can update it by looking at your browser console and getting the last
// respawn timestamps. At least yearly, since the get_next_respawns() loop
// will run 80 times/boss after all that time.
first_respawn = { "thorkul": 1666745040, "evendim": 1666803900, "daen": 1666890420 };
next_respawns = { "thorkul": [], "evendim": [], "daen": [] };

function time_now() {
	return Math.floor(new Date().getTime() / 1000);
}

function get_next_respawns(boss) {
	tried_respawn = first_respawn[boss];
	now = time_now();
	while (true) {
		tried_respawn += respawn_time;
		if (tried_respawn >= now)
			next_respawns[boss].push(tried_respawn);
		if (next_respawns[boss].length == 3)
			break;
	}
	console.log(boss, "previous respawn (to put in js file) is",
		next_respawns[boss][0] - respawn_time);
}

function display_next_respawn(boss) {
	for (respawn in next_respawns[boss]) {
		respawn_dt = new Date(next_respawns[boss][respawn] * 1000);
		dayname = respawn_dt.toLocaleDateString("en", { 
			hour12: false, weekday: 'long', month: 'long', day: 'numeric',
			hour: 'numeric', minute: 'numeric'}); 
		if (respawn == 0) {
			$(`#${boss}_respawn`).append(`<p class="green"><b>${dayname}</b></p>`);
		}
		else {
			$(`#${boss}_respawn`).append(`<p class="faded">${dayname}</p>`);
		}
	}
	next_respawn_in = {};
	time_before_respawn = next_respawns[boss][0] - time_now();
	next_respawn_in.days = Math.floor(time_before_respawn / (24 * 3600));
	time_before_respawn -= next_respawn_in.days * 24 * 3600;
	next_respawn_in.hours = Math.floor(time_before_respawn / 3600);
	time_before_respawn -= next_respawn_in.hours * 3600;
	next_respawn_in.minutes = Math.floor(time_before_respawn / 60);
	for (date_elem in next_respawn_in) {
		next_respawn_in[date_elem] = String(next_respawn_in[date_elem]).padStart(2, "0");
	}
	$(`#${boss}_countdown`).text(`Next respawn in ${next_respawn_in.days}d ${next_respawn_in.hours}h ${next_respawn_in.minutes}m`);
}

function refresh_display() {
    for (boss in first_respawn) {
    	    $(`#${boss}_respawn`).empty();
	    next_respawns[boss] = [];
	    get_next_respawns(boss);
	    display_next_respawn(boss);
    }
}

$(document).ready(function() {
	refresh_display();
});

setInterval(refresh_display, 60 * 1000)
