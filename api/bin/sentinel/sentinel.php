<?php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

const API_ROOT = "../..";

require_once API_ROOT . "/bin/bosses/BossesRespawns.php";
require_once API_ROOT . "/bin/bz/Battlezone.php";


$bosses = new BossesRespawns();
$bosses_respawns = $bosses->getSchedule(1);
$bosses_respawns = array_intersect_key($bosses_respawns, array_flip(["next_boss", "next_boss_ts"]));

$bz = new Battlezone();
$bz_schedule = $bz->getSchedule();

$wz = json_decode(file_get_contents(API_ROOT . "/var/warstatus.json"), true);
$wz = array_intersect_key($wz, array_flip(["forts", "gems"]));

$stats = json_decode(file_get_contents(API_ROOT . "/var/statistics.json"), true);
# Get only the max N days part
$stats = $stats[count($stats) - 1];
# And filter so we have only gems and wishes
$stats = array_map(fn($realm) => array_intersect_key($realm, array_flip(["gems", "wishes"])), $stats);

$output = json_encode([
	"bosses" 	=> $bosses_respawns,
	"bz" 		=> $bz_schedule,
	"wz"		=> $wz,
	"stats"		=> $stats
]);

echo $output;

?>

