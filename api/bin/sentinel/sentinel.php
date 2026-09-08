<?php

const API_ROOT = __DIR__ . "/../..";

require_once(__DIR__ . "/../lib/eheader.php");
eheader_api("json");

$wz = json_decode(file_get_contents(API_ROOT . "/var/wstatus.json"), true);
$wz = array_intersect_key($wz, array_flip(["forts", "gems"]));

$stats = json_decode(file_get_contents(API_ROOT . "/var/stats.json"), true);
# Get only the max N days part
$stats = $stats[count($stats) - 1];
# And filter so we have only gems and wishes
$stats = array_map(fn($realm) => array_intersect_key($realm, array_flip(["gems", "wishes"])), $stats);

$output = json_encode([
	"wz"		=> $wz,
	"stats"		=> $stats
]);

echo $output;

?>

