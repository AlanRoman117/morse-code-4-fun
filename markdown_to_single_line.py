import sys
import os
import json

def markdown_to_single_line(file_path):
    """
    Reads a markdown file and converts its content into a single line.
    Newlines are replaced with spaces. Content is then prepared as a JSON string literal.
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Replace actual newlines with a space
        single_line_content = content.replace('\n', ' ')

        # Further escape for JSON:
        # json.dumps will handle escaping backslashes, quotes, etc.
        # and will wrap the string in double quotes.
        json_compatible_string = json.dumps(single_line_content)

        # We want the raw string content for manual insertion,
        # so we print the result of json.dumps, but without the outer quotes.
        # However, the request was to make it easy to add to "content_markdown": "",
        # which implies the output should be the string content itself, ready for JSON.
        # json.dumps(content.replace('\n', '\\n')) would be more direct if the goal is a string
        # literal that itself contains escaped newlines.
        # Let's re-evaluate: "transform it into a single line, so that I can add it to the json ["content_markdown": ""] manually."
        # This means the output should be a valid JSON string *value*.
        # If the markdown is:
        # Line 1
        # Line 2
        # The desired output for JSON "content_markdown": "output" should be "Line 1 Line 2"
        # If the markdown itself contains quotes or backslashes, they need to be escaped.

        # Correct approach:
        # 1. Replace newlines in the original content with literal '\n' characters (for JSON string representation)
        #    No, the user wants a *single line* of text, not a string with escaped newlines.
        #    So, "Line 1\nLine 2" becomes "Line 1 Line 2".

        # Let's stick to replacing newlines with spaces.
        # Then, to make it safe for JSON, we should escape special characters like quotes and backslashes.

        # Step 1: Replace newlines with spaces to make it a "single line" visually.
        processed_content = content.replace('\r\n', ' ').replace('\n', ' ')

        # Step 2: Escape characters that need escaping for a JSON string.
        # json.dumps does this perfectly. It will produce a string like:
        # "\"Line 1 Line 2\"" if the content was "Line 1\nLine 2"
        # or "\"This is a line with a \\\"quote\\\" and a \\\\backslash\\\\.\""
        # The user wants to *manually* add it. So they likely want the *content* of the JSON string.

        # If content is: Hello\nWorld "quotes"
        # single_line_content becomes: Hello World "quotes"
        # If we print this directly, and they paste it into "content_markdown": "Hello World "quotes"", it's invalid JSON.
        # It needs to be "content_markdown": "Hello World \"quotes\""

        # So, the script should output the string *value* that is JSON-safe.
        final_output = processed_content.replace('\\', '\\\\').replace('"', '\\"')
        print(final_output)

    except FileNotFoundError:
        print(f"Error: File not found at '{file_path}'", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"An error occurred: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python markdown_to_single_line.py <path_to_markdown_file>", file=sys.stderr)
        sys.exit(1)

    markdown_file_path = sys.argv[1]
    markdown_to_single_line(markdown_file_path)
