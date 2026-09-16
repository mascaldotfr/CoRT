import {$} from "./lamaiquery.js";

/* XXX MyNotify : a simple javacript notification system */

export class MyNotify {
       constructor() {
               this.swsupport = ("Notification" in window && "serviceWorker" in navigator);
               try {
                       navigator.permissions
                               .query({ name: "notifications" })
                               .then((permissionStatus) => {
                                       permissionStatus.onchange = () => {
                                               if (permissionStatus.state === "prompt")
                                                       this.insert_notification_link();
                                       };
                               });
               }
               catch(_unused) { /* Unsupported by safari */ }
               if (this.swsupport)
                       navigator.serviceWorker.register("sw.js");
       }

       insert_notification_link() {
               if (!this.swsupport || Notification.permission !== "default")
                       return;
               $("#notif-zone").append(`
                   <a href="#" id="asknotifications" class="nodeco" title="Notifications"><span class="notif-badge">&#128276;</span></a>
               `);
               $("#asknotifications").on("click", function () {
                       $("#asknotifications").remove();
                       Notification.requestPermission();
               });
       }

       emit(title, text, tag) {
               const options = {
                       icon: "favicon.png",
                       body: text,
                       tag: tag,
                       renotify: true,
                       vibrate: [100, 50, 100]
               };
               if (this.swsupport && Notification.permission === "granted") {
                       navigator.serviceWorker.ready.then( reg => {
                               reg.showNotification(title, options);
                       });
               }
       }
}


