import { pushNotificationService } from "./utils/pushNotification.js";
import { indexedDBService } from "./utils/indexedDB.js";

class PWAInitializer {
  constructor() {
    this.init();
  }

  async init() {
    // Inisialisasi service worker dan push notifications
    const pushSupported = await pushNotificationService.init();

    // Tambahkan tombol toggle notifikasi ke UI jika push didukung
    if (pushSupported) {
      this.addNotificationToggle();
    }

    // Inisialisasi IndexedDB
    await indexedDBService.init();
  }

  addNotificationToggle() {
    const navList = document.getElementById("nav-list");
    if (!navList) return;

    const notificationItem = document.createElement("li");
    notificationItem.setAttribute("role", "menuitem");

    const toggleButton = document.createElement("button");
    toggleButton.id = "notification-toggle";
    toggleButton.className = "notification-toggle";
    toggleButton.setAttribute("aria-label", "Aktifkan/matikan notifikasi");

    // Set status awal
    // this.updateNotificationButton(toggleButton);

    // Tambahkan event handler
    toggleButton.addEventListener("click", async () => {
      const isSubscribed = await pushNotificationService.isSubscribed();
      if (isSubscribed) {
        await pushNotificationService.unsubscribe();
      } else {
        await pushNotificationService.subscribe();
      }
      // this.updateNotificationButton(toggleButton);
    });

    notificationItem.appendChild(toggleButton);
    navList.appendChild(notificationItem);
  }

  async updateNotificationButton(button) {
    const isSubscribed = await pushNotificationService.isSubscribed();
    button.textContent = isSubscribed
      ? "🔔 Notifikasi Aktif"
      : "🔕 Notifikasi Mati";
    button.setAttribute("aria-pressed", isSubscribed);
  }
}

// Inisialisasi fitur PWA saat DOM dimuat
document.addEventListener("DOMContentLoaded", () => {
  new PWAInitializer();
});
