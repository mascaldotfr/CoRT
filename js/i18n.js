/*
 * Copyright (c) 2022-2024 mascal
 *
 * A tiny i18n system. Released under the MIT license.
 *
 */


(function() {
	// automatic language detection if none is defined
	if (localStorage.getItem("lang") !== null)
		return;
	let nav_lang = navigator.language.slice(0,2).toLowerCase();
	let lang = __i18n__.supported_lang.includes(nav_lang) ? nav_lang : "en";
	localStorage.setItem("lang", lang);
}
)();

const _ = function(string, ...p) {
	try {
		// Note that it doesn't protect from localstorage manipulation
		let lang = localStorage.getItem("lang");
		if (lang != "en")
			string = __i18n__[string][lang];
		for (position in p)
			string = string.replace("%s", p[position]);
		return string;
	}
	catch (error) {
		console.error(`Translation failed for '${string}' failed, please correct it: ${error}.`);
		return string;
	}
}
