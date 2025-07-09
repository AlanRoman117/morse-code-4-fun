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

// let toneStartAttempted = false; // REMOVED
let visualTapperIsToneReady = false; // Flag set by main.js after modal dismissal and Tone.start() attempt
// let primingTapAttemptedThisLoad = false; // REMOVED - No longer needed with modal priming

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

// Setter function for main.js to call after attempting Tone.start() via modal
window.setToneContextConfirmedRunning = function(isReady) {
    visualTapperIsToneReady = isReady;
    console.log('visualTapper.js: visualTapperIsToneReady set to:', visualTapperIsToneReady);
};

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

        // playNoteInternal definition is above this

        if (typeof Tone === 'undefined' || !Tone.Synth) { // Check for Tone and Tone.Synth
            console.warn("playTapSound: Tone.js or Tone.Synth not available.");
            return;
        }

        if (!visualTapperIsToneReady) {
            console.warn("playTapSound: Tone.js not confirmed ready by modal/startup. Tap sound skipped.");
            return;
        }

        // If visualTapperIsToneReady is true, Tone.context should be 'running'.
        // A redundant check for safety, but main reliance is on the flag.
        if (Tone.context && Tone.context.state !== 'running') {
            console.warn(`playTapSound: visualTapperIsToneReady is true, but Tone.context.state is '${Tone.context.state}'. Sound may fail.`);
            // Optionally, try a last-ditch Tone.start() here, but it might complicate things.
            // For now, proceed, assuming the flag is the source of truth from modal interaction.
        }

        playNoteInternal();
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

    function logLayoutDiagnostics(logPrefix) {
        const navElement = document.querySelector('nav.fixed.bottom-0'); // Selector for the mobile bottom nav
        if (navElement) {
            const navRect = navElement.getBoundingClientRect();
            console.log(`${logPrefix} Nav - BRect: T:${navRect.top.toFixed(1)}, L:${navRect.left.toFixed(1)}, W:${navRect.width.toFixed(1)}, H:${navRect.height.toFixed(1)}`);
            console.log(`${logPrefix} Nav - Offset: W:${navElement.offsetWidth}, H:${navElement.offsetHeight}`);
            const navComputed = window.getComputedStyle(navElement);
            console.log(`${logPrefix} Nav - Computed: bottom:${navComputed.bottom}, position:${navComputed.position}, left:${navComputed.left}, right:${navComputed.right}, width:${navComputed.width}`);
        } else {
            console.log(`${logPrefix} Nav element not found.`);
        }

        console.log(`${logPrefix} Body - scrollH:${document.body.scrollHeight}, clientH:${document.body.clientHeight}, scrollW:${document.body.scrollWidth}, clientW:${document.body.clientWidth}`);
        console.log(`${logPrefix} HTML - scrollH:${document.documentElement.scrollHeight}, clientH:${document.documentElement.clientHeight}, scrollW:${document.documentElement.scrollWidth}, clientW:${document.documentElement.clientWidth}`);
        console.log(`${logPrefix} Window - innerW:${window.innerWidth}, innerH:${window.innerHeight}`);

        const suggestionsPanelElem = document.getElementById('predictive-taps-display'); // Use a different var name to avoid conflict if suggestionsPanel is a param
        if (suggestionsPanelElem) {
            if (!suggestionsPanelElem.classList.contains('hidden')) {
                const panelRect = suggestionsPanelElem.getBoundingClientRect();
                console.log(`${logPrefix} SuggestPanel - Visible. BRect: T:${panelRect.top.toFixed(1)}, L:${panelRect.left.toFixed(1)}, W:${panelRect.width.toFixed(1)}, H:${panelRect.height.toFixed(1)}`);
            } else {
                console.log(`${logPrefix} SuggestPanel - Hidden.`);
            }
        }
    }

    function applySuggestionSidePreference(side) {
        logLayoutDiagnostics(`BEFORE applySuggestionSide (target side: ${side})`);

        // 'tapper' const is available from the top of the DOMContentLoaded scope
        if (!suggestionsPanel || !tapper) {
            console.warn("applySuggestionSidePreference: Tapper or suggestionsPanel not found.");
            logLayoutDiagnostics(`AFTER applySuggestionSide (ERROR - elements not found, target side: ${side})`);
            return;
        }

        // It's important that suggestionsPanel is visible for offsetWidth to be accurate.
        // This function is also called from updatePredictiveDisplay after visibility is set.
        if (suggestionsPanel.offsetParent === null && !suggestionsPanel.classList.contains('hidden')) {
             console.warn("applySuggestionSidePreference: suggestionsPanel not truly visible for offsetWidth calculation. Current positioning might be inaccurate until next updatePredictiveDisplay call.");
             // We might still proceed to set classes/styles, but be aware offsetWidth could be 0.
        }

        const tapperContainer = tapper.parentElement;
        if (!tapperContainer) {
            console.warn("applySuggestionSidePreference: Tapper container not found.");
            logLayoutDiagnostics(`AFTER applySuggestionSide (ERROR - tapper container not found, target side: ${side})`);
            return;
        }

        const tapperRect = tapper.getBoundingClientRect();
        const containerRect = tapperContainer.getBoundingClientRect();

        const tapperLeftEdgeInContainer = tapperRect.left - containerRect.left;
        const tapperRightEdgeInContainer = tapperRect.right - containerRect.left;

        const desiredGapPx = 8;
        const suggestionsPanelWidth = suggestionsPanel.offsetWidth;
        // If suggestionsPanelWidth is 0 (because it was hidden and offsetParent was null), this calculation will be off.
        // This is why the call from updatePredictiveDisplay (after it's visible) is important.

        suggestionsPanel.classList.remove('left-4', 'right-4'); // Remove old Tailwind position attempt if any
        suggestionsPanel.style.left = '';
        suggestionsPanel.style.right = ''; // Clear both to ensure one overrides

        if (side === 'right') {
            const newLeft = tapperRightEdgeInContainer + desiredGapPx;
            suggestionsPanel.style.left = newLeft + 'px';
            console.log(`applySuggestionSidePreference: Setting suggestions to RIGHT, style.left = ${newLeft.toFixed(1)}px`);
        } else { // Default to 'left'
            const newLeft = tapperLeftEdgeInContainer - suggestionsPanelWidth - desiredGapPx;
            suggestionsPanel.style.left = newLeft + 'px';
            console.log(`applySuggestionSidePreference: Setting suggestions to LEFT, style.left = ${newLeft.toFixed(1)}px`);
        }

        logLayoutDiagnostics(`AFTER applySuggestionSide (target side: ${side})`);
    }
    window.applySuggestionSidePreference = applySuggestionSidePreference;

    if (toggleSuggestionSideBtn && suggestionsPanel) {
        toggleSuggestionSideBtn.addEventListener('click', () => {
            console.log("--- Toggle Suggestion Side Button Clicked ---"); // Marker for event start
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
            // Use suggestionsPanel here, as predictiveDisplayElement is not defined in this immediate scope
            // and suggestionsPanel refers to the same DOM element.
            if (predictiveDisplayTimeout && !suggestionsPanel.classList.contains('hidden') && !suggestionsPanel.classList.contains('opacity-0')) {
                // console.log('User interaction with predictive display detected. Resetting hide timer.'); // Log removed
                resetPredictiveDisplayHideTimer(); 
            }
        };
        // Attach listeners to suggestionsPanel
        suggestionsPanel.addEventListener('touchstart', interactionHandler, { passive: true });
        suggestionsPanel.addEventListener('click', interactionHandler);
        suggestionsPanel.addEventListener('wheel', interactionHandler, { passive: true });
    } else {
        console.warn("Predictive taps display element (suggestionsPanel) not found for attaching interaction listeners.");
    }
});

function resetPredictiveDisplayHideTimer() {
    // This function uses 'displayElement', which is fine as it's locally scoped by getElementById.
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
