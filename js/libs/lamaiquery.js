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
					    .then(reply => {
						    if (!reply.ok && reply.status !== 304) {
							    throw new Error ("API query failed with HTTP code " + reply.status);
						    }
						    return reply.json()
					    })
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
