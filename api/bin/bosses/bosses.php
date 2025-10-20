<?php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

require_once __DIR__ . '/BossesRespawns.php';

$bosses = new BossesRespawns();
echo json_encode($bosses->getSchedule());

?>
