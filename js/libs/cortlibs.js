class ApiURL {
	// This class allows you to easily switch the data sources and urls if you
	// don't want use the github site and my data. You may need to fiddle with paths
	// since my api base has not the same structure than the repo. If you git pull,
	// don't forget to copy this file in a temp directory and copying it back after
	// the pull!

	// You will also need to change the preload directives in some
	// wz/wevents/wstats/tstats, or remove them if the API server and the server
	// you serve the pages is the same.

	constructor() {
		// https://mascaldotfr.github.io/CoRT uses an external API server as an
		// exception. Also allow local testing to use the official API, with
		// the exception of submitting trainer setups. In case you're deploying
		// the API locally as well, either tweak the line or reach your server
		// through 127.0.0.1 instead of localhost.
		this.base = "";
		this.frontsite = "";
		let frontend_with_no_api = ["localhost", "mascaldotfr.github.io", "beta.cort.ovh"];
		if (frontend_with_no_api.includes(window.location.hostname)) {
			// The root where all API files can be found
			this.base = "https://cort.ovh/api";
			// Used by the trainer to filter setup submissions
			this.frontsite = "https://cort.ovh";
		}
		else {
			// If you keep everything under the same directory and
			// domain, things are done magically
			const path = window.location.pathname;
			const base_path = path.substring(0, path.lastIndexOf('/') + 1);
			const base_url = window.location.origin + base_path;
			this.base = base_url + "api";
			this.frontsite = window.location.origin;
		}
		this.urls = {
			"submit_trainer": `${this.base}/bin/collect/submit.php`,
			"trainer_data": `${this.base}/var/trainer_saved_setups.txt`,
			"trainer_data_stats": `${this.base}/bin/collect/trainer_stats.php`,
			"events": `${this.base}/var/allevents.json`,
			"events_dump": `${this.base}/bin/warstatus/stats/dump_generator.php`,
			"stats": `${this.base}/var/statistics.json`,
			"wstatus": `${this.base}/var/warstatus.json`,
			"bosses": `${this.base}/bin/bosses/bosses.php`,
			"bz": `${this.base}/bin/bz/bz.php`,
			"maintenance": `${this.base}/var/maintenance.txt`,
		};
	}
}
export const api = new ApiURL();

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


/* XXX
 * myTZ: a tiny timezone chooser and manager
 * Note that your code must convert to the correct timezone for display.
 * On old browsers, it downgrades to UTC and local timezone only.
 * Released under the MIT License
 */


export class myTz {
	#get_system_tz() {
		let tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
		if (tz === undefined) {
			let offset = new Date().getTimezoneOffset() / 60;
			let sign = offset < 0 ? "+" : "-";
			offset = Math.abs(offset);//.toString().padStart(2, "0");
			tz = `Etc/GMT${sign}${offset}`;
		}
		return tz;
	}

	#display_tz_list(selector, options, storedtz) {
		let target = document.querySelector(selector);
		target.innerHTML = options;
		target.addEventListener("change", function (x) {
			localStorage.setItem("tz", target.value);
			location.reload();
		});
		target.value = storedtz;
	}

	create_tz_list(selector) {
		let human_tzs = {};
		let now = Date.now();
		let cache_duration = 1000 * 3600 * 24 * 7; // 7-day cache
		let storedtz = localStorage.getItem("tz");
		let cached_tz_list = localStorage.getItem("tzlisthtml");
		let cached_tz_list_ts = localStorage.getItem("tzlisthtmlts");

		// Cache HIT
		if (cached_tz_list != null && cached_tz_list_ts != null &&
		    now - cached_tz_list_ts <= cache_duration) {
			this.#display_tz_list(selector, cached_tz_list, storedtz);
			return;
		}

		// Cache MISS
		console.info("create_tz_list: cache timeout");
		localStorage.setItem("tzlisthtmlts", now);

		try {
			for (let tz of Intl.supportedValuesOf("timeZone")) {
				let humantz = tz.replace(/^[^\/]+\//, "");
				human_tzs[humantz] = tz;
			}
		}
		catch (_unused) {
			// compat with old browsers
			let localtz = this.#get_system_tz();
			let shorttz = localtz.replace(/^[^\/]+\//, "");
			human_tzs[shorttz] = localtz;
		}
		human_tzs["UTC"] = "UTC";
		human_tzs["Local"] = this.#get_system_tz();

		let options = "";
		for (let tz of Object.keys(human_tzs).sort())
			options += `<option value="${human_tzs[tz]}">${tz}</option>`;

		if (storedtz === undefined || Object.values(human_tzs).indexOf(storedtz) < 0)
			storedtz = this.#get_system_tz();
		localStorage.setItem("tz", storedtz);

		this.#display_tz_list(selector, options, storedtz);

		localStorage.setItem("tzlisthtml", options);
	}

}

/* XXX MyNotify : a simple javacript notification system */


export class MyNotify {
	#swsupport;
	constructor() {
		this.#swsupport = ("Notification" in window && "serviceWorker" in navigator);
		try {
			navigator.permissions
				.query({ name: "notifications" })
				.then((permissionStatus) => {
					permissionStatus.onchange = () => {
						if (permissionStatus.state === "prompt")
							this.insert_notification_link();
					};
				});
		}
		catch(_unused) { /* Unsupported by safari */ }
		if (this.#swsupport)
			navigator.serviceWorker.register("sw.js");
	}

	insert_notification_link() {
		if (!this.#swsupport || Notification.permission !== "default")
			return;
		$("#title").append(`
			<a href="#" id="ask-notifications" class="nodeco" title="Notifications">&nbsp;🔔</a>
		`);
		$("#ask-notifications").on("click", function () {
			$("#ask-notifications").remove();
			Notification.requestPermission();
		});
	}

	emit(title, text, tag) {
		const options = {
			icon: "favicon.png",
			body: text,
			tag: tag,
			renotify: true,
			vibrate: [100, 50, 100]
		};
		if (this.#swsupport && Notification.permission === "granted") {
			navigator.serviceWorker.ready.then( reg => {
				reg.showNotification(title, options);
			});
		}
	}
}


// XXX Schedule minutely things. See /js/libs/ticker.js for code, and WZ/BZ/BOSSES for usage
export class MyScheduler {
	constructor(start, end, callback) {
		this.start = start;
		this.end = end;
		this.callback = callback;
		this.last_focus = Date.now();

		// initial display
		this.worker = new Worker("./js/libs/ticker.js?bundlereplaceme");
		this.worker.postMessage({"init": {"start": this.start, "end": this.end}});
		// If it ticks, run this
		this.worker.onmessage = this.callback;
	}

	start_scheduling() {
		// Always ensure we have fresh data, particulary on mobile, with a 5s
		// debounce
		window.addEventListener("focus", () => {
			const ts = Date.now();
			if (ts - this.last_focus > 5000) {
				this.last_focus = ts;
				this.force_run();
			}
		});
	}

	force_run(...args) {
		// On manual run, always update the last run timestamp before calling the callback
		this.worker.postMessage({"update_last_run": {"ts": this.last_focus}});
		this.callback(...args);
	}
}

// XXX Time
export class Time {
	// Return the current time as a Unix timestamp
	timestamp_now() {
		return Math.floor(new Date().getTime() / 1000);
	}
	// Same as timestamp_now, but floor to the minute start
	timestamp_floor() {
		return Math.floor(this.timestamp_now() / 60) * 60;
	}
	// Take a unix timestamp as entry, and humanise the time left until that
	// timestamp. If you want passed time instead, use "passed=true"
	// if floor is set to true, the timestamp will use the minute timestamp
	// Return an associate arrays with the individual time markers, and a
	// humanised/localised version of it.
	timestamp_ago(ts, passed=false, floor=false) {
		let _in = {};
		let time_diff = 0;
		if (ts === null)
			return {"human":null, "days":null, "hours":null, "minutes": null};
		let now = floor ? this.timestamp_floor() : this.timestamp_now();
		if (passed)
			time_diff = now - ts;
		else
			time_diff = ts - now;
		_in["days"] = Math.floor(time_diff / (24 * 3600));
		time_diff -= _in["days"] * 24 * 3600;
		_in["hours"] = Math.floor(time_diff / 3600);
		time_diff -= _in["hours"] * 3600;
		_in["minutes"] = Math.floor(time_diff / 60);
		_in["human"] = "";
		for (let dt_elem in _in) {
			if (_in[dt_elem] == 0 || dt_elem == "human")
				continue; // don't count empty values and human version
			_in["human"] += String(_in[dt_elem]).padStart(2, "0") + _(dt_elem[0]) + " ";
		}
		if (_in["human"] == "")
			_in["human"] = "00" + _("m"); // very fresh timestamp
		if (passed)
			_in["human"] = _("%s ago", _in["human"]);
		return _in;
	}
}

// XXX TrainerConstants
export const TrainerConstants = {
	// min player level
	minlevel: 10,
	// max player level
	maxlevel: 60,
	// minimum discipline level
	mindlevel: 1,
	// maximum discipline level
	maxdlevel: 19,
	// minimum power level
	minplevel: 0,
	// maximum power level
	maxplevel: 5,
	// class masks are used to fetch the good trees for any class
	class_type_masks: {
		archer: 0x10, hunter: 0x11, marksman: 0x12,
		mage: 0x20, conjurer: 0x21, warlock: 0x22,
		warrior: 0x40, barbarian: 0x41, knight: 0x42
	},
	// class list (will propagate to class order in trainer and trainer stats)
	classes: ["knight", "barbarian", "conjurer", "warlock", "hunter", "marksman"],
	// datasets available in `/data`, in ascending order (ALWAYS!)
	datasets: ["1.33.2", "1.33.3", "1.33.6", "1.33.12", "1.35.19"]
};


/*
 * Copyright (c) 2022-2025 mascal
 * A tiny i18n system. Released under the MIT license.
 */

export const __i18n__ = {
	"supported_lang": ["en", "fr", "es", "de"],
	" - CoRT - Champions of Regnum tools": {
		"fr": " - CoRT - Outils pour Champions of Regnum",
		"es": " - CoRT - Herramientas por Champions of Regnum",
		"de": " - CoRT - Werkzeuge für Champions von Regnum"
	},
	"Champions of Regnum trainer, war status, bosses respawn and bz countdowns": {
		"fr": "Trainer Champions of Regnum, statut de la WZ, réapparition des boss et compte à rebours des BZ",
		"es": "Entrenador de Champions of Regnum, estado de la ZG, reaparición de epicos y cuentas regresivas de BZ",
		"de": "Champions of Regnum Trainer, Kriegsstatus (WZ-Status), Boss-Respawns und BZ-Countdowns"
	},
	"Champions of Regnum bosses countdown and respawns (Evendim, Daen, Thorkul)": {
		"fr": "Compte à rebours et réapparitions des boss de Champions of Regnum (Evendim, Daen, Thorkul)",
		"es": "Cuenta regresiva y reapariciones de los epicos de Champions of Regnum (Evendim, Daen, Thorkul)",
		"de": "Countdown und Respawns der Champions of Regnum-Bosse (Evendim, Daen, Thorkul)"
	},
	"Champions of Regnum battlezone countdown, schedule and status": {
		"fr": "Compte à rebours, planning et statut des BZ de Champions of Regnum",
		"es": "Cuenta regresiva, horario y estado de las BZ de Champions of Regnum",
		"de": "Countdown, Zeitplan und Status der BZ von Champions of Regnum"
	},
	"Quests reset time for Champions of Regnum": {
		"fr": "Heure de réinitialisation des quêtes de Champions of Regnum",
		"es": "Hora de reinicio de las misiones de Champions of Regnum",
		"de": "Zurücksetzungszeit der Quests von Champions of Regnum"
	},
	"Champions of Regnum trainer statistics for all classes and versions": {
		"fr": "Statistiques du trainer de Champions of Regnum pour toutes les classes et versions",
		"es": "Estadísticas del entrenador de Champions of Regnum para todas las clases y versiones",
		"de": "Trainer-Statistiken von Champions of Regnum für alle Klassen und Versionen"
	},
	"Champions of Regnum events log: last dragon wishes, invasions and more!": {
		"fr": "Journal des événements de Champions of Regnum : derniers vœux du dragon, invasions et plus encore !",
		"es": "Registro de eventos de Champions of Regnum: últimos deseos del dragón, invasiones y más",
		"de": "Ereignisprotokoll von Champions of Regnum: letzte Drachenwünsche, Invasionen und mehr!"
	},
	"Champions of Regnum warzone statistics, last invasions, dragon wishes and gems steals!": {
		"fr": "Statistiques de la WZ de Champions of Regnum, dernières invasions, vœux du dragon et vols de gemmes !",
		"es": "Estadísticas de la ZG de Champions of Regnum, últimas invasiones, deseos del dragón y robos de gemas",
		"de": "WZ-Statistiken von Champions of Regnum, letzte Invasionen, Drachenwünsche und Edelsteindiebstähle!"
	},
	"Champions of Regnum warzone status and latest events, straight from the frontline!": {
		"fr": "Statut de la WZ de Champions of Regnum et derniers événements, directement depuis le front !",
		"es": "Estado de la ZG de Champions of Regnum y últimos eventos, ¡directo desde el frente!",
		"de": "WZ-Status und neueste Ereignisse von Champions of Regnum, direkt von der Frontlinie!"
	},
	"CoRT is a free and open source website, feel free to check out its %s, and %s. See also the %s!": {
		"fr": "CoRT est un site web libre et open source, n'hésitez pas à consulter son %s, et %s. Voyez aussi le %s !",
		"es": "CoRT es un sitio web libre y de código abierto, no dudes en consultar su %s, e %s. ¡Mira también el %s!",
		"de": "CoRT ist eine freie und quelloffene Website, schau dir gerne ihren %s und %s an. Schau auch auf den %s!"
	},
	"source code": {
		"fr": "code source",
		"es": "código fuente",
		"de": "Quellcode"
	},
	"report bugs": {
		"fr": "signaler les bugs",
		"es": "reportar los errores",
		"de": "Fehler melden"
	},
	"Discord server": {
		"fr": "serveur Discord",
		"es": "servidor Discord",
		"de": "Discord-Server"
	},
	"Trainer": {
		"fr": "Entraîneur",
		"es": "Entrenador",
		"de": "Skilltrainer"
	},
	"Bosses": {
		"comment": "menu",
		"fr": "Bosses",
		"es": "Épicos",
		"de": "Bosse"
	},
	"Bosses respawn times": {
		"comment": "titles",
		"fr": "Horaires de réapparition des boss",
		"es": "Horarios de reaparición de los epicos",
		"de": "Boss-Respawn-Zeiten"
	},
	"BZ status": {
		"fr": "Battlezone",
		"es": "Battlezone",
		"de": "Battle Zones"
	},
	"WZ status": {
		"fr": "Etat de la WZ",
		"es": "Estado de la ZG",
		"de": "WZ-Status"
	},
	"WZ events": {
		"fr": "Evénements de la WZ",
		"es": "Eventos de la ZG",
		"de": "WZ-Events"
	},
	"Quests": {
		"fr": "Quêtes",
		"es": "Misiones",
		"de": "Quests"
	},
	"WZ statistics": {
		"fr": "Stats de la WZ",
		"es": "Stats de la ZG",
		"de": "WZ-Statistik"
	},
	"Trainer statistics": {
		"fr": "Stats de l'entraîneur",
		"es": "Stats del entrenador",
		"de": "Skilltrainer-Statistik"
	},
	"More Tools...": {
		"fr": "Plus d'outils ...",
		"es": "Más herramientas...",
		"de": "Mehr Werkzeuge..."
	},
	"Armor calculator":
	{
		"fr": "Calcul d'armure",
		"es": "Cálculo de armadura",
		"de": "Rüstungsrechner"
	},
	"☰  Menu": {
		"fr": "☰  Menu",
		"es": "☰  Menú",
		"de": "☰  Menü"
	},
	"Timezone:": {
		"fr": "Fuseau horaire :",
		"es": "Zona horaria:",
		"de": "Zeitzone:"
	},
	"The page refreshes itself every minute.":
	{
		"fr": "La page est rafraîchie automatiquement toutes les minutes.",
		"es": "La página se actualiza automáticamente cada minuto.",
		"de": "Die Seite wird automatisch jede Minute aktualisiert."
	},
	"Last respawn":
	{
		"fr": "Dernière apparition",
		"es": "Última reaparición",
		"de": "Letzter Spawn"
	},
	"Next respawn in":
	{
		"fr": "Prochaine apparition dans",
		"es": "Próxima aparición en",
		"de": "Nächster Spawn in"
	},
	"should appear very soon!":
	{
		"fr": "devrait apparaître très bientôt !",
		"es": "debería aparecer muy pronto!",
		"de": "sollte sehr bald erscheinen!"
	},
	"d":
	{
		"comment": "short for days",
		"fr": "j",
		"es": "d",
		"de": "T"
	},
	"h":
	{
		"comment": "short for hours",
		"fr": "h",
		"es": "h",
		"de": "S"
	},
	"m":
	{
		"comment": "short for minutes",
		"fr": "m",
		"es": "m",
		"de": "min"
	},
	"Schedule":
	{
		"fr": "Planning",
		"es": "Calendario",
		"de": "Terminplan"
	},
	"All hours are local": {
		"fr": "Toutes les heures sont locales",
		"es": "Todas las horas son locales",
		"de": "Alle Uhrzeiten sind lokal"
	},
	"Ends in":
	{
		"fr": "Se termine dans",
		"es": "Acaba en",
		"de": "Endet in"
	},
	"Next BZ in":
	{
		"fr": "Prochaine BZ dans",
		"es": "Próxima BZ en",
		"de": "Nächste BZ in"
	},
	"ON":
	{
		"fr": "Ouverte",
		"es": "Abierta",
		"de": "Offen"
	},
	"OFF":
	{
		"fr": "Fermée",
		"es": "Cerrada",
		"de": "Geschlossen"
	},
	"BZ starting in": {
		"fr": "La BZ commence dans",
		"es": "La BZ comienza en",
		"de": "Die BZ beggint in"
	},
	"BZ is about to start!": {
		"fr": "La BZ va bientôt commencer !",
		"es": "La BZ esta a punto de comenzar!",
		"de": "Die BZ beginnt gleich!"
	},
	"BZ ending in": {
		"fr": "La BZ se termine dans",
		"es": "La BZ termina en",
		"de": "Die BZ endet in"
	},
	"BZ is about to end!": {
		"fr": "La BZ est sur le point de se terminer !",
		"es": "La BZ esta a punto de terminar!",
		"de": "Die BZ ist kurz vor dem Ende!"
	},
	"Hovering your mouse or clicking (on mobile) on a skill icon will show its description.":
	{
		"fr": "Passer la souris ou cliquer (sur mobile) sur l'îcone d'un sort montrera sa description.",
		"es": "Pasar el mouse o hacer clic (en el móvil) en el ícono de un hechizo, se mostrará su descripción.",
		"de": "Wenn du auf das Symbol eines Zaubers klickst (auf Mobilgeräten) oder mit der Maus darüber fährst, wird dessen Beschreibung angezeigt."
	},
	"Selecting an higher character level will upgrade your current setup to that level.":
	{
		"fr": "Selectionner un niveau du personnage supérieur à l'actuel transférera votre configuration à ce niveau.",
		"es": "Seleccionar un nivel de personaje superior al actual transferirá su configuración a ese nivel.",
		"de": "Wenn du ein höheres Level als das aktuelle auswählst, wird deine Konfiguration auf dieses Level übertragen."
	},
	"Necro crystal": {
		"fr": "Cristal nécromantique",
		"de": "Nekromant-Kristall",
		"es": "Cristal del raptor"
	},
	"Knight":
	{
		"fr": "Chevalier",
		"es": "Caballero",
		"de": "Ritter"
	},
	"Barbarian":
	{
		"fr": "Barbare",
		"es": "Bàrbaro",
		"de": "Barbar"
	},
	"Conjurer":
	{
		"fr": "Invocateur",
		"es": "Conjurador",
		"de": "Beschwörer"
	},
	"Warlock":
	{
		"fr": "Sorcier",
		"es": "Brujo",
		"de": "Hexenmeister"
	},
	"Hunter":
	{
		"fr": "Chasseur",
		"es": "Cazador",
		"de": "Jäger"
	},
	"Marksman":
	{
		"fr": "Tireur d'élite",
		"es": "Tirador",
		"de": "Schütze"
	},
	"Load / Reset":
	{
		"fr": "Charger / Réinitialiser",
		"es": "Cargar / Reiniciar",
		"de": "Laden / Zurücksetzen"
	},
	"Share / Save":
	{
		"fr": "Partager / Sauvegarder",
		"es": "Compartir / Guardar",
		"de": "Teilen / Sichern"
	},
	"Discipline points:":
	{
		"fr": "Points de discipline :",
		"es": "Puntos de disciplina:",
		"de": "Disziplinpunkte:"
	},
	"Power points:":
	{
		"fr": "Points de pouvoir :",
		"es": "Puntos de poder:",
		"de": "Kraftpunkte:"
	},
	"Current game version":
	{
		"fr": "Version actuelle du jeu",
		"es": "Versión actual del juego",
		"de": "Aktuelle Version des Spiels"
	},
	"Please select a level":
	{
		"fr": "Veuillez sélectionner un niveau",
		"es": "Por favor seleccione un nivel",
		"de": "Bitte wähle ein Level aus"
	},
	"Please select a class":
	{
		"fr": "Veuillez sélectionner une class",
		"es": "Por favor seleccione una clase",
		"de": "Bitte wähle eine Klasse aus"
	},
	"You need first to load trees by clicking on \"%s\"!":
	{
		"fr": "Avant tout, il est de nécessaire charger les arbres en cliquant sur « %s » !",
		"es": "¡En primer lugar, es necesario de cargar las ramas haciendo clic en \"%s\"!",
		"de": "Zunächst muss der Skillbaum geladen werden, indem auf „%s“ geklickt wird!"
	},
	"Here is the link to your setup:":
	{
		"fr": "Voici le lien vers votre configuration :",
		"es": "Aquí está el enlace a su configuración:",
		"de": "Hier ist der Link zu deiner Konfiguration:"
	},
	"This setup is being made with an older version (%s) of CoR, and may be out of date.":
	{
		"fr": "Cette configuration a été créée avec une vieille version de CoR (%s), et peut être dépassée.",
		"es": "Esta configuración se creó con una versión anterior de CoR (%s) y puede estar desactualizada.",
		"de": "Diese Konfiguration wurde mit einer alten Version von CoR (%s) erstellt und ist möglicherweise veraltet."
	},
	"This is the beta trainer for versions on Amun. Things can change quickly.":
	{
		"fr": "Ceci est l'entraîneur en beta pour les versions sur Amun. Les choses peuvent changer rapidement.",
		"es": "Este es el entrenador beta para las versiones de Amun. Las cosas pueden cambiar rápidamente.",
		"de": "Dies ist der Beta-Trainer für die Amun-Versionen. Dinge können sich schnell ändern."
	},
	"It's not recommended to permanently save setups in here.":
	{
		"fr": "Il n'est pas recommandé de sauvegarder les configurations de manière permamente ici.",
		"es": "No se recomienda guardar configuraciones permanentemente aquí.",
		"de": "Es wird nicht empfohlen, Setups hier dauerhaft zu speichern."
	},
	"Instead you should click here to convert your setup to the latest live version.":
	{
		"fr": "Vous devriez cliquer ici pour convertir votre configuration à la dernière version live.",
		"es": "En su lugar, deberías hacer clic aquí para convertir tu configuración a la ultima versión en vivo.",
		"de": "Stattdessen sollten Sie hier klicken, um Ihr Setup in die Live-Version zu konvertieren."
	},
	"Click here":
	{
		"fr": "Cliquez ici",
		"es": "Haga clic aquí",
		"de": "Klicke hier"
	},
	"to upgrade this setup's discipline and power points to the latest version (%s).":
	{
		"comment": "Comes after 'Click here'",
		"fr": "pour mettre à jour les points de discipline et de pouvoir vers la dernière version (%s).",
		"es": "para actualizar los puntos de poderes y de disciplinas a la última versión (%s).",
		"de": "um Disziplin- und Kraftpunkte auf die neueste Version (%s) zu aktualisieren."
	},
	"Your shared link is bad. Bailing out, sorry!":
	{
		"fr": "Ce lien partagé est mauvais. J'abandonne, désolé !",
		"es": "Este enlace compartido es malo. ¡Me doy por vencido, lo siento!",
		"de": "Der geteilte Link ist ungültig. Ich gebe auf, sorry!"
	},
	"Redirecting to the trainer page in":
	{
		"fr": "Redirection vers l'entraîneur dans",
		"es": "Redireccionando a la página del entrenador en",
		"de": "Weiterleitung zur Trainerseite in"
	},
	"Copy link":
	{
		"fr": "Copier le lien",
		"es": "Copiar el enlace",
		"de": "Link kopieren"
	},
	"Close":
	{
		"fr": "Fermer",
		"es": "Cerrar",
		"de": "Schließen"
	},
	"Link copied!":
	{
		"fr": "Lien copié !",
		"es": "¡Enlace copiado!",
		"de": "Link kopiert!"
	},
	"Fort %s": {
		"fr": "Fort %s",
		"es": "Fuerte %s",
		"de": "Fort %s"
	},
	"%s Castle": {
		"fr": "Château %s",
		"es": "Castillo %s",
		"de": "Schloss %s"
	},
	"Great Wall of %s": {
		"fr": "Grande Muraille de %s",
		"es": "Gran Muralla de %s",
		"de": "Große Mauer von %s"
	},
	"The page will update itself every minute.": {
		"fr": "La page sera rafraîchie toutes les minutes.",
		"es": "La página se actualizará cada minuto.",
		"de": "Die Seite wird jede Minute aktualisiert."
	},
	"Gem": {
		"fr": "Gemme",
		"es": "Gema",
		"de": "Juwel"
	},
	"has captured %s": {
		"fr": "a capturé %s",
		"es": "ha capturado %s",
		"de": "hat %s eingenommen"
	},
	"has recovered %s": {
		"fr": "a récupéré %s",
		"es": "ha recuperado %s",
		"de": "hat %s zurückerobert"
	},
	"Last server events (in your timezone):": {
		"fr": "Derniers événements :",
		"es": "Últimos eventos:",
		"de": "Neueste Serverereignisse:"
	},
	"More events": {
		"fr": "Plus d'événements",
		"es": "Más eventos",
		"de": "Weitere Events"
	},
	"is back.": {
		"fr": "est de retour.",
		"es": "ha retornado.",
		"de": "ist zurück."
	},
	"is in transit.": {
		"fr": "est en transit.",
		"es": "está en tránsito.",
		"de": "ist unterwegs."
	},
	"%s's relic": {
		"fr": "Relique de %s",
		"es": "Reliquia de %s",
		"de": "%s' Relikt"
	},
	"%s made a dragon wish!": {
		"fr": "%s a fait un voeu du dragon !",
		"es": "¡%s pidió un deseo de dragón!",
		"de": "%s hat einen Drachenwunsch geäußert!"
	},
	"Last updated:": {
		"fr": "Mis à jour :",
		"es": "Última actualización:",
		"de": "Letzte Aktualisierung:"
	},
	"Last event:": {
		"fr": "Dernier événement :",
		"es": "Último evento:",
		"de": "Letzter Eintrag:"
	},
	"All events over the last 14 days.": {
		"fr": "Tous les événements sur les derniers 14 jours.",
		"es": "Todos los eventos durante los últimos 14 días.",
		"de": "Alle Ereignisse der letzten 14 Tage."
	},
	"Download all events data": {
		"fr": "Télécharger toutes les données des évènements",
		"es": "Descargar todos los datos de eventos",
		"de": "Alle Veranstaltungsdaten herunterladen"
	},
	"Index": {
		"fr": "Index",
		"es": "Índice",
		"de": "Index"
	},
	"Latest key events": {
		"fr": "Derniers événements clés",
		"es": "Últimos eventos clave",
		"de": "Neueste wichtige Ereignisse",
	},
	"Last %s days": {
		"fr": "Les %s derniers jours",
		"es": "Últimos %s días",
		"de": "Letzte %s Tage"
	},
	"Invasion": {
		"fr": "Invasion",
		"es": "Invasión",
		"de": "Invasion"
	},
	"Gem stolen": {
		"fr": "Gemme volée",
		"es": "Gema robada",
		"de": "Juwel gestohlen"
	},
	"Forts captured": {
		"fr": "Forts capturés",
		"es": "Fuertes capturados",
		"de": "Forts erobert"
	},
	"Forts captured (total)": {
		"fr": "Forts capturés (total)",
		"es": "Fuertes capturados (total)",
		"de": "Forts erobert (total)"
	},
	"Most captured fort": {
		"fr": "Fort le plus capturé",
		"es": "Fuerte más capturado",
		"de": "Meist eingenommenes Fort"
	},
	"Forts recovered": {
		"fr": "Forts récupérés",
		"es": "Fuertes recuperados",
		"de": "Forts zurückerobert"
	},
	"Has invaded": {
		"fr": "A envahi",
		"es": "Invadió",
		"de": "Invasionen durchgeführt"
	},
	"Has been invaded": {
		"fr": "S'est fait envahir",
		"es": "Invadido",
		"de": "Invasionen erlitten"
	},
	"Stolen gems": {
		"fr": "Gemmes volées",
		"es": "Gemas robadas",
		"de": "Juwelen gestohlen"
	},
	"Lost gems": {
		"fr": "Gemmes perdues",
		"es": "Gemas perdidas",
		"de": "Juwelen verloren"
	},
	"Dragon wishes": {
		"fr": "Voeux du dragon",
		"es": "Deseos del dragón",
		"de": "Drachenwünsche"
	},
	"Dragon wish": {
		"fr": "Voeu du dragon",
		"es": "Deseo del dragón",
		"de": "Drachenwunsch"
	},
	"%s ago": {
		"fr": "il y a %s",
		"es": "hace %s",
		"de": "vor %s"
	},
	"Net average of fortifications captured per hour on the last %s days": {
		"fr": "Moyenne nette des fortifications capturées par heure les %s derniers jours",
		"es": "Promedio neto de las fortificaciones capturadas por hora en los últimos %s días",
		"de": "Nettodurchschnitt der in den letzten %s Tagen pro Stunde eroberten Befestigungen"
	},
	"Net average of invasions per hour on the last %s days": {
		"fr": "Moyenne nette des invasions par heure les %s derniers jours",
		"es": "Promedio neto de las invasiónes por hora en los últimos %s días",
		"de": "Nettodurchschnitt der Invasionen pro Stunde an den letzten %s Tagen"
	},
	"Total stolen gems per hour on the last %s days": {
		"fr": "Nombre total de gemmes volées par heure les %s derniers jours",
		"es": "Total de gemas robadas por hora en los últimos %s días",
		"de": "Insgesamt gestohlene Edelsteine pro Stunde an den letzten %s Tagen"
	},
	"Total dragon wishes per hour on the last %s days": {
		"fr": "Nombre total de voeux du dragon par heure les %s derniers jours",
		"es": "Total de deseos de dragón por hora en los últimos %s días",
		"de": "Gesamtzahl der Drachenwünsche pro Stunde an den letzten %s Tagen"
	},
	"Average fort holding time on the last %s days (in minutes)": {
		"fr": "Temps moyen de possession d'un fort les %s derniers jours (en minutes)",
		"es": "Tiempo promedio de ocupación del fuerte durante los últimos %s días (en minutos)",
		"de": "Durchschnittliche Festungshaltezeit während der letzten %s Tage (in Minuten)"
	},
	"Total forts holding time on the last %s days (in hours)": {
		"fr": "Temps total de possession des forts les %s derniers jours (en heures)",
		"es": "Tiempo total de ocupación de fuertes durante los últimos %s días (en horas)",
		"de": "Gesamthaltezeit der Forts während der letzten %s Tage (in Stunden)"
	},
	"Total count of captured enemy forts on the last %s days": {
		"fr": "Nombre total de forts ennemis capturés les %s derniers jours",
		"es": "Recuento total de fuertes enemigos capturados durante los últimos %s días",
		"de": "Gesamtzahl der eroberten feindlichen Forts in den letzten %s Tagen"
	},
	"Filter:": {
		"fr": "Filtre :",
		"es": "Filtro:",
		"de": "Filter:"
	},
	"Date:": {
		"fr": "Date :",
		"es": "Fecha:",
		"de": "Datum:"
	},
	"No matching event found!": {
		"fr": "Aucun événement correspondant trouvé !",
		"es": "¡No se ha encontrado ningún evento coincidente!",
		"de": "Keine passende Veranstaltung gefunden!"
	},
	"None": {
		"fr": "Aucun",
		"es": "Ningún",
		"de": "Keine"
	},
	"No forts": {
		"fr": "Sans forts",
		"es": "Sin fuertes",
		"de": "Ohne Festungen"
	},
	"Invasions only": {
		"fr": "Invasions uniquement",
		"es": "Solo invasiones",
		"de": "Nur Invasionen"
	},
	"Relics only": {
		"fr": "Reliques uniquement",
		"es": "Solo reliquias",
		"de": "Nur Relikte"
	},
	"Gems only": {
		"fr": "Gemmes uniquement",
		"es": "Solo gemas",
		"de": "Nur Juwelen"
	},
	"Dragon wishes only": {
		"fr": "Voeux du dragon uniquement",
		"es": "Solo deseos de dragón",
		"de": "Nur Drachenwünsche"
	},
	"Global": {
		"fr": "Genéral",
		"es": "Global",
		"de": "Global"
	},
	"Realms": {
		"fr": "Royaumes",
		"es": "Reinos",
		"de": "Reiche"
	},
	"Forts": {
		"fr": "Forts",
		"es": "Fuertes",
		"de": "Forts"
	},
	"For stats on older versions of Regnum <a id='ts-oldstats-link'>check this site</a>.": {
		"fr": "Les statistiques sur des versions plus anciennes de Regnum sont <a id='ts-oldstats-link'>sur ce site</a>.",
		"es": "Para estadísticas de versiones anteriores de Regnum <a id='ts-oldstats-link'>consulte este sitio</a>.",
		"de": "Für Statistiken zu älteren Versionen von Regnum <a id='ts-oldstats-link'>prüfen Sie diese Website</a>."
	},
	"No setups for that combo, bailing out!": {
		"fr": "Aucune configuration disponible pour cette combinaison, j'abandonne !",
		"es": "No hay configuración disponible para esta combinación, ¡me rindo!",
		"de": "Für diese Kombination ist keine Konfiguration verfügbar, ich gebe auf!"
	},
	"Version:": {
		"fr": "Version :",
		"es": "Versión:",
		"de": "Version:"
	},
	"Power:": {
		"fr": "Pouvoir :",
		"es": "Habilidad:",
		"de": "Skill:"
	},
	"Class:": {
		"fr": "Classe :",
		"es": "Clase:",
		"de": "Klass:"
	},
	"Skill level (frequency)": {
		"fr": "Niveau de pouvoir (fréquence)",
		"es": "Nivel de habilidad (frecuencia)",
		"de": "Skillslevel (Häufigkeit)"
	},
	"Downloading": {
		"fr": "Téléchargement de",
		"es": "Descargando",
		"de": "Heruntergeladen"
	},
	"Crunching numbers": {
		"fr": "Calcul des statistiques",
		"es": "Cálculo de estadísticas",
		"de": "Berechnung von Statistiken"
	},
	"Percentual use": {
		"fr": "Pourcentage d'utilisation",
		"es": "Uso porcentual",
		"de": "Prozentuale Nutzung"
	},
	"Quests Countdowns": {
		"fr": "Compte à rebours des quêtes",
		"es": "Cuentas regresivas de misiones",
		"de": "Quest-Countdowns"
	},
	"Tickets Delivery": {
		"fr": "Livraison de tickets",
		"es": "Entrega de tickets",
		"de": "Ticketzustellung"
	},
	"Warmaster Quests Reset": {
		"fr": "Réinit. des quêtes WM",
		"es": "Reinicio de misiones WM",
		"de": "WM-Quests-Zurücksetzung"
	},
	"Xymerald Quest Reset": {
		"fr": "Réinit. de la quête de Xymerald",
		"es": "Reinicio de la misión de Xymerald",
		"de": "Xymerald-Quest-Zurücksetzung"
	},
	"12 hours": {
		"fr": "12 heures",
		"es": "12 horas",
		"de": "12 Stunden"
	},
	"after you completed the last one.": {
		"fr": "après avoir terminé la précédente.",
		"es": "después de completar la anterior.",
		"de": "nach Abschluss der vorherigen."
	}
};

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
