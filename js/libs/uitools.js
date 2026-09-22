/* XXX UITools: various common UI tools */

export class UITools {
	static unskeleton() {
		requestAnimationFrame(() => {
			document.querySelectorAll(".skeleton").forEach(el => el.classList.remove("skeleton"));
		});
	}
	static defer() {
		const payload = () => { import("../defer.js") };
		if ("requestIdleCallback" in window)
			requestIdleCallback(() => {requestIdleCallback(payload)});
		else
			setTimeout(payload, 50);
	}
}
