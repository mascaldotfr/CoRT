// Load better or censored by Microsoft (flags) emojis from google on Windows system
// See https://developers.google.com/fonts/docs/getting_started?hl=en to create font subsets
// Base url: https://fonts.googleapis.com/css?family=Noto+Color+Emoji&text=🏫🪓👾🏟📊🗓️📈🛡🇬🇧🇩🇪🇪🇸🇫🇷
function loademojis() {
	if (window.navigator.userAgent.indexOf("Windows") == -1)
		return;
	console.log("Windows system, downloading fallback font for emojis");
	let head = document.getElementsByTagName("head")[0];
	let css = `
		/* Fix ugly emojis */
		@font-face {
			font-family: 'Noto Color Emoji';
			font-style: normal;
			font-weight: 400;
			src: url('data/fonts/noto_color_emoji.woff2') format('woff2');
		}
		body {
			--google-font-color-notocoloremoji:colrv1;
		}
		/* Bypass flag censorship */
		@font-face {
			  font-family: 'Noto Flags Emoji';
			  unicode-range: U+1F1E6-1F1FF;
			  src: url('data/fonts/noto_color_emoji.woff2') format('woff2');
		}
		#lang {
			font-family: sans-serif, 'Noto Flags Emoji';
		}
	`;
	let style = document.createElement("style");
	style.type = "text/css";
	style.appendChild(document.createTextNode(css));
	head.appendChild(style);
};

// Deal with browsers not supporting flexbox gaps (old firefox, not so old safari)
function is_gap_supported() {
	if (CSS.supports("gap", "1em"))
		return;
	let head = document.getElementsByTagName("head")[0];
	let link = document.createElement("link");
	link.rel = "stylesheet";
	link.type = "text/css";
	link.href= "css/unsupported_gap.css";
	head.appendChild(link);
}

try {
	document.addEventListener("DOMContentLoaded", loademojis);
	document.addEventListener("DOMContentLoaded", is_gap_supported);
}
catch (_unused) {
	window.onload = loademojis;
	window.onload = is_gap_supported;
}


// get basic hit statistics
function get_hits() {
	let head = document.getElementsByTagName("head")[0];
	let script = document.createElement("script");
	script.type = "text/javascript";
	script.src = __api__base + "/ping.js?p=/" +
		     window.location.pathname.split("/").pop();
	script.setAttribute("defer", "");
	head.appendChild(script);
}
if (window.location.origin == __api__frontsite)
	get_hits();

