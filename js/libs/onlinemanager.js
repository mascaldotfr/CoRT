import {_} from "../../data/i18n.js";

export const $onlinemanager = {
	"offlineMessage": `<b>${_("You are offline. Impossible to fetch the data.")}</b>`,
	"willRetryMessage": `<b>${_("I will retry once you are online.")}</b>`,
	"wontRetryMessage": `<b>${_("Please get back online and refresh this page.")}</b>`,
	"whenBackOnline": (func) => {
		// desktop version
		window.addEventListener("online", func);
		// timers are stopped when phones and tablets are on sleep mode,
		// force reload when they're woken up
		if ("ontouchstart" in document.documentElement) {
			window.addEventListener("visibilitychange", (e) => {
				if (document.visibilityState == "visible")
					func;
			});
		}
	},
	"online": () => {return navigator.onLine}
};
