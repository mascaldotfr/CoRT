/*
 * Copyright (c) 2023 mascal
 *
 * jquery mostly interchangeable knockoff for CoRT containaing only the
 * necessary functions for the site. Released under the MIT license.
 *
 * Non jquery compatible:
 *
 * - $.getJSON({parameters}) => $().getJSON(url). XXX Note that it's
 *   synchronous as the UI drawing needs the trainer dataset for example.
 * - $.post({all_parameters}) => $().post(url, params={key: value, [...]})
 *
 * */

const $ = (function (selector) {
	return {
		appendTo: function(target) {
			selector = document.querySelector(selector);
			document.querySelector(target).appendChild(selector);
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
			jscss = new Array();
			jscss[key] = value;
			try {
				selector = document.querySelector(selector);
			}
			catch { } // it's already a node
			Object.assign(selector.style, jscss);
		},
		empty: function() {
			document.querySelector(selector).replaceChildren();
		},
		getJSON: function(url) {
			const http = new XMLHttpRequest();
			// the ? parameter trick allows to bypass the cache
			http.open("GET", url + (/\?/.test(url) ? "&" : "?") + new Date().getTime(), false);
			http.onerror = function (e) {
				console.error(http.statusText);
			};
			http.send(null);
			return JSON.parse(http.responseText);
		},
		hide: function() {
			document.querySelector(selector).style.visibility = "hidden";
		},
		html: function(html) {
			document.querySelector(selector).innerHTML = html;
		},
		on: function(anevent, callable) {
			document.querySelectorAll(selector).forEach( (elm) =>
				elm.addEventListener(anevent, callable) );
		},
		prepend: function(html) {
			document.querySelector(selector).insertAdjacentHTML("afterbegin", html);
		},
		post: function(url, params) {
			state = 0
			urlparams = new FormData();
			for (key in params) {
				urlparams.append(key, params[key]);
			}
			let post = new XMLHttpRequest();
			post.open("POST", url);
			post.onload = function () {
				state = post.status;
			};
			post.send(urlparams);
			return state;
		},
		ready: function(callable) {
			selector.addEventListener("DOMContentLoaded", callable);
		},
		remove: function() {
			selector_node = document.querySelector(selector);
			if (selector_node)
				selector_node.remove();
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
				catch {
					selector.innerHTML = text;
				}
			}
			else { // GET
				try {
					// real selector
					return document.querySelector(selector).innerText;
				}
				catch {
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
				// Allow to remove newlines without doing anything,
				// will correct if needed
				try {
					document.querySelector(selector).value = value;
				}
				catch {
					selector.value = value;
				}
			}
			else { // GET
				try {
					// real selector
					return document.querySelector(selector).value;
				}
				catch {
					// selector is actually a node
					return selector.value;
				}
			}
		}
	}
});

