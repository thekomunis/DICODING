import { initFavoriteHomeButton } from "../favorite-stories.js";

class HomePresenter {
  constructor({ view, model }) {
    this.view = view;
    this.model = model;
    this.stories = [];

    // Bind methods to ensure correct 'this' context
    this.getLocationName = this.getLocationName.bind(this);
    this.closeStoryDetail = this.closeStoryDetail.bind(this);
  }

  async init() {
    await this.loadStories();

    // Set the location name handler in the view
    this.view.setGetLocationNameHandler(this.getLocationName);
  }

  async loadStories() {
    const result = await this.model.getStories();

    if (result.error) {
      this.view.showError(result.message);
      return;
    }

    this.stories = result.data;
    window._storyList = this.stories; // Simpan ke global agar bisa diakses fitur favorit
  }

  async render() {
    const html = this.view.renderStories(this.stories);
    return html;
  }

  async afterRender() {
    // Add event bindings
    this.view.bindAddStoryButton(() => {
      window.location.hash = "#/add-story";
    });

    this.view.bindViewDetailButtons(async (storyId) => {
      await this.showStoryDetail(storyId);
    });

    // Inisialisasi tombol Sukai Cerita di homepage
    initFavoriteHomeButton();
  }

  // Handle getting location name - moved from View to Presenter
  async getLocationName(lat, lon) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=en`
      );

      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }

      const data = await response.json();

      // Pass the location name back to the view
      const locationName = data.display_name || "Unknown location";
      this.view.initializeMapWithLocation(lat, lon, locationName);
    } catch (error) {
      console.error("Reverse geocoding failed:", error);
      this.view.initializeMapWithLocation(lat, lon, "Location not found");
    }
  }

  // Handle closing story detail
  closeStoryDetail() {
    this.view.closeStoryDetail();
  }

  async showStoryDetail(storyId) {
    const result = await this.model.getStoryById(storyId);

    if (result.error) {
      this.view.showError(result.message);
      return;
    }

    const closeButton = this.view.showStoryDetail(result.data);

    // Add close button handler
    if (closeButton) {
      closeButton.addEventListener("click", this.closeStoryDetail);
      this.view.bindCloseDetailButton(this.closeStoryDetail);
    }
  }
}

export default HomePresenter;
