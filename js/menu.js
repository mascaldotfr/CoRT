// On top of the menu, this files contains some globals not really fitting
// elsewhere, since this file is always executed
import {$, _, __i18n__, api, myTz} from "./libs/cortlibs.js";

// Remove the huge __menu_icons object entirely

let __menu_content = function () { return `
	<input type="checkbox" id="menu-click">
	<label for="menu-click" class="menu-btn" id="menu-mobile"><span id="menu-mobile-cortlogo" class="menu-icon-cortlogo"></span><span class="bold">${_("Menu")}</span></label>
	<ul id="menu-links">
		<li class="menu-desktop menuitem"><a href="." id="menu-desktop-cortlogo" title="CoRT Homepage"><span class="menu-icon-cortlogo"></span></a></li>
		<li class="menuitem bold"><a href="./"><span class="menu-icon-trainer"></span> ${_("Trainer")}</a></li>
		<li class="menuitem bold"><a href="wz.html"><span class="menu-icon-wz"></span> ${_("WZ status")}</a></li>
		<li class="menuitem bold"><a href="bosses.html" id="menu-bosses"><span class="menu-icon-bosses"></span> ${_("Bosses")}</a></li>
		<li class="menuitem bold"><a href="bz.html" id="menu-bz"><span class="menu-icon-bz"></span> ${_("BZ status")}</a></li>
		<li class="menuitem bold"><a href="wevents.html"><span class="menu-icon-wevents"></span> ${_("WZ events")}</a></li>
		<li class="menuitem bold"><a href="wstats.html"><span class="menu-icon-wstats"></span> ${_("WZ statistics")}</a></li>
		<li>
		<details class="menudetails">
			<summary><span class="menu-icon-more"></span> ${_("More Tools...")}</summary>
			<ul class="menudetails">
				<li><span class="menu-icon-tstats"></span>&nbsp;<a href="tstats.html">${_("Trainer statistics")}</a></li>
				<li><span class="menu-icon-quests"></span>&nbsp;<a href="quests.html" title="Quest reset times">${_("Quests")}</a>
				<li><span class="menu-icon-sentinel"></span>&nbsp;<a href="https://regnumsentinel.com" title="All Regnum at a glance" target="_blank">Sentinel</a>
				<li><span class="menu-icon-armor"></span>&nbsp;<a href="https://poludnica.shinyapps.io/rcalc/" target="_blank">${_("Armor calculator")}</a>
				<li><span class="menu-icon-tools4regnum"></span>&nbsp;<a href="https://tools4regnum.de/?utm_source=CoRT" target="_blank" title="Game assets in your browser">Tools4Regnum</a>
			</ul>
		</details>
		</li>
		<li>
		<details class="menudetails">
		<summary id="menu-lang-current"></summary>
		<ul class="menudetails" id="menu-lang-list"></ul>
		</li>
	</ul>
`; };

const __menu_github_stuff = function () {
	const official = ["cort.ovh", "cort.go.yo.fr"];
	if (!official.includes(window.location.host))
		return ""; // Not official!
	const src = `<a href="https://codeberg.org/mascal/CoRT" target="_blank">
			${_("source code")}</a>`;
	const bugs = `<a href="https://codeberg.org/mascal/CoRT/wiki/Bug-reports" target="_blank">
			${_("report bugs")}</a>`;
	const dc = `<a href="https://discord.cort.ovh" target="_blank">
			${_("Discord server")}</a>`;
	return _("CoRT is a free and open source website, feel free to check out its %s, and %s. See also the %s!",
		 src, bugs, dc)
}
const __menu_footer = function() { return `
	<div id="footer-options" class="card">
		<div id="tz"><div id="tztitle">${_("Timezone")}&emsp;</div><select id="tzchooser"></select></div>
		<div id="colorscheme"><div id="colorschemetitle">${_("Theme")}&emsp;</div>
			<select id="colorschemechooser">
				<option value="" default>Dark (Default)</option>
				<option value="Light">Light</option>
				<option value="Alsius">Alsius</option>
				<option value="Ignis">Ignis</option>
				<option value="Syrtis">Syrtis</option>
			</select>
		</div>
	</div>
	<p class="italic">${__menu_github_stuff()}
	<p> <!--VERSION-->Version: 20260825.171146
	(<a href="#" id="reset_powers" title="Clear all CoRT cached data. Use this in case of errors.">/reset_powers</a>)
`; };

$(document).ready(function() {

	let langs = {
		"en": "EN",
		"de": "DE",
		"es": "ES",
		"fr": "FR"
	};

	let currentlang = "en";
	let storedlang = localStorage.getItem("lang");
	if (__i18n__.supported_lang.includes(storedlang))
		currentlang = storedlang;

	// Language override forced through URL parameter
	let urlparm = new URLSearchParams(window.location.search);
	if (urlparm.has("lang") && __i18n__.supported_lang.includes(urlparm.get("lang"))) {
		currentlang = urlparm.get("lang");
		localStorage.setItem("lang", currentlang);
	}

	// XXX all language dependent stuff should come after this line

	$("#menu").html(__menu_content());
	$("#footer").html(__menu_footer());

	$("#menu-lang-current").html(`<span data-lang="${langs[currentlang].toLowerCase()}">${langs[currentlang]}</span>`);
	// Make details dropdowns close on outside click
	document.addEventListener("click", (e) => {
		document.querySelectorAll("details.menudetails[open]").forEach((el) => {
			if (!el.contains(e.target)) {
				el.removeAttribute("open");
			}
		});
	});

	// generate languages list
	// jshint -W083
	const current_url = new URL(window.location.href);
	current_url.searchParams.delete("lang");
	const self_url = current_url.toString();
	for (let l in langs) {
		// Hide current language
		if (l == currentlang)
			continue;
		let lang_href = `${self_url}?lang=${l}`;

		$("#menu-lang-list").append(`
			<li class="langoption" id="menu-lang-${l}" data-lang="${l}"><a href="${lang_href}" hreflang="${l}">${langs[l]}</a>`);
		$(`#menu-lang-${l}`).on("click", (e) => {
			// warn in case you're in a setup...
			const trainer_dpoints_left = $("#t-dpointsleft").text();
			const in_setup = trainer_dpoints_left !== undefined;
			localStorage.setItem("lang", l);
			if (in_setup) {
				e.preventDefault();
				$("#t-save-bypass-menu").trigger("click");
			}
		});
		// Add alternate links
		const link = document.createElement("link");
		link.rel = "alternate";
		link.hreflang = l;
		link.href = `${self_url}?lang=${l}`;
		document.head.appendChild(link);
	}

	const tz = new myTz()
	tz.create_tz_list("#tzchooser");


});
