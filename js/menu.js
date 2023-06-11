let menu = `
	<div id="menu">
		<b><a href="index.html">${_("Trainer")}</a></b>
		&nbsp;|&nbsp;
		<b><a href="bosses.html">${_("Bosses status")}</a></b>
		&nbsp;|&nbsp;
		<b><a href="bz.html">${_("BZ status")}</a></b>
		&nbsp;|&nbsp;
		<a href="https://github.com/mascaldotfr/CoRT" target="_blank">Source Code</a>
		&nbsp;|&nbsp;
		<a href="https://github.com/mascaldotfr/CoRT/wiki/Bug-reports" target="_blank">Bug Reports</a>
		&nbsp;
		<select id="lang">
			<option value="en">🇬🇧 English</option>
			<option value="de">🇩🇪 Deutsch</option>
			<option value="es">🇪🇸 Español</option>
			<option value="fr">🇫🇷 Français</option>
		</select>
	</div>
	`;

$(document).ready(function() {

	$("body").prepend(menu);
	cookie = decodeURIComponent(document.cookie).split("=");
	if (cookie[0] == "__i18n__lang" && __i18n__.supported_lang.includes(cookie[1])) {
		$("#lang").val(cookie[1]);
	}
	$("#lang").on("change", function() {
		document.cookie = "__i18n__lang=" + $("#lang").val();
		location.reload();
	});

});
