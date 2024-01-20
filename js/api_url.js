// This files allows you to easily switch the data sources and urls if you
// don't want use the github site and my data. You may need to fiddle with paths
// since my api base has not the same structure than the repo. If you git pull,
// don't forget to copy this file in a temp directory and copying it back after
// the pull!

// The root where all API files can be found
export const __api__base = "https://hail.thebus.top/CoRT";
// Used by the trainer to filter setup submissions
export const __api__frontsite = "https://mascaldotfr.github.io";
// Subdirectory where the HTML/JS/CSS/etc. files are placed, relative to your
// www root with the leading '/'
export const __api__frontsite_dir = "/CoRT";

export const __api__urls = {
	"submit_trainer": `${__api__base}/collect/submit.php`,
	"events": `${__api__base}/warstatus/stats/allevents.json`,
	"stats": `${__api__base}/warstatus/stats/statistics.json`,
	"wstatus": `${__api__base}/warstatus/warstatus.json`
};
