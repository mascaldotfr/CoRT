// This whole file is redistributed under the MIT license

/* XXX lamaiquery.js */

/*
 * Copyright (c) 2022-2025 mascal
 *
 * jquery mostly interchangeable knockoff for CoRT containaing only the
 * necessary functions for the site. Released under the MIT license.
 *
 * Non jquery compatible:
 *
 * - $.getJSON({parameters}) => $().getJSON(url). XXX Note that it's
 *   synchronous as the UI drawing needs the trainer dataset for example
 *   when loading a setup from an url.
 * - $.post({all_parameters}) => $().post(url, params={key: value, [...]})
 *
 * */

export const $ = (function (selector) {
	return {
		appendTo: function(target) {
			let selector_node = document.querySelector(selector);
			document.querySelector(target).appendChild(selector_node);
		},
		append: function(html) {
			document.querySelector(selector).insertAdjacentHTML("beforeend", html);
		},
		attr: function(attribute, value) {
			if (value !== undefined)
				document.querySelector(selector).setAttribute(attribute, value);
			else
				return document.querySelector(selector).getAttribute(attribute);
		},
		css: function(key, value) {
			let jscss = new Array();
			jscss[key] = value;
			try {
				selector = document.querySelector(selector);
			}
			catch (_unused) { } // it's already a node
			Object.assign(selector.style, jscss);
		},
		empty: function() {
			try {
				document.querySelector(selector).replaceChildren();
			}
			catch (_unused) { // old browsers
				document.querySelector(selector).innerHTML = "";
			}
		},
		get: async function(url) {
			const reply = await fetch(url)
					    .then(reply => reply.text())
					    .catch(error => { throw(error); });
			return reply;
		},
		getJSON: async function(url) {
			const reply = await fetch(url)
					    .then(reply => reply.json())
					    .catch(error => { throw(error); });
			return reply;
		},
		hide: function() {
			document.querySelector(selector).style.visibility = "hidden";
		},
		html: function(html) {
			document.querySelector(selector).innerHTML = html;
		},
		on: function(anevent, callable) {
			try { // real selector
				document.querySelectorAll(selector).forEach( (elm) =>
					elm.addEventListener(anevent, callable) );
			}
			catch (_unused) {
				selector.addEventListener(anevent, callable);
			}
		},
		prepend: function(html) {
			document.querySelector(selector).insertAdjacentHTML("afterbegin", html);
		},
		post: async function(url, params) {
			let urlparams = new FormData();
			for (let key in params) {
				urlparams.append(key, params[key]);
			}
			await fetch(url, { method: "POST", body: urlparams })
				.catch(error => { throw(error); });
		},
		ready: function(callable) {
			selector.addEventListener("DOMContentLoaded", callable);
		},
		remove: function() {
			let selector_node = document.querySelector(selector);
			if (selector_node)
				selector_node.remove();
		},
		removeAttr: function(attribute) {
			document.querySelector(selector).removeAttribute(attribute);
		},
		show: function() {
			document.querySelector(selector).style.visibility = "visible";
		},
		text: function(text) {
			if (text !== undefined) { // PUT
				// Allow to remove newlines without doing anything,
				// will correct if needed
				try {
					document.querySelector(selector).innerHTML = text;
				}
				catch (_unused) {
					selector.innerHTML = text;
				}
			}
			else { // GET
				try {
					// real selector
					return document.querySelector(selector).innerText;
				}
				catch (_unused) {
					// selector is actually a node
					return selector.innerText;
				}
			}
		},
		trigger: function(anevent) {
			document.querySelector(selector).dispatchEvent(new Event(anevent));
		},
		val: function(value) {
			if (value !== undefined) { // PUT
				try {
					document.querySelector(selector).value = value;
				}
				catch (_unused) {
					selector.value = value;
				}
			}
			else { // GET
				try {
					// real selector
					return document.querySelector(selector).value;
				}
				catch (_unused) {
					// selector is actually a node
					return selector.value;
				}
			}
		}
	}
});


/* XXX
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


/* XXX calendar.js: easy interface to add-to-calendar-button.js */

let __calendar_imported = false;

function import_calendar() {
	try {
		let addtocalendar = import("./addtocalendarv2.js")
			.catch(() => { throw "addtocalendar is not supported" }); // display error on MacOS too
	}
	catch(_unused) {
		console.err("addtocalendar failed to load");
	}
	// in any case we consider the calendar imported
	__calendar_imported = true;
}


function zeropad(arr) {
	for (let i in arr)
		arr[i] = arr[i].toString().padStart(2, "0");
	return arr;
}

// time stamp and duration are in seconds
export function generate_calendar(tstamp, title, duration) {
	// import addtocalendar if never imported yet
	if (__calendar_imported === false)
		import_calendar();
	let sdate = new Date(tstamp * 1000);
	let startdate = [sdate.getUTCFullYear(), sdate.getUTCMonth() + 1, sdate.getUTCDate()];
	startdate = zeropad(startdate);
	let starttime = [sdate.getUTCHours(), sdate.getUTCMinutes()];
	starttime = zeropad(starttime);
	let edate = new Date(tstamp * 1000 + duration * 1000);
	let enddate = [edate.getUTCFullYear(), edate.getUTCMonth() + 1, edate.getUTCDate()];
	enddate = zeropad(enddate);
	let endtime = [edate.getUTCHours(), edate.getUTCMinutes()];
	endtime = zeropad(endtime);
	return `
		<add-to-calendar-button
		  class="calendar"
		  name="[CoR] ${title.toUpperCase()}"
		  startDate="${startdate.join("-")}"
		  startTime="${starttime.join(":")}"
		  endDate="${enddate.join("-")}"
		  endTime="${endtime.join(":")}"
		  timeZone="UTC"
		  options="'Apple','Google','iCal','Outlook.com','Yahoo','Microsoft365'"
		  trigger="click"
		  hideTextLabelButton
		  hideIconButton
		  size="0"
		  lightMode="dark"
		  inline
		  hideBackground
		  buttonStyle="simple"
		  title="Add to calendar"
		></add-to-calendar-button>
	`;
}

/* XXX notify.js : a simple javacript notification system */

let __notifications_swsupport = ("Notification" in window && "serviceWorker" in navigator);

export function insert_notification_link() {
	if (! __notifications_swsupport || Notification.permission !== "default")
		return;
	$("#title").append(`
		<a href="#" id="ask-notifications" class="nodeco" title="Notifications">&nbsp;🔔</a>
	`);
	$("#ask-notifications").on("click", function () {
		$("#ask-notifications").remove();
		Notification.requestPermission();
	});
}

export function mynotify(title, text, tag) {
	const options = {
		icon: "favicon.png",
		body: text,
		tag: tag,
		renotify: true,
		vibrate: [100, 50, 100]
	};
	if ( __notifications_swsupport && Notification.permission === "granted") {
		navigator.serviceWorker.ready.then( reg => {
			reg.showNotification(title, options)
		});
	}
}

try {
	navigator.permissions
		.query({ name: "notifications" })
		.then((permissionStatus) => {
			permissionStatus.onchange = () => {
				if (permissionStatus.state === "prompt")
					insert_notification_link();
			};
		});
}
catch(_unused) { /* Unsupported by safari */ };
if (__notifications_swsupport)
	navigator.serviceWorker.register("sw.js");
