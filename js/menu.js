import {_} from "./i18n.js";
import {__i18n__} from "../data/i18n_db.js";
import {$} from "./lamaiquery.js";

let __menu_external_link = `
<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAvUlEQVQ4y7WTMQ4CIRBFH8bS0gPY2ngCLfYqkHCoTWavsjWXgFPYOjbLujFAWBN/Axnm/598ZgDuMUYtwXuvAN774ruIqFFVTSkxzzPfcM6dgCdwEZGU69baT1NWog9GRFZ3VdUD/TAi8rLWMk3TWuwW2JKdc2aXgIhoiQxw/JUcQiCE0A5xG1jVodbQQT4D16JAHpyWczYoZjCOowF0OZuo/kIPedcc/E3AxBgVKC5TC8MwrPdHbZ1bWIxvbxir8kTznLrSAAAAAElFTkSuQmCC" style="height: .90em">
`;
let __menu_content = `
	<input type="checkbox" id="menu-click">
	<label for="menu-click" class="menu-btn"><span class="bold">${_("☰  Menu")}</span></label>
	<header>
		<ul id="menu-links">
		<li class="menuitem bold"><a href="./">🏫${_("Trainer")}</a></li>
		<li class="menuitem bold"><a href="wz.html">🪓${_("WZ status")}</a></li>
		<li class="menuitem bold"><a href="bosses.html">👾${_("Bosses status")}</a></li>
		<li class="menuitem bold"><a href="bz.html">🏟${_("BZ status")}</a></li>
		<li class="menuitem bold"><a href="wevents.html">🗓️${_("WZ events")}</a></li>
		<li class="menuitem bold"><a href="wstats.html">📊${_("WZ statistics")}</a></li>
		<li class="menuitem"><a href="https://poludnica.shinyapps.io/configs/" target="_blank">📈${_("Trainer statistics")}
		${__menu_external_link}</a></li>
		<li class="menuitem"><a href="https://poludnica.shinyapps.io/rcalc/" target="_blank">🛡${_("Armor calculator")}
		${__menu_external_link}</a></li>
		<li class="menuitem">
		<select id="lang">
			<option value="en">🇬🇧 English</option>
			<option value="de">🇩🇪 Deutsch</option>
			<option value="es">🇪🇸 Español</option>
			<option value="fr">🇫🇷 Français</option>
		</select>
		</li>
		</ul>
	</header>
`;
let __menu_footer = `
		<p><i>CoRT is a free and open source website, feel free to check out its
		<a href="https://github.com/mascaldotfr/CoRT" target="_blank">source code</a>, and report
		<a href="https://github.com/mascaldotfr/CoRT/wiki/Bug-reports" target="_blank">bugs</a>.
		<!--VERSION-->Version: 20240113.153322
		</i></p>
`;

$(document).ready(function() {

	$("#menu").html(__menu_content);
	$("#footer").append(__menu_footer);
	let lang = localStorage.getItem("lang");
	if (__i18n__.supported_lang.includes(lang))
		$("#lang").val(lang);
	$("#lang").on("change", function() {
		localStorage.setItem("lang", $("#lang").val());
		location.reload();
	});
});
