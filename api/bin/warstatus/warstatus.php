<?php

// It's a cli script, don't let it be called from a browser
if (php_sapi_name() !== 'cli') {
	http_response_code(403);
	die();
}

require_once __DIR__ . '/../../../vendor/autoload.php';

use PHPHtmlParser\Dom;

chdir(__DIR__);

// File where to dump the status, relative to this script
$outfile = "../../var/warstatus.json";
$stats_db_file = "../../var/events.sqlite";
$stats_outfile = "../../var/statistics.json";
$stats_outfile_events = "../../var/allevents.json";
$base_url = "https://www.championsofregnum.com/";
// Use True to allow unconditional successful runtime for debugging
// It propagates to statistics() as well
$debug_mode = false;

function eprint(...$args) {
	fwrite(STDERR, implode(" ", array_map('strval', $args)) . PHP_EOL);
}

// return just the filename part of the url
function filename($url) {
	$parts = explode('/', $url);
	return end($parts);
}

function main() {
	global $outfile, $stats_db_file, $stats_outfile, $stats_outfile_events, $base_url, $debug_mode;

	try {
		$context = stream_context_create(['http' => ['timeout' => 10]]);
		$upstream_html = file_get_contents($base_url . "/index.php?l=1&sec=3", false, $context);
		if ($upstream_html === false) {
			throw new Exception("file_get_contents failed");
		}
	} catch (Exception $e) {
		eprint("Failed to fetch the page ! " . $e->getMessage() . "\n" . $e->getTraceAsString());
		exit(1);
	}

	$failure = [];
	$status = ["forts" => [], "gems" => []];
	$status["relics"] = [
		"Alsius" => [ "Imperia" => null, "Aggersborg" => null, "Trelleborg" => null ],
		"Ignis" => [ "Shaanarid" => null, "Samal" => null, "Menirah" => null ],
		"Syrtis" => [ "Eferias" => null, "Herbred" => null, "Algaros" => null ]
	];
	$realms = ["Alsius", "Ignis", "Syrtis"]; // in site order for forts
	$realms_gem = ["Ignis", "Alsius", "Syrtis"]; // in site order for gems images (gem_X.png)
	$forts_names = [];
	$forts_icons = [];

	$dom = new Dom();
	$dom->loadStr($upstream_html);

	$headers = $dom->find('.war-status-realm');
	$i = 0;
	foreach ($headers as $realm) {
		foreach ($realm->find('img') as $gem) {
			$status["gems"][] = filename($gem->getAttribute('src'));
		}
		$next = $realm->nextSibling();
		if ($next) {
			$next2 = $next->nextSibling();
			if ($next2) {
				foreach ($next2->find('img') as $relic) {
					$relic_name = explode(" relic", $relic->getAttribute('title'))[0];
					$status["relics"][$realms[$i]][$relic_name] = filename($relic->getAttribute('src'));
				}
			}
		}
		$i++;
	}
	// We don't care about relics failing as they're not important
	if (count($status["gems"]) != 18) {
		$failure["gems"] = 'Fetching gems failed: ' . json_encode($status["gems"]);
	}

	$icons = $dom->find('.war-status-bulding-icons');
	foreach ($icons as $icon_block) {
		foreach ($icon_block->find('img') as $icon) {
			$forts_icons[] = filename($icon->getAttribute('src'));
		}
	}

	$names = $dom->find('.war-status-bulding-name');
	foreach ($names as $name) {
		$forts_names[] = $name->text;
	}

	$i = 0;
	foreach ($forts_names as $item) {
		$owner = basename($forts_icons[$i]);
		$owner = str_replace("keep_", "", $owner);
		$owner = str_replace(".gif", "", $owner);
		$owner = ucfirst($owner);
		if (!in_array($owner, $realms)) {
			$failure["forts"] = "Bad fort input: names => " . json_encode($forts_names) . " icons => " . json_encode($forts_icons);
		}
		$location = $realms[intval($i / 4)];
		$status["forts"][] = [ "name" => $forts_names[$i], "location" => $location,
			"owner" => $owner, "icon" => $forts_icons[$i] ];
		$i++;
	}

	// Keeping the official map just in case
	// $warmap = $dom->find('#war_map-box-content', 0);

	// XXX EVENTS XXX

	$status["map_changed"] = false;
	$status["gems_changed"] = false;
	$status["relics_changed"] = false;
	$old_status = [];
	$events_log = [];
	$timestamp = intval(gmdate('U'));

	if (file_exists($outfile)) {
		$old_status = json_decode(file_get_contents($outfile), true);
		if (isset($old_status["events_log"])) {
			$events_log = $old_status["events_log"];
		}
	}

	// Fetching the data from NGE's website failed in a way or another. Bail out.
	if (count($failure) != 0) {
		eprint("Parsing failure: " . json_encode($failure));
		if (isset($failure["forts"]) && isset($failure["gems"])) {
			$status = $old_status;
			$status["failed"] = ["status" => "fatal", "debug" => json_encode($failure)];
			writer(json_encode($status), $outfile);
			if (!$debug_mode) {
				exit(1);
			}
		} elseif (!isset($failure["forts"])) {
			// At least display forts, as they're mostly always available
			$status["failed"] = ["status" => "partial", "debug" => json_encode($failure)];
		}
	}

	// Forts events
	$i = 0;
	foreach ($status["forts"] as $fort) {
		if (!isset($old_status["forts"]) || $fort["owner"] != $old_status["forts"][$i]["owner"]) {
			$status["map_changed"] = true;
			array_unshift($events_log, [ "date" => $timestamp, "name" => $fort["name"],
				"location" => $fort["location"], "owner" => $fort["owner"],
				"type" => "fort" ]);
		}
		$i++;
	}

	// Gem events
	$recovered_gems = [];
	$i = 0;
	foreach ($status["gems"] as $gem) {
		if (isset($failure["gems"])) {
			break;
		}
		if (!isset($old_status["gems"]) || count($old_status["gems"]) == 0
			|| ($gem != $old_status["gems"][$i] && strpos($gem, "gem_0") === false)) {
			$status["gems_changed"] = true;
			$gem_location = str_replace("gem_", "", $gem);
			$gem_location = str_replace(".png", "", $gem_location);
			$gem_location = $realms_gem[intval($gem_location) - 1];
			$gem_owner = $realms[intval($i / 6)];
			// Example with i=17 (Syrtis #2 gem owned by Syrtis)
			// 17 (global) - 12 (realm offset) = 5
			$gem_number = ( ($i - (intval($i / 6) * 6)) <= 2 ) ? "1" : "2";
			array_unshift($events_log, [ "date" => $timestamp, "name" => $gem_number,
				"location" => $gem_location, "owner" => $gem_owner,
				"type" => "gem" ]);
			// Store the amount of gems recovered by realm (used for dragon wish)
			if ($gem_owner == $gem_location) {
				if (isset($recovered_gems[$gem_owner])) {
					$recovered_gems[$gem_owner] += intval($gem_number);
				} else {
					$recovered_gems[$gem_owner] = intval($gem_number);
				}
			}
		}
		$i++;
	}
	// Fetching the gem info from NGE's web site failed, keep the old one
	if (isset($failure["gems"]) && isset($old_status["gems"])) {
		$status["gems"] = $old_status["gems"];
	}

	// Estimate a dragon wish. If two realms recovered gems during the same minute
	$wisher = "";
	if (count($recovered_gems) == 2) {
		$realms_full_gem_recovery = 0;
		// Then check if each concerned realm has recovered their 2 gems
		foreach ($recovered_gems as $realm => $count) {
			if ($count == 3) {
				$realms_full_gem_recovery++;
			}
		}
		// If the two realms get all their gems back then deduce the wisher
		if ($realms_full_gem_recovery == 2) {
			$potential_wishers = $realms;
			foreach ($recovered_gems as $realm => $count) {
				if (($key = array_search($realm, $potential_wishers)) !== false) {
					unset($potential_wishers[$key]);
				}
			}
			$potential_wishers = array_values($potential_wishers);
			$wisher = $potential_wishers[0];
			// Record the wish, ensure it has the same structure as other
			// events, so statistics() does not fail
			array_unshift($events_log, [ "date" => $timestamp, "name" => "",
				"location" => $wisher, "owner" => "",
				"type" => "wish" ]);
		}
	}

	// Relic events
	foreach ($status["relics"] as $realm => $relics) {
		// If gems are not parseable, usually so are relics
		if (isset($failure["gems"])) {
			break;
		}
		foreach ($relics as $relic_name => $new_relic) {
			$old_relic = null;
			if (isset($old_status["relics"])) {
				$old_relic = $old_status["relics"][$realm][$relic_name] ?? null;
			}
			if (!isset($old_status["relics"]) || ($old_relic != $new_relic)) {
				$status["relics_changed"] = true;
				$output = [ "date" => $timestamp, "name" => $relic_name, "owner" => $realm,
					"location" => null, "type" => "relic" ];
				$output["location"] = ($old_relic === null) ? "altar" : "transit";
				array_unshift($events_log, $output);
			}
		}
	}
	// Fetching the relics info from NGE's web site failed, keep the old one
	// Currently if gems fail, so do the relics
	if (isset($failure["gems"]) && isset($old_status["relics"])) {
		$status["relics"] = $old_status["relics"];
	}

	// Bail out if nothing changed
	if (!$status["relics_changed"] && !$status["map_changed"]
		&& !$status["gems_changed"] && !$debug_mode) {
		exit(0);
	}
	// Bail out if 12 or more events are recorded at the same time (post
	// failure recovery that leads to malformed status on official page)
	if (count($old_status) != 0 &&
		(count($events_log) - count($old_status["events_log"] ?? [])) >= 12) {
		eprint("Messed up upstream HTML or server reboot, write nothing");
		if (!$debug_mode) {
			exit(1);
		}
	}

	// Sort and store events
	usort($events_log, function($a, $b) {
		return $b["date"] <=> $a["date"];
	});
	// Initialize all events on the first run
	if (count($old_status) == 0) {
		$status["events_log"] = $events_log;
	} else {
		$status["events_log"] = array_slice($events_log, 0, 100);
	}

	$status["generated"] = strval($timestamp);

	writer(json_encode($status), $outfile);

	// Generate stats
	require_once 'stats/generate.php';
	[$st, $ev] = statistics($status["events_log"], $stats_db_file, $debug_mode);
	writer($st, $stats_outfile);
	writer($ev, $stats_outfile_events);
}

function writer($data, $fname) {
	file_put_contents($fname, $data);
	$gz = gzopen($fname . ".gz", "w2");
	gzwrite($gz, $data);
	gzclose($gz);
}

try {
	main();
} catch (Exception $err) {
	// NGE's site totally not available
	eprint($err->getMessage() . "\n" . $err->getTraceAsString());
	// Keep old status to help recovery later
	$old_status = [];
	if (file_exists($outfile)) {
		$old_status = json_decode(file_get_contents($outfile), true);
		// Don't rewrite every minute to allow caching if the error is still
		// the same
		if (isset($old_status["failed"]) && $old_status["failed"]["debug"] == json_encode($err->getMessage())) {
			exit(1);
		}
	}
	$old_status["failed"] = ["status" => "fatal", "debug" => json_encode($err->getMessage())];
	writer(json_encode($old_status), $outfile);
}
?>
