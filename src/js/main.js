// The Final, Definitive main.js

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
    window.isProUser = loadProStatus();
    populateMorseReference();
    applySavedTheme(); // Apply theme early
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

function showTab(tabIdToShow) {
    // console.log(`[showTab] Called with tabIdToShow: ${tabIdToShow}`);
    detachSharedTapper();
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
        // Standard definition of Farnsworth: character speed (dits/dahs) is maintained.
        // The extra spacing is added between characters and between words.
        // Word "PARIS" has 50 units. Time for PARIS at charSpeedWpm = 50 * (1.2 / charSpeedWpm)
        // Total time for a "standard word" at overallSpeedWpm = 60 / overallSpeedWpm
        // The difference is the extra space to be distributed.
        // A common way: T_char_eff = (60 / overallSpeedWpm) * (L_char / L_std_word)
        // T_word_eff = (60 / overallSpeedWpm) * (L_word / L_std_word)
        // This is complex. Simpler: stretch the spaces.
        // Let C = charSpeedWpm, F = overallSpeedWpm.
        // Time for 1 dit at speed C = 1.2/C.
        // If F < C, then spaces are longer.
        // Ratio of total time for a word: C/F.
        // Standard space durations are 1 (intra-char), 3 (inter-char), 7 (inter-word) units of (1.2/C)
        // The "silent" parts of these are 1, 2, 6 units respectively (if we consider the preceding sound).
        // Or, more simply, the silent period after a char before the next one starts.
        // Let's use the "PARIS" method. A standard word is 50 units long.
        // Time for PARIS at charSpeedWpm: T_paris_char = 50 * (1.2 / charSpeedWpm).
        // Expected time for PARIS at overallSpeedWpm: T_paris_farns = 60 / overallSpeedWpm.
        // Extra time per standard word = T_paris_farns - T_paris_char.
        // Assume PARIS has 5 letters, so 4 inter-character spaces.
        // Extra time per inter-character space = (T_paris_farns - T_paris_char) / 4. (This is one model)
        // So, shortGap = 3 * unitDur + extra_time_per_inter_char_space.
        // And mediumGap = 7 * unitDur + extra_time_per_word_space (maybe also scaled).

        // Simpler Farnsworth: Scale spaces to achieve the target overall WPM.
        // Character elements are sent at `charSpeedWpm`.
        // The spaces between characters and words are lengthened.
        // The factor 'k' by which the "silent" parts of spaces are stretched:
        // Effective character duration (including its trailing space) is what matters.
        // Let T_dot = 1.2 / charSpeedWpm.
        // Standard character: average 5 dots (e.g. E=1, T=3, A=6, O=9, M=7, avg ~5). Plus 3 dots space. Total 8 dots.
        // Standard word: 5 chars. 5 * (5+3) - 3 (no space after last char) + 7 (word space) = 40 - 3 + 7 = 44 units. (This varies by definition, "PARIS" is 50).
        // Let's use a ratio method for space extension:
        const spaceExtensionRatio = charSpeedWpm / overallSpeedWpm;
        if (spaceExtensionRatio > 1) {
            // Only extend the silent part of the gap.
            // Standard inter-char gap is 3 units. Sound + 2 units silence. Extend the 2 units.
            // Standard word gap is 7 units. Sound + 6 units silence. Extend the 6 units.
            // This is still tricky. Let's use a widely cited Farnsworth formula:
            // T_dot = 1.2 / Wc (Wc = char speed)
            // T_farns_char_space = ( (60/Wf) - ( (Ls/Lw) * (60/Wc) ) ) / ( (Nc-1)/Lw )
            // Wf = Farnsworth speed, Ls = total dits in avg word, Lw = total elements in avg word, Nc=num chars
            // This is too complex for here.
            // Simple approach: make inter-character and inter-word spaces longer.
            // The "effective" duration of a dot for spacing calculations becomes (1.2 / overallSpeedWpm).
            let spacingUnitDur = 1.2 / overallSpeedWpm;
            shortGap = spacingUnitDur * 3;
            mediumGap = spacingUnitDur * 7;
            // But the actual dits/dahs play at `unitDur` (based on charSpeedWpm)
        }
    }

    const currentFreq = customFreq || frequency;

    for (let i = 0; i < morse.length; i++) {
        if (stopMorseCode) break;
        const char = morse[i];
        let durationToPlay = 0;
        let silenceAfterElement = interElementDelay; // Default silence after a dit or dah within a char

        switch (char) {
            case '.':
                durationToPlay = unitDur;
                break;
            case '-':
                durationToPlay = unitDur * 3;
                break;
            case ' ': // Morse space: implies end of a character, start of inter-character gap
                durationToPlay = 0; // No sound
                silenceAfterElement = shortGap - interElementDelay; // Subtract the already accounted for inter-element space
                break;
            case '/': // Morse slash: implies end of a word, start of inter-word gap
                durationToPlay = 0; // No sound
                silenceAfterElement = mediumGap - interElementDelay; // Subtract inter-element, assume previous was a char end
                break;
        }

        if (durationToPlay > 0) {
            if (elementToGlow) elementToGlow.classList.add('active');
            await playTone(currentFreq, durationToPlay);
            if (elementToGlow) elementToGlow.classList.remove('active');
        }

        // Determine if it's the last element of a character or word
        const isLastElementOfChar = (i < morse.length - 1 && (morse[i+1] === ' ' || morse[i+1] === '/'));
        const isLastElementOverall = (i === morse.length - 1);

        if (!isLastElementOfChar && !isLastElementOverall && durationToPlay > 0) { // If it's a dit/dah within a char
             await delay(interElementDelay);
        } else if (silenceAfterElement > 0 && (char === ' ' || char === '/')) { // If it's a space character from Morse string
            await delay(silenceAfterElement);
        } else if (isLastElementOfChar && durationToPlay > 0) { // End of char, but not end of sequence
            // The next char will be ' ' or '/', which handles the longer gap.
            // So, just the standard inter-element delay here.
            await delay(interElementDelay);
        }
        // No delay after the very last element of the sequence.
    }

    if (!stopMorseCode) {
      if(actualButtonToDisable) actualButtonToDisable.disabled = false;
      if(stopMorseBtn) stopMorseBtn.disabled = true;
    }
    isPlaying = false;
    if (elementToGlow) elementToGlow.classList.remove('active'); // Ensure glow is off if stopped early
    if (oscillator && !stopMorseCode) {
        try { oscillator.stop(); } catch(e) {/* ignore */}
        oscillator.disconnect();
        oscillator = null;
    }
}

function playTone(freq, durationSeconds) {
    return new Promise((resolve) => {
        if (!audioContext) initAudio(); // Attempt to init if not already
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

        if (!gainNode) { // Should be created by initAudio
            gainNode = audioContext.createGain();
            gainNode.connect(audioContext.destination);
        }

        currentOscillator.connect(gainNode);
        // Ramp up gain quickly to avoid clicks
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(1, audioContext.currentTime + 0.005);

        currentOscillator.start(audioContext.currentTime);

        // Ramp down gain before stopping to avoid clicks
        gainNode.gain.setValueAtTime(1, audioContext.currentTime + durationSeconds - 0.005);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + durationSeconds);

        currentOscillator.stop(audioContext.currentTime + durationSeconds);

        currentOscillator.onended = () => {
            try {
                currentOscillator.disconnect();
            } catch(e) {/* ignore if already disconnected */}
            resolve();
        };
        oscillator = currentOscillator; // Store reference to current oscillator for stop button
    });
}

function delay(durationSeconds) {
    return new Promise(resolve => setTimeout(resolve, durationSeconds * 1000));
}

function populateMorseReference() {
    if (!morseReferenceBody) {
        // console.error("Morse reference body not found!"); // Log removed
        return;
    }
    morseReferenceBody.innerHTML = ''; // Clear existing content
    // console.log("Populating Morse Reference Table..."); // Log removed

    const entries = Object.entries(morseCode);
    const numEntries = entries.length;
    // console.log(`Total Morse code entries: ${numEntries}`); // Log removed

    const isDesktop = window.matchMedia('(min-width: 768px)').matches;
    const pairsPerRow = isDesktop ? 4 : 2; // Number of (Char, Morse) pairs per row
    // console.log(`Screen isDesktop: ${isDesktop}, Pairs per row: ${pairsPerRow}`); // Log removed

    for (let i = 0; i < numEntries; i += pairsPerRow) {
        const tr = document.createElement('tr');
        // console.log(`Starting new row (i=${i})`); // Log removed
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
                // No generic fallback needed as we only use valid chars from morseCode keys

                const tdChar = document.createElement('td');
                tdChar.textContent = char;
                tdChar.id = `ref-char-${idChar}`;
                tr.appendChild(tdChar);
                // console.log(`  Added Char: ${char} (id: ref-char-${idChar}) to row ${i}, pair index j=${j}`); // Log removed

                const tdMorse = document.createElement('td');
                tdMorse.textContent = code;
                tdMorse.id = `ref-morse-${idChar}`;
                tdMorse.classList.add('font-mono');
                tr.appendChild(tdMorse);
                // console.log(`  Added Morse: ${code} (id: ref-morse-${idChar}) for char ${char}`); // Log removed
            } else {
                // Add two empty cells for each missing pair to maintain table structure
                // console.log(`  Adding empty cells for pair index j=${j} in row i=${i} as entryIndex ${entryIndex} >= numEntries`); // Log removed
                const tdCharEmpty = document.createElement('td');
                tdCharEmpty.innerHTML = '&nbsp;';
                tr.appendChild(tdCharEmpty);
                const tdMorseEmpty = document.createElement('td');
                tdMorseEmpty.innerHTML = '&nbsp;';
                tr.appendChild(tdMorseEmpty);
            }
        }
        morseReferenceBody.appendChild(tr);
        // console.log(`Finished row (i=${i}), appended to table body.`); // Log removed
    }
    // console.log("Finished populating Morse Reference Table."); // Log removed
    // applySavedTheme will be called by showTab or initial load, or by theme toggle.
    // We might need to explicitly call it here if the table borders are not themed correctly initially.
    // However, the cell content theming (text color) should be inherited.
    // The borders are on .reference-table th, .reference-table td in CSS, so they should be fine.
    // Let's test without explicit applySavedTheme here first.
}

function applySavedTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const isLight = savedTheme === 'light';
    // console.log('[applySavedTheme] Theme from localStorage:', savedTheme, '| isLight:', isLight);

    // console.log('[applySavedTheme] document.body.classList BEFORE:', document.body.classList.toString());
    document.body.classList.toggle('light-theme', isLight);
    document.body.classList.toggle('dark', !isLight);
    // console.log('[applySavedTheme] document.body.classList AFTER:', document.body.classList.toString());

    document.querySelectorAll('.app-container').forEach(c => {
        c.classList.toggle('light-theme-container', isLight);
        c.classList.toggle('dark-theme-container', !isLight);
    });

    // Explicitly style #pro-upsell-modal elements based on theme
    const proModalContentDiv = document.querySelector('#pro-upsell-modal > div'); // The main content box
    const proModalTitle = document.querySelector('#pro-upsell-modal h2');
    const proModalParagraph = document.querySelector('#pro-upsell-modal p'); // Assuming first p is the main one
    const proModalBenefitsTitle = document.querySelector('#pro-upsell-modal h3');
    const proModalBenefitsList = document.querySelector('#pro-upsell-modal ul');
    const proModalCloseButton = document.getElementById('close-pro-upsell-modal-top');

    if (proModalContentDiv) {
        proModalContentDiv.classList.remove('bg-white', 'dark:bg-gray-800', 'text-gray-700', 'dark:text-white', 'dark');
        if (proModalTitle) proModalTitle.classList.remove('text-yellow-600', 'dark:text-yellow-400');
        if (proModalParagraph) proModalParagraph.classList.remove('text-gray-600', 'dark:text-gray-300');
        if (proModalBenefitsTitle) proModalBenefitsTitle.classList.remove('text-yellow-700', 'dark:text-yellow-300');
        if (proModalBenefitsList) proModalBenefitsList.classList.remove('text-gray-600', 'dark:text-gray-300');
        if (proModalCloseButton) proModalCloseButton.classList.remove('text-gray-500', 'hover:text-gray-700', 'dark:text-gray-400', 'dark:hover:text-white');

        if (isLight) {
            proModalContentDiv.classList.add('bg-white', 'text-gray-700');
            if (proModalTitle) proModalTitle.classList.add('text-yellow-600');
            if (proModalParagraph) proModalParagraph.classList.add('text-gray-600');
            if (proModalBenefitsTitle) proModalBenefitsTitle.classList.add('text-yellow-700');
            if (proModalBenefitsList) proModalBenefitsList.classList.add('text-gray-600');
            if (proModalCloseButton) proModalCloseButton.classList.add('text-gray-500', 'hover:text-gray-700');
        } else { // isDark
            proModalContentDiv.classList.add('dark', 'bg-gray-800', 'text-white');
            if (proModalTitle) proModalTitle.classList.add('text-yellow-400');
            if (proModalParagraph) proModalParagraph.classList.add('text-gray-300');
            if (proModalBenefitsTitle) proModalBenefitsTitle.classList.add('text-yellow-300');
            if (proModalBenefitsList) proModalBenefitsList.classList.add('text-gray-300');
            if (proModalCloseButton) proModalCloseButton.classList.add('text-gray-400', 'dark:hover:text-white');
        }
    }

    // Aggressively style the general #upsell-modal
    const generalUpsellModalContentDiv = document.querySelector('#upsell-modal > div'); // Main content box
    const generalUpsellModalTitle = document.querySelector('#upsell-modal h2.text-purple-600');
    const generalUpsellModalParagraph = document.querySelector('#upsell-modal p.text-lg.mb-4');
    const generalUpsellModalList = document.querySelector('#upsell-modal ul.list-disc'); // The UL element itself
    const generalUpsellModalListItems = document.querySelectorAll('#upsell-modal ul li'); // All LIs for text color
    const generalUpsellModalListSvgs = document.querySelectorAll('#upsell-modal ul li svg.text-green-500');
    const generalUpsellModalCloseBtn = document.getElementById('close-upsell-modal-btn');
    const generalUpsellModalSmallText = document.querySelector('#upsell-modal p.text-xs.text-gray-500');
    const generalUpsellModalUpgradeBtn = document.getElementById('upgrade-to-pro-btn');


    if (generalUpsellModalContentDiv) {
        // Remove Tailwind's dark context class and specific color/bg classes before applying new ones
        generalUpsellModalContentDiv.classList.remove('dark', 'bg-white', 'text-gray-800', 'dark:bg-gray-700', 'dark:text-gray-100'); // Added dark specific from potential tailwind config
        if (generalUpsellModalTitle) generalUpsellModalTitle.classList.remove('text-purple-600', 'dark:text-purple-400');
        if (generalUpsellModalParagraph) generalUpsellModalParagraph.classList.remove('text-gray-800', 'dark:text-gray-100');
        if (generalUpsellModalList) generalUpsellModalList.classList.remove('text-gray-800', 'dark:text-gray-100'); // For general list text if not on LIs
        if (generalUpsellModalCloseBtn) generalUpsellModalCloseBtn.classList.remove('text-gray-600', 'hover:text-gray-800', 'dark:text-gray-300', 'dark:hover:text-gray-100');
        if (generalUpsellModalSmallText) generalUpsellModalSmallText.classList.remove('text-gray-500', 'dark:text-gray-400');
        generalUpsellModalListItems.forEach(li => li.classList.remove('text-gray-800', 'dark:text-gray-100'));
        generalUpsellModalListSvgs.forEach(svg => svg.classList.remove('text-green-500', 'dark:text-green-400'));
        if(generalUpsellModalUpgradeBtn) generalUpsellModalUpgradeBtn.classList.remove('bg-purple-600', 'hover:bg-purple-700', 'dark:bg-purple-500', 'dark:hover:bg-purple-600');


        if (isLight) {
            generalUpsellModalContentDiv.classList.add('bg-white', 'text-gray-800');
            if (generalUpsellModalTitle) generalUpsellModalTitle.classList.add('text-purple-600');
            if (generalUpsellModalParagraph) generalUpsellModalParagraph.classList.add('text-gray-800');
            if (generalUpsellModalList) generalUpsellModalList.classList.add('text-gray-800');
            if (generalUpsellModalCloseBtn) generalUpsellModalCloseBtn.classList.add('text-gray-600', 'hover:text-gray-800');
            if (generalUpsellModalSmallText) generalUpsellModalSmallText.classList.add('text-gray-500');
            generalUpsellModalListItems.forEach(li => li.classList.add('text-gray-800')); // Text color for li content
            generalUpsellModalListSvgs.forEach(svg => svg.classList.add('text-green-500'));
            if(generalUpsellModalUpgradeBtn) generalUpsellModalUpgradeBtn.classList.add('bg-purple-600', 'hover:bg-purple-700');

        } else { // isDark
            generalUpsellModalContentDiv.classList.add('dark', 'bg-gray-700', 'text-gray-100'); // Example dark theme for this modal
            if (generalUpsellModalTitle) generalUpsellModalTitle.classList.add('text-purple-400');
            if (generalUpsellModalParagraph) generalUpsellModalParagraph.classList.add('text-gray-100');
            if (generalUpsellModalList) generalUpsellModalList.classList.add('text-gray-100');
            if (generalUpsellModalCloseBtn) generalUpsellModalCloseBtn.classList.add('text-gray-300', 'hover:text-gray-100');
            if (generalUpsellModalSmallText) generalUpsellModalSmallText.classList.add('text-gray-400');
            generalUpsellModalListItems.forEach(li => li.classList.add('text-gray-100'));
            generalUpsellModalListSvgs.forEach(svg => svg.classList.add('text-green-400'));
            if(generalUpsellModalUpgradeBtn) generalUpsellModalUpgradeBtn.classList.add('bg-purple-500', 'hover:bg-purple-600'); // Slightly different dark for button
        }
    }

    navTabButtons.forEach(button => {
        const isActive = button.classList.contains('active-tab-button');
        button.classList.remove(
            'bg-blue-600', 'text-white', 'dark:bg-blue-500', 'dark:text-gray-100',
            'bg-gray-200', 'text-gray-700', 'hover:bg-gray-300',
            'dark:bg-gray-700', 'dark:text-gray-300', 'dark:hover:bg-gray-600'
        );

        if (isActive) {
            if (isLight) {
                button.classList.add('bg-blue-600', 'text-white');
            } else {
                button.classList.add('dark:bg-blue-500', 'dark:text-gray-100');
            }
        } else {
            if (isLight) {
                button.classList.add('bg-gray-200', 'text-gray-700', 'hover:bg-gray-300');
            } else {
                button.classList.add('dark:bg-gray-700', 'dark:text-gray-300', 'dark:hover:bg-gray-600');
            }
        }
    });

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
        // console.log('[upgradeToProBtn] Clicked. Current window.isProUser:', window.isProUser);
        window.isProUser = true;
        localStorage.setItem('isProUser', 'true');
        // console.log('[upgradeToProBtn] window.isProUser set to true.');

        if (typeof window.initializeKochMethod === 'function') {
            // console.log('[upgradeToProBtn] Calling initializeKochMethod.');
            window.initializeKochMethod();
        }
        // console.log('[upgradeToProBtn] Calling updateGoProButtonUI.');
        updateGoProButtonUI();

        // console.log('[upgradeToProBtn] Hiding modals.');
        hideUpsellModal();
        hideBookProUpsellModal();

        const currentTab = localStorage.getItem('lastTab');
        // console.log('[upgradeToProBtn] currentTab from localStorage:', currentTab);

        if(currentTab) {
            // console.log('[upgradeToProBtn] Calling showTab with currentTab:', currentTab);
            showTab(currentTab);
        } else {
            // console.log('[upgradeToProBtn] No currentTab found in localStorage. Not calling showTab.');
        }
        // console.log('[upgradeToProBtn] Listener finished.');
    });
}

// --- Book Cipher Specific Pro Upsell Modal Logic ---
function showBookProUpsellModal() {
    // console.log('[showBookProUpsellModal] Called.');
    if (bookProUpsellModal && !window.isProUser) {
        // console.log('[showBookProUpsellModal] Modal element found, user is not Pro. Attempting to show modal.');
        // console.log('[showBookProUpsellModal] document.body.classList:', document.body.classList.toString());
        // const proUpsellModalContent = document.querySelector('#pro-upsell-modal > div');
        // if (proUpsellModalContent) {
            // console.log('[showBookProUpsellModal] Modal content (#pro-upsell-modal > div) classList:', proUpsellModalContent.classList.toString());
        // } else {
            // console.log('[showBookProUpsellModal] Modal content (#pro-upsell-modal > div) NOT found at time of show.');
        // }
        bookProUpsellModal.classList.remove('hidden');
    } else if (!bookProUpsellModal) {
        // console.log('[showBookProUpsellModal] Modal element (bookProUpsellModal) NOT found.');
    } else if (window.isProUser) {
        // console.log('[showBookProUpsellModal] User is Pro, modal not shown.');
    }
}
window.showBookProUpsellModal = showBookProUpsellModal; // Expose to global for bookCipher.js

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
        hideBookProUpsellModal(); // Hide this specific modal first
        showUpsellModal();      // Then show the general one that has the "purchase" button
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
    // Ensure durations are correct based on potentially loaded slider values
    updateDurations();
});

// Make functions globally available for other scripts if not using modules for everything
window.textToMorse = textToMorse;
window.playMorseSequence = playMorseSequence;
window.initAudio = initAudio;
// morseToText is already on window, morseCode and reversedMorseCode are also already on window.

// Event Listeners for I/O Tab Tapper Controls
document.addEventListener('DOMContentLoaded', () => {
    const playIoTappedMorseBtn = document.getElementById('play-io-tapped-morse-btn');
    const clearIoTapperInputBtn = document.getElementById('clear-io-tapper-input-btn');
    const tapperMorseOutput = document.getElementById('tapperMorseOutput'); // Shared tapper output

    if (playIoTappedMorseBtn) {
        playIoTappedMorseBtn.addEventListener('click', async () => {
            const morseOutputOnTapper = tapperMorseOutput ? tapperMorseOutput.textContent : "";
            if (morseOutputOnTapper && morseOutputOnTapper.trim() !== '') {
                // We don't need to convert to Morse, it's already Morse.
                // We need to ensure it's in the correct spaced format for playMorseSequence.
                // VisualTapper's tapperMorseOutput is already character-by-character Morse, spaces between.
                // If it's from "decoded" text, it would need conversion.
                // For now, assume tapperMorseOutput.textContent is playable Morse.
                initAudio(); // Ensure audio context is ready
                await playMorseSequence(morseOutputOnTapper.trim(), null, null, 'tapper', 'play-io-tapped-morse-btn');
            }
        });
    }

    if (clearIoTapperInputBtn) {
        clearIoTapperInputBtn.addEventListener('click', () => {
            if (typeof resetVisualTapperState === 'function') {
                resetVisualTapperState(); // This should clear tapperMorseOutput and internal states
            }
            // Also explicitly disable the play button for I/O tapper
            if (playIoTappedMorseBtn) {
                playIoTappedMorseBtn.disabled = true;
            }
        });
    }

    // Observer to enable/disable the play-io-tapped-morse-btn based on tapperMorseOutput content
    if (tapperMorseOutput && playIoTappedMorseBtn) {
        const observer = new MutationObserver(() => {
            if (tapperMorseOutput.textContent && tapperMorseOutput.textContent.trim() !== '') {
                playIoTappedMorseBtn.disabled = false;
            } else {
                playIoTappedMorseBtn.disabled = true;
            }
        });
        observer.observe(tapperMorseOutput, { childList: true, characterData: true, subtree: true });
        // Initial check
        if (tapperMorseOutput.textContent && tapperMorseOutput.textContent.trim() !== '') {
            playIoTappedMorseBtn.disabled = false;
        } else {
            playIoTappedMorseBtn.disabled = true;
        }
    }
});
