<?php
require_once(__DIR__ . "/../lib/eheader.php");
require_once(__DIR__ . "/../lib/multiwriter.php");
eheader_cors();

ignore_user_abort(true);

function wontsavethis($reason, $code = 417) {
	echo "Did not save: " . $reason;
	http_response_code($code);
	exit(1);
}

if (!array_key_exists("setup", $_POST))
	wontsavethis("invalid POST query parameters");

$setup = $_POST["setup"];
$setup_array = explode("+", $setup);
$setup_array_length = count($setup_array);

// check basic validity of the request (HTTP method and length) in the same
// move. Length is 19 fields for mages, 17 for other classes.
if ($setup_array_length != 17 && $setup_array_length != 19)
	wontsavethis("bad length");
// Every field is validated strictly: the setup line is written as is to a
// public file parsed by trainer_stats.php, so any stray character (like a
// newline) would inject extra lines and break the stats generation.
// The "D" modifier matters: without it "$" also matches before a trailing "\n".

// version: must exist as a trainer dataset directory
if (!preg_match("/^\d+\.\d+\.\d+$/D", $setup_array[0]) ||
    !is_dir(__DIR__ . "/../../../data/trainer/" . $setup_array[0]))
	wontsavethis("bad version");
// class
if (!preg_match("/^(knight|barbarian|conjurer|warlock|hunter|marksman)$/D",
	        $setup_array[1]))
		wontsavethis("invalid class");
// mages have 8 trees (19 fields), other classes 7 trees (17 fields)
$is_mage = in_array($setup_array[1], ["conjurer", "warlock"], true);
if ($setup_array_length != ($is_mage ? 19 : 17))
	wontsavethis("bad length for this class");
// level
if (!preg_match("/^\d{1,2}$/D", $setup_array[2]))
	wontsavethis("bad level");
// trees: discipline level followed by 10 skills levels (0 to 5)
for ($i = 3; $i < $setup_array_length; $i += 2) {
	if (!preg_match("/^\d{1,2}$/D", $setup_array[$i]))
		wontsavethis("bad discipline level");
	if (!preg_match("/^[0-5]{10}$/D", $setup_array[$i + 1]))
		wontsavethis("bad skills levels");
}

if (intval($setup_array[2]) < 60)
	wontsavethis("Non level 60 setup", 202);

// Check if the setup has all its points allocated

// define total possible power
$ppoints60 = 85; // default to archer and warrior
if (in_array($setup_array[1], ["conjurer", "warlock"]))
	$ppoints60 = 93;

// Make a grand total of powerpoints
$allocated_points = 0;
for ($i = 4; $i < $setup_array_length; $i += 2) {
	$allocated_points += array_sum(array_map("intval", str_split($setup_array[$i])));
}

if ($allocated_points < $ppoints60)
	wontsavethis("not all powerpoints have been used", 202);

chdir(__DIR__);

$line = implode(" ", $setup_array) . "\n";

// Serialize concurrent submissions: trainer_stats.php reads the setups count
// and rewrites trainerstats.json, so two requests running at the same time
// would overwrite each other's stats. The lock is released when the script
// ends, even if trainer_stats.php calls exit().
// We lock this very script (read-only is enough for flock), so there is no
// lock file to create in api/var, where www-data may only write existing files.
$lock = fopen(__FILE__, "r");
if ($lock === false || !flock($lock, LOCK_EX))
	error_log("submit.php: could not lock, proceeding unlocked");

MultiWriter::append("../../var/trainer_saved_setups.txt", $line);

// update trainer stats
(function() {
	    require_once(__DIR__ . "/trainer_stats.php");
})();

?>

