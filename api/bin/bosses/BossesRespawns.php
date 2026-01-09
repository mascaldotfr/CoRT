<?php

class BossesRespawns {
	// $respawns: number of future respawns to calculate per boss; 4 by
	// default. Setting $fake to true generates fake respawns.
	public function getSchedule(int $respawns = 4, bool $fake = false) {
		if ($respawns < 1)
			throw new InvalidArgumentException("\$respawns must be a positive integer!");

		// The first known respawns timestamp in UTC time
		// Last checked: Eve: 2026-01-09, Daen: 2025-12-23, TK: 2026-01-04, Server: 2025-10-30 (+37m)
		$first_respawns = array(
			"thorkul" => 	1766389918,
			"evendim" => 	1767977037,
			"daen" => 	1766476880,
			"server" => 	1762336800 + 37 * 60
		);

		// Bosses drift by spawn, in seconds.
		$respawns_drift = array(
			"thorkul" =>	3,
			"evendim" =>	7,
			"daen"    =>	5
		);

		if ($fake) {
			$first_respawns = array(
				"evendim" => 	0,
				"daen" => 	1380,
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
		// else 61 hours
		$respawn_offset = $fake ? .5 : 61;
		foreach ($first_respawns as $boss => $tried_respawn_ts) {
			if ($boss === "server")
				$respawn_time = 7 * 24 * 3600; // 1 week
			else
				$respawn_time = $respawn_offset * 3600 + $respawns_drift[$boss];

			// Elapsed time from now since the first respawn
			$elapsed = $now - $first_respawns[$boss];
			// Compute how many respawns there have been since then
			$old_respawns = intval($elapsed / $respawn_time);
			// Get the last respawn timestamp
			$previous_respawns[$boss] = $first_respawns[$boss] + $old_respawns * $respawn_time;
			// Then generate future respawns
			for ($i = 1; $i <= $respawns; $i++)
				$next_respawns[$boss][] = $previous_respawns[$boss] + $i * $respawn_time;
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
