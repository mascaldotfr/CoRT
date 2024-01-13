import {_} from "../i18n.js";

// Create translatable strings according to english order of words
// id is the (x) thing at the end of each fortification,
export function translate_fort(fort, has_id=true) {
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


