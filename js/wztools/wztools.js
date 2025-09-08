import {_} from "../../data/i18n.js";

export function Constants() {
	this.realm_colors = { "Alsius": "blue", "Ignis": "red", "Syrtis": "green" };
	this.realm_names = ["Alsius", "Ignis", "Syrtis"];
}

export class HumaniseEvents {
	// id is the (x) thing at the end of each fortification
	// notify allows to return an array with the events without coloration if > 0
	// (unix timestamp from the last event) for use in a desktop notification

	humanise_events(events, has_id=true, notify=0)  {
		// datetime
		let tz = localStorage.getItem("tz");
		let dformatter = new Intl.DateTimeFormat(undefined, {
			month: 'numeric', day: 'numeric',
			hour: '2-digit', minute: '2-digit', timeZone: tz
		});

		// wztools
		let translator = new TranslateForts();
		let constants = new Constants();
		let realm_colors = constants.realm_colors;

		let events_html = new Array();
		let events_notify = new Array();

		for (let anevent of events) {
			let dt = new Date(anevent["date"] * 1000);
			let datetime = dformatter.format(dt);
			let owner_color = realm_colors[anevent["owner"]];
			let location_color = realm_colors[anevent["location"]];
			let captured = anevent["name"];
			let captured_notify = anevent["name"];
			let dt_color = anevent["type"] == "wish" ? location_color: "";
			events_html.push(`<span class="${dt_color} bold">${datetime}</span>&nbsp;`);
			if (anevent["type"] == "fort" || anevent["type"] == "gem") {
				let location_color = realm_colors[anevent["location"]];
				if (anevent["type"] == "fort") {
					captured = translator.translate_fort(captured, has_id);
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
				let action;
				let action_notify;
				if (anevent["location"] == anevent["owner"]) {
					action = _("has recovered %s", target);
					if (notify > 0)
						action_notify = _("has recovered %s", captured_notify);
				}
				else {
					action = _("has captured %s", target);
					if (notify > 0)
						action_notify = _("has captured %s", captured_notify);
				}
				events_html.push(`<span class="${owner_color} bold">${anevent["owner"]}</span> ${action}.`);
				if (notify > 0 && anevent["date"] >= notify)
					events_notify.push(`${anevent["owner"]} ${action_notify}`);
			}
			else if (anevent["type"] == "relic") {
				let location_color = realm_colors[anevent["owner"]];
				let relic = `<span class="${location_color} bold">${_("%s's relic", captured)}</span>`;
				let relic_notify = `${_("%s's relic", captured)}`;
				if (anevent["location"] == "altar") {
					events_html.push(`${relic} ${_("is back.")}`);
					if (notify > 0 && anevent["date"] >= notify)
						events_notify.push(`${relic_notify} ${_("is back.")}`);
				}
				else {
					events_html.push(`${relic} ${_("is in transit.")}`);
					if (notify > 0 && anevent["date"] >= notify)
						events_notify.push(`${relic_notify} ${_("is in transit.")}`);
				}
			}
			else if (anevent["type"] == "wish") {
				let sentence = _("%s made a dragon wish!", anevent["location"]);
				events_html.push(`<span class="${location_color} bold">${sentence}</span>`);
				if (notify > 0 && anevent["date"] >= notify)
					events_notify.push(sentence);
			}
			events_html.push("<br>");
		}
		if (notify > 0)
			return [events_html.join(""), events_notify.join("\n")];
		return events_html.join("");
	}
}

export class Time {
	// Return the current time as a Unix timestamp
	timestamp_now() {
		return Math.floor(new Date().getTime() / 1000);
	}

	// Take a unix timestamp as entry, and humanise the time left until that
	// timestamp. If you want passed time instead, use "passed=true"
	// Return an associate arrays with the individual time markers, and a
	// humanised/localised version of it.
	timestamp_ago(ts, passed=false) {
		let _in = {};
		let time_diff = 0;
		if (ts === null)
			return {"human":null, "days":null, "hours":null, "minutes": null};
		if (passed)
			time_diff = this.timestamp_now() - ts;
		else
			time_diff = ts - this.timestamp_now();
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

export class TranslateForts {
	// Create translatable strings according to english order of words
	// id is the (x) thing at the end of each fortification,
	translate_fort(fort, has_id=true) {
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
}

export class Icons {
	generate_fort(color) {
		return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="36" height="36" class="wz-icon"><path d="M0 0h512v512H0z" fill="#ffffff" fill-opacity="0"></path><g class="" transform="translate(0,0)" style=""><path d="M71 22.406v102.53h202.25v18.69h-73.22v36.968h-18.686v-36.97H79.156l43.375 53.782h180.44v18.688H180.905v36.97H162.22v-36.97h-39.407v163.562h58.53v-44.75H157.47V316.22h74.155V282.56H193.72v-18.687h97.218v18.688h-40.625v33.656h73.28v18.686h-32.437v44.75h26.313v18.688h-63.69l-2.686 74.03-18.688-.687 2.656-73.343H93.032V398h-.22l-28.687 92.844h79.844l9.81-70.688 18.5 2.563-9.468 68.124H453.25L424.562 398h-30.03V197.78l51.812-64.25V22.407h-64.406v52.438h-39.22V22.406h-65.124v52.438h-38.53V22.406h-65.126v52.438h-38.5V22.406H71zm129.03 312.5v44.75h72.44v-44.75h-72.44z" fill="${color}" fill-opacity="1"></path></g></svg>`;
	}

	generate_wall(color) {
		return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="36" height="36" class="wz-icon"><path d="M0 0h512v512H0z" fill="#ffffff" fill-opacity="0"></path><g class="" transform="translate(0,0)" style=""><path d="M208 80v25h-13v126h18v-71c0-5.5 1.4-10.5 4.3-14.4 3-3.9 7.8-6.5 12.7-6.5 5 0 9.7 2.7 12.7 6.6 2.9 3.9 4.3 8.8 4.3 14.3v71h18v-71c0-5.5 1.4-10.5 4.3-14.4 2.9-3.9 7.7-6.6 12.7-6.6 5 0 9.8 2.7 12.7 6.6 2.9 3.9 4.3 8.9 4.3 14.4v71h18V105h-13V80h-18v25h-21V80h-18v25h-21V80h-18zM16 112v32h9v71h78v-65.9h9V112H94v25H73v-25H55v25H34v-25H16zm384 0v32h9v71h78v-71h9v-32h-18v25h-21v-25h-18v25h-21v-25h-18zm-265 32v25h-14v64h-16v254h110v-81.6c0-17.5 4.4-31.5 11.8-41.4 7.4-9.9 18.2-15.6 29.2-15.6s21.8 5.7 29.2 15.6c7.4 9.9 11.8 23.9 11.8 41.4V487h110V233h-16v-64h-14v-25h-18v25h-24v80H177v-80h-24v-25h-18zm-94 89v254h46V233H41zm384 0v254h46V233h-46zm-290 7h18v48h-18v-48zm224 0h18v48h-18v-48zM135 359h50v50h-50v-50zm192 0h50v50h-50v-50zm-71 7.4c-5 0-10.2 2.3-14.8 8.4-4.6 6.1-8.2 16.1-8.2 30.6V432h46v-26.6c0-14.5-3.6-24.5-8.2-30.6-4.6-6.1-9.8-8.4-14.8-8.4zM153 377v14h14v-14h-14zm192 0v14h14v-14h-14z" fill="${color}" fill-opacity="1"></path></g></svg>`;
	}

	generate_castle(color) {
		return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="36" height="36" class="wz-icon"><path d="M0 0h512v512H0z" fill="#ffffff" fill-opacity="0"></path><g class="" transform="translate(0,0)" style=""><path d="M256 22.604c-10.01 0-20.02 2.388-26.836 7.163-2.162 1.514-6.99 10.97-9.213 20.113-.69 2.84-1.016 5.075-1.446 7.516h74.992c-.43-2.44-.757-4.676-1.447-7.516-2.224-9.142-7.052-18.6-9.214-20.113-6.817-4.775-16.826-7.163-26.836-7.163zM80 26.626l-50.707 126.77h95.814l2.8-7zm352 0l-47.906 119.77 2.8 7h95.813zm-199 48.77v14h46v-14zm-19.438 32l-7 14h98.875l-7-14zm-63.468 32l-24.8 62h261.413l-24.8-62zM25 171.396v318h55v-39s4.074-32 16-32 16 32 16 32v39h80v-39c0-32 42.762-80 64-80 23.75 0 64 48 64 80v39h80v-39s4.074-32 16-32 16 32 16 32v39h55v-318h-92.906l19.2 48H393v183h-18v-135h-46v23h-18v-23h-46v23h-18v-23h-46v23h-18v-23h-46v135h-18v-183H98.707l19.2-48zm14 23h18v32H39zm416 0h18v32h-18zm-318 25v30h46v-7h18v7h46v-7h18v7h46v-7h18v7h46v-30zm-50 71h18v32H87zm320 0h18v32h-18zM256 312.91l2.846.946s24.722 8.202 49.69 22.766c12.483 7.282 25.14 16.154 35.077 26.918C353.55 374.304 361 387.396 361 402.396h-18c0-9-4.55-17.91-12.613-26.645-8.064-8.735-19.406-16.863-30.922-23.58-20.776-12.12-39.553-18.78-43.465-20.142-3.912 1.36-22.69 8.022-43.465 20.14-11.516 6.72-22.858 14.847-30.922 23.583C173.55 384.488 169 393.397 169 402.397h-18c0-15 7.45-28.092 17.387-38.856 9.936-10.764 22.594-19.636 35.078-26.918 24.967-14.564 49.69-22.766 49.69-22.766z" fill="${color}" fill-opacity="1"></path></g></svg>`;
	}

	generate_gem(color) {
		return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="36" height="36" class="wz-icon"><g class="" transform="translate(0,0)" style=""><path d="M92.906 94.813l60.438 79.75 78.125-79.75H92.905zm189.25 0L359.25 173.5l58.688-78.688H282.155zm-25.344.843l-84.718 86.47H341.53l-84.717-86.47zm177.907 7.906l-58.626 78.563H494.53l-59.81-78.563zm-358.064.75l-57.78 77.813h116.78l-59-77.813zm-58.5 96.5L226.562 429.22 143.344 200.81H18.156zm145.063 0l93.593 256.844 93.593-256.844H163.22zm207.06 0L287.064 429.22 495.469 200.81H370.28z" fill="${color}" fill-opacity="1"></path></g></svg>`;
	}

	generate_relic(realm, shade) {
		let relic = "";
		if (realm === "alsius")
			relic = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="36" height="36" class="wz-icon"><g class="" transform="translate(0,0)" style=""><path d="M188.28 59.47c-19.086 0-34.56 15.468-34.56 34.56 0 16.077 10.983 29.57 25.843 33.44l-35.344 81.936c15.877 2.885 27.905 16.784 27.905 33.5 0 18.806-15.23 34.063-34.03 34.063-18.802 0-34.032-15.258-34.032-34.064 0-13.37 7.703-24.924 18.906-30.5l-50.814-79.22c8.007-5.82 13.22-15.24 13.22-25.905 0-17.693-14.314-32.06-32-32.06-17.688 0-32.032 14.37-32.032 32.06 0 17.693 14.344 32.032 32.03 32.032.734 0 1.468-.014 2.188-.062l41.907 227h316l41.936-227c.72.048 1.455.063 2.188.063 17.686 0 32.03-14.34 32.03-32.032 0-17.693-14.344-32.06-32.03-32.06-17.687 0-32.03 14.37-32.03 32.06-.002 10.723 5.286 20.187 13.373 26l-50.656 79.532c10.778 5.72 18.126 17.04 18.126 30.094 0 18.806-15.23 34.063-34.03 34.063s-34.032-15.258-34.032-34.064c0-17.11 12.602-31.267 29.03-33.687l-34.75-81.532c15.275-3.577 26.657-17.287 26.657-33.657 0-19.094-15.474-34.56-34.56-34.56-19.09 0-34.564 15.468-34.564 34.56 0 14.798 9.308 27.415 22.375 32.345L268 202.345c14.62 4.52 25.25 18.112 25.25 34.218 0 19.796-16.053 35.843-35.844 35.843-19.79 0-35.812-16.047-35.812-35.844 0-15.158 9.403-28.102 22.687-33.343l-44.124-76.72c13.234-4.845 22.688-17.552 22.688-32.47 0-19.094-15.475-34.56-34.563-34.56zM97.438 384.936c-23.978 3.763-22.86 39.844 4.188 39.844h6.656l.064.345h294.28l.063-.344h7.625c26.034 0 27.88-35.928 4.313-39.842H97.437z" fill="${shade}" fill-opacity="1"></path></g></svg>`;
		else if (realm === "ignis")
			relic = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="36" height="36" class="wz-icon"><g class="" transform="translate(0,0)" style=""><path d="M255.997 16.004c-120 0-239.997 60-239.997 149.998C16 226.002 61 256 61 316c0 45-15 45-15 75 0 14.998 48.01 32.002 89.998 44.998v60h239.997v-60s90.567-27.957 90-45c-.933-27.947-15-30-15-74.998 0-30 45.642-91.42 44.998-149.998 0-90-119.998-149.998-239.996-149.998zm-90 179.997c33.137 0 60 26.864 60 60 0 33.136-26.863 60-60 60C132.863 316 106 289.136 106 256c0-33.136 26.862-60 59.998-60zm179.998 0c33.136 0 60 26.864 60 60 0 33.136-26.864 60-60 60-33.136 0-60-26.864-60-60 0-33.136 26.864-60 60-60zm-89.998 105c15 0 45 60 45 75 0 29.998 0 29.998-15 29.998h-60c-15 0-15 0-15-30 0-15 30-74.998 45-74.998z" fill="${shade}" fill-opacity="1"></path></g></svg>`
		else
			relic = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="36" height="36" class="wz-icon"><g class="" transform="translate(0,0)" style=""><path d="M240 24c-16 0-48 16-64 32 0 13 0 26 8.582 39h142.836C336 82 336 69 336 56c-16-16-48-32-64-32zm-44.072 89c10.008 26.313 10.699 59.404 2.084 78h115.976c-8.615-18.596-7.924-51.687 2.084-78zm-16.471 96c-36.902 28.393-62.07 65.607-66.684 94h286.454c-4.614-28.393-29.782-65.607-66.684-94zm-66.908 112c5.395 44.88 49.453 88 79.451 103 8.465 8.465 12.43 16.904 14.307 23h99.386c1.878-6.096 5.842-14.535 14.307-23 29.998-15 74.056-58.12 79.451-103zm84.105 144c-11.436 6.993-20.654 7-20.654 7-16 0-16 16 0 16h160c16 0 16-16 0-16 0 0-9.218-.007-20.654-7z" fill="${shade}" fill-opacity="1"></path></g></svg>`;
		return relic;
	}

	get_all_icons() {
		let realm_colors = {"alsius": "#8CCCF4", "ignis": "#FF4444", "syrtis": "#30d98e"};
		let wzicons = {
			"gem_0.png": this.generate_gem("#444444"),
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

