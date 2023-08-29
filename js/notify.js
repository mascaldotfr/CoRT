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

function mynotify(title, text) {
	let options = {
		icon: "favicon.png",
		body: text
	};
	if (!Notification)
		return; // unsupported browser

	if (Notification.permission === "granted") {
		let notification = new Notification(title, options);
		return;
	}

	if (Notification.permission !== "denied") {
		permission = Notification.requestPermission();
		if (permission === "granted") {
			let notification = new Notification(title, options);
		}
	}
}


