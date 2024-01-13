import {_} from "./i18n.js";
import {__i18n__} from "../data/i18n_db.js";
import {$} from "./lamaiquery.js";

let __menu_external_link = `
<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAvUlEQVQ4y7WTMQ4CIRBFH8bS0gPY2ngCLfYqkHCoTWavsjWXgFPYOjbLujFAWBN/Axnm/598ZgDuMUYtwXuvAN774ruIqFFVTSkxzzPfcM6dgCdwEZGU69baT1NWog9GRFZ3VdUD/TAi8rLWMk3TWuwW2JKdc2aXgIhoiQxw/JUcQiCE0A5xG1jVodbQQT4D16JAHpyWczYoZjCOowF0OZuo/kIPedcc/E3AxBgVKC5TC8MwrPdHbZ1bWIxvbxir8kTznLrSAAAAAElFTkSuQmCC" style="height: .90em">
`;
let __menu_content = `
	<div id="hamburger">
	<a href="#" id="menu-toggler">${_("☰  Menu")}</a>
	</div>
	<div id="menu-content">
		<span class="menuitem"><b><a href="./">🏫${_("Trainer")}</a></b></span>
		<span class="menuitem"><b><a href="wz.html">🪓${_("WZ status")}</a></b></span>
		<span class="menuitem"><b><a href="bosses.html">👾${_("Bosses status")}</a></b></span>
		<span class="menuitem"><b><a href="bz.html">🏟${_("BZ status")}</a></b></span>
		<span class="menuitem"><b><a href="wevents.html">🗓️${_("WZ events")}</a></b></span>
		<span class="menuitem"><b><a href="wstats.html">📊${_("WZ statistics")}</a></b></span>
		<span class="menuitem"><a href="https://poludnica.shinyapps.io/configs/" target="_blank">📈${_("Trainer statistics")}
		${__menu_external_link}</a></span>
		<span class="menuitem"><a href="https://poludnica.shinyapps.io/rcalc/" target="_blank">🛡${_("Armor calculator")}
		${__menu_external_link}</a></span>
		<select id="lang">
			<option value="en">🇬🇧 English</option>
			<option value="de">🇩🇪 Deutsch</option>
			<option value="es">🇪🇸 Español</option>
			<option value="fr">🇫🇷 Français</option>
		</select>
	</div>
`;
let __menu_footer = `
		<p><i>CoRT is a free and open source website, feel free to check out its
		<a href="https://github.com/mascaldotfr/CoRT" target="_blank">source code</a>, and report
		<a href="https://github.com/mascaldotfr/CoRT/wiki/Bug-reports" target="_blank">bugs</a>.
		<!--VERSION-->Version: 20240113.121439
		</i></p>
`;

let __menu_old_menu_width = 100000000;
let __menu_toggle_state = false;

function toggle_menu() {
	__menu_toggle_state = !__menu_toggle_state;
	let display = __menu_toggle_state ? "block" : "none";
	let link_text = __menu_toggle_state ? _("╳ Hide Menu") : _("☰  Menu");
	$("#menu-toggler").text(link_text);
	$("#menu-content").css("display", display);
}

function menu_adapt() {
	if (window.innerWidth >= 800) {
		toggle_menu();
		$("#hamburger").css("display", "none");
		$("#menu-content").css("display", "flex");
	}
	else if (__menu_old_menu_width >= 800) {
		// ^ Ensure we don't hide the menu if the mobile
		// layout was already used
		$("#hamburger").css("display", "block");
		$("#menu-content").css("display", "none");
	}
	__menu_old_menu_width = window.innerWidth;
}

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
	$("#menu-toggler").on("click", toggle_menu);
	menu_adapt();
	window.addEventListener("resize", menu_adapt);

});
