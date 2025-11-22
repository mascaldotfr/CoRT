// A very simple calendar module generating .ics files.
// License : MIT

function generate_uid() {
	const ts = Date.now().toString(36);
	const random = Math.random().toString(36).substring(2, 10);
	return `${ts}${random}@${window.location.hostname}`;
}

// Format a Unix timestamp (seconds) as iCalendar UTC date-time: YYYYMMDDTHHMMSSZ
function format_utc_ics_datetime(unix_ts) {
	const date = new Date(parseInt(unix_ts) * 1000); // Convert to milliseconds
	const y = date.getUTCFullYear();
	const m = String(date.getUTCMonth() + 1).padStart(2, "0");
	const d = String(date.getUTCDate()).padStart(2, "0");
	const h = String(date.getUTCHours()).padStart(2, "0");
	const min = String(date.getUTCMinutes()).padStart(2, "0");
	const s = String(date.getUTCSeconds()).padStart(2, "0");
	return `${y}${m}${d}T${h}${min}${s}Z`;
}

// Escape text for iCalendar
function escape_text(text) {
	return String(text)
		.replace(/\\/g, "\\\\")
		.replace(/;/g, "\\;")
		.replace(/,/g, "\\,")
		.replace(/\n/g, "\\n");
}

/**
 * Generate iCalendar string (UTC) with 10m and 1H reminders
 * title - title and description
 * start — Unix timestamp (seconds)
 * end — Unix timestamp (seconds)
 */
function generate_ics(title, start, end ) {
	const dt_start = format_utc_ics_datetime(start);
	const dt_end = format_utc_ics_datetime(end);
	const safe_title = "[CoR] " + escape_text(title);
	const uid = generate_uid();

	return [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		"CALSCALE:GREGORIAN",
		"PRODID:-//CoRT//EN",
		"BEGIN:VEVENT",
		`UID:${uid}`,
		`SUMMARY:${safe_title}`,
		`DTSTART:${dt_start}`,
		`DTEND:${dt_end}`,
		// 10m alarm
		"BEGIN:VALARM",
		"TRIGGER:-PT10M",
		`DESCRIPTION:${safe_title}`,
		"ACTION:DISPLAY",
		"END:VALARM",
		// 1h alarm, only supported in a few clients
		"BEGIN:VALARM",
		"TRIGGER:-PT1H",
		`DESCRIPTION:${safe_title}`,
		"ACTION:DISPLAY",
		"END:VALARM",
		"END:VEVENT",
		"END:VCALENDAR"
	].join("\n");
}

function create_calendar_link(title, start, end, filename = "event.ics" ) {
	const ics = generate_ics(title, start, end);
	const encoded = encodeURIComponent(ics.trim().replace(/\r\n|\r/g, '\n'));
	const href = `text/calendar;charset=utf-8,${encoded}`;
	const safe_filename = filename.endsWith('.ics') ? filename : `${filename}.ics`;
	return `<a href="data:${href}" class="addtocalendar" download="${safe_filename}"
		title="Add to Calendar">📅</a>`;
}

export { create_calendar_link };

// CSS

if (document.readyState === "loading")
	document.addEventListener("DOMContentLoaded", inject_addtocalendar_style);
else
	inject_addtocalendar_style();

function inject_addtocalendar_style() {
	const style = document.createElement("style");
	style.textContent = ".addtocalendar { text-decoration: none; }";
	document.head.appendChild(style);
}
