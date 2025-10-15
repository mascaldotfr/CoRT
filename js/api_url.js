import {_} from "../data/i18n.js";
// This file allows you to easily switch the data sources and urls if you
// don't want use the github site and my data. You may need to fiddle with paths
// since my api base has not the same structure than the repo. If you git pull,
// don't forget to copy this file in a temp directory and copying it back after
// the pull!

// You will also need to change the preload directives in some
// wz/wevents/wstats/tstats, or remove them if the API server and the server
// you serve the pages is the same.

function get_paths() {
	// https://mascaldotfr.github.io/CoRT uses an external API server as an exception
	if (window.location.hostname === "mascaldotfr.github.io") {
		let api = {};
		// The root where all API files can be found
		api["base"] = "https://cort.thebus.top/api";
		// Used by the trainer to filter setup submissions
		api["frontsite"] = "https://mascaldotfr.github.io";
		// Subdirectory where the HTML/JS/CSS/etc. files are placed, relative to your
		// www root with the leading '/'
		api["frontsite_dir"] = "/CoRT";
		return api;
	}
	else {
		// If you keep everything under the same directory and
		// domain, things are done magically
		const path = window.location.pathname;
		const base_path = path.substring(0, path.lastIndexOf('/') + 1);
		const base_url = window.location.origin + base_path;
		let api = {};
		api["base"] = base_url + "api";
		api["frontsite"] = window.location.origin;
		api["frontsite_dir"] = base_path;
		return api;
	}
}

let paths = get_paths();
export const __api__base = paths["base"];
export const __api__frontsite = paths["frontsite"];
export const __api__frontsite_dir = paths["frontsite_dir"];

export const __api__urls = {
	"submit_trainer": `${__api__base}/bin/collect/submit.php`,
	"trainer_data": `${__api__base}/var/trainer_saved_setups.txt`,
	"trainer_data_stats": `${__api__base}/bin/collect/trainer_stats.php`,
	"events": `${__api__base}/var/allevents.json`,
	"events_dump": `${__api__base}/bin/warstatus/stats/dump_generator.php`,
	"stats": `${__api__base}/var/statistics.json`,
	"wstatus": `${__api__base}/var/warstatus.json`,
	"bosses": `${__api__base}/bin/bosses/bosses.php`,
	"bz": `${__api__base}/bin/bz/bz.php`
};
