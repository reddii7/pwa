
const CACHE_NAME = 'wags-app-cache-v2'; // Bump version to ensure update
const URLS_TO_CACHE = [
  '/',
  '/index.html', // It's good practice to cache both the root and the explicit index file.
  '/app.js',
  '/js/router.js',
  '/js/menu.js',
  '/js/theme.js',
  '/js/pwa.js',
  '/js/pages/home.js',
  '/js/pages/scores.js',
  // NOTE: Ensure you have created placeholder files for the pages below
  // or remove them from this list if they don't exist yet.
  '/js/pages/results.js',
  '/js/pages/handicaps.js',
  '/js/pages/best14.js',
  '/js/pages/leagues.js',
  '/js/pages/rscup.js',
  '/main.css',
  '/data.json',
  'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js',
  'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap',
  '/images/icons/icon-192x192.png',
  '/images/icons/icon-512x512.png'
];

// Install event: open cache and add app shell files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

// Fetch event: serve cached content if available
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response from cache
        // If not in cache, fetch from network
        return response || fetch(event.request);
      })
  );
});

// Activate event: can be used to clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // Delete old cache
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});