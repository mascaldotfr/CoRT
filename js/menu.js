let menu = `
	<div id="menu">
		<a href="index.html">Trainer</a>
		&nbsp;|&nbsp;
		<a href="bosses.html">Bosses countdown</a>
		&nbsp;|&nbsp;
		<a href="bz.html">BZ status</a>
	</div>
	`;
$(document).ready(function() {
	$("body").prepend(menu);
});
