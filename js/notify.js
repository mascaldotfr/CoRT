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

__notification_support = "Notification" in window

if (__notification_support === true) {
	try {
		navigator.permissions
			.query({ name: "notifications" })
			.then((permissionStatus) => {
				permissionStatus.onchange = () => {
					if (permissionStatus.state === "prompt")
						insert_notification_link();
				};
			});
	}
	catch(_unused) { /* Unsupported by safari */ };
	navigator.serviceWorker.register("sw.js");
}

function insert_notification_link() {
	if (Notification.permission !== "default" || __notification_support === false)
		return;
	$("#title").append(`
		<a href="#" id="ask-notifications" class="nodeco" title="Notifications">&nbsp;🔔</a>
	`);
	$("#ask-notifications").on("click", function () {
		$("#ask-notifications").remove();
		Notification.requestPermission();
	});
}

function mynotify(title, text, tag) {
	const options = {
		icon: "favicon.png",
		body: text,
		tag: tag,
		renotify: true,
		vibrate: [100, 50, 100]
	};
	if (__notification_support === false) {
		console.log("Browser does not support notifications");
		return;
	}
	if (Notification.permission === "granted") {
		navigator.serviceWorker.ready.then( reg => {
			reg.showNotification(title, options)
		});
	}
}
