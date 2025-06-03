document.addEventListener('DOMContentLoaded', () => {
    const bookCipherBooks = {
        'passage_1': { title: 'Sherlock Holmes Snippet', filePath: 'assets/book_cipher_texts/passage1_morse.txt', author: "Placeholder Author", description: "This is a placeholder description for the book. It can be a bit longer to see how it might look in the details view." },
        'mystery_intro': { title: 'Stormy Night Mystery', filePath: 'assets/book_cipher_texts/mystery_intro_morse.txt', author: "Placeholder Author", description: "This is a placeholder description for the book. It can be a bit longer to see how it might look in the details view." },
        'sci_fi_quote': { title: 'Sci-Fi Classic Quote', filePath: 'assets/book_cipher_texts/sci_fi_quote_morse.txt', author: "Placeholder Author", description: "This is a placeholder description for the book. It can be a bit longer to see how it might look in the details view." },
        'empty_book': { title: 'Empty Book Test', filePath: 'assets/book_cipher_texts/empty_morse.txt', author: "Placeholder Author", description: "This is a placeholder description for the book. It can be a bit longer to see how it might look in the details view." },
        'short_book': { title: 'Short Book Test', filePath: 'assets/book_cipher_texts/very_short_morse.txt', author: "Placeholder Author", description: "This is a placeholder description for the book. It can be a bit longer to see how it might look in the details view." },
        'long_book': { title: 'Long Book Test', filePath: 'assets/book_cipher_texts/long_passage_morse.txt', author: "Placeholder Author", description: "This is a placeholder description for the book. It can be a bit longer to see how it might look in the details view." }
    };

    let currentBookId = null; // Added for saving progress
    let isBookCompleted = false; // Flag for book completion status

    // New global variables for Morse-based book cipher
    const MORSE_SEGMENT_LENGTH = 40; // Define segment length for display
    let currentBookMorseContent = '';
    let currentMorseSegment = '';
    let currentSegmentStartIndex = 0; // To track the start of the current visible Morse segment
    // let currentMorseLetterIndex = 0; // To track the current letter in the segment - Considered obsolete
    let fullMorseSequence = []; // Stores all Morse letters and '/' for spaces
    let currentSequenceIndex = 0; // Index for the current item in fullMorseSequence
    let currentTargetMorseLetter = ''; // Stores the actual target Morse string, e.g., ".-"

    const bookSelectionDropdown = document.getElementById('book-selection');
    // const startBookButton = document.getElementById('start-book-btn'); // Old button reference, removed
    const targetTextDisplay = document.getElementById('target-text-display');
    const unlockedTextDisplay = document.getElementById('unlocked-text-display');
    const currentDecodedCharDisplay = document.getElementById('current-decoded-char');
    const bookCipherMorseIO = document.getElementById('book-cipher-morse-io');
    const bookCipherMessageEl = document.getElementById('book-cipher-message'); // Added

    // --- View Switching Functions ---
    function showBookLibraryView() {
        const libraryView = document.getElementById('book-library-view');
        const detailsView = document.getElementById('book-details-view');
        const gameView = document.getElementById('book-game-view');

        if (libraryView) libraryView.classList.remove('hidden');
        if (detailsView) detailsView.classList.add('hidden');
        if (gameView) gameView.classList.add('hidden');

        // Reset selected book item visual state when going back to library
        const allBookItems = document.querySelectorAll('#book-library-container .book-cover-item');
        allBookItems.forEach(item => {
            item.classList.remove('book-cover-selected');
        });
        currentBookId = null; // Deselect book
        if (bookCipherMessageEl) bookCipherMessageEl.textContent = 'Select a book from the library.';
    }

    function showBookDetailsView() {
        const libraryView = document.getElementById('book-library-view');
        const detailsView = document.getElementById('book-details-view');
        const gameView = document.getElementById('book-game-view');

        if (libraryView) libraryView.classList.add('hidden');
        if (detailsView) detailsView.classList.remove('hidden');
        if (gameView) gameView.classList.add('hidden');
    }

    function showGameView() {
        const libraryView = document.getElementById('book-library-view');
        const detailsView = document.getElementById('book-details-view');
        const gameView = document.getElementById('book-game-view');

        if (libraryView) libraryView.classList.add('hidden');
        if (detailsView) detailsView.classList.add('hidden');
        if (gameView) gameView.classList.remove('hidden');
    }
    // --- End View Switching Functions ---

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
                bookElement.classList.add('book-cover-item');
                bookElement.setAttribute('data-book-id', bookKey);

                bookElement.addEventListener('click', () => {
                    currentBookId = bookElement.getAttribute('data-book-id');
                     // Visually mark selected book in library
                    const allBookItems = libraryContainer.querySelectorAll('.book-cover-item');
                    allBookItems.forEach(item => {
                        item.classList.remove('book-cover-selected');
                    });
                    bookElement.classList.add('book-cover-selected');

                    if (bookCipherMessageEl) bookCipherMessageEl.textContent = '';
                    console.log("Book selected for details view:", currentBookId);

                    const detailsView = document.getElementById('book-details-view');
                    if (!detailsView) {
                        console.error("Book details view container 'book-details-view' not found.");
                        return;
                    }
                    detailsView.innerHTML = ''; // Clear previous details

                    const bookData = bookCipherBooks[currentBookId];
                    if (!bookData) {
                        console.error("Could not find data for bookId:", currentBookId);
                        detailsView.textContent = 'Error: Book data not found.';
                        showBookDetailsView();
                        return;
                    }

                    const titleEl = document.createElement('h2');
                    titleEl.textContent = bookData.title;
                    titleEl.className = 'text-2xl font-bold mb-2 text-center text-white';
                    detailsView.appendChild(titleEl);

                    const authorEl = document.createElement('p');
                    authorEl.textContent = `Author: ${bookData.author}`;
                    authorEl.className = 'text-md text-gray-400 mb-1 text-center';
                    detailsView.appendChild(authorEl);

                    const coverPlaceholder = document.createElement('div');
                    coverPlaceholder.className = 'w-full h-48 bg-gray-700 flex items-center justify-center text-gray-500 my-4 rounded-md shadow-inner';
                    coverPlaceholder.textContent = 'Book Cover Placeholder';
                    detailsView.appendChild(coverPlaceholder);

                    const descriptionEl = document.createElement('p');
                    descriptionEl.textContent = bookData.description;
                    descriptionEl.className = 'text-sm text-gray-300 mb-6 text-center leading-relaxed';
                    detailsView.appendChild(descriptionEl);

                    const buttonContainer = document.createElement('div');
                    buttonContainer.className = 'flex flex-col items-center space-y-3';

                    const startDecipheringBtn = document.createElement('button');
                    startDecipheringBtn.id = 'start-deciphering-btn';
                    startDecipheringBtn.textContent = 'Start Deciphering';
                    startDecipheringBtn.className = 'w-full max-w-xs px-6 py-3 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold rounded-lg shadow-md transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500';
                    buttonContainer.appendChild(startDecipheringBtn);

                    startDecipheringBtn.addEventListener('click', () => {
                        initializeAndStartBookGame(currentBookId);
                    });

                    const backToLibraryBtn = document.createElement('button');
                    backToLibraryBtn.id = 'back-to-library-btn';
                    backToLibraryBtn.textContent = 'Back to Library';
                    backToLibraryBtn.className = 'w-full max-w-xs px-6 py-3 bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-white font-semibold rounded-lg shadow-md transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500';
                    buttonContainer.appendChild(backToLibraryBtn);

                    detailsView.appendChild(buttonContainer);

                    document.getElementById('back-to-library-btn').addEventListener('click', () => {
                        showBookLibraryView();
                    });

                    showBookDetailsView();
                });

                libraryContainer.appendChild(bookElement);
            }
        }
    }

    // Function to save progress
    function saveProgress(bookIdToSave, completedStatus) { // Renamed params to avoid conflict with globals
        const unlockedTextDisplay = document.getElementById('unlocked-text-display');

        if (!bookIdToSave) {
            console.error("saveProgress: bookIdToSave is missing.");
            return;
        }
        // currentSequenceIndex is global and should be up-to-date.
        // unlockedTextDisplay is accessed directly.
        // completedStatus is passed as a parameter.

        const progress = {
            bookId: bookIdToSave,
            currentSequenceIndex: currentSequenceIndex, // Current progress in Morse sequence
            unlockedText: unlockedTextDisplay ? unlockedTextDisplay.textContent : '', // Revealed English text
            isCompleted: completedStatus // Completion status
        };

        try {
            localStorage.setItem(`bookCipherProgress_${bookIdToSave}`, JSON.stringify(progress));
            // console.log(`Progress saved for ${bookIdToSave}: Index ${currentSequenceIndex}, Completed: ${completedStatus}`);
        } catch (error) {
            console.error(`Error saving progress for ${bookIdToSave}:`, error);
        }
    }

    // Function to load progress
    function loadProgress(bookIdToLoad) {
        const unlockedTextDisplay = document.getElementById('unlocked-text-display');
        const bookCipherMorseIO = document.getElementById('book-cipher-morse-io');
        const bookCipherMessageEl = document.getElementById('book-cipher-message');
        const currentDecodedCharDisplay = document.getElementById('current-decoded-char');


        if (!bookIdToLoad) {
            console.error("loadProgress: bookIdToLoad is missing.");
            return false;
        }

        try {
            const savedProgressString = localStorage.getItem(`bookCipherProgress_${bookIdToLoad}`);
            if (savedProgressString) {
                const savedProgress = JSON.parse(savedProgressString);

                if (savedProgress.bookId !== bookIdToLoad) {
                    // This case should ideally not happen if keys are managed well.
                    console.warn("loadProgress: Mismatch bookId in saved data. Ignoring.");
                    localStorage.removeItem(`bookCipherProgress_${bookIdToLoad}`); // Clean up bad data
                    return false;
                }

                // Restore game state from Morse-based progress
                unlockedTextDisplay.textContent = savedProgress.unlockedText || '';
                currentSequenceIndex = savedProgress.currentSequenceIndex || 0;
                isBookCompleted = savedProgress.isCompleted || false; // Restore completion flag

                console.log(`Progress loaded for ${bookIdToLoad}: Index ${currentSequenceIndex}, Completed: ${isBookCompleted}, Unlocked: "${savedProgress.unlockedText}"`);

                // Calculate currentSegmentStartIndex based on the loaded currentSequenceIndex
                if (currentSequenceIndex > 0 && fullMorseSequence && fullMorseSequence.length > 0) {
                    let charOffsetForSavedIndex = 0;
                    let processedSignals = fullMorseSequence.slice(0, currentSequenceIndex);
                    if (processedSignals.length > 0) {
                        let reconstructedProcessedStr = processedSignals.join(' ');
                        charOffsetForSavedIndex = reconstructedProcessedStr.length;
                        // Account for the space after the last processed signal, if it's not the very end of the book's signals
                        if (currentSequenceIndex < currentBookMorseContent.split(' ').filter(s => s.length > 0).length) {
                           charOffsetForSavedIndex++;
                        }
                    }
                    currentSegmentStartIndex = Math.floor(charOffsetForSavedIndex / MORSE_SEGMENT_LENGTH) * MORSE_SEGMENT_LENGTH;
                    if (currentSegmentStartIndex >= currentBookMorseContent.length) { // Boundary check
                        currentSegmentStartIndex = Math.max(0, currentBookMorseContent.length - MORSE_SEGMENT_LENGTH);
                    }

                } else {
                    currentSegmentStartIndex = 0; // Start from the beginning if no progress or at the very start
                }

                displayCurrentSegment(); // Display the correct segment based on calculated currentSegmentStartIndex

                if (isBookCompleted) {
                    if (bookCipherMessageEl) bookCipherMessageEl.textContent = "Book Complete!";
                    if (currentDecodedCharDisplay) currentDecodedCharDisplay.textContent = '✓';
                    if (bookCipherMorseIO) bookCipherMorseIO.disabled = true;
                    // No need to call setNextTargetMorseLetter if completed, as there's no next target.
                } else {
                    // If not completed, set the next target Morse letter.
                    // displayCurrentSegment would have shown the segment, now set the specific letter.
                    setNextTargetMorseLetter(); // This will set currentTargetMorseLetter based on new currentSequenceIndex
                    if (bookCipherMorseIO) bookCipherMorseIO.disabled = false; // Ensure input is enabled
                    if (bookCipherMessageEl) bookCipherMessageEl.textContent = ""; // Clear any previous messages
                }

                console.log(`Calculated currentSegmentStartIndex: ${currentSegmentStartIndex}`);
                return true; // Progress was successfully loaded
            }
            console.log(`No saved progress found for ${bookIdToLoad}.`);
            return false; // No progress found
        } catch (error) {
            console.error(`Error loading progress for ${bookIdToLoad}:`, error);
            return false; // Error during loading or parsing
        }
    }

    // Removing the old startBookButton variable and its event listener.
    // The new button 'start-deciphering-btn' will have its listener added later.
    // The variable `startBookButton` itself was already removed/commented out at the top.
    const oldStartBookButtonElement = document.getElementById('start-book-btn');
    if (oldStartBookButtonElement && oldStartBookButtonElement.parentElement) {
        // If the old button is still somehow in the DOM, remove it.
        // This is a safeguard; it should have been removed by HTML changes.
        // oldStartBookButtonElement.parentElement.removeChild(oldStartBookButtonElement);
        // console.log("Old start-book-btn HTML element explicitly removed if found.");
        // For now, we assume HTML changes handled its removal from the structure.
        // The JS variable `startBookButton` is already dealt with.
    }

    // This function encapsulates the logic previously in startBookButton's event listener
    function initializeAndStartBookGame(bookId) {
        if (bookCipherMessageEl) bookCipherMessageEl.textContent = '';

        if (!bookId) {
            console.error("initializeAndStartBookGame: No bookId provided.");
            if (bookCipherMessageEl) {
                bookCipherMessageEl.textContent = "Error: No book selected to start.";
            }
            showBookDetailsView(); // Stay or go back to details view if bookId is missing
            return;
        }

        // Ensure game view elements are present
        if (!targetTextDisplay || !unlockedTextDisplay || !currentDecodedCharDisplay || !bookCipherMorseIO) {
            console.error("A required DOM element for the game view is missing.");
            if (bookCipherMessageEl) {
                bookCipherMessageEl.textContent = "Error: Game display elements are missing. Please refresh.";
            }
            showBookDetailsView(); // Critical error, return to details view
            return;
        }

        const bookData = bookCipherBooks[bookId];

        if (!bookData || !bookData.filePath) {
            if (bookCipherMessageEl) {
                bookCipherMessageEl.textContent = "Selected book data is invalid or missing a file path.";
            }
            console.error("Book ID for game start:", bookId, "Book data:", bookData);
            if (targetTextDisplay) targetTextDisplay.textContent = "Error: Book details incomplete."; // Show error in game view
            showGameView(); // Show game view even with this error to display the message
            return;
        }

        showGameView(); // Switch to the game view first

        isBookCompleted = false;
        fetch(bookData.filePath)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}, file: ${bookData.filePath}`);
                }
                return response.text();
            })
            .then(text => {
                currentBookMorseContent = text.trim();
                currentSegmentStartIndex = 0;

                if (currentBookMorseContent.length === 0) {
                    targetTextDisplay.textContent = "Book is empty.";
                    unlockedTextDisplay.textContent = '';
                    currentDecodedCharDisplay.textContent = '-';
                    if (bookCipherMorseIO) bookCipherMorseIO.disabled = true;
                    console.log(`Book is empty: ${bookData.title}`);
                    fullMorseSequence = [];
                    currentTargetMorseLetter = '';
                    displayCurrentSegment();
                    // Game view will show "Book is empty."
                    return;
                }

                fullMorseSequence = currentBookMorseContent.trim().split(' ').filter(s => s.length > 0);

                if (unlockedTextDisplay) unlockedTextDisplay.textContent = '';
                isBookCompleted = false;
                currentSegmentStartIndex = 0;

                if (loadProgress(bookId)) {
                    console.log(`Progress loaded and restored for ${bookData.title}.`);
                } else {
                    console.log(`Starting ${bookData.title} fresh (no progress or error loading).`);
                    currentSequenceIndex = 0;
                    displayCurrentSegment();

                    if (fullMorseSequence.length > 0) {
                        const initialTargetSet = setNextTargetMorseLetter();
                        if (bookCipherMorseIO) {
                                bookCipherMorseIO.disabled = !initialTargetSet;
                        }
                    } else {
                        if (bookCipherMorseIO) bookCipherMorseIO.disabled = true;
                        if (targetTextDisplay) targetTextDisplay.textContent = "Book has no parsable content.";
                        if (currentDecodedCharDisplay) currentDecodedCharDisplay.textContent = '-';
                    }
                    if (bookCipherMessageEl) bookCipherMessageEl.textContent = "";
                }
                console.log(`Book ready for game: ${bookData.title}.`);
            })
            .catch(error => {
                console.error('Error fetching book content for game:', error);
                if (targetTextDisplay) targetTextDisplay.textContent = `Error: Could not load '${bookData.title}'.`;
                currentBookMorseContent = '';
                currentMorseSegment = '';
                if (unlockedTextDisplay) unlockedTextDisplay.textContent = '';
                if (currentDecodedCharDisplay) currentDecodedCharDisplay.textContent = '-';
                if(bookCipherMorseIO) bookCipherMorseIO.disabled = true;
                // Error shown in targetTextDisplay within gameView.
            });
    }
    function setNextTargetMorseLetter() {
        const currentDecodedCharDisplay = document.getElementById('current-decoded-char');
        const unlockedTextDisplay = document.getElementById('unlocked-text-display');
        const bookCipherMorseIO = document.getElementById('book-cipher-morse-io'); // Used for enabling/disabling
        const bookCipherMessageEl = document.getElementById('book-cipher-message'); // For messages

        if (currentSequenceIndex >= fullMorseSequence.length) {
            console.log("End of book reached. Processing completion...");
            if (currentDecodedCharDisplay) currentDecodedCharDisplay.textContent = '✓';

            if (bookCipherMessageEl) bookCipherMessageEl.textContent = "Book Complete!"; // Updated message

            if (bookCipherMorseIO) bookCipherMorseIO.disabled = true;
            currentTargetMorseLetter = '';

            isBookCompleted = true; // Set the completion flag

            // Call saveProgress - this function will be fully implemented in the next step.
            // For now, the call is placed here. If saveProgress is still neutralized, it won't do much yet.
            if (typeof saveProgress === 'function') {
                saveProgress(currentBookId, isBookCompleted);
                console.log("Attempted to save progress for completed book.");
            } else {
                console.warn("saveProgress function not found during book completion.");
            }

            return false;
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

                // --- Segment Progression Logic ---
                if (currentSequenceIndex < fullMorseSequence.length) { // Only proceed if not past the end of the book
                    // Determine the character length/offset of the Morse content processed so far.
                    // This offset represents the starting position of the *next* Morse signal
                    // in the original currentBookMorseContent string.
                    let processedMorseSignals = fullMorseSequence.slice(0, currentSequenceIndex);
                    let reconstructedProcessedMorseString = "";
                    if (processedMorseSignals.length > 0) {
                        // Join the processed signals with a space, as they are in currentBookMorseContent
                        reconstructedProcessedMorseString = processedMorseSignals.join(' ');
                    }

                    let nextTargetCharOffset = reconstructedProcessedMorseString.length;

                    // If there was processed content, and it's not the very last signal in the book,
                    // account for the space that would follow the reconstructed string in currentBookMorseContent.
                    // The comparison should be against the count of actual signals in the book.
                    if (reconstructedProcessedMorseString.length > 0 && currentSequenceIndex < currentBookMorseContent.split(' ').filter(s => s.length > 0).length) {
                         nextTargetCharOffset++; // Add 1 for the space character
                    }

                    // Check if the starting character offset of the next target Morse signal
                    // is at or beyond the end of the currently displayed segment.
                    if (nextTargetCharOffset >= currentSegmentStartIndex + MORSE_SEGMENT_LENGTH) {
                        // Also ensure that advancing the segment won't go past the total book content.
                        if (currentSegmentStartIndex + MORSE_SEGMENT_LENGTH < currentBookMorseContent.length) {
                            currentSegmentStartIndex += MORSE_SEGMENT_LENGTH;
                            displayCurrentSegment(); // Update #target-text-display with the new segment
                            // console.log(`Segment advanced. New currentSegmentStartIndex: ${currentSegmentStartIndex}`);
                        }
                    }
                }
                // --- End Segment Progression Logic ---
            setNextTargetMorseLetter(); // Set up the next target or end the game

            // Save progress after successful transcription and potential completion
            saveProgress(currentBookId, isBookCompleted); // NEW CALL
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

    function displayCurrentSegment() {
        const targetTextDisplay = document.getElementById('target-text-display');
        if (!targetTextDisplay) {
            console.error("target-text-display not found");
            return;
        }

        if (!currentBookMorseContent) {
            targetTextDisplay.textContent = "No book content loaded.";
            return;
        }

        let segmentEndIndex = currentSegmentStartIndex + MORSE_SEGMENT_LENGTH;
        currentMorseSegment = currentBookMorseContent.substring(currentSegmentStartIndex, segmentEndIndex);
        targetTextDisplay.textContent = currentMorseSegment;

        // console.log(`Displaying segment: Start ${currentSegmentStartIndex}, End ${segmentEndIndex}, Content: "${currentMorseSegment}"`);

        // Important: We need to ensure that setNextTargetMorseLetter is called
        // to correctly set the currentTargetMorseLetter from the new segment,
        // but only if we are not in the process of loading saved progress.
        // For now, this function will be called before loadProgress,
        // and loadProgress itself will call it again and then set the target.
        // So, a direct call to setNextTargetMorseLetter() here might be redundant
        // or premature if loadProgress is going to adjust currentSequenceIndex.
        // Let's hold off on calling setNextTargetMorseLetter() from here directly in this step.
        // The existing call to setNextTargetMorseLetter() in startBookButton after parsing
        // should still pick up the first letter of the first segment.
        // If loadProgress is implemented, it will be responsible for setting the correct
        // currentTargetMorseLetter after displaying the loaded segment.
    }

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
    // Set the initial view to the library
    showBookLibraryView();
});
