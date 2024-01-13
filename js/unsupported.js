// needs to be separated from browserquirks.js because old IE would fail before
// executing that code
function modules_or_die() {
	try {
		if (!("noModule" in HTMLScriptElement.prototype))
			throw("No support for JS modules");
	}
	catch (_unused) {
		document.body.innerHTML = "" +
			"<h1>Your browser is too outdated for using CoRT. " +
			"Please <a href='http://browser-update.org/update-browser.html'>upgrade your browser</a>.</h1>";
	}
}
window.onload = modules_or_die;
