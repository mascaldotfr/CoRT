// Load better or censored by Microsoft (flags) emojis from google on Windows system
// See https://developers.google.com/fonts/docs/getting_started?hl=en
function loademojis() {
	if (window.navigator.userAgent.indexOf("Windows") == -1)
		return;
	console.log("Windows system, downloading fallback font for emojis");
	let head = document.getElementsByTagName("head")[0];
	// Fix windows ugly emojis
	let link = document.createElement("link");
	link.rel = "stylesheet";
	link.type = "text/css";
	link.href= "https://fonts.googleapis.com/css?family=Noto+Color+Emoji&text=%F0%9F%8F%AB%F0%9F%AA%93%F0%9F%91%BE%F0%9F%8F%9F%20%F0%9F%9B%A1%F0%9F%87%AC%F0%9F%87%A7%F0%9F%87%A9%F0%9F%87%AA%F0%9F%87%AA%F0%9F%87%B8%F0%9F%87%AB%F0%9F%87%B7";
	head.appendChild(link);
	// Bypass flags censorship
	let css = `
		@font-face {
			  font-family: 'Noto Color Emoji';
			  unicode-range: U+1F1E6-1F1FF;
			  src: url(https://fonts.gstatic.com/l/font?kit=Yq6P-KqIXTD0t4D9z1ESnKM3-HpFabt02vBCbApKdGkN9re66x3YHo71OOwmEizY9n9lm3yzxmcxS8KzYpw6YE-wb-TyPTM1R4xq1A&skey=a373f7129eaba270&v=v25) format('woff2');
		}
		#lang {
			font-family: sans-serif, 'Noto Color Emoji';
		}
	`;
	let style = document.createElement("style");
	style.type = "text/css";
	style.appendChild(document.createTextNode(css));
	head.appendChild(style);
};
loademojis();

// Website requires working async/await and by the way detects non ES8 browser
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
