/*
 * Copyright (c) 2022-2024 mascal
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

/* Various common tools */

// Return the current time as a Unix timestamp
function timestamp_now() {
	return Math.floor(new Date().getTime() / 1000);
}

// Take a unix timestamp as entry, and humanise the time left until that
// timestamp. If you want passed time instead, use "passed=true"
// Return an associate arrays with the individual time markers, and a
// humanised/localised version of it.
function timestamp_ago(ts, passed=false) {
	let _in = {};
	let time_diff = 0;
	if (ts === null)
		return {"human":null, "days":null, "hours":null, "minutes": null};
	if (passed)
		time_diff = timestamp_now() - ts;
	else
		time_diff = ts - timestamp_now();
	_in["days"] = Math.floor(time_diff / (24 * 3600));
	time_diff -= _in["days"] * 24 * 3600;
	_in["hours"] = Math.floor(time_diff / 3600);
	time_diff -= _in["hours"] * 3600;
	_in["minutes"] = Math.floor(time_diff / 60);
	_in["human"] = "";
	for (let dt_elem in _in) {
		if (_in[dt_elem] == 0 || dt_elem == "human")
			continue; // don't count empty values and human version
		_in["human"] += String(_in[dt_elem]).padStart(2, "0") + _(dt_elem[0]) + " ";
	}
	if (_in["human"] == "")
		_in["human"] = "00" + _("m"); // very fresh timestamp
	if (passed)
		_in["human"] = _("%s ago", _in["human"]);
	return _in;
}

// id is the (x) thing at the end of each fortification
// notify allows to return an array with the events without coloration if > 0
// (unix timestamp from the last event) for use in a desktop notification
function humanise_events(events, has_id=true, notify=0)  {
	events_html = "";
	events_notify = "";
	realm_colors = get_realm_colors();
	for (let anevent of events) {
		let dt = new Date(anevent["date"] * 1000);
		let date_options = {
			month: 'numeric', day: 'numeric',
			hour: '2-digit', minute: '2-digit' };
		let datetime = dt.toLocaleDateString(undefined, date_options);
		let owner = anevent["owner"];
		let owner_color = realm_colors[owner];
		let location_color = realm_colors[anevent["location"]];
		let captured = anevent["name"];
		let captured_notify = anevent["name"];
		let dt_color = anevent["type"] == "wish" ? location_color: "";
		events_html += `<b class="${dt_color}">${datetime}</b>&nbsp;`;
		if (anevent["type"] == "fort" || anevent["type"] == "gem") {
			let location_color = realm_colors[anevent["location"]];
			if (anevent["type"] == "fort") {
				captured = translate_fort(captured, has_id);
				captured_notify = captured;
				if (has_id === true) {
					captured = captured.substring(0, captured.lastIndexOf(" "));
					captured_notify = captured;
				}
			}
			else if (anevent["type"] == "gem") {
				captured = `${_("Gem")} #${captured}`;
				captured_notify = `${captured} [${anevent["location"]}]`;
			}
			let target = `<span class="${location_color} bold">${captured}</span>`;
			let action;
			let action_notify;
			if (anevent["location"] == anevent["owner"]) {
				action = _("has recovered %s", target);
				action_notify = _("has recovered %s", captured_notify);
			}
			else {
				action = _("has captured %s", target);
				action_notify = _("has captured %s", captured_notify);
			}
			events_html += `<span class="${owner_color} bold">${owner}</span> ${action}.`;
			if (notify > 0 && anevent["date"] >= notify)
				events_notify += `${owner} ${action_notify}\n`;
		}
		else if (anevent["type"] == "relic") {
			let location_color = realm_colors[anevent["owner"]];
			let relic = `<span class="${location_color} bold">${_("%s's relic", captured)}</span>`;
			let relic_notify = `${_("%s's relic", captured)}`;
			if (anevent["location"] == "altar") {
				events_html += `${relic} ${_("is back to its altar.")}`;
				if (notify > 0 && anevent["date"] >= notify)
					events_notify += `${relic_notify} ${_("is back to its altar.")}\n`;
			}
			else {
				events_html += `${relic} ${_("is in transit.")}`;
				if (notify > 0 && anevent["date"] >= notify)
					events_notify += `${relic_notify} ${_("is in transit.")}\n`;
			}
		}
		else if (anevent["type"] == "wish") {
			let sentence = _("%s made a dragon wish!", anevent["location"]);
			events_html += `<span class="${location_color} bold">${sentence}</span>`;
			if (notify > 0 && anevent["date"] >= notify)
				events_notify += sentence + "\n";
		}
		events_html += `<br>`;
	}
	if (notify > 0)
		return [events_html, events_notify];
	return events_html;
}

// Create translatable strings according to english order of words
// id is the (x) thing at the end of each fortification,
function translate_fort(fort, has_id=true) {
	let words = fort.split(" ");
	let fort_id;
	let fort_name;
	let fort_type;
	if (has_id === true)
		fort_id = words.pop();
	if (words[1] == "Castle") {
		fort_name = words.shift();
		fort_type = "%s " + words.join(" ");
	}
	else {
		fort_name = words.pop();
		fort_type = words.join(" ") + " %s";
	}
	let translated = _(fort_type, fort_name)
	if (fort_id !== undefined)
		translated += ` ${fort_id}`;
	return translated;
}

function get_realm_colors() {
	return {"Alsius": "blue", "Ignis": "red", "Syrtis": "green"};
}

// Same order as the website
function get_realms() {
	return ["Alsius", "Ignis", "Syrtis"];
}
