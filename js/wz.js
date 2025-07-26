import {__api__urls} from "./api_url.js";
import {$} from "./libs/lamaiquery.js";
import {_} from "./libs/i18n.js";
import {insert_notification_link, mynotify} from "./libs/notify.js";
import {get_realm_colors} from "./wztools/constants.js";
import {translate_fort} from "./wztools/translate_forts.js";
import {humanise_events} from "./wztools/events.js";
import {wzicons} from "./wztools/icons.js";
import {$onlinemanager} from "./libs/onlinemanager.js";

// Unix timestamp of the last update
let wz_lastupdate = Math.floor(new Date().getTime() / 1000);

// Use local versions of images because NGE's site is slow
function rebase_img(url) {
	return "data/warstatus/" + url;
}

// Use different fort icons according to their type
function dispatch_fort_icon(fort) {
	if (fort["name"].includes("Castle"))
		return "castle_" + fort["icon"];
	else if (fort["name"].startsWith("Great Wall"))
		return "wall_" + fort["icon"];
	else
		return fort["icon"];
}


// Create a svg blob for a given original icon filename
function svg_to_blob(fname) {
	let xml = wzicons[fname];
	return "data:image/svg+xml;charset=UTF-8;base64," + btoa(xml);
}

function display_map(forts) {
	// Preload images beforehand
	let forts_Image = [];
	let forts_Image_count = 0;
	for (let i = 0; i < forts.length; i++) {
		let imgbuffer = new Image();
		imgbuffer.src = svg_to_blob(dispatch_fort_icon(forts[i]));
		imgbuffer.onload = function () {
			if (++forts_Image_count >= forts.length) {
				let map = draw_map(forts_Image);
				document.getElementById("wz-map-map").src = map;
			}
		};
		forts_Image.push(imgbuffer);
	}
}


function draw_map(images) {
	// In site order, [x, y, text_x, text_y]
	let forts_positions = [
		[212, 60, 221, 55],
		[208, 175, 193, 195],
		[120, 187, 105, 207],
		[139, 140, 119, 165],
		[260, 111, 245, 133],
		[290, 180, 275, 200],
		[365, 220, 345, 245],
		[324, 140, 304, 165],
		[135, 230, 118, 250],
		[220, 250, 195, 270],
		[285, 360, 255, 385],
		[183, 310, 153, 335]
	];
	try {
		let canvas = document.createElement("canvas");
		// size * 2 to avoid blurry final result
		canvas.setAttribute('width', 1000);
		canvas.setAttribute('height', 1000);
		let ctx = canvas.getContext('2d');
		ctx.setTransform(2, 0, 0, 2, 0, 0);
		ctx.font = "bold 14px sans-serif";
		ctx.fillStyle = "#EED202";
		ctx.filter = "drop-shadow(1px 5px 0px #000000)";
		for (let i = 0; i < images.length; i++) {
			ctx.drawImage(images[i], forts_positions[i][0], forts_positions[i][1], 36, 36);
			ctx.fillText(`(${i+1})`, forts_positions[i][2], forts_positions[i][3]);
		}
		return canvas.toDataURL("image/png");
	}
	catch (_unused) {
		console.log("canvas failed, using NGE's map");
		return "https://www.championsofregnum.com/ranking/data/ra/gen_map.jpg";
	}
}

async function display_wz(init=false) {
	// Same order as the website
	let realm_colors = get_realm_colors();
	let gems = [];
	let forts = [];
	let failures = {};

	if ($onlinemanager.online() === false) {
		$("#wz-info-error").html($onlinemanager.offlineMessage +
					 " " + $onlinemanager.willRetryMessage);
		return;
	}
	try {
		var data = await $().getJSON(__api__urls["wstatus"]);
		$("#wz-info-error").empty();
		let dt = new Date();
		let datetime = dt.toLocaleTimeString(undefined,
			{hour: "2-digit", minute: "2-digit", second: "2-digit"});
		$("#wz-info-updated").text(datetime);
		if ("failed" in data) {
			console.error(data["failed"]);
			failures = JSON.parse(data["failed"]["debug"]);
			let whatfailed = Object.keys(failures).join(" ");
			let checkout = `Check out <a href="https://www.championsofregnum.com/index.php?l=1&sec=3" target="_blank">
				  NGE's page</a>!`;
			if (data["failed"]["status"] == "fatal") {
				$("#wz-info-error").html(`<p>
				  Fetching the data from NGE's site totally failed and may have errors!
				  ${checkout}</p>`);
				return;
			}
			if (data["failed"]["status"] == "partial") {
				$("#wz-info-error").html(`<p>
				  Fetching the data (${whatfailed}) from NGE's site partially failed. ${checkout}</p>`);
			}
		}
	}
	catch (error) {
		$("#wz-info-error").html(`<p><b>Failed to get the warstatus:</b> <code>${error}</code></p>`);
		return;
	}

	if (init == false && data["events_log"][0]["date"] < wz_lastupdate)
		return; // nothing new

	display_map(data["forts"]);
	// Lazy load map background
	let bg = new Image()
	bg.src = "data/warstatus/base_map.png";
	bg.onload = function () {
		$("#wz-map-map").css("background-image", `url(${bg.src})`);
		$("#wz-map-map").css("background-size", "cover");
	};

	if (!("gems" in failures)) {
		for (let gem of data["gems"]) {
			gems.push(wzicons[gem]);
		}
	}

	for (let fort of data["forts"]) {
		let icon = wzicons[dispatch_fort_icon(fort)];
		let name = translate_fort(fort["name"]);
		forts.push(`${icon}&nbsp;${name}<br>`);
	}

	for (let realm of Object.keys(realm_colors)) {
		let relics = "";
		// XXX Currently relics fail if gems fail
		if (!("gems" in failures)) {
			for (let relic of Object.keys(data["relics"][realm])) {
				let url = data["relics"][realm][relic];
				if (url !== null) {
					relics += `<span title="${relic}">${wzicons[url]}</span>`;
				}
			}
		}
		$(`#wz-${realm.toLowerCase()}`).html(`
				<div class="wz-realm-header">
				<span class="wz-realmname ${realm_colors[realm]}">${realm}</span>
				<span class="wz-gems">${gems.splice(0, 6).join("")}</span>
				<span class="wz-relics">${relics}</span>
				<span class="wz-forts">${forts.splice(0, 4).join("")}</span>
				</div>
		`)
	}
	let events_list = humanise_events(data["events_log"], true, wz_lastupdate);
	$("#wz-events").html(`<h2 id="wz-events-header">
		<span class="purple">${_("Last server events (in your timezone):")} </span>
		</h2>
		<span>
		${events_list[0]}
		<br>
		<a href="wevents.html?f=none">${_("More events")}...</a>
		</span>`);
	wz_lastupdate = Math.floor(new Date().getTime() / 1000);
	if (events_list[1].length > 0)
		mynotify(_("WZ status"), events_list[1], "wz");
}

$(document).ready(function() {
	document.title = "CoRT - " + _("WZ status");
	$("#title").text(_("WZ status"));
	$("#wz-info-info").text(
		_("The page will update itself every minute.") +
		" " + _("Last updated:"));
	insert_notification_link();

	display_wz(true);
});

$onlinemanager.whenBackOnline(() => display_wz(true));

setInterval(display_wz, 30 * 1000)
