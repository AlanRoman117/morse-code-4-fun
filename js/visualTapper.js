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
    function updateTableHighlight(morseString) { 
        // console.log('Tapper: updateTableHighlight called with', morseString); 
    }
    function checkPractice() { 
        // console.log('Tapper: checkPractice called'); 
    }
    function showMessage(message, type, duration) {
        // A more sophisticated implementation might use a dedicated UI element.
        console.log(`Tapper Message: ${message} (Type: ${type}, Duration: ${duration})`);
    }

    // Sound functions using Tone.js (if available)
    function playTapSound() {
        if (typeof Tone !== 'undefined' && Tone && Tone.Synth) {
            if (!tapperTone) {
                try {
                    tapperTone = new Tone.Synth({
                        oscillator: { type: 'sine' },
                        envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.1 }
                    }).toDestination();
                } catch (e) {
                    console.error("Failed to create Tone.Synth for tapper:", e);
                    return; // Don't proceed if synth creation fails
                }
            }
            // Ensure Tone.js audio context is running (often requires user gesture)
            if (Tone.context.state !== 'running') {
                Tone.start().catch(e => console.warn("Tone.js audio context couldn't start on tap: ", e));
            }
            if (tapperTone && typeof tapperTone.triggerAttackRelease === 'function') {
                 tapperTone.triggerAttackRelease(TAP_SOUND_FREQ, '8n'); // '8n' is a short duration
            }
        } else {
            // console.log("Tone.js not available for tap sound."); // Optional: log if Tone not found
        }
    }

    function stopTapSound() {
        // For a simple synth like the one defined, explicit stop isn't usually needed
        // as it has a very short release. If using a synth with sustain, this would be important.
        // if (tapperTone && typeof tapperTone.triggerRelease === 'function') {
        //     tapperTone.triggerRelease();
        // }
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
        updateTableHighlight(currentMorse); // Dummy call
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
        // Dispatch even if morseStringForEvent is empty, if it's an explicit action (space button)
        if (morseStringForEvent || isExplicitAction) {
            const event = new CustomEvent('visualTapperCharacterComplete', {
                detail: {
                    morseString: morseStringForEvent 
                }
            });
            document.dispatchEvent(event);
            // console.log("VisualTapper: Dispatched visualTapperCharacterComplete with morse:", morseStringForEvent);
        }
        
        currentMorse = ""; // Clear Morse buffer for the next character
        if (tapperMorseOutput) tapperMorseOutput.textContent = currentMorse; // Update display
        updateTableHighlight(currentMorse); // Dummy call
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
    
    console.log("VisualTapper state reset.");
}
