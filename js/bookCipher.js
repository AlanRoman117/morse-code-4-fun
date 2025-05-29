document.addEventListener('DOMContentLoaded', () => {
    // 1. Define Book Data
    const bookSamples = {
        'wildwood': 'THE QUICK BROWN FOX', // Using a slightly longer example
        'morse_mysteries': 'MORSE MYSTERIES VOL ONE',
        'code_star': 'JOURNEY TO THE CODE STAR'
    };

    let currentTargetText = '';
    let currentCharacterIndex = 0;
    let revealedCharacters = [];

    // 2. Get DOM Elements
    const bookSelectionDropdown = document.getElementById('book-selection');
    const startBookButton = document.getElementById('start-book-btn');
    const targetTextDisplay = document.getElementById('target-text-display');
    const unlockedTextDisplay = document.getElementById('unlocked-text-display');
    const currentDecodedCharDisplay = document.getElementById('current-decoded-char');
    const bookCipherMorseIO = document.getElementById('book-cipher-morse-io'); // Added Morse I/O element

    // 3. obscureText Function (Will be implemented in the next step)
    function obscureText(text) {
        // Implementation will follow
        // For now, a placeholder to allow dependent functions to be structured
        let obscured = "";
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char >= 'A' && char <= 'Z') {
                obscured += '_';
            } else {
                obscured += char; // Preserve spaces and other characters
            }
        }
        return obscured;
    }

    // 4. displayTargetText Function
    function displayTargetText() {
        if (!targetTextDisplay) return; // Guard clause
        // Iterates over revealedCharacters and joins them to form the display string.
        // Spaces are handled by the initialization of revealedCharacters.
        targetTextDisplay.textContent = revealedCharacters.join('');
    }

    // 5. Event Listener for "Start Selected Book"
    if (startBookButton) {
        startBookButton.addEventListener('click', () => {
            if (!bookSelectionDropdown || !targetTextDisplay || !unlockedTextDisplay || !currentDecodedCharDisplay) {
                console.error("A required DOM element is missing for the book cipher.");
                alert("Error: A required UI element is missing. Please refresh the page.");
                return;
            }

            const selectedBookKey = bookSelectionDropdown.value;

            if (!selectedBookKey || selectedBookKey === "Choose a book") {
                alert("Please select a book to start.");
                return;
            }

            const bookText = bookSamples[selectedBookKey];

            if (!bookText) {
                alert("Selected book not found. Please choose another.");
                return;
            }

            currentTargetText = bookText.toUpperCase();
            currentCharacterIndex = 0;
            
            // Initialize revealedCharacters
            revealedCharacters = [];
            for (let i = 0; i < currentTargetText.length; i++) {
                if (currentTargetText[i] === ' ') {
                    revealedCharacters.push(' ');
                } else {
                    revealedCharacters.push('_');
                }
            }
            
            displayTargetText(); // Display the initially obscured text

            unlockedTextDisplay.textContent = ''; // Clear any previous unlocked text
            currentDecodedCharDisplay.textContent = '-'; // Reset current decoded char display
            
            console.log(`Starting book: ${selectedBookKey}`);
            console.log(`Target text: ${currentTargetText}`);
            console.log(`Obscured view: ${revealedCharacters.join('')}`);
        });
    } else {
        console.error("Start button not found for book cipher.");
    }

    // --- Placeholder for future functions related to Morse input and character checking ---
    // function handleMorseInput(morseSignal) { ... }
    // function checkCharacter(char) { ... }
    // function revealCharacter() { ... }
    // function advanceTarget() { ... }


    // Modified handleMorseProcessing to accept morseString
    function handleMorseProcessing(morseString) { 
        if (!currentDecodedCharDisplay || !unlockedTextDisplay || !targetTextDisplay) { // Removed bookCipherMorseIO from check
            console.error("One or more required display elements are not found for Morse processing.");
            return;
        }
        if (typeof morseToText === 'undefined') {
            console.error("morseToText function is not defined. Ensure it's globally available.");
            alert("Error: Morse decoding functionality is not available. Please refresh.");
            return;
        }

        // Use the provided morseString argument
        if (!morseString || morseString.trim() === '') {
            // If the tapper sends an empty string (e.g. from space button without prior Morse),
            // it might be a signal for a space, or just an empty input.
            // For now, we won't process it as a character. If space handling is needed from empty morse,
            // it would need specific logic here or a different event detail from the tapper.
            // The current tapper logic sends morseStringForEvent, which could be empty.
            // If it's an explicit space from the tapper, it might mean "end of word" or "add space".
            // The current auto-space reveal in this function already handles spaces in target text.
            // So, an empty morseString here likely means "no character to decode".
            console.log("handleMorseProcessing called with empty morseString.");
            currentDecodedCharDisplay.textContent = '-'; // Reset if nothing to decode
            return;
        }

        let decodedString = morseToText(morseString.trim()); // Use the argument

        if (decodedString && decodedString.length > 0) {
            let lastChar = decodedString.charAt(decodedString.length - 1).toUpperCase();
            currentDecodedCharDisplay.textContent = lastChar;

            // Auto-reveal spaces and advance
            while (currentCharacterIndex < currentTargetText.length && currentTargetText[currentCharacterIndex] === ' ') {
                if (revealedCharacters[currentCharacterIndex] !== ' ') {
                    revealedCharacters[currentCharacterIndex] = ' ';
                    unlockedTextDisplay.textContent += ' ';
                }
                currentCharacterIndex++;
            }
            displayTargetText();

            if (currentTargetText === '' || currentCharacterIndex >= currentTargetText.length) {
                if (currentTargetText !== '' && currentCharacterIndex >= currentTargetText.length && !revealedCharacters.includes('_')) {
                    alert("Congratulations! You've completed the text!");
                    bookCipherMorseIO.disabled = true;
                    currentDecodedCharDisplay.textContent = '✓';
                } else {
                    currentDecodedCharDisplay.textContent = '-';
                }
                // DO NOT clear bookCipherMorseIO.value here
                return;
            }

            const expectedChar = currentTargetText[currentCharacterIndex];

            if (lastChar === expectedChar) {
                revealedCharacters[currentCharacterIndex] = expectedChar;
                displayTargetText();
                unlockedTextDisplay.textContent += expectedChar;
                currentCharacterIndex++;

                while (currentCharacterIndex < currentTargetText.length && currentTargetText[currentCharacterIndex] === ' ') {
                    if (revealedCharacters[currentCharacterIndex] !== ' ') {
                        revealedCharacters[currentCharacterIndex] = ' ';
                        unlockedTextDisplay.textContent += ' ';
                    }
                    currentCharacterIndex++;
                }
                displayTargetText();

                if (currentCharacterIndex === currentTargetText.length && !revealedCharacters.includes('_')) {
                    alert("Congratulations! You've completed the text!");
                    bookCipherMorseIO.disabled = true;
                    currentDecodedCharDisplay.textContent = '✓';
                }
            } else {
                // Incorrect guess
                const originalColor = currentDecodedCharDisplay.style.backgroundColor;
                currentDecodedCharDisplay.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
                setTimeout(() => {
                    currentDecodedCharDisplay.style.backgroundColor = originalColor || '';
                }, 300);
                // Note: We don't clear currentDecodedCharDisplay.textContent here to show the wrong char.
            }
        } else {
            // Invalid/incomplete Morse, but input was present.
            // Optionally provide feedback or just leave currentDecodedCharDisplay as is (showing last valid char or '-')
            // For now, if morseInput was not empty but decodedString is, it implies invalid morse.
            // Flash the input box or the currentDecodedCharDisplay?
             const originalColor = currentDecodedCharDisplay.style.backgroundColor;
             currentDecodedCharDisplay.style.backgroundColor = 'rgba(255, 165, 0, 0.5)'; // Orange for invalid
             setTimeout(() => {
                 currentDecodedCharDisplay.style.backgroundColor = originalColor || '';
                 currentDecodedCharDisplay.textContent = '-'; // Reset after invalid Morse
             }, 300);
        }
        // DO NOT clear bookCipherMorseIO.value here
    }

    // Event listener for the visual tapper's output
    document.addEventListener('visualTapperCharacterComplete', (event) => {
        if (event.detail && typeof event.detail.morseString === 'string') {
            const morseFromTapper = event.detail.morseString;
            console.log('BookCipher: Received visualTapperCharacterComplete with Morse:', morseFromTapper);
            if (morseFromTapper) { // Process only if not empty
                handleMorseProcessing(morseFromTapper);
            } else {
                // If tapper sends empty string (e.g. space button with no prior Morse)
                // current logic in handleMorseProcessing will show '-'
                // Specific handling for "word space" signal could be added if needed.
                // For now, an empty morse string effectively resets currentDecodedCharDisplay to '-'
                // via handleMorseProcessing's initial check.
                handleMorseProcessing(morseFromTapper); // Call to potentially reset display
            }
        } else {
            console.warn('BookCipher: Received visualTapperCharacterComplete event without morseString in detail.');
        }
    });


    // Original bookCipherMorseIO related logic (now mostly unused for input)
    // We keep the reference if other parts of the UI might interact with it,
    // but the core input is from the visual tapper.
    if (bookCipherMorseIO) {
        // Enable bookCipherMorseIO visually (though it's not primary input) 
        // and reset displays when a book is started.
        if (startBookButton) {
            startBookButton.addEventListener('click', () => {
                if (bookSelectionDropdown.value && bookSelectionDropdown.value !== "Choose a book") {
                    if(bookCipherMorseIO) bookCipherMorseIO.disabled = false; // Keep it enabled if it exists
                    // No need to clear its value as it's not the input source for processing
                    currentDecodedCharDisplay.textContent = '-';
                    // No characterTimer to clear
                }
            });
        }

    } else {
        console.error("Book Cipher Morse I/O element not found.");
    }
});
