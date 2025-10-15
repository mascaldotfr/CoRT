<?php

// It's a cli script, don't let it be called from a browser
if (php_sapi_name() !== 'cli') {
	http_response_code(403);
	die();
}

function statistics($events, $db_file, $force_rewrite = false) {
	$conn = null;
	try {
		$conn = new PDO("sqlite:$db_file");
		$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
	} catch (Exception $e) {
		eprint("Failed to create a database connection to", $db_file, ":", $e->getMessage());
		exit(1);
	}

	// You don't need more indexes than date. Later we're creating a
	// temporary table containing only the needed rows; ~4k rows/month
	// which is very very small for any database system.
	$db_schema = "
		CREATE TABLE IF NOT EXISTS events (
			date INTEGER NOT NULL,
			name TEXT NOT NULL,
			location TEXT NOT NULL,
			owner TEXT NOT NULL,
			type TEXT NOT NULL
		);
		CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
	";
	try {
		$conn->exec($db_schema);
	} catch (Exception $e) {
		eprint("Failed to create db: ", $e->getMessage());
		exit(1);
	}

	// Get the latest recorded event in database
	$insert_queries = [];
	$stmt = $conn->query("SELECT MAX(date) FROM events LIMIT 1;");
	$row = $stmt->fetch(PDO::FETCH_NUM);
	$latest_recorded_event = $row[0] ?? 0;

	// Prepare data from warstatus.php for insertion into the DB
	foreach ($events as $event) {
		if ($event["date"] <= $latest_recorded_event) {
			continue;
		}
		// Remove fort numbers
		$parts = explode(' ', $event["name"]);
		if (count($parts) > 1) {
			array_pop($parts);
			$event["name"] = implode(' ', $parts);
		}
		$insert_queries[] = [$event["date"], $event["name"], $event["location"],
			$event["owner"], $event["type"]];
	}

	# Nothing to do, exit
	if (count($insert_queries) == 0 && !$force_rewrite) {
		exit;
	}

	$stmt = $conn->prepare("INSERT INTO events VALUES(?, ?, ?, ?, ?)");
	foreach ($insert_queries as $params) {
		$stmt->bindValue(1, $params[0], PDO::PARAM_INT);
		$stmt->bindValue(2, $params[1], PDO::PARAM_STR);
		$stmt->bindValue(3, $params[2], PDO::PARAM_STR);
		$stmt->bindValue(4, $params[3], PDO::PARAM_STR);
		$stmt->bindValue(5, $params[4], PDO::PARAM_STR);
		$stmt->execute();
	}

	$start_time = microtime(true);
	$now = new DateTime();
	$days = [7, 30, 90];

	// Optimise queries by using only the needed subsets of the table
	$report_mints = $now->getTimestamp() - (max($days) * 24 * 3600);
	$conn->exec("CREATE TEMPORARY TABLE report AS
		SELECT * FROM events WHERE date >= $report_mints;");
	$conn->exec("CREATE TEMPORARY TABLE reportforts AS
		SELECT * FROM report WHERE type = 'fort';");
	$conn->exec("CREATE TEMPORARY TABLE reportwalls AS
		SELECT * FROM reportforts WHERE name LIKE 'Great Wall of %';");
	$conn->exec("CREATE TEMPORARY TABLE reportgems AS
		SELECT * FROM report WHERE type = 'gem' AND location != owner;");

	$full_report = [["generated" => $now->getTimestamp()]];
	foreach ($days as $day) {
		$seconds_ago = $now->getTimestamp() - ($day * 24 * 3600);
		$reporter = new Reporter($conn, $seconds_ago);
		$full_report[] = $reporter->generate_stats();
		if ($day === max($days)) {
			$full_report[0]["activity"] = $reporter->get_activity();
			$full_report[0]["invasions"] = $reporter->get_invasions();
			$full_report[0]["gems"] = $reporter->get_gems();
			$full_report[0]["wishes"] = $reporter->get_wishes();
			$full_report[0]["fortsheld"] = $reporter->get_fortsheld();
			foreach (["Alsius", "Ignis", "Syrtis"] as $realm) {
				// No wish the last 90 days?
				if ($full_report[count($full_report)-1][$realm]["wishes"]["last"] === null) {
					$full_report[count($full_report)-1][$realm]["wishes"]["last"] = $reporter->get_last_wish_further($realm);
				}
			}
		}
	}
	$end_time = microtime(true);
	$full_report[0]["generation_time"] = $end_time - $start_time;

	return [json_encode($full_report), json_encode($reporter->dump_events())];
}

class Reporter {
	private $conn;
	private $sql;
	private $startfrom;
	private $stats;
	private $sample_days;

	public function __construct($conn, $lastxseconds) {
		$this->conn = $conn;
		$this->sql = $conn;
		$this->startfrom = $lastxseconds;
		$this->stats = ["Alsius" => [], "Ignis" => [], "Syrtis" => []];
		$this->sample_days = null;
	}

	private function get_oldest_event() {
		// Ensure proper average value if we've less than $this->startfrom days of data
		$result = $this->sql->query("SELECT (strftime('%s','now') - MIN(date)) / (24 * 3600) AS days
			FROM report
			WHERE date >= {$this->startfrom};");
		$row = $result->fetch(PDO::FETCH_ASSOC);
		$this->sample_days = $row["days"];
		if ($this->sample_days == 0) { // Ensure 1st run is ok
			$this->sample_days = 1;
		}
	}

	// Get forts activity per hour
	public function get_activity() {
		$activity = ["Alsius" => array_fill(0, 24, 0), "Ignis" => array_fill(0, 24, 0), "Syrtis" => array_fill(0, 24, 0)];
		if ($this->sample_days === null) {
			$this->get_oldest_event();
		}

		$queries = [
			["!=", ""],
			["=", "0 -"]
		];

		foreach ($queries as $param) {
			$condition = $param[0];
			$sign = $param[1];
			$sql = "SELECT owner, strftime('%H', datetime(date, 'unixepoch')) AS time,
				$sign CAST(COUNT(rowid) AS REAL) / {$this->sample_days} AS average
				FROM reportforts
				WHERE owner $condition location
				GROUP BY owner, time
				ORDER BY time;";
			$result = $this->sql->query($sql);
			while ($r = $result->fetch(PDO::FETCH_ASSOC)) {
				if ($r["average"] !== null) {
					$activity[$r["owner"]][intval($r["time"])] += floatval($r["average"]);
				}
			}
		}

		return $activity;
	}

	// get invasions per hour
	public function get_invasions() {
		$invasions = ["Alsius" => array_fill(0, 24, 0), "Ignis" => array_fill(0, 24, 0), "Syrtis" => array_fill(0, 24, 0)];
		if ($this->sample_days === null) {
			$this->get_oldest_event();
		}

		$queries = [
			["!=", ""],
			["=", "0 -"]
		];

		foreach ($queries as $param) {
			$condition = $param[0];
			$sign = $param[1];
			$sql = "SELECT owner, strftime('%H', datetime(date, 'unixepoch')) AS time,
				$sign CAST(COUNT(rowid) AS REAL) / {$this->sample_days} AS average
				FROM reportwalls
				WHERE owner $condition location
				GROUP BY owner, time
				ORDER BY time;";
			$result = $this->sql->query($sql);
			while ($r = $result->fetch(PDO::FETCH_ASSOC)) {
				if ($r["average"] !== null) {
					$invasions[$r["owner"]][intval($r["time"])] += floatval($r["average"]);
				}
			}
		}

		return $invasions;
	}

	// Get gem steals per hour
	public function get_gems() {
		$gems = ["Alsius" => array_fill(0, 24, 0), "Ignis" => array_fill(0, 24, 0), "Syrtis" => array_fill(0, 24, 0)];
		$result = $this->sql->query("SELECT owner, strftime('%H', datetime(date, 'unixepoch')) AS time,
			COUNT(rowid) AS count
			FROM reportgems
			GROUP BY owner, time;");
		while ($r = $result->fetch(PDO::FETCH_ASSOC)) {
			$gems[$r["owner"]][intval($r["time"])] = intval($r["count"]);
		}

		return $gems;
	}

	public function get_wishes() {
		$wishes = ["Alsius" => array_fill(0, 24, 0), "Ignis" => array_fill(0, 24, 0), "Syrtis" => array_fill(0, 24, 0)];
		$result = $this->sql->query("SELECT location, strftime('%H', datetime(date, 'unixepoch')) AS time,
			COUNT(rowid) AS count
			FROM report
			WHERE type='wish'
			GROUP BY location, time;");
		while ($r = $result->fetch(PDO::FETCH_ASSOC)) {
			$wishes[$r["location"]][intval($r["time"])] = intval($r["count"]);
		}

		return $wishes;
	}

	// In case a realm didn't make a wish even for the longest report,
	// search a wish even further
	public function get_last_wish_further($realm) {
		$stmt = $this->sql->prepare("SELECT location, date
			FROM events
			WHERE type='wish'
			AND location = :realm
			ORDER BY date DESC LIMIT 1");
		$stmt->bindValue(':realm', $realm, PDO::PARAM_STR);
		$result = $stmt->execute();
		$r = $result->fetch(PDO::FETCH_ASSOC);
		if ($r === false) {
			return null;
		}
		return $r["date"];
	}

	public function get_fortsheld() {
		$forts_held = [
			"Aggersborg" => [], "Trelleborg" => [], "Imperia" => [],
			"Samal" => [], "Menirah" => [], "Shaanarid" => [],
			"Herbred" => [], "Algaros" => [], "Eferias" => []
		];
		$total_forts = ["Alsius" => 0, "Ignis" => 0, "Syrtis" => 0];
		$average_forts = ["Alsius" => [], "Ignis" => [], "Syrtis" => []];
		$count_forts = ["Alsius" => [], "Ignis" => [], "Syrtis" => []];

		foreach (array_keys($forts_held) as $fort) {
			// Prepopulate for the 1st run
			foreach (["Alsius", "Ignis", "Syrtis"] as $realm) {
				$forts_held[$fort][$realm] = ["time" => 0, "count" => 0];
			}

			// We get all events for a given fort
			// Ironically it's more efficient to do 12 queries than a single one and let PHP
			// split things
			$search_names = ["Fort $fort", "$fort Castle"];
			$name_clause = implode(" OR name = ", array_map(fn($n) => "'$n'", $search_names));
			$sql = "SELECT date, owner, location
				FROM reportforts
				WHERE name = $name_clause
				ORDER BY date ASC;";
			$result = $this->sql->query($sql);
			$events = [];
			while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
				$events[] = $row;
			}

			// For every event at this fort, find the next one, compute
			// the duration between each events and add it to the
			// realm's occupation time
			for ($i = 0; $i < count($events) - 1; $i++) {
				$ev = $events[$i];
				$nextev = $events[$i + 1];
				$timediff = ($nextev["date"] - $ev["date"]) / 60;
				$whoheld = $ev["owner"];
				$forts_held[$fort][$whoheld]["time"] += $timediff;
				$forts_held[$fort][$whoheld]["count"]++;
				$forts_held[$fort][$whoheld]["location"] = $ev["location"];
			}

			foreach (["Alsius", "Ignis", "Syrtis"] as $realm) {
				// compute the average holding time
				if ($forts_held[$fort][$realm]["count"] != 0) {
					$average = intval($forts_held[$fort][$realm]["time"] / $forts_held[$fort][$realm]["count"]);
					$forts_held[$fort][$realm]["average"] = $average;
				}
				else {
					// ensure the first run is ok
					$forts_held[$fort][$realm]["average"] = 0;
				}
				// add total and average occupation time to the statistics
				$average_forts[$realm][] = $forts_held[$fort][$realm]["average"];
				$total_forts[$realm] += intval($forts_held[$fort][$realm]["time"] / 60);
				// compute the fort capture count
				$count = 0;
				if (isset($forts_held[$fort][$realm]["location"]) &&
					$realm !== $forts_held[$fort][$realm]["location"]) {
					$count = $forts_held[$fort][$realm]["count"];
				}
				$count_forts[$realm][] = $count;
			}
		}

		return ["average" => $average_forts, "total" => $total_forts, "count" => $count_forts];
	}

	// generate_stats() deals with the tabular data you see in the page, and
	// initializes the API stats array for a given period (7, 30 or 90 days)
	public function generate_stats() {
		// Eferias set as default to ensure proper first time run
		foreach (["Alsius", "Ignis", "Syrtis"] as $realm) {
			$this->stats[$realm] = [
				"forts" => [
					"total" => 0,
					"recovered" => 0,
					"captured" => 0,
					"most_captured" => [
						"name" => "Eferias Castle",
						"count" => 0
					]
				],
				"invasions" => [
					"invaded" => [
						"count" => 0
					],
					"last" => [
						"location" => null,
						"date" => null
					]
				],
				"gems" => [
					"stolen" => [
						"last" => null,
						"count" => 0
					]
				],
				"wishes" => [
					"count" => 0,
					"last" => null
				]
			];
		}

		// Check captured and recovered forts
		$conditions = [
			["captured", "!="],
			["recovered", "="]
		];
		foreach ($conditions as $param) {
			$field = $param[0];
			$cond = $param[1];
			$sql = "SELECT owner AS realm, COUNT(rowid) AS count
				FROM reportforts
				WHERE owner $cond location
				AND date >= {$this->startfrom}
				GROUP BY owner;";
			$result = $this->sql->query($sql);
			while ($r = $result->fetch(PDO::FETCH_ASSOC)) {
				$this->stats[$r["realm"]]["forts"][$field] = intval($r["count"]);
			}
		}

		// Add captured and recovered forts to get the "total captured forts" value
		foreach (["Alsius", "Ignis", "Syrtis"] as $realm) {
			$this->stats[$realm]["forts"]["total"] =
				$this->stats[$realm]["forts"]["captured"] + $this->stats[$realm]["forts"]["recovered"];
		}

		// Find the most captured fort
		$result = $this->sql->query("SELECT owner AS realm, name, COUNT(name) AS count
			FROM reportforts
			WHERE owner != location
			AND date >= {$this->startfrom}
			GROUP BY owner, name
			ORDER BY count DESC;");
		$processed_realms = [];
		while ($r = $result->fetch(PDO::FETCH_ASSOC)) {
			if (in_array($r["realm"], $processed_realms)) continue;
			$this->stats[$r["realm"]]["forts"]["most_captured"]["name"] = $r["name"];
			$this->stats[$r["realm"]]["forts"]["most_captured"]["count"] = intval($r["count"]);
			$processed_realms[] = $r["realm"];
		}

		// Find the last invasion
		$result = $this->sql->query("SELECT owner AS realm, location, MAX(date) AS date, COUNT(name) AS count
			FROM reportwalls
			WHERE owner != location
			AND date >= {$this->startfrom}
			GROUP BY owner;");
		while ($r = $result->fetch(PDO::FETCH_ASSOC)) {
			$this->stats[$r["realm"]]["invasions"]["last"]["location"] = $r["location"];
			$this->stats[$r["realm"]]["invasions"]["last"]["date"] = $r["date"];
			$this->stats[$r["realm"]]["invasions"]["count"] = intval($r["count"]);
		}

		// Find the invasion count
		$result = $this->sql->query("SELECT owner AS realm, COUNT(name) AS count
			FROM reportwalls
			WHERE owner = location
			AND date >= {$this->startfrom}
			GROUP BY location;");
		while ($r = $result->fetch(PDO::FETCH_ASSOC)) {
			$this->stats[$r["realm"]]["invasions"]["invaded"]["count"] = intval($r["count"]);
		}

		// Get the last gem stolen time, and total count of stolen gems
		$result = $this->sql->query("SELECT owner AS realm, MAX(date) AS date, COUNT(date) AS count
			FROM reportgems
			WHERE date >= {$this->startfrom}
			GROUP BY owner;");
		while ($r = $result->fetch(PDO::FETCH_ASSOC)) {
			$this->stats[$r["realm"]]["gems"]["stolen"]["last"] = $r["date"];
			$this->stats[$r["realm"]]["gems"]["stolen"]["count"] = intval($r["count"]);
		}

		// Get the last dragon wish, and the total number of wishes
		$result = $this->sql->query("SELECT location AS realm, COUNT(rowid) AS count,
			MAX(date) AS date
			FROM report
			WHERE type = 'wish'
			AND date >= {$this->startfrom}
			GROUP BY location;");
		while ($r = $result->fetch(PDO::FETCH_ASSOC)) {
			$this->stats[$r["realm"]]["wishes"]["last"] = $r["date"];
			$this->stats[$r["realm"]]["wishes"]["count"] = intval($r["count"]);
		}

		return $this->stats;
	}

	// Dump all events (that one is for wevents.html)
	public function dump_events() {
		$result = $this->sql->query("SELECT *
			FROM report
			WHERE date > strftime('%s','now') - 14 * 24 * 3600
			ORDER BY date DESC");
		$output = [["generated" => (new DateTime())->getTimestamp()]];
		while ($r = $result->fetch(PDO::FETCH_ASSOC)) {
			$output[] = $r;
		}
		return $output;
	}
}
?>
