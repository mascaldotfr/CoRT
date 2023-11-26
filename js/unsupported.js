// needs to be separated from browserquirks.js because old IE would fail before
// executing that code
function async_or_die() {
	try {
		eval("async () => {}");
	}
	catch (_unused) {
		document.body.innerHTML = "" +
			"<h1>Your browser is too outdated for using CoRT. " +
			"Please <a href='http://browser-update.org/update-browser.html'>upgrade your browser</a>.</h1>";
	}
}

try {
	document.addEventListener("DOMContentLoaded", async_or_die);
}
catch (_unused) {
	window.onload = async_or_die;
}
