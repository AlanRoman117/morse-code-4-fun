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
    const playTappedMorseBtn = document.getElementById('play-tapped-morse-btn'); // Added

    if (!practiceText || !newChallengeButton || !practiceMessage || !tapperDecodedOutput || !clearTapperInputButton || !playTappedMorseBtn) { // Added playTappedMorseBtn
        console.error("Learn & Practice Game Error: One or more essential UI elements not found. Game will not initialize.");
        return;
    }

    const practiceWords = ['HELLO', 'WORLD', 'MORSE', 'CODE', 'PRACTICE', 'LEARNER', 'BUTTON', 'SIGNAL', 'TAPPER', 'YELLOW'];
    let currentChallengeWord = '';
    let currentTappedString = '';

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
});
