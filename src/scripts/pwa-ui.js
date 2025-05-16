class PWAUI {
  constructor() {
    this.installPrompt = null;
    this.offlineIndicator = null;
    this.init();
  }

  init() {
    // Buat indikator offline
    this.createOfflineIndicator();

    // Buat prompt instalasi
    this.createInstallPrompt();

    // Dengarkan event online/offline
    window.addEventListener("online", () => this.updateOfflineStatus());
    window.addEventListener("offline", () => this.updateOfflineStatus());

    // Dengarkan event beforeinstallprompt
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      this.installPrompt = e;
      this.showInstallPrompt();
    });

    // Cek status offline awal
    this.updateOfflineStatus();
  }

  createOfflineIndicator() {
    this.offlineIndicator = document.createElement("div");
    this.offlineIndicator.className = "offline-indicator";
    this.offlineIndicator.textContent = "Anda sedang offline";
    document.body.appendChild(this.offlineIndicator);
  }

  createInstallPrompt() {
    const prompt = document.createElement("div");
    prompt.className = "install-prompt";
    prompt.innerHTML = `
      <span>Pasang aplikasi ini di perangkat Anda</span>
      <button id="install-button">Pasang</button>
    `;

    const installButton = prompt.querySelector("#install-button");
    installButton.addEventListener("click", () => this.installApp());

    document.body.appendChild(prompt);
  }

  updateOfflineStatus() {
    if (!navigator.onLine) {
      this.offlineIndicator.classList.add("visible");
    } else {
      this.offlineIndicator.classList.remove("visible");
    }
  }

  showInstallPrompt() {
    const prompt = document.querySelector(".install-prompt");
    if (prompt) {
      prompt.classList.add("visible");
    }
  }

  async installApp() {
    if (!this.installPrompt) return;

    try {
      const result = await this.installPrompt.prompt();
      console.log("Hasil prompt instalasi:", result);

      // Sembunyikan prompt setelah instalasi
      const prompt = document.querySelector(".install-prompt");
      if (prompt) {
        prompt.classList.remove("visible");
      }

      this.installPrompt = null;
    } catch (error) {
      console.error("Error saat menginstal aplikasi:", error);
    }
  }
}

// Inisialisasi UI PWA saat DOM dimuat
document.addEventListener("DOMContentLoaded", () => {
  new PWAUI();
});
