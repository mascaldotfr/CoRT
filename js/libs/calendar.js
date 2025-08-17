/* Easy interface to add-to-calendar-button */

let import_err = "addtocalendar is not supported";
try {
	let addtocalendar = import("./addtocalendarv2.js")
		.catch(() => { throw import_err }); // display error on MacOS too
}
catch(_unused) {
	console.err(import_err);
}


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
	let enddate = [edate.getUTCFullYear(), edate.getUTCMonth() + 1, edate.getUTCDate()];
	enddate = zeropad(enddate);
	let endtime = [edate.getUTCHours(), edate.getUTCMinutes()];
	endtime = zeropad(endtime);
	return `
		<add-to-calendar-button
		  class="calendar"
		  name="[CoR] ${title.toUpperCase()}"
		  startDate="${startdate.join("-")}"
		  startTime="${starttime.join(":")}"
		  endDate="${enddate.join("-")}"
		  endTime="${endtime.join(":")}"
		  timeZone="UTC"
		  options="'Apple','Google','iCal','Outlook.com','Yahoo','Microsoft365'"
		  trigger="click"
		  hideTextLabelButton
		  hideIconButton
		  size="0"
		  lightMode="dark"
		  inline
		  hideBackground
		  buttonStyle="simple"
		  title="Add to calendar"
		></add-to-calendar-button>
	`;
}
