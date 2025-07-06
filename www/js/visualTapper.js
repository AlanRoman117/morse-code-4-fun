// Top of js/visualTapper.js
// These variables are script-global, accessible within the DOMContentLoaded and by resetVisualTapperState
let UNIT_TIME_MS = 150; 
let DOT_THRESHOLD_MS = UNIT_TIME_MS * 1.5;
let LETTER_SPACE_SILENCE_MS = UNIT_TIME_MS * 3;
let predictiveDisplayTimeout = null; // For managing the hide timer

// State variables for the visual tapper, scoped to be accessible by resetVisualTapperState
let currentMorse = "";
let tapStartTime = 0;
let silenceTimer = null;
let currentText = ""; // Holds the sequence of decoded characters by the tapper.
let lastTapTime = 0; // For double-tap zoom prevention

// Constants
const DOUBLE_TAP_THRESHOLD_MS = 300; // Threshold for detecting a double tap

// Function to update unit time and related variables
function updateVisualTapperUnitTime(newUnitTime) {
  UNIT_TIME_MS = parseInt(newUnitTime);
  DOT_THRESHOLD_MS = UNIT_TIME_MS * 1.5;
  LETTER_SPACE_SILENCE_MS = UNIT_TIME_MS * 3;
  localStorage.setItem('visualTapperUnitTime', UNIT_TIME_MS.toString());
  // console.log("Visual Tapper UNIT_TIME_MS updated to:", UNIT_TIME_MS, "Derived DOT_THRESHOLD_MS:", DOT_THRESHOLD_MS, "LETTER_SPACE_SILENCE_MS:", LETTER_SPACE_SILENCE_MS); // Log removed
}

// Add this new getter function
function getVisualTapperUnitTime() {
  return UNIT_TIME_MS;
}

document.addEventListener('DOMContentLoaded', () => {
    // --- Visual Tapper JavaScript ---
    const tapper = document.getElementById('tapper');
    const tapperMorseOutput = document.getElementById('tapperMorseOutput');
    const spaceButton = document.getElementById('spaceButton');
    const deleteLastCharButton = document.getElementById('deleteLastCharButton');

    if (!tapper || !tapperMorseOutput || !spaceButton || !deleteLastCharButton) {
        console.error("VisualTapper Error: One or more essential tapper DOM elements (tapper, tapperMorseOutput, spaceButton, deleteLastCharButton) not found. Tapper will not initialize.");
        return; // Stop initialization if critical elements are missing
    }

    // Populate morseToChar from global morseCode
    const morseToChar = {};
    if (typeof morseCode === 'undefined' || morseCode === null) {
        console.error('visualTapper.js Error: morseCode global object not found or is null. This script should be loaded after the script defining morseCode.');
    } else {
        for (const char in morseCode) {
            morseToChar[morseCode[char]] = char.toUpperCase();
        }
    }
    
    const TAP_SOUND_FREQ = 770;
    let isPlayingBack = false;
    let tapperTone = null;

    function checkPractice() { 
    }
    function showMessage(message, type, duration) {
        // console.log(`Tapper Message: ${message} (Type: ${type}, Duration: ${duration})`); // Kept for now if it's not purely diagnostic
    }

    function playTapSound() {
        if (typeof window.isMasterSoundEnabled !== 'undefined' && !window.isMasterSoundEnabled) {
            return;
        }
        if (typeof Tone !== 'undefined' && Tone && Tone.Synth) {
            const playNoteInternal = () => {
                if (!tapperTone) {
                    try {
                        tapperTone = new Tone.Synth({
                            oscillator: { type: 'sine' },
                            envelope: { attack: 0.005, decay: 0.01, sustain: 0.9, release: 0.05 }
                        }).toDestination();
                    } catch (e) {
                        console.error("Failed to create Tone.Synth for tapper:", e);
                        return;
                    }
                }
                if (tapperTone && typeof tapperTone.triggerAttack === 'function') {
                    tapperTone.triggerRelease();
                    tapperTone.triggerAttack(TAP_SOUND_FREQ, Tone.now());
                }
            };
            if (Tone.context.state !== 'running') {
                Tone.start().then(() => {
                    playNoteInternal();
                }).catch(e => {
                    console.warn("Tone.js audio context couldn't start via playTapSound's Tone.start(): ", e);
                });
            } else {
                playNoteInternal();
            }
        }
    }

    function stopTapSound() {
        if (tapperTone && typeof tapperTone.triggerRelease === 'function') {
            tapperTone.triggerRelease();
        }
    }
    
    tapper.addEventListener('touchstart', (e) => {
        e.preventDefault();
        tapper.classList.add('active');
        playTapSound();
        tapStartTime = Date.now();
        clearTimeout(silenceTimer);
    });

    tapper.addEventListener('touchend', (e) => {
        e.preventDefault();
        if (tapStartTime === 0) return;
        tapper.classList.remove('active');
        stopTapSound();
        let duration = Date.now() - tapStartTime;
        currentMorse += (duration < DOT_THRESHOLD_MS) ? "." : "-";
        if (tapperMorseOutput) tapperMorseOutput.textContent = currentMorse;
        if (typeof window.updateTableHighlight === "function") window.updateTableHighlight(currentMorse);
        updatePredictiveDisplay(currentMorse);
        tapStartTime = 0;
        clearTimeout(silenceTimer);
        silenceTimer = setTimeout(() => { decodeMorse(false); }, LETTER_SPACE_SILENCE_MS);
    });

    tapper.addEventListener('mousedown', (e) => {
        tapper.classList.add('active');
        playTapSound();
        tapStartTime = Date.now();
        clearTimeout(silenceTimer);
    });

    tapper.addEventListener('mouseup', (e) => {
        if (tapStartTime === 0) return;
        tapper.classList.remove('active');
        stopTapSound();
        let duration = Date.now() - tapStartTime;
        currentMorse += (duration < DOT_THRESHOLD_MS) ? "." : "-";
        if (tapperMorseOutput) tapperMorseOutput.textContent = currentMorse;
        if (typeof window.updateTableHighlight === "function") window.updateTableHighlight(currentMorse);
        updatePredictiveDisplay(currentMorse);
        tapStartTime = 0;
        clearTimeout(silenceTimer);
        silenceTimer = setTimeout(() => { decodeMorse(false); }, LETTER_SPACE_SILENCE_MS);
    });

    tapper.addEventListener('mouseleave', (e) => {
        if (tapper.classList.contains('active')) {
            tapper.classList.remove('active');
            stopTapSound();
            tapStartTime = 0;
            // console.log("Mouse left tapper while active, tap cancelled/reset."); // Log removed
        }
    });

    spaceButton.addEventListener('click', () => {
        if (isPlayingBack) return;
        clearTimeout(silenceTimer);
        decodeMorse(true);
    });

    deleteLastCharButton.addEventListener('click', () => {
        // console.log("[VisualTapper] Delete Last Char Button clicked."); // Log removed
        if (isPlayingBack) {
            // console.log("[VisualTapper] Delete ignored: isPlayingBack is true."); // Log removed
            return;
        }
        deleteLastDecodedChar();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === ' ' || event.keyCode === 32) {
            const activeElement = document.activeElement;
            if (activeElement) {
                const tagName = activeElement.tagName.toLowerCase();
                const isContentEditable = activeElement.isContentEditable;
                if (tagName === 'input' || tagName === 'textarea' || isContentEditable) {
                    return;
                }
            }
            event.preventDefault();
            if (isPlayingBack) return;
            clearTimeout(silenceTimer);
            decodeMorse(true);
            if (spaceButton) {
                spaceButton.classList.add('active');
                setTimeout(() => { spaceButton.classList.remove('active'); }, 100);
            }
        }
        else if (event.key === 'Backspace' || event.keyCode === 8) {
            const activeElement = document.activeElement;
            if (activeElement) {
                const tagName = activeElement.tagName.toLowerCase();
                const isContentEditable = activeElement.isContentEditable;
                if (tagName === 'input' || tagName === 'textarea' || isContentEditable) {
                    return;
                }
            }
            event.preventDefault();
            if (isPlayingBack) return;
            deleteLastDecodedChar();
            if (deleteLastCharButton) {
                deleteLastCharButton.classList.add('active');
                setTimeout(() => { deleteLastCharButton.classList.remove('active'); }, 100);
            }
        }
    });

    function deleteLastDecodedChar() {
        // console.log("[VisualTapper] deleteLastDecodedChar called. currentText before delete:", currentText); // Log removed
        if (currentText.length > 0) {
            currentText = currentText.slice(0, -1);
            // console.log("[VisualTapper] currentText after delete:", currentText); // Log removed
            const event = new CustomEvent('visualTapperInput', {
                detail: { type: 'delete_char', newFullText: currentText }
            });
            document.dispatchEvent(event);
            // console.log("[VisualTapper] Dispatched visualTapperInput (delete_char) with newFullText:", currentText); // Log removed
        } else {
            // console.log("[VisualTapper] No characters to delete from currentText."); // Log removed
        }
    }

    function decodeMorse(isExplicitAction) {
        clearTimeout(silenceTimer);
        const morseStringForEvent = currentMorse;
        if (currentMorse.length > 0) {
            const charToAdd = morseToChar[currentMorse];
            if (charToAdd) {
                currentText += charToAdd;
            } else {
                console.warn(`VisualTapper: Unknown Morse sequence: ${currentMorse}`);
            }
        } else if (isExplicitAction) {
            // console.log("VisualTapper: Space button pressed with no pending Morse signals."); // Log removed (or keep if useful for non-debug)
        }
        let eventDetail = null;
        if (morseStringForEvent && morseStringForEvent.length > 0) {
            eventDetail = { type: 'char', value: morseStringForEvent };
        } else if (isExplicitAction && currentMorse.length === 0) {
            eventDetail = { type: 'word_space' };
        }
        if (eventDetail) {
            const event = new CustomEvent('visualTapperInput', { detail: eventDetail });
            document.dispatchEvent(event);
        }
        currentMorse = "";
        if (tapperMorseOutput) tapperMorseOutput.textContent = currentMorse;
        if (typeof window.updateTableHighlight === "function") window.updateTableHighlight(currentMorse);
        updatePredictiveDisplay(currentMorse);
        checkPractice();
    }

    tapper.addEventListener('touchcancel', (e) => {
        // console.log("Touch cancelled, resetting tapper state.");  // Log removed
        if (tapper.classList.contains('active')) {
            tapper.classList.remove('active');
            stopTapSound();
            tapStartTime = 0;
        }
    });

    if (typeof Tone === 'undefined') {
        console.warn("VisualTapper: Tone.js library not detected. Tap sounds will be unavailable.");
    }

    const savedUnitTime = localStorage.getItem('visualTapperUnitTime');
    if (savedUnitTime) {
        // console.log("Found saved unit time in localStorage:", savedUnitTime); // Log removed
        updateVisualTapperUnitTime(parseInt(savedUnitTime)); 
    } else {
        // console.log("No saved unit time in localStorage, ensuring default configuration is applied via updateVisualTapperUnitTime."); // Log removed
        updateVisualTapperUnitTime(UNIT_TIME_MS);
    }

    const predictiveDisplayElement = document.getElementById('predictive-taps-display');
    if (predictiveDisplayElement) {
        const interactionHandler = () => {
            if (predictiveDisplayTimeout && !predictiveDisplayElement.classList.contains('hidden') && !predictiveDisplayElement.classList.contains('opacity-0')) {
                // console.log('User interaction with predictive display detected. Resetting hide timer.'); // Log removed
                resetPredictiveDisplayHideTimer(); 
            }
        };
        predictiveDisplayElement.addEventListener('touchstart', interactionHandler, { passive: true });
        predictiveDisplayElement.addEventListener('click', interactionHandler);
        predictiveDisplayElement.addEventListener('wheel', interactionHandler, { passive: true });
    } else {
        console.warn("Predictive taps display element not found for attaching interaction listeners.");
    }
});

function resetPredictiveDisplayHideTimer() {
    const displayElement = document.getElementById('predictive-taps-display');
    if (!displayElement || displayElement.classList.contains('hidden') || displayElement.classList.contains('opacity-0')) {
        // console.log('resetPredictiveDisplayHideTimer called, but display not in a state to reset timer.'); // Log removed
        return;
    }
    // console.log('Resetting predictive display hide timer. Current timer ID:', predictiveDisplayTimeout); // Log removed
    if (predictiveDisplayTimeout) {
        clearTimeout(predictiveDisplayTimeout);
    }
    predictiveDisplayTimeout = setTimeout(() => {
        // console.log('6s timeout expired after user interaction. Hiding.'); // Log removed
        displayElement.classList.remove('opacity-100');
        displayElement.classList.add('opacity-0');
        predictiveDisplayTimeout = null; 
        setTimeout(() => { displayElement.classList.add('hidden'); }, 500);
    }, 6000);
    // console.log('New predictive display hide timer set with ID:', predictiveDisplayTimeout); // Log removed
}

function updatePredictiveDisplay(morseString) {
    const sharedTapperWrapper = document.getElementById('sharedVisualTapperWrapper');
    const currentTapperParent = sharedTapperWrapper ? sharedTapperWrapper.parentNode : null;
    if (currentTapperParent && currentTapperParent.dataset && currentTapperParent.dataset.predictiveDisplay === 'hidden') {
        const displayElement = document.getElementById('predictive-taps-display');
        if (displayElement && !displayElement.classList.contains('hidden')) {
            displayElement.classList.add('hidden');
            displayElement.classList.remove('opacity-100');
            displayElement.classList.add('opacity-0');
            if (predictiveDisplayTimeout) {
                clearTimeout(predictiveDisplayTimeout);
                predictiveDisplayTimeout = null;
            }
        }
        return;
    }
    // console.log('updatePredictiveDisplay CALLED - Time:', Date.now(), '| Morse:', morseString, '| Current Timeout ID before logic:', predictiveDisplayTimeout); // Log removed
    const displayElement = document.getElementById('predictive-taps-display');
    if (!displayElement) return;

    if (morseString && morseString.length > 0) {
        if (predictiveDisplayTimeout) {
            clearTimeout(predictiveDisplayTimeout);
            predictiveDisplayTimeout = null;
            // console.log('Cleared existing timeout due to new morseString:', morseString); // Log removed
        }
        let exactMatchHtml = "";
        let partialMatchesHtml = [];
        if (typeof morseCode === 'undefined') { 
            console.error("morseCode dictionary is not available to updatePredictiveDisplay.");
            displayElement.innerHTML = "<span class='text-red-500'>Error: Morse dictionary unavailable.</span>";
            displayElement.classList.remove('hidden', 'opacity-0');
            void displayElement.offsetWidth;
            displayElement.classList.add('opacity-100');
            predictiveDisplayTimeout = setTimeout(() => {
                // console.log('6s timeout for error message expired. Hiding.'); // Log removed
                displayElement.classList.remove('opacity-100');
                displayElement.classList.add('opacity-0');
                predictiveDisplayTimeout = null; 
                setTimeout(() => { displayElement.classList.add('hidden'); }, 500);
            }, 6000);
            return;
        }
        for (const char in morseCode) {
            const currentMorseValue = morseCode[char];
            if (currentMorseValue === morseString) {
                // console.log('Exact match found for:', char, morseString, 'Applying highlight class.');  // Log removed
                exactMatchHtml = `<span class="char-badge exact-match-highlight text-xs font-mono rounded-md px-2 py-1 mr-1 mb-1 inline-block">${char} (${currentMorseValue})</span>`;
            } else if (currentMorseValue.startsWith(morseString)) {
                partialMatchesHtml.push(`<span class="char-badge bg-gray-600 text-gray-200 text-xs font-mono rounded-md px-2 py-1 mr-1 mb-1 inline-block">${char} (${currentMorseValue})</span>`);
            }
        }
        const finalHtml = exactMatchHtml + partialMatchesHtml.join('');
        if (finalHtml.length > 0) {
            displayElement.innerHTML = finalHtml;
            displayElement.classList.remove('hidden', 'opacity-0');
            void displayElement.offsetWidth;
            displayElement.classList.add('opacity-100');
            // console.log('Displaying predictions. Setting 6s timeout.'); // Log removed
            predictiveDisplayTimeout = setTimeout(() => {
                // console.log('6s timeout for predictions expired. Hiding.'); // Log removed
                displayElement.classList.remove('opacity-100');
                displayElement.classList.add('opacity-0');
                predictiveDisplayTimeout = null; 
                setTimeout(() => { displayElement.classList.add('hidden'); }, 500);
            }, 6000);
        } else { 
            displayElement.innerHTML = "<span class='text-gray-500'>No match</span>";
            displayElement.classList.remove('hidden', 'opacity-0');
            void displayElement.offsetWidth;
            displayElement.classList.add('opacity-100');
            // console.log('Displaying "No match". Setting 6s timeout.'); // Log removed
            predictiveDisplayTimeout = setTimeout(() => {
                // console.log('6s timeout for "No match" expired. Hiding.'); // Log removed
                displayElement.classList.remove('opacity-100');
                displayElement.classList.add('opacity-0');
                predictiveDisplayTimeout = null; 
                setTimeout(() => { displayElement.classList.add('hidden'); }, 500);
            }, 6000);
        }
    } 
    else { 
        if (predictiveDisplayTimeout) {
            // console.log('Empty morseString received, but a timeout (ID:', predictiveDisplayTimeout, ') is active. Letting it run.'); // Log removed
        } else {
            // console.log('Empty morseString and NO active timeout. Hiding now.'); // Log removed
            displayElement.classList.remove('opacity-100');
            displayElement.classList.add('opacity-0');
            setTimeout(() => {
                displayElement.classList.add('hidden');
                displayElement.innerHTML = "";
            }, 500);
        }
    }
}

function resetVisualTapperState() {
    currentMorse = "";
    tapStartTime = 0;
    if (silenceTimer) {
        clearTimeout(silenceTimer);
        silenceTimer = null;
    }
    currentText = "";
    const tapperMorseOutputElement = document.getElementById('tapperMorseOutput');
    if (tapperMorseOutputElement) {
        tapperMorseOutputElement.textContent = "";
    }
    const tapperElement = document.getElementById('tapper');
    if (tapperElement) {
        tapperElement.classList.remove('active');
    }
    // console.log("VisualTapper state reset. (updateTableHighlight call commented out for testing)"); // Log removed
    updatePredictiveDisplay("");
    const toggleReferenceBtn = document.getElementById('toggle-reference-btn');
    const morseReferenceContainer = document.getElementById('morse-reference-container');
    if (toggleReferenceBtn && morseReferenceContainer) {
        toggleReferenceBtn.addEventListener('click', () => {
            const isHidden = morseReferenceContainer.classList.toggle('hidden');
            toggleReferenceBtn.textContent = isHidden ? 'Show Morse Reference' : 'Hide Morse Reference';
        });
    } else {
        console.warn("Could not find toggle reference button or container for collapsible functionality.");
    }
}
