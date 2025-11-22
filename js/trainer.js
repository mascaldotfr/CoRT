import {__api__urls, __api__frontsite} from "./api_url.js";
import {$} from "./libs/cortlibs.js";
import {_} from "../data/i18n.js";
import {constants} from "./trainertools/constants.js";
import { computePosition as fu_computePosition, offset as fu_offset, flip as fu_flip, shift as fu_shift } from "./libs/floating-ui-tooltip.js";

// Classes are instanciated at the end

$(document).ready(function() {
	document.title = "CoRT - " + _("Trainer");
	$("#title").text(_("Trainer"));
	$("#titleinfo").html(
		_("Hovering your mouse or clicking (on mobile) on a skill icon will show its description.") +
		"<br>" +
		_("Selecting an higher character level will upgrade your current setup to that level."));
	if (datasets.is_beta)
		$("#title").append(`&nbsp;<span class="red">(AMUN/BETA)</span>`);
	let html_class_options = [];
	for (let clas of constants.classes) {
		html_class_options.push(`<option value="${clas}">${_(clas[0].toUpperCase() + clas.slice(1))}</option>`);
	}
	$("#t-class").html(html_class_options.join(""));
	$("#t-load").text(_("Load / Reset"));
	$("#t-save").text(_("Share / Save"));
	$("#t-dpoints-label").text(_("Discipline points:"));
	$("#t-ppoints-label").text(_("Power points:"));

	// generate characters levels options
	let html_level_options = [`<option value="61">60 (+${_("Necro crystal")})</option>`];
	for (let i = constants.maxlevel - 1; i >= constants.minlevel; i--) {
		html_level_options.push(`<option value="${i}">${i}</option>`);
	}
	$("#t-level").append(html_level_options.join(""));
	// generate datasets version
	let html_dataset_options = [`<option value="${datasets.newest_dataset}" default selected>
		${_("Current game version")} (${datasets.newest_dataset})</option>`];
	for (let i = datasets.trainerdatasets.length - 2; i >= 0; i--) {
		html_dataset_options.push(`<option value="${datasets.trainerdatasets[i]}">${datasets.trainerdatasets[i]}</option>`);
	}
	$("#t-version").html(html_dataset_options.join(""));
	// Drop "index.html" from the URL bar if you are coming from search engines
	if (window.location.pathname.endsWith("index.html")) {
		const path = window.location.pathname;
		const dirname = path.endsWith("/") ? path : path.substring(0, path.lastIndexOf("/"));
		window.location.pathname = dirname + "/";
	}
	// search for a given trainer dataset in url, and skillset then
	// set the version accordingly. See also manage_versions.
	let urlsearch = new URLSearchParams(window.location.search);
	let skillset = urlsearch.get("s");
	if (!skillset) {
		skillset = urlsearch.get("t");
		if (skillset)
			setup.skillset_urlformat = 1;
	}
	setup.trainerdataversion = urlsearch.get("d");
	if (skillset) {
		setup.load_from_url(skillset);
	}
	else {
		$("#t-load").trigger("click");
	}
});

$("#t-load").on("click", function() {
	// a setup was already loaded, reinit it
	if (setup.level != 0)
		setup = new SetupManager();
	let level = $("#t-level").val();
	let clas = $("#t-class").val();
	if ( (level >= constants.minlevel && level <= constants.maxlevel) ) {
		setup.level = level;
		setup.extrappoints = 0;
		setup.has_necro_gem = false;
	}
	else if (level == 61) {
		setup.level = constants.maxlevel;
		setup.extrappoints = 5;
		setup.has_necro_gem = true;
	}
	else {
		alert(_("Please select a level"));
		return;
	}
	if (clas != null) {
		setup.clas = clas;
	}
	else {
		alert(_("Please select a class"));
		return;
	}
	setup.trainerdataversion = $("#t-version").val();
	datasets.manage_versions();
	setup.load_tree();
});

$("#t-level").on('change', function() {
	let selectedllevel = $("#t-level").val();
	// Upgrade does not work if no trees are loaded, you are level 60
	// or if the requested level is lower than your current level
	// The +1 is because of the necro gem (level 61)
	if (setup.level == 0 || (setup.level == constants.maxlevel + 1) || setup.level > selectedllevel)
		return;
	if (setup.has_necro_gem) // don't downgrade from necro to normal 60!
		return;
	setup.level = selectedllevel;
	window.location.assign(setup.save_to_url(false));
});

$("#t-save").on("click", function() {
	if (setup.trainerdata === null) {
		window.alert(_(`You need first to load trees by clicking on "%s"!`, _("Load / Reset")));
		return;
	}

	let saved_url = setup.save_to_url();
	if (saved_url == null)
		return;

	// populate the fake modal
	$("#t-sharedlink h3").text(_("Here is the link to your setup:"));
	$("#t-sharedlink-copy").text(_("Copy link"));
	$("#t-sharedlink-close").text(_("Close") + " (Esc)");
	$("#t-sharedlink-url").val(saved_url);

	// allow pressing echap
	$("body").on("keydown", function(event) {
		if (event.key === "Escape" || event.keyCode === 27) {
			event.preventDefault();
			window.location.href = $("#t-sharedlink-url").val();
		}
	});

	// disable the trainer
	$("#t-container").css("pointer-events", "none");
	$("#t-container").css("filter", "blur(8px)");
	// show our fake modal
	$("#t-sharedlink").prependTo("#t-container");
	$("#t-sharedlink").css("display", "block");
});

$("#t-sharedlink-close").on("click", function() {
       window.location.href = $("#t-sharedlink-url").val();
});

$("#t-sharedlink-copy").on("click", function() {
	function failure_message(error) {
		console.error("Failed to copy text: ", error);
		$("#t-sharedlink-copy").text("Copy failed!");
	}
	try {
		navigator.clipboard.writeText($("#t-sharedlink-url").val())
			.then(() => {
				$("#t-sharedlink-copy").text(_("Link copied!"));
				let timer = setInterval(() => {
					$("#t-sharedlink-copy").text(_("Copy link"));
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


function power_change(power) {
	let change_direction = power.className;
	// Whole skill html node `<div id="pN">`
	let ancestor = power.parentNode.parentNode;
	// for display
	let skill_level_html = ancestor.querySelector(".skilllvl");
	// internal
	let skill_level_attr = ancestor.querySelector(".icon");
	let skill_level = parseInt(skill_level_attr.dataset.value);
	let discipline_level = parseInt(ancestor.parentNode.querySelector(".icon").dataset.value);
	let wanted_level = change_direction == "plus" ? skill_level + 1 : skill_level - 1;
	let diffpoints = 0;
	let maxslvl = setup.trainerdata["required"]["power"][discipline_level - 1];
	// The first skill of each tree can be level 2 even if discipline level is 1
	if (discipline_level == 1)
		maxslvl++;
	if (wanted_level < constants.minplevel) {
		wanted_level = maxslvl; // Loop from -1 to maxslvl
		diffpoints = 0 - maxslvl;
	}
	else {
		diffpoints = change_direction == "plus" ? -1 : 1;
	}
	if (wanted_level > constants.maxplevel || wanted_level < constants.minplevel) {
		console.log("bad power level", wanted_level);
		if (setup.automated_clicks == true) setup.bad_shared_link();
		return;
	}
	if (setup.ppointsleft < wanted_level - skill_level) {
		console.log("not enough power points");
		if (setup.automated_clicks == true) setup.bad_shared_link();
		return;
	}
	if (wanted_level > maxslvl) {
		console.log("not enough discipline points");
		if (setup.automated_clicks == true) setup.bad_shared_link();
		return;
	}
	// valid, change it
	setup.ppointsleft += diffpoints;
	$(skill_level_html).text(wanted_level);
	$(skill_level_attr).attr("data-value", wanted_level);

	// input_from_url() will deal with everything under this line
	if (setup.automated_clicks === true) return;

	$("#t-ppointsleft").text(setup.ppointsleft);
	power.parentNode.parentNode.childNodes[1].dataset.status = wanted_level == 0 ? "disabled" : "active";
}

function discipline_change(discipline) {
	let change_direction = discipline.className;
	// for display
	let discipline_level_html = discipline.parentNode.parentNode.getElementsByClassName("skilllvl")[0];
	// internal
	let discipline_level = discipline.parentNode.parentNode.getElementsByClassName("icon")[0];
	let current_level = parseInt(discipline_level.getAttribute("data-value"));
	let wanted_level = change_direction == "plus" ? current_level + 2 : current_level - 2;
	if (wanted_level < constants.mindlevel) {
		// Try to set up the max discipline level
		let max_avail_dlvl = 0;
		change_direction = "plus";
		const levels = setup.trainerdata["required"]["level"];
		for (let i = 0; i < levels.length; i++) {
			if (levels[i] <= setup.level && levels[i] > max_avail_dlvl) {
				max_avail_dlvl = levels[i];
			}
		}
		wanted_level = Math.floor(max_avail_dlvl / 2 + 1);
		// round to odd discipline value
		if (wanted_level % 2 == 0)
			wanted_level--;
	}
	if (wanted_level > constants.maxdlevel || wanted_level < constants.mindlevel) {
		console.log("bad discipline level", wanted_level);
		if (setup.automated_clicks == true) setup.bad_shared_link();
		return;
	}
	if (setup.trainerdata["required"]["level"][wanted_level- 1] > setup.level) {
		console.log("player level is too low");
		if (setup.automated_clicks == true) setup.bad_shared_link();
		return;
	}
	// check if we have enough discipline points left
	let discipline_points_balance = change_direction == "plus" ?
		0 - ( setup.trainerdata["required"]["points"][wanted_level - 1] - setup.trainerdata["required"]["points"][current_level - 1] ) :
		setup.trainerdata["required"]["points"][current_level - 1] - setup.trainerdata["required"]["points"][wanted_level - 1];
	if (	change_direction == "plus" &&
		setup.dpointsleft + discipline_points_balance < 0 ) {
		console.log("not enough discipline points");
		if (setup.automated_clicks == true) setup.bad_shared_link();
		return;
	}
	// valid, do the change
	setup.dpointsleft += discipline_points_balance;
	$(discipline_level_html).text(wanted_level);
	$(discipline_level).attr("data-value", wanted_level);
	let treepos = discipline.parentNode.parentNode.parentNode.getAttribute("treepos");
	// deal with the possible skills changes when clicks are manual
	// when inputting a setup, input_from_url() will deal with that
	// once for all
	if (setup.automated_clicks === false) { 
		update_tree(treepos);
		$("#t-dpointsleft").text(setup.dpointsleft);
	}
}

function update_tree(treepos) {
	let dlvl = parseInt($(`div[treepos="${treepos}"] .p0 .icon`).attr("data-value"));
	let requirements = setup.trainerdata["required"];
	let maxslvl = requirements["power"][dlvl];
	const is_wmrow = treepos == setup.wmrow;

	// XXX maybe there are better selector options to get all values for a
	// tree but ...
	for (let i = 1; i <= 10; i++) {
		let sel_icon = $(`div[treepos="${treepos}"] .p${i} .icon`);
		let sel_skillspinner = null;
		let sel_skilllvl = null;
		if (!is_wmrow) {
			sel_skillspinner = $(`div[treepos="${treepos}"] .p${i} .skillspinner`);
			sel_skilllvl = $(`div[treepos="${treepos}"] .p${i} .icon .skilllvl`);
		}
		// if tree has been lowered and the skill is no more available,
		// make it visually disabled
		if (i > requirements["available"][dlvl - 1]) {
			maxslvl = 0;
		}
		// reduce powerpoints when discipline level is lowered
		if (!is_wmrow) {
			// !!! misleading, but skill levels are fetched internally from the icon attribute
			let skilllvl = parseInt(sel_icon.attr("data-value"));
			if (skilllvl > maxslvl) {
				// change to the max power level available
				sel_skilllvl.text(maxslvl);
				sel_icon.attr("data-value", maxslvl);
				// update available power points
				setup.ppointsleft += skilllvl - maxslvl;
			}
		}
		if ( 	(setup.level > requirements["level"][dlvl - 1] && i != 1) ||
			(setup.level != constants.maxlevel && is_wmrow) ) {
			// reduce strongly brightness and disable buttons on
			// unavailable skills due to player or discpline tree
			// level. also forbid WM tree for non level 60.
			sel_icon.attr("data-status", "disabled");
			if (!is_wmrow) {
				sel_skillspinner.attr("data-status", "hidden");
			}
		}
		// if discipline tree level allows the skill to be interacted
		// with, reenable the skill
		if ( i <= requirements["available"][dlvl - 1] ) {
			if (is_wmrow) {
				// WM tree requires no skills points, just make
				// it fully visible
				sel_icon.attr("data-status", "active");
			}
			else {
				sel_icon.attr("data-status", "available");
				sel_skillspinner.attr("data-status", "visible");
			}
		}
		// ensure brightness is kept when a tree level is decreasing in
		// the beginning of that loop
		if (!is_wmrow && parseInt(sel_icon.attr("data-value")) > 0) {
			sel_icon.attr("data-status", "active");
		}
	}

	// display the new amount of powerpoints left
	$("#t-ppointsleft").text(setup.ppointsleft);
}

class SetupManager {
	// this class contains the current setup data
	// and functions related to it
	constructor() {
		// skillset_urlformat
		// 0: trainerdataset version on 1 digit (?s=)
		// 1: trainerdataset on 2 version digits (?t=)
		this.skillset_urlformat = 0;
		// total discipline points
		this.dpointstotal = 0;
		// total power points
		this.ppointstotal = 0;
		// discipline powerpoints left
		this.dpointsleft = 0;
		// power points left
		this.ppointsleft = 0;
		// extra points (levels > 60, actually only the necro gem)
		this.extrappoints = 0;
		this.has_necro_gem = false; // Red Crystal of the necromancer
		// setup level
		this.level = 0;
		// setup class
		this.clas = null;
		// position of the WM row
		this.wmrow = 0;
		// XXX beware it's just a buffer that is unexploitable once the setup is loaded
		this.saved_setup = null;
		// Click are currently automated due to entering a setup from a saved URL
		this.automated_clicks = false;
		// Used to fetch the number of powerpoints from trainerdata.json, not related to the setup itself.
		this.powerpoints = 0;
		// Content of trainerdata.json
		this.trainerdata = null;
		// Version of Regnum used by this setup
		this.trainerdataversion = null;
	}

	bad_shared_link() {
		$("#t-container").html(`
			 <div class="card">
				 <h1 class="red">${_("Your shared link is bad. Bailing out, sorry!")}</h1>
				 <p class="center">${_("Redirecting to the trainer page in")}
				 <span id="redirect-counter" class="bold">10</span>${_("s")}</p>
			 </div>
		`);
		const countdownElement = document.getElementById("redirect-counter");
		let count = 10;
		const interval = setInterval(() => {
			count--;
			countdownElement.textContent = String(count).padStart(2, "0");
			if (count <= 0)
				clearInterval(interval);
		}, 1000);
		setTimeout(() => window.location.replace(window.location.origin + window.location.pathname), 10000);
	}

	// load_tree() being async, you need the tree to be loaded
	// in order to click stuff so this is before loading the tree ...
	async load_from_url(skillset) {
		let proposed_setup = null;
		if (this.trainerdataversion !== null) {
			// Old LZstring URL, redirect to new url format
			let lz = await import("./libs/lz-string.min.js");
			proposed_setup = lz.LZString.decompressFromEncodedURIComponent(skillset);
			proposed_setup = setup.trainerdataversion + "+" + proposed_setup;
			window.location.assign(window.location.origin + window.location.pathname +
					       "?t=" + compressor.compress(proposed_setup));

		}
		this.saved_setup = compressor.decompress(skillset, setup);
		if (this.saved_setup == null) {
			this.bad_shared_link();
			return;
		}
		this.saved_setup = this.saved_setup.split("+");
		this.trainerdataversion = this.saved_setup.shift();
		$("#t-class").val(this.saved_setup.shift());
		$("#t-level").val(this.saved_setup.shift());
		datasets.manage_versions();
		$("#t-version").val(this.trainerdataversion);
		$("#t-load").trigger("click");
	}

	async load_tree() {
		let base_skills = constants.class_type_masks[setup.clas] & 0xF0;
		let class_skills = constants.class_type_masks[setup.clas];
		// adjust code to get base power and discipline points, as well as WM tree location.
		// needed because mages have 8 trees unlike 7 for warriors and archers
		if ((constants.class_type_masks[this.clas] & 0xF0) == 32) {
			this.wmrow = 8;
			this.powerpoints = 32;
		}
		else {
			this.wmrow = 7;
			this.powerpoints = 80;
		}
		try {
			this.trainerdata = await $().getJSON("data/trainer/" + this.trainerdataversion + "/trainerdata.json");
		}
		catch (error) {
			// Should never happen as the data is local...
			alert(`Unable to fetch trainer data: ${error}`);
			return;
		}
		let alltrees = this.trainerdata["class_disciplines"][base_skills];
		alltrees = alltrees.concat(this.trainerdata["class_disciplines"][class_skills]);
		let trainerhtml = [];
		let treepos = 0;
		alltrees.forEach( (tree) => {
			treepos++;
			let spellpos = 0;
			let iconsrc = "data/trainer/" + this.trainerdataversion + "/icons/" + tree.replace(/ /g, "") + ".webp";
			trainerhtml.push(`<div treepos="${treepos}" class="t${treepos} card">`);
			trainerhtml.push(icons.factory(spellpos, iconsrc, treepos, tree, ""));
			this.trainerdata["disciplines"][tree]["spells"].forEach( (spell) => {
				spellpos++;
				if (treepos == this.wmrow && spellpos % 2 == 1) {
					// WM tree; don't display empty skills, put a placeholder instead.
					trainerhtml.push(`<div class="p${spellpos}"><div class="icon"></div></div>`);
				}
				else {
					trainerhtml.push(icons.factory(spellpos, iconsrc, treepos, spell["name"], tree));
				}
			});
			trainerhtml.push("</div>");
		});
		// disable all animation
		$("#t-trainer").css("animation", "none");
		// "reset" changes due to animation by causing a reflow
		const _unused = document.getElementById("t-trainer").offsetHeight;
		$("#t-trainer").css("animation", "1s fadein");
		$("#t-trainer").html(trainerhtml.join(""));

		this.dpointstotal = this.trainerdata["points"]["discipline"][this.powerpoints][this.level - 1];
		this.ppointstotal = this.trainerdata["points"]["power"][this.powerpoints][this.level - 1] + this.extrappoints;
		this.dpointsleft = this.dpointstotal;
		this.ppointsleft = this.ppointstotal;
		$("#t-dpointsleft").text(this.dpointstotal);
		$("#t-dpointstotal").text(this.dpointstotal);
		$("#t-ppointsleft").text(this.ppointstotal);
		$("#t-ppointstotal").text(this.ppointstotal);

		// Don't need to checkout trees if we load a saved setup
		if (this.saved_setup === null) {
			for (let i = 1; i <= setup.wmrow; i++)
				update_tree(i);
		}
		// need to add this trigger **once** the trainer UI is generated
		$(".plus, .minus").on("click", function() {
			if (this.parentNode.parentNode.className == "p0") {
				discipline_change(this);
			}
			else {
				power_change(this);
			}
		});

		this.input_from_url();

		// Trick to defer toolstips binding, allowing
		// skillbars to be displayed sooner
		setTimeout(() => {
			while (icons.tooltips.length) {
				icons.tooltips.shift().call();
			}
		}, 1);

	}


	// ... and this is after (called by load_tree())
	input_from_url() {
		/* while slower, generating clicks allows to assert that the setup is correct */
		if (this.saved_setup === null || this.saved_setup === undefined)
			return;
		this.automated_clicks = true;
		let row = 0;
		for (let item = 0; item < this.saved_setup.length; item++) {
			if (item % 2 == 0) {
				// discipline points
				row++;
				let do_clicks = (this.saved_setup[item] - 1) / 2 ;
				let selector = document.querySelector(`#t-trainer .t${row} .p0 .skillspinner .plus`);
				for (let i = 0; i < do_clicks; i++) {
					try {
						discipline_change(selector);
					}
					catch (_unused) {
						this.bad_shared_link();
						this.automated_clicks = false;
						return;
					}
				}
			}
			else {
				// power points
				let powers = this.saved_setup[item].split("");
				if (row == this.wmrow)
					continue; // no pp for the wm row
				for (let power in powers) {
					power = parseInt(power);
					let selector = document.querySelector(`div[treepos="${row}"] .p${power + 1} .skillspinner .plus`);
					for (let i = 0; i < powers[power]; i++) {
						try {
							power_change(selector);
						}
						catch (_unused) {
							this.automated_clicks = false;
							this.bad_shared_link();
							return;
						}
					}
				}
			}
			// update the tree icons only once per tree, not
			// at every discipline click!
			update_tree(row);
		}
		$("#t-dpointsleft").text(setup.dpointsleft);
		$("#t-ppointsleft").text(setup.ppointsleft);
		this.saved_setup = undefined;
		this.automated_clicks = false;
	}

	upgrade_to_newest_version() {
		this.trainerdataversion = datasets.trainerdatasets.slice(-1);
		window.location.assign(this.save_to_url(false));
	}

	convert_beta_to_live() {
		this.trainerdataversion = datasets.live_datasets.slice(-1);
		// Reassign live datasets for the setup compressor
		datasets.trainerdatasets = datasets.live_datasets;
		window.location.assign(this.save_to_url(false, true));
	}

	save_to_url(shared=true, beta2live=false) {
		if (this.has_necro_gem)
			this.level += 1;
		let setup = this.trainerdataversion + "+" + this.clas + "+" + this.level + "+";
		let dpoints = 0;
		let ppoints = 0;
		// WM row is always the latest one
		for (let row = 1; row <= this.wmrow; row++) {
			// separate discipline skills from power skills
			let discipline = parseInt($(`#t-trainer .t${row} .p0 .icon`).attr("data-value"));
			if (discipline > constants.maxdlevel || discipline < constants.mindlevel) {
				this.bad_shared_link();
				return;
			}
			dpoints += this.trainerdata["required"]["points"][discipline - 1];
			setup += discipline + "+";
			for (let col = 1; col < 11; col++) {
				let level = parseInt($(`#t-trainer .t${row} .p${col} .icon`).attr("data-value"));
				if (level > constants.maxplevel || level < constants.minplevel) {
					this.bad_shared_link();
					return;
				}
				// level is NaN on wmrow
				level = isNaN(level) ? 0 : level;
				ppoints += level;
				setup += level;
			}
			if (row != this.wmrow)
				setup += "+";
		}
		if (dpoints > this.dpointstotal || ppoints > this.ppointstotal) {
			this.bad_shared_link();
			return;
		}
		if (shared)
			this.collect_setup(setup);
		let pathname = window.location.pathname;
		if (beta2live)
			pathname = pathname.substring(0, pathname.lastIndexOf("/") + 1);

		return window.location.origin + pathname + "?t=" + compressor.compress(setup);
	}

	async collect_setup(setupstring) {
		if (window.location.origin != __api__frontsite || datasets.is_beta)
			return;
		try {
			await $().post(__api__urls["submit_trainer"], {"setup":setupstring});
		}
		catch (error) {
			console.error(`Failed to send setup: ${error}`);
		}
	}
}

class Icons {
	constructor() {
		this.tooltips = [];
	}

	tooltip_factory(content, clean_spellname) {
		this.tooltips.push(() => {
			const ref = document.getElementById(clean_spellname);
			if (!ref) return;

			const tip = document.createElement("div");
			tip.className = "tippy-content";
			tip.innerHTML = content;
			tip.style.display = "none";
			document.body.appendChild(tip);

			const update = () => {
				fu_computePosition(ref, tip, {
					placement: "top",
					middleware: [
						fu_offset(8),
						fu_flip(),
						fu_shift({ padding: 5 })
					]
				}).then(({ x, y }) => {
					tip.style.left = `${x}px`;
					tip.style.top = `${y}px`;
				});
			};

			let show_timer;

			ref.addEventListener("mouseenter", () => {
				show_timer = setTimeout(() => {
					update();
					tip.style.display = "block";
				}, 200);
			});

			ref.addEventListener("mouseleave", () => {
				clearTimeout(show_timer);
				tip.style.display = "none";
			});
		});
	}

	factory(spellpos, iconsrc, treepos, spellname, treename) {
		// discipline points are always > 1, but skill points must be 0 to simplify code later.
		let skilllvl = spellpos == 0 ? 1 : 0;
		let clean_spellname = "trainerskill_" + spellname.replace(/[^a-z0-9]/gi, "");
		let icon = [ ` 	<div class="p${spellpos}">
					<div class="icon" style="background-image:url(${iconsrc});"
					     id="${clean_spellname}" data-value="${skilllvl}">
			`];
		// WM tree; don't show skill points
		if (treepos != setup.wmrow || (treepos == setup.wmrow && spellpos == 0))
			icon.push(`<span class="skilllvl">${skilllvl}</span>`);
		icon.push("</div>");
		// WM tree has no skill points, we don't generate + and - buttons
		if (treepos != setup.wmrow || (treepos == setup.wmrow && spellpos == 0 && setup.level == 60)) {
			icon.push(` <div class="skillspinner">
						<button class="plus">+</button><button class="minus">-</button>
					</div>`);
		}
		icon.push("</div>");

		if (treename != "") { // skills
			let spellinfo = setup.trainerdata.disciplines[treename]["spells"].filter(element => element.name == spellname)[0];
			this.tooltip_factory(this.make_spellinfo(spellinfo, spellpos, "icon", iconsrc), clean_spellname);
		}
		else { // disciplines
			this.tooltip_factory(spellname, clean_spellname);
		}
		return icon.join("");
	}

	tablify(rowname, columns, color = "") {
		if (typeof columns == "string" || typeof columns == "boolean" || typeof columns == "number") {
			if (columns.length == 0 || columns == true)
				columns = "yes";
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

	itemify(name, value, clas) {
		return `<span class="${clas}"><b>${name}</b>&nbsp;${value}</span><br/>`;
	}

	make_spellinfo(spellinfo, iconposition, iconclass, iconurl) {
		// don't duplicate css, redraw an icon
		let spellhtml = [` <div class="p${iconposition} descriptionheader">
				<div class="${iconclass}" style="background-image:url(${iconurl});"></div>
				<div>
					<h2>${spellinfo["name"]}</h2>
					<p class="description"><i>${spellinfo["description"]}</i></p>
				</div>
			</div>`];
		let tabularhtml = [];
		if ("type" in spellinfo)
			spellhtml.push(this.itemify("Type:", spellinfo["type"]));
		if ("cast" in spellinfo)
			spellhtml.push(this.itemify("Cast:", spellinfo["cast"] + "s"));
		if ("gcd" in spellinfo)
			spellhtml.push(this.itemify("Global Cooldown:", spellinfo["gcd"]));
		if ("range" in spellinfo)
			spellhtml.push(this.itemify("Range:", spellinfo["range"]));
		if ("area" in spellinfo)
			spellhtml.push(this.itemify("Area:", spellinfo["area"]));
		if ("cooldown" in spellinfo)
			spellhtml.push(this.itemify("Cooldown:", spellinfo["cooldown"] + "s"));
		if ("weapon_interval" in spellinfo)
			spellhtml.push(this.itemify("Affected by weapon interval", "", "purple"));
		if ("blockable_100" in spellinfo)
			spellhtml.push(this.itemify("Only blockable at 100%", "", "purple"));
		if ("resistible_100" in spellinfo)
			spellhtml.push(this.itemify("Only resistible at 100%", "", "purple"));
		if ("mana" in spellinfo)
			tabularhtml.push(this.tablify("Mana", spellinfo["mana"]));
		if ("duration" in spellinfo)
			tabularhtml.push(this.tablify("Duration (s)", spellinfo["duration"]));
		if ("damage" in spellinfo) {
			for (let type in spellinfo["damage"]) {
				tabularhtml.push(this.tablify(`${type} damage`, spellinfo["damage"][type], "red"));
			}
		}
		if ("debuffs" in spellinfo) {
			for (let type in spellinfo["debuffs"]) {
				tabularhtml.push(this.tablify(`${type}`, spellinfo["debuffs"][type], "red"));
			}
		}
		if ("buffs" in spellinfo) {
			for (let type in spellinfo["buffs"]) {
				tabularhtml.push(this.tablify(`${type}`, spellinfo["buffs"][type], "blue"));
			}
		}
		if (tabularhtml.length != 0) {
			spellhtml.push(`<div style="overflow-x:auto"><table><thead><tr>
				   <th></th><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th>
				  </tr></thead>`);
			spellhtml.push(tabularhtml.join(""));
			spellhtml.push("</table></div>");
		}
		return spellhtml.join("");
	}
}

class DatasetsManager {
	constructor() {
		// all available datasets
		this.trainerdatasets = constants.datasets;
		// beta is a special mode where the only dataset at `/data/trainerdata/beta` is used
		this.is_beta = location.pathname.split("/").pop() === "beta.html";
		if (this.is_beta) {
			this.live_datasets = this.trainerdatasets;
			this.trainerdatasets = ["beta"];
		}
		this.newest_dataset = this.trainerdatasets.slice(-1);
	}

	manage_versions() {
		// valid dataset ?
		if (!this.trainerdatasets.includes(setup.trainerdataversion)) {
			// invalid dataset supplied
			setup.trainerdataversion = this.newest_dataset;
		}
		// display a warning if an old version of the datasets are used, and
		// remove it if the latest dataset is loaded after.
		$("#oldversion").remove();
		$("#betaversion").remove();
		if (setup.trainerdataversion != this.newest_dataset)
			$("#t-points").append(`	<div id="oldversion">
					<p class="red"><b>
					${_("This setup is being made with an older version (%s) of CoR, and may be out of date.",
						setup.trainerdataversion)}<p>
					<p><a href="#" id="upgrade-setup">${_("Click here")}</a>
					${_("to upgrade this setup's discipline and power points to the latest version (%s).",
						this.newest_dataset)}</p>
					</div>
					`);
		if (this.is_beta)
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
		$("#beta-to-live").on("click", () => setup.convert_beta_to_live());
		$("#upgrade-setup").on("click", () => setup.upgrade_to_newest_version());
	}

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

	compress(setup_string) {
		let output = "";
		setup_string = setup_string.split("+");
		output += this.compress_version1(datasets.trainerdatasets.indexOf(setup_string.shift()));
		output += this.b66chars[constants.classes.indexOf(setup_string.shift())];
		output += this.b66chars[parseInt(setup_string.shift())]; // level
		for (let i = 0; i < setup_string.length; i++) {
			if (i % 2 == 0) { // discipline points
				output += this.b66chars[parseInt(setup_string[i])];
			}
			else { // power points
				for (let pos = 0; pos < 10; pos += 2) {
					let searchfor = Array.from(setup_string[i].slice(pos, pos+2));
					for (let combi in this.lookup) {
						if (this.lookup[combi].toString() == searchfor) {
							output += combi;
							break;
						}
					}
				}
			}
		}
		return output;
	}

	decompress_version1(string) {
		let version_index = 60 * this.b66chars.indexOf(string[0]);
		version_index += this.b66chars.indexOf(string[1]);
		return datasets.trainerdatasets[version_index];
	}

	decompress(string) {
		let setup_string = "";
		let offset = 0;
		if (setup.skillset_urlformat == 0) {
			setup_string += datasets.trainerdatasets[this.b66chars.indexOf(string[0])] + "+";
		}
		else if (setup.skillset_urlformat == 1) {
			setup_string += this.decompress_version1(string.slice(0,2)) + "+";
			offset = 1;
		}
		setup_string += constants.classes[this.b66chars.indexOf(string[offset + 1])] + "+";
		setup_string += this.b66chars.indexOf(string[offset + 2]) + "+"; // level
		string = string.substring(offset + 3);
		for (let pos = 0; pos <= string.length -1; pos += 6) {
			let disc = Array.from(string.slice(pos,pos+6));
			// discipline points
			setup_string += this.b66chars.indexOf(disc.shift()) + "+";
			// skill points
			for (let skills of disc) {
				setup_string += this.lookup[skills].join("");
			}
			setup_string += "+";
		}
		setup_string = setup_string.substring(0, setup_string.length - 1);
		let setup_string_length = setup_string.split("+").length;
		// Check if setup_string looks valid (19 fields for mages, 17 for the others)
		if (setup_string_length != 17 && setup_string_length != 19)
			return null;
		return setup_string;
	}

}

const compressor = new SetupCompressor();
const datasets = new DatasetsManager();
const icons = new Icons();
// Needs to be reinstanciated every time we load a setup
let setup = new SetupManager();
