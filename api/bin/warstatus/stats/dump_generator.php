<?php

// All files are relative to that script directory
chdir(__DIR__);

$output_dir = "../../../var";
$sqlite_db = "../../../var/events.sqlite";

$out_history = $output_dir . "/events_dump.csv";

// Check if output file exists and is less than 24 hours old
// Redirect to the cached page if that's the case
if (file_exists($out_history) && (time() - filemtime($out_history)) < 86400) {
    header("Location: " . $out_history);
    exit;
}

// Ensure completion if client close the connection
ignore_user_abort(true);

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: inline; filename="all_events.csv"');

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

$gz_file = $out_history . '.gz';
$gz_fp = gzopen($gz_file, 'wb2');
$csv_content = file_get_contents($out_history);
gzwrite($gz_fp, $csv_content);
gzclose($gz_fp);
