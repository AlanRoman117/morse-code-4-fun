// Top of js/visualTapper.js
// These variables are script-global, accessible within the DOMContentLoaded and by resetVisualTapperState
let UNIT_TIME_MS = 150; 
let DOT_THRESHOLD_MS = UNIT_TIME_MS * 1.5;
let LETTER_SPACE_SILENCE_MS = UNIT_TIME_MS * 3;

// State variables for the visual tapper, scoped to be accessible by resetVisualTapperState
let currentMorse = "";
let tapStartTime = 0;
let silenceTimer = null;
let currentText = ""; // Holds the sequence of decoded characters by the tapper.

// Function to update unit time and related variables
function updateVisualTapperUnitTime(newUnitTime) {
  UNIT_TIME_MS = parseInt(newUnitTime);
  DOT_THRESHOLD_MS = UNIT_TIME_MS * 1.5;
  LETTER_SPACE_SILENCE_MS = UNIT_TIME_MS * 3;
  localStorage.setItem('visualTapperUnitTime', UNIT_TIME_MS.toString());
  console.log("Visual Tapper UNIT_TIME_MS updated to:", UNIT_TIME_MS, "Derived DOT_THRESHOLD_MS:", DOT_THRESHOLD_MS, "LETTER_SPACE_SILENCE_MS:", LETTER_SPACE_SILENCE_MS);
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

    if (!tapper || !tapperMorseOutput || !spaceButton) {
        console.error("VisualTapper Error: One or more essential tapper DOM elements (tapper, tapperMorseOutput, spaceButton) not found. Tapper will not initialize.");
        return; // Stop initialization if critical elements are missing
    }

    // Populate morseToChar from global morseCode
    const morseToChar = {};
    if (typeof morseCode === 'undefined' || morseCode === null) {
        console.error('visualTapper.js Error: morseCode global object not found or is null. This script should be loaded after the script defining morseCode.');
        // Depending on requirements, could try to load it or fail gracefully.
        // For now, tapper will operate without morseToChar, meaning decodeMorse will not find characters.
    } else {
        for (const char in morseCode) {
            morseToChar[morseCode[char]] = char.toUpperCase();
        }
    }
    
    // Define Placeholders & Tapper Variables
    // const UNIT_TIME_MS = 150; // Standard unit time for Morse code element - MOVED TO GLOBAL
    // const DOT_THRESHOLD_MS = UNIT_TIME_MS * 1.5; // Max duration for a dot - MOVED TO GLOBAL
    // const SHORT_SPACE_MS = UNIT_TIME_MS * 3; // Silence duration between letters (original constant name) - MOVED TO GLOBAL
    // const LETTER_SPACE_SILENCE_MS = UNIT_TIME_MS * 3; // More descriptive for its use here. - MOVED TO GLOBAL
    // const WORD_SPACE_SILENCE_MS = UNIT_TIME_MS * 7; // Silence duration between words (not directly used by this tapper's decodeMorse for sending word spaces)
    const TAP_SOUND_FREQ = 770; // Frequency for tap sound

    let isPlayingBack = false; // Placeholder, assume false. Controlled by other parts of app if needed.
    // currentText is now at a higher scope
    
    // tapStartTime, currentMorse, silenceTimer are now at a higher scope
    let tapperTone = null; // For tap sound (Tone.js synth instance)
    // let soundInitialized = false; // Not directly used in the provided tapper logic snippet, Tone.js handles its own initialization on first user gesture.

    // Dummy/Placeholder functions (if these were meant to be more complex, they'd need full implementation)
    // updateTableHighlight is now defined globally in learnPracticeGame.js
    // Ensure reversedMorseCode (from index.html) and morseCode (from index.html) are available for morseToChar mapping.
    function checkPractice() { 
        // console.log('Tapper: checkPractice called'); 
    }
    function showMessage(message, type, duration) {
        // A more sophisticated implementation might use a dedicated UI element.
        console.log(`Tapper Message: ${message} (Type: ${type}, Duration: ${duration})`);
    }

    // Sound functions using Tone.js (if available)
    function playTapSound() {
        // Check master sound setting FIRST
        if (typeof window.isMasterSoundEnabled !== 'undefined' && !window.isMasterSoundEnabled) {
            // console.log('Master sound is OFF, playTapSound will not play.'); // Debug log
            return; // Exit if master sound is disabled
        }

        if (typeof Tone !== 'undefined' && Tone && Tone.Synth) {
            if (!tapperTone) {
                try {
                    tapperTone = new Tone.Synth({
                        oscillator: { type: 'sine' },
                        envelope: {
                            attack: 0.005,
                            decay: 0.01,  // Can be short if sustain is high
                            sustain: 0.9, // Make sure this allows sound to hold
                            release: 0.05 // Quick release
                        }
                    }).toDestination();
                    // console.log("TapperTone synth re-configured for sustain."); // Optional: for debugging
                } catch (e) {
                    console.error("Failed to create Tone.Synth for tapper:", e);
                    return; // Don't proceed if synth creation fails
                }
            }
            // Ensure Tone.js audio context is running (often requires user gesture)
            // console.log("Tone.context.state before Tone.start():", Tone.context.state);
            if (Tone.context.state !== 'running') {
                Tone.start().then(() => {
                    // console.log("Tone.start() successful, context state:", Tone.context.state);
                    if (tapperTone && typeof tapperTone.triggerAttack === 'function') { // CHANGED
                         // console.log("Attempting to triggerAttack on tapperTone.");
                         tapperTone.triggerAttack(TAP_SOUND_FREQ); // CHANGED to triggerAttack
                    }
                }).catch(e => console.warn("Tone.js audio context couldn't start on tap: ", e));
            } else {
                 if (tapperTone && typeof tapperTone.triggerAttack === 'function') { // CHANGED
                     // console.log("AudioContext already running. Attempting to triggerAttack on tapperTone.");
                     tapperTone.triggerAttack(TAP_SOUND_FREQ); // CHANGED to triggerAttack
                }
            }
        } else {
            // console.warn("Tone.js not available for tap sound.");
        }
    }

    function stopTapSound() {
        // console.log("stopTapSound called."); // For debugging
        if (tapperTone && typeof tapperTone.triggerRelease === 'function') {
            // console.log("Attempting to triggerRelease on tapperTone.");
            tapperTone.triggerRelease(); // This stops the sound based on the envelope's release phase
        }
    }
    
    // Event Listeners for the Tapper UI
    tapper.addEventListener('mousedown', (e) => {
        e.preventDefault(); // Prevent text selection and other default browser actions
        if (isPlayingBack) return; // Placeholder: if some playback mode is active, ignore taps
        tapper.classList.add('active');
        playTapSound();
        tapStartTime = Date.now();
        clearTimeout(silenceTimer); // Clear any existing letter/word end timer
    });

    tapper.addEventListener('mouseup', (e) => {
        e.preventDefault();
        if (isPlayingBack || tapStartTime === 0) return; // Ensure tap started and not in playback
        tapper.classList.remove('active');
        stopTapSound(); // Sound should stop naturally due to short release
        let tapEndTime = Date.now();
        let duration = tapEndTime - tapStartTime;

        if (duration < DOT_THRESHOLD_MS) {
            currentMorse += ".";
        } else {
            currentMorse += "-";
        }
        
        if (tapperMorseOutput) tapperMorseOutput.textContent = currentMorse;
        if (typeof window.updateTableHighlight === "function") window.updateTableHighlight(currentMorse); // Ensure this is active for highlighting
        tapStartTime = 0; // Reset for the next tap

        // Start the timer to detect end of a letter
        clearTimeout(silenceTimer); // Reset existing timer
        silenceTimer = setTimeout(() => {
            decodeMorse(false); // Pass false, indicating it's a timeout, not an explicit space
        }, LETTER_SPACE_SILENCE_MS);
    });
    
    // Touch events for mobile compatibility
    tapper.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Crucial for preventing default touch behaviors like scrolling
        // Simulate mousedown for DRY principle, or handle touch-specific logic if needed
        tapper.dispatchEvent(new MouseEvent('mousedown', {bubbles: true, cancelable: true}));
    });

    tapper.addEventListener('touchend', (e) => {
        e.preventDefault();
        // Check if the touch ended on the tapper itself or a child.
        // This helps prevent misfires if the user's finger slides off.
        const touch = e.changedTouches[0];
        const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
        if (targetElement === tapper || tapper.contains(targetElement)) {
             tapper.dispatchEvent(new MouseEvent('mouseup', {bubbles: true, cancelable: true}));
        } else {
            // If touch ends outside, effectively cancel the tap to avoid unintended signals
            tapper.classList.remove('active');
            stopTapSound();
            tapStartTime = 0; // Reset state
            // currentMorse might or might not be cleared depending on desired behavior for "swipe-out"
            console.log("Touch ended outside tapper, tap cancelled/reset.");
        }
    });

    // Listener for the "End Letter" / Space button
    spaceButton.addEventListener('click', () => {
        if (isPlayingBack) return;
        clearTimeout(silenceTimer); // Clear any pending letter-end timer from tapping
        decodeMorse(true); // true indicates it's an explicit action from the space button
    });

    function decodeMorse(isExplicitAction) {
        clearTimeout(silenceTimer); // Stop any running letter-end timer
        const morseStringForEvent = currentMorse; // Capture current Morse before it's cleared

        if (currentMorse.length > 0) {
            const charToAdd = morseToChar[currentMorse]; // Use the populated morseToChar
            if (charToAdd) {
                currentText += charToAdd; // Update tapper's internal text model
                // showMessage(`Decoded by Tapper: ${charToAdd}`, 'success', 1000); // Optional user feedback
            } else {
                // showMessage(`Unknown Morse: ${currentMorse}`, 'error', 1500); // Optional
                console.warn(`VisualTapper: Unknown Morse sequence: ${currentMorse}`);
            }
        } else if (isExplicitAction) {
            // If currentMorse is empty AND it's an explicit action (space button),
            // this signifies an intentional space or end-of-word signal.
            // The morseStringForEvent will be empty, which is fine.
            console.log("VisualTapper: Space button pressed with no pending Morse signals.");
        }

        // Dispatch custom event for other modules (like bookCipher.js) to consume
        let eventDetail = null;

        if (morseStringForEvent && morseStringForEvent.length > 0) {
            // A character was completed
            eventDetail = { type: 'char', value: morseStringForEvent };
        } else if (isExplicitAction && currentMorse.length === 0) {
            // Space button clicked and no Morse code was pending (i.e., it's an intentional word space)
            eventDetail = { type: 'word_space' };
        }

        if (eventDetail) {
            const event = new CustomEvent('visualTapperInput', {
                detail: eventDetail
            });
            document.dispatchEvent(event);
            // console.log("VisualTapper: Dispatched visualTapperInput with detail:", eventDetail);
        }
        
        currentMorse = ""; // Clear Morse buffer for the next character
        if (tapperMorseOutput) tapperMorseOutput.textContent = currentMorse; // Update display
        if (typeof window.updateTableHighlight === "function") window.updateTableHighlight(currentMorse); // Called with "" to clear highlight
        checkPractice(); // Dummy call
    }

    // Prevent tapper from staying 'active' if mouse leaves while pressed down
    tapper.addEventListener('mouseleave', () => {
        if (tapper.classList.contains('active')) {
            tapper.classList.remove('active');
            stopTapSound();
            // This behavior is debatable: should it complete the tap or cancel it?
            // For now, cancel by resetting tapStartTime, consistent with touchend outside.
            tapStartTime = 0; 
            // If a tap was in progress (currentMorse not empty), could optionally decode it here.
            // However, this might be unexpected. Resetting is safer.
            // if (currentMorse) { decodeMorse(false); } 
            console.log("Mouse left tapper while active, tap cancelled/reset.");
        }
    });

    // Initial check for Tone.js (optional, for debugging or early warning)
    if (typeof Tone === 'undefined') {
        console.warn("VisualTapper: Tone.js library not detected. Tap sounds will be unavailable.");
    }

    const savedUnitTime = localStorage.getItem('visualTapperUnitTime');
    if (savedUnitTime) {
        console.log("Found saved unit time in localStorage:", savedUnitTime);
        updateVisualTapperUnitTime(parseInt(savedUnitTime)); 
    } else {
        console.log("No saved unit time in localStorage, ensuring default configuration is applied via updateVisualTapperUnitTime.");
        // This call ensures that DOT_THRESHOLD_MS and LETTER_SPACE_SILENCE_MS are initialized
        // through the same function, using the default UNIT_TIME_MS.
        // It also handles saving the default to localStorage if it wasn't there.
        updateVisualTapperUnitTime(UNIT_TIME_MS); // UNIT_TIME_MS here is the initial default (e.g., 150)
    }
});

// Globally accessible reset function for the visual tapper state
function resetVisualTapperState() {
    currentMorse = "";
    tapStartTime = 0;
    if (silenceTimer) {
        clearTimeout(silenceTimer);
        silenceTimer = null;
    }
    currentText = ""; // Reset the accumulated decoded text

    // Re-fetch the tapperMorseOutput element each time to ensure it's the correct one,
    // especially since the tapper DOM itself is moved around.
    const tapperMorseOutputElement = document.getElementById('tapperMorseOutput');
    if (tapperMorseOutputElement) {
        tapperMorseOutputElement.textContent = "";
    }

    // Also ensure the tapper visual itself is not stuck in 'active' state
    const tapperElement = document.getElementById('tapper');
    if (tapperElement) {
        tapperElement.classList.remove('active');
    }
    // Temporarily commenting out to isolate the "updateTableHighlight is not defined" error
    // if (typeof window.updateTableHighlight === "function") window.updateTableHighlight(""); 
    console.log("VisualTapper state reset. (updateTableHighlight call commented out for testing)");
}
