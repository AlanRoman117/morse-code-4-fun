import re
import os
import json # For a slightly more robust way to parse the inner JS object

def parse_book_data_js(file_path="src/js/data/bookData.js"):
    """
    Parses the bookData.js file to extract book information.
    Returns a list of dictionaries, where each dictionary contains:
    'key': book_key,
    'filePath': filePath string,
    'english_markdown': english_markdown string
    """
    books = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"Error: File not found at {file_path}")
        return books

    # Isolate the bookCipherBooks object content
    # This regex looks for "window.bookCipherBooks = {" and captures everything until the matching "};"
    # It handles nested braces by being non-greedy with .*? and looking for the specific end pattern.
    match = re.search(r"window\.bookCipherBooks\s*=\s*(\{.*?\n\});", content, re.DOTALL)
    if not match:
        print("Error: Could not find window.bookCipherBooks object in the file.")
        return books

    object_str = match.group(1)

    # Regex to capture each book entry.
    # It looks for "'book_key': {" or "\"book_key\": {"
    # Then captures the content of the book's object.
    # This is tricky because of nested braces and varying quote styles for keys.
    # We'll try to extract individual book blocks first.
    # Entry pattern: "'key': { ... }," or "'key': { ... }" (optional comma at the end)
    # Using a simpler regex for the entry key and then trying to parse its value block.

    # Pattern to find each book entry like: 'passage_1': { ... },
    # It captures the book key and the entire object string for that book.
    entry_pattern = re.compile(
        r"(['\"])(?P<key>[a-zA-Z0-9_]+)\1\s*:\s*(\{.*?\})(?=\s*,|\s*\n\})",
        re.DOTALL
    )

    for entry_match in entry_pattern.finditer(object_str):
        book_key = entry_match.group('key')
        book_object_content = entry_match.group(3) # The { ... } block

        current_book_data = {'key': book_key}

        # Extract filePath (mandatory)
        fp_match = re.search(r"filePath\s*:\s*['\"](?P<path>.*?)['\"]", book_object_content)
        if fp_match:
            current_book_data['filePath'] = fp_match.group('path')
        else:
            print(f"Warning: Could not find filePath for book key '{book_key}'. Skipping this entry.")
            continue

        # Attempt to extract englishSourcePath first
        esp_match = re.search(r"englishSourcePath\s*:\s*['\"](?P<path>.*?)['\"]", book_object_content)
        if esp_match:
            current_book_data['englishSourcePath'] = esp_match.group('path')
            current_book_data['english_markdown'] = None # Will be loaded from JSON later
        else:
            # If no englishSourcePath, try to find inline english_markdown (for backward compatibility)
            em_match = re.search(
                r"english_markdown\s*:\s*(?:"
                r"'(?P<single_quoted>(?:\\.|[^'])*)'"
                r'|"(?P<double_quoted>(?:\\.|[^"])*)"'
                r'|`(?P<backticked>(?:\\`|[^`])*)`'
                r")",
                book_object_content, re.DOTALL
            )
            if em_match:
                if em_match.group('single_quoted') is not None:
                    markdown_text = em_match.group('single_quoted')
                    markdown_text = bytes(markdown_text, "utf-8").decode("unicode_escape")
                elif em_match.group('double_quoted') is not None:
                    markdown_text = em_match.group('double_quoted')
                    markdown_text = bytes(markdown_text, "utf-8").decode("unicode_escape")
                elif em_match.group('backticked') is not None:
                    markdown_text = em_match.group('backticked')
                    markdown_text = bytes(markdown_text, "utf-8").decode("unicode_escape")
                else:
                    print(f"Warning: Inline english_markdown found for '{book_key}' but content extraction failed.")
                    markdown_text = ""
                current_book_data['english_markdown'] = markdown_text
            else:
                # Neither englishSourcePath nor english_markdown found
                print(f"Warning: Could not find 'englishSourcePath' or 'english_markdown' for book key '{book_key}'. Content will be empty.")
                current_book_data['english_markdown'] = "" # Default to empty string if neither found
            current_book_data['englishSourcePath'] = None # Ensure it's None if inline markdown was used or none found

        books.append(current_book_data)

    return books

if __name__ == '__main__':
    # Test the parser
    extracted_books = parse_book_data_js()
    if extracted_books:
        print(f"\nSuccessfully parsed {len(extracted_books)} books:")
        for i, book in enumerate(extracted_books):
            print(f"\nBook {i+1}:")
            print(f"  Key: {book['key']}")
            print(f"  Morse File Path: {book.get('filePath')}") # Use .get for safety

            source_path = book.get('englishSourcePath')
            inline_markdown = book.get('english_markdown')

            if source_path:
                print(f"  English Source JSON: {source_path}")
            elif inline_markdown is not None: # Check for None, as "" is a valid (empty) markdown
                markdown_snippet = inline_markdown[:100].replace('\n', '\\n') + "..." if len(inline_markdown) > 100 else inline_markdown.replace('\n', '\\n')
                print(f"  Inline Markdown (Snippet): {markdown_snippet}")
            else:
                 print(f"  Content Source: Neither JSON path nor inline markdown found by parser (or sourcePath was present).")
    else:
        print("No books were parsed.")

    # Morse code map based on src/js/main.js and finalized conventions
    MORSE_CODE_MAP = {
        'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.', 'G': '--.', 'H': '....',
        'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---', 'P': '.--.',
        'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
        'Y': '-.--', 'Z': '--..',
        '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
        '8': '---..', '9': '----.', '0': '-----',
        '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--', '/': '-..-.',
        '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-',
        '+': '.-.-.', '-': '-....-', '_': '..--.-', '"': '.-..-.', '$': '...-..-', '@': '.--.-.-',
        ' ': '/'  # Special case: English space maps to a single slash for word separation marker
    }

    def english_to_morse(text: str) -> str:
        """
        Converts an English text string to its Morse code representation.
        - Text is converted to uppercase.
        - Each character's Morse code is retrieved from MORSE_CODE_MAP.
        - English spaces are converted to '/'.
        - Unrecognized characters are ignored.
        - Morse codes (and slashes for word breaks) are joined by a single space.
        - Leading/trailing spaces on the output are trimmed.
        """
        if not text:
            return ""

        words = text.upper().split(' ') # Split by space to handle words first
        morse_words = []

        for word in words:
            if not word: # Handles multiple spaces between words leading to empty strings
                continue

            char_morse_list = []
            for char_in_word in word:
                morse_char = MORSE_CODE_MAP.get(char_in_word)
                if morse_char: # If character is in our map (A-Z, 0-9, punctuation)
                    char_morse_list.append(morse_char)
                # else: character is ignored

            if char_morse_list: # If the word had any translatable characters
                 morse_words.append(" ".join(char_morse_list))

        # Join words with " / " separator
        # The problem with `MORSE_CODE_MAP[' '] = '/'` and then `join(' ')` on all characters
        # is that it will produce "char / char" instead of "char / char".
        # The JS code `text.toUpperCase().split('').map(char => morseCode[char] || (char === ' ' ? '/' : '')).join(' ');`
        # effectively does this:
        # "HI THERE" -> ['H', 'I', ' ', 'T', 'H', 'E', 'R', 'E']
        # map -> ['....', '..', '/', '-', '....', '.', '.-.', '.']
        # join(' ') -> ".... .. / - .... . .-. ."
        # This means a single English space becomes a single '/' in the list of morse characters,
        # and then the join(' ') adds spaces around it.

        # Let's replicate the JS logic more closely for direct compatibility.
        morse_parts = []
        for char_code in text.upper():
            morse_signal = MORSE_CODE_MAP.get(char_code)
            if morse_signal: # This includes ' ' mapping to '/'
                morse_parts.append(morse_signal)
            # If char_code is not in MORSE_CODE_MAP (and isn't a space), it's skipped.

        # Join all mapped parts (Morse signals and '/' for spaces) with a single space.
        return " ".join(morse_parts).strip()


    # Test the Morse translation
    print("\nTesting Morse Translation:")
    test_cases = {
        "HELLO WORLD": ".... . .-.. .-.. --- / .-- --- .-. .-.. -..",
        "SOS": "... --- ...",
        "Python Test 123!": ".--. -.-- - .... --- -. / - . ... - / .---- ..--- ...-- -.-.--",
        "A B": ".- / -...",
        # Corrected expected output for leading/trailing spaces to match JS logic
        "  Leading and trailing spaces  ": "/ / .-.. . .- -.. .. -. --. / .- -. -.. / - .-. .- .. .-.. .. -. --. / ... .--. .- -.-. . ... / /",
        "Unknown? Char*": "..- -. -.- -. --- .-- -. ..--.. / -.-. .... .- .-.", # * should be ignored
        "": "",
        "JustOneWord": ".--- ..- ... - --- -. . .-- --- .-. -.."
    }

    all_tests_passed = True
    for text, expected_morse in test_cases.items():
        actual_morse = english_to_morse(text)
        is_correct = (actual_morse == expected_morse)
        if not is_correct:
            all_tests_passed = False
        print(f"  Input: \"{text}\"")
        print(f"  Expected: \"{expected_morse}\"")
        print(f"  Actual:   \"{actual_morse}\" --- {'OK' if is_correct else 'FAIL'}")
        if not is_correct:
            # For debugging the "Leading and trailing spaces" case specifically
            if "Leading" in text:
                js_equiv_parts = []
                for char_code_debug in text.upper():
                    m_signal = MORSE_CODE_MAP.get(char_code_debug)
                    if m_signal: js_equiv_parts.append(m_signal)
                print(f"    JS Equiv Parts: {js_equiv_parts}")
                print(f"    JS Equiv Joined: \"{' '.join(js_equiv_parts)}\"")

    print("\n--- Starting File Generation ---")
    if extracted_books:
        generated_count = 0
        for book in extracted_books:
            book_key = book['key']
            print(f"\nProcessing book: {book_key}")

            english_content_for_morse = "" # Default to empty

            if book.get('englishSourcePath'):
                source_json_path_relative = book['englishSourcePath'].lstrip('/')
                source_json_path_full = os.path.join("src", source_json_path_relative)
                print(f"  Attempting to load English content from JSON: {source_json_path_full}")
                try:
                    with open(source_json_path_full, 'r', encoding='utf-8') as f_json:
                        json_data = json.load(f_json)
                        english_content_for_morse = json_data.get("content_markdown", "")
                        if not english_content_for_morse and "content_markdown" not in json_data:
                            print(f"  Warning: 'content_markdown' key missing in {source_json_path_full}. Using empty content.")
                        elif not english_content_for_morse:
                             print(f"  Info: 'content_markdown' is empty in {source_json_path_full}.")
                except FileNotFoundError:
                    print(f"  Error: JSON file not found: {source_json_path_full}. Using empty content.")
                except json.JSONDecodeError:
                    print(f"  Error: Could not decode JSON from {source_json_path_full}. Using empty content.")
                except Exception as e:
                    print(f"  Error reading or parsing JSON {source_json_path_full}: {e}. Using empty content.")

            elif book.get('english_markdown') is not None: # Check for None, as "" is valid empty string
                print(f"  Using inline 'english_markdown' for '{book_key}'.")
                english_content_for_morse = book['english_markdown']
            else:
                # This case should ideally be caught by the parser, which defaults 'english_markdown' to ""
                # if neither sourcePath nor inline markdown is found.
                # However, an explicit check here is fine.
                print(f"  Warning: No English content source (JSON path or inline markdown) found for '{book_key}'. Morse file will be empty.")
                # english_content_for_morse remains ""

            morse_output = english_to_morse(english_content_for_morse)

            # Construct full path for the output Morse file
            # filePaths in bookData.js are like 'assets/book_cipher_texts/file.txt'
            # The script runs from the repo root, so we prepend 'src/'
            relative_path = book['filePath'].lstrip('/') # Ensure no leading slash if present
            output_file_path = os.path.join("src", relative_path)
            output_dir = os.path.dirname(output_file_path)

            try:
                if not os.path.exists(output_dir):
                    os.makedirs(output_dir)
                    print(f"  Created directory: {output_dir}")
            except OSError as e:
                print(f"  Error creating directory {output_dir}: {e}. Skipping this book.")
                continue

            try:
                with open(output_file_path, 'w', encoding='utf-8') as f_out:
                    f_out.write(morse_output)
                print(f"  Successfully wrote Morse code to: {output_file_path}")
                generated_count +=1
            except IOError as e:
                print(f"  Error writing file {output_file_path}: {e}")
        print(f"\n--- File Generation Complete ---")
        print(f"Generated {generated_count} Morse files out of {len(extracted_books)} total books processed.")
    else:
        print("No books were parsed, so no files were generated.")

    print("\nScript execution finished.")
