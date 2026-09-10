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
// version
if (!preg_match("/^\d+\.\d+\.\d+$/", $setup_array[0]))
	wontsavethis("bad version");
// class
if (!preg_match("/^(knight|barbarian|conjurer|warlock|hunter|marksman)$/", 
	        $setup_array[1]))
		wontsavethis("invalid class");

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

MultiWriter::append("../../var/trainer_saved_setups.txt", $line);

// update trainer stats
(function() {
	    require_once(__DIR__ . "/trainer_stats.php");
})();

?>

