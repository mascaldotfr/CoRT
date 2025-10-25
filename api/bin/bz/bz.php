<?php

require_once(__DIR__ . "/Battlezone.php");
require_once(__DIR__ . "/../lib/eheader.php");
eheader_api("json");

$bz = new Battlezone();
echo json_encode($bz->getSchedule());

?>
