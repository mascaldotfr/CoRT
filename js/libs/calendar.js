/* Easy interface to add-to-calendar-button */

import "./addtocalendarv2.js";

function zeropad(arr) {
	for (let i in arr)
		arr[i] = arr[i].toString().padStart(2, "0");
	return arr;
}

// time stamp and duration are in seconds
export function generate_calendar(tstamp, title, duration) {
	let sdate = new Date(tstamp * 1000);
	let startdate = [sdate.getUTCFullYear(), sdate.getUTCMonth() + 1, sdate.getUTCDate()];
	startdate = zeropad(startdate);
	let starttime = [sdate.getUTCHours(), sdate.getUTCMinutes()];
	starttime = zeropad(starttime);
	let edate = new Date(tstamp * 1000 + duration * 1000);
	let endtime = [edate.getUTCHours(), edate.getUTCMinutes()];
	endtime = zeropad(endtime);
	return `
		<add-to-calendar-button
		  name="[CoR] ${title.toUpperCase()}"
		  startDate="${startdate.join("-")}"
		  startTime="${starttime.join(":")}"
		  endTime="${endtime.join(":")}"
		  timeZone="UTC"
		  options="'Apple','Google','iCal','Outlook.com','Yahoo','Microsoft365'"
		  trigger="click"
		  hideTextLabelButton
		  size="0"
		  lightMode="dark"
		></add-to-calendar-button>
	`;
}
