document.addEventListener('DOMContentLoaded', () => {
    const bookCipherBooks = {
        'passage_1': { title: 'Sherlock Holmes Snippet', filePath: 'assets/book_cipher_texts/passage1_morse.txt' },
        'mystery_intro': { title: 'Stormy Night Mystery', filePath: 'assets/book_cipher_texts/mystery_intro_morse.txt' },
        'sci_fi_quote': { title: 'Sci-Fi Classic Quote', filePath: 'assets/book_cipher_texts/sci_fi_quote_morse.txt' },
        'empty_book': { title: 'Empty Book Test', filePath: 'assets/book_cipher_texts/empty_morse.txt' },
        'short_book': { title: 'Short Book Test', filePath: 'assets/book_cipher_texts/very_short_morse.txt' },
        'long_book': { title: 'Long Book Test', filePath: 'assets/book_cipher_texts/long_passage_morse.txt' }
    };

    let currentBookId = null; // Added for saving progress

    // New global variables for Morse-based book cipher
    let currentBookMorseContent = '';
    let currentMorseSegment = '';
    // let currentMorseLetterIndex = 0; // To track the current letter in the segment - Considered obsolete
    let fullMorseSequence = []; // Stores all Morse letters and '/' for spaces
    let currentSequenceIndex = 0; // Index for the current item in fullMorseSequence
    let currentTargetMorseLetter = ''; // Stores the actual target Morse string, e.g., ".-"

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

                    // const segmentLength = 40; // Keep if currentMorseSegment display is maintained
                    // currentMorseSegment = currentBookMorseContent.substring(0, segmentLength); // Keep if display maintained
                    // if (targetTextDisplay) targetTextDisplay.textContent = currentMorseSegment; // Keep if display maintained

                    if (currentBookMorseContent.length === 0) {
                        // Handle empty book scenario
                        targetTextDisplay.textContent = "Book is empty.";
                        unlockedTextDisplay.textContent = '';
                        currentDecodedCharDisplay.textContent = '-';
                        // currentMorseSegment = ''; // Already handled or not part of new core logic for empty
                        // currentMorseLetterIndex = 0; // Already handled or not part of new core logic for empty
                        if (bookCipherMorseIO) bookCipherMorseIO.disabled = true;
                        console.log(`Book is empty: ${bookData.title}`);
                        startBookButton.disabled = false; // Re-enable start button
                        fullMorseSequence = []; // Ensure sequence is empty
                        currentTargetMorseLetter = '';
                        return; // Exit early
                    }

                    // Process Non-Empty Book Content (after empty file check)
                    const segmentLength = 40; // Define segment length
                    currentMorseSegment = currentBookMorseContent.substring(0, segmentLength);
                    if (targetTextDisplay) targetTextDisplay.textContent = currentMorseSegment; // Display the Morse segment


                    fullMorseSequence = currentBookMorseContent.trim().split(' ').filter(s => s.length > 0);
                    // This filter correctly includes '/' if present, as its length is 1.
                    // E.g., ".- / -..." -> [".-", "/", "-..."]

                    currentSequenceIndex = 0;
                    currentTargetMorseLetter = '';
                    if (unlockedTextDisplay) unlockedTextDisplay.textContent = ''; // Clear unlocked text for a new book

                    if (fullMorseSequence.length > 0) {
                        const initialTargetSet = setNextTargetMorseLetter(); // Display the first target (or handle leading '/')
                        if (initialTargetSet) { // Only enable if a target was actually set
                           if (bookCipherMorseIO) bookCipherMorseIO.disabled = false; // Enable Morse IO
                        } else {
                           // No initial target could be set (e.g., book was only '/'s which are consumed)
                           // setNextTargetMorseLetter would have already marked completion/disabled IO.
                           console.log(`Book content resulted in no initial targetable Morse letter: ${currentBookId}`);
                        }
                    } else {
                        // Book is empty or contains only spaces (which are trimmed, or split then filtered out)
                        if (targetTextDisplay) targetTextDisplay.textContent = "Book is empty or contains only spaces.";
                        if (unlockedTextDisplay) unlockedTextDisplay.textContent = '';
                        if (currentDecodedCharDisplay) currentDecodedCharDisplay.textContent = '-';
                        if (bookCipherMorseIO) bookCipherMorseIO.disabled = true;
                        console.log(`Book has no valid Morse signals after parsing: ${currentBookId}`);
                    }

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

    function setNextTargetMorseLetter() {
        const currentDecodedCharDisplay = document.getElementById('current-decoded-char');
        const unlockedTextDisplay = document.getElementById('unlocked-text-display');
        const bookCipherMorseIO = document.getElementById('book-cipher-morse-io'); // Used for enabling/disabling
        const bookCipherMessageEl = document.getElementById('book-cipher-message'); // For messages

        if (currentSequenceIndex >= fullMorseSequence.length) {
            console.log("End of book reached.");
            if (currentDecodedCharDisplay) currentDecodedCharDisplay.textContent = '✓'; // Completion mark
            if (bookCipherMessageEl) bookCipherMessageEl.textContent = "Book finished!";
            if (bookCipherMorseIO) bookCipherMorseIO.disabled = true; // Disable input
            currentTargetMorseLetter = ''; // Clear target
            return false; // Indicate no more targets
        }

        let nextSignal = fullMorseSequence[currentSequenceIndex];

        if (nextSignal === '/') {
            if (unlockedTextDisplay) {
                // Add a space if the unlocked text is empty or doesn't already end with a space.
                if (unlockedTextDisplay.textContent.length === 0 || !unlockedTextDisplay.textContent.endsWith(' ')) {
                    unlockedTextDisplay.textContent += ' ';
                }
            }
            currentSequenceIndex++; // Consume the '/'
            return setNextTargetMorseLetter(); // Recursively call to find the next actual Morse letter or end
        } else {
            // It's a Morse letter
            currentTargetMorseLetter = nextSignal;
            if (currentDecodedCharDisplay) currentDecodedCharDisplay.textContent = currentTargetMorseLetter;
            return true; // Indicate a target is set
        }
    }

    function handleBookCipherInput(userTappedMorse) {
        const currentDecodedCharDisplay = document.getElementById('current-decoded-char');
        const unlockedTextDisplay = document.getElementById('unlocked-text-display');
        const bookCipherMessageEl = document.getElementById('book-cipher-message');
        const bookCipherMorseIO = document.getElementById('book-cipher-morse-io'); // To check if disabled

        // Ignore input if the game is effectively over or not started
        if (!currentTargetMorseLetter || (bookCipherMorseIO && bookCipherMorseIO.disabled)) {
            console.log("handleBookCipherInput: Input ignored, no current target or IO is disabled.");
            return;
        }

        if (!userTappedMorse || userTappedMorse.trim() === '') {
            console.log("handleBookCipherInput: Empty Morse input received.");
            if (bookCipherMessageEl) bookCipherMessageEl.textContent = "No Morse input detected.";
            // Optional: Visual feedback for empty input if desired
            return;
        }

        // Ensure reversedMorseCode is available (defined in index.html)
        if (typeof reversedMorseCode === 'undefined' && typeof morseToText === 'undefined') {
            console.error("reversedMorseCode or morseToText is not available.");
            if (bookCipherMessageEl) bookCipherMessageEl.textContent = "Error: Decoding library missing.";
            return;
        }

        // Normalize user input if necessary (e.g. trim)
        const cleanedUserMorse = userTappedMorse.trim();

        if (cleanedUserMorse === currentTargetMorseLetter) {
            // --- MATCH ---
            let englishChar = '';
            if (typeof morseToText === 'function') {
                englishChar = morseToText(currentTargetMorseLetter);
            } else { // Fallback to reversedMorseCode directly
                englishChar = reversedMorseCode[currentTargetMorseLetter];
            }

            if (englishChar && unlockedTextDisplay) {
                unlockedTextDisplay.textContent += englishChar;
            } else if (!englishChar) {
                console.warn(`No English equivalent found for Morse: ${currentTargetMorseLetter}`);
                // Decide how to handle this: maybe append the Morse itself or a placeholder?
                // For now, we do nothing if no char is found, which is unlikely for valid targets.
            }

            // Positive visual feedback
            if (currentDecodedCharDisplay) {
                const originalColor = currentDecodedCharDisplay.style.backgroundColor;
                currentDecodedCharDisplay.style.backgroundColor = 'rgba(0, 255, 0, 0.3)'; // Light green
                setTimeout(() => {
                    if (currentDecodedCharDisplay) currentDecodedCharDisplay.style.backgroundColor = originalColor || '';
                }, 300);
            }
            if (bookCipherMessageEl) bookCipherMessageEl.textContent = 'Correct!';
            setTimeout(() => {
                 if (bookCipherMessageEl && bookCipherMessageEl.textContent === 'Correct!') bookCipherMessageEl.textContent = '';
            }, 1000);


            currentSequenceIndex++; // Advance to the next signal in the sequence
            setNextTargetMorseLetter(); // Set up the next target or end the game

        } else {
            // --- MISMATCH ---
            if (bookCipherMessageEl) bookCipherMessageEl.textContent = 'Incorrect. Try again.';

            // Negative visual feedback
            if (currentDecodedCharDisplay) {
                const originalColor = currentDecodedCharDisplay.style.backgroundColor;
                currentDecodedCharDisplay.style.backgroundColor = 'rgba(255, 0, 0, 0.3)'; // Light red
                setTimeout(() => {
                    if (currentDecodedCharDisplay) currentDecodedCharDisplay.style.backgroundColor = originalColor || '';
                }, 500);
            }
            // Do not advance currentSequenceIndex. User needs to retry.
            // The tapper should reset itself for the next input attempt.
        }
    }

    // Obsolete function - removed
    // function handleMorseProcessing(morseString) { ... }

    document.addEventListener('visualTapperCharacterComplete', (event) => {
        if (event.detail && typeof event.detail.morseString === 'string') {
            const morseFromTapper = event.detail.morseString;
            // console.log('BookCipher: Received visualTapperCharacterComplete with Morse:', morseFromTapper);
            handleBookCipherInput(morseFromTapper); // NEW CALL
        } else {
            // console.warn('BookCipher: Received visualTapperCharacterComplete event without morseString in detail.');
        }
    });

    // Initial state for Morse IO: disabled until a book is successfully loaded
    if(bookCipherMorseIO) bookCipherMorseIO.disabled = true;

    // Populate the book library on DOMContentLoaded
    populateBookLibrary();
});
