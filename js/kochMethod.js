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
let kochStartBtn, kochPlayBtn, kochAnswerInput, kochAccuracyDisplay, kochCharSetDisplay, kochFeedbackMessage;

// Function to update Koch displays (will be fully implemented in a later step)
function updateKochDisplays() {
    if (kochAccuracyDisplay) {
        const accuracy = sessionStats.total > 0 ? (sessionStats.correct / sessionStats.total * 100).toFixed(0) : 0;
        kochAccuracyDisplay.textContent = `${accuracy}% (Correct: ${sessionStats.correct}, Total: ${sessionStats.total})`;
    }
    if (kochCharSetDisplay) {
        kochCharSetDisplay.textContent = unlockedCharacters.join(', ');
    }
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
        kochAnswerInput.value = ''; // Clear previous answer
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

    // Initial UI setup
    if (kochPlayBtn) kochPlayBtn.classList.add('hidden');
    if (kochAnswerInput) kochAnswerInput.disabled = true; // Disable until session starts

    updateKochDisplays(); // Update displays with initial values

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
                kochAnswerInput.focus();
            }
            if (kochFeedbackMessage) kochFeedbackMessage.textContent = '';


            // Optionally, automatically play the first character
            playNextKochCharacter();
        });
    }

    // Add event listener for answer input
    if (kochAnswerInput) {
        kochAnswerInput.addEventListener('input', () => {
            if (kochAnswerInput.value.length === 1) { // maxlength="1"
                const userAnswer = kochAnswerInput.value.toUpperCase();
                sessionStats.total++;

                if (userAnswer === correctAnswer) {
                    sessionStats.correct++;
                    if(kochFeedbackMessage) kochFeedbackMessage.textContent = "Correct!";
                    // Optionally, add a class for styling success
                    if(kochFeedbackMessage) kochFeedbackMessage.className = 'text-lg text-center min-h-[28px] font-medium text-green-400';
                } else {
                    if(kochFeedbackMessage) kochFeedbackMessage.textContent = `Incorrect. The character was: ${correctAnswer}`;
                    // Optionally, add a class for styling error
                    if(kochFeedbackMessage) kochFeedbackMessage.className = 'text-lg text-center min-h-[28px] font-medium text-red-400';
                }

                updateKochDisplays();
                kochAnswerInput.value = ''; // Clear input field

                // Check if session is complete
                if (sessionStats.total >= SESSION_LENGTH) {
                    const accuracy = (sessionStats.correct / sessionStats.total) * 100;
                    handleSessionCompletion(accuracy);
                    // Do not play next character automatically, session has ended.
                } else {
                    // After a short delay, play the next character
                    setTimeout(() => {
                        if(kochFeedbackMessage && (kochFeedbackMessage.textContent === "Correct!" || kochFeedbackMessage.textContent.startsWith("Incorrect."))) {
                            // Clear only the specific "Correct!" or "Incorrect..." message before next char.
                            // Other messages (like session end, or general info) should persist if set by other logic.
                            kochFeedbackMessage.textContent = '';
                            kochFeedbackMessage.className = 'text-lg text-center min-h-[28px] font-medium'; // Reset class
                        }
                        playNextKochCharacter();
                    }, 1500); // 1.5 second delay
                }
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
});

// Function to handle session completion (to be fully implemented in Step 3)
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
            } else {
                kochFeedbackMessage.textContent = "Congratulations! You've mastered all characters!";
                kochFeedbackMessage.className = 'text-lg text-center min-h-[28px] font-medium text-green-400'; // Success style
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
}
