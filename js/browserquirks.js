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

document.addEventListener("DOMContentLoaded", is_gap_supported);


/*
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
*/
