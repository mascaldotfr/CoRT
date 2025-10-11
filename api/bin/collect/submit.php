<?php
header("Access-Control-Allow-Origin: https://mascaldotfr.github.io");
header("Access-Control-Allow-Methods: POST");
function wontsavethis($reason) {
	header("HTTP/1.0 417 Expectation Failed");
	error_log("Failed to save: " . $reason);
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
//check loosely if the setup is valid
for ($i = 2; $i < $setup_array_length; $i++) {
	// player level: 2, skill level: 1||2, skilltree: 10
	if (!preg_match("/^(\d{1}|\d{2}|\d{10})$/", $setup_array[$i])) {
		wontsavethis("number regexp did not match");
	}
}

chdir(__DIR__);
file_put_contents("../../var/trainer_saved_setups.txt", implode(" ", $setup_array) . "\n", FILE_APPEND | LOCK_EX);
$gz = gzopen("../../var/trainer_saved_setups.txt.gz","w2");
gzwrite($gz, file_get_contents("../../var/trainer_saved_setups.txt"));
gzclose($gz);
?>

