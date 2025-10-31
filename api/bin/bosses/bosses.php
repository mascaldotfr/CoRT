<?php

require_once(__DIR__ . "/../lib/eheader.php");
require_once(__DIR__ . '/BossesRespawns.php');
eheader_api("json");

$bosses = new BossesRespawns();

if (isset($_GET["fake"]))
	$schedule = $bosses->getSchedule(3, true);
else
	$schedule = $bosses->getSchedule();
echo json_encode($schedule);

?>
