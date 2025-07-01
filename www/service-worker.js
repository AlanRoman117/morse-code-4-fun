const CACHE_NAME = 'morseapp-shell-v1';
const urlsToCache = [
  './', // Represents the root of the service worker's scope (e.g., www/)
  'index.html',
  'css/style.css',
  'js/main.js',
  'js/data/bookData.js',
  'js/bookCipher.js',
  'js/kochMethod.js',
  'js/learnPracticeGame.js',
  'js/settings.js',
  'js/visualTapper.js',
  'js/privacy.js',
  'assets/icons/icon-192x192.png',
  'assets/icons/icon-512x512.png',
  'manifest.json'
  // Note: If there are other essential assets like fonts or critical images directly part of the app shell,
  // they should be added here as well. For now, focusing on the core files.
  // CDN resources (Tone.js, Tailwind, confetti, marked) are not cached by default by this SW.
];

// Install event: open cache and add app shell files
self.addEventListener('install', event => {
  console.log('[Service Worker] Install event triggered.');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Opened cache:', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[Service Worker] All specified URLs have been added to cache.');
      })
      .catch(error => {
        console.error('[Service Worker] Failed to cache URLs during install:', error);
      })
  );
});

// Activate event: clean up old caches if any
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activate event triggered.');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('ServiceWorker: Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim(); // Ensure new service worker takes control immediately
});

// Fetch event: serve cached content or fetch from network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          // Cache hit - return response
          console.log('[Service Worker] Serving from cache:', event.request.url);
          return response;
        }
        // Not in cache - fetch from network
        console.log('[Service Worker] Fetching from network:', event.request.url);
        return fetch(event.request);
      })
      .catch(error => {
        console.error('[Service Worker] Error in fetch handler:', error);
        // Optionally, you could return a custom offline page here if the fetch fails
        // and it's a navigation request. For now, just logging the error.
      })
    )
  );
});
