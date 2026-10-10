class ApiURL {
	// This class allows you to easily switch the data sources and urls if you
	// don't want use cort.ovh  and my data. If you git pull,
	// don't forget to copy this file in a temp directory and copying it back after
	// the pull!

	constructor() {
		this.base = "";
		this.cdn_base = "";
		this.frontsite = "";
		let official = ["cort.ovh"];

		// Define base_urls
		if (official.includes(window.location.hostname)) {
			this.frontsite = "https://cort.ovh";
			this.base = "https://cort.ovh/api";
			// For submitting setups only, due to CDN usage
			this.trainer_base = "https://api.cort.ovh";
		}
		else {
			// If you keep everything under the same directory and
			// domain, things are done magically. Typically self hosting.
			const path = window.location.pathname;
			const base_path = path.substring(0, path.lastIndexOf('/') + 1);
			const base_url = window.location.origin + base_path;
			this.base = base_url + "api";
			this.trainer_base = this.base;
			this.frontsite = window.location.origin;
		}


		this.urls = {
			"submit_trainer": `${this.trainer_base}/bin/collect/submit.php`,

			"trainer_data_stats": `${this.base}/var/trainerstats.json`,
			"events": `${this.base}/var/events.json`,
			"stats": `${this.base}/var/stats.json`,
			"wstatus": `${this.base}/var/wstatus.json`,
			"events_dump": `${this.base}/var/events_dump.csv`,
			"maintenance": `${this.base}/var/maintenance.txt`,
		};
	}
}
export const api = new ApiURL();
