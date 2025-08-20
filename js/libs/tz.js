/*
 * tz.js: a tiny timezone chooser and manager
 * Note that your code must convert to the correct timezone for display.
 * On old browsers, it downgrades to UTC and local timezone only.
 * Released under the MIT License
 */


function get_system_tz() {
	let tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
	if (tz === undefined) {
		let offset = new Date().getTimezoneOffset() / 60;
		let sign = offset < 0 ? "+" : "-";
		offset = Math.abs(offset);//.toString().padStart(2, "0");
		tz = `Etc/GMT${sign}${offset}`;
	}
	return tz;
}

function display_tz_list(selector, options, storedtz) {
	let target = document.querySelector(selector);
	target.innerHTML = options;
	target.addEventListener("change", function (x) {
		localStorage.setItem("tz", target.value);
		location.reload();
	});
	target.value = storedtz;
}

export function create_tz_list(selector) {

	let human_tzs = {};
	let now = Date.now();
	let cache_duration = 1000 * 3600 * 24 * 7; // 7-day cache
	let storedtz = localStorage.getItem("tz");
	let cached_tz_list = localStorage.getItem("tzlisthtml");
	let cached_tz_list_ts = localStorage.getItem("tzlisthtmlts");

	// Cache HIT
	if (cached_tz_list != null && cached_tz_list_ts != null &&
	    now - cached_tz_list_ts <= cache_duration) {
		display_tz_list(selector, cached_tz_list, storedtz);
		return;
	}

	// Cache MISS
	console.info("create_tz_list: cache timeout");
	localStorage.setItem("tzlisthtmlts", now);

	try {
		for (let tz of Intl.supportedValuesOf("timeZone")) {
			let humantz = tz.replace(/^[^\/]+\//, "");
			human_tzs[humantz] = tz;
		}
	}
	catch (_unused) {
		// compat with old browsers
		let localtz = get_system_tz();
		let shorttz = localtz.replace(/^[^\/]+\//, "");
		human_tzs[shorttz] = localtz;
	}
	human_tzs["UTC"] = "UTC";
	human_tzs["Local"] = get_system_tz();

	let options = "";
	for (let tz of Object.keys(human_tzs).sort())
		options += `<option value="${human_tzs[tz]}">${tz}</option>`;

	if (storedtz === undefined || Object.values(human_tzs).indexOf(storedtz) < 0)
		storedtz = get_system_tz();
	localStorage.setItem("tz", storedtz);

	display_tz_list(selector, options, storedtz);

	localStorage.setItem("tzlisthtml", options)
}
