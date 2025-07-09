window.bookCipherBooks = {
    // Free Books (first 3-5)
    'passage_1': {
        title: 'Sherlock Holmes Snippet',
        filePath: 'assets/book_cipher_texts/passage1_morse.txt',
        author: "Sir Arthur Conan Doyle",
        description: "A short snippet featuring the world's most famous detective.",
        isPro: false,
        english_markdown: "### The Adventures of Sherlock Holmes\n\n**To Sherlock Holmes she is always _the_ woman.**\n\nI have seldom heard him mention her under any other name. In his eyes she eclipses and predominates the whole of her sex. It was not that he felt any emotion akin to love for Irene Adler. All emotions, and that one particularly, were abhorrent to his cold, precise but admirably balanced mind.\n\n---\n\n*A Scandal in Bohemia*",
        genre: "Classic Detective",
        lengthCategory: "Short" // ~65 words
    },
    'mystery_intro': {
        title: 'Stormy Night Mystery',
        filePath: 'assets/book_cipher_texts/mystery_intro_morse.txt',
        author: "Placeholder Author",
        description: "The beginning of a thrilling mystery.",
        isPro: false,
        english_markdown: "### Chapter 1: The Gathering Storm\n\nThe wind howled like a banshee, rattling the ancient windowpanes of Blackwood Manor. Rain lashed down in relentless sheets, obscuring the winding path that led to the imposing oak door. Inside, a fire crackled in the grand hearth, casting flickering shadows on the faces of the assembled guests.\n\nEach had received a mysterious invitation. None knew why they were truly there.\n\n**Tonight, a secret will be revealed.**\n\n*Someone in this room is not who they claim to be...*",
        genre: "Mystery",
        lengthCategory: "Short" // ~70 words
    },
    'sci_fi_quote': {
        title: 'Sci-Fi Classic Quote',
        filePath: 'assets/book_cipher_texts/sci_fi_quote_morse.txt',
        author: "Placeholder Author",
        description: "A famous quote from a sci-fi classic.",
        isPro: false,
        genre: "Sci-Fi",
        lengthCategory: "Short"
    },
    'short_book': {
        title: 'Very Short Story',
        filePath: 'assets/book_cipher_texts/very_short_morse.txt',
        author: "Placeholder Author",
        description: "A very brief narrative for quick practice.",
        isPro: false,
        genre: "Fiction",
        lengthCategory: "Short"
    },
    'pride_and_prejudice': {
        title: 'Pride and Prejudice Quote',
        filePath: 'assets/book_cipher_texts/pride_and_prejudice_morse.txt',
        author: 'Jane Austen',
        description: 'A truth universally acknowledged, from Pride and Prejudice.',
        isPro: false,
        genre: "Classic Literature",
        lengthCategory: "Short"
    },

    // Pro Books
    'moby_dick': {
        title: 'Moby Dick Opening',
        filePath: 'assets/book_cipher_texts/moby_dick_morse.txt',
        author: 'Herman Melville',
        description: 'The famous opening line from Moby Dick.',
        isPro: true,
        genre: "Classic Literature",
        lengthCategory: "Short"
    },
    'dream_within_dream': {
        title: 'Poe - Dream Within a Dream',
        filePath: 'assets/book_cipher_texts/dream_within_dream_morse.txt',
        author: 'Edgar Allan Poe',
        description: 'A haunting line from an Edgar Allan Poe poem.',
        isPro: true,
        genre: "Poetry",
        lengthCategory: "Short"
    },
    'tale_of_two_cities': {
        title: 'Tale of Two Cities Intro',
        filePath: 'assets/book_cipher_texts/tale_of_two_cities_morse.txt',
        author: 'Charles Dickens',
        description: 'The iconic opening of A Tale of Two Cities.',
        isPro: true,
        genre: "Classic Literature",
        lengthCategory: "Medium" // It's a bit longer than a single line.
    },
    'hamlet': {
        title: 'Hamlet - To Be Or Not To Be',
        filePath: 'assets/book_cipher_texts/hamlet_morse.txt',
        author: 'William Shakespeare',
        description: 'The profound question from Shakespeare\'s Hamlet.',
        isPro: true,
        genre: "Classic Drama",
        lengthCategory: "Medium" // Famous soliloquy
    },
    'long_book': {
        title: 'The Grand Adventure (Long)',
        filePath: 'assets/book_cipher_texts/long_passage_morse.txt',
        author: "Placeholder Author",
        description: "A longer passage for extended practice.",
        isPro: true,
        genre: "Adventure",
        lengthCategory: "Long"
    },
    'empty_book': {
        title: 'Dev Test: Empty Book',
        filePath: 'assets/book_cipher_texts/empty_morse.txt',
        author: "Dev Team",
        description: "Test case: An empty book.",
        isPro: false,
        genre: "Test",
        lengthCategory: "Short"
    }, // Keep test books accessible
};
