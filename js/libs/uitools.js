/* XXX UITools: various common UI tools */

export class UITools {
	static unskeleton() {
		requestAnimationFrame(() => {
			document.querySelectorAll(".skeleton").forEach(el => el.classList.remove("skeleton"));
		});
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
