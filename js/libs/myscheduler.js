// XXX Schedule minutely things. See WZ/BZ/BOSSES for usage
export class MyScheduler {
	constructor(start, end, callback) {
		this.callback = callback;

		let callback_running = false;
		window.addEventListener("visibilitychange", async () => {
			if (!document.hidden && !callback_running) {
				try {
					callback_running = true;
					await callback();
				}
				finally {
					callback_running = false;
				}
			}
		});

		const worker_code = `
			let timer = null;
			function when_to_respawn() {
				const now = new Date();
				const jitter = Math.floor(Math.random() * (${end} - ${start} + 1));
				const target_second = ${start} + jitter;

				const next = new Date(now);
				next.setMilliseconds(0);
				next.setSeconds(target_second);
				if (next <= now)
					next.setMinutes(next.getMinutes() + 1);
				return next.getTime() - now.getTime();
			}
			function tick() {
				postMessage("tick");
				schedule();
			}
			function schedule() {
				const delay = when_to_respawn();
				timer = setTimeout(tick, delay);
			}
			onmessage = schedule;
		`;
		const blob = new Blob([worker_code], { type: "application/javascript" });
		this.worker = new Worker(URL.createObjectURL(blob));
		this.worker.onmessage = this.callback;
	}
	start_scheduling() {
		// Firefox mobile handles web workers badly and fires a lot of
		// API calls when coming back from sleep, use a 30s dumb poll instead
		if (navigator.userAgent.includes("Firefox") && navigator.userAgent.includes("Mobile"))
			setInterval(this.callback, 30_000);
		else
			this.worker.postMessage("start");
	}

}

