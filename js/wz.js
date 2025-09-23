import {__api__urls, $onlinemanager} from "./api_url.js";
import {$, insert_notification_link, mynotify} from "./libs/cortlibs.js";
import {_} from "../data/i18n.js";
import {Constants, TranslateForts, HumaniseEvents, Icons} from "./wztools/wztools.js";

// Unix timestamp of the last update
let wz_lastupdate = Math.floor(new Date().getTime() / 1000);

// wztools
let constants = new Constants();
let icons = new Icons();
let xlator = new TranslateForts();
let humaniser = new HumaniseEvents();
let realm_colors = constants.realm_colors;
let wzicons = icons.get_all_icons();

// canvas
function setup_canvas() {
	let canvas = document.getElementById("wz-map-map");
	let dpr = window.devicePixelRatio || 1;

	canvas.width = 500 * dpr;
	canvas.height = 500 * dpr;

	let ctx = canvas.getContext('2d');
	// Prepopulate the map with a transparent rectangle Allows the map to
	// be fully show ASAP with no bounce effect while waiting to draw the
	// real map overlay
	ctx.strokeRect(0, 0, canvas.width, canvas.height);

	// Text style
	const font_size = 14 * dpr;
	ctx.font = `bold ${font_size}px sans-serif`;
	ctx.fillStyle = "#EED202";

	// Drop shadow under icons
	ctx.shadowOffsetX = 1 * dpr;
	ctx.shadowOffsetY = 2 * dpr;
	ctx.shadowColor = "#000000";

	return {
		// In site order, [x, y, text_x, text_y]
		forts_positions: [
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
		],
		width: canvas.width,
		height: canvas.height,
		ctx: ctx,
		dpr: dpr
	};

}
const canvas = setup_canvas();

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
    if (!xml) {
        console.warn("Missing icon:", fname);
        return "";
    }
    // Properly encode UTF-8 characters for btoa
    return "data:image/svg+xml;charset=UTF-8;base64," + btoa(unescape(encodeURIComponent(xml)));
}

function display_map(forts) {
	// Preload all images in parallel using Promises
	let imagePromises = forts.map(fort => {
		return new Promise(resolve => {
			let img = new Image();
			img.src = svg_to_blob(dispatch_fort_icon(fort));
			img.onload = () => resolve(img);
			img.onerror = () => resolve(null); // Gracefully handle missing icons
		});
	});

	// Wait for all images to load
	Promise.all(imagePromises)
		.then(images => {
			// Filter out any failed images
			let validImages = images.filter(img => img !== null);
			// Draw the map once all are ready
			return draw_map(validImages);
		})
		.catch(error => {
			console.error("Map generation failed:", error);
		});
}

async function draw_map(images) {

	let dpr = canvas.dpr;
	// clear everything
	canvas.ctx.clearRect(0, 0, canvas.width, canvas.height);
	// Draw each fort icon and label
	for (let i = 0; i < images.length; i++) {
		let pos = canvas.forts_positions[i];
		if (pos && images[i]) {
			canvas.ctx.drawImage(images[i], pos[0] * dpr, pos[1] * dpr, 36 * dpr, 36 * dpr);
			canvas.ctx.fillText(`(${i + 1})`, pos[2] * dpr, pos[3] * dpr);
		}
	}

}

async function display_wz(init=false) {
	let data = null;
	let gems = [];
	let forts = [];
	let failures = {};


	if ($onlinemanager.online() === false) {
		$("#wz-info-error").html($onlinemanager.offlineMessage +
					 " " + $onlinemanager.willRetryMessage);
		return;
	}
	try {
		data = await $().getJSON(__api__urls["wstatus"]);
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
	$("#wz-map-map").css('background-image', 'url("data/warstatus/base_map.png")');
	$("#wz-map-map").css("background-size", "cover");

	// Middle part

	if (!("gems" in failures)) {
		for (let gem of data["gems"]) {
			gems.push(wzicons[gem]);
		}
	}

	for (let fort of data["forts"]) {
		let icon = wzicons[dispatch_fort_icon(fort)];
		let name = xlator.translate_fort(fort["name"]);
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
		`);
	}

	// Events

	let events_list = humaniser.humanise_events(data["events_log"], true, wz_lastupdate);
	$("#wz-events").html(`<h2 id="wz-events-header">
		<span class="purple">${_("Last server events (in your timezone):")} </span>
		</h2>
		<span>
		${events_list[0]}
		<br>
		<a href="wevents.html?f=none">${_("More events")}...</a>
		</span>`);

	// Last update -- ensure notifications are displayed once only and map
	// not redrawn for nothing
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

setInterval(display_wz, 30 * 1000);
