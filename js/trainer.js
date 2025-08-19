import {__api__urls, __api__frontsite, __api__frontsite_dir} from "./api_url.js";
import {$} from "./libs/lamaiquery.js";
import {_} from "./libs/i18n.js";
import {LZString} from "./libs/lz-string.min.js";
import {minlevel, maxlevel, class_type_masks, datasets, classes, mindlevel,
	maxdlevel, minplevel, maxplevel} from "./trainertools/constants.js";

var trainerdatasets = datasets;
const is_beta = location.pathname.split("/").pop() == "beta.html";
if (is_beta) {
	var live_datasets = trainerdatasets;
	trainerdatasets = ["beta"];
}
const newest_dataset = trainerdatasets.slice(-1);
var trainerdata = null;
var trainerdataversion = null;
// 0: trainerdataset on 1 digit (?s=)
// 1: trainerdataset on 2 digits (?t=)
var skillset_urlformat = 0;

var dpointstotal = 0;
var ppointstotal = 0;
var dpointsleft = 0;
var ppointsleft = 0;
var extrappoints = 0;
var necro_gem = false; // Red Crystal of the necromancer
var currlevel = 0;
var currclass = null;
var wmrow = 0;
var powerpoints = 0; // actually it's for use in trainerdata.json
// XXX beware it's just a buffer that is unexploitable once the setup is loaded
var saved_setup;
var automated_clicks = false;
var tooltips = [];

$(document).ready(function() {
	document.title = "CoRT - " + _("Trainer");
	$("#title").text(_("Trainer"));
	$("#titleinfo").text(
		_("Hovering your mouse or clicking (on mobile) on a skill icon will show its description.") +
		"<br>" +
		_("Selecting an higher character level will upgrade your current setup to that level."));
	if (is_beta)
		$("#title").append(`&nbsp;<span class="red">(AMUN/BETA)</span>`);
	let html_class_options = "";
	for (let clas of classes) {
		html_class_options += `<option value="${clas}">${_(capitalize(clas))}</option>`;
	}
	$("#t-class").html(html_class_options);
	$("#t-load").text(_("Load / Reset"));
	$("#t-save").text(_("Share / Save"));
	$("#t-dpoints-label").text(_("Discipline points:"));
	$("#t-ppoints-label").text(_("Power points:"));
	if (typeof HTMLDialogElement === "function") {
		$("#t-dialog h3").text(_("Here is the link to your setup:"));
		$("#t-dialog-copy").text(_("Copy link"));
		$("#t-dialog-close").text(_("Close") + " (Esc)");
	}
	else { // browser with no <dialog> support
		$("#t-dialog").hide();
	}

	// generate characters levels options
	let html_level_options = `<option value="61">60 (+${_("Necro crystal")})</option>`;
	for (let i = maxlevel - 1; i >= minlevel; i--) {
		html_level_options += `<option value="${i}">${i}</option>`;
	}
	$("#t-level").append(html_level_options);
	// generate datasets version
	let html_dataset_options  = `<option value="${newest_dataset}" default selected>
		${_("Current game version")} (${newest_dataset})</option>`;
	for (let i = trainerdatasets.length - 2; i >= 0; i--) {
		html_dataset_options += `<option value="${trainerdatasets[i]}">${trainerdatasets[i]}</option>`;
	}
	$("#t-version").html(html_dataset_options);
	// Drop "index.html" from the URL bar if you are coming from search engines
	if (window.location.pathname == `${__api__frontsite_dir}/index.html`)
		window.location.pathname = __api__frontsite_dir;
	// search for a given trainer dataset in url, and skillset then
	// set the version accordingly. See also manage_dataset_versions.
	let urlsearch = new URLSearchParams(window.location.search);
	let skillset = urlsearch.get("s");
	if (!skillset) {
		skillset = urlsearch.get("t");
		if (skillset)
			skillset_urlformat = 1;
	}
	trainerdataversion = urlsearch.get("d");
	if (skillset) {
		load_setup_from_url(skillset);
	}
	else {
		$("#t-load").trigger("click");
	}
});

$("#t-load").on("click", function() {
	let level = $("#t-level").val();
	let clas = $("#t-class").val();
	if ( (level >= minlevel && level <= maxlevel) ) {
		currlevel = level;
		extrappoints = 0;
		necro_gem = false;
	}
	else if (level == 61) {
		currlevel = maxlevel;
		extrappoints = 5;
		necro_gem = true;
	}
	else {
		alert(_("Please select a level"));
		return;
	}
	if (clas != null) {
		currclass = clas;
	}
	else {
		alert(_("Please select a class"));
		return;
	}
	trainerdataversion = $("#t-version").val();
	manage_dataset_versions();
	load_tree();
});

$("#t-level").on('change', function() {
	let selectedllevel = $("#t-level").val();
	// Upgrade does not work if no trees are loaded, you are level 60
	// or if the requested level is lower than your current level
	// The +1 is because of the necro gem (level 61)
	if (currlevel == 0 || (currlevel == maxlevel + 1) || currlevel > selectedllevel)
		return;
	if (necro_gem) // don't downgrade from necro to normal 60!
		return;
	currlevel = selectedllevel;
	window.location.assign(save_setup_to_url(false));
});

$("#t-save").on("click", function() {
	if (trainerdata === null) {
		window.alert(_(`You need first to load trees by clicking on "%s"!`, _("Load / Reset")));
		return;
	}
	let saved_url = save_setup_to_url();
	if (saved_url == null)
		return;
	if (typeof HTMLDialogElement === "function") {
		$("#t-dialog-url").val(saved_url);
		$("#t-dialog").attr("inert", "true");
		document.getElementById("t-dialog").showModal();
		$("#t-dialog").removeAttr("inert");
		$("body").css("filter", "blur(10px)");
	}
	else { // <dialog> unsupported
		window.prompt(_("Here is the link to your setup:"), saved_url);
		window.location.href = saved_url;
	}
});

$("#t-dialog").on("cancel", function(e) {
	e.preventDefault();
	document.getElementById("t-dialog").close();
	// Don't get a blurred page if people press 2 times ESC
	$("body").css("filter", "");
	window.location.href = $("#t-dialog-url").val();
});

$("#t-dialog-close").on("click", function() {
	window.location.href = $("#t-dialog-url").val();
});


$("#t-dialog-copy").on("click", function() {
	function failure_message(error) {
		console.error("Failed to copy text: ", error);
		$("#t-dialog-copy").text("Copy failed!");
	}
	try {
		navigator.clipboard.writeText($("#t-dialog-url").val())
			.then(() => {
				$("#t-dialog-copy").text(_("Link copied!"));
				let timer = setInterval(() => {
					$("#t-dialog-copy").text(_("Copy link"));
					clearInterval(timer);
					}, 3000);
			})
			.catch((error) => {
				failure_message(error);
			});
	}
	catch (error) {
		failure_message(error);
	}
});

function capitalize(string) {
	return string[0].toUpperCase() + string.slice(1);
}

function manage_dataset_versions() {
	// valid dataset ?
	if (!trainerdatasets.includes(trainerdataversion)) {
		// invalid dataset supplied
		trainerdataversion = newest_dataset;
	}
	// display a warning if an old version of the datasets are used, and
	// remove it if the latest dataset is loaded after.
	$("#oldversion").remove();
	$("#betaversion").remove();
	if (trainerdataversion != newest_dataset)
		$("#t-points").append(`	<div id="oldversion">
					<p class="red"><b>
					${_("This setup is being made with an older version (%s) of CoR, and may be out of date.",
					trainerdataversion)}<p>
					<p><a href="#" id="upgrade-setup">${_("Click here")}</a>
					${_("to upgrade this setup's discipline and power points to the latest version (%s).",
					newest_dataset)}</p>
					</div>
					`);
	if (is_beta)
		$("#t-points").append(`
			<div id="betaversion">
			<p class="red"><b>
			${_("This is the beta trainer for versions on Amun. Things can change quickly.")}
			<br> ${_("It's not recommended to permanently save setups in here.")}
			<br>
			<a href="#" id="beta-to-live">
			${_("Instead you should click here to convert your setup to the latest live version.")}
			</a></b></p>
			</div>
		`);
	// needs to be here because these divs are dynamic
	$("#beta-to-live").on("click", () => convert_beta_to_live());
	$("#upgrade-setup").on("click", () => upgrade_setup_to_new_version());
}

async function collect_setup(setupstring) {
	if (window.location.origin != __api__frontsite || is_beta)
		return;
	try {
		await $().post(__api__urls["submit_trainer"], {"setup":setupstring});
	}
	catch (error) {
		console.error(`Failed to send setup: ${error}`);
	}
}

function upgrade_setup_to_new_version() {
	trainerdataversion = trainerdatasets.slice(-1);
	window.location.assign(save_setup_to_url(false));
}

function convert_beta_to_live() {
	trainerdataversion = live_datasets.slice(-1);
	// Reassign live datasets for the compressor
	trainerdatasets = live_datasets;
	window.location.assign(save_setup_to_url(false, true));
}

function save_setup_to_url(shared=true, beta2live=false) {
	if (necro_gem)
		currlevel += 1;
	let setup = trainerdataversion + "+" + currclass + "+" + currlevel + "+";
	let dpoints = 0;
	let ppoints = 0;
	// WM row is always the latest one
	for (let row = 1; row <= wmrow; row++) {
		// separate discipline skills from power skills
		let discipline = parseInt($(`#t-trainer .t${row} .p0 .icon .skilllvl`).text())
		if (discipline > maxdlevel || discipline < mindlevel) {
			bad_shared_link();
			return;
		}
		dpoints += trainerdata["required"]["points"][discipline - 1];
		setup += discipline + "+";
		for (let col = 1; col < 11; col++) {
			let level = parseInt($(`#t-trainer .t${row} .p${col} .icon .skilllvl`).text());
			if (level > maxplevel || level < minplevel) {
				bad_shared_link(true);
				return;
			}
			// level is NaN on wmrow
			level = isNaN(level) ? 0 : level;
			ppoints += level;
			setup += level;
		}
		if (row != wmrow)
			setup += "+";
	}
	if (dpoints > dpointstotal || ppoints > ppointstotal)
		bad_shared_link(true);
	if (shared)
		collect_setup(setup);
	let pathname = window.location.pathname;
	if (beta2live)
		pathname = pathname.substring(0, pathname.lastIndexOf("/") + 1);

	return window.location.origin + pathname + "?t=" + compressor.compress(setup);
}

function bad_shared_link(nonfatal=false) {
	window.alert(_("Your shared link is bad. Bailing out, sorry!"));
	if (nonfatal == false)
		window.location.assign(window.location.origin + window.location.pathname);
}

// load_tree() being async, you need the tree to be loaded
// in order to click stuff so this is before loading the tree ...
function load_setup_from_url(skillset) {
	saved_setup = null;
	if (trainerdataversion !== null) {
		// Old LZstring URL, redirect to new url format
		saved_setup = LZString.decompressFromEncodedURIComponent(skillset);
		saved_setup = trainerdataversion + "+" + saved_setup;
		window.location.assign(window.location.origin + window.location.pathname +
				       "?t=" + compressor.compress(saved_setup));

	}
	saved_setup = compressor.decompress(skillset);
	if (saved_setup == null) {
		bad_shared_link();
		return;
	}
	saved_setup = saved_setup.split("+");
	trainerdataversion = saved_setup.shift();
	$("#t-class").val(saved_setup.shift());
	$("#t-level").val(saved_setup.shift());
	manage_dataset_versions();
	$("#t-version").val(trainerdataversion);
	$("#t-load").trigger("click");
}

// ... and this is after (called by load_tree())
function input_setup_from_url() {
	/* while slower, generating clicks allows to assert that the setup is correct */
	if (saved_setup === undefined)
		return;
	automated_clicks = true;
	let row = 0;
	for (let item = 0; item < saved_setup.length; item++) {
		if (item % 2 == 0) {
			// discipline points
			row++;
			let do_clicks = (saved_setup[item] - 1) / 2 ;
			for (let i = 0; i < do_clicks; i++) {
				try {
					$(`#t-trainer .t${row} .p0 .skillspinner .plus`).trigger("click");
				}
				catch (_unused) {
					bad_shared_link();
					automated_clicks = false;
					return;
				}
			}
		}
		else {
			// power points
			let powers = saved_setup[item].split("");
			if (row == wmrow)
				continue; // no pp for the wm row
			for (let power in powers) {
				power = parseInt(power);
				for (let i = 0; i < powers[power]; i++) {
					try {
						$(`div[treepos="${row}"] .p${power + 1} .skillspinner .plus`).trigger("click");
					}
					catch (_unused) {
						automated_clicks = false;
						bad_shared_link();
						return;
					}
				}
			}
		}
	}
	saved_setup = undefined;
	automated_clicks = false;
}

function icon_factory(spellpos, iconsrc, treepos, spellname, treename) {
	// discipline points are always > 1, but skill points must be 0 to simplify code later.
	let skilllvl = spellpos == 0 ? 1 : 0;
	let clean_spellname = "trainerskill_" + spellname.replace(/[^a-z0-9]/gi, "");
	let icon = ` 	<div class="p${spellpos}">
				<div class="icon" style="background-image:url(${iconsrc});"
				     id="${clean_spellname}" >
		`;
	// WM tree; don't show skill points
	if (treepos != wmrow || (treepos == wmrow && spellpos == 0))
		icon += `<span class="skilllvl">${skilllvl}</span>`;
	icon += "</div>";
	// WM tree has no skill points, we don't generate + and - buttons
	if (treepos != wmrow || (treepos == wmrow && spellpos == 0 && currlevel == 60)) {
		icon += ` <div class="skillspinner">
					<button class="plus">+</button><button class="minus">-</button>
				</div>`;
	}
	icon += `</div>`;

	function tooltip_factory(content) {
		tooltips.push(function () {
			tippy(`#${clean_spellname}`, {
				content: content,
				allowHTML: true,
				placement: "bottom",
				maxWidth: "fit-content"
			})
		});
	}
	if (treename != "") { // skills
		let spellinfo = trainerdata.disciplines[treename]["spells"].filter(element => element.name == spellname)[0];
		tooltip_factory(make_spellinfo(spellinfo, spellpos, "icon", iconsrc));
	}
	else { // disciplines
		tooltip_factory(spellname);
	}
	return icon;
}

async function load_tree() {
	let base_skills = class_type_masks[currclass] & 0xF0;
	let class_skills = class_type_masks[currclass];
	// adjust code to get base power and discipline points, as well as WM tree location.
	// needed because mages have 8 trees unlike 7 for warriors and archers
	if ((class_type_masks[currclass] & 0xF0) == 32) {
		wmrow = 8;
		powerpoints = 32;
	}
	else {
		wmrow = 7;
		powerpoints = 80;
	}
	try {
		trainerdata = await $().getJSON("data/trainer/" + trainerdataversion + "/trainerdata.json");
	}
	catch (error) {
		// Should never happen as the data is local...
		alert(`Unable to fetch trainer data: ${error}`);
		return;
	}
	let alltrees = trainerdata["class_disciplines"][base_skills];
	alltrees = alltrees.concat(trainerdata["class_disciplines"][class_skills]);
	let trainerhtml = "";
	let treepos = 0;
	alltrees.forEach( (tree) => {
		treepos++;
		let spellpos = 0;
		let iconsrc = "data/trainer/" + trainerdataversion + "/icons/" + tree.replace(/ /g, "") + ".jpg";
		trainerhtml += `<div treepos="${treepos}" class="t${treepos} card">`;
		trainerhtml += icon_factory(spellpos, iconsrc, treepos, tree, "");
		trainerdata["disciplines"][tree]["spells"].forEach( (spell) => {
			spellpos++;
			if (treepos == wmrow && spellpos % 2 == 1) {
				// WM tree; don't display empty skills, put a placeholder instead.
				trainerhtml += `<div class="p${spellpos}"><div class="icon"></div></div>`;
			}
			else {
				let spellname = spell["name"];
				trainerhtml += icon_factory(spellpos, iconsrc, treepos, spellname, tree);
			}
		});
		trainerhtml += "</div>";
	});
	// disable all animation
	$("#t-trainer").css("animation", "none");
	// "reset" changes due to animation
	document.getElementById("t-trainer").offsetHeight;
	$("#t-trainer").css("animation", "1s fadein");
	$("#t-trainer").html(trainerhtml);

	dpointstotal = trainerdata["points"]["discipline"][powerpoints][currlevel - 1];
	ppointstotal = trainerdata["points"]["power"][powerpoints][currlevel - 1] + extrappoints;
	dpointsleft = dpointstotal;
	ppointsleft = ppointstotal;
	$("#t-dpointsleft").text(dpointstotal);
	$("#t-dpointstotal").text(dpointstotal);
	$("#t-ppointsleft").text(ppointstotal);
	$("#t-ppointstotal").text(ppointstotal);

	for (let i = 1; i <= wmrow; i++)
		update_tree(i);

	// need to add this trigger **once** the trainer UI is generated
	$(".plus, .minus").on("click", function() {
		if (this.parentNode.parentNode.className == "p0") {
			discipline_change(this);
		}
		else {
			power_change(this);
		}
	});
	input_setup_from_url();
	while (tooltips.length) {
		tooltips.shift().call();
	}

	if (is_beta)
		$("#title").append(" - " + trainerdata["version"]);
}

function tablify(rowname, columns, color = "") {
	if (typeof columns == "string" || typeof columns == "boolean" || typeof columns == "number") {
		if (columns.length == 0 || columns == true)
			columns = "yes"
		return `<tr><th class="${color}">${rowname}</th><td colspan=5>${columns}</td></tr>`;
	}
	else {
		let htmlcolumns = "";
		columns.forEach( (column) => htmlcolumns += `<td>${column}</td>`);
		// Better line breaking on mobile
		htmlcolumns = htmlcolumns.replace(/(\d+)([-\/])(\d+)/g, "$1 $2 $3");
		return `<tr><th class="${color}">${rowname}</th>${htmlcolumns}</tr>`;
	}

}

function itemify(name, value, clas) {
	return `<span class="${clas}"><b>${name}</b>&nbsp;${value}</span><br/>`;
}

function make_spellinfo(spellinfo, iconposition, iconclass, iconurl) {
	// don't duplicate css, redraw an icon
	let spellhtml = `
		<div class="p${iconposition} descriptionheader">
			<div class="${iconclass}" style="background-image:url(${iconurl});"></div>
			<div>
				<h2>${spellinfo["name"]}</h2>
				<p class="description"><i>${spellinfo["description"]}</i></p>
			</div>
		</div>`;
	let tabularhtml = ""
	if ("type" in spellinfo)
		spellhtml += itemify("Type:", spellinfo["type"]);
	if ("cast" in spellinfo)
		spellhtml += itemify("Cast:", spellinfo["cast"] + "s");
	if ("gcd" in spellinfo)
		spellhtml += itemify("Global Cooldown:", spellinfo["gcd"]);
	if ("range" in spellinfo)
		spellhtml += itemify("Range:", spellinfo["range"]);
	if ("area" in spellinfo)
		spellhtml += itemify("Area:", spellinfo["area"]);
	if ("cooldown" in spellinfo)
		spellhtml += itemify("Cooldown:", spellinfo["cooldown"] + "s");
	if ("weapon_interval" in spellinfo)
		spellhtml += itemify("Affected by weapon interval", "", "purple");
	if ("blockable_100" in spellinfo)
		spellhtml += itemify("Only blockable at 100%", "", "purple");
	if ("resistible_100" in spellinfo)
		spellhtml += itemify("Only resistible at 100%", "", "purple");
	if ("mana" in spellinfo)
		tabularhtml += tablify("Mana", spellinfo["mana"]);
	if ("duration" in spellinfo)
		tabularhtml += tablify("Duration (s)", spellinfo["duration"]);
	if ("damage" in spellinfo) {
		for (let type in spellinfo["damage"]) {
			tabularhtml += tablify(`${type} damage`, spellinfo["damage"][type], "red");
		}
	}
	if ("debuffs" in spellinfo) {
		for (let type in spellinfo["debuffs"]) {
			tabularhtml += tablify(`${type}`, spellinfo["debuffs"][type], "red");
		}
	}
	if ("buffs" in spellinfo) {
		for (let type in spellinfo["buffs"]) {
			tabularhtml += tablify(`${type}`, spellinfo["buffs"][type], "blue");
		}
	}
	if (tabularhtml.length != 0) {
		let theader = `<div style="overflow-x:auto"><table><thead><tr>
			   <th></th><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th>
			  </tr></thead>`;
		let tfooter = "</table></div>";
		spellhtml = spellhtml + theader + tabularhtml + tfooter;
	}
	return spellhtml;
}


function power_change(power) {
	let change_direction = power.className;
	let skill_level_html = power.parentNode.parentNode.getElementsByClassName("skilllvl")[0];
	let skill_level = parseInt($(skill_level_html).text());
	let discipline_level = parseInt($(power.parentNode.parentNode.parentNode.getElementsByClassName("skilllvl")[0]).text());
	let wanted_level = change_direction == "plus" ? skill_level + 1 : skill_level - 1;
	let diffpoints = 0;
	let maxslvl = trainerdata["required"]["power"][discipline_level - 1];
	// The first skill of each tree can be level 2 even if discipline level is 1
	if (discipline_level == 1)
		maxslvl++;
	if (wanted_level < minplevel) {
		wanted_level = maxslvl; // Loop from -1 to maxslvl
		diffpoints = 0 - maxslvl;
	}
	else {
		diffpoints = change_direction == "plus" ? -1 : 1;
	}
	if (wanted_level > maxplevel || wanted_level < minplevel) {
		console.log("bad power level", wanted_level);
		if (automated_clicks == true) bad_shared_link();
		return;
	}
	if (ppointsleft < wanted_level - skill_level) {
		console.log("not enough power points");
		if (automated_clicks == true) bad_shared_link();
		return;
	}
	if (wanted_level > maxslvl) {
		console.log("not enough discipline points");
		if (automated_clicks == true) bad_shared_link();
		return;
	}
	// valid, change it
	$("#t-ppointsleft").text(ppointsleft += diffpoints);
	$(skill_level_html).text(wanted_level);
	$(power.parentNode.parentNode.childNodes[1]).css('filter', wanted_level == 0 ? 'brightness(.25)' : 'brightness(1)');
}

function discipline_change(discipline) {
	let change_direction = discipline.className;
	let discipline_level = discipline.parentNode.parentNode.getElementsByClassName("skilllvl")[0];
	let current_level = parseInt($(discipline_level).text());
	let wanted_level = change_direction == "plus" ? current_level + 2 : current_level - 2;
	if (wanted_level < mindlevel) {
		// Try to set up the max discipline level
		let max_avail_dlvl = 0;
		change_direction = "plus";
		// XXX Is there a less naive way ?
		for (let lvl in trainerdata["required"]["level"]) {
			if (trainerdata["required"]["level"][lvl] <= currlevel)
				max_avail_dlvl = trainerdata["required"]["level"][lvl];
		}
		wanted_level = Math.floor(max_avail_dlvl / 2 + 1);
		// round to odd discipline value
		if (wanted_level % 2 == 0)
			wanted_level--;
	}
	if (wanted_level > maxdlevel || wanted_level < mindlevel) {
		console.log("bad discipline level", wanted_level);
		if (automated_clicks == true) bad_shared_link();
		return;
	}
	if (trainerdata["required"]["level"][wanted_level- 1] > currlevel) {
		console.log("player level is too low");
		if (automated_clicks == true) bad_shared_link();
		return;
	}
	// check if we have enough discipline points left
	let discipline_points_balance = change_direction == "plus" ?
		0 - ( trainerdata["required"]["points"][wanted_level - 1] - trainerdata["required"]["points"][current_level - 1] ) :
		trainerdata["required"]["points"][current_level - 1] - trainerdata["required"]["points"][wanted_level - 1];
	if (	change_direction == "plus" &&
		dpointsleft + discipline_points_balance < 0 ) {
		console.log("not enough discipline points");
		if (automated_clicks == true) bad_shared_link();
		return;
	}
	// valid, do the change
	dpointsleft += discipline_points_balance;
	$("#t-dpointsleft").text(dpointsleft);
	$(discipline_level).text(wanted_level);
	let treepos = discipline.parentNode.parentNode.parentNode.getAttribute("treepos");
	// deal with the possible skills changes
	update_tree(treepos);
}

function update_tree(treepos) {
	let dlvl = parseInt($(`div[treepos="${treepos}"] .p0 .icon .skilllvl`).text());
	let maxslvl = trainerdata["required"]["power"][dlvl];

	// XXX maybe there are better selector options to get all values for a
	// tree but ...
	for (let i = 1; i <= 10; i++) {
		let sel_icon = $(`div[treepos="${treepos}"] .p${i} .icon`);
		if (treepos != wmrow) {
			var sel_plus = $(`div[treepos="${treepos}"] .p${i} .skillspinner .plus`);
			var sel_minus = $(`div[treepos="${treepos}"] .p${i} .skillspinner .minus`);
		}
		// if tree has been lowered and the skill is no more available,
		// make it visually disabled
		if (i > trainerdata["required"]["available"][dlvl - 1]) {
			maxslvl = 0;
		}
		// reduce powerpoints when discipline level is lowered
		if (treepos != wmrow) {
			let skilllvl = parseInt($(`div[treepos="${treepos}"] .p${i} .icon .skilllvl`).text());
			if (skilllvl > maxslvl) {
				// change to the max power level available
				$(`div[treepos="${treepos}"] .p${i} .icon .skilllvl`).text(maxslvl);
				// update available power points
				ppointsleft += skilllvl - maxslvl;
				$("#t-ppointsleft").text(ppointsleft);
			}
		}
		if ( 	(currlevel > trainerdata["required"]["level"][dlvl - 1] && i != 1) ||
			(currlevel != maxlevel && treepos == wmrow) ) {
			// reduce strongly brightness and disable buttons on
			// unavailable skills due to player or discpline tree
			// level. also forbid WM tree for non level 60.
			sel_icon.css('filter','grayscale(1) brightness(.5)');
			if (treepos != wmrow) {
				sel_plus.hide();
				sel_minus.hide();
			}
		}
		// if discipline tree level allows the skill to be interacted
		// with, reenable the skill
		if ( i <= trainerdata["required"]["available"][dlvl - 1] ) {
			if (treepos == wmrow) {
				// WM tree requires no skills points, just make
				// it fully visible
				sel_icon.css('filter','brightness(1)');
			}
			else {
				sel_icon.css('filter','brightness(.25)');
				sel_plus.show();
				sel_minus.show();
			}
		}
		// ensure brightness is kept when a tree level is decreasing in
		// the beginning of that loop
		if (treepos != wmrow && $(`div[treepos="${treepos}"] .p${i} .icon .skilllvl`).text() > 0) {
			sel_icon.css('filter','brightness(1)');
		}
	}
	return;
}

class SetupCompressor {

	constructor() {
		this.lookup = {};
		this.b66chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_.~";
		let i = 0;
		for (let x = 0; x < 6; x++) {
			for (let y = 0; y < 6; y++) {
				this.lookup[this.b66chars[i]] = [x, y];
				if (x != y)
					this.lookup[this.b66chars[i + 31]] = [y, x];
				i++;
			}
		}
	}

	compress_version1(version) {
		let multiplier = Math.floor(version / 60);
		let remainder = version % 60;
		return this.b66chars[multiplier] + this.b66chars[remainder];

	}

	compress(setup) {
		let output = "";
		setup = setup.split("+");
		output += this.compress_version1(trainerdatasets.indexOf(setup.shift()));
		output += this.b66chars[classes.indexOf(setup.shift())];
		output += this.b66chars[parseInt(setup.shift())]; // level
		for (let i = 0; i < setup.length; i++) {
			if (i % 2 == 0) { // discipline points
				output += this.b66chars[parseInt(setup[i])];
			}
			else { // power points
				for (let pos = 0; pos < 10; pos += 2) {
					let searchfor = Array.from(setup[i].slice(pos, pos+2));
					for (let combi in this.lookup) {
						if (this.lookup[combi].toString() == searchfor) {
							output += combi;
							break;
						}
					}
				}
			}
		}
		return output
	}

	decompress_version1(string) {
		let version_index = 60 * this.b66chars.indexOf(string[0]);
		version_index += this.b66chars.indexOf(string[1]);
		return trainerdatasets[version_index];
	}

	decompress(string) {
		let setup = "";
		let offset = 0;
		if (skillset_urlformat == 0) {
			setup += trainerdatasets[this.b66chars.indexOf(string[0])] + "+";
		}
		else if (skillset_urlformat == 1) {
			setup += this.decompress_version1(string.slice(0,2)) + "+";
			offset = 1;
		}
		setup += classes[this.b66chars.indexOf(string[offset + 1])] + "+";
		setup += this.b66chars.indexOf(string[offset + 2]) + "+"; // level
		string = string.substring(offset + 3);
		for (let pos = 0; pos <= string.length -1; pos += 6) {
			let disc = Array.from(string.slice(pos,pos+6));
			// discipline points
			setup += this.b66chars.indexOf(disc.shift()) + "+";
			// skill points
			for (let skills of disc) {
				setup += this.lookup[skills].join("");
			}
			setup += "+";
		}
		setup = setup.substring(0, setup.length - 1);
		let setup_length = setup.split("+").length;
		// Check if setup looks valid (19 fields for mages, 17 for the others)
		if (setup_length != 17 && setup_length != 19)
			return null;
		return setup;
	}

}
var compressor = new SetupCompressor();
