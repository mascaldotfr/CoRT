let menu = `
	<div id="menu">
		<a href="index.html">Trainer</a>
		&nbsp;|&nbsp;
		<a href="bosses.html">Bosses countdown</a>
		&nbsp;|&nbsp;
		<a href="bz.html">BZ status</a>
		&nbsp;|&nbsp;
		<a href="https://github.com/mascaldotfr/CoRT" target="_blank">Source Code</a>
		&nbsp;|&nbsp;
		<a href="https://github.com/mascaldotfr/CoRT/wiki/Bug-reports" target="_blank">Bug Reports</a>
	</div>
	`;
$(document).ready(function() {
	$("body").prepend(menu);
});
