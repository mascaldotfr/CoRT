/* XXX UITools: various common UI tools */

export class UITools {
	static unskeleton() {
		document.querySelectorAll(".skeleton").forEach(el => el.classList.remove("skeleton"));
		// void document.body.offsetHeight;
	}
	static defer() {
		// Defer until next paint
		setTimeout( () => { import("../defer.js"); }, 0 );
	}
}
