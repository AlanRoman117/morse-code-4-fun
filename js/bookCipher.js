document.addEventListener('DOMContentLoaded', () => {
    const bookCipherBooks = {
        'passage_1': { title: 'Sherlock Holmes Snippet', filePath: 'assets/book_cipher_texts/passage1.txt' },
        'mystery_intro': { title: 'Stormy Night Mystery', filePath: 'assets/book_cipher_texts/mystery_intro.txt' },
        'sci_fi_quote': { title: 'Sci-Fi Classic Quote', filePath: 'assets/book_cipher_texts/sci_fi_quote.txt' }
    };

    let currentTargetText = '';
    let currentCharacterIndex = 0;
    let revealedCharacters = [];

    const bookSelectionDropdown = document.getElementById('book-selection');
    const startBookButton = document.getElementById('start-book-btn');
    const targetTextDisplay = document.getElementById('target-text-display');
    const unlockedTextDisplay = document.getElementById('unlocked-text-display');
    const currentDecodedCharDisplay = document.getElementById('current-decoded-char');
    const bookCipherMorseIO = document.getElementById('book-cipher-morse-io');

    function displayTargetText() {
        if (!targetTextDisplay) return;
        targetTextDisplay.textContent = revealedCharacters.join('');
    }

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

            const bookData = bookCipherBooks[selectedBookKey];

            if (!bookData || !bookData.filePath) {
                alert("Selected book definition is missing or has no file path. Please choose another.");
                console.error("Selected book key:", selectedBookKey, "Book data:", bookData);
                targetTextDisplay.textContent = "Error: Book details incomplete.";
                return;
            }

            // -- FETCH LOGIC START --
            fetch(bookData.filePath)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}, file: ${bookData.filePath}`);
                    }
                    return response.text();
                })
                .then(text => {
                    currentTargetText = text.trim().toUpperCase(); // Trim whitespace and convert to upper case
                    if (currentTargetText.length === 0) {
                        console.warn(`Fetched text for ${bookData.filePath} is empty.`);
                        targetTextDisplay.textContent = "Book is empty.";
                        revealedCharacters = [];
                        unlockedTextDisplay.textContent = '';
                        currentDecodedCharDisplay.textContent = '-';
                        currentCharacterIndex = 0;
                        if(bookCipherMorseIO) bookCipherMorseIO.disabled = true; // Disable input if book is empty
                        return;
                    }

                    currentCharacterIndex = 0;
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
                    if(bookCipherMorseIO) bookCipherMorseIO.disabled = false; // Enable Morse input area

                    console.log(`Successfully loaded book: ${selectedBookKey} from ${bookData.filePath}`);
                    console.log(`Target text set to: ${currentTargetText}`);
                })
                .catch(error => {
                    console.error('Error fetching book content:', error);
                    targetTextDisplay.textContent = `Error: Could not load '${bookData.title}'. File not found or unreadable.`;
                    currentTargetText = '';
                    revealedCharacters = [];
                    unlockedTextDisplay.textContent = '';
                    currentDecodedCharDisplay.textContent = '-';
                    if(bookCipherMorseIO) bookCipherMorseIO.disabled = true;
                });
            // -- FETCH LOGIC END --
        });
    } else {
        console.error("Start button not found for book cipher.");
    }

    function handleMorseProcessing(morseString) { 
        if (!currentDecodedCharDisplay || !unlockedTextDisplay || !targetTextDisplay) {
            console.error("One or more required display elements are not found for Morse processing.");
            return;
        }
        if (typeof morseToText === 'undefined') {
            console.error("morseToText function is not defined. Ensure it's globally available.");
            alert("Error: Morse decoding functionality is not available. Please refresh.");
            return;
        }

        if (currentTargetText === '') { // Don't process if no book is loaded or book is empty
            console.log("Morse processing ignored: No target text loaded.");
            currentDecodedCharDisplay.textContent = '-';
            return;
        }

        if (!morseString || morseString.trim() === '') {
            console.log("handleMorseProcessing called with empty morseString.");
            currentDecodedCharDisplay.textContent = '-';
            return;
        }

        let decodedString = morseToText(morseString.trim());

        if (decodedString && decodedString.length > 0) {
            let lastChar = decodedString.charAt(decodedString.length - 1).toUpperCase();
            currentDecodedCharDisplay.textContent = lastChar;

            // Auto-reveal spaces and advance
            while (currentCharacterIndex < currentTargetText.length && currentTargetText[currentCharacterIndex] === ' ') {
                if (revealedCharacters[currentCharacterIndex] !== ' ') {
                    revealedCharacters[currentCharacterIndex] = ' ';
                    unlockedTextDisplay.textContent += ' '; // Add space to unlocked text as well
                }
                currentCharacterIndex++;
            }
            // displayTargetText(); // displayTargetText called below if char matches or not.

            if (currentCharacterIndex >= currentTargetText.length) {
                if (!revealedCharacters.includes('_')) {
                    alert("Congratulations! You've completed the text!");
                    if(bookCipherMorseIO) bookCipherMorseIO.disabled = true;
                    currentDecodedCharDisplay.textContent = '✓';
                } else {
                    // This case should ideally not be reached if logic is correct
                    currentDecodedCharDisplay.textContent = '-';
                }
                displayTargetText();
                return;
            }

            const expectedChar = currentTargetText[currentCharacterIndex];

            if (lastChar === expectedChar) {
                revealedCharacters[currentCharacterIndex] = expectedChar;
                unlockedTextDisplay.textContent += expectedChar;
                currentCharacterIndex++;

                // Auto-reveal subsequent spaces after a correct character
                while (currentCharacterIndex < currentTargetText.length && currentTargetText[currentCharacterIndex] === ' ') {
                    if (revealedCharacters[currentCharacterIndex] !== ' ') {
                        revealedCharacters[currentCharacterIndex] = ' ';
                        unlockedTextDisplay.textContent += ' ';
                    }
                    currentCharacterIndex++;
                }

                if (currentCharacterIndex >= currentTargetText.length && !revealedCharacters.includes('_')) {
                    alert("Congratulations! You've completed the text!");
                    if(bookCipherMorseIO) bookCipherMorseIO.disabled = true;
                    currentDecodedCharDisplay.textContent = '✓';
                }
            } else {
                // Incorrect guess
                const originalColor = currentDecodedCharDisplay.style.backgroundColor;
                currentDecodedCharDisplay.style.backgroundColor = 'rgba(255, 0, 0, 0.5)'; // Red flash
                setTimeout(() => {
                    currentDecodedCharDisplay.style.backgroundColor = originalColor || '';
                }, 300);
            }
            displayTargetText(); // Update display after guess processing
        } else {
            // Invalid/incomplete Morse
             const originalColor = currentDecodedCharDisplay.style.backgroundColor;
             currentDecodedCharDisplay.style.backgroundColor = 'rgba(255, 165, 0, 0.5)'; // Orange flash
             setTimeout(() => {
                 currentDecodedCharDisplay.style.backgroundColor = originalColor || '';
                 currentDecodedCharDisplay.textContent = '-';
             }, 300);
        }
    }

    document.addEventListener('visualTapperCharacterComplete', (event) => {
        if (event.detail && typeof event.detail.morseString === 'string') {
            const morseFromTapper = event.detail.morseString;
            // console.log('BookCipher: Received visualTapperCharacterComplete with Morse:', morseFromTapper);
            handleMorseProcessing(morseFromTapper);
        } else {
            // console.warn('BookCipher: Received visualTapperCharacterComplete event without morseString in detail.');
        }
    });

    // Initial state for Morse IO: disabled until a book is successfully loaded
    if(bookCipherMorseIO) bookCipherMorseIO.disabled = true;

});
