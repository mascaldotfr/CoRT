function generate_shield(color1, color2) {
	return `
<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" class="wz-icon" viewBox="0 0 36 36"><path fill="CCD6DD" d="M33 3c-7-3-15-3-15-3S10 0 3 3C0 18 3 31 18 36c15-5 18-18 15-33z"/><path fill="${color1}" d="M18 33.884C6.412 29.729 1.961 19.831 4.76 4.444 11.063 2.029 17.928 2 18 2c.071 0 6.958.04 13.24 2.444 2.799 15.387-1.652 25.285-13.24 29.44z"/><path fill="${color2}" d="M31.24 4.444C24.958 2.04 18.071 2 18 2v31.884c11.588-4.155 16.039-14.053 13.24-29.44z"/></svg>`
}

function generate_gem(color1, color2, color3, color4, color5) {
	return `
<svg xmlns="http://www.w3.org/2000/svg" class="wz-icon wz-icon-smaller" viewBox="0 0 36 36"><path fill="${color1}" d="M13 3H7l-7 9h10z"/><path fill="${color2}" d="M36 12l-7-9h-6l3 9z"/><path fill="${color3}" d="M26 12h10L18 33z"/><path fill="${color4}" d="M10 12H0l18 21zm3-9l-3 9h16l-3-9z"/><path fill="${color5}" d="M18 33l-8-21h16z"/></svg>`;
}

function generate_relic(realm, shade) {
	let relic = "";
	if (realm == "alsius")
		relic = `
<svg xmlns="http://www.w3.org/2000/svg" class="wz-icon wz-icon-smaller" viewBox="0 0 36 36"><path fill="#F4900C" d="M14.174 17.075L6.75 7.594l-3.722 9.481z"/><path fill="${shade}" d="M17.938 5.534l-6.563 12.389H24.5z"/><path fill="#F4900C" d="M21.826 17.075l7.424-9.481 3.722 9.481z"/><path fill="${shade}" d="M28.669 15.19L23.887 3.523l-5.88 11.668-.007.003-.007-.004-5.88-11.668L7.331 15.19C4.197 10.833 1.28 8.042 1.28 8.042S3 20.75 3 33h30c0-12.25 1.72-24.958 1.72-24.958s-2.917 2.791-6.051 7.148z"/><circle fill="#5C913B" cx="17.957" cy="22" r="3.688"/><circle fill="#981CEB" cx="26.463" cy="22" r="2.412"/><circle fill="#DD2E44" cx="32.852" cy="22" r="1.986"/><circle fill="#981CEB" cx="9.45" cy="22" r="2.412"/><circle fill="#DD2E44" cx="3.061" cy="22" r="1.986"/><path fill="#FFAC33" d="M33 34H3c-.552 0-1-.447-1-1s.448-1 1-1h30c.553 0 1 .447 1 1s-.447 1-1 1zm0-3.486H3c-.552 0-1-.447-1-1s.448-1 1-1h30c.553 0 1 .447 1 1s-.447 1-1 1z"/><circle fill="#FFCC4D" cx="1.447" cy="8.042" r="1.407"/><circle fill="#F4900C" cx="6.75" cy="7.594" r="1.192"/><circle fill="#FFCC4D" cx="12.113" cy="3.523" r="1.784"/><circle fill="#FFCC4D" cx="34.553" cy="8.042" r="1.407"/><circle fill="#F4900C" cx="29.25" cy="7.594" r="1.192"/><circle fill="#FFCC4D" cx="23.887" cy="3.523" r="1.784"/><circle fill="#FF00FF" cx="17.938" cy="5.534" r="1.784"/></svg>`;
	else if (realm == "ignis")
		relic = `
<svg xmlns="http://www.w3.org/2000/svg" class="wz-icon wz-icon-smaller" viewBox="0 0 36 36"><path fill="${shade}" d="M34 16C34 6 26.837 0 18 0 9.164 0 2 6 2 16c0 5.574.002 10.388 6 12.64V33c0 1.657 1.343 3 3 3s3-1.343 3-3v-3.155c.324.027.659.05 1 .07V33c0 1.657 1.343 3 3 3s3-1.343 3-3v-3.085c.342-.021.676-.043 1-.07V33c0 1.657 1.344 3 3 3 1.657 0 3-1.343 3-3v-4.36c5.998-2.252 6-7.066 6-12.64z"/><circle fill="#292F33" cx="11" cy="14" r="5"/><circle fill="#292F33" cx="25" cy="14" r="5"/><path fill="#292F33" d="M19.903 23.062C19.651 22.449 18.9 22 18 22s-1.652.449-1.903 1.062c-.632.176-1.097.75-1.097 1.438 0 .828.671 1.5 1.5 1.5.655 0 1.206-.422 1.41-1.007.03.001.059.007.09.007s.06-.006.09-.007c.205.585.756 1.007 1.41 1.007.828 0 1.5-.672 1.5-1.5 0-.688-.466-1.261-1.097-1.438z"/></svg>`;
	else
		relic = `
<svg xmlns="http://www.w3.org/2000/svg" class="wz-icon wz-icon-smaller" viewBox="0 0 36 36"><path fill="#D99E82" d="M23 34c0 .553-2.687 1.466-6 1.466s-6-.913-6-1.466 2.686-1 6-1 6 .447 6 1z"/><path fill="${shade}" d="M24 7.078s-1-1.039 0-2.039S25 2 25 2H9.031s0 2.039 1 3.039 0 2.02 0 2.02-5 1.971-5 9.971c0 8.001 5.977 16.995 5.977 16.995L17 34h6s6-8.961 6-16.961c0-8-5-9.961-5-9.961z"/><path fill="#D99E82" d="M25 2c0 .552-3.582 1-8 1s-8-.448-8-1S12.582.25 17 .25 25 1.448 25 2zm-8 31.225c-3.331 0-6.143-.565-7.25-1.304.725 1.294 1.246 2.084 1.256 2.1.063.555 2.72 1.445 5.994 1.445 3.313 0 6-.913 6-1.466 0 0 .52-.781 1.244-2.065-1.12.732-3.934 1.29-7.244 1.29z"/><path fill="#662113" d="M24.163 4.724c-.799.46-3.698 1.008-7.163 1.008s-6.365-.548-7.163-1.008c-.142.082-.226.167-.226.255 0 .583 3.308 1.262 7.389 1.262 4.08 0 7.389-.679 7.389-1.262 0-.088-.083-.173-.226-.255z"/><path fill="#662113" d="M10.387 6.467c2.594.71 5.403.814 6.613.814 1.215 0 4.037-.097 6.639-.815-.137-.388-.155-.912.361-1.427l.008-.01-.117.034c-2.479.682-7.009.969-7.009.969s-4.353-.287-6.832-.969h-.001c.497.513.476 1.025.338 1.404z"/><path fill="#D99E82" d="M17 18.612c4.808 0 9.216-.776 11.962-2.55-.072-1.319-.282-2.456-.583-3.434-.438.091-.862.348-1.345.509-3 1-8.034 1.25-10.034 1.25s-7.052-.293-10.052-1.293c-.48-.16-.843-.373-1.3-.464-.323 1.054-.539 2.295-.592 3.747 2.798 1.632 7.533 2.235 11.944 2.235z"/></svg>`;
	return relic;
}

export const wzicons = {
	"keep_alsius.gif": generate_shield("#3097d9", "#6CACE4"),
	"keep_ignis.gif": generate_shield("#880000", "#CC0000"),
	"keep_syrtis.gif": generate_shield("#30d98e", "#00AA00"),
	"gem_0.png": generate_gem("#888888", "#777777", "#666666", "#555555", "#444444"),
	"gem_1.png": generate_gem("#9b0000", "#d70000", "#c60000", "#b70000", "#ff0000"),
	"gem_2.png": generate_gem("#accbff", "#92bbff", "#78aaff", "#649eff", "#4188ff"),
	"gem_3.png": generate_gem("#d2f2d4", "#22b600", "#26cc00", "#7be382","#009c1a"),
	"res_79167.png":generate_relic("alsius", "#8CDCE4"),
	"res_79168.png":generate_relic("alsius", "#6CACE4"),
	"res_79174.png":generate_relic("alsius", "#4C7C94"),
	"res_79169.png":generate_relic("ignis", "#FFaaaa"),
	"res_79171.png":generate_relic("ignis", "#CC8888"),
	"res_79170.png":generate_relic("ignis", "#AA6666"),
	"res_79172.png":generate_relic("syrtis", "#aaFFaa"),
	"res_79175.png":generate_relic("syrtis", "#88CC88"),
	"res_79173.png":generate_relic("syrtis", "#66AA66")
};

