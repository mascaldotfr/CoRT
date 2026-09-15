/* XXX UITools: various common UI tools */

export class UITools {
	static unskeleton() {
		document.querySelectorAll(".skeleton").forEach(el => el.classList.remove("skeleton"));
		// void document.body.offsetHeight;
	}
	static defer() {
		import("../defer.js");
	}
	static is_inactive() {
		// The goal here is to detect when to do nothing (hidden window
		// and notifications off). MyScheduler will rehydrate pages
		// when needed.
		return (document.hidden && 'Notification' in window && Notification.permission !== 'granted');
	}
}
