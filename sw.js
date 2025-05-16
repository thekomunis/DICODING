importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js"
);

const { registerRoute } = workbox.routing;
const { CacheFirst, NetworkFirst, StaleWhileRevalidate } = workbox.strategies;
const { ExpirationPlugin } = workbox.expiration;
const { precacheAndRoute, cleanupOutdatedCaches } = workbox.precaching;

// Precache static assets
precacheAndRoute([
  { url: "/dicoding/index.html", revision: "1" },
  { url: "/dicoding/manifest.json", revision: "1" },
  // { url: "/dicoding/styles.css", revision: "1" },
  // { url: "/dicoding/scripts/index.js", revision: "1" },
]);

// Clean up outdated caches
cleanupOutdatedCaches();

// Cache images with CacheFirst strategy
registerRoute(
  ({ request }) => request.destination === "image",
  new CacheFirst({
    cacheName: "images",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// Cache API requests with NetworkFirst strategy
registerRoute(
  ({ url }) => url.pathname.startsWith("/api/"),
  new NetworkFirst({
    cacheName: "api-cache",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // 5 minutes
      }),
    ],
  })
);

// Cache styles and scripts with StaleWhileRevalidate strategy
registerRoute(
  ({ request }) =>
    request.destination === "style" || request.destination === "script",
  new StaleWhileRevalidate({
    cacheName: "static-resources",
  })
);

// Handle navigation requests for SPAs
registerRoute(
  ({ request }) => request.mode === "navigate",
  new NetworkFirst({
    cacheName: "pages",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
      }),
    ],
  })
);

// Handle push notifications
self.addEventListener("push", (event) => {
  if (event.data) {
    const options = event.data.json();
    event.waitUntil(
      self.registration.showNotification(options.title, options.options)
    );
  } else {
    console.error("Push event received without data.");
  }
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/thekomunis.github.io/"));
});

// Debugging precaching issues (optional, for development)
workbox.precaching.addPlugins([
  {
    requestWillFetch: async ({ request }) => {
      console.log("Precaching:", request.url);
      return request;
    },
  },
]);
