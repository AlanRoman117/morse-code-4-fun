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
window.getVisualTapperUnitTime = getVisualTapperUnitTime; // Expose to global

// Function to set tapper active state for playback
function setTapperActive(isActive) {
    const tapperElement = document.getElementById('tapper');
    if (tapperElement) {
        if (isActive) {
            tapperElement.classList.add('active');
        } else {
            tapperElement.classList.remove('active');
        }
    }
}
window.setTapperActive = setTapperActive; // Expose to global

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
        // Allow sound if story playback is active OR if master sound is enabled (or undefined initially).
        const storyPlaybackActiveOnBookCipher = window.isPlayingStoryPlayback && document.getElementById('book-game-view') && !document.getElementById('book-game-view').classList.contains('hidden');
        const masterSoundEnabled = (typeof window.isMasterSoundEnabled === 'undefined') || window.isMasterSoundEnabled;

        if (!storyPlaybackActiveOnBookCipher && !masterSoundEnabled) {
            return; // Sound is explicitly off and not in story playback mode
        }

        // Original sound playing logic
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
                    tapperTone.triggerRelease(); // Ensure previous note is released
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
    window.playTapSound = playTapSound; // Expose to global

    function stopTapSound() {
        if (tapperTone && typeof tapperTone.triggerRelease === 'function') {
            tapperTone.triggerRelease();
        }
    }
    window.stopTapSound = stopTapSound; // Expose to global
    
    tapper.addEventListener('touchstart', (e) => {
        if (window.isPlayingStoryPlayback) { e.preventDefault(); return; }
        e.preventDefault();
        tapper.classList.add('active');
        playTapSound();
        tapStartTime = Date.now();
        clearTimeout(silenceTimer);
    });

    tapper.addEventListener('touchend', (e) => {
        if (window.isPlayingStoryPlayback) { e.preventDefault(); return; }
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
        if (window.isPlayingStoryPlayback) { e.preventDefault(); return; }
        tapper.classList.add('active');
        playTapSound();
        tapStartTime = Date.now();
        clearTimeout(silenceTimer);
    });

    tapper.addEventListener('mouseup', (e) => {
        if (window.isPlayingStoryPlayback) { e.preventDefault(); return; }
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
        if (window.isPlayingStoryPlayback) { return; }
        if (tapper.classList.contains('active')) {
            tapper.classList.remove('active');
            stopTapSound();
            tapStartTime = 0;
            // console.log("Mouse left tapper while active, tap cancelled/reset."); // Log removed
        }
    });

    spaceButton.addEventListener('click', () => {
        if (window.isPlayingStoryPlayback || isPlayingBack) return; // Check both flags
        clearTimeout(silenceTimer);
        decodeMorse(true);
    });

    deleteLastCharButton.addEventListener('click', () => {
        if (window.isPlayingStoryPlayback || isPlayingBack) return; // Check both flags
        // console.log("[VisualTapper] Delete Last Char Button clicked."); // Log removed
        // if (isPlayingBack) { // This check is now part of the combined condition above
            // console.log("[VisualTapper] Delete ignored: isPlayingBack is true."); // Log removed
            // return;
        // }
        deleteLastDecodedChar();
    });

    document.addEventListener('keydown', (event) => {
        if (window.isPlayingStoryPlayback) { event.preventDefault(); return; } // Ignore keydown if story playback

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
            if (isPlayingBack) return; // Keep original isPlayingBack check for non-story playback scenarios
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
            if (isPlayingBack) return; // Keep original isPlayingBack check
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
        updateVisualTapperUnitTime(parseInt(savedUnitTime)); 
    } else {
        updateVisualTapperUnitTime(UNIT_TIME_MS);
    }

    // --- Suggestion Side Toggle Logic ---
    const toggleSuggestionSideBtn = document.getElementById('toggle-suggestion-side-btn');
    const suggestionsPanel = document.getElementById('predictive-taps-display'); // Renamed for clarity
    // const tapper = document.getElementById('tapper'); // REMOVED: tapper is already defined above in this scope

    function applySuggestionSidePreference(side) {
        // 'tapper' const is available from the top of the DOMContentLoaded scope
        if (!suggestionsPanel || !tapper) {
            // console.warn("Tapper or suggestions panel not found for positioning."); // Keep if debugging needed
            return;
        }

        // Ensure suggestionsPanel is visible to get correct offsetWidth, otherwise defer or use last known width.
        // This function will be called by updatePredictiveDisplay after it's made visible.
        if (suggestionsPanel.offsetParent === null && !suggestionsPanel.classList.contains('hidden')) {
             // It's not hidden by class, but might be display:none via parent.
             // console.warn("Suggestions panel is not visible for offsetWidth calculation in applySuggestionSidePreference. Deferring or check visibility logic.");
             // To prevent errors, we can skip positioning if it's not truly visible.
             // The call from updatePredictiveDisplay will handle it once visible.
             return;
        }


        const tapperContainer = tapper.parentElement; // This is the flex row div
        if (!tapperContainer) {
            // console.warn("Tapper container not found."); // Keep if debugging
            return;
        }

        const tapperRect = tapper.getBoundingClientRect();
        const containerRect = tapperContainer.getBoundingClientRect(); // This container is the one that centers the tapper

        // Calculate tapper's edges relative to its immediate parent container's coordinate system
        const tapperLeftEdgeInContainer = tapperRect.left - containerRect.left;
        const tapperRightEdgeInContainer = tapperRect.right - containerRect.left;

        const desiredGapPx = 8; // 0.5rem
        const suggestionsPanelWidth = suggestionsPanel.offsetWidth;

        // Clear potentially conflicting Tailwind classes and old inline styles
        suggestionsPanel.classList.remove('left-4', 'right-4', 'order-first', 'order-last', 'mr-2', 'ml-2');
        suggestionsPanel.style.left = '';
        suggestionsPanel.style.right = '';

        if (side === 'right') {
            const newLeft = tapperRightEdgeInContainer + desiredGapPx;
            suggestionsPanel.style.left = newLeft + 'px';
            // console.log(`Set suggestions (right): left=${newLeft}px`); // Keep if debugging
        } else { // Default to 'left'
            const newLeft = tapperLeftEdgeInContainer - suggestionsPanelWidth - desiredGapPx;
            suggestionsPanel.style.left = newLeft + 'px';
            // console.log(`Set suggestions (left): left=${newLeft}px`); // Keep if debugging
        }
    }
    window.applySuggestionSidePreference = applySuggestionSidePreference;

    if (toggleSuggestionSideBtn && suggestionsPanel) {
        toggleSuggestionSideBtn.addEventListener('click', () => {
            const currentSide = localStorage.getItem('suggestionSide') || 'left';
            const newSide = (currentSide === 'left') ? 'right' : 'left';
            localStorage.setItem('suggestionSide', newSide);
            applySuggestionSidePreference(newSide); // Apply immediately
        });
    }

    // Initial application on load - might be imperfect if elements not fully rendered/visible.
    // The call from updatePredictiveDisplay is more reliable for precise positioning.
    const savedSuggestionSide = localStorage.getItem('suggestionSide');
    // Apply initially, will be corrected by updatePredictiveDisplay if panel is shown then.
    // Or by resize handler if panel is already visible and window resizes.
    applySuggestionSidePreference(savedSuggestionSide || 'left');
    // --- End Suggestion Side Toggle Logic ---


    // --- Debounced Resize Handler ---
    function debounce(func, wait, immediate) {
        let timeout;
        return function() {
            const context = this, args = arguments;
            const later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }

    const handleResize = debounce(() => {
        if (suggestionsPanel && !suggestionsPanel.classList.contains('hidden')) {
            // console.log("Debounced resize event: Recalculating suggestion panel position."); // For debugging
            applySuggestionSidePreference(localStorage.getItem('suggestionSide') || 'left');
        }
    }, 250); // Debounce by 250ms

    window.addEventListener('resize', handleResize);
    // --- End Debounced Resize Handler ---

    if (suggestionsPanel) {
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
    const overallDisplayPanel = document.getElementById('predictive-taps-display'); // Parent panel for visibility
    const pillsContainer = document.getElementById('suggestion-pills-container'); // Child for pills content

    if (!overallDisplayPanel || !pillsContainer) {
        console.error("Predictive display panel or pills container not found.");
        return;
    }

    if (morseString && morseString.length > 0) {
        if (predictiveDisplayTimeout) {
            clearTimeout(predictiveDisplayTimeout);
            predictiveDisplayTimeout = null;
        }
        let exactMatchHtml = "";
        let partialMatchesHtml = [];
        if (typeof morseCode === 'undefined') { 
            console.error("morseCode dictionary is not available to updatePredictiveDisplay.");
            pillsContainer.innerHTML = "<span class='text-red-500'>Error: Morse dictionary unavailable.</span>";
            overallDisplayPanel.classList.remove('hidden', 'opacity-0');
            void overallDisplayPanel.offsetWidth; // Trigger reflow for transition
            overallDisplayPanel.classList.add('opacity-100');
            predictiveDisplayTimeout = setTimeout(() => {
                overallDisplayPanel.classList.remove('opacity-100');
                overallDisplayPanel.classList.add('opacity-0');
                predictiveDisplayTimeout = null; 
                setTimeout(() => { overallDisplayPanel.classList.add('hidden'); }, 500);
            }, 6000);
            return;
        }
        for (const char in morseCode) {
            const currentMorseValue = morseCode[char];
            if (currentMorseValue === morseString) {
                exactMatchHtml = `<span class="char-badge exact-match-highlight text-xs font-mono rounded-md px-2 py-1 mr-1 mb-1 inline-block">${char} (${currentMorseValue})</span>`;
            } else if (currentMorseValue.startsWith(morseString)) {
                partialMatchesHtml.push(`<span class="char-badge bg-gray-600 text-gray-200 text-xs font-mono rounded-md px-2 py-1 mr-1 mb-1 inline-block">${char} (${currentMorseValue})</span>`);
            }
        }
        const finalHtml = exactMatchHtml + partialMatchesHtml.join('');
        if (finalHtml.length > 0) {
            pillsContainer.innerHTML = finalHtml;
            overallDisplayPanel.classList.remove('hidden', 'opacity-0');
            void overallDisplayPanel.offsetWidth; // Trigger reflow
            overallDisplayPanel.classList.add('opacity-100');
            // Ensure position is correctly set now that it's visible and has dimensions
            applySuggestionSidePreference(localStorage.getItem('suggestionSide') || 'left');
            predictiveDisplayTimeout = setTimeout(() => {
                overallDisplayPanel.classList.remove('opacity-100');
                overallDisplayPanel.classList.add('opacity-0');
                predictiveDisplayTimeout = null; 
                setTimeout(() => { overallDisplayPanel.classList.add('hidden'); }, 500);
            }, 6000);
        } else { 
            pillsContainer.innerHTML = "<span class='text-gray-500'>No match</span>";
            overallDisplayPanel.classList.remove('hidden', 'opacity-0');
            void overallDisplayPanel.offsetWidth; // Trigger reflow
            overallDisplayPanel.classList.add('opacity-100');
            // Ensure position is correctly set for "No match" case too
            applySuggestionSidePreference(localStorage.getItem('suggestionSide') || 'left');
            predictiveDisplayTimeout = setTimeout(() => {
                overallDisplayPanel.classList.remove('opacity-100');
                overallDisplayPanel.classList.add('opacity-0');
                predictiveDisplayTimeout = null; 
                setTimeout(() => { overallDisplayPanel.classList.add('hidden'); }, 500);
            }, 6000);
        }
    } 
    else { // morseString is empty or null
        if (predictiveDisplayTimeout) {
            // Active timeout, let it run to hide the panel.
        } else {
            // No active timeout, and morseString is empty, so hide panel immediately.
            overallDisplayPanel.classList.remove('opacity-100');
            overallDisplayPanel.classList.add('opacity-0');
            setTimeout(() => {
                overallDisplayPanel.classList.add('hidden');
                pillsContainer.innerHTML = ""; // Clear pills when hiding due to empty input
            }, 500);
        }
    }
}
window.resetVisualTapperState = resetVisualTapperState; // Expose to global scope

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
