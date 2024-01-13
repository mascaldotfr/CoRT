/*
 * Copyright (c) 2022-2024 mascal
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

