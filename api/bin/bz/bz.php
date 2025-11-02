<?php

require_once(__DIR__ . "/../lib/eheader.php");
eheader_api("json");

if (!isset($_GET["fake"]))
	require_once(__DIR__ . "/Battlezone.php");
else
	require_once(__DIR__ . "/Battlezone_dev.php");

$bz = new Battlezone();
echo json_encode($bz->getSchedule());
?>
