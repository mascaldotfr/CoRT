// Non critical core JS stuff should be put here when applicable
// It's usually called at the end of main JS code

import { $, _, api } from "./libs/cortlibs.js";

// SEO stuff
const currentlang = localStorage.getItem("lang");
if (currentlang != "en") {
	$("html").attr("lang", currentlang);
	const descr = $('meta[name="description"]');
	const en_descr = descr.attr("content");
	descr.attr("content", _(en_descr));
}

// Cursors lazy loading
const mediaQuery = window.matchMedia("(min-width: 800px)");
if (mediaQuery.matches) {
	const loadCursors = () => {
		const style = document.createElement("style");
		style.textContent = `
			html, body, label, button { cursor: url("data/cursor/normal.webp"), default; }
			label, select, button, textarea, a:hover, a:active { cursor: url("data/cursor/links.webp"), default; }
		`;
		document.head.appendChild(style);
		document.removeEventListener("mousemove", loadCursors);
	};
	document.addEventListener("mousemove", loadCursors, { once: true });
}


// localStorage cleanup + cache bust
$("#reset_powers").on("click", () => {
	try {
		localStorage.clear();
		const url = new URL(window.location);
		url.searchParams.set('nocache', Date.now());
		window.location.href = url.toString();
	}
	catch(_unused) {
		window.alert("Unable to clear localStorage. Tell this to mascal.");
	}
});

// XXX temporary message. This avoids touching 3 files for them.
// colors are: green, blue, red (see style.css for variables)
// example:
// <div id="temporary-message" data-color="blue" data-en="message" data-es="mensaje"...></div>
function temporary_message() {
	// Using lamaiquery for this would cause more error handling
	if (!document.getElementById("temporary-message"))
		return;
	const selector = $("#temporary-message");
	const color = selector.attr("data-color");
	selector.css("background", `var(--${color})`);
	const lang = localStorage.getItem("lang");
	const translated_msg = selector.attr("data-" + lang);
	// blue = info, red = warning, green = ok
	const icon = {"blue": "&#8505;&#65039;", "green": "&#9989;", "red": "&#9888;&#65039;"}
	selector.html(icon[color] + "&nbsp;" + translated_msg);
}

// Put maintenance message (see /api/MAINTENANCE.md)
const maintenance_delay = 15  * 60 * 1000;
async function maintenance() {
	const ts = Date.now();
	const last_check = parseInt(localStorage.getItem("maint_last_check")) || 0;
	let msg = localStorage.getItem("maint_msg") || "";
	$("#temporary-message").remove();
	try {
		// need to refresh the cache, either at start or if >=
		// 15 minutes after last fetch
		if (last_check == 0 ||  ts >= last_check + maintenance_delay) {
			msg = await $().get(api.urls["maintenance"]);
			localStorage.setItem("maint_msg", msg);
			localStorage.setItem("maint_last_check", ts);
		}
		// Bail out on empty message (404s fall here as well)
		if (msg.length == 0) {
			return;
		}
		$("body").prepend(msg);
	}
	catch (error) {
		// Things go really bad, or we're rebooting...
		console.error(error);
		$("body").prepend(`
			<div id="temporary-message" data-color="red"
				     data-en="The API server cannot be reached!
				     Check out the <a href='https://cort.go.yo.fr' target='_blank' style='color:#9b0000'>backup site</a> if needed!"
				     data-fr="Le serveur API est inaccessible !
				     <a href='https://cort.go.yo.fr' target='_blank' style='color:#9b0000'>Consultez le site de secours</a> si nécessaire !"
				     data-es="¡No se puede alcanzar el servidor de la API!
				     <a href='https://cort.go.yo.fr' target='_blank' style='color:#9b0000'>Consulta el sitio de respaldo</a> si es necesario."
				     data-de="Der API-Server ist nicht erreichbar!
				     <a href='https://cort.go.yo.fr' target='_blank' style='color:#9b0000'>Besuchen Sie die Backup-Seite</a> falls nötig!"
			>
			</div>
		`);
	}
	finally {
		temporary_message();
	}
};
maintenance();
setInterval(maintenance, maintenance_delay);

