/*
 * tz.js: a tiny timezone chooser and manager
 * Note that your code must convert to the correct timezone for display.
 * On old browsers, it downgrades to UTC and local timezone only.
 * Released under the MIT License
 */


function get_system_tz() {
	return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function create_tz_list(selector) {
	let human_tzs = {};
	let storedtz = localStorage.getItem("tz");

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
	let target = document.querySelector(selector);
	target.innerHTML = options;
	target.addEventListener("change", function (x) {
		localStorage.setItem("tz", target.value);
		location.reload();
	});

	if (storedtz === undefined || Object.values(human_tzs).indexOf(storedtz) < 0)
		storedtz = get_system_tz();
	localStorage.setItem("tz", storedtz);
	target.value = storedtz;
}
