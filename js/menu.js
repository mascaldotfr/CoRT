let external_link = `
<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAvUlEQVQ4y7WTMQ4CIRBFH8bS0gPY2ngCLfYqkHCoTWavsjWXgFPYOjbLujFAWBN/Axnm/598ZgDuMUYtwXuvAN774ruIqFFVTSkxzzPfcM6dgCdwEZGU69baT1NWog9GRFZ3VdUD/TAi8rLWMk3TWuwW2JKdc2aXgIhoiQxw/JUcQiCE0A5xG1jVodbQQT4D16JAHpyWczYoZjCOowF0OZuo/kIPedcc/E3AxBgVKC5TC8MwrPdHbZ1bWIxvbxir8kTznLrSAAAAAElFTkSuQmCC" style="height: .90em">
`;
let menu = `
	<div id="menu">
	<div id="hamburger">
	<a href="javascript:toggle_menu('on')" id="menu_toggler">${_("☰  Menu")}</a>
	</div>
	<div id="menu-content">
		<span class="menuitem">🏫<b><a href="index.html">${_("Trainer")}</a></b></span>
		<span class="menuitem">🪓<b><a href="wz.html">${_("WZ status")}</a></b></span>
		<span class="menuitem">👾<b><a href="bosses.html">${_("Bosses status")}</a></b></span>
		<span class="menuitem">🏟<b><a href="bz.html">${_("BZ status")}</a></b></span>
		<span class="menuitem">🛡<a href="https://poludnica.shinyapps.io/rcalc/" target="_blank">${_("Armor Calculator")}
		${external_link}</a></span>
		<select id="lang">
			<option value="en">🇬🇧 English</option>
			<option value="de">🇩🇪 Deutsch</option>
			<option value="es">🇪🇸 Español</option>
			<option value="fr">🇫🇷 Français</option>
		</select>
	</div>
	</div>
`;
let footer = `
	<div id="footer">
		<p><i>CoRT is a free and open source website, feel free to check out its
		<a href="https://github.com/mascaldotfr/CoRT" target="_blank">source code</a>, and report
		<a href="https://github.com/mascaldotfr/CoRT/wiki/Bug-reports" target="_blank">bugs</a>.</i></p>
	</div>
`;

let old_menu_width = 100000000;

function menu_adapt() {
	if (window.innerWidth >= 800) {
		toggle_menu("off");
		$("#hamburger").css("display", "none");
		$("#menu-content").css("display", "block");
	}
	else if (old_menu_width >= 800) {
		// ^ Ensure we don't hide the menu if the mobile
		// layout was already used
		$("#hamburger").css("display", "block");
		$("#menu-content").css("display", "none");
	}
	old_menu_width = window.innerWidth;
}

function toggle_menu(state) {
	next_state = state == "on" ? "off" : "on";
	display = state == "on" ? "block" : "none";
	link_text = next_state == "on" ? _("☰  Menu") : _("╳ Hide Menu");
	$("#menu_toggler").attr("href", `javascript:toggle_menu("${next_state}")`);
	$("#menu_toggler").text(link_text);
	$("#menu-content").css("display", display);
}


$(document).ready(function() {

	$("#main-container").prepend(menu);
	$("body").append(footer);
	cookie = decodeURIComponent(document.cookie).split("=");
	if (cookie[0] == "__i18n__lang" && __i18n__.supported_lang.includes(cookie[1])) {
		$("#lang").val(cookie[1]);
	}
	$("#lang").on("change", function() {
		document.cookie = "__i18n__lang=" + $("#lang").val();
		location.reload();
	});
	menu_adapt();
	window.addEventListener("resize", menu_adapt);

});
