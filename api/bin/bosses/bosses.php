<?php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

// The last respawn timestamp in UTC time
// You can update it by looking at your browser console and getting the last
// respawn timestamps. At least yearly, since the get_next_respawns() loop
// will run ~ 80 times/boss after all that time.
// Last checked: Eve: 2025-09-14, Daen: 2025-09-10, TK: 2025-10-01, Server: 2025-09-14 (+37m)
$first_respawns = array(
	"thorkul" => 	1759352531,
	"evendim" => 	1757842340,
	"daen" => 	1757536010,
	"server" => 	1757498400 + 37 * 60
);

/* Test
$first_respawns = array(
	"thorkul" => 	0,
	"evendim" => 	3000,
	"daen" => 	9000,
	"server" => 	12000
);
*/

$next_respawns = [
	"evendim" => [],
	"daen" => [],
	"thorkul" => [],
	"server" => []
];

$previous_respawns = [
	"evendim" => 0,
	"daen" => 0,
	"thorkul" => 0,
	"server" => 0
];

$now = time();

foreach ($first_respawns as $boss => $tried_respawn_ts) {
	if ($boss === "server") {
		$respawn_time = 7 * 24 * 3600; // 1 week
	} else {
		$respawn_time = 109 * 3600; // 109 hours
	}
	while (true) {
		$tried_respawn_ts += $respawn_time;
		if ($tried_respawn_ts >= $now) {
			if ($previous_respawns[$boss] === 0) {
				$previous_respawns[$boss] = $tried_respawn_ts - $respawn_time;
			}
			$next_respawns[$boss][] = $tried_respawn_ts;
			if (count($next_respawns[$boss]) === 3) {
				break;
			}
		}
	}
}

$next_boss = null;
$next_boss_ts = INF;
foreach ($next_respawns as $boss => $spawns) {
	foreach ($spawns as $spawntime) {
		if ($spawntime < $next_boss_ts) {
			$next_boss = $boss;
			$next_boss_ts = $spawntime;
		}
	}
}

$response = [
	"prev_spawns" => $previous_respawns,
	"next_spawns" => $next_respawns,
	"next_boss" => $next_boss,
	"next_boss_ts" => $next_boss_ts
];

echo json_encode($response);
