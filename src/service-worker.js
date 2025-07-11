// MORSE_APP_SW_VERSION_JULES_004_SELF_BOOKDATA
importScripts('js/data/bookData.js'); // Import book data to access file paths

const CACHE_NAME = 'morseapp-shell-v3'; // Incremented cache version
let urlsToCache = [
  './', // Represents the root of the service worker's scope (e.g., www/)
  'index.html',
  'css/style.css',
  'js/main.js',
  'js/data/bookData.js', // Still cache the data definition file itself
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
  // they should be added here as well.
  // CDN resources (Tone.js, Tailwind, confetti, marked) are not cached by default by this SW.
];

// Dynamically add book content files to the cache list
if (self.bookCipherBooks) {
  for (const bookId in self.bookCipherBooks) {
    if (self.bookCipherBooks.hasOwnProperty(bookId)) {
      const book = self.bookCipherBooks[bookId];
      if (book.filePath) {
        urlsToCache.push(book.filePath);
      }
      if (book.englishSourcePath) {
        urlsToCache.push(book.englishSourcePath);
      }
    }
  }
} else {
  console.error('[Service Worker] bookCipherBooks not found. Book content files will not be cached.');
}
// Remove potential duplicates and ensure paths are relative to the service worker's scope
// The service worker is in src/, and assets are in src/assets/.
// File paths in bookData.js are already like 'assets/book_cipher_texts/...'
// If the SW is at '/service-worker.js' and assets are at '/assets/...',
// then paths like 'assets/...' are correct.
// If the SW is at '/src/service-worker.js' and assets are at '/src/assets/...',
// then paths like 'assets/...' are correct from the perspective of 'src/'.
// However, when registering, if the scope is '/', paths need to be relative to that.
// Let's assume the build process moves SW to the root or paths are adjusted.
// For now, the paths in bookData.js are assumed to be resolvable from the SW's final location.

urlsToCache = [...new Set(urlsToCache)]; // Remove duplicates, if any

// Install event: open cache and add app shell files
self.addEventListener('install', event => {
  console.log('[Service Worker] Install event triggered. Version: MORSE_APP_SW_VERSION_JULES_004_SELF_BOOKDATA');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Opened cache:', CACHE_NAME);
        // Log the final list of URLs being cached for debugging
        console.log('[Service Worker] Attempting to cache:', urlsToCache);
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[Service Worker] All specified URLs have been added to cache.');
      })
      .catch(error => {
        console.error('[Service Worker] Failed to cache URLs during install:', error, urlsToCache);
      })
  );
});

// Activate event: clean up old caches if any
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activate event triggered. Version: MORSE_APP_SW_VERSION_JULES_004_SELF_BOOKDATA');
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
          // console.log('[Service Worker] Serving from cache:', event.request.url); // Too noisy for regular fetch
          return response;
        }
        // Not in cache - fetch from network
        // console.log('[Service Worker] Fetching from network:', event.request.url); // Too noisy
        return fetch(event.request);
      })
      .catch(error => {
        console.error('[Service Worker] Error in fetch handler for:', event.request.url, error);
        // Optionally, you could return a custom offline page here if the fetch fails
        // and it's a navigation request. For now, just logging the error.
      })
    ) // Closes event.respondWith()
  } // Closes the arrow function body for 'fetch' event listener
); // Closes self.addEventListener for 'fetch'
