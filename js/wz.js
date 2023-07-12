/*
 * Copyright (c) 2023 mascal
 *
 * CoRT is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * CoRT is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with CoRT.  If not, see <http://www.gnu.org/licenses/>.
 */

// Use local versions of images because NGE's site is slow
function rebase_img(url) {
	return "data/warstatus/" + url;
}

function display_map(forts) {
	forts.unshift({icon: "base_map.jpg"});

	// Preload images beforehand
	let forts_Image = [];
	let forts_Image_count = 0;
	for (let i = 0; i < forts.length; i++) {
		let imgbuffer = new Image();
		imgbuffer.src = rebase_img(forts[i]["icon"]);
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
	// 0 = map, rest = site order In site order
	// [x, y, text_x, text_y]
	let forts_positions = [
		[0, 0],
		[215, 60, 221, 55],
		[208, 165, 188, 185],
		[120, 187, 100, 207],
		[139, 140, 119, 165],
		[260, 111, 240, 131],
		[290, 180, 270, 200],
		[365, 220, 345, 240],
		[324, 140, 304, 160],
		[135, 230, 115, 250],
		[220, 250, 190, 270],
		[285, 360, 255, 380],
		[178, 290, 153, 310]
	];
	try {
		let canvas = document.createElement("canvas");
		canvas.setAttribute('width', 500);
		canvas.setAttribute('height', 500);
		let ctx = canvas.getContext('2d');
		ctx.font = "bold 14px sans-serif";
		ctx.fillStyle = "#EED202";
		for (let i = 0; i < images.length; i++) {
			ctx.drawImage(images[i], forts_positions[i][0], forts_positions[i][1]);
			if (i > 0)
				ctx.fillText(`(${i})`, forts_positions[i][2],
						       forts_positions[i][3]);
		}
		return canvas.toDataURL("image/png");
	}
	catch (_unused) {
		console.log("canvas failed, using NGE's map");
		return "https://www.championsofregnum.com/ranking/data/ra/gen_map.jpg";
	}
}

async function display_wz() {
	// Same order as the website
	let realm_colors = get_realm_colors();
	let gems = [];
	let forts = [];

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
			$("#wz-info-error").text(`
			  Fetching the data from NGE's site failed and may have errors!
			  Check out <a href="https://championsofregnum.com/index.php?l=1&sec=3" target="_blank">
			  NGE's page</a>!`);
			console.error(data["failed"]);
			return;
		}
	}
	catch (error) {
		$("#wz-info-error").html(`<b>Failed to get the warstatus:</b> <code>${error}</code>`);
		return;
	}

	for (let gem of data["gems"]) {
		gems.push(`<img src="${rebase_img(gem)}" class="wz-icon">`);
	}
	for (let fort of data["forts"]) {
		let icon = `<img src="${rebase_img(fort["icon"])}" class="wz-icon">`;
		let name = translate_fort(fort["name"]);
		forts.push(`${icon}&nbsp;${name}<br>`);
	}

	display_map(data["forts"]);

	for (let realm of Object.keys(realm_colors)) {
		let relics = "";
		for (let relic of Object.keys(data["relics"][realm])) {
			let url = data["relics"][realm][relic];
			if (url !== null) {
				relics += `<img src="${rebase_img(url)}" class="wz-icon">`;
			}
		}
		$(`#wz-${realm.toLowerCase()}`).html(`
				<span class="wz-realm-header">
				<span class="realmname ${realm_colors[realm]}">${realm}</span>
				<span class="gems">${gems.splice(0, 6).join("")}</span>
				<span class="relics">${relics}</span>
				</span>
				<span class="forts">${forts.splice(0, 4).join("")}</span>
		`)
	}

	$("#wz-events").html(`<h2 id="wz-events-header">
		<span class="purple">${_("Last server events (in your timezone):")} </span>
		</h2>
		<span>
		${humanise_events(data["events_log"], true)}
		<br>
		<a href="wevents.html?f=none">${_("More events")}...</a>
		</span>`);
}

$(document).ready(function() {
	document.title = "CoRT - " + _("WZ status");
	$("#title").text(_("WZ status"));
	$("#wz-info-info").text(
		_("The page will update itself every minute.") +
		" " + _("Last updated:"));

	display_wz();
});

$onlinemanager.whenBackOnline(display_wz);

setInterval(display_wz, 30 * 1000)
