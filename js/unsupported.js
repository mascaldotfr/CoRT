function async_or_die() {
	try {
		eval("async () => {}");
	}
	catch (_unused) {
		console.log("async() failed");
		document.body.innerHTML = "" +
			"<h1>Your browser is too outdated for using CoRT. " +
			"Please <a href='http://browser-update.org/update-browser.html'>upgrade your browser</a>.</h1>";
		document.body.appendChild(e);
	}
}
try {
	document.addEventListener("DOMContentLoaded", async_or_die);
}
catch (_unused) {
	window.attachEvent("onload", async_or_die);
}


