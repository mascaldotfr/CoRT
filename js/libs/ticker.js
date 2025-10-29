/*
 ticker.js: a simple minutely ticker webworker

 It allows to have a permament setInterval, fired at least at the
 <start_second> and not after <end_second>. (default 5 and 10 respectively). It
 drifts until <end_second> then go back in range if needed.

 See /js/wz.js for usage and communication with the worker. Comment events
 for testing and debugging, or focus will mess your tests.
*/


let last_run = 0;
let start_second = 5;
let end_second = 10;

self.onmessage = (e) => {
	const data = e["data"];
	if ("init" in data) {
		start_second = data["init"]["start"];
		end_second = data["init"]["end"];
	}
	if ("update_last_run" in data)
		last_run = data["update_last_run"]["ts"];

	let delay = 1000 * (end_second - start_second);

	setInterval(() => {
		const now = new Date(Date.now());
		const sec = now.getSeconds();
		const ts = now.getTime();
		const on_debounce = ts < last_run + delay;
		const should_display = sec >= start_second && sec < end_second;

		if (!on_debounce && should_display) {
			last_run = ts;
			postMessage("tick");
		}
	}, delay );
};
