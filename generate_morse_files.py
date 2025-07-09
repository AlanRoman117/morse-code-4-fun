import os
import json
import glob # For scanning directories
import re # For markdown pre-processing

# --- Constants ---
# Absolute path to the directory where this script is located
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
# Absolute path to the src directory
SRC_DIR = os.path.join(SCRIPT_DIR, "src")

ENGLISH_SOURCES_DIR = os.path.join(SRC_DIR, "assets", "book_cipher_texts", "english_sources")
MORSE_CODE_BASE_DIR = os.path.join(SRC_DIR, "assets", "book_cipher_texts")
BOOK_DATA_JS_PATH = os.path.join(SRC_DIR, "js", "data", "bookData.js")

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
    ' ': '/'  # English space maps to a single slash for word separation marker
}

# --- Helper Functions ---
def english_to_morse(text: str) -> str:
    """Converts English text to Morse code."""
    if not text:
        return ""
    morse_parts = []
    for char_code in text.upper():
        morse_signal = MORSE_CODE_MAP.get(char_code)
        if morse_signal: # This includes ' ' mapping to '/'
            morse_parts.append(morse_signal)
    return " ".join(morse_parts).strip()

def format_js_string(value):
    """Formats a Python string for a JavaScript string literal, escaping necessary characters."""
    if value is None:
        return 'null' # Or 'undefined' if more appropriate, but null is safer for JSON-like data
    # Escape backslashes, single quotes, and newlines
    escaped = value.replace('\\', '\\\\').replace("'", "\\'").replace('\n', '\\n').replace('\r', '')
    return f"'{escaped}'"

def format_js_value(value):
    """Formats a Python value into its JavaScript string representation."""
    if isinstance(value, str):
        return format_js_string(value)
    if isinstance(value, bool):
        return str(value).lower() # 'true' or 'false'
    if value is None: # Check for None specifically for english_markdown when englishSourcePath is used
        return 'null'
    return json.dumps(value) # Handles numbers, lists, dicts (though we don't expect complex dicts here)


# --- Main Script Logic ---
def main():
    print(f"Script directory: {SCRIPT_DIR}")
    print(f"Source directory: {SRC_DIR}")
    print(f"Looking for English source JSON files in: {ENGLISH_SOURCES_DIR}")

    if not os.path.isdir(ENGLISH_SOURCES_DIR):
        print(f"Error: English sources directory not found at {ENGLISH_SOURCES_DIR}")
        print("Please create it and add your book JSON files there.")
        return

    all_book_data_for_js = {}
    json_file_paths = glob.glob(os.path.join(ENGLISH_SOURCES_DIR, "*.json"))

    if not json_file_paths:
        print(f"No JSON files found in {ENGLISH_SOURCES_DIR}. No books to process.")
    else:
        print(f"Found {len(json_file_paths)} JSON files to process.")

    for json_path in json_file_paths:
        book_key = os.path.splitext(os.path.basename(json_path))[0]
        print(f"\nProcessing book: {book_key} (from {json_path})")

        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except FileNotFoundError:
            print(f"  Error: JSON file disappeared or is not accessible: {json_path}")
            continue
        except json.JSONDecodeError:
            print(f"  Error: Could not decode JSON from {json_path}")
            continue
        except Exception as e:
            print(f"  Error reading JSON file {json_path}: {e}")
            continue

        # Validate required fields from JSON
        title = data.get("title")
        content_markdown = data.get("content_markdown")

        if title is None:
            print(f"  Warning: 'title' is missing in {json_path}. Skipping this book.")
            continue
        if content_markdown is None: # Allow empty string for content_markdown, but not missing key
            print(f"  Warning: 'content_markdown' key is missing in {json_path}. Using empty content for Morse generation.")
            content_markdown = ""

        # Pre-process markdown for Morse generation: replace newlines with spaces
        # This helps ensure paragraph breaks in markdown become word separations for Morse.
        text_for_morse_conversion = content_markdown # Default to original if no processing needed
        if content_markdown: # Only process if there's content
            # Replace various newline combinations (and any surrounding whitespace) with a single space
            text_for_morse_conversion = re.sub(r'\s*[\r\n]+\s*', ' ', content_markdown).strip()
            # Optional: remove other markdown syntax if necessary, though Morse converter ignores unknown chars
            # text_for_morse_conversion = re.sub(r'[#*_`]', '', text_for_morse_conversion)

        # Generate Morse code
        morse_code = english_to_morse(text_for_morse_conversion)
        morse_filename = f"{book_key}_morse.txt"
        # Ensure MORSE_CODE_BASE_DIR exists
        if not os.path.exists(MORSE_CODE_BASE_DIR):
            os.makedirs(MORSE_CODE_BASE_DIR)
            print(f"  Created directory: {MORSE_CODE_BASE_DIR}")

        morse_file_path_abs = os.path.join(MORSE_CODE_BASE_DIR, morse_filename)

        try:
            with open(morse_file_path_abs, 'w', encoding='utf-8') as f_morse:
                f_morse.write(morse_code)
            print(f"  Successfully wrote Morse code to: {morse_file_path_abs}")
        except IOError as e:
            print(f"  Error writing Morse file {morse_file_path_abs}: {e}")
            continue # Skip adding this book to bookData.js if Morse file fails

        # Prepare data for bookData.js
        # Path relative to src/js/data/ for bookData.js
        # MORSE_CODE_BASE_DIR is 'src/assets/book_cipher_texts'
        # englishSourcePath is 'assets/book_cipher_texts/english_sources/book_key.json'

        # Derive paths relative to where bookData.js expects them (usually relative to `src/`)
        # englishSourcePath_for_js needs to be relative to the `src` folder.
        # json_path is absolute. SRC_DIR is absolute.
        relative_english_source_path = os.path.relpath(json_path, SRC_DIR).replace(os.sep, '/')

        # morse_file_path_abs is '.../src/assets/book_cipher_texts/key_morse.txt'
        # MORSE_CODE_BASE_DIR is '.../src/assets/book_cipher_texts'
        # So, morse_filename is 'key_morse.txt'
        # The path in bookData.js should be 'assets/book_cipher_texts/key_morse.txt'
        # MORSE_CODE_BASE_DIR already starts with 'src/' effectively, so we need its path part after 'src/'
        # MORSE_CODE_BASE_DIR = os.path.join(SRC_DIR, "assets", "book_cipher_texts")
        # morse_file_path_for_js = os.path.join(os.path.basename(MORSE_CODE_BASE_DIR), morse_filename).replace(os.sep, '/')

        # Correct derivation of paths for bookData.js (relative to src/)
        # Path to the morse file, relative to SRC_DIR
        derived_morse_filePath_for_js = os.path.relpath(morse_file_path_abs, SRC_DIR).replace(os.sep, '/')


        book_entry_for_js = {
            "title": title,
            "author": data.get("author", "Unknown Author"),
            "description": data.get("description", "No description available."),
            "isPro": data.get("isPro", False), # Default to False if not specified
            "genre": data.get("genre", "General"),
            "lengthCategory": data.get("lengthCategory", "Medium"),
            "imagePath": data.get("imagePath", f"assets/images/covers/{book_key}_placeholder.png"), # Default placeholder
            "filePath": derived_morse_filePath_for_js, # Path to the generated Morse .txt file
            "englishSourcePath": relative_english_source_path # Path to its own JSON source
        }
        all_book_data_for_js[book_key] = book_entry_for_js

    # Generate the content for bookData.js
    print(f"\nGenerating {BOOK_DATA_JS_PATH}...")
    js_object_parts = []
    for key, book_obj in all_book_data_for_js.items():
        js_book_entry_parts = [f"        '{js_key}': {format_js_value(js_val)}"  # Ensure keys are quoted
                               for js_key, js_val in book_obj.items()]
        js_object_parts.append(f"    '{key}': {{\n{',\n'.join(js_book_entry_parts)}\n    }}")

    book_data_js_content = "window.bookCipherBooks = {\n"
    book_data_js_content += ",\n".join(js_object_parts)
    book_data_js_content += "\n};\n"

    try:
        with open(BOOK_DATA_JS_PATH, 'w', encoding='utf-8') as f_js:
            f_js.write(book_data_js_content)
        print(f"Successfully wrote {BOOK_DATA_JS_PATH}")
    except IOError as e:
        print(f"Error writing {BOOK_DATA_JS_PATH}: {e}")

    print("\nScript execution finished.")

if __name__ == '__main__':
    # Self-tests for Morse translation (can be kept or removed for production script)
    print("Running Morse Translation Self-tests:")
    test_cases = {
        "HELLO WORLD": ".... . .-.. .-.. --- / .-- --- .-. .-.. -..", "SOS": "... --- ...",
        "Python Test 123!": ".--. -.-- - .... --- -. / - . ... - / .---- ..--- ...-- -.-.--",
        "A B": ".- / -...",
        "  Leading and trailing spaces  ": "/ / .-.. . .- -.. .. -. --. / .- -. -.. / - .-. .- .. .-.. .. -. --. / ... .--. .- -.-. . ... / /",
        "Unknown? Char*": "..- -. -.- -. --- .-- -. ..--.. / -.-. .... .- .-.", "": "",
        "JustOneWord": ".--- ..- ... - --- -. . .-- --- .-. -.."
    }
    all_tests_passed = True
    for text, expected_morse in test_cases.items():
        actual_morse = english_to_morse(text)
        is_correct = (actual_morse == expected_morse)
        if not is_correct: all_tests_passed = False
        print(f"  Input: \"{text}\" -> Expected: \"{expected_morse}\" -> Actual: \"{actual_morse}\" --- {'OK' if is_correct else 'FAIL'}")
    if all_tests_passed: print("All Morse translation self-tests PASSED.\n")
    else: print("Some Morse translation self-tests FAILED.\n")

    main()
