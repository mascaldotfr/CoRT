import {_} from "../libs/i18n.js";

// Return the current time as a Unix timestamp
export function timestamp_now() {
	return Math.floor(new Date().getTime() / 1000);
}

// Take a unix timestamp as entry, and humanise the time left until that
// timestamp. If you want passed time instead, use "passed=true"
// Return an associate arrays with the individual time markers, and a
// humanised/localised version of it.
export function timestamp_ago(ts, passed=false) {
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

