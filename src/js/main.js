// The Final, Definitive main.js

window.isToneReady = false; // Flag to indicate if Tone.js has been successfully started

// --- App Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initializeCoreUI();
});

document.addEventListener('deviceready', () => {
    console.log('Device is ready. Attempting DIRECT AdMob-Plus initialization...');

    // Use the admob object directly
    const { AdMob } = admob.plus;

    // Listen for events right on the document
    document.addEventListener('admob.ad.load', () => {
        console.log('SUCCESS: Banner Ad Loaded');
        const { adHeight } = AdMob.banner.state;
        const nav = document.querySelector('nav');
        if (nav && adHeight > 0) {
            console.log(`Ad impression registered. Adjusting UI for height: ${adHeight}`);
            nav.style.bottom = `${adHeight}px`;
        }
    });
    document.addEventListener('admob.ad.loadfail', (evt) => {
        console.error('FAILURE: Banner Ad failed to load.', evt.data);
    });

    // Start the SDK and then show the banner
    AdMob.start()
        .then(() => {
            console.log('AdMob Plus SDK started successfully.');
            const banner = new AdMob.BannerAd({
                adUnitId: 'ca-app-pub-3940256099942544/2934735716', // Test ID
            });
            return banner.show();
        })
        .then(() => {
            console.log('Banner show() command was successful.');
        })
        .catch(error => {
            console.error('CRITICAL ERROR in AdMob chain:', error);
        });

}, false);


function initializeCoreUI() {
    // All your other UI setup code
    console.log("Initial state in initializeCoreUI: window.isToneReady =", window.isToneReady);
    window.isProUser = loadProStatus();
    populateMorseReference();
    applySavedTheme(); // Apply theme early
    updateDurations();

    const masterAudioInitListener = () => {
        console.log("masterAudioInitListener triggered.");
        initAudio(); // Initializes the Web Audio API context if needed

        if (typeof Tone !== 'undefined' && Tone.start && Tone.context) {
            if (Tone.context.state === 'running') {
                window.isToneReady = true;
                console.log("Tone.js context already running. isToneReady set to true.");
            } else {
                console.log(`Attempting Tone.start(). Current state: ${Tone.context.state}`);
                Tone.start().then(() => {
                    window.isToneReady = true;
                    console.log("Tone.start() promise RESOLVED. isToneReady is true.");
                }).catch(e => {
                    console.warn("Tone.start() promise REJECTED:", e);
                    window.isToneReady = false;
                });
                // Log state immediately after the call, before promise resolves/rejects
                if (Tone.context) { // Check context again in case something went wrong with Tone.start() itself
                    console.log("After Tone.start() call initiated, Tone.context.state is:", Tone.context.state);
                }
            }
        } else {
            console.warn("Tone, Tone.start, or Tone.context not defined in masterAudioInitListener.");
            window.isToneReady = false; // Ensure it's false if Tone isn't even available
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
        showTab(targetTabFromStorage || 'introduction-tab'); // showTab will also call applySavedTheme
        if (targetTabFromStorage) localStorage.removeItem('targetTab');
    } catch (e) {
        showTab('introduction-tab');
    }
}

// ... All your other functions ...
function loadProStatus() {
    const proStatus = localStorage.getItem('isProUser');
    return proStatus === 'true';
}

const morseCode = { 'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.', 'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-', 'Y': '-.--', 'Z': '--..', '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.', '0': '-----', '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-', '_': '..--.-', '"': '.-..-.', '$': '...-..-', '@': '.--.-.-', ' ': '/' };
window.morseCode = morseCode;

const reversedMorseCode = {};
for (const key in morseCode) { reversedMorseCode[morseCode[key]] = key; }
window.reversedMorseCode = reversedMorseCode;

// Function to convert a single Morse code string to its text equivalent
function morseToText(morse) {
    if (typeof reversedMorseCode !== 'undefined' && reversedMorseCode.hasOwnProperty(morse)) {
        return reversedMorseCode[morse];
    }
    // Return empty string or a placeholder for unknown Morse code.
    // An empty string is often less disruptive for display purposes.
    return '';
}
window.morseToText = morseToText;

let audioContext;
let oscillator;
let gainNode;
let isPlaying = false;
let stopMorseCode = false;
let resizeTimer;

function initAudio() {
    if (!audioContext && (window.AudioContext || window.webkitAudioContext)) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        gainNode = audioContext.createGain();
        gainNode.connect(audioContext.destination);
    } else if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume().catch(e => console.warn("AudioContext resume failed:", e));
    }
}

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

let wpm = 20;
let farnsworthWpm = 20;
let frequency = 600;
if (wpmSlider) wpm = parseInt(wpmSlider.value); else if (localStorage.getItem('wpm')) wpm = parseInt(localStorage.getItem('wpm'));
if (farnsworthSlider) farnsworthWpm = parseInt(farnsworthSlider.value); else if (localStorage.getItem('farnsworthWpm')) farnsworthWpm = parseInt(localStorage.getItem('farnsworthWpm'));
if (freqSlider) frequency = parseInt(freqSlider.value); else if (localStorage.getItem('frequency')) frequency = parseInt(localStorage.getItem('frequency'));


let dotDuration = 1.2 / wpm;

function updateDurations() {
    dotDuration = 1.2 / wpm;
    // Farnsworth WPM should not exceed character WPM
    if (farnsworthWpm > wpm) {
        farnsworthWpm = wpm;
        if(farnsworthSlider) farnsworthSlider.value = wpm;
        if(farnsworthValue) farnsworthValue.textContent = wpm;
    }
    // Save settings to localStorage
    localStorage.setItem('wpm', wpm.toString());
    localStorage.setItem('farnsworthWpm', farnsworthWpm.toString());
    localStorage.setItem('frequency', frequency.toString());
}

if(textInput) textInput.addEventListener('input', () => {
    const text = textInput.value; // Keep case for potential future use, convert to Morse in function
    if(morseOutput) morseOutput.value = textToMorse(text);
});

if(playMorseBtn) playMorseBtn.addEventListener('click', async () => {
    if (isPlaying) return;
    initAudio();
    const morse = morseOutput ? morseOutput.value : "";
    if (morse) {
        await playMorseSequence(morse, null, null, 'tapper', 'playMorseBtn');
    }
});

if(stopMorseBtn) stopMorseBtn.addEventListener('click', () => {
    if (isPlaying) {
        stopMorseCode = true;
        if(stopMorseBtn) stopMorseBtn.disabled = true;
        if (oscillator) {
            try { oscillator.stop(); } catch(e) { /* ignore if already stopped */ }
            oscillator.disconnect();
            oscillator = null;
        }
        if (gainNode && audioContext) {
            gainNode.gain.cancelScheduledValues(audioContext.currentTime);
            gainNode.gain.setValueAtTime(gainNode.gain.value, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.01);
        }
        isPlaying = false;
        if(playMorseBtn) playMorseBtn.disabled = false;
    }
});

if(copyTextBtn) copyTextBtn.addEventListener('click', () => {
    const feedbackEl = document.getElementById('copy-text-feedback');
    if (textInput && navigator.clipboard) {
        navigator.clipboard.writeText(textInput.value)
            .then(() => {
                if(feedbackEl) feedbackEl.textContent = 'Copied!';
                setTimeout(() => { if(feedbackEl) feedbackEl.textContent = ''; }, 2000);
            })
            .catch(err => {
                if(feedbackEl) feedbackEl.textContent = 'Error copying!';
                console.error('Error copying text: ', err);
                setTimeout(() => { if(feedbackEl) feedbackEl.textContent = ''; }, 2000);
            });
    } else if (feedbackEl) {
        feedbackEl.textContent = 'Cannot copy.';
        setTimeout(() => { if(feedbackEl) feedbackEl.textContent = ''; }, 2000);
    }
});

if(copyMorseBtn) copyMorseBtn.addEventListener('click', () => {
    const feedbackEl = document.getElementById('copy-morse-feedback');
    if (morseOutput && navigator.clipboard) {
        navigator.clipboard.writeText(morseOutput.value)
            .then(() => {
                if(feedbackEl) feedbackEl.textContent = 'Copied!';
                setTimeout(() => { if(feedbackEl) feedbackEl.textContent = ''; }, 2000);
            })
            .catch(err => {
                if(feedbackEl) feedbackEl.textContent = 'Error copying!';
                console.error('Error copying Morse code: ', err);
                setTimeout(() => { if(feedbackEl) feedbackEl.textContent = ''; }, 2000);
            });
    } else if (feedbackEl) {
        feedbackEl.textContent = 'Cannot copy.';
        setTimeout(() => { if(feedbackEl) feedbackEl.textContent = ''; }, 2000);
    }
});

if(wpmSlider) wpmSlider.addEventListener('input', (e) => {
    wpm = parseInt(e.target.value);
    if(wpmValue) wpmValue.textContent = wpm;
    updateDurations();
});

if(farnsworthSlider) farnsworthSlider.addEventListener('input', (e) => {
    farnsworthWpm = parseInt(e.target.value);
    if(farnsworthValue) farnsworthValue.textContent = farnsworthWpm;
    updateDurations();
});

if(freqSlider) freqSlider.addEventListener('input', (e) => {
    frequency = parseInt(e.target.value);
    if(freqValue) freqValue.textContent = frequency;
    updateDurations(); // Frequency doesn't change dot duration, but good practice to call update.
});

if(toggleThemeBtn) toggleThemeBtn.addEventListener('click', () => {
    const bodyClassList = document.body.classList;
    bodyClassList.toggle('light-theme');
    bodyClassList.toggle('dark');
    const currentTheme = bodyClassList.contains('light-theme') ? 'light' : 'dark';
    localStorage.setItem('theme', currentTheme);
    applySavedTheme();
});

const navTabButtons = document.querySelectorAll('nav button[data-tab]');
const tabContentDivs = document.querySelectorAll('.tab-content');
const sharedVisualTapperWrapper = document.getElementById('sharedVisualTapperWrapper');
const hiddenTapperStorage = document.getElementById('hiddenTapperStorage');

function attachTapperToArea(targetAreaId) {
    const targetElement = document.getElementById(targetAreaId);
    const tapperItself = document.getElementById('tapper'); // Get the tapper element itself

    if (sharedVisualTapperWrapper && targetElement) {
        targetElement.appendChild(sharedVisualTapperWrapper);
        sharedVisualTapperWrapper.style.display = 'block';

        if (tapperItself) {
            if (targetAreaId === 'bookCipherTapperArea') {
                tapperItself.classList.add('tapper-book-cipher');
            } else {
                // Ensure the class is removed if attached to any other area
                tapperItself.classList.remove('tapper-book-cipher');
            }
        }
    }
}
window.attachTapperToArea = attachTapperToArea;

function detachSharedTapper() {
    if (typeof resetVisualTapperState === 'function') resetVisualTapperState();
    const tapperItself = document.getElementById('tapper'); // Get the tapper element itself

    if (sharedVisualTapperWrapper && hiddenTapperStorage && sharedVisualTapperWrapper.parentNode !== hiddenTapperStorage) {
        hiddenTapperStorage.appendChild(sharedVisualTapperWrapper);
        sharedVisualTapperWrapper.style.display = 'none';
        if (tapperItself) {
            tapperItself.classList.remove('tapper-book-cipher'); // Remove class when detaching
        }
    }
}
window.detachSharedTapper = detachSharedTapper;

function showTab(tabIdToShow) {
    const currentActiveButton = document.querySelector('nav button.active-tab-button');
    const currentActiveTabId = currentActiveButton ? currentActiveButton.getAttribute('data-tab') : null;

    if (window.isPlayingStoryPlayback) {
        window.isPlayingStoryPlayback = false; // Always stop playback sound/loop first
        if (currentActiveTabId && tabIdToShow !== currentActiveTabId) {
            // Only set navigatingAway if it's a TRULY different tab
            console.log(`[showTab] Playback active, switching to a DIFFERENT tab (${tabIdToShow} from ${currentActiveTabId}). Setting navigatingAwayFromPlayback=true.`);
            window.navigatingAwayFromPlayback = true;
        } else if (currentActiveTabId && tabIdToShow === currentActiveTabId) {
            console.log(`[showTab] Playback active, clicked SAME tab (${tabIdToShow}). NOT setting navigatingAwayFromPlayback. Playback will stop, view should refresh via finally.`);
            // Ensure navigatingAwayFromPlayback is false, so the finally block in playback does its full refresh.
            // This is important because the finally block always resets it to false AFTER its check.
            // If it was true from a previous different-tab navigation that got interrupted, we need to clear it here.
            window.navigatingAwayFromPlayback = false;
        } else {
             // Fallback if no currentActiveTabId found, or some other oddity, treat as navigation (safer to stop full reinit)
            console.log(`[showTab] Playback active, currentActiveTabId not found or tabIdToShow is unusual. Setting navigatingAwayFromPlayback=true.`);
            window.navigatingAwayFromPlayback = true;
        }
    }
    // console.log(`[showTab] Called with tabIdToShow: ${tabIdToShow}`);
    window.detachSharedTapper(); // Ensure using window. prefix
    tabContentDivs.forEach(div => div.classList.add('hidden'));

    const selectedTabContent = document.getElementById(tabIdToShow);
    if (selectedTabContent) {
        selectedTabContent.classList.remove('hidden');
        // console.log(`[showTab] Made tab ${tabIdToShow} visible.`);
    } else {
        // console.warn(`[showTab] Tab content not found for ${tabIdToShow}`);
    }

    navTabButtons.forEach(button => {
        if (button.getAttribute('data-tab') === tabIdToShow) {
            button.classList.add('active-tab-button');
        } else {
            button.classList.remove('active-tab-button');
        }
    });
    // console.log(`[showTab] Updated nav button active states.`);

    applySavedTheme();

    if (tabIdToShow === 'learn-practice-tab' && typeof startNewChallenge === 'function') {
        // console.log(`[showTab] Initializing learn-practice-tab specific content.`);
        startNewChallenge();
    }

    if (tabIdToShow === 'book-cipher-tab') {
        // console.log(`[showTab] Target is 'book-cipher-tab'. Checking for library functions on window object.`);
        if (typeof window.populateFilterDropdowns === 'function') {
            // console.log(`[showTab] Calling window.populateFilterDropdowns for book-cipher-tab.`);
            window.populateFilterDropdowns();
        } else {
            // console.warn(`[showTab] window.populateFilterDropdowns function not found for book-cipher-tab.`);
        }
        if (typeof window.populateBookLibrary === 'function') {
            // console.log(`[showTab] Calling window.populateBookLibrary for book-cipher-tab.`);
            window.populateBookLibrary();
        } else {
            // console.warn(`[showTab] window.populateBookLibrary function not found for book-cipher-tab.`);
        }
    }

    // Attach tapper to relevant areas based on the active tab
    if (sharedVisualTapperWrapper) {
        if (tabIdToShow === 'book-cipher-tab') {
            attachTapperToArea('bookCipherTapperArea');
        } else if (tabIdToShow === 'learn-practice-tab') {
            attachTapperToArea('tapper-placeholder');
        } else if (tabIdToShow === 'introduction-tab') {
            attachTapperToArea('introTapperArea');
        } else if (tabIdToShow === 'morse-io-tab') {
            attachTapperToArea('ioTabTapperPlaceholder');
        }
    }
    localStorage.setItem('lastTab', tabIdToShow);
}

navTabButtons.forEach(button => {
    button.addEventListener('click', () => showTab(button.getAttribute('data-tab')));
});

function textToMorse(text) {
    return text.toUpperCase().split('').map(char => morseCode[char] || (char === ' ' ? '/' : '')).join(' ');
}

async function playMorseSequence(morse, customDotDur, customFreq, elementToGlowId, initiatingButtonId) { // Added initiatingButtonId
    if (isPlaying) return;
    isPlaying = true;
    stopMorseCode = false;

    let actualButtonToDisable = null;
    const learnPracticePlayBtn = document.getElementById('play-tapped-morse-btn');
    const ioTapperPlayBtn = document.getElementById('play-io-tapped-morse-btn');
    // playMorseBtn is global (for main I/O textarea playback)

    if (initiatingButtonId === 'playMorseBtn') {
        actualButtonToDisable = playMorseBtn;
    } else if (initiatingButtonId === 'play-tapped-morse-btn') {
        actualButtonToDisable = learnPracticePlayBtn;
    } else if (initiatingButtonId === 'play-io-tapped-morse-btn') {
        actualButtonToDisable = ioTapperPlayBtn;
    }
    // If initiatingButtonId is something else or null, actualButtonToDisable remains null.
    // This logic prioritizes the initiatingButtonId for disabling.

    if (actualButtonToDisable) actualButtonToDisable.disabled = true;
    if (stopMorseBtn) stopMorseBtn.disabled = false; // Stop button is global for any playback

    const elementToGlow = elementToGlowId ? document.getElementById(elementToGlowId) : null;

    const charSpeedWpm = wpm; // Speed of individual dits and dahs
    const overallSpeedWpm = (farnsworthWpm < charSpeedWpm && farnsworthWpm > 0) ? farnsworthWpm : charSpeedWpm;

    const unitDur = customDotDur || (1.2 / charSpeedWpm); // Duration of one dot, based on char speed

    // Calculate delays based on overall speed for Farnsworth, otherwise char speed
    let interElementDelay = unitDur; // Space between dits/dahs of a character
    let shortGap = unitDur * 3;      // Space between characters
    let mediumGap = unitDur * 7;     // Space between words (for '/')

    if (overallSpeedWpm < charSpeedWpm) { // Farnsworth timing applies
        const spaceExtensionRatio = charSpeedWpm / overallSpeedWpm;
        if (spaceExtensionRatio > 1) {
            let spacingUnitDur = 1.2 / overallSpeedWpm;
            shortGap = spacingUnitDur * 3;
            mediumGap = spacingUnitDur * 7;
        }
    }

    const currentFreq = customFreq || frequency;

    for (let i = 0; i < morse.length; i++) {
        if (stopMorseCode) break;
        const char = morse[i];
        let durationToPlay = 0;
        let silenceAfterElement = interElementDelay;

        switch (char) {
            case '.':
                durationToPlay = unitDur;
                break;
            case '-':
                durationToPlay = unitDur * 3;
                break;
            case ' ':
                durationToPlay = 0;
                silenceAfterElement = shortGap - interElementDelay;
                break;
            case '/':
                durationToPlay = 0;
                silenceAfterElement = mediumGap - interElementDelay;
                break;
        }

        if (durationToPlay > 0) {
            if (elementToGlow) elementToGlow.classList.add('active');
            await playTone(currentFreq, durationToPlay);
            if (elementToGlow) elementToGlow.classList.remove('active');
        }

        const isLastElementOfChar = (i < morse.length - 1 && (morse[i+1] === ' ' || morse[i+1] === '/'));
        const isLastElementOverall = (i === morse.length - 1);

        if (!isLastElementOfChar && !isLastElementOverall && durationToPlay > 0) {
             await delay(interElementDelay);
        } else if (silenceAfterElement > 0 && (char === ' ' || char === '/')) {
            await delay(silenceAfterElement);
        } else if (isLastElementOfChar && durationToPlay > 0) {
            await delay(interElementDelay);
        }
    }

    if (!stopMorseCode) {
      if(actualButtonToDisable) actualButtonToDisable.disabled = false;
      if(stopMorseBtn) stopMorseBtn.disabled = true;
    }
    isPlaying = false;
    if (elementToGlow) elementToGlow.classList.remove('active');
    if (oscillator && !stopMorseCode) {
        try { oscillator.stop(); } catch(e) {/* ignore */}
        oscillator.disconnect();
        oscillator = null;
    }
}

function playTone(freq, durationSeconds) {
    return new Promise((resolve) => {
        if (!audioContext) initAudio();
        if (!audioContext || audioContext.state === 'closed') {
            console.warn("AudioContext not available or closed for playTone.");
            resolve();
            return;
        }
        if (audioContext.state === 'suspended') {
             audioContext.resume().catch(e => console.warn("AudioContext resume failed:", e));
        }

        let currentOscillator = audioContext.createOscillator();
        currentOscillator.type = 'sine';
        currentOscillator.frequency.setValueAtTime(freq, audioContext.currentTime);

        if (!gainNode) {
            gainNode = audioContext.createGain();
            gainNode.connect(audioContext.destination);
        }

        currentOscillator.connect(gainNode);
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(1, audioContext.currentTime + 0.005);

        currentOscillator.start(audioContext.currentTime);

        gainNode.gain.setValueAtTime(1, audioContext.currentTime + durationSeconds - 0.005);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + durationSeconds);

        currentOscillator.stop(audioContext.currentTime + durationSeconds);

        currentOscillator.onended = () => {
            try {
                currentOscillator.disconnect();
            } catch(e) {/* ignore if already disconnected */}
            resolve();
        };
        oscillator = currentOscillator;
    });
}

function delay(durationSeconds) {
    return new Promise(resolve => setTimeout(resolve, durationSeconds * 1000));
}

function populateMorseReference() {
    if (!morseReferenceBody) {
        return;
    }
    morseReferenceBody.innerHTML = '';

    const entries = Object.entries(morseCode);
    const numEntries = entries.length;

    const isDesktop = window.matchMedia('(min-width: 768px)').matches;
    const pairsPerRow = isDesktop ? 4 : 2;

    for (let i = 0; i < numEntries; i += pairsPerRow) {
        const tr = document.createElement('tr');
        for (let j = 0; j < pairsPerRow; j++) {
            const entryIndex = i + j;
            if (entryIndex < numEntries) {
                const char = entries[entryIndex][0];
                const code = entries[entryIndex][1];

                let idChar = char;
                if (char === '.') idChar = 'Period';
                else if (char === ',') idChar = 'Comma';
                else if (char === '?') idChar = 'QuestionMark';
                else if (char === "'") idChar = 'Apostrophe';
                else if (char === '!') idChar = 'ExclamationMark';
                else if (char === '/') idChar = 'Slash';
                else if (char === '(') idChar = 'ParenthesisOpen';
                else if (char === ')') idChar = 'ParenthesisClose';
                else if (char === '&') idChar = 'Ampersand';
                else if (char === ':') idChar = 'Colon';
                else if (char === ';') idChar = 'Semicolon';
                else if (char === '=') idChar = 'Equals';
                else if (char === '+') idChar = 'Plus';
                else if (char === '-') idChar = 'Hyphen';
                else if (char === '_') idChar = 'Underscore';
                else if (char === '"') idChar = 'Quote';
                else if (char === '$') idChar = 'Dollar';
                else if (char === '@') idChar = 'AtSign';
                else if (char === ' ') idChar = 'Space';

                const tdChar = document.createElement('td');
                tdChar.textContent = char;
                tdChar.id = `ref-char-${idChar}`;
                tr.appendChild(tdChar);

                const tdMorse = document.createElement('td');
                tdMorse.textContent = code;
                tdMorse.id = `ref-morse-${idChar}`;
                tdMorse.classList.add('font-mono');
                tr.appendChild(tdMorse);
            } else {
                const tdCharEmpty = document.createElement('td');
                tdCharEmpty.innerHTML = '&nbsp;';
                tr.appendChild(tdCharEmpty);
                const tdMorseEmpty = document.createElement('td');
                tdMorseEmpty.innerHTML = '&nbsp;';
                tr.appendChild(tdMorseEmpty);
            }
        }
        morseReferenceBody.appendChild(tr);
    }
}

function applySavedTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const isLight = savedTheme === 'light';
    document.body.classList.toggle('light-theme', isLight);
    document.body.classList.toggle('dark', !isLight);

    document.querySelectorAll('.app-container').forEach(c => {
        c.classList.toggle('light-theme-container', isLight);
        c.classList.toggle('dark-theme-container', !isLight);
    });

    // Explicitly style #pro-upsell-modal elements based on theme
    const proModalContentDiv = document.querySelector('#pro-upsell-modal > div');
    const proModalTitle = document.querySelector('#pro-upsell-modal h2');
    const proModalParagraph = document.querySelector('#pro-upsell-modal p');
    const proModalBenefitsTitle = document.querySelector('#pro-upsell-modal h3');
    const proModalBenefitsList = document.querySelector('#pro-upsell-modal ul');
    const proModalCloseButton = document.getElementById('close-pro-upsell-modal-top');
    const goProBtnInsideModal = document.querySelector('#pro-upsell-modal #go-pro-button');
    const returnToLibraryBtnInsideModal = document.querySelector('#pro-upsell-modal #return-to-library-button');


    if (proModalContentDiv) {
        // Clear existing theme classes more thoroughly
        proModalContentDiv.classList.remove('bg-white', 'dark:bg-gray-800', 'text-gray-700', 'dark:text-white', 'dark');
        if (proModalTitle) proModalTitle.classList.remove('text-yellow-600', 'dark:text-yellow-400');
        if (proModalParagraph) proModalParagraph.classList.remove('text-gray-600', 'dark:text-gray-300');
        if (proModalBenefitsTitle) proModalBenefitsTitle.classList.remove('text-yellow-700', 'dark:text-yellow-300');
        if (proModalBenefitsList) proModalBenefitsList.classList.remove('text-gray-600', 'dark:text-gray-300');
        if (proModalCloseButton) proModalCloseButton.classList.remove('text-gray-500', 'hover:text-gray-700', 'dark:text-gray-400', 'dark:hover:text-white');

        // Remove classes from buttons inside this modal before re-applying
        if(goProBtnInsideModal) goProBtnInsideModal.classList.remove(
            'bg-green-500', 'hover:bg-green-600', 'text-white', // Old base/light
            'dark:bg-green-600', 'dark:hover:bg-green-700', // Old dark
            'bg-green-600', 'text-black', 'hover:bg-green-700', // New light
            'dark:bg-green-600', 'dark:text-black', 'dark:hover:bg-green-700' // New dark
        );
        if(returnToLibraryBtnInsideModal) returnToLibraryBtnInsideModal.classList.remove(
            'bg-gray-500', 'hover:bg-gray-600', 'text-white', // Old base/light
            'dark:bg-gray-600', 'dark:hover:bg-gray-700', // Old dark
            'bg-gray-200', 'text-gray-800', 'hover:bg-gray-300', // New light
            'dark:bg-gray-800', 'dark:text-gray-200', 'dark:hover:bg-gray-700' // New dark
        );


        if (isLight) {
            proModalContentDiv.classList.add('bg-white', 'text-gray-700');
            if (proModalTitle) proModalTitle.classList.add('text-yellow-600');
            if (proModalParagraph) proModalParagraph.classList.add('text-gray-600');
            if (proModalBenefitsTitle) proModalBenefitsTitle.classList.add('text-yellow-700');
            if (proModalBenefitsList) proModalBenefitsList.classList.add('text-gray-600');
            if (proModalCloseButton) proModalCloseButton.classList.add('text-gray-500', 'hover:text-gray-700'); // OK for AA

            if(goProBtnInsideModal) goProBtnInsideModal.classList.add('bg-green-600', 'text-black', 'hover:bg-green-700');
            if(returnToLibraryBtnInsideModal) returnToLibraryBtnInsideModal.classList.add('bg-gray-200', 'text-gray-800', 'hover:bg-gray-300');

        } else { // isDark
            proModalContentDiv.classList.add('dark', 'bg-gray-800', 'text-white');
            if (proModalTitle) proModalTitle.classList.add('text-yellow-400');
            if (proModalParagraph) proModalParagraph.classList.add('text-gray-300');
            if (proModalBenefitsTitle) proModalBenefitsTitle.classList.add('text-yellow-300');
            if (proModalBenefitsList) proModalBenefitsList.classList.add('text-gray-300');
            if (proModalCloseButton) proModalCloseButton.classList.add('dark:text-gray-400', 'dark:hover:text-white'); // AA, hover AAA

            if(goProBtnInsideModal) goProBtnInsideModal.classList.add('dark:bg-green-600', 'dark:text-black', 'dark:hover:bg-green-700');
            if(returnToLibraryBtnInsideModal) returnToLibraryBtnInsideModal.classList.add('dark:bg-gray-800', 'dark:text-gray-200', 'dark:hover:bg-gray-700');
        }
    }

    // General Upsell Modal (#upsell-modal)
    const generalUpsellModalContentDiv = document.querySelector('#upsell-modal > div');
    const generalUpsellModalTitle = document.querySelector('#upsell-modal h2.text-purple-600'); // Watch out for querySelector using specific color class
    const generalUpsellModalParagraph = document.querySelector('#upsell-modal p.text-lg.mb-4');
    const generalUpsellModalList = document.querySelector('#upsell-modal ul.list-disc');
    const generalUpsellModalListItems = document.querySelectorAll('#upsell-modal ul li');
    const generalUpsellModalListSvgs = document.querySelectorAll('#upsell-modal ul li svg'); // General SVG
    const generalUpsellModalCloseBtn = document.getElementById('close-upsell-modal-btn');
    const generalUpsellModalSmallText = document.querySelector('#upsell-modal p.text-xs.text-gray-500');
    const generalUpsellModalUpgradeBtn = document.getElementById('upgrade-to-pro-btn');

    if (generalUpsellModalContentDiv) {
        // Clear existing classes
        generalUpsellModalContentDiv.classList.remove('dark', 'bg-white', 'text-gray-800', 'dark:bg-gray-700', 'dark:text-gray-100');
        if (generalUpsellModalTitle) generalUpsellModalTitle.classList.remove('text-purple-600', 'dark:text-purple-400');
        if (generalUpsellModalParagraph) generalUpsellModalParagraph.classList.remove('text-gray-800', 'dark:text-gray-100');
        if (generalUpsellModalList) generalUpsellModalList.classList.remove('text-gray-800', 'dark:text-gray-100');
        if (generalUpsellModalCloseBtn) generalUpsellModalCloseBtn.classList.remove('text-gray-600', 'hover:text-gray-800', 'dark:text-gray-300', 'dark:hover:text-gray-100', 'dark:text-gray-200', 'dark:hover:text-white');
        if (generalUpsellModalSmallText) generalUpsellModalSmallText.classList.remove('text-gray-500', 'dark:text-gray-400');
        generalUpsellModalListItems.forEach(li => li.classList.remove('text-gray-800', 'dark:text-gray-100'));
        generalUpsellModalListSvgs.forEach(svg => svg.classList.remove('text-green-500', 'dark:text-green-400'));

        if(generalUpsellModalUpgradeBtn) generalUpsellModalUpgradeBtn.classList.remove(
            'bg-purple-600', 'hover:bg-purple-700', 'text-white', // Old base/light
            'dark:bg-purple-500', 'dark:hover:bg-purple-600', // Old dark
            'bg-purple-900', 'hover:bg-purple-800', // Base HTML new
            'bg-purple-200', 'text-purple-900', 'hover:bg-purple-300', // New light
            'dark:bg-purple-900', 'dark:text-white', 'dark:hover:bg-purple-800' // New dark
         );

        if (isLight) {
            generalUpsellModalContentDiv.classList.add('bg-white', 'text-gray-800');
            if (generalUpsellModalTitle) generalUpsellModalTitle.classList.add('text-purple-600'); // This purple is fine on white
            if (generalUpsellModalParagraph) generalUpsellModalParagraph.classList.add('text-gray-800');
            if (generalUpsellModalList) generalUpsellModalList.classList.add('text-gray-800');
            if (generalUpsellModalCloseBtn) generalUpsellModalCloseBtn.classList.add('text-gray-700', 'hover:text-gray-900'); // AA
            if (generalUpsellModalSmallText) generalUpsellModalSmallText.classList.add('text-gray-500');
            generalUpsellModalListItems.forEach(li => li.classList.add('text-gray-800'));
            generalUpsellModalListSvgs.forEach(svg => svg.classList.add('text-green-500')); // Green on white is fine
            if(generalUpsellModalUpgradeBtn) generalUpsellModalUpgradeBtn.classList.add('bg-purple-200', 'text-purple-900', 'hover:bg-purple-300');
        } else { // isDark
            generalUpsellModalContentDiv.classList.add('dark', 'bg-gray-700', 'text-gray-100');
            if (generalUpsellModalTitle) generalUpsellModalTitle.classList.add('text-purple-400'); // Purple-400 on gray-700 is ok
            if (generalUpsellModalParagraph) generalUpsellModalParagraph.classList.add('text-gray-100');
            if (generalUpsellModalList) generalUpsellModalList.classList.add('text-gray-100');
            if (generalUpsellModalCloseBtn) generalUpsellModalCloseBtn.classList.add('dark:text-gray-200', 'dark:hover:text-white'); // AA
            if (generalUpsellModalSmallText) generalUpsellModalSmallText.classList.add('dark:text-gray-400');
            generalUpsellModalListItems.forEach(li => li.classList.add('text-gray-100'));
            generalUpsellModalListSvgs.forEach(svg => svg.classList.add('text-green-400')); // Green-400 on gray-700 is ok
            if(generalUpsellModalUpgradeBtn) generalUpsellModalUpgradeBtn.classList.add('dark:bg-purple-900', 'dark:text-white', 'dark:hover:bg-purple-800');
        }
    }

    // START of updated navTabButtons styling logic
    navTabButtons.forEach(button => {
        const isActive = button.classList.contains('active-tab-button');

        // Define classes based on state and theme
        let classesToAdd = [];
        const classesToRemove = [
            // Old Light Active & New Light Active (to clean before adding)
            'bg-blue-600', 'hover:bg-blue-700', 'text-white', // Old light active
            'bg-blue-200', 'text-blue-900', 'hover:bg-blue-300', 'hover:text-blue-900', // New light active
            // Old Light Inactive & New Light Inactive
            'bg-gray-200', 'text-gray-700', 'hover:bg-gray-300', // Old light inactive
            'bg-gray-100', 'text-gray-900', 'hover:bg-gray-200', 'hover:text-gray-900', // New light inactive

            // Old Dark Active (Various forms) & New Dark Active
            'dark:bg-gradient-to-b', 'dark:from-blue-600', 'dark:to-blue-800', // Old gradient
            'dark:hover:from-blue-500', 'dark:hover:to-blue-700', // Old gradient hover
            'dark:bg-blue-500', 'dark:text-gray-100', 'dark:hover:bg-blue-600', // Another old dark active
            'dark:bg-blue-900', 'dark:text-white', 'dark:hover:bg-blue-800', 'dark:hover:text-white', // New dark active

            // Old Dark Inactive & New Dark Inactive
            'bg-gray-700', 'text-gray-300', 'hover:bg-gray-600', // Base HTML dark classes often acted as inactive
            'dark:bg-gray-700', 'dark:text-gray-300', 'dark:hover:bg-gray-600', // Explicit old dark inactive
            'dark:bg-gray-800', 'dark:text-gray-400', 'dark:hover:bg-gray-700', 'dark:hover:text-gray-300', // Another old dark inactive
            'dark:text-gray-200', 'dark:hover:text-gray-200', // New dark inactive text and hover text

            // General text colors that might conflict from various states
            'text-white', 'dark:text-white', 'text-gray-300', 'dark:text-gray-100', 'dark:text-gray-300', 'dark:text-gray-400'
        ];

        button.classList.remove(...[...new Set(classesToRemove)]); // Remove all potential conflicting classes

        if (isActive) {
            if (isLight) {
                // WCAG AAA: bg-blue-200 (#BFDBFE) text-blue-900 (#1E3A8A) -> Contrast: 7.01:1
                // Hover: bg-blue-300 (#93C5FD) text-blue-900 (#1E3A8A) -> Contrast: 5.13:1 (AA)
                classesToAdd = ['bg-blue-200', 'text-blue-900', 'hover:bg-blue-300', 'hover:text-blue-900'];
            } else { // isDark
                // WCAG AAA: dark:bg-blue-900 (#1E3A8A) dark:text-white (#FFFFFF) -> Contrast: 7.63:1
                // Hover: dark:bg-blue-800 (#1E40AF) dark:text-white (#FFFFFF) -> Contrast: 6.08:1 (AA)
                classesToAdd = ['dark:bg-blue-900', 'dark:text-white', 'dark:hover:bg-blue-800', 'dark:hover:text-white'];
            }
        } else { // isInactive
            if (isLight) {
                // WCAG AAA: bg-gray-100 (#F3F4F6) text-gray-900 (#111827) -> Contrast: 14.7:1
                // Hover: bg-gray-200 (#E5E7EB) text-gray-900 (#111827) -> Contrast: 12.25:1
                classesToAdd = ['bg-gray-100', 'text-gray-900', 'hover:bg-gray-200', 'hover:text-gray-900'];
            } else { // isDark
                // WCAG AAA: dark:bg-gray-800 (#1F2937) dark:text-gray-200 (#E5E7EB) -> Contrast: 7.73:1
                // Hover: dark:bg-gray-700 (#374151) dark:text-gray-200 (#E5E7EB) -> Contrast: 6.18:1 (AA)
                classesToAdd = ['dark:bg-gray-800', 'dark:text-gray-200', 'dark:hover:bg-gray-700', 'dark:hover:text-gray-200'];
            }
        }
        button.classList.add(...classesToAdd);
    });
    // END of updated navTabButtons styling logic

    if (morseReferenceBody) {
         morseReferenceBody.querySelectorAll('.border-b').forEach(el => {
            el.classList.toggle('border-gray-300', isLight);
            el.classList.toggle('dark:border-gray-700', !isLight);
         });
    }
    if (toggleThemeBtn) {
        toggleThemeBtn.textContent = isLight ? 'Dark Mode' : 'Light Mode';
    }
}

const shareButton = document.getElementById('share-btn');
if (shareButton) {
    shareButton.addEventListener('click', async () => {
        const textVal = textInput ? textInput.value : "";
        const feedbackEl = document.getElementById('share-feedback');

        if (window.Capacitor?.Plugins?.Share) {
            const { Share } = window.Capacitor.Plugins;
            if (textVal) {
                try {
                    await Share.share({ text: `I just tapped this out in the Morse Code Learner: "${textVal}"` });
                } catch (shareError) {
                    console.error("Share error (Capacitor):", shareError);
                    if(feedbackEl) feedbackEl.textContent = 'Share failed.';
                    setTimeout(() => { if(feedbackEl) feedbackEl.textContent = ''; }, 2000);
                }
            } else {
                if(feedbackEl) feedbackEl.textContent = 'Nothing to share!';
                setTimeout(() => { if(feedbackEl) feedbackEl.textContent = ''; }, 2000);
            }
        } else if (navigator.share) { // Fallback to Web Share API
             if (textVal) {
                try {
                    await navigator.share({
                        title: 'Morse Code Message',
                        text: `I just tapped this out in the Morse Code Learner: "${textVal}"`,
                    });
                } catch (error) {
                    console.error('Web Share API error:', error);
                    if(feedbackEl) feedbackEl.textContent = 'Share failed.';
                    setTimeout(() => { if(feedbackEl) feedbackEl.textContent = ''; }, 2000);
                }
            } else {
                if(feedbackEl) feedbackEl.textContent = 'Nothing to share!';
                setTimeout(() => { if(feedbackEl) feedbackEl.textContent = ''; }, 2000);
            }
        } else {
            console.log("Share API not available.");
            if (feedbackEl) {
                feedbackEl.textContent = 'Share not available on this device.';
                setTimeout(() => { if(feedbackEl) feedbackEl.textContent = ''; }, 3000);
            }
        }
    });
}

const upsellModal = document.getElementById('upsell-modal'); // General Pro Upsell Modal
const goProBtn = document.getElementById('go-pro-btn'); // General "Go Pro" button in settings
const goProFromLibraryBtn = document.getElementById('go-pro-from-library-btn'); // "Go Pro" button in library banner
const closeUpsellModalBtn = document.getElementById('close-upsell-modal-btn'); // Close for general upsell modal
const upgradeToProBtn = document.getElementById('upgrade-to-pro-btn'); // Actual upgrade button in general upsell modal

// Book Cipher Specific Pro Upsell Modal Elements
const bookProUpsellModal = document.getElementById('pro-upsell-modal');
const closeBookProUpsellModalTopBtn = document.getElementById('close-pro-upsell-modal-top');
const bookGoProBtn = document.getElementById('go-pro-button'); // "Upgrade to Pro" from book specific modal
const bookReturnToLibraryBtn = document.getElementById('return-to-library-button');


// --- General Upsell Modal Logic ---
function showUpsellModal() {
    if (upsellModal && !window.isProUser) {
        upsellModal.classList.remove('hidden');
    }
}
function hideUpsellModal() {
    if (upsellModal) {
        upsellModal.classList.add('hidden');
    }
}

if (goProBtn && !window.isProUser) { // Settings "Go Pro"
    goProBtn.addEventListener('click', showUpsellModal);
}
if (goProFromLibraryBtn && !window.isProUser) { // Library banner "Go Pro"
    goProFromLibraryBtn.addEventListener('click', showUpsellModal);
}
if (closeUpsellModalBtn) { // General close button
    closeUpsellModalBtn.addEventListener('click', hideUpsellModal);
}
if (upgradeToProBtn) { // General upgrade button
    upgradeToProBtn.addEventListener('click', () => {
        window.isProUser = true;
        localStorage.setItem('isProUser', 'true');
        if (typeof window.initializeKochMethod === 'function') {
            window.initializeKochMethod();
        }
        updateGoProButtonUI();
        hideUpsellModal();
        hideBookProUpsellModal();
        const currentTab = localStorage.getItem('lastTab');
        if(currentTab) {
            showTab(currentTab);
        }
    });
}

// --- Book Cipher Specific Pro Upsell Modal Logic ---
function showBookProUpsellModal() {
    if (bookProUpsellModal && !window.isProUser) {
        bookProUpsellModal.classList.remove('hidden');
    }
}
window.showBookProUpsellModal = showBookProUpsellModal;

function hideBookProUpsellModal() {
    if (bookProUpsellModal) {
        bookProUpsellModal.classList.add('hidden');
    }
}

if (closeBookProUpsellModalTopBtn) {
    closeBookProUpsellModalTopBtn.addEventListener('click', hideBookProUpsellModal);
}
if (bookReturnToLibraryBtn) {
    bookReturnToLibraryBtn.addEventListener('click', hideBookProUpsellModal);
}
if (bookGoProBtn) {
    bookGoProBtn.addEventListener('click', () => {
        hideBookProUpsellModal();
        showUpsellModal();
    });
}


window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        if (document.getElementById('morse-reference-body')) {
            populateMorseReference();
        }
    }, 250);
});

document.addEventListener('DOMContentLoaded', () => {
    // Sliders values from localStorage or defaults
    if (wpmSlider && wpmValue) { wpmSlider.value = wpm; wpmValue.textContent = wpm; }
    if (farnsworthSlider && farnsworthValue) { farnsworthSlider.value = farnsworthWpm; farnsworthValue.textContent = farnsworthWpm; }
    if (freqSlider && freqValue) { freqSlider.value = frequency; freqValue.textContent = frequency; }

    const lastTab = localStorage.getItem('lastTab');
    if (lastTab) {
        showTab(lastTab);
    } else {
        showTab('introduction-tab'); // Default tab
    }
    updateDurations();
});

// Make functions globally available for other scripts if not using modules for everything
window.textToMorse = textToMorse;
window.playMorseSequence = playMorseSequence;
window.initAudio = initAudio;

// Event Listeners for I/O Tab Tapper Controls
document.addEventListener('DOMContentLoaded', () => {
    const playIoTappedMorseBtn = document.getElementById('play-io-tapped-morse-btn');
    const clearIoTapperInputBtn = document.getElementById('clear-io-tapper-input-btn');
    const tapperMorseOutput = document.getElementById('tapperMorseOutput');

    if (playIoTappedMorseBtn) {
        playIoTappedMorseBtn.addEventListener('click', async () => {
            const morseOutputOnTapper = tapperMorseOutput ? tapperMorseOutput.textContent : "";
            if (morseOutputOnTapper && morseOutputOnTapper.trim() !== '') {
                initAudio();
                await playMorseSequence(morseOutputOnTapper.trim(), null, null, 'tapper', 'play-io-tapped-morse-btn');
            }
        });
    }

    if (clearIoTapperInputBtn) {
        clearIoTapperInputBtn.addEventListener('click', () => {
            if (typeof resetVisualTapperState === 'function') {
                resetVisualTapperState();
            }
            if (playIoTappedMorseBtn) {
                playIoTappedMorseBtn.disabled = true;
            }
        });
    }

    if (tapperMorseOutput && playIoTappedMorseBtn) {
        const observer = new MutationObserver(() => {
            if (tapperMorseOutput.textContent && tapperMorseOutput.textContent.trim() !== '') {
                playIoTappedMorseBtn.disabled = false;
            } else {
                playIoTappedMorseBtn.disabled = true;
            }
        });
        observer.observe(tapperMorseOutput, { childList: true, characterData: true, subtree: true });
        if (tapperMorseOutput.textContent && tapperMorseOutput.textContent.trim() !== '') {
            playIoTappedMorseBtn.disabled = false;
        } else {
            playIoTappedMorseBtn.disabled = true;
        }
    }
});
