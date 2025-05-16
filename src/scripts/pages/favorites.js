import { fav } from "../favorite-stories.js";

export default {
  render: () => `
    <div id="favorite-stories" class="favorite-stories-page">
      <h1>Cerita Disukai</h1>
      <div class="favorite-stories-container">
        <!-- Stories will be rendered here by favorite-stories.js -->
      </div>
    </div>
  `,

  afterRender: () => {
    fav.initFavoritePage();
  },
};
