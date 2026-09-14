import {_} from "./i18n.js";
export class Time {
	// Return the current time as a Unix timestamp
	timestamp_now() {
		return Math.floor(new Date().getTime() / 1000);
	}
	// Same as timestamp_now, but floor to the minute start
	timestamp_floor() {
		return Math.floor(this.timestamp_now() / 60) * 60;
	}
	// Take a unix timestamp as entry, and humanise the time left until that
	// timestamp. If you want passed time instead, use "passed=true"
	// if floor is set to true, the timestamp will use the minute timestamp
	// Return an associate arrays with the individual time markers, and a
	// humanised/localised version of it.
	timestamp_ago(ts, passed=false, floor=false) {
		let _in = {};
		let time_diff = 0;
		if (ts === null)
			return {"human":null, "days":null, "hours":null, "minutes": null};
		let now = floor ? this.timestamp_floor() : this.timestamp_now();
		if (passed)
			time_diff = now - ts;
		else
			time_diff = ts - now;
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
}

