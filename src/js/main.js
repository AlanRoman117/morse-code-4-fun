import { AdMobService } from './admob.js';

// --- App Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // This runs first, setting up the basic UI
    initializeCoreUI();
});

document.addEventListener('deviceready', () => {
    // This runs second, once all plugins are ready.
    // Its ONLY job is to start the AdMob service.
    console.log('Device is ready, initializing AdMob Service...');
    AdMobService.initialize();
}, false);


function initializeCoreUI() {
    // All your other UI setup code goes here.
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
}

// Definitions needed by initializeCoreUI and other app logic
function loadProStatus() {
    const proStatus = localStorage.getItem('isProUser');
    return proStatus === 'true';
}

const morseCode = { 'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.', 'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-', 'Y': '-.--', 'Z': '--..', '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.', '0': '-----', '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-', '_': '..--.-', '"': '.-..-.', '$': '...-..-', '@': '.--.-.-', ' ': '/' };
window.morseCode = morseCode;

const reversedMorseCode = {};
for (const key in morseCode) { reversedMorseCode[morseCode[key]] = key; }
window.reversedMorseCode = reversedMorseCode;

let audioContext;
let oscillator;
let gainNode;
let isPlaying = false;
let stopMorseCode = false;
let resizeTimer;

function initAudio() { if (!audioContext) { audioContext = new (window.AudioContext || window.webkitAudioContext)(); gainNode = audioContext.createGain(); gainNode.connect(audioContext.destination); } }

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
    // Body of function was truncated in original prompt, using what was available.
    // This function will likely need its full original body to work correctly.
    // For now, this is what was provided as "the rest of the function"
    // from the original file reading in previous steps.
}

function populateMorseReference() {
    // Body of function was truncated in original prompt, using what was available.
    // This function will likely need its full original body to work correctly.
    // For now, this is what was provided as "the rest of the function"
    // from the original file reading in previous steps.
    if (!morseReferenceBody) return;
    let content = '';
    const entries = Object.entries(morseCode);
    const half = Math.ceil(entries.length / 2);
    const firstHalf = entries.slice(0, half);
    const secondHalf = entries.slice(half);

    content += '<div class="w-1/2 pr-1">'; // Tailwind class for half-width with padding
    firstHalf.forEach(([char, code]) => {
        content += `<div class="flex justify-between py-1 border-b border-gray-700"><span>${char}</span><span>${code}</span></div>`;
    });
    content += '</div>';
    content += '<div class="w-1/2 pl-1">'; // Tailwind class for half-width with padding
    secondHalf.forEach(([char, code]) => {
        content += `<div class="flex justify-between py-1 border-b border-gray-700"><span>${char}</span><span>${code}</span></div>`;
    });
    content += '</div>';
    morseReferenceBody.innerHTML = `<div class="flex">${content}</div>`; // Flex container for columns
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
        hideUpsellModal();
    });
}

window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        populateMorseReference();
    }, 250);
});