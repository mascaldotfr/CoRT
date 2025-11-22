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
 * - addClass and removeClass => you need to call classes names as arguments,
 *   not as a single string
 *
 * */

export const $ = (function (selector) {

	// resolve selector to get a node, so it works like jQuery.
	// in some cases like .on() we still need the original selector
	// so we don't overwrite it.
	let r_selector = selector;
	try {
		r_selector = document.querySelector(r_selector);
	}
	catch (_unused) { } // it's already a node

	return {
		addClass: function(...classes) {
			r_selector.classList.add(...classes);
		},
		appendTo: function(target) {
			document.querySelector(target).appendChild(r_selector);
		},
		append: function(html) {
			r_selector.insertAdjacentHTML("beforeend", html);
		},
		attr: function(attribute, value) {
			if (value !== undefined)
				r_selector.setAttribute(attribute, value);
			else
				return r_selector.getAttribute(attribute);
		},
		css: function(key, value) {
			let jscss = [];
			jscss[key] = value;
			Object.assign(r_selector.style, jscss);
		},
		empty: function() {
			try {
				r_selector.replaceChildren();
			}
			catch (_unused) { // old browsers
				r_selector.innerHTML = "";
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
			r_selector.style.visibility = "hidden";
		},
		html: function(html) {
			r_selector.innerHTML = html;
		},
		on: function(anevent, callable) {
			document.querySelectorAll(selector).forEach( (elm) =>
				elm.addEventListener(anevent, callable) );
		},
		prependTo: function(target) {
			document.querySelector(target).insertAdjacentElement("beforebegin", r_selector);
		},
		prepend: function(html) {
			r_selector.insertAdjacentHTML("afterbegin", html);
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
			r_selector.addEventListener("DOMContentLoaded", callable);
		},
		remove: function() {
			if (r_selector)
				r_selector.remove();
		},
		removeAttr: function(attribute) {
			r_selector.removeAttribute(attribute);
		},
		removeClass: function(...classes) {
			r_selector.classList.remove(...classes);
		},
		show: function() {
			r_selector.style.visibility = "visible";
		},
		text: function(text) {
			if (text !== undefined) { // PUT
				r_selector.innerText = text;
			}
			else { // GET
				return r_selector.innerText;
			}
		},
		trigger: function(anevent) {
			r_selector.dispatchEvent(new Event(anevent));
		},
		val: function(value) {
			if (value !== undefined) { // PUT
				r_selector.value = value;
			}
			else { // GET
				return r_selector.value;
			}
		}
	};
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

	localStorage.setItem("tzlisthtml", options);
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
			reg.showNotification(title, options);
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
catch(_unused) { /* Unsupported by safari */ }
if (__notifications_swsupport)
	navigator.serviceWorker.register("sw.js");

// Schedule minutely things. See /js/libs/ticker.js for code, and WZ/BZ/BOSSES for usage
export class MyScheduler {
	constructor(start, end, callback) {
		this.start = start;
		this.end = end;
		this.callback = callback;
		this.last_focus = Date.now();

		// initial display
		this.worker = new Worker("./js/libs/ticker.js");
		this.worker.postMessage({"init": {"start": this.start, "end": this.end}});
		// If it ticks, run this
		this.worker.onmessage = this.callback;
	}

	start_scheduling() {
		// Always ensure we have fresh data, particulary on mobile, with a 5s
		// debounce
		window.addEventListener("focus", () => {
			const ts = Date.now();
			if (ts - this.last_focus > 5000) {
				this.last_focus = ts;
				this.force_run();
			}
		});
	}

	force_run(...args) {
		// On manual run, always update the last run timestamp before calling the callback
		this.worker.postMessage({"update_last_run": {"ts": this.last_focus}});
		this.callback(...args);
	}
}
