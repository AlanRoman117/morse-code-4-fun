// run_book_cipher.js
console.log("[wrapper] Starting run_book_cipher.js - v2");

let domContentLoadedCallback = null;

// Define morseCode globally
global.morseCode = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.', 'G': '--.', 'H': '....',
    'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---', 'P': '.--.',
    'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
    'Y': '-.--', 'Z': '--..',
    '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
    '8': '---..', '9': '----.', '0': '-----',
    '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--', '/': '-..-.',
    '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-',
    '+': '.-.-.', '-': '-....-', '_': '..--.-', '"': '.-..-.', '$': '...-..-', '@': '.--.-.-',
    ' ': '/'
};
console.log("[wrapper] global.morseCode defined.");

// Define mock document
global.document = {
    _eventListeners: {}, // Store listeners
    getElementById: function(id) {
        return null;
    },
    addEventListener: function(event, callback) {
        console.log(`[wrapper] Mock document.addEventListener called for ${event}`);
        if (event.toLowerCase() === 'domcontentloaded') {
            domContentLoadedCallback = callback;
            console.log("[wrapper] DOMContentLoaded callback captured.");
        }
        // Store other listeners if needed, though not used in this version
        if (!this._eventListeners[event]) {
            this._eventListeners[event] = [];
        }
        this._eventListeners[event].push(callback);
    },
    // Function to manually dispatch an event (simplified)
    dispatchEvent: function(event) {
        console.log(`[wrapper] Mock document.dispatchEvent called for ${event.type}`);
        if (this._eventListeners[event.type]) {
            this._eventListeners[event.type].forEach(callback => callback(event));
        }
    },
    body: {},
    querySelector: function(selector) {
        return null;
    }
};
console.log("[wrapper] global.document defined with event listener capture.");

global.localStorage = { getItem: () => null, setItem: () => null, removeItem: () => null };
console.log("[wrapper] global.localStorage defined.");
global.alert = (message) => { /* console.log(`[wrapper] Mock alert: ${message}`); */ };
console.log("[wrapper] global.alert defined.");
global.morseToText = (morse) => "mock_decoded_text";
console.log("[wrapper] global.morseToText defined.");

// Mock fetch to provide more insight
global.fetch = async function(url, options) {
    console.log(`[wrapper] global.fetch called for URL: ${url}`);
    // Check if it's a local file path we expect
    if (url.startsWith('assets/')) {
        const filePath = path.join(__dirname, url);
        console.log(`[wrapper] Attempting to read local file: ${filePath}`);
        try {
            const data = fs.readFileSync(filePath, 'utf8');
            console.log(`[wrapper] Successfully read file: ${url} (size: ${data.length})`);
            return {
                ok: true,
                status: 200,
                text: async () => data,
                json: async () => JSON.parse(data) // if needed
            };
        } catch (err) {
            console.error(`[wrapper] Error reading local file ${filePath} in mock fetch:`, err.message);
            return {
                ok: false,
                status: 404,
                statusText: `File not found: ${url}`,
                text: async () => `File not found: ${url}`,
                json: async () => ({ error: `File not found: ${url}`})
            };
        }
    }
    // Fallback for other URLs (e.g., http), though not expected here
    console.warn(`[wrapper] Unhandled fetch URL type: ${url}`);
    return { ok: false, status: 500, text: async () => "Fetch error: Unhandled URL" };
};
console.log("[wrapper] global.fetch mocked.");


const fs = require('fs');
const path = require('path');

console.log(`[wrapper] Current directory (__dirname): ${__dirname}`);
const scriptPath = path.join(__dirname, 'js', 'bookCipher.js');
console.log(`[wrapper] Path to js/bookCipher.js: ${scriptPath}`);

try {
    console.log("[wrapper] Reading js/bookCipher.js content...");
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');
    console.log("[wrapper] js/bookCipher.js content read successfully.");

    console.log("[wrapper] Creating new Function from scriptContent...");
    const runnableScript = new Function(scriptContent);
    console.log("[wrapper] Executing the runnableScript (to define event listeners, etc.)...");
    runnableScript(); // This will call document.addEventListener and capture the callback

    if (domContentLoadedCallback) {
        console.log("[wrapper] DOMContentLoaded callback was captured. Invoking it now...");
        domContentLoadedCallback(); // Manually invoke the callback
        console.log("[wrapper] DOMContentLoaded callback invoked.");
    } else {
        console.error("[wrapper] ERROR: DOMContentLoaded callback was NOT captured. Cannot proceed.");
    }

    console.log("[wrapper] Main script execution finished. Waiting for async operations (e.g., fetch within callback)...");
    setTimeout(() => {
        console.log("[wrapper] Finished waiting for async operations. Exiting.");
    }, 5000); // Wait 5 seconds for fetch operations to complete and log

} catch (error) {
    console.error("[wrapper] Error during script preparation or execution:", error);
    process.exit(1);
}

process.on('unhandledRejection', (reason, promise) => {
  console.error('[wrapper] Unhandled Rejection at:', promise, 'reason:', reason);
});
