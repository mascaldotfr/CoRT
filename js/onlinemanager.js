/*
 * Copyright (c) 2023 mascal
 *
 * CoRT is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * CoRT is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with CoRT.  If not, see <http://www.gnu.org/licenses/>.
 */

const $onlinemanager = {
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
