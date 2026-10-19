/* XXX MyNotify : a simple javacript notification system */

import {$} from "./lamaiquery.js";

export class MyNotify {
	constructor() {
		const pathname = window.location.pathname;
		// Drop extension so it works in case of try_path /xx -> /xx.html
		this.keyname = 'notify_' + pathname.split('/').pop().replace(/.[^/.]+$/, "");
		const is_mobile = /Mobi/i.test(navigator.userAgent);
		this.swsupport = ("Notification" in window && "serviceWorker" in navigator && !is_mobile);

		if (localStorage.getItem(this.keyname) === null)
			localStorage.setItem(this.keyname, 'disabled');

		try {
			navigator.permissions
				.query({ name: "notifications" })
				.then((permissionStatus) => {
					permissionStatus.onchange = () => {
						// Re-evaluate UI when browser permission changes
						this.insert_notification_link();
					};
				});
		}
		catch(_unused) { /* Unsupported by safari */ }

		if (this.swsupport)
			navigator.serviceWorker.register("sw.js");

		// Render the initial state on page load
		this.insert_notification_link();
	}

	can_emit() {
		return localStorage.getItem(this.keyname) === 'enabled';
	}

	insert_notification_link() {
		if (!this.swsupport)
			return;

		const perm = Notification.permission;
		let isEnabled = localStorage.getItem(this.keyname) === 'enabled';
		const self = this;

		// If browser permission is NOT granted (reset or blocked),
		// but localstorage says enabled, sync it to disabled!
		if (perm !== 'granted' && isEnabled) {
			localStorage.setItem(this.keyname, 'disabled');
			isEnabled = false;
		}

		$("#notif-zone").empty();

		if (perm === "default" || perm === "prompt") {
			$("#notif-zone").append(`
	       <a href="#" id="asknotifications" class="nodeco" title="Enable Notifications"><span class="notif-badge">&#128276;</span></a>
	   `);
			$("#asknotifications").on("click", function () {
				Notification.requestPermission().then((permission) => {
					if (permission === 'granted') {
						localStorage.setItem(self.keyname, 'enabled');
					}
					self.insert_notification_link();
				});
				return false;
			});
		}
		else if (perm === "granted") {
			if (!isEnabled) {
				$("#notif-zone").append(`
		   <a href="#" id="asknotifications" class="nodeco" title="Enable Notifications"><span class="notif-badge">&#128276;</span></a>
	       `);
				$("#asknotifications").on("click", function () {
					localStorage.setItem(self.keyname, 'enabled');
					self.insert_notification_link();
					return false;
				});
			} else {
				$("#notif-zone").append(`
		   <a href="#" id="disablenotifications" class="nodeco" title="Disable Notifications"><span class="notif-badge">&#128277;</span></a>
	       `);
				$("#disablenotifications").on("click", function () {
					localStorage.setItem(self.keyname, 'disabled');
					self.insert_notification_link();
					return false;
				});
			}
		}
		else if (perm === "denied") {
			$("#notif-zone").append(`
	       <a href="#" class="nodeco" title="Notifications blocked by browser" style="opacity: 0.5; cursor: not-allowed;"><span class="notif-badge">&#128277;</span></a>
	   `);
		}
	}

	unique_id(s) {
		// It's a "unique" identifier based on notification
		// text because all notifications text have virtually no id
		// Use the fast and good enough djb2 algo
		let h = 5381;
		for (let i = 0; i < s.length; i++)
			h = ((h << 5) + h + s.charCodeAt(i)) | 0;
		return String(h);
	}

	emit(title, text, tag="global") {
		const permission_granted = Notification.permission === "granted";
		if (!(this.swsupport && permission_granted && this.can_emit()))
			return; // We can't notify

		// debounce notifications if the last text was strictly similar
		const key = "notify_" + tag + "_last";
		const last_uid = localStorage.getItem(key) ?? "";
		const new_uid = this.unique_id(text);
		if (last_uid === new_uid)
			return;
		else
			localStorage.setItem(key, new_uid);

		const options = {
			icon: "favicon.png",
			body: text,
			tag: tag,
			renotify: true,
			vibrate: [100, 50, 100]
		};

		navigator.serviceWorker.ready.then( reg => {
			reg.showNotification(title, options);
		});
	}
}
