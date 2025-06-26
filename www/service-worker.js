const CACHE_NAME = 'morseapp-shell-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/bookCipher.js',
  '/js/kochMethod.js',
  '/js/learnPracticeGame.js',
  '/js/settings.js',
  '/js/visualTapper.js',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png'
  // Note: If there are other essential assets like fonts or critical images directly part of the app shell,
  // they should be added here as well. For now, focusing on the core files.
];

// Install event: open cache and add app shell files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event: clean up old caches if any
self.addEventListener('activate', event => {
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
        // Cache hit - return response
        if (response) {
          return response;
        }
        // Not in cache - fetch from network
        return fetch(event.request);
      }
    )
  );
});
