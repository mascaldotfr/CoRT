<?php

require_once(__DIR__ . "/../lib/eheader.php");
require_once(__DIR__ . '/BossesRespawns.php');
eheader_api("json");

$bosses = new BossesRespawns();
echo json_encode($bosses->getSchedule());

?>
