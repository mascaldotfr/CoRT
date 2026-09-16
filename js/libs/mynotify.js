import {$} from "./lamaiquery.js";

/* XXX MyNotify : a simple javacript notification system */

export class MyNotify {
	constructor(storageKey = 'mynotify_status') {
		this.storageKey = storageKey;
		this.swsupport = ("Notification" in window && "serviceWorker" in navigator);

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
	insert_notification_link() {
		if (!this.swsupport)
			return;

		const perm = Notification.permission;
		// Default to disabled if key is missing
		const isEnabled = localStorage.getItem(this.storageKey) === 'enabled';
		const self = this;

		$("#notif-zone").empty();

		if (perm === "default" || perm === "prompt") {
			$("#notif-zone").append(`
			   <a href="#" id="asknotifications" class="nodeco" title="Enable Notifications"><span class="notif-badge">&#128276;</span></a>
		       `);
			$("#asknotifications").on("click", function () {
				Notification.requestPermission().then(() => {
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
					localStorage.setItem(self.storageKey, 'enabled');
					self.insert_notification_link();
					return false;
				});
			} else {
				$("#notif-zone").append(`
				   <a href="#" id="disablenotifications" class="nodeco" title="Disable Notifications"><span class="notif-badge">&#128277;</span></a>
			       `);
				$("#disablenotifications").on("click", function () {
					localStorage.setItem(self.storageKey, 'disabled');
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

	emit(title, text, tag) {
		const options = {
			icon: "favicon.png",
			body: text,
			tag: tag,
			renotify: true,
			vibrate: [100, 50, 100]
		};

		// Only emit if explicitly enabled in local storage
		if (this.swsupport && Notification.permission === "granted" && localStorage.getItem(this.storageKey) === 'enabled') {
			navigator.serviceWorker.ready.then( reg => {
				reg.showNotification(title, options);
			});
		}
	}
}
