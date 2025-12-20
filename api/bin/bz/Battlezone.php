<?php

class Battlezone {
	function getSchedule() {
		// BZ beginning and ending time
		// SUNDAY = 0, SATURDAY = 6 — ALL TIMES ARE UTC
		$bz_begin = [
			[13, 18],        // Sunday
			[3, 13, 20],     // Monday
			[13, 18],        // Tuesday
			[13, 20],        // Wednesday
			[3, 13, 18],     // Thursday
			[13, 20],        // Friday
			[3, 13, 20]      // Saturday
		];

		$bz_end = [
			[16, 21],        // Sunday
			[6, 16, 23],     // Monday
			[16, 21],        // Tuesday
			[16, 23],        // Wednesday
			[6, 16, 21],     // Thursday
			[17, 23],        // Friday
			[6, 16, 23]      // Saturday
		];

		$next_bzs_begin = [];
		$next_bzs_end = [];
		$bz_on = false;
		$bz_ends_at = 0;

		// Get current UTC time
		$now = new DateTime('now', new DateTimeZone('UTC'));
		$current_day = (int)$now->format('w'); // PHP: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
		$current_hour = (int)$now->format('G'); // 24-hour format (0–23)
		$tomorrow = $current_day === 6 ? 0 : $current_day + 1;

		// get current bz status
		for ($hour = 0; $hour < count($bz_begin[$current_day]); $hour++) {
			if ($current_hour >= $bz_begin[$current_day][$hour] &&
				$current_hour < $bz_end[$current_day][$hour]) {
				$bz_on = true;
				// Clone current time and set to end hour of current BZ
				$ends_at = clone $now;
				$ends_at->setTime($bz_end[$current_day][$hour], 0, 0);
				$bz_ends_at = $ends_at->getTimestamp();
				break;
			}
		}

		// compute future bzs
		$check_bzs_days = [$current_day, $tomorrow];
		$day_offset = 0;

		// Ensure there will be BZs for 2 days when announcing the last BZ of the day
		if ($current_hour >= $bz_begin[$current_day][count($bz_begin[$current_day]) - 1]) {
			$day_after_tomorrow = $tomorrow === 6 ? 0 : $tomorrow + 1;
			$check_bzs_days = [$tomorrow, $day_after_tomorrow];
			$day_offset = 1; // skip today
		}

		foreach ($check_bzs_days as $day) {
			for ($hour = 0; $hour < count($bz_begin[$day]); $hour++) {
				// skip passed BZ of the day
				if ($day == $current_day && $bz_begin[$day][$hour] <= $current_hour) {
					continue;
				}
				// Create a DateTime for the target day (today or future)
				$time_holder = clone $now;
				$time_holder->modify("+$day_offset days");
				$time_holder->setTime($bz_begin[$day][$hour], 0, 0);
				$next_bzs_begin[] = $time_holder->getTimestamp();

				$time_holder_end = clone $now;
				$time_holder_end->modify("+$day_offset days");
				$time_holder_end->setTime($bz_end[$day][$hour], 0, 0);
				$next_bzs_end[] = $time_holder_end->getTimestamp();
			}
			$day_offset++;
		}

		return [
			"bzbegin" => 	$next_bzs_begin,
			"bzend" => 	$next_bzs_end,
			"bzon" => 	$bz_on,
			"bzendsat" => 	$bz_ends_at,
			"schbegin" => 	$bz_begin,
			"schend" =>	$bz_end
		];
	}
}

?>

