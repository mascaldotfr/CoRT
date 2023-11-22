/*
 * Copyright (c) 2023 mascal
 *
 * A tiny i18n system. Released under the MIT license.
 *
 */


(function() {
	let lang = localStorage.getItem("lang");
	let nav_lang = navigator.language.slice(0,2).toLowerCase();
	if (lang === null && !__i18n__.supported_lang.includes(nav_lang))
		lang = "en";
	else if (lang === null)
		lang = nav_lang;
	localStorage.setItem("lang", lang);
}
)();

const _ = function(string, ...p) {
	try {
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
