/*
 * Copyright (c) 2023 mascal
 *
 * A tiny i18n system. Released under the MIT license.
 *
 */

var __i18n__lang;

(function() {
	let cookie = decodeURIComponent(document.cookie).split("=");
	if (cookie[0] == "__i18n__lang" && __i18n__.supported_lang.includes(cookie[1])) {
		__i18n__lang = cookie[1];
	}
	else {
		__i18n__lang = navigator.language.slice(0,2).toLowerCase();
		if (!__i18n__.supported_lang.includes(__i18n__lang)) {
			// unsupported language
			__i18n__lang = "en";
		}
		document.cookie = "__i18n__lang=" + __i18n__lang;
	}
})();

const _ = function(string, ...p) {
	try {
		if (__i18n__lang != "en")
			string = __i18n__[string][__i18n__lang];
		for (position in p)
			string = string.replace("%s", p[position]);
		return string;
	}
	catch (error) {
		console.error(`Translation failed for '${string}' failed, please correct it: ${error}.`);
		return string;
	}
}
