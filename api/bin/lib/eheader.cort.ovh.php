<?php
// A simple suite of functions to make headers management more centralized.
// Beware. CORS is made for browser security, being restrictive here won't
// prevent people from using the API out of browser through curl and company.
// Where is actually the frontend, needed for CORS only.

const EH_ALLOWED_ORIGINS = [
    "https://cort.ovh",
    "https://regnumsentinel.com",
    "https://cort.go.yo.fr"
];

const EH_FRONTSITE = "https://cort.ovh";

// In case you have a weird server with non UTF8 encoding by default
define('EH_ENCODING', mb_internal_encoding());

const EH_MIME_TYPES = array(
	"csv" 	=> "text/csv; charset=" . EH_ENCODING,
	"json" 	=> "application/json; charset=" . EH_ENCODING
);

function valid_mime_or_die($mime_type) {
	if (!isset(EH_MIME_TYPES[$mime_type])) {
		die("Invalid mime type, update me!");
    }
}

// Just CORS, by default we restrict to the allowed origins list.
// If the API and frontsite are on the same domain, this header is ignored
// and the API access is allowed by the browser's same-origin policy.
function eheader_cors($allow = null) {
	$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

	// Use provided allow list, or default to EH_ALLOWED_ORIGINS
	$targets = ($allow !== null) ? (is_array($allow) ? $allow : [$allow]) : EH_ALLOWED_ORIGINS;

	// Check if the request origin is explicitly allowed
	if (in_array($origin, $targets, true)) {
		header("Access-Control-Allow-Origin: " . $origin);
	}
	elseif ($allow === "*") {
		// Fallback to wildcard only if explicitly forced (not recommended if using credentials)
		header("Access-Control-Allow-Origin: *");
	}
}

// used for direct consumption of the API, permissive this time, change
// `$allow` value to EH_FRONTSITE (or an array of allowed origins) if you
// don't want your API be fetched by others.
function eheader_api($mime_type, $allow = null) {
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
