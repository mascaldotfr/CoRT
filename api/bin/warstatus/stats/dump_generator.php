<?php

if (php_sapi_name() !== 'cli' && realpath($_SERVER['SCRIPT_FILENAME']) === realpath(__FILE__)) {
	http_response_code(403);
	exit('Direct access not allowed');
}

require_once(__DIR__ . "/../../lib/eheader.php");
require_once(__DIR__ . "/../../lib/multiwriter.php");

// All files are relative to that script directory
chdir(__DIR__);

$output_dir = "../../../var";
$sqlite_db = "../../../var/events.sqlite";

$out_history = $output_dir . "/events_dump.csv";

$pdo = new PDO("sqlite:" . $sqlite_db);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$query = 'SELECT datetime(date, "unixepoch") AS date_utc, name, location AS original_location, owner AS current_owner, type FROM events';
$stmt = $pdo->query($query);

// Fill the cache
$fp = fopen('php://temp', 'r+');
// Make download the dump nonetheless, without redirecting

// Write CSV header
$headers = ['date_utc', 'name', 'original_location', 'current_owner', 'type'];
fputcsv($fp, $headers);

// Fetch and write rows
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
	fputcsv($fp, $row);
}

// Back to line 1
rewind($fp);
$csv_content = stream_get_contents($fp);
fclose($fp);

MultiWriter::write($out_history, $csv_content);

?>
