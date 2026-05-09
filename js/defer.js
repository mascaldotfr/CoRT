// Non critical core JS stuff should be put here when applicable
// It's usually called at the end of main JS code

import { $, _, api, TrainerConstants } from "./libs/cortlibs.js";

// SEO stuff
const currentlang = localStorage.getItem("lang");
if (currentlang != "en") {
	$("html").attr("lang", currentlang);
	const descr = $('meta[name="description"]');
	const en_descr = descr.attr("content");
	descr.attr("content", _(en_descr));
}

// Theming
const colorschemechooser = $("#colorschemechooser");
if (SUPPORT_NESTED) {
	colorschemechooser.val(localStorage.getItem("colorscheme") || "");

	function apply_scheme(scheme) {
		const html = $("html");
		html.removeAttr("data-prefers-colorscheme");
		html.attr("data-prefers-colorscheme", scheme);
	}

	function scheme_switch() {
		const scheme = colorschemechooser.val();
		localStorage.setItem("colorscheme", scheme);
		apply_scheme(scheme)
	}

	colorschemechooser.on("change", scheme_switch);
	window.addEventListener("storage", (e) => {
		// Sync other tabs
		if (e.key === "colorscheme") {
			const scheme = e.newValue || "";
			colorschemechooser.val(scheme);
			apply_scheme(scheme);
		}
	});
}
else {
	colorschemechooser.attr("disabled", "");
	colorschemechooser.attr("title", "Your browser is too old to support themes!");
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


// BZ / BOSSES status in the menu
// Check minutely
const status_delay = 1 * 60 * 1000;
// Warn if bosses respawn within that time frame
const boss_delay = 30 * 60 * 1000;
const lSkey = "sentinel_api_result";
async function menu_status() {
	try {
		const now = new Date().getTime();
		let last_fetch = JSON.parse(localStorage.getItem(lSkey));
		if (last_fetch !== null) {
			const bz_is_no_more_on = last_fetch["bz"]["bzon"] && now > last_fetch["bz"]["bzendsat"] * 1000;
			const bz_just_started = !last_fetch["bz"]["bzon"] && now > last_fetch["bz"]["bzbegin"][0] * 1000;
			const boss_has_spawned = now > last_fetch["bosses"]["next_boss_ts"] * 1000;
			if (bz_is_no_more_on || bz_just_started || boss_has_spawned)
				last_fetch = null;
		}
		if (last_fetch === null) {
			last_fetch = await $().getJSON(api.urls["sentinel"]);
			localStorage.setItem(lSkey, JSON.stringify(last_fetch));
		}

		const bz_selector = $("#menu-bz");
		const bosses_selector = $("#menu-bosses");
		const boss_will_spawn = now + boss_delay >= last_fetch["bosses"]["next_boss_ts"] * 1000;

		if (last_fetch["bz"]["bzon"])
			bz_selector.attr("title", "BZ ON!");
		else
			bz_selector.attr("title", "");
		if (boss_will_spawn)
			bosses_selector.attr("title", "A boss will appear soon!");
		else
			bosses_selector.attr("title", "");
		bz_selector.attr("menu-status", String(last_fetch["bz"]["bzon"]));
		bosses_selector.attr("menu-status", String(boss_will_spawn));

	}
	catch(_unused) { console.error(_unused) }
}
menu_status();
setInterval(menu_status, status_delay);
document.addEventListener("visibilitychange", () => {
	if (!document.hidden)
		menu_status();
});

// preloading on idle
if ("requestIdleCallback" in window) {
	const prefetch_stale = 60 * 60 * 1000;
	const now = Date.now();
	const last_prefetch = parseInt(localStorage.getItem("last_prefetch")) || 0;
	if (now > last_prefetch + prefetch_stale) {
		localStorage.setItem("last_prefetch", now);
		const urls = [
			"bosses.html", "js/bosses.js",
			"wz.html", "js/wz.js", "js/wztools/wztools.js",
			"data/warstatus/base_map.png",
			"wevents.html", "js/wevents.js",
			"wstats.html", "js/wstats.js", "js/libs/chartist.js",
			"bz.html", "js/bz.js",
			"tstats.html", "js/tstats.js",
			"./", "js/trainer.js", "js/libs/floating-ui-tooltip.js",
			`data/trainer/${TrainerConstants.datasets[TrainerConstants.datasets.length - 1]}/trainerdata.json?epoch=1`
		];
		requestIdleCallback(() => {
			urls.forEach(url => {
				fetch(url, { cache: "default" }).catch(() => {});
			});
		});
	}
}
