// --- App State ---
let isProUser = false; // Initialize Pro status

// Morse code dictionary
        const morseCode = {
            'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.', 'G': '--.', 'H': '....',
            'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---', 'P': '.--.',
            'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
            'Y': '-.--', 'Z': '--..',
            '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
            '8': '---..', '9': '----.', '0': '-----',
            '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--', '/': '-..-.',
            '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-',
            '+': '.-.-.', '-': '-....-', '_': '..--.-', '"': '.-..-.', '$': '...-..-', '@': '.--.-.-',
            ' ': '/' // Represent space between words with a slash or longer pause
        };

        const reversedMorseCode = {};
        for (const key in morseCode) {
            reversedMorseCode[morseCode[key]] = key;
        }

        // AudioContext for playing Morse code sound
        let audioContext;
        let oscillator;
        let gainNode;
        let isPlaying = false;
        let stopMorseCode = false; // Flag to stop ongoing Morse playback
        let resizeTimer; // For debouncing resize events

        // DOM Elements
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
        // const toggleThemeBtn = document.getElementById('toggle-theme-btn'); // Incorrect ID
        const themeToggleCheckbox = document.getElementById('theme-toggle'); // Correct ID for the checkbox


        // Initialize AudioContext
        function initAudio() {
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                gainNode = audioContext.createGain();
                gainNode.connect(audioContext.destination);
            }
        }

        // Settings
        let wpm = parseInt(wpmSlider.value);
        let farnsworthWpm = parseInt(farnsworthSlider.value); // Farnsworth WPM
        let frequency = parseInt(freqSlider.value);

        function getPlaybackFrequency() {
          return frequency;
        }

        // Timing (PARIS standard)
        // Dot is 1 unit
        // Dash is 3 units
        // Intra-character space is 1 unit
        // Inter-character space is 3 units
        // Word space is 7 units

        // WPM calculation: A standard word "PARIS" has 50 units.
        // If WPM is X, then X words take 60 seconds.
        // X * 50 units = 60 seconds
        // 1 unit = 60 / (X * 50) = 1.2 / X seconds
        let dotDuration = 1.2 / wpm; // seconds

        function updateDurations() {
            dotDuration = 1.2 / wpm;
            if (farnsworthWpm < wpm && farnsworthWpm > 0) {
                // Adjust inter-character and word spaces for Farnsworth timing
                // Character speed remains at 'wpm', but spacing is as if overall WPM is 'farnsworthWpm'
                // This means the 'unit' for spacing is based on farnsworthWpm
                // However, dot/dash/intra-character space are based on 'wpm'
                // This is a common interpretation. Some systems might vary.
            }
             // Ensure Farnsworth is not faster than character speed
            if (farnsworthSlider.value > wpmSlider.value) {
                farnsworthSlider.value = wpmSlider.value;
                farnsworthValue.textContent = wpmSlider.value;
                farnsworthWpm = wpm;
            }
        }
        updateDurations(); // Initial calculation

        // --- Event Listeners ---
        textInput.addEventListener('input', () => {
            const text = textInput.value.toUpperCase();
            morseOutput.value = textToMorse(text);
        });

        playMorseBtn.addEventListener('click', async () => {
            if (isPlaying) return;
            initAudio(); // Ensure AudioContext is ready (especially on user gesture)
            const morse = morseOutput.value;
            if (morse) {
                // stopMorseBtn.disabled = false; // Enabled inside playMorseSequence
                await playMorseSequence(morse);
            }
        });

        stopMorseBtn.addEventListener('click', () => {
            if (isPlaying) {
                stopMorseCode = true; // Set flag to stop the sequence
                stopMorseBtn.disabled = true; // Disable stop button as it's now clicked
                if (oscillator) {
                    oscillator.stop();
                    oscillator.disconnect(); // Clean up
                    oscillator = null;
                }
                if (gainNode) { // Ensure gainNode is controlled
                    gainNode.gain.cancelScheduledValues(audioContext.currentTime);
                    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                }
                isPlaying = false;
                playMorseBtn.disabled = false;
                console.log("Morse playback stopped by user.");
            }
        });


        copyTextBtn.addEventListener('click', () => {
            const feedbackEl = document.getElementById('copy-text-feedback');
            navigator.clipboard.writeText(textInput.value)
                .then(() => {
                    feedbackEl.textContent = 'Copied!';
                    feedbackEl.className = 'ml-2 text-sm feedback-message text-green-500';
                    setTimeout(() => { feedbackEl.textContent = ''; }, 2000);
                })
                .catch(err => {
                    feedbackEl.textContent = 'Error!';
                    feedbackEl.className = 'ml-2 text-sm feedback-message text-red-500';
                    console.error('Error copying text: ', err);
                    setTimeout(() => { feedbackEl.textContent = ''; }, 2000);
                });
        });

        copyMorseBtn.addEventListener('click', () => {
            const feedbackEl = document.getElementById('copy-morse-feedback');
            navigator.clipboard.writeText(morseOutput.value)
                .then(() => {
                    feedbackEl.textContent = 'Copied!';
                    feedbackEl.className = 'ml-2 text-sm feedback-message text-green-500';
                    setTimeout(() => { feedbackEl.textContent = ''; }, 2000);
                })
                .catch(err => {
                    feedbackEl.textContent = 'Error!';
                    feedbackEl.className = 'ml-2 text-sm feedback-message text-red-500';
                    console.error('Error copying Morse code: ', err);
                    setTimeout(() => { feedbackEl.textContent = ''; }, 2000);
                });
        });

        wpmSlider.addEventListener('input', (e) => {
            wpm = parseInt(e.target.value);
            wpmValue.textContent = wpm;
            // If new WPM is lower than current Farnsworth, pull Farnsworth down.
            // Farnsworth cannot be higher than character WPM.
            if (wpm < farnsworthWpm) {
                farnsworthWpm = wpm;
                farnsworthSlider.value = wpm;
                farnsworthValue.textContent = wpm;
            }
            updateDurations();
        });

        farnsworthSlider.addEventListener('input', (e) => {
            farnsworthWpm = parseInt(e.target.value);
            // Farnsworth WPM cannot be higher than character WPM.
            // If user tries to set Farnsworth higher, cap it at current WPM.
            // Do NOT increase WPM based on Farnsworth changes.
            if (farnsworthWpm > wpm) {
                farnsworthWpm = wpm;
                e.target.value = wpm; // Correct the slider position
            }
            farnsworthValue.textContent = farnsworthWpm;
            updateDurations();
        });


        freqSlider.addEventListener('input', (e) => {
            frequency = parseInt(e.target.value);
            freqValue.textContent = frequency;
        });

        if (themeToggleCheckbox) {
            themeToggleCheckbox.addEventListener('change', () => { // Listen for 'change' on the checkbox
                // The new analogue theme is essentially a light theme by default.
                // This toggle was for switching between a dark base theme and a light-theme variant.
                // With the analogue theme, this toggle's behavior might need to be re-evaluated.
                // For now, let's assume it's meant to toggle a class that might be used by user-agent stylesheets or for minor adjustments.
                // Or, if the 'light-theme' class is what our analogue theme relies on, then this logic is fine.

                // Current logic based on original setup:
                if (themeToggleCheckbox.checked) { // Assuming checked = dark mode (as per label "Dark Mode")
                    document.body.classList.remove('light-theme');
                    // If analogue theme IS the light theme, then unchecking (going to dark) might mean removing analogue specific body class
                    // and adding a generic dark theme class. This is complex.
                    // For now, let's stick to the idea that 'light-theme' class was for an *alternative* light style.
                    // Our analogue theme is applied directly to body, not via 'light-theme' class.
                    // So, this toggle might be redundant or needs new purpose.
                    // Let's preserve the local storage part.
                    localStorage.setItem('theme', 'dark'); // If checked (Dark Mode label implies dark)
                     // We might need to remove analogue specific classes if we want to revert to a different base dark theme.
                } else { // Unchecked = light mode
                    document.body.classList.add('light-theme'); // This class might not be used by the analogue theme.
                    localStorage.setItem('theme', 'light');
                     // Apply analogue theme if this means "light mode"
                }
                // The class toggling on app-container might also be legacy.
                // The analogue theme styles .app-container directly.
                const allAppContainers = document.querySelectorAll('.app-container');
                allAppContainers.forEach(container => {
                    // This logic also needs review in context of a single analogue theme.
                    // If 'light-theme-container' was for the alternative light theme, it's okay.
                    if (themeToggleCheckbox.checked) {
                        container.classList.remove('light-theme-container');
                    } else {
                        container.classList.add('light-theme-container');
                    }
                });
                // The critical part is that `themeToggleCheckbox` is not null.
                // The actual theme switching logic might need further review post-analogue theme.
                // For now, the goal is to prevent the JS error.
                console.log("Theme toggle changed. Checked:", themeToggleCheckbox.checked);
            });
        } else {
            console.warn("Theme toggle checkbox with ID 'theme-toggle' not found. Theme switching will not work.");
        }


        // --- Core Functions ---

// --- Tab Navigation ---
const navTabButtons = document.querySelectorAll('nav button[data-tab]');
const tabContentDivs = document.querySelectorAll('.tab-content');
const sharedVisualTapperWrapper = document.getElementById('sharedVisualTapperWrapper');
const hiddenTapperStorage = document.getElementById('hiddenTapperStorage');

function attachTapperToArea(targetAreaId) {
    console.log(`[Attach Tapper] Attempting for targetAreaId: '${targetAreaId}'`);
    const targetElement = document.getElementById(targetAreaId);

    if (!sharedVisualTapperWrapper) {
        console.error("[Attach Tapper] CRITICAL: sharedVisualTapperWrapper element is null or undefined.");
        return;
    }
    if (!targetElement) {
        console.error(`[Attach Tapper] Target area element with ID '${targetAreaId}' NOT FOUND.`);
        return;
    }

    console.log(`[Attach Tapper] Before attach - Target: ${targetElement.id}, Tapper parent: ${sharedVisualTapperWrapper.parentNode ? sharedVisualTapperWrapper.parentNode.id : 'null'}, Tapper display: ${sharedVisualTapperWrapper.style.display}`);

    targetElement.appendChild(sharedVisualTapperWrapper);
    sharedVisualTapperWrapper.style.display = 'block'; // Or 'flex' if its internal layout needs it

    console.log(`[Attach Tapper] After attach - Target: ${targetElement.id}, Tapper parent: ${sharedVisualTapperWrapper.parentNode ? sharedVisualTapperWrapper.parentNode.id : 'null'}, Tapper display: ${sharedVisualTapperWrapper.style.display}`);
}

function detachSharedTapper() {
    console.log("[Detach Tapper] Called.");
    if (typeof resetVisualTapperState === 'function') {
        console.log("[Detach Tapper] Calling resetVisualTapperState.");
        resetVisualTapperState();
    } else {
        console.warn("[Detach Tapper] resetVisualTapperState function not found.");
    }

    if (!sharedVisualTapperWrapper) {
        console.error("[Detach Tapper] CRITICAL: sharedVisualTapperWrapper element is null or undefined. Cannot detach.");
        return;
    }
    if (!hiddenTapperStorage) {
        console.error("[Detach Tapper] CRITICAL: hiddenTapperStorage element is null or undefined. Cannot detach.");
        return;
    }

    console.log(`[Detach Tapper] Before detach - Tapper parent: ${sharedVisualTapperWrapper.parentNode ? sharedVisualTapperWrapper.parentNode.id : 'null'}, Tapper display: ${sharedVisualTapperWrapper.style.display}`);

    if (sharedVisualTapperWrapper.parentNode !== hiddenTapperStorage) {
        hiddenTapperStorage.appendChild(sharedVisualTapperWrapper);
    }
    sharedVisualTapperWrapper.style.display = 'none';
    console.log(`[Detach Tapper] After detach - Tapper parent: ${sharedVisualTapperWrapper.parentNode ? sharedVisualTapperWrapper.parentNode.id : 'null'}, Tapper display: ${sharedVisualTapperWrapper.style.display}`);
}


function showTab(tabIdToShow) {
    console.log(`[Show Tab] Called for tabId: '${tabIdToShow}'`);
    // Detach tapper from any previous tab BEFORE hiding all tabs
    detachSharedTapper();

    tabContentDivs.forEach(div => {
        div.classList.add('hidden');
    });

    navTabButtons.forEach(button => {
        button.classList.remove('active-tab-button');
        // JS will no longer try to manage Tailwind color classes for active/inactive states.
        // CSS will handle this based on the presence of 'active-tab-button'.
        // button.classList.add('bg-gray-700', 'text-gray-300'); // Keep if these are base styles for all nav buttons
        // button.classList.remove('bg-blue-600', 'text-white');
    });

    const selectedTabContent = document.getElementById(tabIdToShow);
    if (selectedTabContent) {
        selectedTabContent.classList.remove('hidden');
    }

    const selectedNavButton = document.querySelector(`nav button[data-tab='${tabIdToShow}']`);
    if (selectedNavButton) {
        selectedNavButton.classList.add('active-tab-button');
        // JS will no longer try to manage Tailwind color classes for active/inactive states.
        // CSS will handle this based on the presence of 'active-tab-button'.
        // selectedNavButton.classList.remove('bg-gray-700', 'text-gray-300');
        // selectedNavButton.classList.add('bg-blue-600', 'text-white');
    }

    // If switching to the Learn & Practice tab, start a new challenge.
    if (tabIdToShow === 'learn-practice-tab' && typeof startNewChallenge === 'function') {
        startNewChallenge();
    }

    // Attach tapper to the new tab if it's the book cipher tab or learn & practice tab
    if (tabIdToShow === 'book-cipher-tab') {
        attachTapperToArea('bookCipherTapperArea');
    } else if (tabIdToShow === 'learn-practice-tab') {
        attachTapperToArea('tapper-placeholder');
    } else if (tabIdToShow === 'introduction-tab') {
        attachTapperToArea('introTapperArea');
    }
    // No 'else' here, so if it's another tab, tapper remains detached (which is correct)
}

navTabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const tabId = button.getAttribute('data-tab');
        console.log(`[Nav Click] Button clicked for tab: '${tabId}'. Attempting to showTab.`);
        showTab(tabId);
    });
});

document.addEventListener('DOMContentLoaded', () => {
    // Set the initial active tab correctly.
    // The learn-practice-nav-btn might already have active-tab-button from HTML.
    // This call ensures consistent state management via JS.
    showTab('introduction-tab'); // Initial tab
    // Explicit detach on DOMContentLoaded after initial showTab is good practice,
    // though current showTab logic handles it.
    // If learn-practice-tab is not supposed to have tapper, this ensures it's gone.
    // If learn-practice-tab *was* supposed to have it, showTab would call attach.
    // Given showTab now detaches first, this specific call here might be redundant
    // unless the very first tab shown *shouldn't* have the tapper.
    // Let's assume 'learn-practice-tab' does not use the tapper initially.
    // The `showTab` function already calls `detachSharedTapper`, so this is not strictly needed here.
    // detachSharedTapper();
});
// --- End Tab Navigation ---

        function textToMorse(text) {
            return text.split('').map(char => {
                if (morseCode[char]) {
                    return morseCode[char];
                } else if (char === ' ') {
                    return '/'; // Word separator
                }
                return ''; // Or some indicator for unknown characters
            }).join(' '); // Space between Morse codes of letters
        }

        function morseToText(morse) {
            return morse.split(' ').map(code => {
                if (code === '/') return ' '; // Word separator
                return reversedMorseCode[code] || ''; // Or indicator for unknown code
            }).join('');
        }

       async function playTone(duration, toneFrequency) {
            // Check master sound setting FIRST
            if (typeof window.isMasterSoundEnabled !== 'undefined' && !window.isMasterSoundEnabled) {
                // console.log('Master sound is OFF, playTone will not play.'); // Debug log
                return Promise.resolve(); // Exit if master sound is disabled
            }

            if (stopMorseCode || !audioContext) {
                // console.warn("playTone: stopMorseCode active or no audioContext. Aborting tone."); // Optional log
                return Promise.resolve(); // Correctly return a resolved promise
            }

            return new Promise(resolve => {
                if (!audioContext || audioContext.state === 'suspended') {
                    console.warn("AudioContext not active. Cannot play tone.");
                    resolve();
                    return;
                }

                oscillator = audioContext.createOscillator();
                oscillator.type = 'sine';
                // Use the provided toneFrequency, falling back to getPlaybackFrequency if necessary
                const resolvedFrequency = typeof toneFrequency === 'number' ? toneFrequency : getPlaybackFrequency();
                oscillator.frequency.setValueAtTime(resolvedFrequency, audioContext.currentTime);

                // Ramp up volume smoothly
                gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(1, audioContext.currentTime + 0.01); // Quick ramp up

                oscillator.connect(gainNode);
                oscillator.start(audioContext.currentTime);

                // Schedule stop and ramp down
                oscillator.stop(audioContext.currentTime + duration);
                // Ramp down volume smoothly before stopping
                gainNode.gain.setValueAtTime(1, audioContext.currentTime + duration - 0.01);
                gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration);


                oscillator.onended = () => {
                    if (oscillator && oscillator.connected) { // Check if it's the current oscillator
                         oscillator.disconnect();
                    }
                    resolve();
                };
            });
        }


        async function playMorseSequence(morse, customDotDur, customFreq) {
            if (isPlaying) return;
            isPlaying = true;
            stopMorseCode = false; // Reset stop flag
            playMorseBtn.disabled = true;
            if(stopMorseBtn) stopMorseBtn.disabled = false; // Enable stop button

            const currentPlaybackFrequency = typeof customFreq === 'number' ? customFreq : getPlaybackFrequency(); // MODIFIED

            let effectiveDotDuration;
            let effectiveInterCharSpace;
            let effectiveWordSpace;
            let effectiveIntraCharSilence;

            if (typeof customDotDur === 'number') {
                effectiveDotDuration = customDotDur;
                effectiveIntraCharSilence = effectiveDotDuration; // 1 unit silence after each signal
                effectiveInterCharSpace = 3 * effectiveDotDuration; // 3 units for inter-character
                effectiveWordSpace = 7 * effectiveDotDuration;    // 7 units for word space
            } else {
                // Use existing WPM/Farnsworth logic
                effectiveDotDuration = dotDuration; // Global dotDuration based on WPM
                effectiveIntraCharSilence = dotDuration; // Base silence is 1 WPM-based unit

                let spaceUnit = 1.2 / (farnsworthWpm > 0 && farnsworthWpm < wpm ? farnsworthWpm : wpm);
                effectiveInterCharSpace = 3 * spaceUnit;
                effectiveWordSpace = 7 * spaceUnit;
            }

            const signals = morse.split('');
            for (let i = 0; i < signals.length; i++) {
                if (stopMorseCode) {
                    console.log("Stopping Morse sequence playback.");
                    break;
                }

                const signal = signals[i];
                let signalDuration = 0;
                // Default silence after a signal is the intra-character silence unit
                let silenceDurationAfterSignal = effectiveIntraCharSilence;

                if (signal === '.') {
                    signalDuration = effectiveDotDuration;
                } else if (signal === '-') {
                    signalDuration = 3 * effectiveDotDuration;
                } else if (signal === ' ') { // Space between letters in the same word
                    // This signal itself is silence. The silence *after* this "signal" is what we calculate.
                    // The total silence for an inter-character space is `effectiveInterCharSpace`.
                    // Since `silenceDurationAfterSignal` (1 unit) is already added by default,
                    // we adjust the duration of this "space signal" to make up the difference.
                    signalDuration = 0; // No tone for space
                    // Total silence needed is effectiveInterCharSpace.
                    // The loop adds effectiveIntraCharSilence by default.
                    // So, the "duration" of this space signal should be effectiveInterCharSpace - effectiveIntraCharSilence
                    silenceDurationAfterSignal = effectiveInterCharSpace - effectiveIntraCharSilence;
                     if (silenceDurationAfterSignal < 0) silenceDurationAfterSignal = 0; // Should not happen with correct logic
                } else if (signal === '/') { // Space between words
                    signalDuration = 0; // No tone for space
                    // Total silence needed is effectiveWordSpace.
                    silenceDurationAfterSignal = effectiveWordSpace - effectiveIntraCharSilence;
                    if (silenceDurationAfterSignal < 0) silenceDurationAfterSignal = 0;
                }

                if (signalDuration > 0) {
                    await playTone(signalDuration, currentPlaybackFrequency);
                }

                // After the tone (or if it was a space character that has 0 signal duration), wait for its specific silence duration
                if (silenceDurationAfterSignal > 0 && !stopMorseCode) {
                    await new Promise(resolve => setTimeout(resolve, silenceDurationAfterSignal * 1000));
                }
            }
            isPlaying = false;
            playMorseBtn.disabled = false;
            if(stopMorseBtn) stopMorseBtn.disabled = true; // Disable stop button
            // Consider if the custom play button also needs its state managed (e.g., playTappedMorseBtn.disabled = false;)
            if (stopMorseCode) {
                console.log("Morse sequence officially ended due to stop request.");
            }
        }


        // --- UI Initialization ---
        function populateMorseReference() {
    const container = document.getElementById('morse-reference-container');
    if (!container) {
        console.error("Morse reference container not found!");
        return;
    }
    const containerWidth = container.offsetWidth;

    let numPairs;
    if (containerWidth > 900) {
        numPairs = 4;
    } else if (containerWidth > 600) {
        numPairs = 3;
    } else {
        numPairs = 2;
    }

    const referenceTable = container.querySelector('.reference-table');
    if (!referenceTable) {
        console.error("Reference table not found inside container!");
        return;
    }

    // Dynamically Generate Header (<thead>)
    const thead = referenceTable.querySelector('thead');
    if (!thead) {
        console.error("Thead not found in reference table!");
        return;
    }
    thead.innerHTML = ''; // Clear existing header
    const headerRow = document.createElement('tr');
    for (let k = 0; k < numPairs; k++) {
        const thChar = document.createElement('th');
        thChar.textContent = 'Character';
        headerRow.appendChild(thChar);
        const thMorse = document.createElement('th');
        thMorse.textContent = 'Morse';
        headerRow.appendChild(thMorse);
    }
    thead.appendChild(headerRow);

    // Dynamically Generate Body (<tbody>)
    const morseReferenceBody = document.getElementById('morse-reference-body');
    if (!morseReferenceBody) {
        console.error("Morse reference body not found!");
        return;
    }
    morseReferenceBody.innerHTML = ''; // Clear existing body content

    const characters = Object.keys(morseCode);
    let rowContent = '';

    for (let i = 0; i < characters.length; i++) {
        if (i % numPairs === 0) { // Start of a new row
            if (i > 0) {
                rowContent += '</tr>';
            }
            rowContent += '<tr>';
        }

        const char = characters[i];
        if (char === ' ') {
            continue; // Skip the space character for the reference table
        }
        const displayChar = char === ' ' ? 'Space' : char; // This line is now somewhat redundant for 'Space' but harmless
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

        rowContent += `<td id="ref-char-${idChar}">${displayChar}</td><td id="ref-morse-${idChar}">${morseCode[char]}</td>`;

        if (i === characters.length - 1) { // Last character
            const cellsInLastRow = (i % numPairs) + 1;
            if (cellsInLastRow < numPairs) {
                for (let j = cellsInLastRow; j < numPairs; j++) {
                    rowContent += '<td></td><td></td>'; // Add empty pairs for padding
                }
            }
            rowContent += '</tr>'; // Close the last row
        }
    }
    morseReferenceBody.innerHTML = rowContent;
}


        function applySavedTheme() {
            const savedTheme = localStorage.getItem('theme');
            const allAppContainers = document.querySelectorAll('.app-container');

            if (savedTheme === 'light') {
                document.body.classList.add('light-theme');
                allAppContainers.forEach(container => {
                    container.classList.add('light-theme-container');
                });
            } else {
                document.body.classList.remove('light-theme');
                allAppContainers.forEach(container => {
                    container.classList.remove('light-theme-container');
                });
            }
        }


        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            populateMorseReference();
            applySavedTheme(); // Apply theme on load
            updateDurations(); // Initialize durations based on default slider values

            // One-time audio initialization on first user interaction
            const masterAudioInitListener = () => {
                console.log("First user interaction, initializing master audio context.");
                initAudio();
                document.body.removeEventListener('click', masterAudioInitListener);
                document.body.removeEventListener('touchstart', masterAudioInitListener);
            };
            document.body.addEventListener('click', masterAudioInitListener);
            document.body.addEventListener('touchstart', masterAudioInitListener);

            // Set initial values for sliders display
            wpmValue.textContent = wpmSlider.value;
            farnsworthValue.textContent = farnsworthSlider.value;
            freqValue.textContent = freqSlider.value;

            // Event listener for "Play My Tapped Morse" button
            const playTappedMorseBtn = document.getElementById('play-tapped-morse-btn');
            const tapperDecodedOutputEl = document.getElementById('tapperDecodedOutput');

            if (playTappedMorseBtn && tapperDecodedOutputEl) {
                playTappedMorseBtn.addEventListener('click', async () => {
                    if (isPlaying) {
                        console.log("Audio is currently playing. Please wait.");
                        return;
                    }
                    initAudio(); // Ensure AudioContext is ready

                    const textToPlay = tapperDecodedOutputEl.textContent;
                    if (!textToPlay || textToPlay.trim() === '') {
                        console.log("No tapped text to play.");
                        // Optionally, provide user feedback e.g., alert("No tapped text to play.");
                        return;
                    }

                    const morseToPlay = textToMorse(textToPlay.toUpperCase());
                    if (!morseToPlay || morseToPlay.trim() === '') {
                        console.log("Could not convert tapped text to Morse.");
                        // Optionally, provide user feedback
                        return;
                    }

                    // Assuming UNIT_TIME_MS is globally available or getVisualTapperUnitTime() exists
                    let currentUnitTimeMs = 150; // Default if not found
                    if (typeof getVisualTapperUnitTime === 'function') {
                        currentUnitTimeMs = getVisualTapperUnitTime();
                    } else if (typeof UNIT_TIME_MS !== 'undefined') { // Fallback to global if getter undefined
                        currentUnitTimeMs = UNIT_TIME_MS;
                        console.warn("Using global UNIT_TIME_MS as getVisualTapperUnitTime() is not defined.");
                    } else if (typeof window.UNIT_TIME_MS !== 'undefined') { // Further fallback
                        currentUnitTimeMs = window.UNIT_TIME_MS;
                        console.warn("Using window.UNIT_TIME_MS as getVisualTapperUnitTime() is not defined.");
                    } else {
                        console.warn("Global UNIT_TIME_MS and getVisualTapperUnitTime() not found, using default 150ms for playback.");
                    }

                    const customDotDuration = currentUnitTimeMs / 1000.0; // Convert ms to seconds

                    await playMorseSequence(morseToPlay, customDotDuration, getPlaybackFrequency()); // MODIFIED to use getter
                });
            } else {
                console.error("Could not find 'play-tapped-morse-btn' or 'tapperDecodedOutput' elements.");
            }
        });

        // Debounced resize listener
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                populateMorseReference();
            }, 250); // Adjust delay as needed
        });

        // VISUAL TAPPER JS HAS BEEN MOVED FROM HERE

        // Capacitor Share Plugin Integration
        // Ensure Capacitor is available or use dynamic import if necessary
        // For simplicity, assuming Capacitor and its plugins are globally available
        // or correctly bundled/imported if using a module system.
        // If using ES Modules and a build step, you'd typically do:
        // import { Share } from '@capacitor/share';

        const shareButton = document.getElementById('share-btn');
        if (shareButton) {
            shareButton.addEventListener('click', async () => {
                // Ensure Capacitor's Share plugin is available
                if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Share) {
                    const { Share } = window.Capacitor.Plugins;
                    const textToShare = document.getElementById('text-input').value;

                    if (textToShare) {
                        try {
                            await Share.share({
                                title: 'Morse Code Practice',
                                text: `I just tapped this out in the Morse Code Learner: "${textToShare}"`,
                                dialogTitle: 'Share Your Message'
                            });
                        } catch (error) {
                            // Handle any errors during sharing, e.g., user cancels share dialog
                            console.error('Error sharing:', error);
                            // Optionally, display a message to the user if sharing fails,
                            // but often, cancellation is not treated as an error to be shown.
                            // alert("Sharing failed or was cancelled.");
                        }
                    } else {
                        alert("Nothing to share!");
                    }
                } else {
                    console.error('Capacitor Share plugin not available. Make sure Capacitor is initialized and the plugin is installed correctly.');
                    alert('Share functionality is not available on this platform or there was an issue loading it.');
                }
            });
        } else {
            console.warn("Share button with ID 'share-btn' not found.");
        }

        // --- Upsell Modal Logic ---
        const upsellModal = document.getElementById('upsell-modal');
        const goProBtn = document.getElementById('go-pro-btn');
        const goProFromLibraryBtn = document.getElementById('go-pro-from-library-btn');
        const closeUpsellModalBtn = document.getElementById('close-upsell-modal-btn');
        const upgradeToProBtn = document.getElementById('upgrade-to-pro-btn');
        const adBannerBottom = document.getElementById('ad-banner-bottom');

        function showUpsellModal() {
            if (upsellModal) {
                upsellModal.classList.remove('hidden');
            }
        }

        function hideUpsellModal() {
            if (upsellModal) {
                upsellModal.classList.add('hidden');
            }
        }

        // Function to update visibility of Pro/Free elements based on isProUser
        function updateUserProStatusUI() {
            // Ad banner visibility
            if (adBannerBottom) {
                if (window.isProUser) {
                    adBannerBottom.classList.add('hidden');
                } else {
                    adBannerBottom.classList.remove('hidden');
                }
            }

            // Book library banner and locked states (call populate which now handles this)
            if (typeof populateBookLibrary === 'function') {
                 // Check if the book cipher tab is active or if it's okay to populate it
                 // For simplicity, we can call it. It might re-render the library.
                 // If performance becomes an issue, this could be optimized.
                populateBookLibrary();
            }

            // Koch method restrictions are handled within Koch method logic when user completes a session.
            // However, if we want to immediately reflect a change in isProUser on the Koch UI (e.g. a message), it would go here.
            // For now, the existing Koch logic handles the functional restriction.

            // "Go Pro" button in settings - potentially hide if user becomes Pro.
            // For now, the button remains visible. If it should be hidden:
            // if (goProBtn) {
            //     if (window.isProUser) {
            //         goProBtn.classList.add('hidden'); // Or change text to "You are Pro!"
            //     } else {
            //         goProBtn.classList.remove('hidden');
            //     }
            // }
        }


        if (goProBtn) {
            goProBtn.addEventListener('click', showUpsellModal);
        }
        if (goProFromLibraryBtn) {
            goProFromLibraryBtn.addEventListener('click', showUpsellModal);
        }
        if (closeUpsellModalBtn) {
            closeUpsellModalBtn.addEventListener('click', hideUpsellModal);
        }
        if (upgradeToProBtn) {
            upgradeToProBtn.addEventListener('click', () => {
                // For now, this button doesn't trigger a real purchase.
                // It could, for example, close the modal or show a "Coming Soon" message.
                console.log('Upgrade to Pro button clicked - Placeholder action');
                // For testing: Toggle Pro status and update UI
                window.isProUser = !window.isProUser;
                console.log('isProUser toggled to:', window.isProUser);
                updateUserProStatusUI();
                hideUpsellModal(); // Hide modal after "purchase"
            });
        }

        // Initial UI update based on isProUser status when DOM is loaded
        document.addEventListener('DOMContentLoaded', () => {
            // ... other DOMContentLoaded logic ...
            updateUserProStatusUI();

            // Initialize and show banner ad
            if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob) {
                const { AdMob } = window.Capacitor.Plugins;
                AdMob.initialize({
                    requestTrackingAuthorization: true, // Optional: if you want to request tracking authorization via AdMob
                    testingDevices: [], // Add test device IDs if needed: e.g., ["YOUR_TEST_DEVICE_ID"]
                    initializeForTesting: true, // Set to true for test ads from Google, false for production
                })
                .then(() => {
                    console.log("AdMob initialized successfully.");
                    // Now show the banner ad
                    AdMob.showBanner({
                        adId: "ca-app-pub-xxxxxxxxxxxxxxxxx/yyyyyyyyyy", // Replace with your actual Banner Ad Unit ID
                        adSize: "BANNER", // or "ADAPTIVE_BANNER", "SMART_BANNER" etc.
                        position: "BOTTOM_CENTER", // AdMob will handle placing it at bottom. Our CSS container is a fallback or for web.
                        margin: 0, // Margin in pixels, if needed
                        isTesting: true, // IMPORTANT: Set to true for development/testing, false for production
                        // npa: true, // Non-Personalized Ads, if consent requires it
                    })
                    .then(() => {
                        console.log("Banner ad shown successfully.");
                        // If the ad is loaded into #ad-banner-container by native code, no further JS action needed for placement.
                        // If native code expects a specific div ID to be passed, adjust the call.
                        // The current plan implies the native SDK handles placement within the container we made.
                    })
                    .catch(error => {
                        console.error("Error showing banner ad:", error);
                    });
                })
                .catch(error => {
                    console.error("Error initializing AdMob:", error);
                });
            } else {
                console.warn("AdMob Capacitor plugin not available. Banner ad will not be shown.");
                // Fallback or hide #ad-banner-container if plugin isn't there
                const adBannerContainer = document.getElementById('ad-banner-container');
                if (adBannerContainer) {
                    // adBannerContainer.style.display = 'none'; // Or add a class to hide it
                }
            }
        });
