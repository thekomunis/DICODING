import { indexedDBService } from "./utils/indexedDB.js";

class FavoriteStories {
  constructor() {
    this.init();
  }

  async init() {
    // Tambahkan tombol favorit ke setiap cerita
    this.addFavoriteButtons();

    // Event listener untuk tombol 'Sukai Cerita' di homepage
    this.addFavoriteHomeButton();

    // Inisialisasi halaman cerita favorit
    this.initFavoritePage();
  }

  addFavoriteButtons() {
    const stories = document.querySelectorAll(".story-item");
    stories.forEach((story) => {
      const favoriteButton = document.createElement("button");
      favoriteButton.className = "favorite-button";
      favoriteButton.setAttribute("aria-label", "Tambahkan ke favorit");
      favoriteButton.innerHTML = "❤️";

      const storyId = story.dataset.id;
      this.updateFavoriteButton(favoriteButton, storyId);

      favoriteButton.addEventListener("click", async () => {
        const isFavorite = await indexedDBService.isFavorite(storyId);
        if (isFavorite) {
          await indexedDBService.removeFavoriteStory(storyId);
          this.showNotification("Cerita dihapus dari favorit.", false);
        } else {
          const storyData = {
            id: storyId,
            description: story.querySelector(".story-description").textContent,
            imageUrl: story.querySelector(".story-image").src,
            createdAt: story.dataset.createdAt,
            location: story.dataset.location,
          };
          await indexedDBService.addFavoriteStory(storyData);
          this.showNotification("Cerita berhasil disukai!", true);
        }
        this.updateFavoriteButton(favoriteButton, storyId);
      });

      story.appendChild(favoriteButton);
    });
  }

  addFavoriteHomeButton() {
    const favoriteBtns = document.querySelectorAll(".favorite-btn-home");
    favoriteBtns.forEach(async (btn) => {
      const storyId = btn.getAttribute("data-id");
      // Cek status favorit saat render
      const isFavorite = await indexedDBService.isFavorite(storyId);
      if (isFavorite) {
        btn.disabled = true;
        btn.textContent = "❤️ Disukai";
        btn.classList.add("active");
      } else {
        btn.disabled = false;
        btn.textContent = "❤️ Sukai Cerita";
        btn.classList.remove("active");
      }
      // Hapus event listener lama (dengan cloneNode hack, aman jika parentNode null)
      let targetBtn = btn;
      if (btn.parentNode) {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        targetBtn = newBtn;
      }
      targetBtn.addEventListener("click", async (e) => {
        const token = localStorage.getItem("userToken");
        if (!token) {
          window.location.hash = "#/login";
          return;
        }
        targetBtn.disabled = true; // Disable segera
        const isFavoriteNow = await indexedDBService.isFavorite(storyId);
        if (isFavoriteNow) {
          this.showNotification("Cerita sudah ada di favorit.", false);
          targetBtn.disabled = true;
          targetBtn.textContent = "❤️ Disukai";
          targetBtn.classList.add("active");
          return;
        }
        // Ambil data dari array story API global
        let storyData = null;
        if (window._storyList) {
          storyData = window._storyList.find((s) => s.id === storyId);
        }
        if (!storyData) {
          this.showNotification("Data cerita tidak ditemukan.", false);
          return;
        }
        const favoriteData = {
          id: storyData.id,
          description: storyData.description,
          imageUrl: storyData.photoUrl,
          createdAt: storyData.createdAt,
          location:
            storyData.lat && storyData.lon
              ? `${storyData.lat},${storyData.lon}`
              : "",
        };
        try {
          await indexedDBService.addFavoriteStory(favoriteData);
          this.showNotification("Cerita berhasil disukai!", true);
          targetBtn.disabled = true;
          targetBtn.textContent = "❤️ Disukai";
          targetBtn.classList.add("active");
          // Jika sedang di halaman favorites, refresh
          if (window.location.hash === "#/favorites") {
            this.initFavoritePage();
          }
        } catch (err) {
          if (err.name === "ConstraintError") {
            this.showNotification("Cerita sudah ada di favorit.", false);
          } else {
            this.showNotification("Gagal menyukai cerita.", false);
          }
          targetBtn.disabled = true;
          targetBtn.textContent = "❤️ Disukai";
          targetBtn.classList.add("active");
        }
      });
    });
  }

  showNotification(message, isSuccess) {
    let notif = document.getElementById("favorite-notification");
    if (!notif) {
      notif = document.createElement("div");
      notif.id = "favorite-notification";
      notif.style.position = "fixed";
      notif.style.bottom = "30px";
      notif.style.left = "50%";
      notif.style.transform = "translateX(-50%)";
      notif.style.background = isSuccess ? "#4caf50" : "#ff4444";
      notif.style.color = "white";
      notif.style.padding = "16px 32px";
      notif.style.borderRadius = "8px";
      notif.style.fontSize = "16px";
      notif.style.zIndex = "9999";
      notif.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
      notif.style.display = "none";
      document.body.appendChild(notif);
    }
    notif.textContent = message;
    notif.style.background = isSuccess ? "#4caf50" : "#ff4444";
    notif.style.display = "block";
    setTimeout(() => {
      notif.style.display = "none";
    }, 2000);
  }

  async updateFavoriteButton(button, storyId) {
    const isFavorite = await indexedDBService.isFavorite(storyId);
    button.classList.toggle("active", isFavorite);
    button.setAttribute("aria-pressed", isFavorite);
  }

  async initFavoritePage() {
    const favoritePage = document.getElementById("favorite-stories");
    if (!favoritePage) return;

    await indexedDBService.init(); // Pastikan DB sudah siap
    const stories = await indexedDBService.getFavoriteStories();
    this.renderFavoriteStories(stories);
  }

  renderFavoriteStories(stories) {
    const container = document.querySelector(".favorite-stories-container");
    if (!container) return;

    if (stories.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>Belum ada cerita yang disukai</p>
          <p>Klik tombol ❤️ pada cerita untuk menambahkannya ke favorit</p>
        </div>
      `;
      return;
    }

    container.innerHTML = stories
      .map(
        (story) => `
      <div class="story-item favorite-story" data-id="${
        story.id
      }" style="position: relative;">
        <img src="${story.imageUrl}" alt="${
          story.description
        }" class="story-image">
        <button class="view-detail-button btn btn-primary" aria-label="Lihat detail cerita" style="position: absolute; bottom: 12px; right: 12px; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.10); z-index: 2; font-size: 20px; background: white; border: 2px solid #4a90e2; color: #4a90e2; transition: background 0.2s, color 0.2s;">
          🔍
        </button>
        <div class="story-content">
          <p class="story-description">${story.description}</p>
          <p class="story-date">Dibuat pada: ${new Date(
            story.createdAt
          ).toLocaleString("id-ID")}</p>
          <p class="story-location">${story.location}</p>
        </div>
        <div class="favorite-actions" style="display: flex; flex-direction: row; gap: 0; margin-top: 0;">
          <button class="delete-favorite-button btn btn-secondary" aria-label="Hapus dari favorit" style="flex:1; border-radius: 0 0 8px 8px;">🗑️ Hapus</button>
        </div>
      </div>
    `
      )
      .join("");

    // Event listener tombol hapus
    container.querySelectorAll(".delete-favorite-button").forEach((button) => {
      button.addEventListener("click", async (e) => {
        e.stopPropagation();
        const storyItem = button.closest(".story-item");
        const storyId = storyItem.dataset.id;
        await indexedDBService.removeFavoriteStory(storyId);
        storyItem.remove();
        this.showNotification("Cerita dihapus dari favorit.", false);
        // Jika sudah tidak ada cerita, render ulang
        if (container.querySelectorAll(".story-item").length === 0) {
          this.renderFavoriteStories([]);
        }
      });
    });

    // Event listener tombol view detail
    container.querySelectorAll(".view-detail-button").forEach((button) => {
      button.addEventListener("click", (e) => {
        e.stopPropagation();
        const storyItem = button.closest(".story-item");
        // Ambil data asli dari stories array
        const storyId = storyItem.dataset.id;
        const story = stories.find((s) => s.id === storyId);
        this.showStoryDetailFromData(story);
      });
    });
  }

  showStoryDetailFromData(story) {
    const description = story.description;
    const imageUrl = story.imageUrl;
    const createdAt = story.createdAt;
    const locationText = story.location || "";
    let lat = null,
      lng = null;
    let isCoord = false;
    if (locationText && locationText.includes(",")) {
      const parts = locationText.split(",");
      lat = parseFloat(parts[0]);
      lng = parseFloat(parts[1]);
      isCoord = !isNaN(lat) && !isNaN(lng);
    }
    const formattedDate = createdAt
      ? new Date(createdAt).toLocaleString("en-US", { hour12: true })
      : "-";
    const modal = document.createElement("div");
    modal.className = "story-modal";
    modal.innerHTML = `
      <div class="modal-content">
        <button class="close-button" aria-label="Tutup modal">×</button>
        <img src="${imageUrl}" alt="${description}">
        <div class="modal-details" style="margin-top: 24px;">
          <p><strong>Description:</strong> ${description}</p>
          <p><strong>Created at:</strong> ${formattedDate}</p>
          <p><strong>Location:</strong> 
            ${
              isCoord
                ? `<span id='address-detail'>Loading address...</span><br>Coordinates: ${lat}, ${lng}`
                : locationText
                ? locationText
                : "<em>Tidak tersedia</em>"
            }
          </p>
          ${
            isCoord
              ? `<div id=\"map\" style=\"height: 250px; margin-top: 16px;\"></div>`
              : ""
          }
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector(".close-button").addEventListener("click", () => {
      modal.remove();
    });
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
    if (isCoord && window.L) {
      setTimeout(() => {
        const map = L.map("map").setView([lat, lng], 15);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);
        L.marker([lat, lng]).addTo(map);
      }, 100);
      fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
      )
        .then((res) => res.json())
        .then((data) => {
          const address = data.display_name || "Alamat tidak ditemukan";
          const addressSpan = modal.querySelector("#address-detail");
          if (addressSpan) addressSpan.textContent = address;
        });
    }
  }
}

// Buat satu instance global dan ekspor
export const fav = new FavoriteStories();

document.addEventListener("DOMContentLoaded", () => {
  // Tidak perlu buat instance baru
  window.addEventListener("hashchange", () => {
    if (window.location.hash === "#/favorites") {
      fav.initFavoritePage();
    }
  });
});

export function initFavoriteHomeButton() {
  fav.addFavoriteHomeButton();
}
