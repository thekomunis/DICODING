importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js"
);

const { registerRoute } = workbox.routing;
const { CacheFirst, NetworkFirst, StaleWhileRevalidate } = workbox.strategies;
const { ExpirationPlugin } = workbox.expiration;
const { precacheAndRoute } = workbox.precaching;

// Precache static assets
precacheAndRoute([
  { url: "/", revision: "1" },
  { url: "/index.html", revision: "1" },
  { url: "/manifest.json", revision: "1" },
  { url: "/styles/main.css", revision: "1" },
  { url: "/scripts/app.js", revision: "1" },
]);

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

// Cache other assets with StaleWhileRevalidate strategy
registerRoute(
  ({ request }) =>
    request.destination === "style" || request.destination === "script",
  new StaleWhileRevalidate({
    cacheName: "static-resources",
  })
);

// Handle push notifications
self.addEventListener("push", (event) => {
  const options = event.data.json();
  event.waitUntil(
    self.registration.showNotification(options.title, options.options)
  );
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/"));
});
