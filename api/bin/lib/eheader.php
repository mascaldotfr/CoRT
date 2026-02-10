<?php

// A simple suite of functions to make headers management more centralized.

// Beware. CORS is made for browser security, being restrictive here won't
// prevent people from using the API out of browser through curl and company.

// Where is actually the frontend
const EH_FRONTSITE = "https://mascaldotfr.github.io";
// In case you have a weird server with non UTF8 encoding by default
define('EH_ENCODING', mb_internal_encoding());
const EH_MIME_TYPES = array(
	"csv" 	=> "text/csv; charset=" . EH_ENCODING,
	"json" 	=> "application/json; charset=" . EH_ENCODING
);

function valid_mime_or_die($mime_type) {
	if (!isset(EH_MIME_TYPES[$mime_type]))
		die("Invalid mime type, update me!");
}

// Just CORS, by default we restrict to the frontsite; in case of CoRT,
// remember that mascaldotfr.github.io requires an API server on another
// domain, so it's needed. If the API and fronsite are on the same domaine,
// this header is ignored and the API access allowed.
function eheader_cors($allow = EH_FRONTSITE) {
	header("Access-Control-Allow-Origin: " . $allow);
}

// used for direct consumption of the API, permissive this time, change
// `$allow` value to EH_FRONTSITE if you don't want your API be fetched by
// others.
function eheader_api($mime_type, $allow = "*") {
	valid_mime_or_die($mime_type);
	eheader_cors($allow);
	header("Content-Type: " . EH_MIME_TYPES[$mime_type]);
}

// need to make the output downloadable ? That's it. Note that you CANNOT use
// such output for a JS fetch() call.
// Code-wise: No CORS, so can't be mixed with eheader_api.
function eheader_download($mime_type, $target_filename = "download.bin") {
	valid_mime_or_die($mime_type);
	header("Content-Type: " . EH_MIME_TYPES[$mime_type]);
	header('Content-Disposition: inline; filename="'. $target_filename .'"');
}

?>
