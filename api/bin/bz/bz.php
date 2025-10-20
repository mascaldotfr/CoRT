<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . "/Battlezone.php";

$bz = new Battlezone();
echo json_encode($bz->getSchedule());

?>
