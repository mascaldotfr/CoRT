<?php
require_once(__DIR__ . "/../lib/eheader.php");
eheader_api("json");

chdir(__DIR__);

// data file location and content
$data_file = "../../var/trainer_saved_setups.txt";
// trainer data location and content
$trainer_datadir = "../../../data/trainer";
$trainer_data = [];
// output directory and base filename (a .gz will be added for the compressed version)
$output_file = "../../var/trainerstats.json";
// END of setup

// Check if output file exists and is less than 3 hours old
// Redirect to the cached page if that's the case
if (filesize($output_file) != 0 && file_exists($output_file) && (time() - filemtime($output_file)) < 3 * 3600) {
    readfile($output_file);
    exit();
}


// Ensure completion if client close the connection
ignore_user_abort(true);

// some constants taken from the js trainer
$constants = [
	"class_type_masks" => [
		"hunter" => 0x11,
		"marksman" => 0x12,
		"conjurer" => 0x21,
		"warlock" => 0x22,
		"barbarian" => 0x41,
		"knight" => 0x42
	],
	"maxlevel" => 60,
	"classes" => ["knight", "barbarian", "conjurer", "warlock", "hunter", "marksman"]
];
// dict output for API
$api_dict = [];
// full output file
// trainer "db" content
$data = file($data_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);


// Preload the existing stats
if (file_exists($output_file)) {
	$prev_json_content = file_get_contents($output_file);
	$api_dict = json_decode($prev_json_content, true);
	$lineno = $api_dict["lineno"] ?? 0;
	if ($lineno != 0 && $lineno == count($data)) {
		readfile($output_file);
		exit(); // Quit if there is no new setup
	}
	$api_dict["lineno"] = count($data);
	$data = array_slice($data, $lineno);
}
else {
	// It's most likely to fail since deplying it mention creating empty
	// files.
	$api_dict["lineno"] = count($data);
}



// Load the trainerdata sets
// get all trainer versions but < 1.33.6 (there was no data collection back
// then, 2 first versions)
$versions = [];
$dirs = scandir($trainer_datadir);
foreach ($dirs as $dir) {
	if ($dir === '.' || $dir === '..') continue;
	$fullPath = $trainer_datadir . '/' . $dir;
	if (is_dir($fullPath) && strpos($dir, 'beta') === false)
		$versions[] = $dir;
}

// Sort versions by semantic versioning (assuming only numeric parts separated by dots)
usort($versions, function($a, $b) {
	$aParts = array_map('intval', explode('.', $a));
	$bParts = array_map('intval', explode('.', $b));
	foreach ($aParts as $i => $part) {
		if (!isset($bParts[$i])) return 1;
		if ($part != $bParts[$i]) return $part <=> $bParts[$i];
	}
	return count($aParts) <=> count($bParts);
});
// Skip first two versions
$versions = array_slice($versions, 2);

// then get all trainer datasets
foreach ($versions as $v) {
	$trainerdatafile = $trainer_datadir . '/' . $v . '/trainerdata.json';
	$content = file_get_contents($trainerdatafile);
	$json = json_decode($content, true);
	$trainer_data[$v] = $json;
}

// prefill stats array
foreach ($versions as $version) {
	// Leave if there are already stats for that version
	if (isset($api_dict[$version]))
		continue;
	$api_dict[$version] = [];
	foreach ($constants["classes"] as $clas)
		$api_dict[$version][$clas] = [];
}

// Time to compute things
foreach ($data as $line) {
	$line = trim($line);
	if ($line === '') continue;
	$setup = explode(" ", $line);
	$version = array_shift($setup);
	$clas = array_shift($setup);
	$level = (int)array_shift($setup);

	// skip the few versions when setup collection wasn't a thing
	if (!in_array($version, $versions, true))
		continue;
	// skip empty setups, non lvl 60, and incomplete ones
	if ($level < $constants["maxlevel"])
		continue;
	else
		$level = $constants["maxlevel"]; // lvl 61 is raptor gem

	// at least if all powerpoints are used ...
	$checksum = 0; // total power points used
	for ($i = 1; $i < count($setup); $i += 2) {
		// sum of all powerpoints used for all skill in the current tree
		$ppsum = array_sum(array_map('intval', str_split($setup[$i])));
		$checksum += $ppsum;
	}
	// see trainer.js (determine if mage or the rest when it comes to pp)
	$powerpoints = "32";
	if (($constants["class_type_masks"][$clas] & 0xF0) != 32)
		$powerpoints = "80";
	$ppoints = $trainer_data[$version]["points"]["power"][$powerpoints][$level - 1];
	if ($checksum != $ppoints)
		continue; // incomplete

	$base_skills = strval($constants["class_type_masks"][$clas] & 0xF0);
	$class_skills = strval($constants["class_type_masks"][$clas]);
	$alltrees = $trainer_data[$version]["class_disciplines"][$base_skills];
	$alltrees = array_merge($alltrees, $trainer_data[$version]["class_disciplines"][$class_skills]);

	// Parse everything and gather necessary info
	foreach ($alltrees as $tree) {
		$disc_points = (int)array_shift($setup);
		$spell_points_str = array_shift($setup);
		$spell_points = str_split($spell_points_str);
		$counter = 0;

		$disciplineSpells = $trainer_data[$version]["disciplines"][$tree]["spells"];
		foreach ($disciplineSpells as $spell) {
			$counter++;
			$points_char = array_shift($spell_points);
			$points = (int)$points_char;
			$currspell = $spell["name"];

			if (substr($tree, -2) === "WM") {
				if (str_starts_with($currspell, "undefined"))
					continue;  // skip unused WM slots
				// Determine if the power is available
				if ($counter * 2 - 1 <= $disc_points)
					$points = 5;
			}

			if (!isset($api_dict[$version][$clas][$currspell]))
				$api_dict[$version][$clas][$currspell] = [
					"frequency" => [0, 0, 0, 0, 0, 0]
				];

			// One more user of this spell at this level
			$api_dict[$version][$clas][$currspell]["frequency"][$points]++;
		}
	}
}

// Do global maths
foreach ($versions as $version) {
	foreach ($constants["classes"] as $clas) {
		foreach ($api_dict[$version][$clas] as $spell => $spellData) {
			$freq = $spellData["frequency"];
			$freqsum = array_sum($freq);
			if ($freqsum == 0) {
				$percentage = 0.0;
			}
			else {
				$notusing = $freq[0];
				$percentage = 100 - ($notusing * 100) / $freqsum;
			}
			$api_dict[$version][$clas][$spell]["percentage"] = sprintf("%.2f", $percentage);
		}
	}
}

// Time to write our stats!
$api_json = json_encode($api_dict);
file_put_contents($output_file, $api_json);

// Meanwhile output the same json so we don't redirect
echo $api_json;

// Write gzipped version
$gzFile = $output_file . '.gz';
$gz = gzopen($gzFile, 'w2');
gzwrite($gz, $api_json);
gzclose($gz);

?>
