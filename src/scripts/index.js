// CSS imports
import "../styles/styles.css"; // Importing global styles
import "../styles/leaflet.css"; // Importing global styles
import "@fortawesome/fontawesome-free/css/all.min.css";
import App from "./view/app"; // Importing your App class

document.addEventListener("DOMContentLoaded", async () => {
  const app = new App({
    content: document.querySelector("#main-content"),
    drawerButton: document.querySelector("#drawer-button"),
    navigationDrawer: document.querySelector("#navigation-drawer"),
  });

  try {
    await app.renderPage();
  } catch (error) {
    console.error("Error rendering page:", error);
  }

  // Event listener untuk perubahan rute saat hash berubah
  window.addEventListener("hashchange", async () => {
    const transition = document.startViewTransition(async () => {
      await app.renderPage(); // Render halaman baru dengan transisi
    });
  });

  // Event listener untuk navigasi mundur/maju di browser
  window.addEventListener("popstate", async () => {
    const transition = document.startViewTransition(async () => {
      await app.renderPage(); // Render halaman baru dengan transisi
    });
  });
});
