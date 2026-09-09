<?php

require_once(__DIR__ . "/../../lib/eheader.php");
eheader_download("csv", "all_events.csv");

// All files are relative to that script directory
chdir(__DIR__);

$output_dir = "../../../var";
$sqlite_db = "../../../var/events.sqlite";

$out_history = $output_dir . "/events_dump.csv";

// Check if output file exists and is less than 24 hours old
// Redirect to the cached page if that's the case
if (filesize($out_history) != 0 && file_exists($out_history) && (time() - filemtime($out_history)) < 86400) {
	$last_modified = filemtime($out_history);
	header("Last-Modified: " . gmdate("D, d M Y H:i:s", $last_modified) . " GMT");

	$if_modified_since = $_SERVER['HTTP_IF_MODIFIED_SINCE'] ?? null;
	if ($if_modified_since && strtotime($if_modified_since) >= $last_modified) {
		http_response_code(304);
		exit();
	}

	readfile($out_history);
	exit();
}

// Ensure completion if client close the connection
ignore_user_abort(true);

$pdo = new PDO("sqlite:" . $sqlite_db);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$query = 'SELECT datetime(date, "unixepoch") AS date_utc, name, location AS original_location, owner AS current_owner, type FROM events';
$stmt = $pdo->query($query);

// Fill the cache
$fp = fopen($out_history, 'w');
// Make download the dump nonetheless, without redirecting
$stdout = fopen('php://output', 'w');

// Write CSV header
$headers = ['date_utc', 'name', 'original_location', 'current_owner', 'type'];
fputcsv($fp, $headers);
fputcsv($stdout, $headers);

// Fetch and write rows
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
	fputcsv($fp, $row);
	fputcsv($stdout, $row);
}

fclose($fp);


// Fetch a third (!) copy
$csv_content = file_get_contents($out_history);

// Create gzip compressed version
$gz = gzopen($out_history . ".gz", "w9");
gzwrite($gz, $csv_content);
gzclose($gz);

// If zstd extension is available, create zstd compressed version of the original data
if (function_exists("zstd_compress")) {
	$zstd_data = zstd_compress($csv_content, 19);
	file_put_contents($out_history . ".zst", $zstd_data);
}

?>
