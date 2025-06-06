// Moved updateTableHighlight to global scope so it can be called by other scripts like visualTapper.js
function updateTableHighlight(morseString) {
    // First, clear any previously highlighted cells
    const highlightedCells = document.querySelectorAll('.table-highlight');
    highlightedCells.forEach(cell => {
        cell.classList.remove('table-highlight');
    });

    // Ensure reversedMorseCode is available (it's defined in index.html's script block)
    if (typeof reversedMorseCode !== 'undefined' && morseString && reversedMorseCode[morseString]) {
        const char = reversedMorseCode[morseString];

        let idChar = char; // Default to using the char itself for ID
        // Mirror the sanitization logic from populateMorseReference in index.html
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

        const charCellId = `ref-char-${idChar}`;
        const morseCellId = `ref-morse-${idChar}`;

        const charCell = document.getElementById(charCellId);
        const morseCell = document.getElementById(morseCellId);

        if (charCell) {
            charCell.classList.add('table-highlight');
        }
        if (morseCell) {
            morseCell.classList.add('table-highlight');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const practiceText = document.getElementById('practiceText');
    const newChallengeButton = document.getElementById('newChallengeButton');
    const practiceMessage = document.getElementById('practiceMessage');
    const tapperDecodedOutput = document.getElementById('tapperDecodedOutput');
    const clearTapperInputButton = document.getElementById('clearTapperInputButton');
    const playTappedMorseBtn = document.getElementById('play-tapped-morse-btn');

    // Elements for "Receive & Type" mode
    const playReceiveChallengeButton = document.getElementById('playReceiveChallengeButton');
    const receiveChallengeInput = document.getElementById('receiveChallengeInput');
    const submitReceiveChallengeButton = document.getElementById('submitReceiveChallengeButton');
    const receiveChallengeFeedback = document.getElementById('receiveChallengeFeedback');

    // Combined check for all essential elements
    if (!practiceText || !newChallengeButton || !practiceMessage || !tapperDecodedOutput || !clearTapperInputButton || !playTappedMorseBtn ||
        !playReceiveChallengeButton || !receiveChallengeInput || !submitReceiveChallengeButton || !receiveChallengeFeedback) {
        console.error("Learn & Practice Game Error: One or more essential UI elements for tapping practice or receive challenge not found. Affected modes may not initialize correctly.");
        // Depending on which elements are missing, we might selectively disable parts of the script.
        // For now, if essential common elements are missing, it's a critical error.
        if (!practiceText || !newChallengeButton) return; // Critical for tapping practice
    }

    const practiceWords = ['HELLO', 'WORLD', 'MORSE', 'CODE', 'PRACTICE', 'LEARNER', 'BUTTON', 'SIGNAL', 'TAPPER', 'YELLOW', 'LISTEN', 'DECODE', 'ANSWER', 'CHALLENGE'];
    let currentChallengeWord = ''; // Used for tapping practice
    let currentTappedString = '';  // Used for tapping practice

    // Variables for "Receive & Type" mode
    let currentReceiveChallengeWord = '';
    let isReceiveChallengeActive = false;

    // Function to get character from Morse (relies on reversedMorseCode from index.html)
    function getCharFromMorse(morseString) {
        if (typeof reversedMorseCode !== 'undefined' && reversedMorseCode[morseString]) {
            return reversedMorseCode[morseString];
        }
        return null; // Or some other indicator for unknown/empty morse
    }

    function startNewChallenge() {
        const randomIndex = Math.floor(Math.random() * practiceWords.length);
        currentChallengeWord = practiceWords[randomIndex];
        practiceText.textContent = currentChallengeWord;

        currentTappedString = ''; // Reset internal tracking
        tapperDecodedOutput.textContent = ''; // Clear display
        updatePlayTappedMorseButtonState(); // Update button state
        practiceMessage.textContent = '';   // Clear feedback

        // Reset the visual tapper's internal state (e.g., current Morse signals)
        if (typeof resetVisualTapperState === 'function') {
            resetVisualTapperState();
        } else {
            console.warn("learnPracticeGame: resetVisualTapperState function not found. Tapper state may not be fully reset.");
        }
        // Potentially enable tapper input here if it was disabled
    }

    function checkPractice(tappedChar) {
        if (!currentChallengeWord) return; // No active challenge

        currentTappedString += tappedChar;
        tapperDecodedOutput.textContent = currentTappedString;
        updatePlayTappedMorseButtonState(); // Update button state

        if (currentTappedString === currentChallengeWord) {
            practiceMessage.textContent = "Challenge Complete!";
            practiceMessage.style.color = 'lightgreen';
            // Optionally, disable further tapper input until "New Challenge"
        } else if (currentChallengeWord.startsWith(currentTappedString)) {
            practiceMessage.textContent = "Correct!";
            practiceMessage.style.color = 'lightblue';
        } else {
            practiceMessage.textContent = "Mistake. Tap 'End Ltr' then try the correct letter.";
            practiceMessage.style.color = '#DC2626'; // Tailwind red-600 for better contrast
            // To handle the "mistake" more gracefully:
            // The user has tapped a full character, and it's wrong in the sequence.
            // We should clear the last attempted character from currentTappedString
            // and tapperDecodedOutput to allow them to retry the character.
            // However, the current visualTapper sends a full character *after* "End Letter" or timeout.
            // So, if a mistake is made, the user must manually signal the end of their (incorrect) Morse character,
            // then this function will mark it as a mistake. They'd then need to tap "New Challenge" or we'd need a "clear attempt" feature.
            // For now, the message guides them to use "End Ltr" (which clears tapper's internal currentMorse) and try again.
            // A more robust solution might involve clearing the last char from currentTappedString.
            // For this iteration, we'll keep it simple: the mistake means the *sequence* is wrong.
            // To allow retrying the current letter, we'd need to remove the last char:
            // currentTappedString = currentTappedString.slice(0, -1);
            // tapperDecodedOutput.textContent = currentTappedString;
            // And then guide them to re-tap the correct character.
            // The current message "Tap 'End Ltr' then try the correct letter" implies they should clear the tapper's buffer via spacebar and retry.
        }
    }

    newChallengeButton.addEventListener('click', startNewChallenge);

    if (clearTapperInputButton) {
        clearTapperInputButton.addEventListener('click', () => {
            tapperDecodedOutput.textContent = '';
            updatePlayTappedMorseButtonState(); // Update button state
            if (typeof resetVisualTapperState === 'function') {
                resetVisualTapperState();
            } else {
                console.warn("learnPracticeGame: resetVisualTapperState function not found. Cannot reset tapper state.");
            }
            currentTappedString = '';
            practiceMessage.textContent = '';
            // practiceText (challenge word) remains untouched.
            console.log("Tapper input cleared by user.");
        });
    }

    document.addEventListener('visualTapperCharacterComplete', (event) => {
    const learnPracticeTab = document.getElementById('learn-practice-tab');
    if (learnPracticeTab && learnPracticeTab.classList.contains('hidden')) {
        return; // Do nothing if the Learn & Practice tab is not active
    }

        if (!currentChallengeWord) return; // Ignore taps if no challenge is active

        const morseString = event.detail.morseString;
        if (morseString) { // Ensure there's a Morse string to decode
            const decodedChar = getCharFromMorse(morseString);
            if (decodedChar) {
                checkPractice(decodedChar);
            } else {
                // This case means the tapper completed a sequence, but it's not valid Morse.
                // visualTapper.js already handles showing "Unknown Morse" locally.
                // Here, we might want to provide feedback in the game context.
                practiceMessage.textContent = `Unknown Morse: ${morseString}. Try again.`;
                practiceMessage.style.color = '#F59E0B'; // Tailwind amber-500 (similar to orange)
            }
        } else {
            // This can happen if the spaceButton is pressed when currentMorse in tapper is empty.
            // For this game, it doesn't represent a character input, so we can ignore it.
            // console.log("Learn & Practice: visualTapperCharacterComplete with empty morseString.");
        }
    });

    // Initialize the first challenge
    startNewChallenge();

    function updatePlayTappedMorseButtonState() {
        if (tapperDecodedOutput.textContent.trim() !== '') {
            playTappedMorseBtn.disabled = false;
        } else {
            playTappedMorseBtn.disabled = true;
        }
    }
    // updateTableHighlight was moved to global scope

    // --- "Receive & Type" Morse Challenge Logic ---

    async function startNewReceiveChallenge() {
        // Check if audio is already playing globally
        if (typeof window.isPlaying !== 'undefined' && window.isPlaying) {
            receiveChallengeFeedback.textContent = "Audio is busy. Please wait.";
            receiveChallengeFeedback.style.color = 'orange'; // Using direct style for simplicity matching existing feedback
            if(playReceiveChallengeButton) playReceiveChallengeButton.disabled = false; // Allow user to try again shortly
            if(submitReceiveChallengeButton) submitReceiveChallengeButton.disabled = true;
            if(receiveChallengeInput) receiveChallengeInput.disabled = true;
            isReceiveChallengeActive = false; // Ensure challenge is not considered active
            return;
        }

        isReceiveChallengeActive = true;
        if(playReceiveChallengeButton) playReceiveChallengeButton.disabled = true;
        if(submitReceiveChallengeButton) submitReceiveChallengeButton.disabled = true;
        if(receiveChallengeInput) receiveChallengeInput.disabled = false;
        if(receiveChallengeInput) receiveChallengeInput.value = '';
        if(receiveChallengeFeedback) receiveChallengeFeedback.textContent = '';
        if(receiveChallengeFeedback) receiveChallengeFeedback.className = 'text-lg text-center min-h-[24px] mt-2'; // Reset class

        const randomIndex = Math.floor(Math.random() * practiceWords.length);
        currentReceiveChallengeWord = practiceWords[randomIndex].toUpperCase();

        // Ensure textToMorse function is available (defined in index.html script)
        if (typeof textToMorse !== 'function') {
            console.error("textToMorse function is not defined. Cannot play Morse sequence.");
            if(receiveChallengeFeedback) {
                receiveChallengeFeedback.textContent = "Error: Cannot prepare Morse audio.";
                receiveChallengeFeedback.style.color = 'red';
            }
            isReceiveChallengeActive = false;
            if(playReceiveChallengeButton) playReceiveChallengeButton.disabled = false; // Re-enable play button
            if(receiveChallengeInput) receiveChallengeInput.disabled = true;
            return;
        }

        const morseVersionOfWord = textToMorse(currentReceiveChallengeWord);

        // Ensure playMorseSequence is available (defined in index.html script)
        // And initAudio has been called by user gesture (e.g. clicking playMorseBtn in main interface)
        if (typeof playMorseSequence !== 'function' || typeof window.audioContext === 'undefined' || window.audioContext.state === 'suspended') {
            console.error("playMorseSequence function is not defined, or audio context not ready. Cannot play Morse sequence.");
            if(receiveChallengeFeedback) {
                receiveChallengeFeedback.textContent = "Error: Audio system not ready. Please interact with main player first.";
                receiveChallengeFeedback.style.color = 'red';
            }
            isReceiveChallengeActive = false;
            if(playReceiveChallengeButton) playReceiveChallengeButton.disabled = false;
            if(receiveChallengeInput) receiveChallengeInput.disabled = true;
            // A more robust solution might try to call initAudio() here if possible,
            // but generally, AudioContext needs a direct user gesture on its first activation.
            return;
        }

        if(receiveChallengeFeedback) {
            receiveChallengeFeedback.textContent = "Listen...";
            receiveChallengeFeedback.style.color = 'lightblue';
        }

        try {
            await playMorseSequence(morseVersionOfWord); // Assumes playMorseSequence is async or returns a Promise
            // Playback finished
            if(submitReceiveChallengeButton) submitReceiveChallengeButton.disabled = false;
            if(receiveChallengeInput) receiveChallengeInput.focus();
            if(receiveChallengeFeedback) {
                receiveChallengeFeedback.textContent = "Your turn! Type what you heard.";
                receiveChallengeFeedback.style.color = 'yellow'; // Or another neutral/prompting color
            }
        } catch (error) {
            console.error("Error during Morse playback for receive challenge:", error);
            if(receiveChallengeFeedback) {
                receiveChallengeFeedback.textContent = "Error playing Morse. Try again.";
                receiveChallengeFeedback.style.color = 'red';
            }
            isReceiveChallengeActive = false;
            if(playReceiveChallengeButton) playReceiveChallengeButton.disabled = false; // Re-enable play button
            if(receiveChallengeInput) receiveChallengeInput.disabled = true;
            if(submitReceiveChallengeButton) submitReceiveChallengeButton.disabled = true;
        }
        // playReceiveChallengeButton remains disabled until the current challenge is submitted or reset
    }

    function checkReceiveChallengeAnswer() {
        // Added null checks for UI elements, though they are checked at the top of DOMContentLoaded
        if (!isReceiveChallengeActive && !currentReceiveChallengeWord) {
             console.log("No active receive challenge to check or word not set.");
             // If UI elements might be null, ensure checks:
             if(playReceiveChallengeButton) playReceiveChallengeButton.disabled = false;
             if(submitReceiveChallengeButton) submitReceiveChallengeButton.disabled = true;
             if(receiveChallengeInput) receiveChallengeInput.disabled = true;
             return;
        }
        isReceiveChallengeActive = false; // Mark as no longer active once submitted
        const userAnswer = receiveChallengeInput ? receiveChallengeInput.value.trim().toUpperCase() : "";

        if (userAnswer === currentReceiveChallengeWord) {
            if(receiveChallengeFeedback) {
                receiveChallengeFeedback.textContent = `Correct! The word was '${currentReceiveChallengeWord}'.`;
                receiveChallengeFeedback.style.color = 'lightgreen';
            }
        } else {
            if(receiveChallengeFeedback) {
                receiveChallengeFeedback.textContent = `Incorrect. You typed '${userAnswer || "[empty]"}'. The correct word was '${currentReceiveChallengeWord}'.`;
                receiveChallengeFeedback.style.color = '#DC2626'; // Tailwind red-600
            }
        }

        if(playReceiveChallengeButton) playReceiveChallengeButton.disabled = false;
        if(submitReceiveChallengeButton) submitReceiveChallengeButton.disabled = true;
        if(receiveChallengeInput) receiveChallengeInput.disabled = true;
        currentReceiveChallengeWord = ''; // Clear the word after checking
    }

    // Ensure elements exist before adding listeners (already done by the top-level check, but good practice if functions were standalone)
    if (playReceiveChallengeButton) {
        playReceiveChallengeButton.addEventListener('click', startNewReceiveChallenge);
    }

    if (submitReceiveChallengeButton) {
        submitReceiveChallengeButton.addEventListener('click', checkReceiveChallengeAnswer);
    }

    if (receiveChallengeInput) {
        receiveChallengeInput.addEventListener('keypress', (event) => {
            // Check if submit button is available and not disabled
            if (event.key === 'Enter' && isReceiveChallengeActive && submitReceiveChallengeButton && !submitReceiveChallengeButton.disabled) {
                checkReceiveChallengeAnswer();
            }
        });
    }

    // Initial state for Receive & Type mode (buttons should be set by HTML, but good to confirm)
    // Null checks here are defensive.
    if (playReceiveChallengeButton) playReceiveChallengeButton.disabled = false;
    if (submitReceiveChallengeButton) submitReceiveChallengeButton.disabled = true;
    if (receiveChallengeInput) receiveChallengeInput.disabled = true;

});
