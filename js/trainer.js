/*
 * Copyright (c) 2022 mascal
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

minlevel = 10;
maxlevel = 60;
class_type_masks = {
	'archer':0x10, 'hunter':0x11, 'marksman':0x12,
	'mage':0x20, 'conjurer':0x21, 'warlock':0x22,
	'warrior':0x40, 'barbarian':0x41, 'knight':0x42
};

trainerdata = null;
/* Hello future me !
 * You need to add a newer dataset ?
 * Add it in first position !
 * And modify index.html
 */
trainerdatasets = ["1.33.3", "1.33.2"];
trainerdataversion = null;

currlevel = 0;
currclass = null;
mindlevel = 1;
maxdlevel = 19;
minplevel = 0;
maxplevel = 5;
wmrow = 0;
powerpoints = 0;
skillset = null;

$(document).ready(function() {
	// generate characters levels options
	for (i = maxlevel - 1; i >= minlevel; i--) {
		$("#t-level").append('<option value="' + i + '">' + i + '</option>');
	}
	// generate datasets version
	for (i = 1; i < trainerdatasets.length; i++) {
		$("#t-version").append('<option value="' + trainerdatasets[i] + '">' + trainerdatasets[i] + '</option>');
	}
	// search for a given trainer dataset in url, and skillset then
	// set the version accordingly. See also manage_dataset_versions.
	urlsearch = new URLSearchParams(window.location.search);
	skillset = urlsearch.get("s");
	dataset = urlsearch.get("d");
	if (!dataset && skillset) {
		// legacy url, assume old version
		trainerdataversion = "1.33.2";
	}
	else {
		trainerdataversion = dataset;
	}
	if (skillset) {
		load_setup_from_url();
	}
});


function manage_dataset_versions() {
	// valid dataset ?
	if (!trainerdatasets.includes(trainerdataversion)) {
		// invalid dataset supplied
		trainerdataversion = trainerdatasets[0];
	}
	// display a warning if an old version of the datasets are used, and
	// remove it if the latest dataset is loaded alter.
	$("#oldversion").remove();
	if (trainerdataversion != trainerdatasets[0]) {
		$("#t-points").append(`	<p class="red" id="oldversion"><b>This setup is being made with an older version
					(${trainerdataversion}) of CoR, and may be out of date.</p>`);
	}
}

$("#t-load").on("click", function() {
	level = $("#t-level").val();
	clas = $("#t-class").val();
	if ( (level >= minlevel && level <= maxlevel) ) {
		currlevel = level;
	}
	else {
		alert("Please select a level");
		return;
	}
	if (clas != null) {
		currclass = clas;
	}
	else {
		alert("Please select a class");
		return;
	}
	trainerdataversion = $("#t-version").val();
	manage_dataset_versions();
	load_tree();
});


$("#t-save").on("click", function() {
	if ($("#t-trainer").children().length == 0) {
		console.log("share clicked but nothing loaded");
		return;
	}
	setup = "";
	setup = setup.concat($("#t-class option:selected").val()) + "+";
	setup = setup.concat($("#t-level option:selected").text()) + "+";
	// WM row is always the latest one
	for (row = 1; row <= wmrow; row++) {
		// separate discipline skills from power skills
		setup = setup.concat(parseInt($(`#t-trainer .t${row} .p0 .icon .skilllvl`).text())) + "+";
		for (col = 1; col < 11; col++) {
			setup = setup.concat(parseInt($(`#t-trainer .t${row} .p${col} .icon .skilllvl`).text()) || 0);
		}
		if (row != wmrow) {
			setup = setup.concat("+");
		}
	}
	window.prompt("Here is the link to your setup:",
		window.location.origin + window.location.pathname +
			"?d=" + trainerdataversion +
			"&s=" + LZString.compressToEncodedURIComponent(setup));

});

function load_setup_from_url() {
	setup = LZString.decompressFromEncodedURIComponent(skillset).split("+");
	$("#t-class").val(setup.shift());
	$("#t-level").val(setup.shift());
	manage_dataset_versions();
	$("#t-version").val(trainerdataversion);
	$("#t-load").click();
	row = 0;
	for (let item = 0; item < setup.length; item++) {
		if (item % 2 == 0) {
			// discipline points
			row++;
			do_clicks = (setup[item] - 1) / 2 ;
			for (let i = 0; i < do_clicks; i++) {
				$(`#t-trainer .t${row} .p0 .skillspinner .plus`).trigger("click");
			}
		}
		else {
			// power points
			powers = setup[item].split("");
			for (let power in powers) {
				power = parseInt(power);
				for (let i = 0; i < powers[power]; i++) {
					$(`div[treepos="${treepos}"] .p${power + 1} .skillspinner .plus`).trigger("click");
				}
			}
		}
	}

}

function icon_factory(spellpos, iconsrc, treepos, spellname, treename) {
	// discipline points are always > 1, but skill points must be 0 to simplify code later.
	skilllvl = spellpos == 0 ? 1 : 0;
	icon = ` 	<div class="p${spellpos}">
				<div class="icon" style="background-image:url(${iconsrc});" title="${spellname}" treename="${treename}">
		`;
	// WM tree; don't show skill points
	if (treepos != wmrow || (treepos == wmrow && spellpos == 0)) {
		icon = icon.concat(` <span class="skilllvl">${skilllvl}</span>`);
	}
	icon = icon.concat(`</div>`);
	// WM tree has no skill points
	if (treepos != wmrow || (treepos == wmrow && spellpos == 0 && currlevel == 60)) {
		icon = icon.concat(`
				<div class="skillspinner">
					<button class="minus">-</button>&nbsp;<button class="plus">+</button>
				</div>`);
	}
	icon = icon.concat(`</div>`);
	return icon;
}


function load_tree() {
	base_skills = class_type_masks[currclass] & 0xF0;
	class_skills = class_type_masks[currclass];
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
	$("#t-trainer").empty();
	trainerdata = (function () {
		var json = null;
		$.ajax({
			'async': false,
			'global': false,
			'url': "data/" + trainerdataversion + "/trainerdata.json",
			'dataType': "json",
			'success': function (data) {
				json = data;
			}
		});
		return json;
	})();
	alltrees = trainerdata.class_disciplines[base_skills];
	alltrees = alltrees.concat(trainerdata.class_disciplines[class_skills]);
	trainerhtml = "";
	treepos = 0;
	alltrees.forEach( (tree) => {
		treepos++;
		spellpos = 0;
		iconsrc = "data/" + trainerdataversion + "/icons/" + tree.replace(/ /g, "") + ".jpg";
		trainerhtml = trainerhtml.concat(`<div treepos="${treepos}" class="t${treepos}">`);
		trainerhtml = trainerhtml.concat(icon_factory(spellpos, iconsrc, treepos, tree, ""));
		trainerdata.disciplines[tree].spells.forEach( (spell) => {
			spellpos++;
			if (treepos == wmrow && spellpos % 2 == 1) {
				// WM tree; don't display empty skills, put a placeholder instead.
				trainerhtml = trainerhtml.concat(`<div class="p${spellpos}"><div class="icon"></div></div>`);
			}
			else {
				spellname = spell.name;
				trainerhtml = trainerhtml.concat(icon_factory(spellpos, iconsrc, treepos, spellname, tree));
			}
		});
		trainerhtml = trainerhtml.concat(`</div>`);
	});
	$("#t-trainer").append(trainerhtml);

	$("#t-dpointsleft").text(trainerdata.points.discipline[powerpoints][currlevel - 1]);
	$("#t-dpointstotal").text(trainerdata.points.discipline[powerpoints][currlevel - 1]);
	$("#t-ppointsleft").text(trainerdata.points.power[powerpoints][currlevel - 1]);
	$("#t-ppointstotal").text(trainerdata.points.power[powerpoints][currlevel - 1]);
	$(".points").css('visibility','visible');

	for (let i = 1; i <= wmrow; i++) { update_tree(i); }

	// need to add this trigger **once** the trainer UI is generated
	$(".plus, .minus").on("click", function() {
		if (this.parentNode.parentNode.className == "p0") {
			discipline_change(this);
		}
		else {
			power_change(this);
		}
	});
	$(".icon").on("click", function() {
		if (this.parentNode.className != "p0") {
			display_spell(this);
		}
	});
}

function format_buffs(buff) {
	// pretty print buffs and debuffs values
	if (typeof buff == "boolean") {
		return "";
	}
	else {
		return ": " + buff.toString();
	}
}

function display_spell(spellinfo) {
	spellname = $(spellinfo).attr("title");
	treename = $(spellinfo).attr("treename");
	spellinfo = trainerdata.disciplines[treename].spells.filter(element => element.name == spellname)[0];
	spellhtml = `
		<h3>${spellinfo.name}</h3>
		<p><i>${spellinfo.description}</i></p>
		<p><b>Type:</b> ${spellinfo.type}</p>`;
	if ("cast" in spellinfo)
		spellhtml = spellhtml.concat(`<p><b>Cast:</b> ${spellinfo.cast.toString()}s</p>`);
	if ("mana" in spellinfo)
		spellhtml = spellhtml.concat(`<p><b>Mana:</b> ${spellinfo.mana.toString()}</p>`);
	if ("gcd" in spellinfo)
		spellhtml = spellhtml.concat(`<p><b>Global Cooldown:</b> ${spellinfo.gcd.toString()}</p>`);
	if ("range" in spellinfo)
		spellhtml = spellhtml.concat(`<p><b>Range:</b> ${spellinfo.range.toString()}</p>`);
	if ("area" in spellinfo)
		spellhtml = spellhtml.concat(`<p><b>Area:</b> ${spellinfo.area.toString()}</p>`);
	if ("cooldown" in spellinfo)
		spellhtml = spellhtml.concat(`<p><b>Cooldown:</b> ${spellinfo.cooldown.toString()}s</p>`);
	if ("duration" in spellinfo)
		spellhtml = spellhtml.concat(`<p><b>Duration:</b> ${spellinfo.duration.toString()}s</p>`);
	if ("damage" in spellinfo) {
		for (type in spellinfo.damage) {
			spellhtml = spellhtml.concat(`<p class="red"><b>${type}:  ${spellinfo.damage[type].toString()}</b></p>`);
		}
	}
	if ("buffs" in spellinfo) {
		for (type in spellinfo.buffs) {
			spellhtml = spellhtml.concat(`<p class="blue"><b>${type}${format_buffs(spellinfo.buffs[type])}</b></p>`);
		}
	}
	if ("debuffs" in spellinfo) {
		for (type in spellinfo.debuffs) {
			spellhtml = spellhtml.concat(`<p class="red"><b>${type}${format_buffs(spellinfo.debuffs[type])}</b></p>`);
		}
	}
	$("#skillinfo").html(spellhtml);
}
	

function power_change(power) {
	change_direction = power.className;
	skill_level_html = $(power).parent().parent().children(".icon").children(".skilllvl");
	skill_level = parseInt(skill_level_html.text());
	discipline_level = parseInt($(power).parent().parent().parent().children(".p0").find(".skilllvl").text());
	wanted_level = change_direction == "plus" ? skill_level + 1 : skill_level - 1;
	maxslvl = trainerdata.required.power[discipline_level - 1];
	if (wanted_level > maxplevel || wanted_level < minplevel) {
		console.log("bad power level", wanted_level);
		return;
	}
	ppointsleft = parseInt($("#t-ppointsleft").text());
	if (ppointsleft < wanted_level - skill_level) {
		console.log("not enough power points");
		return;
	}
	if (wanted_level > maxslvl) {
		console.log("not enough discipline points");
		return;
	}
	// valid, change it
	$("#t-ppointsleft").text(ppointsleft += change_direction == "plus" ? -1 : 1);
	skill_level_html.text(wanted_level);
	$(power).parent().parent().find(".icon").css('filter', wanted_level == 0 ? 'brightness(.25)' : 'brightness(1)');
}

function discipline_change(discipline) {
	change_direction = discipline.className;
	discipline_level = $(discipline).parent().parent().children(".icon").children(".skilllvl");
	current_level = parseInt(discipline_level.text());
	wanted_level = change_direction == "plus" ? current_level + 2 : current_level - 2;
	if (wanted_level > maxdlevel || wanted_level < mindlevel) {
		console.log("bad discipline level", wanted_level);
		return;
	}
	if (trainerdata.required.level[wanted_level - 1] > currlevel) {
		console.log("player level is too low");
		return;
	}
	// check if we have enough discipline points left
	discipline_points_balance = change_direction == "plus" ?
		0 - ( trainerdata.required.points[wanted_level - 1] -  trainerdata.required.points[current_level - 1] ) :
		trainerdata.required.points[current_level - 1] - trainerdata.required.points[wanted_level - 1];
	current_discipline_points = parseInt($("#t-dpointsleft").text());
	if (	change_direction == "plus" &&
		current_discipline_points + discipline_points_balance < 0 ) {
		return;
	}
	// valid, do the change
	$("#t-dpointsleft").text(current_discipline_points + discipline_points_balance);
	discipline_level.text(wanted_level);
	treepos = $(discipline).parent().parent().parent().attr("treepos");
	// deal with the possible skills changes
	update_tree(treepos);
}

function update_tree(treepos) {
	dpointsleft = parseInt($("#t-dpointsleft").text());
	dpointstotal = parseInt($("#t-dpointstotal").text());
	ppointsleft = parseInt($("#t-ppointsleft").text());
	ppointstotal = parseInt($("#t-ppointstotal").text());
	dlvl = parseInt($("div[treepos=" + treepos +"] .p0 .icon .skilllvl").text());
	maxslvl = trainerdata.required.power[dlvl - 1];

	// XXX maybe there are better selector options to get all values for a tree but ...
	for (i = 1; i <= 10; i++) {
		// if tree has been lowered and the skill is no more available, make it visually disabled
		if (i > trainerdata.required.available[dlvl - 1]) {
			maxslvl = 0;
		}
		// reduce powerpoints when discipline level is lowered
		skilllvl = parseInt($(`div[treepos="${treepos}"] .p${i} .icon .skilllvl`).text());
		if (skilllvl > maxslvl) {
			$("#t-ppointsleft").text(maxslvl);
			$(`div[treepos="${treepos}"] .p${i} .icon .skilllvl`).text(maxslvl);
			// update available power points
			$("#t-ppointsleft").text(ppointsleft + skilllvl - maxslvl);
		}
		if ( 	(currlevel > trainerdata.required.level[dlvl - 1] && i != 1) ||
			(currlevel != maxlevel && treepos == wmrow) ) {
			// reduce strongly brightness and disable buttons on unavailable
			// skills due to player or skill tree level. also forbid WM tree for non level 60.
			$(`div[treepos="${treepos}"] .p${i} .icon`).css('filter','grayscale(1) brightness(.5)');
			$(`div[treepos="${treepos}"] .p${i} .skillspinner .plus`).hide();
			$(`div[treepos="${treepos}"] .p${i} .skillspinner .minus`).hide();
		}
		if ( i <= trainerdata.required.available[dlvl - 1] ) {
			if (treepos == wmrow) {
				// WM tree requires no skills points, just make it fully visible
				$(`div[treepos="${treepos}"] .p${i} .icon`).css('filter','brightness(1)');
			}
			else {
				$(`div[treepos="${treepos}"] .p${i} .icon`).css('filter','brightness(.25)');
			}
			$(`div[treepos="${treepos}"] .p${i} .skillspinner .plus`).show();
			$(`div[treepos="${treepos}"] .p${i} .skillspinner .minus`).show();
		}
		// ensure brightness is kept when a tree level is decreasing
		if ($(`div[treepos="${treepos}"] .p${i} .icon .skilllvl`).text() > 0) {
			$(`div[treepos="${treepos}"] .p${i} .icon`).css('filter','brightness(1)');
		}
	}
	$("#skillinfo").html("");
	return;
}
