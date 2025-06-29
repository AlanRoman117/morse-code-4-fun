document.addEventListener('DOMContentLoaded', () => {
    let currentBookId = null; // Added for saving progress
    let isBookCompleted = false; // Flag for book completion status

    // New global variables for Morse-based book cipher
    let currentBookMorseContent = '';
    // let currentMorseLetterIndex = 0; // Obsolete: To track the current letter in the segment
    let fullMorseSequence = []; // Stores arrays of Morse letters (words)
    let currentWordIndex = 0; // Index for the current word in fullMorseSequence
    let currentMorseLetterIndexInWord = 0; // Index for the current Morse letter within the current word
    let currentTargetMorseLetter = ''; // Stores the actual target Morse string, e.g., ".-"

    const bookSelectionDropdown = document.getElementById('book-selection');
    // const startBookButton = document.getElementById('start-book-btn'); // Old button reference, removed
    const unlockedTextDisplay = document.getElementById('unlocked-text-display');
    const currentDecodedCharDisplay = document.getElementById('current-decoded-char');
    const bookCipherMessageEl = document.getElementById('book-cipher-message'); // Added
    const returnToLibraryFromGameBtn = document.getElementById('return-to-library-from-game-btn');

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
            // Make sure the banner placeholder is also cleared or handled if library is empty.
            // The banner is inside libraryContainer, so clearing innerHTML handles it.
            libraryContainer.textContent = 'No books available.'; // Display a message
            return;
        }

        // The banner is now part of the HTML structure inside libraryContainer.
        // We will control its visibility after populating books.
        const unlockBooksBanner = document.getElementById('unlock-books-banner'); // Get banner element

        for (const bookKey in bookCipherBooks) {
            if (bookCipherBooks.hasOwnProperty(bookKey)) {
                const book = bookCipherBooks[bookKey];
                const bookElement = document.createElement('div');
                // bookElement.textContent = book.title; // Title will be inside a sub-element

                const titleSpan = document.createElement('span');
                titleSpan.textContent = book.title;
                bookElement.appendChild(titleSpan);

                bookElement.classList.add('book-cover-item');
                bookElement.setAttribute('data-book-id', bookKey);

                const isLocked = book.isPro && !window.isProUser;

                if (isLocked) {
                    bookElement.classList.add('opacity-50', 'cursor-not-allowed', 'relative');
                    bookElement.title = "Unlock with Pro"; // Tooltip

                    const lockIcon = document.createElement('div');
                    lockIcon.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 absolute top-1 right-1 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    `;
                    bookElement.appendChild(lockIcon);

                    const proLabel = document.createElement('span');
                    proLabel.textContent = "PRO";
                    proLabel.className = "absolute bottom-1 right-1 bg-purple-600 text-white text-xs font-bold px-1.5 py-0.5 rounded";
                    bookElement.appendChild(proLabel);


                    // Prevent click or show upsell modal
                    bookElement.addEventListener('click', (e) => {
                        e.stopPropagation(); // Prevent any other listeners if needed
                        if (typeof window.showUpsellModal === 'function') {
                            window.showUpsellModal();
                        } else {
                            alert("This book requires the Pro version.");
                        }
                    });
                } else {
                    // Add click listener only for non-locked books
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
                }
                libraryContainer.appendChild(bookElement);
            }
        }
        // Show or hide the "Unlock more books" banner based on Pro status
        if (unlockBooksBanner) {
            if (!window.isProUser) {
                unlockBooksBanner.classList.remove('hidden');
                // Ensure the banner is placed correctly by re-inserting it if necessary,
                // or by styling it to appear at the end.
                // If it's already in the HTML, removing 'hidden' is enough.
                // If it was cleared by innerHTML, it needs to be re-added or handled by initial HTML structure.
                // The current HTML places it inside, so it should be fine.
            } else {
                unlockBooksBanner.classList.add('hidden');
            }
        } else {
            console.warn("#unlock-books-banner element not found in DOM for controlling visibility.");
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
            currentMorseLetterIndexInWord: currentMorseLetterIndexInWord, // Current progress within the word
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
        // const bookCipherMorseIO = document.getElementById('book-cipher-morse-io'); // Removed
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
                // Load currentMorseLetterIndexInWord, defaulting to 0 if not present (for backward compatibility)
                currentMorseLetterIndexInWord = parseInt(savedProgress.currentMorseLetterIndexInWord, 10) || 0;

                console.log(`Progress loaded for ${bookIdToLoad}: Word Index ${currentWordIndex}, Letter Index ${currentMorseLetterIndexInWord}, Completed: ${isBookCompleted}, Unlocked: "${savedProgress.unlockedText}"`);

                // Graceful Handling of Invalid currentWordIndex (assuming fullMorseSequence is populated)
                // This check is important if the book content/structure changed since last save.
                if (fullMorseSequence && !isBookCompleted &&
                    (currentWordIndex >= fullMorseSequence.length ||
                     (fullMorseSequence[currentWordIndex] && currentMorseLetterIndexInWord >= fullMorseSequence[currentWordIndex].length))) {
                    console.warn(`Loaded progress (Word: ${currentWordIndex}, Letter: ${currentMorseLetterIndexInWord}) is out of bounds. Resetting progress for book ${bookIdToLoad}.`);
                    currentWordIndex = 0;
                    currentMorseLetterIndexInWord = 0;
                    unlockedTextDisplay.textContent = '';
                    isBookCompleted = false;
                    // Optionally, clear the invalid saved progress
                    // localStorage.removeItem(`bookCipherProgress_${bookIdToLoad}`);
                }

                // displayCurrentWordInUI(); // Obsolete: Call removed

                // The block for reconstructing deciphered characters directly in loadProgress has been removed.
                // This is now handled by initializeAndStartBookGame after loadProgress completes.

                if (isBookCompleted) {
                    if (bookCipherMessageEl) bookCipherMessageEl.textContent = "Book Complete!";
                    if (currentDecodedCharDisplay) currentDecodedCharDisplay.textContent = '✓';
                    // if (bookCipherMorseIO) bookCipherMorseIO.disabled = true; // Removed
                } else {
                    // If not completed, set the next target Morse signal.
                    // This also updates currentDecodedCharDisplay and calls displayCurrentWordInUI again.
                    setNextTargetMorseSignal();
                    // if (bookCipherMorseIO) bookCipherMorseIO.disabled = false; // Removed
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
        const unlockedTextDisplayEl = document.getElementById('unlocked-text-display');
        const currentDecodedCharDisplayEl = document.getElementById('current-decoded-char');
        // const bookCipherMorseIO = document.getElementById('book-cipher-morse-io'); // Removed

        if (!unlockedTextDisplayEl || !currentDecodedCharDisplayEl) {
            console.error("A required DOM element for the game view is missing (unlockedTextDisplay or currentDecodedCharDisplay).");
            if (bookCipherMessageEl) {
                bookCipherMessageEl.textContent = "Error: Essential game display elements are missing. Please refresh.";
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
            // Update targetTextDisplay to bookCipherMessageEl
            if (bookCipherMessageEl) bookCipherMessageEl.textContent = "Error: Book details incomplete.";
            showGameView(); // Show game view even with this error to display the message
            return;
        }

        showGameView(); // Switch to the game view first

console.log("initializeAndStartBookGame: Attempting to attach tapper. Tapper area (#bookCipherTapperArea) visibility:", document.getElementById('bookCipherTapperArea') ? document.getElementById('bookCipherTapperArea').checkVisibility() : 'not found');
if (typeof attachTapperToArea === 'function') {
    console.log("initializeAndStartBookGame: Calling attachTapperToArea('bookCipherTapperArea').");
    attachTapperToArea('bookCipherTapperArea');
} else {
    console.error("initializeAndStartBookGame: attachTapperToArea function not found.");
}
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

                if (currentBookMorseContent.length === 0) {
                    // Update targetTextDisplay to bookCipherMessageEl or full-book-morse-display
                    // Using bookCipherMessageEl for "Book is empty." status
                    if (bookCipherMessageEl) bookCipherMessageEl.textContent = "Book is empty.";
                    unlockedTextDisplayEl.textContent = '';
                    currentDecodedCharDisplayEl.textContent = '-';
                    // if (bookCipherMorseIO) bookCipherMorseIO.disabled = true; // Removed
                    console.log(`Book is empty: ${bookData.title}`);
                    fullMorseSequence = [];
                    currentTargetMorseLetter = '';
                    // Game view will show the message via bookCipherMessageEl
                    return;
                }

                // Process words separated by '/' and then letters by space
                fullMorseSequence = currentBookMorseContent.trim().split('/')
                                        .map(word => word.trim().split(' ').filter(s => s.length > 0))
                                        .filter(wordArray => wordArray.length > 0);

                if (unlockedTextDisplayEl) unlockedTextDisplayEl.textContent = '';
                isBookCompleted = false;

                const progressLoaded = loadProgress(bookId); // Store the result of loadProgress

                if (progressLoaded) {
                    console.log(`Progress loaded and restored for ${bookData.title}.`);
                    // setNextTargetMorseSignal (called in loadProgress) will handle highlighting
                } else {
                    console.log(`Starting ${bookData.title} fresh (no progress or error loading).`);
                    currentWordIndex = 0;
                    currentMorseLetterIndexInWord = 0;

                    if (fullMorseSequence.length > 0 && fullMorseSequence[currentWordIndex] && fullMorseSequence[currentWordIndex].length > 0) {
                        const initialTargetSet = setNextTargetMorseSignal();
                        // if (bookCipherMorseIO) { // Removed
                        //         bookCipherMorseIO.disabled = !initialTargetSet; // Removed
                        // } // Removed
                    } else { // Book has no parsable content or is empty after parsing
                        // if (bookCipherMorseIO) bookCipherMorseIO.disabled = true; // Removed
                        if (currentDecodedCharDisplayEl) currentDecodedCharDisplayEl.textContent = '-';
                    }
                    if (bookCipherMessageEl) bookCipherMessageEl.textContent = "";
                }
                console.log(`Book ready for game: ${bookData.title}.`);

                // START - Modified code to populate #full-book-morse-display with spans
                const fullBookMorseDisplay = document.getElementById('full-book-morse-display');
                if (fullBookMorseDisplay) {
                    if (fullMorseSequence && fullMorseSequence.length > 0) {
                        let htmlContent = '';
                        fullMorseSequence.forEach((wordArray, wordIdx) => { // Renamed for clarity against global currentWordIndex
                            let wordHtml = wordArray.map((morseLetter, letterIdx) => { // Renamed for clarity
                                let charContent = morseLetter;
                                let spanClass = "morse-char-span";

                                // Check if progress was loaded and if this char should be deciphered
                                if (progressLoaded) {
                                    // currentWordIndex and currentMorseLetterIndexInWord are global variables updated by loadProgress
                                    const isDeciphered = (wordIdx < currentWordIndex) ||
                                                         (wordIdx === currentWordIndex && letterIdx < currentMorseLetterIndexInWord);
                                    if (isDeciphered) {
                                        // Ensure morseToText is available (assumed global or accessible)
                                        charContent = typeof morseToText === 'function' ? (morseToText(morseLetter) || morseLetter) : morseLetter;
                                        spanClass += " deciphered-char";
                                    }
                                }
                                return `<span class="${spanClass}" data-word-idx="${wordIdx}" data-letter-idx="${letterIdx}">${charContent}</span>`;
                            }).join(' '); // Join Morse letter spans with a space

                            htmlContent += wordHtml;
                            if (wordIdx < fullMorseSequence.length - 1) {
                                htmlContent += ' / '; // Word separator
                            }
                        });
                        fullBookMorseDisplay.innerHTML = htmlContent;
                    } else {
                        // Handle cases like empty book or book with no parsable Morse.
                        // If bookCipherMessageEl is used for "Book is empty", this else if can be more specific
                        if (currentBookMorseContent.trim().length === 0) {
                            // message already set by bookCipherMessageEl.textContent = "Book is empty.";
                            // fullBookMorseDisplay can be left empty or show a minimal marker if desired
                            fullBookMorseDisplay.textContent = "-";
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
                // Update targetTextDisplay to bookCipherMessageEl
                if (bookCipherMessageEl) bookCipherMessageEl.textContent = `Error: Could not load '${bookData.title}'.`;
                currentBookMorseContent = '';
                if (unlockedTextDisplayEl) unlockedTextDisplayEl.textContent = '';
                if (currentDecodedCharDisplayEl) currentDecodedCharDisplayEl.textContent = '-';
                // if(bookCipherMorseIO) bookCipherMorseIO.disabled = true; // Removed
                // Error shown in bookCipherMessageEl within gameView.
            });
    }
    function setNextTargetMorseSignal() {
        const currentDecodedCharDisplay = document.getElementById('current-decoded-char');
        // unlockedTextDisplay is not used here directly for adding spaces anymore
        // const bookCipherMorseIO = document.getElementById('book-cipher-morse-io'); // Removed
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
            launchFireworks(); // Trigger fireworks effect

            if (currentDecodedCharDisplay) currentDecodedCharDisplay.textContent = '✓'; // UI update
            if (bookCipherMessageEl) bookCipherMessageEl.textContent = "Book Complete!"; // UI update
            // if (bookCipherMorseIO) bookCipherMorseIO.disabled = true; // UI update // Removed

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

        return true; // Target successfully set (or end of book handled)
    }

    function handleBookCipherInput(userTappedMorse) {
        const currentDecodedCharDisplay = document.getElementById('current-decoded-char');
        const unlockedTextDisplay = document.getElementById('unlocked-text-display');
        const bookCipherMessageEl = document.getElementById('book-cipher-message');
        // const bookCipherMorseIO = document.getElementById('book-cipher-morse-io'); // Removed

        // Ignore input if the game is effectively over or not started
        if (!currentTargetMorseLetter) { // Simplified condition
            console.log("handleBookCipherInput: Input ignored, no current target.");
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

            // ------------ START: Mark character as deciphered in full display ------------
            const englishChar = morseToText(currentTargetMorseLetter);
            if (englishChar) {
                const targetSpan = document.querySelector(
                    `#full-book-morse-display .morse-char-span[data-word-idx="${currentWordIndex}"][data-letter-idx="${currentMorseLetterIndexInWord}"]`
                );
                if (targetSpan) {
                    targetSpan.textContent = englishChar;
                    targetSpan.classList.add('deciphered-char');
                } else {
                    console.warn(`Could not find span to mark as deciphered for word ${currentWordIndex}, letter ${currentMorseLetterIndexInWord}`);
                }
            }
            // ------------ END: Mark character as deciphered in full display ------------

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

    // Obsolete function displayCurrentSegment() was removed.
    // Obsolete function displayCurrentWordInUI() was removed.
    // Calls to these functions have also been removed from:
    // - loadProgress()
    // - initializeAndStartBookGame()
    // - setNextTargetMorseSignal()
    // UI updates for the target Morse character are now handled by setNextTargetMorseSignal()
    // and the full book display is managed by #full-book-morse-display.

    document.addEventListener('visualTapperInput', (event) => {
        const bookCipherTab = document.getElementById('book-cipher-tab');
        if (bookCipherTab && bookCipherTab.classList.contains('hidden')) {
            return; // Do nothing if the Book Cipher tab is not active
        }

        const detail = event.detail;
        if (!detail) return; // No detail object

        if (detail.type === 'char') {
            const morseFromTapper = detail.value;
            if (morseFromTapper) {
                // console.log('BookCipher: Received visualTapperInput type "char" with Morse:', morseFromTapper);
                handleBookCipherInput(morseFromTapper);
            }
        } else if (detail.type === 'word_space') {
            // console.log('BookCipher: Received visualTapperInput type "word_space".');
            const unlockedTextDisplay = document.getElementById('unlocked-text-display');
            if (unlockedTextDisplay) {
                // This case implies the user explicitly wants to add a space,
                // potentially before a word is fully completed or after a word.
                // The current handleBookCipherInput logic adds a space AFTER a word is correctly completed.
                // If a user adds a space via button, it might be for various reasons:
                // 1. They believe a word is done, but made a mistake and want to force a space.
                // 2. They are trying to skip a word (not supported by current logic directly).
                // 3. They finished a word correctly, and the game added a space, then they press space again.

                // For now, let's append a space to the display.
                // This might lead to double spaces if the game also adds one on word completion.
                // Or, if a word isn't complete, it might look like "PARTIALWOR D"
                // The current logic in `handleBookCipherInput` reconstructs `unlockedTextDisplay.textContent`
                // when a word is completed. So, a manually added space might be overwritten.

                // A simple append as requested:
                unlockedTextDisplay.textContent += ' ';

                // If this explicit space should also advance the word logic (e.g., skip current word):
                // This would be more complex. For now, just visual append.
                // Consider if `saveProgress` is needed here. If a space means "word complete",
                // then `handleBookCipherInput` should have handled it. If it's an extra space,
                // saving might not be critical unless it signifies something game-mechanic-wise.
                // Let's assume for now that if a word was completed, handleBookCipherInput did its job.
                // This explicit space is more like a user's manual text entry.
                // However, if the user taps space *instead* of finishing a letter, it might be meaningful.
                // The prompt implies simply appending to display.
                // Let's also save progress, as any user input that changes state should ideally be saveable.
                 if (currentBookId) {
                    saveProgress(currentBookId, isBookCompleted);
                 }
            }
        }
    });

    // Initial state for Morse IO: disabled until a book is successfully loaded
    // if(bookCipherMorseIO) bookCipherMorseIO.disabled = true; // Removed, as bookCipherMorseIO is removed

    if (returnToLibraryFromGameBtn) {
        returnToLibraryFromGameBtn.addEventListener('click', () => {
            console.log("'Return to Library' button clicked from game view.");
            if (currentBookId) { // currentBookId is a global in this file
                // isBookCompleted is also a global in this file
                saveProgress(currentBookId, isBookCompleted);
            }
            // detachSharedTapper is a global function from index.html
            if (typeof detachSharedTapper === 'function') {
                detachSharedTapper();
            } else {
                console.error("detachSharedTapper function not found. Tapper may not be handled correctly.");
            }
            // showBookLibraryView is defined in this file
            showBookLibraryView();
        });
    }

    // Populate the book library on DOMContentLoaded
    populateBookLibrary();
    // Set the initial view to the library
    showBookLibraryView();

    // --- Fireworks Function ---
    function launchFireworks() {
        const duration = 5 * 1000; // 5 seconds
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        function randomInRange(min, max) {
            return Math.random() * (max - min) + min;
        }

        const interval = setInterval(function() {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) {
                return clearInterval(interval);
            }
            const particleCount = 50 * (timeLeft / duration);
            // since particles fall down, start a bit higher than random
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
        }, 250);
    }
    // --- End Fireworks Function ---

    // --- Auto-Scroll Preference Logic ---
    const autoScrollToggle = document.getElementById('auto-scroll-toggle');
    const autoScrollStorageKey = 'bookCipherAutoScroll';

    function saveAutoScrollPreference(isEnabled) {
        try {
            localStorage.setItem(autoScrollStorageKey, JSON.stringify(isEnabled));
        } catch (e) {
            console.error("Could not save auto-scroll preference:", e);
        }
    }

    function loadAutoScrollPreference() {
        try {
            const storedPreference = localStorage.getItem(autoScrollStorageKey);
            if (storedPreference === null) {
                return true; // Default to true if not set
            }
            return JSON.parse(storedPreference);
        } catch (e) {
            console.error("Could not load auto-scroll preference, defaulting to true:", e);
            return true; // Default to true on error
        }
    }

    if (autoScrollToggle) {
        autoScrollToggle.checked = loadAutoScrollPreference();

        autoScrollToggle.addEventListener('input', () => {
            saveAutoScrollPreference(autoScrollToggle.checked);
            // Optionally, dispatch an event or call a function if other parts of the app need to react immediately
            // For example: document.dispatchEvent(new CustomEvent('autoScrollPreferenceChanged', { detail: { isEnabled: autoScrollToggle.checked } }));
            console.log("Auto-scroll preference changed to:", autoScrollToggle.checked);
        });
    } else {
        console.warn("#auto-scroll-toggle element not found.");
    }
    // --- End Auto-Scroll Preference Logic ---

    function restartBookDeciphering(bookId) {
        if (!bookId) {
            console.error("restartBookDeciphering: No bookId provided.");
            alert("Cannot restart book: No book identifier specified.");
            return;
        }

        const bookData = bookCipherBooks[bookId]; // Assumes bookCipherBooks is accessible (global or closure)
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
        // currentBookId, currentBookMorseContent, etc. are defined in the outer scope of DOMContentLoaded
        if (currentBookId === bookId) {
            currentBookMorseContent = '';
            fullMorseSequence = [];
            currentWordIndex = 0;
            currentMorseLetterIndexInWord = 0;
            currentTargetMorseLetter = '';
            isBookCompleted = false; // Explicitly mark as not completed

            const gameView = document.getElementById('book-game-view');
            if (gameView && !gameView.classList.contains('hidden')) {
                const unlockedTextDisplay = document.getElementById('unlocked-text-display');
                if (unlockedTextDisplay) unlockedTextDisplay.textContent = '-';

                const currentDecodedCharDisplay = document.getElementById('current-decoded-char');
                if (currentDecodedCharDisplay) currentDecodedCharDisplay.textContent = '-';

                const bookCipherMessageEl = document.getElementById('book-cipher-message');
                if (bookCipherMessageEl) bookCipherMessageEl.textContent = "Book progress has been reset.";
            }
        }

        // After resetting, simulate clicking the book in the library to refresh the details view
        // or go back to library if the element isn't found (less ideal, but a fallback)
        const detailsView = document.getElementById('book-details-view');
        if (detailsView) { // Check if detailsView itself exists
            detailsView.innerHTML = ''; // Clear current details view content

            // Find the book item in the library to simulate a click, which re-populates details view
            const bookElementInLibrary = document.querySelector(`#book-library-container .book-cover-item[data-book-id='${bookId}']`);
            if (bookElementInLibrary) {
                // Ensure it's not marked as selected if it was the one being reset, then click
                // bookElementInLibrary.classList.remove('book-cover-selected');
                // The click handler in populateBookLibrary should handle selection state.
                bookElementInLibrary.click(); // This re-triggers the detail view generation
            } else {
                // Fallback if the specific book item isn't found (e.g., library not populated or error)
                showBookLibraryView(); // Go back to the main library view
            }
        } else {
            // Fallback if the details view container itself doesn't exist
            showBookLibraryView();
        }
    }

    function displayUnlockedBookText(bookId) {
        const bookData = bookCipherBooks[bookId]; // Assumes bookCipherBooks is accessible
        if (!bookData) {
            console.error("displayUnlockedBookText: Invalid bookId or book data not found", bookId);
            alert("Could not load book text. Data is missing.");
            return;
        }

        // Use english_markdown directly if available
        if (bookData.english_markdown) {
            const markdownText = bookData.english_markdown;
            let htmlContent = "";
            if (typeof marked !== 'undefined' && typeof marked.parse === 'function') {
                htmlContent = marked.parse(markdownText);
            } else {
                console.error("marked.parse function not found. Displaying raw Markdown.");
                // Fallback: Display raw markdown with <pre> for basic formatting
                htmlContent = `<pre>${markdownText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`;
            }


            const modal = document.getElementById('unlocked-text-modal');
            const modalTitle = document.getElementById('unlocked-text-modal-title');
            const modalContentElement = document.getElementById('unlocked-text-modal-content'); // Renamed for clarity
            const closeModalBtn = document.getElementById('close-unlocked-text-modal-btn');

            if (modal && modalTitle && modalContentElement && closeModalBtn) {
                modalTitle.textContent = `Unlocked Text: ${bookData.title}`;
                modalContentElement.innerHTML = htmlContent; // Set innerHTML with parsed Markdown
                modal.classList.remove('hidden');

                // Ensure close button listener is attached only once
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
        } else if (bookData.filePath) { // Fallback to old method if english_markdown is not present
            console.warn(`displayUnlockedBookText: 'english_markdown' not found for bookId ${bookId}. Falling back to filePath.`);
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

                    let fullEnglishText = "";
                    if (typeof reversedMorseCode !== 'undefined') {
                        fullEnglishText = morseContent.split('/')
                            .map(morseWord => {
                                return morseWord.trim().split(' ')
                                    .map(morseChar => reversedMorseCode[morseChar] || '')
                                    .join('');
                            }).join(' ');
                    } else {
                        console.error("reversedMorseCode is not defined. Cannot translate Morse to English.");
                        fullEnglishText = "Error: Morse translation library not available.";
                    }


                    const modal = document.getElementById('unlocked-text-modal');
                    const modalTitle = document.getElementById('unlocked-text-modal-title');
                    const modalContent = document.getElementById('unlocked-text-modal-content');
                    const closeModalBtn = document.getElementById('close-unlocked-text-modal-btn');

                    if (modal && modalTitle && modalContent && closeModalBtn) {
                        modalTitle.textContent = `Unlocked Text: ${bookData.title}`;
                        // Display as plain text, as it's a fallback from Morse
                        modalContent.textContent = fullEnglishText.length > 0 ? fullEnglishText : "No text could be deciphered (book might be empty or in an unrecognized format).";
                        modal.classList.remove('hidden');

                        if (!closeModalBtn.dataset.listenerAttached) {
                            closeModalBtn.addEventListener('click', () => {
                                modal.classList.add('hidden');
                            });
                            closeModalBtn.dataset.listenerAttached = 'true';
                        }
                    } else {
                        console.error("Modal elements not found for displaying unlocked text (fallback path).");
                        alert("Error: Could not display the unlocked text. UI elements missing (fallback path).");
                    }
                })
                .catch(error => {
                    console.error('Error fetching or processing book content for displayUnlockedBookText (fallback path):', error);
                    alert(`Error loading book text (fallback path): ${error.message}`);
                });
        } else {
            console.error("displayUnlockedBookText: No 'english_markdown' or 'filePath' found for bookId", bookId);
            alert("Could not load book text. Data is incomplete.");
        }
    }
});
