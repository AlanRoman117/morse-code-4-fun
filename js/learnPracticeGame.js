document.addEventListener('DOMContentLoaded', () => {
    const practiceText = document.getElementById('practiceText');
    const newChallengeButton = document.getElementById('newChallengeButton');
    const practiceMessage = document.getElementById('practiceMessage');
    const tapperDecodedOutput = document.getElementById('tapperDecodedOutput');

    if (!practiceText || !newChallengeButton || !practiceMessage || !tapperDecodedOutput) {
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

        if (currentTappedString === currentChallengeWord) {
            practiceMessage.textContent = "Challenge Complete!";
            practiceMessage.style.color = 'lightgreen';
            // Optionally, disable further tapper input until "New Challenge"
        } else if (currentChallengeWord.startsWith(currentTappedString)) {
            practiceMessage.textContent = "Correct!";
            practiceMessage.style.color = 'lightblue';
        } else {
            practiceMessage.textContent = "Mistake. Tap 'End Ltr' then try the correct letter.";
            practiceMessage.style.color = 'pink';
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
                practiceMessage.style.color = 'orange';
            }
        } else {
            // This can happen if the spaceButton is pressed when currentMorse in tapper is empty.
            // For this game, it doesn't represent a character input, so we can ignore it.
            // console.log("Learn & Practice: visualTapperCharacterComplete with empty morseString.");
        }
    });

    // Initialize the first challenge
    startNewChallenge();
});
