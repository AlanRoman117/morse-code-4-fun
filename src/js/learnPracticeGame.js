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

    // Combined check for all essential elements
    if (!practiceText || !newChallengeButton || !practiceMessage || !tapperDecodedOutput || !clearTapperInputButton || !playTappedMorseBtn) {
        console.error("Learn & Practice Game Error: One or more essential UI elements for tapping practice not found. Affected modes may not initialize correctly.");
        // Depending on which elements are missing, we might selectively disable parts of the script.
        // For now, if essential common elements are missing, it's a critical error.
        if (!practiceText || !newChallengeButton) return; // Critical for tapping practice
    }

    const practiceWords = ['HELLO', 'WORLD', 'MORSE', 'CODE', 'PRACTICE', 'LEARNER', 'BUTTON', 'SIGNAL', 'TAPPER', 'YELLOW', 'LISTEN', 'DECODE', 'ANSWER', 'CHALLENGE'];
    let currentChallengeWord = ''; // Used for tapping practice
    let currentTappedString = '';  // Used for tapping practice

    // Helper function to set practice message and class
    function setPracticeFeedback(message, type) {
        if (practiceMessage) {
            practiceMessage.textContent = message;
            // Remove old feedback classes
            practiceMessage.classList.remove(
                'feedback-message-complete',
                'feedback-message-correct',
                'feedback-message-mistake',
                'feedback-message-unknown'
            );
            // Add new feedback class if type is provided
            if (type) {
                practiceMessage.classList.add(`feedback-message-${type}`);
            }
            // Clear inline style for color, let CSS classes handle it
            practiceMessage.style.color = '';
        }
    }

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
        setPracticeFeedback('', null); // Clear feedback message and class

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

        // Clear previous feedback classes
        tapperDecodedOutput.classList.remove('glow-green', 'shake-red');

        if (currentTappedString === currentChallengeWord) {
            setPracticeFeedback("Challenge Complete!", "complete");
            tapperDecodedOutput.classList.add('glow-green');
            setTimeout(() => tapperDecodedOutput.classList.remove('glow-green'), 800);
            
            // Trigger confetti
            if (typeof confetti === 'function') {
                // Burst 1: Central, wide, main effect
                confetti({
                    particleCount: 200,
                    spread: 100, // Increased spread a bit
                    origin: { y: 0.5 },
                    drift: 0.5,
                    gravity: 0.8
                });

                // Burst 2 & 3: Side bursts
                setTimeout(() => {
                    confetti({
                        particleCount: 150,
                        angle: 60,
                        spread: 70, // Slightly wider
                        origin: { x: 0, y: 0.6 }, 
                        colors: ['#FF69B4', '#FFD700', '#ADFF2F'] // Hot pink, Gold, GreenYellow
                    });
                    confetti({
                        particleCount: 150,
                        angle: 120,
                        spread: 70, // Slightly wider
                        origin: { x: 1, y: 0.6 }, 
                        colors: ['#00BFFF', '#BA55D3', '#FF4500'] // DeepSkyBlue, MediumOrchid, OrangeRed
                    });
                }, 150); // Slightly earlier for a quicker follow-up

                // Burst 4 & 5: Additional bursts
                setTimeout(() => {
                    confetti({
                        particleCount: 100,
                        angle: 45, 
                        spread: 50,
                        origin: { x: 0.2, y: 0.7 }, // Lower left-ish
                        gravity: 0.7
                    });
                    confetti({
                        particleCount: 100,
                        angle: 135,
                        spread: 50,
                        origin: { x: 0.8, y: 0.7 }, // Lower right-ish
                        gravity: 0.7
                    });
                }, 400); // A bit later for a final flourish
            }
            // Optionally, disable further tapper input until "New Challenge"
        } else if (currentChallengeWord.startsWith(currentTappedString)) {
            setPracticeFeedback("Correct!", "correct");
            tapperDecodedOutput.classList.add('glow-green');
            setTimeout(() => tapperDecodedOutput.classList.remove('glow-green'), 800);
        } else {
            setPracticeFeedback("Mistake. Tap 'End Ltr' then try the correct letter.", "mistake");
            tapperDecodedOutput.classList.add('shake-red');
            setTimeout(() => tapperDecodedOutput.classList.remove('shake-red'), 500);
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
            setPracticeFeedback('', null); // Clear feedback
            // practiceText (challenge word) remains untouched.
            console.log("Tapper input cleared by user.");
        });
    }

    document.addEventListener('visualTapperInput', (event) => {
        const learnPracticeTab = document.getElementById('learn-practice-tab');
        if (learnPracticeTab && learnPracticeTab.classList.contains('hidden')) {
            return; // Do nothing if the Learn & Practice tab is not active
        }

        if (!currentChallengeWord) return; // Ignore taps if no challenge is active

        const detail = event.detail;
        if (!detail) return; // No detail object

        if (detail.type === 'char') {
            const morseString = detail.value;
            if (morseString) { // Ensure there's a Morse string to decode
                const decodedChar = getCharFromMorse(morseString);
                if (decodedChar) {
                    checkPractice(decodedChar); // This function already updates tapperDecodedOutput and currentTappedString
                } else {
                    setPracticeFeedback(`Unknown Morse: ${morseString}. Try again.`, "unknown");
                }
            }
        } else if (detail.type === 'word_space') {
            // Append a literal space
            currentTappedString += ' ';
            tapperDecodedOutput.textContent = currentTappedString;
            updatePlayTappedMorseButtonState();
            // Optionally, provide feedback or move to next word if that's part of the game logic
            // For now, just adding a space.
            setPracticeFeedback("Space added.", "correct"); // Using "correct" class for neutral/positive feedback
            // If we want to check if the space was correctly placed (e.g., end of a word in challenge):
            // if (currentTappedString.trim() === currentChallengeWord.substring(0, currentTappedString.length).trim() && currentTappedString.endsWith(' ')) {
            //     // Potentially part of a multi-word challenge, or just confirming space.
            // }
        } else if (detail.type === 'delete_char') {
            currentTappedString = detail.newFullText !== undefined ? detail.newFullText : currentTappedString.slice(0, -1); // Fallback if newFullText is not provided
            tapperDecodedOutput.textContent = currentTappedString;
            updatePlayTappedMorseButtonState();

            // Re-evaluate practice message based on the new string
            if (currentTappedString === "") { // If string is empty, clear message
                setPracticeFeedback("", null);
            } else if (currentChallengeWord.startsWith(currentTappedString)) {
                setPracticeFeedback("Correct!", "correct");
            } else {
                // This case might be complex if the string becomes incorrect *after* a delete.
                // For simplicity, if it's not empty and not a prefix, it's likely a mistake state.
                // Or, we can clear the message to avoid confusion. Let's clear it for now.
                setPracticeFeedback("", null); // Clear message on delete if not perfectly correct start
            }
            // console.log("LearnPracticeGame: Deleted char. New currentTappedString:", currentTappedString); // Log removed
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

    // updateTableHighlight was moved to global scope

    if (playTappedMorseBtn) {
        playTappedMorseBtn.addEventListener('click', async () => {
            // console.log("[LearnPracticeGame] 'Play My Tapped Morse' button clicked."); // Log removed
            const textToPlay = tapperDecodedOutput.textContent;
            // console.log("[LearnPracticeGame] Text to play:", textToPlay); // Log removed

            if (textToPlay.trim() === '') {
                // console.log("[LearnPracticeGame] No text to play."); // Log removed
                return;
            }

            if (typeof textToMorse !== 'function' || typeof playMorseSequence !== 'function') {
                console.error("[LearnPracticeGame] textToMorse or playMorseSequence function is not available."); // Keep this error log
                return;
            }
            
            // Ensure audio context is ready
            if (typeof initAudio === 'function') {
                initAudio();
            } else {
                console.warn("[LearnPracticeGame] initAudio function not available. Audio might not play reliably."); // Keep this warning
            }
             // It's also good practice to ensure Tone.js is started by a user gesture if relying on it.
            // However, playMorseSequence in main.js should handle its own Tone.js context if it uses it.

            const morseToPlay = textToMorse(textToPlay);
            // console.log("[LearnPracticeGame] Morse to play:", morseToPlay); // Log removed

            if (morseToPlay) {
                try {
                    // console.log("[LearnPracticeGame] Calling playMorseSequence for tapper playback..."); // Log removed
                    await playMorseSequence(morseToPlay, null, null, 'tapper', 'play-tapped-morse-btn');
                    // console.log("[LearnPracticeGame] playMorseSequence for tapper finished."); // Log removed
                } catch (error) {
                    console.error("[LearnPracticeGame] Error during playMorseSequence for tapper:", error); // Keep this error log
                }
            } else {
                // console.log("[LearnPracticeGame] Nothing to play (text converted to empty Morse)."); // Log removed
            }
        });
    }

});
