<?php

class BossesRespawns {
	// $respawns: number of future respawns to calculate per boss; 3 by
	// default. Setting $fake to true generates fake respawns.
	public function getSchedule(int $respawns = 3, bool $fake = false) {
		if ($respawns < 1)
			throw new InvalidArgumentException("\$respawns must be a positive integer!");

		// The first known respawns timestamp in UTC time
		// Last checked: Eve: 2025-10-29, Daen: 2025-10-30, TK: 2025-10-01, Server: 2025-10-30 (+37m)
		$first_respawns = array(
			"thorkul" => 	1759352531,
			"evendim" => 	1761766409,
			"daen" => 	1761852467,
			"server" => 	1761732000 + 37 * 60
		);

		if ($fake) {
			$first_respawns = array(
				"evendim" => 	900,
				"daen" => 	1800,
			);
		}

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
		// let standard bosses respawn every 30 minutes if we want fake respawns
		$respawn_offset = $fake ? .5 : 109;
		foreach ($first_respawns as $boss => $tried_respawn_ts) {
			if ($boss === "server")
				$respawn_time = 7 * 24 * 3600; // 1 week
			else
				$respawn_time = $respawn_offset * 3600; // 109 hours
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
