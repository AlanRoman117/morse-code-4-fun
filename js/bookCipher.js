document.addEventListener('DOMContentLoaded', () => {
    const bookCipherBooks = {
        'passage_1': { title: 'Sherlock Holmes Snippet', filePath: 'assets/book_cipher_texts/passage1_morse.txt' },
        'mystery_intro': { title: 'Stormy Night Mystery', filePath: 'assets/book_cipher_texts/mystery_intro_morse.txt' },
        'sci_fi_quote': { title: 'Sci-Fi Classic Quote', filePath: 'assets/book_cipher_texts/sci_fi_quote_morse.txt' },
        'empty_book': { title: 'Empty Book Test', filePath: 'assets/book_cipher_texts/empty_morse.txt' },
        'short_book': { title: 'Short Book Test', filePath: 'assets/book_cipher_texts/very_short_morse.txt' },
        'long_book': { title: 'Long Book Test', filePath: 'assets/book_cipher_texts/long_passage_morse.txt' }
    };

    let currentTargetText = '';
    let currentCharacterIndex = 0;
    let revealedCharacters = [];
    let currentBookId = null; // Added for saving progress

    const bookSelectionDropdown = document.getElementById('book-selection');
    const startBookButton = document.getElementById('start-book-btn');
    const targetTextDisplay = document.getElementById('target-text-display');
    const unlockedTextDisplay = document.getElementById('unlocked-text-display');
    const currentDecodedCharDisplay = document.getElementById('current-decoded-char');
    const bookCipherMorseIO = document.getElementById('book-cipher-morse-io');
    const bookCipherMessageEl = document.getElementById('book-cipher-message'); // Added

    function displayTargetText() {
        if (!targetTextDisplay) return;
        targetTextDisplay.textContent = revealedCharacters.join('');
    }

    // Function to save progress
    function saveProgress(bookId, isCompletedFlag = false) {
        if (!bookId) {
            console.error("saveProgress: bookId is missing.");
            return;
        }
        if (typeof currentCharacterIndex === 'undefined' || !unlockedTextDisplay || typeof revealedCharacters === 'undefined') {
            console.error("saveProgress: One or more global variables needed for saving are not available.");
            return;
        }

        const progress = {
            bookId: bookId,
            currentCharacterIndex: currentCharacterIndex,
            unlockedText: unlockedTextDisplay.textContent,
            revealedCharacters: revealedCharacters,
            isCompleted: isCompletedFlag
        };

        try {
            localStorage.setItem(`bookCipherProgress_${bookId}`, JSON.stringify(progress));
            // console.log(`Progress saved for ${bookId}:`, progress);
        } catch (error) {
            console.error(`Error saving progress for ${bookId}:`, error);
        }
    }

    // Function to load progress
    function loadProgress(bookId) {
        if (!bookId) {
            console.error("loadProgress: bookId is missing.");
            return false;
        }

        try {
            const savedProgressString = localStorage.getItem(`bookCipherProgress_${bookId}`);
            if (savedProgressString) {
                const savedProgress = JSON.parse(savedProgressString);

                // Restore game state
                currentCharacterIndex = savedProgress.currentCharacterIndex;
                unlockedTextDisplay.textContent = savedProgress.unlockedText;
                revealedCharacters = savedProgress.revealedCharacters;

                displayTargetText(); // Update the obscured text display

                if (savedProgress.isCompleted) {
                    // Handle game completion UI
                    currentDecodedCharDisplay.textContent = '✓';
                    alert("This book is already completed! You can review it or choose another book.");
                    if (bookCipherMorseIO) bookCipherMorseIO.disabled = true;
                } else {
                    currentDecodedCharDisplay.textContent = '-'; // Reset for ongoing game
                    if (bookCipherMorseIO) bookCipherMorseIO.disabled = false;
                }

                // console.log(`Progress loaded for ${bookId}:`, savedProgress);
                return true;
            }
            return false; // No progress found
        } catch (error) {
            console.error(`Error loading progress for ${bookId}:`, error);
            return false; // Error during loading or parsing
        }
    }

    if (startBookButton) {
        startBookButton.addEventListener('click', () => {
            if (bookCipherMessageEl) bookCipherMessageEl.textContent = ''; // Clear previous messages
            startBookButton.disabled = true; // Disable button

            if (!bookSelectionDropdown || !targetTextDisplay || !unlockedTextDisplay || !currentDecodedCharDisplay) {
                console.error("A required DOM element is missing for the book cipher.");
                if (bookCipherMessageEl) {
                    bookCipherMessageEl.textContent = "Error: A required UI element is missing. Please refresh the page.";
                    setTimeout(() => { if (bookCipherMessageEl) bookCipherMessageEl.textContent = ''; }, 3000);
                } else {
                    alert("Error: A required UI element is missing. Please refresh the page.");
                }
                startBookButton.disabled = false; // Re-enable button
                return;
            }

            const selectedBookKey = bookSelectionDropdown.value;

            if (!selectedBookKey || selectedBookKey === "Choose a book") {
                if (bookCipherMessageEl) {
                    bookCipherMessageEl.textContent = "Please select a book to start.";
                    setTimeout(() => { if (bookCipherMessageEl) bookCipherMessageEl.textContent = ''; }, 3000);
                } else {
                    alert("Please select a book to start.");
                }
                startBookButton.disabled = false; // Re-enable button
                return;
            }

            const bookData = bookCipherBooks[selectedBookKey];

            if (!bookData || !bookData.filePath) {
                if (bookCipherMessageEl) {
                    bookCipherMessageEl.textContent = "Selected book definition is missing or has no file path. Please choose another.";
                    setTimeout(() => { if (bookCipherMessageEl) bookCipherMessageEl.textContent = ''; }, 3000);
                } else {
                    alert("Selected book definition is missing or has no file path. Please choose another.");
                }
                console.error("Selected book key:", selectedBookKey, "Book data:", bookData);
                targetTextDisplay.textContent = "Error: Book details incomplete."; // This could also use the messageEl
                startBookButton.disabled = false; // Re-enable button
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
                    currentTargetText = text.trim().toUpperCase();
                    currentBookId = selectedBookKey; // Set currentBookId once book key is known and fetch initiated
                    startBookButton.disabled = false; // Re-enable button

                    if (currentTargetText.length === 0) {
                        // Handle empty book scenario
                        console.warn(`Fetched text for ${bookData.filePath} is empty.`);
                        targetTextDisplay.textContent = "Book is empty.";
                        revealedCharacters = [];
                        unlockedTextDisplay.textContent = '';
                        currentDecodedCharDisplay.textContent = '-';
                        currentCharacterIndex = 0;
                        if (bookCipherMorseIO) bookCipherMorseIO.disabled = true;
                        // No progress to load for an empty book.
                        console.log(`Book is empty: ${bookData.title}`);
                        return; // Exit early
                    }

                    // Attempt to load progress for non-empty book
                    if (loadProgress(currentBookId)) {
                        console.log(`Progress loaded for book: ${currentBookId} - ${bookData.title}`);
                        // UI state (including Morse IO disabled/enabled) is handled by loadProgress
                    } else {
                        // No progress found or error loading, initialize for a fresh start
                        console.log(`No progress found for ${currentBookId} (${bookData.title}), starting fresh.`);
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
                        if (bookCipherMorseIO) bookCipherMorseIO.disabled = false; // Enable Morse input for fresh start
                    }

                    // Unified logging for when a book (empty or not, loaded or fresh) is processed
                    console.log(`Book ready: ${bookData.title} (Text length: ${currentTargetText.length}, Loaded from save: ${!!localStorage.getItem('bookCipherProgress_'+currentBookId) && revealedCharacters.length > 0 })`);
                })
                .catch(error => {
                    console.error('Error fetching book content:', error);
                    targetTextDisplay.textContent = `Error: Could not load '${bookData.title}'. File not found or unreadable.`;
                    currentTargetText = '';
                    revealedCharacters = [];
                    unlockedTextDisplay.textContent = '';
                    currentDecodedCharDisplay.textContent = '-';
                    if(bookCipherMorseIO) bookCipherMorseIO.disabled = true;
                    currentBookId = selectedBookKey; // Ensure currentBookId is set even on fetch error for context
                    startBookButton.disabled = false; // Re-enable button
                });
            // -- FETCH LOGIC END --
        });
    } else {
        console.error("Start button not found for book cipher.");
    }

    function handleMorseProcessing(morseString) {
        // Check if a book is loaded and the Morse IO is enabled (proxy for game active)
        if (!currentTargetText || (bookCipherMorseIO && bookCipherMorseIO.disabled)) {
            // console.log("Book Cipher: Morse processing ignored, no active game or input disabled.");
            // Optionally clear currentDecodedCharDisplay if it shouldn't show anything
            // if(currentDecodedCharDisplay) currentDecodedCharDisplay.textContent = '-';
            return;
        }

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
                    saveProgress(currentBookId, true); // Save progress on completion
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
                saveProgress(currentBookId); // Save progress after correct decipher

                if (currentCharacterIndex >= currentTargetText.length && !revealedCharacters.includes('_')) {
                    saveProgress(currentBookId, true); // Save progress on completion
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
