/* XXX UITools: various common UI tools */

export class UITools {
	unskeleton() {
		document.querySelectorAll(".skeleton").forEach(el => el.classList.remove("skeleton"));
		// void document.body.offsetHeight;
	}
	defer() {
		import("../defer.js");
	}
}




