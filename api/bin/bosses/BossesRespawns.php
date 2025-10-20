<?php

class BossesRespawns {
	// $respawns: number of future respawns to calculate per boss; 3 by
	// default
	public function getSchedule(int $respawns = 3) {
		if ($respawns < 1)
			throw new InvalidArgumentException("\$respawns must be a positive integer!");

		// The first known respawns timestamp in UTC time
		// Last checked: Eve: 2025-10-11, Daen: 2025-10-12, TK: 2025-10-01, Server: 2025-10-12 (+37m)
		$first_respawns = array(
			"thorkul" => 	1759352531,
			"evendim" => 	1760196780,
			"daen" => 	1760282847,
			"server" => 	1759917600 + 37 * 60
		);

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

		// calculate future respawns
		foreach ($first_respawns as $boss => $tried_respawn_ts) {
			if ($boss === "server")
				$respawn_time = 7 * 24 * 3600; // 1 week
			else
				$respawn_time = 109 * 3600; // 109 hours
			while (true) {
				$tried_respawn_ts += $respawn_time;
				if ($tried_respawn_ts >= $now) {
					if ($previous_respawns[$boss] === 0)
						$previous_respawns[$boss] = $tried_respawn_ts - $respawn_time;
					$next_respawns[$boss][] = $tried_respawn_ts;
					if (count($next_respawns[$boss]) === $respawns)
						break;
				}
			}
		}

		// get the next respawn timestamp and name
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

		return [
			"prev_spawns" => $previous_respawns,
			"next_spawns" => $next_respawns,
			"next_boss" => $next_boss,
			"next_boss_ts" => $next_boss_ts
		];
	}
}

?>
