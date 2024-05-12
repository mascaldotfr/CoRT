/* Easy interface to add-to-calendar-button */

let import_err = "addtocalendar is not supported";
try {
	let addtocalendar = import("./addtocalendarv2.js")
		.catch(() => { throw import_err }); // display error on MacOS too
}
catch(_unused) {
	console.err(import_err);
}

let icon = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' class='menu-icon' viewBox='0 0 36 36'%3E%3Cpath fill='%2366757F' d='M28.815 4h1.996v1h-1.996z'/%3E%3Cpath fill='%23CCD6DD' d='M2 12v20c0 2.209 1.791 4 4 4h24c2.209 0 4-1.791 4-4V12H2z'/%3E%3Cpath fill='%23DD2E44' d='M30 4H6C3.791 4 2 5.791 2 8v5h32V8c0-2.209-1.791-4-4-4z'/%3E%3Cpath d='M8.836 8.731c-.702 0-1.271-.666-1.271-1.489 0-.822.569-1.489 1.271-1.489.701 0 1.27.667 1.27 1.489 0 .822-.569 1.489-1.27 1.489zm6 0c-.702 0-1.271-.666-1.271-1.489 0-.822.569-1.489 1.271-1.489.701 0 1.27.667 1.27 1.489 0 .822-.569 1.489-1.27 1.489zm6 0c-.702 0-1.271-.666-1.271-1.489 0-.822.569-1.489 1.271-1.489.701 0 1.271.667 1.271 1.489-.001.822-.57 1.489-1.271 1.489zm6 0c-.702 0-1.271-.666-1.271-1.489 0-.822.569-1.489 1.271-1.489.701 0 1.271.667 1.271 1.489-.001.822-.57 1.489-1.271 1.489z' fill='%23292F33'/%3E%3Cpath fill='%2366757F' d='M27.315.179c-1.277 0-2.383.802-2.994 1.97-.606-1.143-1.717-1.97-3.006-1.97-1.277 0-2.383.802-2.994 1.97-.606-1.143-1.717-1.97-3.006-1.97-1.277 0-2.383.802-2.994 1.97-.606-1.143-1.717-1.97-3.006-1.97-1.934 0-3.5 1.819-3.5 4.005 0 1.854 1.045 3.371 2.569 3.926.759.275 1.224-.447 1.159-1.026-.055-.48-.374-.793-.729-1.018-.485-.307-1-1.008-1-1.877 0-1.104.671-2.095 1.5-2.095s1.5.905 1.5 1.905h1.016c-.003.062-.016.121-.016.184 0 1.854 1.045 3.371 2.569 3.926.759.275 1.224-.447 1.159-1.026-.055-.479-.374-.792-.729-1.017-.485-.307-1-1.008-1-1.877 0-1.104.671-2.095 1.5-2.095S16.815 3 16.815 4h1.016c-.003.062-.016.121-.016.184 0 1.854 1.045 3.371 2.569 3.926.759.275 1.224-.447 1.159-1.026-.055-.479-.374-.792-.729-1.017-.485-.307-1-1.008-1-1.877 0-1.104.671-2.095 1.5-2.095S22.815 3 22.815 4h1.016c-.003.062-.016.121-.016.184 0 1.854 1.045 3.371 2.569 3.926.759.275 1.224-.447 1.159-1.026-.055-.479-.374-.792-.729-1.017-.485-.307-1-1.008-1-1.877 0-1.104.671-2.095 1.5-2.095S28.815 3 28.815 4h1.996C30.79 2 29.235.179 27.315.179z'/%3E%3Cpath d='M11 15h4v4h-4zm5 0h4v4h-4zm5 0h4v4h-4zm5 0h4v4h-4zM6 20h4v4H6zm5 0h4v4h-4zm5 0h4v4h-4zm5 0h4v4h-4zm5 0h4v4h-4zM6 25h4v4H6zm5 0h4v4h-4zm5 0h4v4h-4zm5 0h4v4h-4zm5 0h4v4h-4zM6 30h4v4H6zm5 0h4v4h-4zm5 0h4v4h-4z' fill='%23FFF'/%3E%3C/svg%3E")`;
let head = document.getElementsByTagName("head")[0];
let style = document.createElement("style");
style.innerText = `
add-to-calendar-button.calendar::part(atcb-button) {
	background-image: ${icon};
	background-repeat: no-repeat;
	height: 2em;
	background-position: center;
	border: none;
	outline: none;
	box-shadow: none;
	padding: 0px;
}
`
head.appendChild(style);

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
		  class="calendar"
		  name="[CoR] ${title.toUpperCase()}"
		  startDate="${startdate.join("-")}"
		  startTime="${starttime.join(":")}"
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
		  title="Add to calendar"
		></add-to-calendar-button>
	`;
}
