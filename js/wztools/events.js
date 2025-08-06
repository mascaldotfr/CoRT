import {_} from "../libs/i18n.js";
import {get_realm_colors} from "./constants.js";
import {translate_fort} from "./translate_forts.js";

// id is the (x) thing at the end of each fortification
// notify allows to return an array with the events without coloration if > 0
// (unix timestamp from the last event) for use in a desktop notification
export function humanise_events(events, has_id=true, notify=0)  {
	let events_html = "";
	let events_notify = "";
	let realm_colors = get_realm_colors();
	for (let anevent of events) {
		let dt = new Date(anevent["date"] * 1000);
		let tz = localStorage.getItem("tz");
		let date_options = {
			month: 'numeric', day: 'numeric',
			hour: '2-digit', minute: '2-digit', timeZone: tz };
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
				events_html += `${relic} ${_("is back.")}`;
				if (notify > 0 && anevent["date"] >= notify)
					events_notify += `${relic_notify} ${_("is back.")}\n`;
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


