import {$} from "./libs/cortlibs.js";
import {_} from "../data/i18n.js";
import {Time} from "./wztools/wztools.js";

let time = new Time();
const df = new Intl.DateTimeFormat(localStorage.getItem("lang"), {
	timeZone: localStorage.getItem("tz"),
	weekday: 'short',
	day: 'numeric',
	month: 'numeric',
	year: '2-digit',
	hour: '2-digit',
	minute: '2-digit',
	hour12: false
})


// compute next event for a given type (either ticket or wm)
function next_event(type) {
	// reset times ([hour, minute], in UTC time)
	const times = {
		"tickets": [0, 5],
		"wm": [3, 0]
	};

	let now = new Date();
	let future_event = new Date();
	future_event.setUTCHours(times[type][0], times[type][1], 0, 0);
	if (future_event < now) // passed today, set as tomorrow
		future_event.setUTCDate(future_event.getUTCDate() + 1);
	return future_event;
}

function display() {
	for (let evtype of ["tickets", "wm"]) {
		const next_ev = next_event(evtype);
		const next_ev_ts = next_ev.getTime() / 1000;
		const next_ev_in = time.timestamp_ago(next_ev_ts)["human"];
		$(`#quests-${evtype}-countdown`).text(next_ev_in);
		$(`#quests-${evtype}-time`).text(df.format(next_ev));
	}
}

$(document).ready(function() {
	document.title = "CoRT - " + _("Quests Countdowns");
	$("#title").text(_("Quests Countdowns"));
	$("#quests-tickets-title").text(_("Tickets Delivery"));
	$("#quests-wm-title").text(_("Warmaster Quests Reset"));
	$("#quests-xym-title").text(_("Xymerald Quest Reset"));
	$("#quests-xym-interval").text(_("12 hours"));
	$("#quests-xym-text").text(_("after you completed the last one."));

	display();
	// Avoid flying emojis waiting for translations...
	for (let elem of ["wm", "tickets", "xym"])
		$(`#quests-${elem}`).show();

	setInterval(display, 60 * 1000);
});

