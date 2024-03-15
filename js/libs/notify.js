import {$} from "./lamaiquery.js";

let __notifications_swsupport = ("Notification" in window && "serviceWorker" in navigator);

export function insert_notification_link() {
	if (! __notifications_swsupport || Notification.permission !== "default")
		return;
	$("#title").append(`
		<a href="#" id="ask-notifications" class="nodeco" title="Notifications">&nbsp;🔔</a>
	`);
	$("#ask-notifications").on("click", function () {
		$("#ask-notifications").remove();
		Notification.requestPermission();
	});
}

export function mynotify(title, text, tag) {
	const options = {
		icon: "favicon.png",
		body: text,
		tag: tag,
		renotify: true,
		vibrate: [100, 50, 100]
	};
	if ( __notifications_swsupport && Notification.permission === "granted") {
		navigator.serviceWorker.ready.then( reg => {
			reg.showNotification(title, options)
		});
	}
}

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
if (__notifications_swsupport)
	navigator.serviceWorker.register("sw.js");

