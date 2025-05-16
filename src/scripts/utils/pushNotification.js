const VAPID_PUBLIC_KEY =
  "BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk";

class PushNotificationService {
  constructor() {
    this.swRegistration = null;
  }

  async init() {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      try {
        this.swRegistration = await navigator.serviceWorker.register("/sw.js");
        return true;
      } catch (error) {
        console.error("Service Worker registration failed:", error);
        return false;
      }
    }
    return false;
  }

  async subscribe() {
    // Pengecekan hostname dihapus agar bisa berjalan di localhost
    try {
      const applicationServerKey = this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      // Send subscription to server
      await fetch("/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(subscription),
      });

      return true;
    } catch (error) {
      console.error("Failed to subscribe to push notifications:", error);
      return false;
    }
  }

  async unsubscribe() {
    // Pengecekan hostname dihapus agar bisa berjalan di localhost
    try {
      const subscription =
        await this.swRegistration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();

        // Notify server about unsubscribe
        await fetch("/notifications/subscribe", {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to unsubscribe from push notifications:", error);
      return false;
    }
  }

  async isSubscribed() {
    try {
      const subscription =
        await this.swRegistration.pushManager.getSubscription();
      return !!subscription;
    } catch (error) {
      console.error("Failed to check subscription status:", error);
      return false;
    }
  }

  urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

export const pushNotificationService = new PushNotificationService();
