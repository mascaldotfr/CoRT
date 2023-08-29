/*
 * Copyright (c) 2022-2023 mascal
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

// Bootstrap notifications permissions before mynotify is called
if (Notification.permission !== "denied")
	Notification.requestPermission();

function mynotify(title, text) {
	const options = {
		icon: "favicon.png",
		body: text
	};
	if (!("Notification" in window)) {
		console.log("Browser does not support notifications");
		return;
	}

	if (Notification.permission === "granted") {
		const notification = new Notification(title, options);
	}
	else if (Notification.permission !== "denied") {
		Notification.requestPermission().then((permission) => {
			if (permission === "granted") {
				const notification = new Notification(title, options);
			}
		});
	}
}


