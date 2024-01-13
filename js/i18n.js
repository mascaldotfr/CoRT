/*
 * Copyright (c) 2022-2024 mascal
 *
 * A tiny i18n system. Released under the MIT license.
 *
 */

import {__i18n__} from "../data/i18n_db.js"

// automatic language detection if none is defined
if (localStorage.getItem("lang") == null) {
	let nav_lang = navigator.language.slice(0,2).toLowerCase();
	let lang = __i18n__.supported_lang.includes(nav_lang) ? nav_lang : "en";
	localStorage.setItem("lang", lang);
}

export const _ = function(string, ...p) {
	try {
		// Note that it doesn't protect from localstorage manipulation
		let lang = localStorage.getItem("lang");
		if (lang != "en")
			string = __i18n__[string][lang];
		for (let position in p)
			string = string.replace("%s", p[position]);
		return string;
	}
	catch (error) {
		console.error(`Translation failed for '${string}' failed, please correct it: ${error}.`);
		return string;
	}
}
