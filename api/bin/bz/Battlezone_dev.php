<?php

class Battlezone {
	function getSchedule() {
		// BZ cycle: 15 min ON, 15 min OFF
		$cycle_seconds = 30 * 60;
		$on_duration   = 15 * 60;

		$now_ts = time();
		$position = $now_ts % $cycle_seconds; // 0 to 239

		$bz_on = ($position < $on_duration);

		// Compute when current BZ ends (only if ON)
		$bz_ends_at = 0;
		if ($bz_on)
			$bz_ends_at = $now_ts - $position + $on_duration; // end of current ON window

		// Generate next few BZ start/end times (e.g., next 4 sessions)
		$next_bzs_begin = [];
		$next_bzs_end   = [];

		// Find start of next ON block
		$next_on_start = $now_ts - $position + $cycle_seconds;

		// Add next 5 fake BZ sessions
		for ($i = 0; $i < 5; $i++) {
			$start = $next_on_start + $i * $cycle_seconds;
			$end = $start + $on_duration;
			$next_bzs_begin[] = $start;
			$next_bzs_end[] = $end;
		}

		return [
			"bzbegin"  => $next_bzs_begin,
			"bzend"    => $next_bzs_end,
			"bzon"     => $bz_on,
			"bzendsat" => $bz_ends_at
		];
	}
}
