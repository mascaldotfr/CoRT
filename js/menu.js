let menu = `
	<div id="menu">
		<b><a href="index.html">Trainer</a></b>
		&nbsp;|&nbsp;
		<b><a href="bosses.html">Bosses</a></b>
		&nbsp;|&nbsp;
		<b><a href="bz.html">BZ status</a></b>
		&nbsp;|&nbsp;
		<a href="https://github.com/mascaldotfr/CoRT" target="_blank">Source Code</a>
		&nbsp;|&nbsp;
		<a href="https://github.com/mascaldotfr/CoRT/wiki/Bug-reports" target="_blank">Bug Reports</a>
	</div>
	`;
$(document).ready(function() {
	$("body").prepend(menu);
});
