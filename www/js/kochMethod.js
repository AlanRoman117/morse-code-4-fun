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
    toggleKochLevelsBtn, kochLevelsWrapper; // Added for levels collapsible section

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
                kochAnswerInput.disabled = false;
                kochAnswerInput.value = ''; // Clear previous input
                // On mobile, focus might not be desired if using on-screen buttons.
                // On desktop, it's good.
                if (window.matchMedia("(min-width: 768px)").matches) {
                    kochAnswerInput.focus();
                }
            }
            if (kochFeedbackMessage) kochFeedbackMessage.textContent = '';
            renderKochInputButtons(); // Render buttons for the new session


            // Optionally, automatically play the first character
            playNextKochCharacter();
        });
    }

    // Add event listener for answer input (for desktop keyboard)
    if (kochAnswerInput) {
        kochAnswerInput.addEventListener('input', function() { // Use function keyword for 'this'
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
    if (!kochAnswerInput || kochAnswerInput.disabled) { // Check if input is allowed
        // This also implicitly checks if a session is active because kochAnswerInput is disabled when not.
        console.log("Koch answer input ignored, input field is disabled or no session active.");
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
    if (kochFeedbackMessage) {
        if (accuracy >= 90) {
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
                kochFeedbackMessage.textContent = `Congratulations! You've unlocked a new character: ${nextCharToAdd}`;
                kochFeedbackMessage.className = 'text-lg text-center min-h-[28px] font-medium text-green-400'; // Success style
                updateKochDisplays(); // Update character set display
                renderKochInputButtons(); // Re-render buttons with the new character

                // Trigger confetti
                if (typeof confetti === 'function') {
                    confetti({
                        particleCount: 150,
                        spread: 80,
                        origin: { y: 0.6 }
                    });
                    setTimeout(() => confetti({ particleCount: 100, spread: 120, startVelocity: 25, angle: 60, origin: { x: 0, y: 0.7 } }), 250);
                    setTimeout(() => confetti({ particleCount: 100, spread: 120, startVelocity: 25, angle: 120, origin: { x: 1, y: 0.7 } }), 500);
                    setTimeout(() => confetti({ particleCount: 100, spread: 150, startVelocity: 30, angle: 90, origin: { y: 0.5 } }), 800);
                }

            } else {
                kochFeedbackMessage.textContent = "Congratulations! You've mastered all characters!";
                kochFeedbackMessage.className = 'text-lg text-center min-h-[28px] font-medium text-green-400'; // Success style
                // Optional: Confetti for mastering all characters too? For now, only on new char.
                if (typeof confetti === 'function') { // Also celebrate mastering everything!
                    confetti({
                        particleCount: 250,
                        spread: 100,
                        origin: { y: 0.5 },
                        gravity: 0.5,
                        ticks: 400,
                        colors: ['#4a90e2', '#f6e05e', '#4caf50', '#ffeb3b', '#e91e63']
                    });
                }
            }
        } else {
            kochFeedbackMessage.textContent = `Your accuracy was ${accuracy.toFixed(0)}%. Keep practicing with the current set to reach 90%!`;
            kochFeedbackMessage.className = 'text-lg text-center min-h-[28px] font-medium text-yellow-400'; // Encouragement style
        }
    }

    // Manage UI for session end
    if (kochStartBtn) {
        kochStartBtn.classList.remove('hidden');
    }
    if (kochPlayBtn) {
        kochPlayBtn.classList.add('hidden');
    }
    if (kochAnswerInput) {
        kochAnswerInput.disabled = true;
        kochAnswerInput.value = ''; // Clear any residual input
    }
    if (kochFeedbackMessage && kochFeedbackMessage.textContent === "Correct!") {
        // If the last input was correct, this message might still be there.
        // The session end message from above should take precedence.
        // This check is more of a safeguard; the logic above should already set the message.
    }
     // Ensure focus is not trapped in the now-disabled input
    if(document.activeElement === kochAnswerInput) {
        kochStartBtn.focus(); // Or any other appropriate element
    }
    renderKochInputButtons(); // Clear/update buttons based on new session state
}
