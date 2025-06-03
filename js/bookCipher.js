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
    // const MORSE_SEGMENT_LENGTH = 40; // Obsolete: Define segment length for display
    let currentBookMorseContent = '';
    // let currentMorseSegment = ''; // Obsolete: To track the current visible Morse segment
    // let currentSegmentStartIndex = 0; // Obsolete: To track the start of the current visible Morse segment
    // let currentMorseLetterIndex = 0; // To track the current letter in the segment - Considered obsolete
    let fullMorseSequence = []; // Stores arrays of Morse letters (words)
    let currentWordIndex = 0; // Index for the current word in fullMorseSequence
    let currentMorseLetterIndexInWord = 0; // Index for the current Morse letter within the current word
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

                    // Load progress to determine button display
                    const savedProgressString = localStorage.getItem(`bookCipherProgress_${currentBookId}`);
                    let isBookMarkedCompleted = false;
                    if (savedProgressString) {
                        try {
                            const savedProgress = JSON.parse(savedProgressString);
                            if (savedProgress.bookId === currentBookId) {
                                isBookMarkedCompleted = savedProgress.isCompleted || false;
                            }
                        } catch (e) {
                            console.error('Error parsing progress for button display:', e);
                        }
                    }

                    if (isBookMarkedCompleted) {
                        const viewUnlockedTextBtn = document.createElement('button');
                        viewUnlockedTextBtn.id = 'view-unlocked-text-btn';
                        viewUnlockedTextBtn.textContent = 'View Unlocked Text';
                        viewUnlockedTextBtn.className = 'w-full max-w-xs px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-lg shadow-md transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500';
                        buttonContainer.appendChild(viewUnlockedTextBtn);
                        viewUnlockedTextBtn.addEventListener('click', () => {
                            displayUnlockedBookText(currentBookId);
                        });
                        // Event listener for restartDecipheringBtn will be added in a later step

                        const restartDecipheringBtn = document.createElement('button');
                        restartDecipheringBtn.id = 'restart-deciphering-btn';
                        restartDecipheringBtn.textContent = 'Restart Deciphering';
                        // Adjusted class to match yellow-500 and ring-yellow-400 as per plan
                        restartDecipheringBtn.className = 'w-full max-w-xs px-6 py-3 bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-yellow-400';
                        buttonContainer.appendChild(restartDecipheringBtn);
                        restartDecipheringBtn.addEventListener('click', () => {
                            restartBookDeciphering(currentBookId);
                        });
                    } else {
                        const startDecipheringBtn = document.createElement('button');
                        startDecipheringBtn.id = 'start-deciphering-btn';
                        startDecipheringBtn.textContent = 'Start Deciphering';
                        startDecipheringBtn.className = 'w-full max-w-xs px-6 py-3 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold rounded-lg shadow-md transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500';
                        buttonContainer.appendChild(startDecipheringBtn);

                        startDecipheringBtn.addEventListener('click', () => {
                            initializeAndStartBookGame(currentBookId);
                        });
                    }

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
        // currentWordIndex is global and should be up-to-date.
        // unlockedTextDisplay is accessed directly.
        // completedStatus is passed as a parameter.

        const progress = {
            bookId: bookIdToSave,
            currentWordIndex: currentWordIndex, // Current progress in Morse sequence (word index)
            unlockedText: unlockedTextDisplay ? unlockedTextDisplay.textContent : '', // Revealed English text
            isCompleted: completedStatus // Completion status
        };

        try {
            localStorage.setItem(`bookCipherProgress_${bookIdToSave}`, JSON.stringify(progress));
            // console.log(`Progress saved for ${bookIdToSave}: Index ${currentWordIndex}, Completed: ${completedStatus}`);
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
                    console.warn("loadProgress: Mismatch bookId in saved data. Ignoring old progress.");
                    localStorage.removeItem(`bookCipherProgress_${bookIdToLoad}`);
                    return false; // Treat as no progress found
                }

                // Restore game state
                currentWordIndex = parseInt(savedProgress.currentWordIndex, 10) || 0;
                unlockedTextDisplay.textContent = savedProgress.unlockedText || '';
                isBookCompleted = typeof savedProgress.isCompleted === 'boolean' ? savedProgress.isCompleted : false;
                currentMorseLetterIndexInWord = 0; // Always reset letter index on load

                console.log(`Progress loaded for ${bookIdToLoad}: Word Index ${currentWordIndex}, Completed: ${isBookCompleted}, Unlocked: "${savedProgress.unlockedText}"`);

                // Graceful Handling of Invalid currentWordIndex (assuming fullMorseSequence is populated)
                // This check is important if the book content/structure changed since last save.
                if (fullMorseSequence && !isBookCompleted && currentWordIndex >= fullMorseSequence.length) {
                    console.warn(`Loaded currentWordIndex (${currentWordIndex}) is out of bounds for fullMorseSequence length (${fullMorseSequence.length}). Resetting progress for book ${bookIdToLoad}.`);
                    currentWordIndex = 0;
                    currentMorseLetterIndexInWord = 0;
                    unlockedTextDisplay.textContent = '';
                    isBookCompleted = false;
                    // Optionally, clear the invalid saved progress
                    // localStorage.removeItem(`bookCipherProgress_${bookIdToLoad}`);
                }

                displayCurrentWordInUI(); // Update target Morse display

                if (isBookCompleted) {
                    if (bookCipherMessageEl) bookCipherMessageEl.textContent = "Book Complete!";
                    if (currentDecodedCharDisplay) currentDecodedCharDisplay.textContent = '✓';
                    if (bookCipherMorseIO) bookCipherMorseIO.disabled = true;
                } else {
                    // If not completed, set the next target Morse signal.
                    // This also updates currentDecodedCharDisplay and calls displayCurrentWordInUI again.
                    setNextTargetMorseSignal();
                    if (bookCipherMorseIO) bookCipherMorseIO.disabled = false;
                    if (bookCipherMessageEl) bookCipherMessageEl.textContent = "";
                }
                return true; // Progress successfully loaded and applied
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
                currentBookMorseContent = text.trim(); // Keep the raw Morse content for reference if needed
                // currentSegmentStartIndex = 0; // Obsolete

                if (currentBookMorseContent.length === 0) {
                    targetTextDisplay.textContent = "Book is empty.";
                    unlockedTextDisplay.textContent = '';
                    currentDecodedCharDisplay.textContent = '-';
                    if (bookCipherMorseIO) bookCipherMorseIO.disabled = true;
                    console.log(`Book is empty: ${bookData.title}`);
                    fullMorseSequence = [];
                    currentTargetMorseLetter = '';
                    // displayCurrentSegment(); // Obsolete
                    // displayCurrentWordInUI(); // Obsolete: Call removed
                    // Game view will show "Book is empty."
                    return;
                }

                // Process words separated by '/' and then letters by space
                fullMorseSequence = currentBookMorseContent.trim().split('/')
                                        .map(word => word.trim().split(' ').filter(s => s.length > 0))
                                        .filter(wordArray => wordArray.length > 0);

                if (unlockedTextDisplay) unlockedTextDisplay.textContent = '';
                isBookCompleted = false;
                // currentSegmentStartIndex = 0; // Obsolete

                if (loadProgress(bookId)) {
                    console.log(`Progress loaded and restored for ${bookData.title}.`);
                    // displayCurrentWordInUI() call removed from loadProgress, setNextTargetMorseSignal will handle highlighting
                } else {
                    console.log(`Starting ${bookData.title} fresh (no progress or error loading).`);
                    currentWordIndex = 0;
                    currentMorseLetterIndexInWord = 0;

                    if (fullMorseSequence.length > 0 && fullMorseSequence[currentWordIndex] && fullMorseSequence[currentWordIndex].length > 0) {
                        const initialTargetSet = setNextTargetMorseSignal();
                        if (bookCipherMorseIO) {
                                bookCipherMorseIO.disabled = !initialTargetSet;
                        }
                    } else { // Book has no parsable content or is empty after parsing
                        if (bookCipherMorseIO) bookCipherMorseIO.disabled = true;
                        if (currentDecodedCharDisplay) currentDecodedCharDisplay.textContent = '-';
                        // displayCurrentWordInUI(); // Obsolete: Call removed
                    }
                    if (bookCipherMessageEl) bookCipherMessageEl.textContent = "";
                }
                console.log(`Book ready for game: ${bookData.title}.`);

                // START - Modified code to populate #full-book-morse-display with spans
                const fullBookMorseDisplay = document.getElementById('full-book-morse-display');
                if (fullBookMorseDisplay) {
                    if (fullMorseSequence && fullMorseSequence.length > 0) {
                        let htmlContent = '';
                        fullMorseSequence.forEach((wordArray, wordIndex) => {
                            let wordHtml = wordArray.map((morseLetter, letterIndex) => {
                                return `<span class="morse-char-span" data-word-idx="${wordIndex}" data-letter-idx="${letterIndex}">${morseLetter}</span>`;
                            }).join(' '); // Join Morse letter spans with a space

                            htmlContent += wordHtml;
                            if (wordIndex < fullMorseSequence.length - 1) {
                                htmlContent += ' / '; // Word separator
                            }
                        });
                        fullBookMorseDisplay.innerHTML = htmlContent;
                    } else {
                        // Handle cases like empty book or book with no parsable Morse.
                        if (currentBookMorseContent.trim().length === 0) {
                            fullBookMorseDisplay.textContent = "Book is empty."; // textContent is fine for simple messages
                        } else {
                            fullBookMorseDisplay.textContent = "No parsable Morse content found in this book.";
                        }
                    }
                } else {
                    console.error("#full-book-morse-display element not found.");
                }
                // END - Modified code to populate #full-book-morse-display with spans

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
    function setNextTargetMorseSignal() {
        const currentDecodedCharDisplay = document.getElementById('current-decoded-char');
        // unlockedTextDisplay is not used here directly for adding spaces anymore
        const bookCipherMorseIO = document.getElementById('book-cipher-morse-io');
        const bookCipherMessageEl = document.getElementById('book-cipher-message');

        // Remove highlight from the previous target
        const previouslyHighlighted = document.querySelector('#full-book-morse-display .current-morse-target');
        if (previouslyHighlighted) {
            previouslyHighlighted.classList.remove('current-morse-target');
        }

        // Check if currentWordIndex is out of bounds (end of book)
        if (currentWordIndex >= fullMorseSequence.length) {
            console.log("End of book reached (all words processed). Processing completion...");
            currentTargetMorseLetter = ''; // Clear target
            isBookCompleted = true; // Mark as completed

            if (currentDecodedCharDisplay) currentDecodedCharDisplay.textContent = '✓'; // UI update
            if (bookCipherMessageEl) bookCipherMessageEl.textContent = "Book Complete!"; // UI update
            if (bookCipherMorseIO) bookCipherMorseIO.disabled = true; // UI update

            // displayCurrentWordInUI(); // Obsolete: Call removed
            saveProgress(currentBookId, isBookCompleted); // Save final state
            return false; // No more targets
        }

        const currentWord = fullMorseSequence[currentWordIndex];

        // Check if currentMorseLetterIndexInWord is out of bounds for the current word
        if (currentMorseLetterIndexInWord >= currentWord.length) {
            currentWordIndex++;
            currentMorseLetterIndexInWord = 0;
            return setNextTargetMorseSignal(); // Recursively call for the next word or determine end of book
        }

        // Set the target Morse letter from the current position
        currentTargetMorseLetter = currentWord[currentMorseLetterIndexInWord];

        // Update UI elements and highlight the new target
        if (currentTargetMorseLetter && currentTargetMorseLetter !== '') {
            const newTargetSpan = document.querySelector(
                `#full-book-morse-display .morse-char-span[data-word-idx="${currentWordIndex}"][data-letter-idx="${currentMorseLetterIndexInWord}"]`
            );

            if (newTargetSpan) {
                newTargetSpan.classList.add('current-morse-target');
                if (currentDecodedCharDisplay) { // currentDecodedCharDisplay is already an element reference
                    currentDecodedCharDisplay.textContent = newTargetSpan.textContent;
                }
                newTargetSpan.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
            } else {
                console.warn(`Target span not found for word ${currentWordIndex}, letter ${currentMorseLetterIndexInWord}`);
                if (currentDecodedCharDisplay) {
                    currentDecodedCharDisplay.textContent = '-'; // Reset if span not found
                }
            }
        } else {
            // This case should be handled by the end-of-book logic earlier.
            // If somehow currentTargetMorseLetter is empty here, reset display.
            if (currentDecodedCharDisplay) currentDecodedCharDisplay.textContent = '-';
        }
        // displayCurrentWordInUI(); // Obsolete: Call removed

        return true; // Target successfully set (or end of book handled)
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
            return;
        }

        if (typeof morseToText === 'undefined') { // Assuming morseToText is preferred
            console.error("morseToText function is not available.");
            if (bookCipherMessageEl) bookCipherMessageEl.textContent = "Error: Decoding library missing.";
            return;
        }

        const cleanedUserMorse = userTappedMorse.trim();

        if (cleanedUserMorse === currentTargetMorseLetter) {
            // --- MATCH ---
            // Positive visual/text feedback
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

            // Append the single translated character for the current successful match
            // This was the old behavior - it should be removed if word-by-word translation is done below.
            // let matchedEnglishChar = morseToText(currentTargetMorseLetter);
            // if (matchedEnglishChar && unlockedTextDisplay) {
            //     unlockedTextDisplay.textContent += matchedEnglishChar;
            // } else if (!matchedEnglishChar) {
            //    console.warn(`No English equivalent found for successfully matched Morse: ${currentTargetMorseLetter}`);
            // }


            currentMorseLetterIndexInWord++; // Advance to the next letter index

            // Word Completion Logic
            if (currentWordIndex < fullMorseSequence.length &&
                currentMorseLetterIndexInWord >= fullMorseSequence[currentWordIndex].length) {

                // Translate the completed Morse word to English
                let morseWordSignals = fullMorseSequence[currentWordIndex];
                let translatedEnglishWord = morseWordSignals.map(signal => morseToText(signal) || '').join('');

                // Update unlockedTextDisplay: clear previous partial word (if any) and append full word + space
                // To do this correctly, we need to manage how text is added.
                // For now, if the previous logic of adding char-by-char was removed,
                // this will append the full word. We need to ensure it replaces the partial word if needed,
                // or that char-by-char appending is disabled.
                // Assuming the char-by-char from previous step is removed/commented:
                let currentUnlocked = unlockedTextDisplay.textContent || "";
                // Remove characters of the current word being typed, then add the full word.
                // This is tricky if other words are already there.
                // A simpler approach for now: if the previous char-by-char was removed,
                // we'll just append the letters of the current word one by one, and add a space at the end.
                // The provided plan implies appending the *whole word* at once *after* it's done.
                // This means the char-by-char `unlockedTextDisplay.textContent += englishChar;` must be removed.

                // Let's refine: The individual `englishChar` appending should be removed.
                // The `unlockedTextDisplay` should be updated ONLY when a word is complete.

                // To implement the "append whole word at once" strategy:
                // 1. The old `unlockedTextDisplay.textContent += englishChar;` (if it existed for single chars) must be gone.
                // 2. We construct the word here.

                // Reconstruct the text in unlockedTextDisplay.
                // If we are truly doing word-by-word, we need to rebuild the unlocked text from scratch or be very careful.
                // The current plan asks to *append* the translatedEnglishWord + ' '.
                // This assumes that individual characters of the current word were NOT added to unlockedTextDisplay before.

                // Let's ensure the previous single-char append is GONE.
                // The old logic:
                // if (englishChar && unlockedTextDisplay) {
                // unlockedTextDisplay.textContent += englishChar;
                // }
                // This MUST be removed for word-by-word commit to work as requested.
                // Assuming it's removed based on the new plan.

                if (unlockedTextDisplay) {
                    // To correctly append the word, we need to ensure the characters of the current word weren't added one by one.
                    // If they were, we'd need to remove them first.
                    // For now, let's assume they were NOT, and we are building the unlocked text word by word.
                    // So, we find all letters of the current word and translate them.
                    let currentWordMorse = fullMorseSequence[currentWordIndex];
                    let currentWordEnglish = currentWordMorse.map(signal => morseToText(signal) || '').join('');

                    // To prevent adding parts of the word then the whole word:
                    // We need to reconstruct what should be there.
                    // This is safer: reconstruct based on all *completed* words.
                    let textToDisplay = "";
                    for(let i=0; i < currentWordIndex; i++) {
                        textToDisplay += fullMorseSequence[i].map(s => morseToText(s) || '').join('') + " ";
                    }
                    textToDisplay += currentWordEnglish + " "; // Add current, now completed word
                    unlockedTextDisplay.textContent = textToDisplay;

                }


                currentWordIndex++; // Move to the next word
                currentMorseLetterIndexInWord = 0; // Reset letter index for the new word
            }

            setNextTargetMorseSignal(); // Set up the next target
            saveProgress(currentBookId, isBookCompleted); // Save progress
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

    // function displayCurrentSegment() { // Obsolete
    //     const targetTextDisplay = document.getElementById('target-text-display');
    //     if (!targetTextDisplay) {
    //         console.error("target-text-display not found");
    //         return;
    //     }
    //
    //     if (!currentBookMorseContent) {
    //         targetTextDisplay.textContent = "No book content loaded.";
    //         return;
    //     }
    //
    //     let segmentEndIndex = currentSegmentStartIndex + MORSE_SEGMENT_LENGTH;
    //     currentMorseSegment = currentBookMorseContent.substring(currentSegmentStartIndex, segmentEndIndex);
    //     targetTextDisplay.textContent = currentMorseSegment;
    //
    //     // console.log(`Displaying segment: Start ${currentSegmentStartIndex}, End ${segmentEndIndex}, Content: "${currentMorseSegment}"`);
    // }

    function displayCurrentWordInUI() {
        // const targetTextDisplay = document.getElementById('target-text-display');
        // if (!targetTextDisplay) {
        //     console.error("target-text-display element not found for book cipher game.");
        //     return;
        // }
        //
        // if (isBookCompleted) {
        //     targetTextDisplay.innerHTML = '<span class="book-completed-message">Book Complete!</span>';
        //     return;
        // }
        //
        // if (currentWordIndex >= fullMorseSequence.length || !fullMorseSequence[currentWordIndex] || fullMorseSequence[currentWordIndex].length === 0) {
        //     if (fullMorseSequence.length === 0 && currentBookMorseContent && currentBookMorseContent.length > 0) {
        //          targetTextDisplay.innerHTML = '<span class="book-error-message">Book has no parsable Morse content.</span>';
        //     } else if (fullMorseSequence.length === 0) { // Handles initially empty book or book that parses to nothing
        //          targetTextDisplay.innerHTML = '<span class="book-error-message">Book is empty or no words found.</span>';
        //     } else { // Should ideally be caught by isBookCompleted or next word logic
        //          targetTextDisplay.innerHTML = '<span class="book-error-message">End of book or no current word to display.</span>';
        //     }
        //     return;
        // }
        //
        // const currentWordArr = fullMorseSequence[currentWordIndex];
        // let htmlContent = '';
        //
        // currentWordArr.forEach((morseLetter, letterIndex) => {
        //     if (letterIndex === currentMorseLetterIndexInWord) {
        //         htmlContent += `<span class="current-morse-letter highlight-morse">${morseLetter}</span>`;
        //     } else {
        //         htmlContent += `<span class="morse-letter">${morseLetter}</span>`;
        //     }
        //     if (letterIndex < currentWordArr.length - 1) {
        //         htmlContent += ' '; // Add space between Morse letters
        //     }
        // });
        // targetTextDisplay.innerHTML = htmlContent;
        console.log("displayCurrentWordInUI is now obsolete and its call should be removed.");
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

function restartBookDeciphering(bookId) {
    if (!bookId) {
        console.error("restartBookDeciphering: No bookId provided.");
        alert("Cannot restart book: No book identifier specified.");
        return;
    }

    const bookData = bookCipherBooks[bookId];
    if (!bookData) {
        console.error("restartBookDeciphering: Book data not found for bookId:", bookId);
        alert("Cannot restart book: Book data not found.");
        return;
    }

    // Confirm with the user before restarting
    const confirmation = confirm(`Are you sure you want to restart deciphering for "${bookData.title}"? All progress for this book will be lost.`);
    if (!confirmation) {
        return; // User cancelled
    }

    // Clear saved progress from localStorage
    try {
        localStorage.removeItem(`bookCipherProgress_${bookId}`);
        console.log(`Progress for book ${bookId} cleared from localStorage.`);
    } catch (error) {
        console.error(`Error removing progress for ${bookId} from localStorage:`, error);
        alert("An error occurred while trying to clear book progress. Please try again.");
        return; // Stop if clearing progress failed
    }

    // Reset global game state variables related to the current book.
    if (currentBookId === bookId) {
        currentBookMorseContent = '';
        fullMorseSequence = [];
        currentWordIndex = 0;
        currentMorseLetterIndexInWord = 0;
        currentTargetMorseLetter = '';
        isBookCompleted = false; // Explicitly mark as not completed

        // Clear UI elements if the game view for this book was active
        // Check if elements exist before trying to modify them
        const gameView = document.getElementById('book-game-view');
        if (gameView && !gameView.classList.contains('hidden')) {
            const targetTextDisplay = document.getElementById('target-text-display');
            if (targetTextDisplay) targetTextDisplay.textContent = 'Morse code will appear here...';

            const unlockedTextDisplay = document.getElementById('unlocked-text-display');
            if (unlockedTextDisplay) unlockedTextDisplay.textContent = '-';

            const currentDecodedCharDisplay = document.getElementById('current-decoded-char');
            if (currentDecodedCharDisplay) currentDecodedCharDisplay.textContent = '-';

            const bookCipherMorseIO = document.getElementById('book-cipher-morse-io');
            if (bookCipherMorseIO) {
                bookCipherMorseIO.value = '';
                bookCipherMorseIO.disabled = true;
            }
            const bookCipherMessageEl = document.getElementById('book-cipher-message');
            if (bookCipherMessageEl) bookCipherMessageEl.textContent = "Book progress has been reset.";
        }
    }

    const detailsView = document.getElementById('book-details-view');
    if (detailsView) {
        detailsView.innerHTML = '';
        const bookElementInLibrary = document.querySelector(`#book-library-container .book-cover-item[data-book-id='${bookId}']`);
        if (bookElementInLibrary) {
            bookElementInLibrary.classList.remove('book-cover-selected');
            bookElementInLibrary.click();
        } else {
            showBookLibraryView();
        }
    } else {
        showBookLibraryView();
    }
}

function displayUnlockedBookText(bookId) {
    const bookData = bookCipherBooks[bookId];
    if (!bookData || !bookData.filePath) {
        console.error("displayUnlockedBookText: Invalid bookId or missing filePath", bookId);
        alert("Could not load book text. Data is missing.");
        return;
    }

    fetch(bookData.filePath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}, file: ${bookData.filePath}`);
            }
            return response.text();
        })
        .then(morseContent => {
            morseContent = morseContent.trim();
            if (morseContent.length === 0) {
                alert("This book appears to be empty.");
                return;
            }

            // Convert Morse to English text
            let fullEnglishText = morseContent.split('/')
                                      .map(morseWord => {
                                          return morseWord.trim().split(' ')
                                                        .map(morseChar => reversedMorseCode[morseChar] || '') // Use reversedMorseCode directly
                                                        .join('');
                                      }).join(' ');

            const modal = document.getElementById('unlocked-text-modal');
            const modalTitle = document.getElementById('unlocked-text-modal-title');
            const modalContent = document.getElementById('unlocked-text-modal-content');
            const closeModalBtn = document.getElementById('close-unlocked-text-modal-btn');

            if (modal && modalTitle && modalContent && closeModalBtn) {
                modalTitle.textContent = `Unlocked Text: ${bookData.title}`;
                modalContent.textContent = fullEnglishText.length > 0 ? fullEnglishText : "No text could be deciphered (book might be empty or in an unrecognized format).";
                modal.classList.remove('hidden');

                // To prevent multiple listeners, one approach:
                if (!closeModalBtn.dataset.listenerAttached) {
                    closeModalBtn.addEventListener('click', () => {
                        modal.classList.add('hidden');
                    });
                    closeModalBtn.dataset.listenerAttached = 'true';
                }
            } else {
                console.error("Modal elements not found for displaying unlocked text.");
                alert("Error: Could not display the unlocked text. UI elements missing.");
            }
        })
        .catch(error => {
            console.error('Error fetching or processing book content for displayUnlockedBookText:', error);
            alert(`Error loading book text: ${error.message}`);
        });
}
