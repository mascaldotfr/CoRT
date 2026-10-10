/* XXX UITools: various common UI tools */

export class UITools {
	static unskeleton() {
		requestAnimationFrame(() => {
			document.querySelectorAll(".skeleton").forEach(el => el.classList.remove("skeleton"));
		});
	}
	static live_on_fire(activate=true) {
		const live_badge = document.querySelector(".live-badge-label");
		if (live_badge === null)
			return;
		if (activate) {
			live_badge.classList.add("fire");
		}
		else {
			setTimeout(() => {
				if (live_badge !== null)
					live_badge.classList.remove("fire");
			}, 2000);
		}
	}

	static defer() {
		const payload = () => { import("../defer.js") };
		// The setTimeout is for Safari since it doesn't support requestIdleCallback
		if ("requestIdleCallback" in window)
			requestIdleCallback(() => {requestIdleCallback(payload)});
		else
			setTimeout(payload, 50);
	}
	static get_user_context() {
		return {
			lang: localStorage.getItem("lang") ?? "en",
			tz: localStorage.getItem("tz") ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
			mobile: /Mobi/i.test(navigator.userAgent)
		};
	}
}
