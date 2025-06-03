document.addEventListener('DOMContentLoaded', () => {
    const bookCipherBooks = {
        'passage_1': { title: 'Sherlock Holmes Snippet', filePath: 'assets/book_cipher_texts/passage1_morse.txt' },
        'mystery_intro': { title: 'Stormy Night Mystery', filePath: 'assets/book_cipher_texts/mystery_intro_morse.txt' },
        'sci_fi_quote': { title: 'Sci-Fi Classic Quote', filePath: 'assets/book_cipher_texts/sci_fi_quote_morse.txt' },
        'empty_book': { title: 'Empty Book Test', filePath: 'assets/book_cipher_texts/empty_morse.txt' },
        'short_book': { title: 'Short Book Test', filePath: 'assets/book_cipher_texts/very_short_morse.txt' },
        'long_book': { title: 'Long Book Test', filePath: 'assets/book_cipher_texts/long_passage_morse.txt' }
    };

    let currentTargetText = ''; // This will likely be deprecated or repurposed for the original English text
    let currentCharacterIndex = 0; // This might be repurposed for character index within the English text if needed later
    let revealedCharacters = []; // This will likely be deprecated or repurposed

    let currentBookId = null; // Added for saving progress

    // New global variables for Morse-based book cipher
    let currentBookMorseContent = '';
    let currentMorseSegment = '';
    let currentMorseLetterIndex = 0; // To track the current letter in the segment

    const bookSelectionDropdown = document.getElementById('book-selection');
    const startBookButton = document.getElementById('start-book-btn');
    if (startBookButton) {
        startBookButton.disabled = true; // Disable button initially
    }
    const targetTextDisplay = document.getElementById('target-text-display');
    const unlockedTextDisplay = document.getElementById('unlocked-text-display');
    const currentDecodedCharDisplay = document.getElementById('current-decoded-char');
    const bookCipherMorseIO = document.getElementById('book-cipher-morse-io');
    const bookCipherMessageEl = document.getElementById('book-cipher-message'); // Added

    // Function to populate the book library display
    function populateBookLibrary() {
        const libraryContainer = document.getElementById('book-library-container');
        if (!libraryContainer) {
            console.error("Book library container 'book-library-container' not found.");
            return;
        }

        libraryContainer.innerHTML = ''; // Clear existing content

        if (!bookCipherBooks || Object.keys(bookCipherBooks).length === 0) {
            console.warn("bookCipherBooks object is empty or not defined. Cannot populate library.");
            libraryContainer.textContent = 'No books available.'; // Display a message
            return;
        }

        for (const bookKey in bookCipherBooks) {
            if (bookCipherBooks.hasOwnProperty(bookKey)) {
                const book = bookCipherBooks[bookKey];
                const bookElement = document.createElement('div');
                bookElement.textContent = book.title;
                bookElement.classList.add('book-cover-item'); // Add a common class for styling
                bookElement.setAttribute('data-book-id', bookKey); // Store book key for identification

                bookElement.addEventListener('click', () => {
                    currentBookId = bookElement.getAttribute('data-book-id');

                    // Manage visual selection
                    const allBookItems = libraryContainer.querySelectorAll('.book-cover-item');
                    allBookItems.forEach(item => {
                        item.classList.remove('book-cover-selected');
                    });
                    bookElement.classList.add('book-cover-selected');

                    // Enable the start button
                    if (startBookButton) {
                        startBookButton.disabled = false;
                    }
                    if (bookCipherMessageEl) bookCipherMessageEl.textContent = ''; // Clear any "select a book" message
                    console.log("Book selected:", currentBookId);
                });

                libraryContainer.appendChild(bookElement);
            }
        }
    }


    function displayTargetText() {
        if (!targetTextDisplay) return;
        targetTextDisplay.textContent = revealedCharacters.join('');
    }

    // Function to save progress
    function saveProgress(bookId, isCompletedFlag = false) {
        console.warn("Book Cipher: saveProgress is temporarily neutralized for Morse segment update. No progress will be saved at this stage.");
        return;
        // Original saveProgress logic below for reference, currently unreachable:
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

            if (!currentBookId) {
                if (bookCipherMessageEl) {
                    bookCipherMessageEl.textContent = "Please select a book from the library to start.";
                    setTimeout(() => { if (bookCipherMessageEl) bookCipherMessageEl.textContent = ''; }, 3000);
                } else {
                    alert("Please select a book from the library to start.");
                }
                // Keep startBookButton disabled if no book is selected. It's likely already disabled.
                // If it could somehow be enabled without a selection, explicitly disable it:
                // startBookButton.disabled = true;
                return;
            }

            startBookButton.disabled = true; // Disable button once a valid book is chosen and we proceed

            // Check for essential display elements (excluding bookSelectionDropdown)
            if (!targetTextDisplay || !unlockedTextDisplay || !currentDecodedCharDisplay) {
                console.error("A required DOM element for book cipher (display areas) is missing.");
                if (bookCipherMessageEl) {
                    bookCipherMessageEl.textContent = "Error: Essential display elements are missing. Please refresh.";
                    setTimeout(() => { if (bookCipherMessageEl) bookCipherMessageEl.textContent = ''; }, 3000);
                } else {
                    alert("Error: Essential display elements are missing. Please refresh.");
                }
                startBookButton.disabled = false; // Re-enable on error
                return;
            }

            const bookData = bookCipherBooks[currentBookId]; // Use currentBookId

            if (!bookData || !bookData.filePath) {
                if (bookCipherMessageEl) {
                    bookCipherMessageEl.textContent = "Selected book data is invalid or missing a file path.";
                    setTimeout(() => { if (bookCipherMessageEl) bookCipherMessageEl.textContent = ''; }, 3000);
                } else {
                    alert("Selected book data is invalid or missing a file path.");
                }
                console.error("Current book ID:", currentBookId, "Book data:", bookData);
                targetTextDisplay.textContent = "Error: Book details incomplete.";
                startBookButton.disabled = false; // Re-enable on error
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
                    currentBookMorseContent = text.trim(); // Store fetched Morse content, preserving case

                    if (currentBookMorseContent.length === 0) {
                        // Handle empty book scenario
                        targetTextDisplay.textContent = "Book is empty.";
                        unlockedTextDisplay.textContent = '';
                        currentDecodedCharDisplay.textContent = '-';
                        currentMorseSegment = '';
                        currentMorseLetterIndex = 0;
                        if (bookCipherMorseIO) bookCipherMorseIO.disabled = true;
                        console.log(`Book is empty: ${bookData.title}`);
                        startBookButton.disabled = false; // Re-enable start button
                        return; // Exit early
                    }

                    // Process Non-Empty Book Content
                    const segmentLength = 40; // Define segment length
                    currentMorseSegment = currentBookMorseContent.substring(0, segmentLength);
                    targetTextDisplay.textContent = currentMorseSegment; // Display the Morse segment

                    unlockedTextDisplay.textContent = ''; // Clear unlocked text
                    currentMorseLetterIndex = 0; // Initialize position in the Morse segment
                    // currentDecodedCharDisplay.textContent = '-'; // This will be set by the new logic below

                    // Display the first Morse letter of the segment
                    if (currentMorseSegment && currentMorseSegment.length > 0) {
                        let firstMorseLetter = '';
                        for (let i = 0; i < currentMorseSegment.length; i++) {
                            if (currentMorseSegment[i] === ' ') {
                                break; // Stop at the first space
                            }
                            firstMorseLetter += currentMorseSegment[i];
                        }

                        if (firstMorseLetter.length > 0) {
                            currentDecodedCharDisplay.textContent = firstMorseLetter;
                        } else {
                            currentDecodedCharDisplay.textContent = '-'; // Segment might be spaces or empty
                        }
                    } else {
                        currentDecodedCharDisplay.textContent = '-';
                    }

                    if (bookCipherMorseIO) bookCipherMorseIO.disabled = false; // Enable Morse IO for interaction

                    // Temporarily comment out progress logic
                    /*
                    if (loadProgress(currentBookId)) {
                        console.log(`Progress loaded for book: ${currentBookId} - ${bookData.title}`);
                        // UI state (including Morse IO disabled/enabled) is handled by loadProgress
                    } else {
                        // No progress found or error loading, initialize for a fresh start
                        console.log(`No progress found for ${currentBookId} (${bookData.title}), starting fresh.`);
                        // The old logic based on currentTargetText, revealedCharacters etc. is not directly applicable here.
                        // We are now displaying a segment of Morse code.
                        // The old logic for `revealedCharacters` and `displayTargetText()` might need rethinking
                        // if we want to show an obscured version of the *entire* Morse book.
                        // For now, we just display the current segment.

                        // Old initialization (commented out as it might not be relevant for Morse segment display)
                        // currentCharacterIndex = 0;
                        // revealedCharacters = [];
                        // for (let i = 0; i < currentTargetText.length; i++) {
                        //     if (currentTargetText[i] === ' ') {
                        //         revealedCharacters.push(' ');
                        //     } else {
                        //         revealedCharacters.push('_');
                        //     }
                        // }
                        // displayTargetText(); // Display the initially obscured text
                        // unlockedTextDisplay.textContent = ''; // Clear any previous unlocked text
                        // currentDecodedCharDisplay.textContent = '-'; // Reset current decoded char display
                        // if (bookCipherMorseIO) bookCipherMorseIO.disabled = false; // Enable Morse input for fresh start
                    }
                    */

                    console.log(`Book ready: ${bookData.title}. Morse segment displayed.`);
                    startBookButton.disabled = false; // Re-enable the start button
                })
                .catch(error => {
                    console.error('Error fetching book content:', error);
                    targetTextDisplay.textContent = `Error: Could not load '${bookData.title}'. File not found or unreadable.`;
                    // Reset relevant global variables on error
                    currentBookMorseContent = '';
                    currentMorseSegment = '';
                    currentMorseLetterIndex = 0;
                    unlockedTextDisplay.textContent = '';
                    currentDecodedCharDisplay.textContent = '-';
                    if(bookCipherMorseIO) bookCipherMorseIO.disabled = true;
                    startBookButton.disabled = false; // Re-enable button on error
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
        console.log("Book Cipher: handleMorseProcessing received Morse:", morseString, "Decoded as:", decodedString);

        if (decodedString && decodedString.length > 0) {
            let lastChar = decodedString.charAt(decodedString.length - 1).toUpperCase();
            currentDecodedCharDisplay.textContent = lastChar;

            // The rest of the original game logic is commented out for now.
            /*
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
            */
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

    // Populate the book library on DOMContentLoaded
    populateBookLibrary();
});
