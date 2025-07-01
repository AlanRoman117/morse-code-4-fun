// js/kochMethod.js

// Define Session Length
const SESSION_LENGTH = 50;

// 1. Define Koch Character Order
const kochCharacterOrder = [
    'K', 'M', 'R', 'S', 'U', 'A', 'P', 'T', 'L', 'O', 'W', 'I', '.', 'N', 'J', 'E', 'F', '0', 'Y', ',',
    'V', 'G', '5', '/', 'Q', '9', 'Z', 'H', '3', '8', 'B', '?', '4', '2', '7', 'C', '1', 'D', '6', 'X'
];

// 2. Manage User's State
let unlockedCharacters = [];
let sessionStats = { correct: 0, total: 0 };
let correctAnswer = '';

// Function to load unlocked characters
function loadUnlockedCharacters() {
    const storedChars = localStorage.getItem('kochUnlockedCharacters');
    if (storedChars) {
        unlockedCharacters = JSON.parse(storedChars);
    } else {
        unlockedCharacters = [kochCharacterOrder[0], kochCharacterOrder[1]];
        localStorage.setItem('kochUnlockedCharacters', JSON.stringify(unlockedCharacters));
    }
}

// Load characters when the script is first parsed
loadUnlockedCharacters();

// (Rest of the Koch method logic will be added here in subsequent steps)

// DOM Elements
let kochStartBtn, kochPlayBtn, kochAnswerInput, kochAccuracyDisplay, kochCharSetDisplay, kochFeedbackMessage, kochLevelsContainer,
    kochResetProgressBtn, kochResetModal, kochConfirmResetBtn, kochCancelResetBtn,
    toggleKochStatusBtn, kochStatusWrapper, kochInputButtonsContainer,
    toggleKochLevelsBtn, kochLevelsWrapper, // Added for levels collapsible section
    // Elements for Session Complete View
    kochPracticeArea, kochSessionCompleteView, sessionFinalAccuracy, sessionCorrectChars, sessionTotalChars, kochStartNewSessionBtn;

// Function to populate Koch Levels display
function populateKochLevels() {
    if (!kochLevelsContainer) return;
    kochLevelsContainer.innerHTML = ''; // Clear existing cells

    const mostRecentUnlockedChar = unlockedCharacters.length > 0 ? unlockedCharacters[unlockedCharacters.length - 1] : null;

    kochCharacterOrder.forEach(char => {
        const cell = document.createElement('div');
        cell.textContent = char;
        cell.className = 'w-10 h-10 flex items-center justify-center rounded-md text-lg shadow-md'; // Base style

        if (unlockedCharacters.includes(char)) {
            // If this character is the most recently unlocked one, it's "current"
            if (char === mostRecentUnlockedChar) {
                cell.classList.add('bg-yellow-400', 'text-black', 'font-bold', 'ring-2', 'ring-yellow-200', 'animate-pulse');
            } else {
                // Otherwise, if it's unlocked, it's "completed"
                cell.classList.add('bg-green-500', 'text-white', 'font-bold');
            }
        } else {
            // Not in unlockedCharacters, so it's "locked"
            cell.classList.add('bg-gray-600', 'text-gray-400', 'opacity-75'); // Locked
        }
        kochLevelsContainer.appendChild(cell);
    });
}


// Function to update Koch displays
function updateKochDisplays() {
    if (kochAccuracyDisplay) {
        const accuracy = sessionStats.total > 0 ? (sessionStats.correct / sessionStats.total * 100).toFixed(0) : 0;
        kochAccuracyDisplay.textContent = `${accuracy}% (Correct: ${sessionStats.correct}, Total: ${sessionStats.total})`;
    }
    if (kochCharSetDisplay) {
        kochCharSetDisplay.textContent = unlockedCharacters.join(', ');
    }
    populateKochLevels(); // Update level display
}

// Function to play the next Koch character
async function playNextKochCharacter() {
    if (unlockedCharacters.length === 0) {
        console.warn("No characters unlocked to play.");
        if(kochFeedbackMessage) kochFeedbackMessage.textContent = "No characters unlocked.";
        return;
    }

    // Randomly select a character
    correctAnswer = unlockedCharacters[Math.floor(Math.random() * unlockedCharacters.length)];

    // Convert to Morse (ensure textToMorse is available globally or define/import it)
    // Assuming textToMorse is globally available from morsePals.js or similar context
    let morseStr = '';
    if (typeof textToMorse === 'function') {
        morseStr = textToMorse(correctAnswer);
    } else {
        console.error("textToMorse function is not defined. Cannot play Morse code.");
        if(kochFeedbackMessage) kochFeedbackMessage.textContent = "Error: textToMorse unavailable.";
        return;
    }

    // Play Morse sequence at fixed 20 WPM
    // Dot duration for 20 WPM = 1.2 / 20 = 0.06 seconds (60 ms)
    const customDotDur = 0.06;

    // Ensure playMorseSequence is available (globally or imported)
    if (typeof playMorseSequence === 'function') {
        // Disable play button during playback, re-enable after if needed (or handled by playMorseSequence)
        if(kochPlayBtn) kochPlayBtn.disabled = true;

        // Make sure audio is initialized
        if (typeof initAudio === 'function') {
            initAudio();
        } else {
            console.warn("initAudio function not available. Audio might not play.");
        }

        await playMorseSequence(morseStr, customDotDur /*, optional customFreq */);

        if(kochPlayBtn) kochPlayBtn.disabled = false; // Re-enable after playback
    } else {
        console.error("playMorseSequence function is not defined. Cannot play Morse code.");
        if(kochFeedbackMessage) kochFeedbackMessage.textContent = "Error: playMorseSequence unavailable.";
        return;
    }

    // Focus on the answer input
    if (kochAnswerInput) {
        kochAnswerInput.focus();
        // The input is now cleared by the calling function's timeout,
        // right before playNextKochCharacter is invoked.
        // kochAnswerInput.value = '';
    }
}


document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM elements
    kochStartBtn = document.getElementById('koch-start-btn');
    kochPlayBtn = document.getElementById('koch-play-btn');
    kochAnswerInput = document.getElementById('koch-answer-input');
    kochAccuracyDisplay = document.getElementById('koch-accuracy-display');
    kochCharSetDisplay = document.getElementById('koch-char-set-display');
    kochFeedbackMessage = document.getElementById('koch-feedback-message');
    kochLevelsContainer = document.getElementById('koch-levels-container');
    kochResetProgressBtn = document.getElementById('koch-reset-progress-btn');
    kochResetModal = document.getElementById('koch-reset-modal');
    kochConfirmResetBtn = document.getElementById('koch-confirm-reset-btn');
    kochCancelResetBtn = document.getElementById('koch-cancel-reset-btn');
    toggleKochStatusBtn = document.getElementById('toggle-koch-status-btn');
    kochStatusWrapper = document.getElementById('koch-status-wrapper');
    kochInputButtonsContainer = document.getElementById('koch-input-buttons-container');
    toggleKochLevelsBtn = document.getElementById('toggle-koch-levels-btn');
    // kochLevelsWrapper = document.getElementById('koch-levels-wrapper'); // Wrapper div
    // We are toggling koch-levels-container directly as it has the md:flex property

    // Session Complete View Elements
    kochPracticeArea = document.getElementById('koch-practice-area');
    kochSessionCompleteView = document.getElementById('koch-session-complete-view');
    sessionFinalAccuracy = document.getElementById('session-final-accuracy');
    sessionCorrectChars = document.getElementById('session-correct-chars');
    sessionTotalChars = document.getElementById('session-total-chars');
    kochStartNewSessionBtn = document.getElementById('koch-start-new-session-btn');


    // Initial UI setup
    if (kochPlayBtn) kochPlayBtn.classList.add('hidden');
    if (kochAnswerInput) kochAnswerInput.disabled = true; // Disable until session starts

    updateKochDisplays(); // Update displays with initial values
    renderKochInputButtons(); // Render buttons on load based on current unlocked chars

    if (kochStartBtn) {
        kochStartBtn.addEventListener('click', () => {
            // Reset session stats
            sessionStats = { correct: 0, total: 0 };
            updateKochDisplays();

            // Update UI elements
            kochStartBtn.classList.add('hidden');
            if (kochPlayBtn) kochPlayBtn.classList.remove('hidden');
            if (kochAnswerInput) {
                kochAnswerInput.value = ''; // Clear previous input
                if (window.matchMedia("(min-width: 768px)").matches) {
                    // Desktop: show input, enable, make writable, focus
                    kochAnswerInput.classList.remove('hidden');
                    // Tailwind uses md:block, so ensure 'hidden' is removed if it was added for mobile
                    // and rely on CSS for md:block to take effect.
                    // Or, more directly: kochAnswerInput.style.display = 'block'; (or its default)
                    kochAnswerInput.disabled = false;
                    kochAnswerInput.readOnly = false;
                    kochAnswerInput.focus();
                } else {
                    // Mobile: hide input
                    kochAnswerInput.classList.add('hidden');
                    // kochAnswerInput.style.display = 'none';
                    kochAnswerInput.disabled = true; // Still good practice
                    kochAnswerInput.readOnly = true; // Still good practice
                }
            }
            if (kochFeedbackMessage) kochFeedbackMessage.textContent = '';
            renderKochInputButtons(); // Render buttons for the new session


            // Optionally, automatically play the first character
            // Ensure Web Audio API context (for playMorseSequence) is ready
            if (typeof initAudio === 'function') {
                initAudio(); // From main.js
                if (typeof audioContext !== 'undefined' && audioContext.state === 'suspended') {
                    audioContext.resume().then(() => {
                        console.log("Main audioContext resumed successfully by kochStartBtn.");
                    }).catch(e => console.error("Error resuming main audioContext from kochStartBtn:", e));
                }
            }
            // Ensure Tone.js AudioContext is started by user gesture
            Tone.start().then(() => {
                console.log("Tone.js AudioContext started successfully by kochStartBtn.");
                playNextKochCharacter();
            }).catch(error => {
                console.error("Error starting Tone.js AudioContext from kochStartBtn:", error);
                playNextKochCharacter(); // Attempt to play anyway
            });
        });
    }

    if (kochStartNewSessionBtn) {
        kochStartNewSessionBtn.addEventListener('click', () => {
            // Hide session complete view
            if (kochSessionCompleteView) kochSessionCompleteView.classList.add('hidden');
            // Show practice area
            if (kochPracticeArea) kochPracticeArea.classList.remove('hidden');

            // Reset session stats
            sessionStats = { correct: 0, total: 0 };
            updateKochDisplays();

            // Update UI elements (similar to kochStartBtn)
            if (kochStartBtn) kochStartBtn.classList.add('hidden'); // Keep original start btn hidden
            if (kochPlayBtn) kochPlayBtn.classList.remove('hidden');
            if (kochAnswerInput) {
                kochAnswerInput.value = ''; // Clear previous input
                if (window.matchMedia("(min-width: 768px)").matches) {
                    // Desktop: show input, enable, make writable, focus
                    kochAnswerInput.classList.remove('hidden');
                    kochAnswerInput.disabled = false;
                    kochAnswerInput.readOnly = false;
                    kochAnswerInput.focus();
                } else {
                    // Mobile: hide input
                    kochAnswerInput.classList.add('hidden');
                    kochAnswerInput.disabled = true; // Still good practice
                    kochAnswerInput.readOnly = true; // Still good practice
                }
            }
            if (kochFeedbackMessage) kochFeedbackMessage.textContent = '';
            renderKochInputButtons(); // Render buttons for the new session

            // Play the first character of the new session
            // Ensure Web Audio API context (for playMorseSequence) is ready
            if (typeof initAudio === 'function') {
                initAudio(); // From main.js
                if (typeof audioContext !== 'undefined' && audioContext.state === 'suspended') {
                    audioContext.resume().then(() => {
                        console.log("Main audioContext resumed successfully by kochStartNewSessionBtn.");
                    }).catch(e => console.error("Error resuming main audioContext from kochStartNewSessionBtn:", e));
                }
            }
            // Ensure Tone.js AudioContext is started by user gesture
            Tone.start().then(() => {
                console.log("Tone.js AudioContext started successfully by kochStartNewSessionBtn.");
                playNextKochCharacter();
            }).catch(error => {
                console.error("Error starting Tone.js AudioContext from kochStartNewSessionBtn:", error);
                playNextKochCharacter(); // Attempt to play anyway
            });
        });
    }

    // Add event listener for answer input (for desktop keyboard)
    if (kochAnswerInput) {
        kochAnswerInput.addEventListener('input', function(event) {
            // Keyboard input is only for desktop, where the field is visible.
            // No need for mobile check here if field is hidden on mobile.
            if (this.value.length === 1) { // maxlength="1"
                handleKochAnswer(this.value.toUpperCase());
            }
        });
    }

    // Add event listener for the "Play Next Character" button
    if (kochPlayBtn) {
        kochPlayBtn.addEventListener('click', () => {
            playNextKochCharacter();
        });
    }

    console.log("Koch Method script loaded and DOM elements initialized.");
    console.log("Initial Unlocked Characters:", unlockedCharacters);
    console.log("Initial Session Stats:", sessionStats);

    // Event listeners for reset functionality
    if (kochResetProgressBtn) {
        kochResetProgressBtn.addEventListener('click', () => {
            if (kochResetModal) kochResetModal.classList.remove('hidden');
        });
    }

    if (kochConfirmResetBtn) {
        kochConfirmResetBtn.addEventListener('click', () => {
            resetKochProgress();
        });
    }

    if (kochCancelResetBtn) {
        kochCancelResetBtn.addEventListener('click', () => {
            if (kochResetModal) kochResetModal.classList.add('hidden');
        });
    }

    // Optional: Close modal if user clicks outside of it (on the overlay)
    if (kochResetModal) {
        kochResetModal.addEventListener('click', (event) => {
            if (event.target === kochResetModal) { // Check if the click is on the overlay itself
                kochResetModal.classList.add('hidden');
            }
        });
    }

    // Event listener for toggle Koch status button
    if (toggleKochStatusBtn && kochStatusWrapper) {
        // The actual div to toggle is the first child of kochStatusWrapper
        const statusContentDiv = kochStatusWrapper.querySelector('div');
        if (statusContentDiv) {
            toggleKochStatusBtn.addEventListener('click', () => {
                statusContentDiv.classList.toggle('hidden');
            });
        } else {
            console.error("Could not find the content div within koch-status-wrapper to toggle.");
        }
    }

    // Event listener for toggle Koch levels button
    if (toggleKochLevelsBtn && kochLevelsContainer) {
        toggleKochLevelsBtn.addEventListener('click', () => {
            kochLevelsContainer.classList.toggle('hidden');
            // If you decided to use md:flex on the container, ensure this toggle works as expected.
            // Toggling 'hidden' should be fine as 'md:flex' only applies at md breakpoint.
        });
    }

    // Removed touchstart and focus listeners for kochAnswerInput as it will be hidden on mobile
});

// Function to reset Koch Method progress
function resetKochProgress() {
    localStorage.removeItem('kochUnlockedCharacters');
    unlockedCharacters = [kochCharacterOrder[0], kochCharacterOrder[1]]; // Reset to first two
    localStorage.setItem('kochUnlockedCharacters', JSON.stringify(unlockedCharacters));

    sessionStats = { correct: 0, total: 0 }; // Reset session stats

    updateKochDisplays(); // Update all UI elements
    renderKochInputButtons(); // Re-render buttons for the reset state

    if (kochFeedbackMessage) {
        kochFeedbackMessage.textContent = "Progress reset successfully!";
        kochFeedbackMessage.className = 'text-lg text-center min-h-[28px] font-medium text-green-400'; // Success style
        setTimeout(() => {
            if (kochFeedbackMessage.textContent === "Progress reset successfully!") {
                kochFeedbackMessage.textContent = ''; // Clear after a few seconds
                kochFeedbackMessage.className = 'text-lg text-center min-h-[28px] font-medium'; // Reset class
            }
        }, 3000);
    }

    if (kochResetModal) {
        kochResetModal.classList.add('hidden'); // Hide the modal
    }

    // Ensure the UI state for practice session is reset (e.g., show start button)
    if (kochStartBtn) kochStartBtn.classList.remove('hidden');
    if (kochPlayBtn) kochPlayBtn.classList.add('hidden');
    if (kochAnswerInput) {
        kochAnswerInput.disabled = true;
        kochAnswerInput.value = '';
    }
    console.log("Koch method progress has been reset.");
}

// Function to render on-screen buttons for Koch method input
function renderKochInputButtons() {
    if (!kochInputButtonsContainer) return;
    kochInputButtonsContainer.innerHTML = ''; // Clear existing buttons

    // Only show buttons if a session is active (e.g., play button is hidden)
    if (kochStartBtn && kochStartBtn.classList.contains('hidden')) {
        unlockedCharacters.forEach(char => {
            const button = document.createElement('button');
            button.textContent = char;
            button.className = 'py-3 px-5 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-blue-400 active:bg-blue-700 text-xl';
            button.addEventListener('click', function() { // Use function keyword for 'this'
                handleKochAnswer(char, this); // Pass 'this' (the button element)
            });
            kochInputButtonsContainer.appendChild(button);
        });
    }
}

// Function to handle Koch answer from input field or button
function handleKochAnswer(userAnswer, clickedButtonElement = null) { // Added clickedButtonElement parameter
    // If the call is from a button click, we should process it
    // regardless of kochAnswerInput.disabled state (which is true on mobile).
    // If it's not from a button (i.e., from keyboard input), then respect kochAnswerInput.disabled.
    if (clickedButtonElement === null && (!kochAnswerInput || kochAnswerInput.disabled)) {
        console.log("Koch answer input (from keyboard/text field) ignored, input field is disabled.");
        return;
    }

    // Explicitly check if a session is active by seeing if the start button is hidden.
    // This is a more reliable check for session state than just input field disabled status.
    if (kochStartBtn && !kochStartBtn.classList.contains('hidden')) {
        console.log("Koch answer input ignored, no active session (start button is visible).");
        return;
    }

    sessionStats.total++;

    // Temporarily disable text input field and all on-screen character buttons
    kochAnswerInput.disabled = true;
    const kochButtons = kochInputButtonsContainer.querySelectorAll('button');
    kochButtons.forEach(btn => btn.disabled = true);

    if (userAnswer === correctAnswer) {
        sessionStats.correct++;
        if(kochFeedbackMessage) kochFeedbackMessage.textContent = "Correct!";
        if(kochFeedbackMessage) kochFeedbackMessage.className = 'text-lg text-center min-h-[28px] font-medium text-green-400';

        const targetElementForFeedback = clickedButtonElement || kochAnswerInput;
        if (targetElementForFeedback) targetElementForFeedback.classList.add('glow-green');

        setTimeout(() => {
            if (targetElementForFeedback) targetElementForFeedback.classList.remove('glow-green');
            // Re-enable inputs only if session is still ongoing (Start button IS hidden)
            if (kochStartBtn.classList.contains('hidden')) { // CORRECTED Condition
                kochAnswerInput.disabled = false;
                kochButtons.forEach(btn => btn.disabled = false);
            }
        }, 800); // Match glow-green animation duration

    } else {
        if(kochFeedbackMessage) kochFeedbackMessage.textContent = `Incorrect. The character was: ${correctAnswer}`;
        if(kochFeedbackMessage) kochFeedbackMessage.className = 'text-lg text-center min-h-[28px] font-medium text-red-400';

        const targetElementForFeedback = clickedButtonElement || kochAnswerInput;
        if (targetElementForFeedback) targetElementForFeedback.classList.add('shake-red');

        setTimeout(() => {
            if (targetElementForFeedback) targetElementForFeedback.classList.remove('shake-red');
            // Re-enable inputs only if session is still ongoing (Start button IS hidden)
            if (kochStartBtn.classList.contains('hidden')) { // CORRECTED Condition
                kochAnswerInput.disabled = false;
                kochButtons.forEach(btn => btn.disabled = false);
            }
        }, 500); // Match shake animation duration
    }

    updateKochDisplays();
    if (kochAnswerInput) kochAnswerInput.value = ''; // Clear physical input field after processing

    // Check if session is complete
    if (sessionStats.total >= SESSION_LENGTH) {
        const accuracy = (sessionStats.correct / sessionStats.total) * 100;
        setTimeout(() => {
            handleSessionCompletion(accuracy);
        }, Math.max(500, 800) + 50); // Ensure this timeout is longer than feedback
    } else {
        // After a short delay (that includes animation time), clear feedback and play the next character
        console.log("[Koch] Scheduling next character...");
        setTimeout(() => {
            console.log("[Koch] Timeout for next character triggered.");
            if(kochFeedbackMessage && (kochFeedbackMessage.textContent === "Correct!" || kochFeedbackMessage.textContent.startsWith("Incorrect."))) {
                kochFeedbackMessage.textContent = '';
                kochFeedbackMessage.className = 'text-lg text-center min-h-[28px] font-medium'; // Reset class
            }
            // kochAnswerInput.value was already cleared

            const isSessionStillActive = kochStartBtn.classList.contains('hidden'); // CORRECTED: Session is active if start button IS hidden
            console.log(`[Koch] Is session still active (start button hidden)? ${isSessionStillActive}`);

            if (isSessionStillActive) { 
                 console.log("[Koch] Playing next character.");
                 playNextKochCharacter();
            } else {
                console.log("[Koch] Session IS NOT active, not playing next character.");
                // Inputs should already be disabled by handleSessionCompletion or by the shorter feedback timeouts
                // if session ended there.
            }
        }, 1500); // Existing delay
    }
}


// Function to handle session completion
function handleSessionCompletion(accuracy) {
    console.log(`Session complete. Accuracy: ${accuracy.toFixed(2)}%`);

    // Hide practice area and show session complete view
    if (kochPracticeArea) kochPracticeArea.classList.add('hidden');
    if (kochSessionCompleteView) kochSessionCompleteView.classList.remove('hidden');

    // Populate session complete view
    if (sessionFinalAccuracy) sessionFinalAccuracy.textContent = `${accuracy.toFixed(0)}%`;
    if (sessionCorrectChars) sessionCorrectChars.textContent = sessionStats.correct;
    if (sessionTotalChars) sessionTotalChars.textContent = sessionStats.total;

    // Clear the regular feedback message as the session complete view has its own summary
    if (kochFeedbackMessage) {
        kochFeedbackMessage.textContent = '';
        kochFeedbackMessage.className = 'text-lg text-center min-h-[28px] font-medium'; // Reset class
    }


    if (accuracy >= 90) {
        // Pro User Check
        if (!window.isProUser && unlockedCharacters.length >= 5) {
            // Optionally, display a specific message on the session complete screen or use a modal
            console.log("User reached free limit. Upsell opportunity.");
            // For now, the main feedback is on the session complete screen.
            // If a modal is preferred, it can be triggered here.
            // The existing logic for showing upsell modal if accuracy >= 90 AND limit reached can be kept or adapted.
            if (typeof window.showUpsellModal === 'function') {
                // window.showUpsellModal(); // Decide if this should still pop up here or if message on complete screen is enough
            }
        } else {
            let nextCharToAdd = null;
            for (const char of kochCharacterOrder) {
                if (!unlockedCharacters.includes(char)) {
                    nextCharToAdd = char;
                    break;
                }
            }

            if (nextCharToAdd) {
                unlockedCharacters.push(nextCharToAdd);
                localStorage.setItem('kochUnlockedCharacters', JSON.stringify(unlockedCharacters));
                // Update displays for the next session (character set, levels)
                updateKochDisplays();
                // No need to re-render input buttons here, as the session is over.
                // The message about new char can be part of the session complete screen or a temporary toast.
                // For now, let's assume the level display updating is sufficient visual feedback for the unlock.

                // Trigger confetti ONLY for new character unlock
                if (typeof confetti === 'function') {
                    console.log("Triggering confetti for new character unlock:", nextCharToAdd);
                    confetti({
                        particleCount: 150,
                        spread: 80,
                        origin: { y: 0.6 }
                    });
                    setTimeout(() => confetti({ particleCount: 100, spread: 120, startVelocity: 25, angle: 60, origin: { x: 0, y: 0.7 } }), 250);
                    setTimeout(() => confetti({ particleCount: 100, spread: 120, startVelocity: 25, angle: 120, origin: { x: 1, y: 0.7 } }), 500);
                    setTimeout(() => confetti({ particleCount: 100, spread: 150, startVelocity: 30, angle: 90, origin: { y: 0.5 } }), 800);
                }
                 // Update the message on the main practice screen's feedback area (though it's hidden now)
                // This message will be seen if the user somehow navigates back without starting new session.
                // A better place for this message might be on the session complete view itself.
                // For now, we'll keep it on kochFeedbackMessage, which is currently hidden at this stage.
                // Consider adding a specific field on the session complete view for "New Character Unlocked: X"
                if(kochFeedbackMessage) { // This will be hidden if kochPracticeArea is hidden.
                    kochFeedbackMessage.textContent = `New character unlocked: ${nextCharToAdd}!`;
                    kochFeedbackMessage.className = 'text-lg text-center min-h-[28px] font-medium text-green-400';
                }


            } else { // All characters unlocked
                // Message for all characters mastered can be displayed on the session complete screen.
                // No confetti here as per requirements.
                console.log("All characters mastered. No confetti.");
                if(kochFeedbackMessage) { // This message might not be visible if practice area is hidden.
                    kochFeedbackMessage.textContent = "Congratulations! You've mastered all available characters!";
                    kochFeedbackMessage.className = 'text-lg text-center min-h-[28px] font-medium text-green-400';
                }
            }
        }
    } else {
        // Message for accuracy < 90% can also be part of the session complete screen.
        // The session-final-accuracy already shows this.
        // If kochFeedbackMessage is used, it might be hidden.
        if(kochFeedbackMessage) {
            kochFeedbackMessage.textContent = `Keep practicing to reach 90%!`;
            kochFeedbackMessage.className = 'text-lg text-center min-h-[28px] font-medium text-yellow-400';
        }
    }

    // Manage UI for session end (some parts are handled by showing the session complete view)
    // The original kochStartBtn is not shown; the new "Start New Session" button is on the complete view.
    // if (kochStartBtn) {
    //     kochStartBtn.classList.remove('hidden'); // This will be handled by the new button
    // }
    if (kochPlayBtn) {
        kochPlayBtn.classList.add('hidden');
    }
    if (kochAnswerInput) {
        kochAnswerInput.disabled = true;
        kochAnswerInput.value = '';
        kochAnswerInput.classList.add('hidden'); // Also hide the input field
    }

    renderKochInputButtons(); // Clear on-screen buttons as session is over

    // Ensure focus is not trapped in a hidden/disabled input, move to new session button
    if (kochStartNewSessionBtn && kochSessionCompleteView && !kochSessionCompleteView.classList.contains('hidden')) {
        kochStartNewSessionBtn.focus();
    }
}
