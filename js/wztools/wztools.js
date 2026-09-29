import {_} from "../../js/libs/i18n.js";

export const Constants = {
	realm_colors: { "Alsius": "blue", "Ignis": "red", "Syrtis": "green" },
	realm_names: ["Alsius", "Ignis", "Syrtis"]
};

export class HumaniseEvents {
	constructor() {
		// Instantiate heavy formatters and helpers ONCE per page load
		let tz = localStorage.getItem("tz") || Intl.DateTimeFormat().resolvedOptions().timeZone;
		this.dformatter = new Intl.DateTimeFormat(undefined, {
			month: 'numeric', day: 'numeric',
			hour: '2-digit', minute: '2-digit', timeZone: tz,
			hour12: false
		});
	}

	// id is the (x) thing at the end of each fortification
	// notify allows to return an array with the events without coloration if > 0
	// (unix timestamp from the last event) for use in a desktop notification

	humanise_events(events, has_id=true, notify=0)  {
		let events_html = [];
		let events_notify = [];

		for (let anevent of events) {
			let dt = new Date(anevent["date"] * 1000);
			let datetime = this.dformatter.format(dt);
			let owner_color = Constants.realm_colors[anevent["owner"]];
			let location_color = Constants.realm_colors[anevent["location"]];
			let captured = anevent["name"];
			let captured_notify = anevent["name"];
			let dt_color = anevent["type"] == "wish" ? location_color: "";
			events_html.push(`<li><span class="${dt_color} bold small faded">${datetime}</span>&nbsp;`);
			if (anevent["type"] == "fort" || anevent["type"] == "gem") {
				let location_color = Constants.realm_colors[anevent["location"]];
				if (anevent["type"] == "fort") {
					captured = CleanForts.clean(captured, has_id);
					if (has_id === true) {
						captured = captured.substring(0, captured.lastIndexOf(" "));
						if (notify > 0)
							captured_notify = captured;
					}
				}
				else if (anevent["type"] == "gem") {
					captured = `${_("Gem")} #${captured}`;
					if (notify > 0)
						captured_notify = `${captured} [${anevent["location"]}]`;
				}
				let target = `<span class="${location_color} bold">${captured}</span>`;
				let emoji = "";
				let action;
				let action_notify;
				if (anevent["type"] == "gem")
					emoji = EventLogIcons.gem;
				if (anevent["location"] == anevent["owner"]) {
					if (anevent["type"] == "fort" && anevent["name"].startsWith("Great Wall of")) {
						action = _("has been reconquered");
						emoji = EventLogIcons.dove;
						if (notify > 0)
							action_notify = _("has been reconquered");
					}
					else {
						action = _("has recovered %s", target);
						if (notify > 0)
							action_notify = _("has recovered %s", captured_notify);
					}
				}
				else {
					if (anevent["type"] == "fort" && anevent["name"].startsWith("Great Wall of")) {
						action = _("has invaded %s", target);
						emoji = EventLogIcons.eagle;
						if (notify > 0)
							action_notify = _("has invaded %s", captured_notify);
					}
					else {
						action = _("has captured %s", target);
						if (notify > 0)
							action_notify = _("has captured %s", captured_notify);
					}
				}
				events_html.push(`${emoji}<span class="${owner_color} bold">${anevent["owner"]}</span> ${action}`);
				if (notify > 0 && anevent["date"] >= notify)
					events_notify.push(`${anevent["owner"]} ${action_notify}`);
			}
			else if (anevent["type"] == "relic") {
				let location_color = Constants.realm_colors[anevent["owner"]];
				let relic = `<span class="${location_color} bold">${_("%s's relic", captured)}</span>`;
				let relic_notify = `${_("%s's relic", captured)}`;
				if (anevent["location"] == "altar") {
					events_html.push(`${relic} ${_("is back")}`);
					if (notify > 0 && anevent["date"] >= notify)
						events_notify.push(`${relic_notify} ${_("is back")}`);
				}
				else {
					events_html.push(`${relic} ${_("is in transit")}`);
					if (notify > 0 && anevent["date"] >= notify)
						events_notify.push(`${relic_notify} ${_("is in transit")}`);
				}
			}
			else if (anevent["type"] == "wish") {
				let sentence = _("%s made a dragon wish!", anevent["location"]);
				const emoji = EventLogIcons.dragon;
				events_html.push(`<span class="${location_color} bold red">${emoji}${sentence}</span>`);
				if (notify > 0 && anevent["date"] >= notify)
					events_notify.push(sentence);
			}
		}
		if (notify > 0) {
			// Don't display more than the 9 newest events for any notification
			events_notify.splice(9);
			return [events_html.join(""), events_notify.join("\n")];
		}
		return events_html.join("");
	}
}

export class CleanForts {
	static clean(fort, has_id=true) {
		let words = fort.split(" ");
		let fort_id;
		let fort_name;

		if (has_id === true)
			fort_id = words.pop();

		if (words[1] == "Castle") {
			fort_name = words.shift();
		}
		else if (words[0] == "Fort") {
			fort_name = words.pop();
		}
		else if (words[0] == "Great" && words[1] == "Wall") {
			fort_name = words.pop();
		}
		else {
			fort_name = words.pop();
		}

		let cleaned = fort_name;

		if (fort_id !== undefined)
			cleaned += ` ${fort_id}`;

		return cleaned;
	}
}

export class Icons {
	static generate_fort(color) {
		return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="36" height="36" class="wz-icon"><path d="M0 0h512v512H0z" fill="#ffffff" fill-opacity="0"></path><g class="" transform="translate(0,0)" style=""><path d="M71 22.406v102.53h202.25v18.69h-73.22v36.968h-18.686v-36.97H79.156l43.375 53.782h180.44v18.688H180.905v36.97H162.22v-36.97h-39.407v163.562h58.53v-44.75H157.47V316.22h74.155V282.56H193.72v-18.687h97.218v18.688h-40.625v33.656h73.28v18.686h-32.437v44.75h26.313v18.688h-63.69l-2.686 74.03-18.688-.687 2.656-73.343H93.032V398h-.22l-28.687 92.844h79.844l9.81-70.688 18.5 2.563-9.468 68.124H453.25L424.562 398h-30.03V197.78l51.812-64.25V22.407h-64.406v52.438h-39.22V22.406h-65.124v52.438h-38.53V22.406h-65.126v52.438h-38.5V22.406H71zm129.03 312.5v44.75h72.44v-44.75h-72.44z"  fill-opacity="1" fill="${color}"></path></g></svg>`;
	}

	static generate_wall(color) {
		return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="36" height="36" class="wz-icon"><path d="M0 0h512v512H0z" fill="#ffffff" fill-opacity="0"></path><g class="" transform="translate(0,0)" style=""><path d="M208 80v25h-13v126h18v-71c0-5.5 1.4-10.5 4.3-14.4 3-3.9 7.8-6.5 12.7-6.5 5 0 9.7 2.7 12.7 6.6 2.9 3.9 4.3 8.8 4.3 14.3v71h18v-71c0-5.5 1.4-10.5 4.3-14.4 2.9-3.9 7.7-6.6 12.7-6.6 5 0 9.8 2.7 12.7 6.6 2.9 3.9 4.3 8.9 4.3 14.4v71h18V105h-13V80h-18v25h-21V80h-18v25h-21V80h-18zM16 112v32h9v71h78v-65.9h9V112H94v25H73v-25H55v25H34v-25H16zm384 0v32h9v71h78v-71h9v-32h-18v25h-21v-25h-18v25h-21v-25h-18zm-265 32v25h-14v64h-16v254h110v-81.6c0-17.5 4.4-31.5 11.8-41.4 7.4-9.9 18.2-15.6 29.2-15.6s21.8 5.7 29.2 15.6c7.4 9.9 11.8 23.9 11.8 41.4V487h110V233h-16v-64h-14v-25h-18v25h-24v80H177v-80h-24v-25h-18zm-94 89v254h46V233H41zm384 0v254h46V233h-46zm-290 7h18v48h-18v-48zm224 0h18v48h-18v-48zM135 359h50v50h-50v-50zm192 0h50v50h-50v-50zm-71 7.4c-5 0-10.2 2.3-14.8 8.4-4.6 6.1-8.2 16.1-8.2 30.6V432h46v-26.6c0-14.5-3.6-24.5-8.2-30.6-4.6-6.1-9.8-8.4-14.8-8.4zM153 377v14h14v-14h-14zm192 0v14h14v-14h-14z" fill="${color}" fill-opacity="1"></path></g></svg>`;
	}

	static generate_castle(color) {
		return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="36" height="36" class="wz-icon"><path d="M0 0h512v512H0z" fill="#ffffff" fill-opacity="0"></path><g class="" transform="translate(0,0)" style=""><path d="M256 22.604c-10.01 0-20.02 2.388-26.836 7.163-2.162 1.514-6.99 10.97-9.213 20.113-.69 2.84-1.016 5.075-1.446 7.516h74.992c-.43-2.44-.757-4.676-1.447-7.516-2.224-9.142-7.052-18.6-9.214-20.113-6.817-4.775-16.826-7.163-26.836-7.163zM80 26.626l-50.707 126.77h95.814l2.8-7zm352 0l-47.906 119.77 2.8 7h95.813zm-199 48.77v14h46v-14zm-19.438 32l-7 14h98.875l-7-14zm-63.468 32l-24.8 62h261.413l-24.8-62zM25 171.396v318h55v-39s4.074-32 16-32 16 32 16 32v39h80v-39c0-32 42.762-80 64-80 23.75 0 64 48 64 80v39h80v-39s4.074-32 16-32 16 32 16 32v39h55v-318h-92.906l19.2 48H393v183h-18v-135h-46v23h-18v-23h-46v23h-18v-23h-46v23h-18v-23h-46v135h-18v-183H98.707l19.2-48zm14 23h18v32H39zm416 0h18v32h-18zm-318 25v30h46v-7h18v7h46v-7h18v7h46v-7h18v7h46v-30zm-50 71h18v32H87zm320 0h18v32h-18zM256 312.91l2.846.946s24.722 8.202 49.69 22.766c12.483 7.282 25.14 16.154 35.077 26.918C353.55 374.304 361 387.396 361 402.396h-18c0-9-4.55-17.91-12.613-26.645-8.064-8.735-19.406-16.863-30.922-23.58-20.776-12.12-39.553-18.78-43.465-20.142-3.912 1.36-22.69 8.022-43.465 20.14-11.516 6.72-22.858 14.847-30.922 23.583C173.55 384.488 169 393.397 169 402.397h-18c0-15 7.45-28.092 17.387-38.856 9.936-10.764 22.594-19.636 35.078-26.918 24.967-14.564 49.69-22.766 49.69-22.766z" fill="${color}" fill-opacity="1"></path></g></svg>`;
	}

	static generate_gem(color) {
		return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="36" height="36" class="wz-icon"><g class="" transform="translate(0,0)" style=""><path d="M92.906 94.813l60.438 79.75 78.125-79.75H92.905zm189.25 0L359.25 173.5l58.688-78.688H282.155zm-25.344.843l-84.718 86.47H341.53l-84.717-86.47zm177.907 7.906l-58.626 78.563H494.53l-59.81-78.563zm-358.064.75l-57.78 77.813h116.78l-59-77.813zm-58.5 96.5L226.562 429.22 143.344 200.81H18.156zm145.063 0l93.593 256.844 93.593-256.844H163.22zm207.06 0L287.064 429.22 495.469 200.81H370.28z" fill="${color}" fill-opacity="1"></path></g></svg>`;
	}

	static generate_relic(realm, shade) {
		let relic = "";
		if (realm === "alsius")
			relic = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="36" height="36" class="wz-icon"><g class="" transform="translate(0,0)" style=""><path d="M188.28 59.47c-19.086 0-34.56 15.468-34.56 34.56 0 16.077 10.983 29.57 25.843 33.44l-35.344 81.936c15.877 2.885 27.905 16.784 27.905 33.5 0 18.806-15.23 34.063-34.03 34.063-18.802 0-34.032-15.258-34.032-34.064 0-13.37 7.703-24.924 18.906-30.5l-50.814-79.22c8.007-5.82 13.22-15.24 13.22-25.905 0-17.693-14.314-32.06-32-32.06-17.688 0-32.032 14.37-32.032 32.06 0 17.693 14.344 32.032 32.03 32.032.734 0 1.468-.014 2.188-.062l41.907 227h316l41.936-227c.72.048 1.455.063 2.188.063 17.686 0 32.03-14.34 32.03-32.032 0-17.693-14.344-32.06-32.03-32.06-17.687 0-32.03 14.37-32.03 32.06-.002 10.723 5.286 20.187 13.373 26l-50.656 79.532c10.778 5.72 18.126 17.04 18.126 30.094 0 18.806-15.23 34.063-34.03 34.063s-34.032-15.258-34.032-34.064c0-17.11 12.602-31.267 29.03-33.687l-34.75-81.532c15.275-3.577 26.657-17.287 26.657-33.657 0-19.094-15.474-34.56-34.56-34.56-19.09 0-34.564 15.468-34.564 34.56 0 14.798 9.308 27.415 22.375 32.345L268 202.345c14.62 4.52 25.25 18.112 25.25 34.218 0 19.796-16.053 35.843-35.844 35.843-19.79 0-35.812-16.047-35.812-35.844 0-15.158 9.403-28.102 22.687-33.343l-44.124-76.72c13.234-4.845 22.688-17.552 22.688-32.47 0-19.094-15.475-34.56-34.563-34.56zM97.438 384.936c-23.978 3.763-22.86 39.844 4.188 39.844h6.656l.064.345h294.28l.063-.344h7.625c26.034 0 27.88-35.928 4.313-39.842H97.437z" fill="${shade}" fill-opacity="1"></path></g></svg>`;
		else if (realm === "ignis")
			relic = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="36" height="36" class="wz-icon"><g class="" transform="translate(0,0)" style=""><path d="M255.997 16.004c-120 0-239.997 60-239.997 149.998C16 226.002 61 256 61 316c0 45-15 45-15 75 0 14.998 48.01 32.002 89.998 44.998v60h239.997v-60s90.567-27.957 90-45c-.933-27.947-15-30-15-74.998 0-30 45.642-91.42 44.998-149.998 0-90-119.998-149.998-239.996-149.998zm-90 179.997c33.137 0 60 26.864 60 60 0 33.136-26.863 60-60 60C132.863 316 106 289.136 106 256c0-33.136 26.862-60 59.998-60zm179.998 0c33.136 0 60 26.864 60 60 0 33.136-26.864 60-60 60-33.136 0-60-26.864-60-60 0-33.136 26.864-60 60-60zm-89.998 105c15 0 45 60 45 75 0 29.998 0 29.998-15 29.998h-60c-15 0-15 0-15-30 0-15 30-74.998 45-74.998z" fill="${shade}" fill-opacity="1"></path></g></svg>`;
		else
			relic = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="36" height="36" class="wz-icon"><g class="" transform="translate(0,0)" style=""><path d="M240 24c-16 0-48 16-64 32 0 13 0 26 8.582 39h142.836C336 82 336 69 336 56c-16-16-48-32-64-32zm-44.072 89c10.008 26.313 10.699 59.404 2.084 78h115.976c-8.615-18.596-7.924-51.687 2.084-78zm-16.471 96c-36.902 28.393-62.07 65.607-66.684 94h286.454c-4.614-28.393-29.782-65.607-66.684-94zm-66.908 112c5.395 44.88 49.453 88 79.451 103 8.465 8.465 12.43 16.904 14.307 23h99.386c1.878-6.096 5.842-14.535 14.307-23 29.998-15 74.056-58.12 79.451-103zm84.105 144c-11.436 6.993-20.654 7-20.654 7-16 0-16 16 0 16h160c16 0 16-16 0-16 0 0-9.218-.007-20.654-7z" fill="${shade}" fill-opacity="1"></path></g></svg>`;
		return relic;
	}

	static get_all_icons() {
		let realm_colors = {"alsius": "#8CCCF4", "ignis": "#FF4444", "syrtis": "#30d98e"};
		let wzicons = {
			"gem_0.png": this.generate_gem("#cccccc33"),
			"gem_1.png": this.generate_gem(realm_colors["ignis"]),
			"gem_2.png": this.generate_gem(realm_colors["alsius"]),
			"gem_3.png": this.generate_gem(realm_colors["syrtis"]),
			"res_79167.png":this.generate_relic("alsius", "#7CCCE4"),
			"res_79168.png":this.generate_relic("alsius", "#6CACE4"),
			"res_79174.png":this.generate_relic("alsius", "#4C7CD4"),
			"res_79169.png":this.generate_relic("ignis", "#FFaaaa"),
			"res_79171.png":this.generate_relic("ignis", "#CC8888"),
			"res_79170.png":this.generate_relic("ignis", "#AA6666"),
			"res_79172.png":this.generate_relic("syrtis", "#aaFFaa"),
			"res_79175.png":this.generate_relic("syrtis", "#88CC88"),
			"res_79173.png":this.generate_relic("syrtis", "#669966")
		};
		for (let realm in realm_colors) {
			wzicons[`keep_${realm}.gif`] = this.generate_fort(realm_colors[realm]);
			wzicons[`castle_keep_${realm}.gif`] = this.generate_castle(realm_colors[realm]);
			wzicons[`wall_keep_${realm}.gif`] = this.generate_wall(realm_colors[realm]);
		}
		return wzicons;
	}

}
const EventLogIcons = {
	gem: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="wztools-icon"><g class="" transform="translate(0,0)" style=""><path d="m92.906 94.813 60.438 79.75 78.125-79.75H92.905zm189.25 0L359.25 173.5l58.688-78.688H282.155zm-25.344.843-84.718 86.47H341.53l-84.717-86.47zm177.907 7.906-58.626 78.563H494.53l-59.81-78.563zm-358.064.75-57.78 77.813h116.78l-59-77.813zm-58.5 96.5L226.562 429.22l-83.218-228.41H18.156zm145.063 0 93.593 256.844 93.593-256.844H163.22zm207.06 0L287.064 429.22l208.405-228.41H370.28z" fill="#F8E71C" fill-opacity="1"></path></g></svg>',
	dragon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="wztools-icon"><g class="" transform="translate(0,0)" style=""><path d="M188.8 20.38c-5.3 26.85 4.6 55.74 34.1 86.52 11.2-7.29 31.6-10.94 50-8.16-46-22.31-66.5-47.13-84.1-78.36zM29.19 26.62C43.56 73.08 81.09 128.8 129.6 168.3 93.51 166 49.93 153.1 18.76 143c24.96 35.2 64.17 52.9 103.34 66.3C97.13 227 66.99 245 18.66 248c54.64 19.2 107.54 8.9 131.34.7-17.9 34.9-100.72 66.2-122.31 77 53.26 4.2 121.71-11 167.01-32.9 10 24.6-1.6 53.2-10.1 77.8-1.9 4.5-3.8 8.9-5.7 13.3 5.1-3.5 10.1-7 14.9-10.6 23.6-16.2 47.8-31.9 59.5-58.8 26.1 31.2 62.7 62.1 107 85.4 17.4 22.1 28.3 49 34.2 73.8 8.3-19.1 13.8-40.2 9.7-60.3 24.5-3.6 35.6-29.7 35.5-54.4-12.6 6.2-15.1 6.3-31.2 8.2 0-10.1.6-12.5-3-28.7-10.3 8.4-21 11.2-30.8 11.8 2.1-7.6 3-19.5 3.7-27.3-13 7.1-19.2 9.7-30.1 10.8-.4-10.9-.1-20-4.1-30.4-29.6 19-48.6 1.5-68-21.3 19.8-17 96.4-21.8 95.1 7.1 14-7.3 18.8-11.2 23.6-15.9 9.1 8.5 13.4 20.9 15.1 31.4 9.3-9.4 10.3-10.5 17.1-23.8 5.7 10.1 8.8 17 10.7 30.6 8.5-6.2 15.4-13.1 19.8-21.4 7.5 15.5 8.3 16 12.4 33 17.8-13.1 21.8-31.2 22.8-47.6 2-33-.3-108.2-31-142.9 1.7 36.3-13.1 70-33.8 80.7-12.6 4.9-96.5-74.6-137.6-93.3-23.5-10.2-48.1 7.1-67.8 9.3C147 106.2 83.57 70.94 29.19 26.62zM296.1 152.8c13.3 20.9 32.2 36.9 60.1 55-19.4 2.9-65.8-6.7-77.7-24-5.5-7.9 7.1-21.3 17.6-31zM180.6 319.1c-14.4 6.2-29.2 10.9-43.8 14.3-2.4 3.6-4.6 7.1-6.7 10.5 14.8 5.3 31.5 7 44.1 2.8 3.3-9.8 5.5-19.3 6.4-27.6zm-68 19.1-10.2 1.5c-31.81 36.6-61.9 103.2-48.24 151.9h36.13c-11.12-37.7-16.53-87.1 22.31-153.4zm8.5 21.5c-5.9 11.4-10.4 22.1-13.8 32.1 12.9 6.7 29.1 8.9 44.8 8.2 4.6-10.5 9.8-21.8 14.6-33.3-15.4 1.8-31.4-1.4-45.6-7zm111.4 6.6c-12 10.5-25.2 20.3-38.9 29.6 7 34 33.4 63.4 73.9 95.7h83.3c-57.2-31.8-94.6-73.3-118.3-125.3zm-130 43.2c-2.5 11.8-3.3 22.7-3 32.9 37.3 14.2 62.5 13.5 97.5 4.1-7.2-10.3-13-21-16.9-32.3-32.7 9.4-55.4 5.7-77.6-4.7zm106.6 52.4c-38.1 10.9-68.8 13.2-107.5.3 1.8 10.4 4.5 20.1 7.5 29.4h130.1c-11.3-9.8-21.4-19.6-30.1-29.7z" fill="#F8E71C" fill-opacity="1"></path></g></svg>',
	dove: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="wztools-icon"><g class="" transform="translate(0,0)" style=""><path d="M372 22.41c-6.4 33.89 6.8 54.39 32.6 66.3 4.6 8.17 8.4 16.29 11.4 24.39-15.3-17.02-33.3-25.31-58-13.12 14.1 27.62 35.6 32.42 61.5 23.42 6.2 21 7.7 41.6 6.3 62.4 0 .2 0 .4-.1.6 1 .6 2 1.1 2.9 1.7 4.9 2.9 9.7 5.9 14.3 8.9.4-3.3.7-6.7.9-10 1.2-17.6.4-35.4-3.3-53.5 26.8 5.1 43-8.6 52.8-33.62-24.2-2.6-44.9 1.22-55.3 22.92-2.6-9.4-6-18.9-10.3-28.46 23.7-15.85 37.7-36.07 26-67.62-22.5 8.53-33.5 22.13-36.3 39.47C412.8 44.33 400.3 28 372 22.41zM190.7 62.63C183.4 82.89 176.4 110 172 136.8c-3.2 19.9-5.3 39.7-5.7 56.9 30.4 25.9 63.3 44.6 99.8 46.3-33.2-52.5-63-120-75.4-177.37zM56.82 102.2c3.08 75.4 32.03 178.7 110.68 233.2l5.5 3.8-2 6.3c-3.2 10.1-7.8 19-15 25.8-7.3 6.8-16.9 11.2-28.7 13.3-22.5 4-54.14.8-101.89-7.7-9.6 24.1-8.29 50.6.43 72.1 8.72 21.3 24.29 36.6 42.1 40.6 24.85-31.8 62.26-70.4 113.56-68.1 52 2.3 111.5-12.1 146.9-47.6 12.5-12.4 23.2-42.3 29.4-68.6 6.2-26.3 8.7-49 8.7-49l.6-6.1 6-1.6c21.6-5.6 47.6-10.7 76.7-25.4-8.6-5.8-18.7-12.6-30.4-19.6-17.9-10.6-37.6-19.8-47.3-20.9-16.6-1.7-26 1.3-32.5 6.1-6.4 4.8-10.6 12.2-14.3 21.1-3.6 8.9-6.4 19-11.4 28.1-5.1 9.2-14 17.8-26.8 19.2-56 6.5-103.8-22.9-143.9-60.1-33-30.6-61.58-66.8-86.38-94.9zm376.08 148c-7.1 2.6-13.9 4.9-20.4 6.8-1.8 6.9-3.7 13.8-5.6 20.7l17.4 4.8c3-10.7 5.9-21.5 8.6-32.3z" fill="#F8E71C" fill-opacity="1"></path></g></svg>',
	eagle: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="wztools-icon"><g class="" transform="translate(0,0)" style=""><path d="M35.31 22.3C27.498 42.766 22.138 64.643 20 87.378l103.705 27.79-4.838 18.052-99.873-26.763c-.012.954-.035 1.905-.035 2.86a245.24 245.24 0 0 0 3.48 41.23h94.146v18.687H26.393a241.526 241.526 0 0 0 13.29 38.547l79.184-21.216 4.838 18.05-75.64 20.27a243.25 243.25 0 0 0 20.396 31.636l61.933-35.756 9.343 16.183-59.22 34.192a242.998 242.998 0 0 0 25.132 24.4l44.73-44.726 13.214 13.215-43.055 43.052a240.34 240.34 0 0 0 28.186 17.357l28.734-49.772 16.186 9.346-27.987 48.472a237.318 237.318 0 0 0 39.156 12.87c.99 3.566 2.08 7.103 3.25 10.593-12.36 9.993-24.163 20.49-35.12 31.728a33.73 33.73 0 0 0-14.75-3.373c-18.707 0-33.874 15.164-33.874 33.873 0 1.715.13 3.402.377 5.05 2.02-11.514 12.06-20.265 24.153-20.265 3.103 0 6.068.582 8.8 1.633-10.103 12.102-19.193 25.08-26.906 39.23 13.897-7.544 27.684-15.755 41.15-24.764a24.533 24.533 0 0 1 1.485 8.43c0 12.122-8.796 22.184-20.352 24.168a34.14 34.14 0 0 0 5.168.393c18.71 0 33.873-15.168 33.873-33.875 0-4.17-.757-8.16-2.134-11.848 10.033-7.467 19.823-15.43 29.26-23.984 2.978 5.705 6.203 11.034 9.65 15.818l-43.53 87.17c48.267 22.47 115.7 22.76 157.872 0l-42.13-84.36c3.722-4.81 7.21-10.25 10.426-16.14 8.577 7.617 17.428 14.77 26.483 21.508a33.778 33.778 0 0 0-2.13 11.836c0 18.707 15.165 33.873 33.874 33.873 1.758 0 3.486-.132 5.172-.39-11.56-1.983-20.355-12.045-20.355-24.168 0-2.964.525-5.805 1.49-8.435 13.464 9.006 27.247 17.223 41.143 24.767-7.71-14.148-16.78-27.136-26.877-39.238a24.457 24.457 0 0 1 8.775-1.623c12.09 0 22.13 8.75 24.15 20.262.246-1.647.377-3.332.377-5.047 0-18.71-15.166-33.873-33.875-33.873a33.755 33.755 0 0 0-14.72 3.355c-10.007-10.27-20.74-19.908-31.946-29.12a208.561 208.561 0 0 0 5.132-16.886 237.88 237.88 0 0 0 23.2-8.283l-28.497-49.356 16.186-9.346 29.34 50.816c9.98-5.11 19.555-10.9 28.672-17.308l-44.146-44.147 13.215-13.216 45.926 45.922a242.752 242.752 0 0 0 25.666-24.6l-60.95-35.19 9.343-16.182 63.748 36.804a242.85 242.85 0 0 0 20.87-32.07l-77.93-20.883 4.837-18.05 81.534 21.847a241.674 241.674 0 0 0 13.584-39.178h-92.836v-18.687h96.777a245.44 245.44 0 0 0 3.48-41.23c0-1.19-.025-2.376-.044-3.563L397.652 133.22l-4.836-18.054L499.09 86.69c-2.18-22.49-7.52-44.13-15.254-64.39h-.004c-26.517 41.51-83.592 73.934-154.764 87.02 12.67 15.603 20.442 35.52 20.442 57.233 0 31.196-15.723 58.718-39.604 75-21.27-12.407-42.907-28.878-45.52-43.814l17.653-3.81-2.235-10.352c15.67-11.335 33.936-9.138 53.433-.01l-18.302-40.414-41.903 9.04-2.846-13.188V139l-80.87 17.453 20.458 30.266c-8.595 19.678-2.717 41.68 5.45 58.56-27.204-15.57-45.592-44.998-45.592-78.73 0-21.713 7.772-41.63 20.44-57.232C118.904 96.234 61.83 63.81 35.312 22.3zm216.45 132.567c5.244-.056 9.98 3.573 11.13 8.9 1.312 6.085-2.557 12.084-8.644 13.397-6.087 1.313-12.085-2.556-13.398-8.643-1.314-6.085 2.556-12.086 8.642-13.4.76-.163 1.52-.245 2.27-.253z" fill="#f8e71c" fill-opacity="1"></path></g></svg>'
};
