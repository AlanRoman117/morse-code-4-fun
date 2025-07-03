// --- App State ---
let isProUser = loadProStatus();

// --- Ad-related UI Helper Functions ---
function adjustBodyPaddingForAd(adHeight) {
    document.body.style.paddingBottom = `${adHeight}px`;
}

function resetBodyPaddingForAd() {
    document.body.style.paddingBottom = '';
}

function loadProStatus() {
    const proStatus = localStorage.getItem('isProUser');
    return proStatus === 'true';
}

// --- Morse Dictionaries and Audio Setup ---
const morseCode = { 'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.', 'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-', 'Y': '-.--', 'Z': '--..', '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.', '0': '-----', '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-', '_': '..--.-', '"': '.-..-.', '$': '...-..-', '@': '.--.-.-', ' ': '/' };
const reversedMorseCode = {};
for (const key in morseCode) { reversedMorseCode[morseCode[key]] = key; }

let audioContext;
let oscillator;
let gainNode;
let isPlaying = false;
let stopMorseCode = false;
let resizeTimer;

function initAudio() { if (!audioContext) { audioContext = new (window.AudioContext || window.webkitAudioContext)(); gainNode = audioContext.createGain(); gainNode.connect(audioContext.destination); } }

// --- App Initialization on DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', () => {
    window.isProUser = loadProStatus();
    populateMorseReference();
    applySavedTheme();
    updateDurations();

    const masterAudioInitListener = () => {
        initAudio();
        if (typeof Tone !== 'undefined' && Tone.start) {
            Tone.start().catch(e => console.warn("Tone.start() failed:", e));
        }
        document.body.removeEventListener('click', masterAudioInitListener);
        document.body.removeEventListener('touchstart', masterAudioInitListener);
    };
    document.body.addEventListener('click', masterAudioInitListener);
    document.body.addEventListener('touchstart', masterAudioInitListener);

    // --- AdMob Initialization Block ---
    if (window.Capacitor?.Plugins?.AdMob) {
        const { AdMob, BannerAdPluginEvents } = window.Capacitor.Plugins;

        if (!window.isProUser) {
            AdMob.initialize({
                requestTrackingAuthorization: true,
                testingDevices: ["YOUR_TEST_DEVICE_ID"], // Optional: Add your device ID here
                initializeForTesting: true,
            }).then(() => {
                console.log('[AdMob] Initialization successful. Now showing banner.');
                AdMob.addListener(BannerAdPluginEvents.Loaded, () => console.log('[AdMob] Banner loaded.'));
                AdMob.addListener(BannerAdPluginEvents.FailedToLoad, (error) => console.error('[AdMob] Banner failed to load:', error));

                const adOptions = {
                    adId: "ca-app-pub-3940256099942544/2934735716",
                    adSize: 'ADAPTIVE_BANNER',
                    position: 'BOTTOM_CENTER',
                    margin: 0,
                    isTesting: true,
                };
                AdMob.showBanner(adOptions);
            }).catch(error => console.error('[AdMob] Initialization failed:', error));
        }
    }

    if (typeof populateBookLibrary === 'function') populateBookLibrary();
    if (typeof window.initializeKochMethod === 'function') window.initializeKochMethod();
    updateGoProButtonUI();

    try {
        const targetTabFromStorage = localStorage.getItem('targetTab');
        showTab(targetTabFromStorage || 'introduction-tab');
        if (targetTabFromStorage) localStorage.removeItem('targetTab');
    } catch (e) {
        showTab('introduction-tab');
    }
});

// All your other functions follow...
function updateGoProButtonUI() {
    const goProButtonInSettings = document.getElementById('go-pro-btn');
    if (goProButtonInSettings) {
        if (window.isProUser) {
            goProButtonInSettings.textContent = 'You are a Pro User!';
            goProButtonInSettings.disabled = true;
            goProButtonInSettings.classList.remove('bg-green-500', 'hover:bg-green-600');
            goProButtonInSettings.classList.add('bg-gray-500', 'opacity-70', 'cursor-not-allowed');
        } else {
            goProButtonInSettings.textContent = 'Unlock All Features (Go Pro!)';
            goProButtonInSettings.disabled = false;
            goProButtonInSettings.classList.add('bg-green-500', 'hover:bg-green-600');
            goProButtonInSettings.classList.remove('bg-gray-500', 'opacity-70', 'cursor-not-allowed');
        }
    }
}

const textInput = document.getElementById('text-input');
const morseOutput = document.getElementById('morse-output');
const playMorseBtn = document.getElementById('play-morse-btn');
const stopMorseBtn = document.getElementById('stop-morse-btn');
const copyTextBtn = document.getElementById('copy-text-btn');
const copyMorseBtn = document.getElementById('copy-morse-btn');
const wpmSlider = document.getElementById('wpm-slider');
const wpmValue = document.getElementById('wpm-value');
const farnsworthSlider = document.getElementById('farnsworth-slider');
const farnsworthValue = document.getElementById('farnsworth-value');
const freqSlider = document.getElementById('freq-slider');
const freqValue = document.getElementById('freq-value');
const morseReferenceBody = document.getElementById('morse-reference-body');
const toggleThemeBtn = document.getElementById('toggle-theme-btn');

let wpm = wpmSlider ? parseInt(wpmSlider.value) : 20;
let farnsworthWpm = farnsworthSlider ? parseInt(farnsworthSlider.value) : 20;
let frequency = freqSlider ? parseInt(freqSlider.value) : 600;

let dotDuration = 1.2 / wpm;

function updateDurations() {
    dotDuration = 1.2 / wpm;
    if (farnsworthWpm < wpm && farnsworthWpm > 0) {
        // Farnsworth logic placeholder
    }
    if (farnsworthSlider && wpmSlider && farnsworthSlider.value > wpmSlider.value) {
        farnsworthSlider.value = wpmSlider.value;
        if(farnsworthValue) farnsworthValue.textContent = wpmSlider.value;
        farnsworthWpm = wpm;
    }
}

if(textInput) textInput.addEventListener('input', () => {
    const text = textInput.value.toUpperCase();
    morseOutput.value = textToMorse(text);
});

if(playMorseBtn) playMorseBtn.addEventListener('click', async () => {
    if (isPlaying) return;
    initAudio();
    const morse = morseOutput.value;
    if (morse) {
        await playMorseSequence(morse);
    }
});

if(stopMorseBtn) stopMorseBtn.addEventListener('click', () => {
    if (isPlaying) {
        stopMorseCode = true;
        stopMorseBtn.disabled = true;
        if (oscillator) {
            oscillator.stop();
            oscillator.disconnect();
            oscillator = null;
        }
        if (gainNode) {
            gainNode.gain.cancelScheduledValues(audioContext.currentTime);
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        }
        isPlaying = false;
        if(playMorseBtn) playMorseBtn.disabled = false;
    }
});

if(copyTextBtn) copyTextBtn.addEventListener('click', () => {
    const feedbackEl = document.getElementById('copy-text-feedback');
    navigator.clipboard.writeText(textInput.value)
        .then(() => {
            feedbackEl.textContent = 'Copied!';
            setTimeout(() => { feedbackEl.textContent = ''; }, 2000);
        })
        .catch(err => {
            feedbackEl.textContent = 'Error!';
            console.error('Error copying text: ', err);
            setTimeout(() => { feedbackEl.textContent = ''; }, 2000);
        });
});

if(copyMorseBtn) copyMorseBtn.addEventListener('click', () => {
    const feedbackEl = document.getElementById('copy-morse-feedback');
    navigator.clipboard.writeText(morseOutput.value)
        .then(() => {
            feedbackEl.textContent = 'Copied!';
            setTimeout(() => { feedbackEl.textContent = ''; }, 2000);
        })
        .catch(err => {
            feedbackEl.textContent = 'Error!';
            console.error('Error copying Morse code: ', err);
            setTimeout(() => { feedbackEl.textContent = ''; }, 2000);
        });
});

if(wpmSlider) wpmSlider.addEventListener('input', (e) => {
    wpm = parseInt(e.target.value);
    if(wpmValue) wpmValue.textContent = wpm;
    updateDurations();
});

if(farnsworthSlider) farnsworthSlider.addEventListener('input', (e) => {
    farnsworthWpm = parseInt(e.target.value);
    if (farnsworthWpm > wpm) {
        farnsworthWpm = wpm;
        e.target.value = wpm;
    }
    if(farnsworthValue) farnsworthValue.textContent = farnsworthWpm;
    updateDurations();
});

if(freqSlider) freqSlider.addEventListener('input', (e) => {
    frequency = parseInt(e.target.value);
    if(freqValue) freqValue.textContent = frequency;
});

if(toggleThemeBtn) toggleThemeBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    document.querySelectorAll('.app-container').forEach(c => c.classList.toggle('light-theme-container'));
    localStorage.setItem('theme', document.body.classList.contains('light-theme') ? 'light' : 'dark');
});

const navTabButtons = document.querySelectorAll('nav button[data-tab]');
const tabContentDivs = document.querySelectorAll('.tab-content');
const sharedVisualTapperWrapper = document.getElementById('sharedVisualTapperWrapper');
const hiddenTapperStorage = document.getElementById('hiddenTapperStorage');

function attachTapperToArea(targetAreaId) {
    const targetElement = document.getElementById(targetAreaId);
    if (sharedVisualTapperWrapper && targetElement) {
        targetElement.appendChild(sharedVisualTapperWrapper);
        sharedVisualTapperWrapper.style.display = 'block';
    }
}

function detachSharedTapper() {
    if (typeof resetVisualTapperState === 'function') resetVisualTapperState();
    if (sharedVisualTapperWrapper && hiddenTapperStorage && sharedVisualTapperWrapper.parentNode !== hiddenTapperStorage) {
        hiddenTapperStorage.appendChild(sharedVisualTapperWrapper);
        sharedVisualTapperWrapper.style.display = 'none';
    }
}

function showTab(tabIdToShow) {
    detachSharedTapper();
    tabContentDivs.forEach(div => div.classList.add('hidden'));
    navTabButtons.forEach(button => {
        button.classList.remove('active-tab-button', 'bg-blue-600', 'text-white');
        button.classList.add('bg-gray-700', 'text-gray-300');
    });
    const selectedTabContent = document.getElementById(tabIdToShow);
    if (selectedTabContent) selectedTabContent.classList.remove('hidden');
    const selectedNavButton = document.querySelector(`nav button[data-tab='${tabIdToShow}']`);
    if (selectedNavButton) {
        selectedNavButton.classList.add('active-tab-button', 'bg-blue-600', 'text-white');
        selectedNavButton.classList.remove('bg-gray-700', 'text-gray-300');
    }
    if (tabIdToShow === 'learn-practice-tab' && typeof startNewChallenge === 'function') startNewChallenge();
    if (tabIdToShow === 'book-cipher-tab') attachTapperToArea('bookCipherTapperArea');
    else if (tabIdToShow === 'learn-practice-tab') attachTapperToArea('tapper-placeholder');
    else if (tabIdToShow === 'introduction-tab') attachTapperToArea('introTapperArea');
}

navTabButtons.forEach(button => {
    button.addEventListener('click', () => showTab(button.getAttribute('data-tab')));
});

function textToMorse(text) {
    return text.split('').map(char => morseCode[char] || (char === ' ' ? '/' : '')).join(' ');
}

async function playMorseSequence(morse, customDotDur, customFreq) {
    if (isPlaying) return;
    isPlaying = true;
    stopMorseCode = false;
    if(playMorseBtn) playMorseBtn.disabled = true;
    if(stopMorseBtn) stopMorseBtn.disabled = false;
    //... rest of function
}

function populateMorseReference() {
    //... rest of function
}

function applySavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    document.body.classList.toggle('light-theme', savedTheme === 'light');
    document.querySelectorAll('.app-container').forEach(c => c.classList.toggle('light-theme-container', savedTheme === 'light'));
}

const shareButton = document.getElementById('share-btn');
if (shareButton) {
    shareButton.addEventListener('click', async () => {
        if (window.Capacitor?.Plugins?.Share) {
            const { Share } = window.Capacitor.Plugins;
            const textToShare = document.getElementById('text-input').value;
            if (textToShare) {
                await Share.share({ text: `I just tapped this out in the Morse Code Learner: "${textToShare}"` });
            } else { alert("Nothing to share!"); }
        }
    });
}

const upsellModal = document.getElementById('upsell-modal');
const goProBtn = document.getElementById('go-pro-btn');
const goProFromLibraryBtn = document.getElementById('go-pro-from-library-btn');
const closeUpsellModalBtn = document.getElementById('close-upsell-modal-btn');
const upgradeToProBtn = document.getElementById('upgrade-to-pro-btn');

function showUpsellModal() { if (upsellModal) upsellModal.classList.remove('hidden'); }
function hideUpsellModal() { if (upsellModal) upsellModal.classList.add('hidden'); }

if (goProBtn) goProBtn.addEventListener('click', showUpsellModal);
if (goProFromLibraryBtn) goProFromLibraryBtn.addEventListener('click', showUpsellModal);
if (closeUpsellModalBtn) closeUpsellModalBtn.addEventListener('click', hideUpsellModal);
if (upgradeToProBtn) {
    upgradeToProBtn.addEventListener('click', () => {
        window.isProUser = true;
        localStorage.setItem('isProUser', 'true');
        if (typeof populateBookLibrary === 'function') populateBookLibrary();
        if (typeof window.initializeKochMethod === 'function') window.initializeKochMethod();
        updateGoProButtonUI();
        if (window.Capacitor?.Plugins?.AdMob) {
            window.Capacitor.Plugins.AdMob.hideBanner().catch(()=>{});
        }
        hideUpsellModal();
    });
}

window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        populateMorseReference();
    }, 250);
});