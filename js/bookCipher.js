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

    // New state variables for Morse tapper
    let characterTimer = null;
    const morseCharTypingTimeout = 1000; // 1 second

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


    function handleMorseProcessing() {
        if (!currentDecodedCharDisplay || !unlockedTextDisplay || !targetTextDisplay || !bookCipherMorseIO) {
            console.error("One or more required display/input elements are not found for Morse processing.");
            return;
        }
        if (typeof morseToText === 'undefined') {
            console.error("morseToText function is not defined. Ensure it's globally available.");
            alert("Error: Morse decoding functionality is not available. Please refresh.");
            return;
        }

        const morseInput = bookCipherMorseIO.value.trim();
        // If there's no input to process (e.g. timer fired after clearing), do nothing.
        if (morseInput === '') {
            currentDecodedCharDisplay.textContent = '-';
            return;
        }

        let decodedString = morseToText(morseInput);

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
                bookCipherMorseIO.value = ''; // Clear input
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
        bookCipherMorseIO.value = ''; // Clear input after processing attempt (correct, incorrect, or invalid)
    }


    if (bookCipherMorseIO) {
        // Keydown listener for tapper
        bookCipherMorseIO.addEventListener('keydown', (event) => {
            if (bookCipherMorseIO.disabled) return;

            if (event.key === '.' || event.key === '-') {
                event.preventDefault(); // Prevent default character insertion
                clearTimeout(characterTimer); // Reset timer on new input

                bookCipherMorseIO.value += event.key; // Append . or -

                // Update currentDecodedCharDisplay tentatively with the raw Morse input
                // This gives immediate feedback of what's being typed.
                // Alternatively, could try to decode on each keypress for live char display.
                // For now, just show the morse.
                // currentDecodedCharDisplay.textContent = bookCipherMorseIO.value; 
                // ^ This might be confusing if it shows ".-" then decodes to "A"

                characterTimer = setTimeout(handleMorseProcessing, morseCharTypingTimeout);
            } else if (event.key === 'Backspace') {
                 event.preventDefault();
                 bookCipherMorseIO.value = bookCipherMorseIO.value.slice(0, -1);
                 clearTimeout(characterTimer);
                 if (bookCipherMorseIO.value.length > 0) { // If still some Morse, restart timer
                    characterTimer = setTimeout(handleMorseProcessing, morseCharTypingTimeout);
                 } else {
                    currentDecodedCharDisplay.textContent = '-'; // Cleared all Morse
                 }
            }
            // Allow other keys like arrows, delete, etc. for basic editing, but they don't reset the timer
            // unless they modify the content in a way that 'input' event would catch (but we removed it).
            // For simplicity, only '.', '-', and Backspace are specially handled for timer logic.
        });

        // Blur listener to process pending input
        bookCipherMorseIO.addEventListener('blur', () => {
            if (bookCipherMorseIO.disabled) return;
            
            clearTimeout(characterTimer); // Stop any pending timer
            if (bookCipherMorseIO.value.trim() !== '') {
                handleMorseProcessing(); // Process immediately if there's content
            }
        });

        // Enable bookCipherMorseIO and reset tapper state when a book is started
        if (startBookButton) {
            startBookButton.addEventListener('click', () => {
                if (bookSelectionDropdown.value && bookSelectionDropdown.value !== "Choose a book") {
                    bookCipherMorseIO.disabled = false;
                    bookCipherMorseIO.value = '';
                    currentDecodedCharDisplay.textContent = '-';
                    clearTimeout(characterTimer); // Clear any existing timer
                }
            });
        }

    } else {
        console.error("Book Cipher Morse I/O element not found.");
    }
});
