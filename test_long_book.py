import sys
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import Select, WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

def run_test():
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--remote-debugging-port=9222")
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.set_capability('goog:loggingPrefs', {'browser': 'ALL'})

    driver = None 
    try:
        driver = webdriver.Chrome(options=chrome_options)
        wait = WebDriverWait(driver, 20) # Increased timeout for potentially longer loads

        results = {}
        errors = []
        console_severe_errors = []
        loading_delay_reported = False

        print("1. Navigating to http://localhost:8000/index.html")
        driver.get("http://localhost:8000/index.html")
        print("   Initial navigation done. Waiting for scripts to potentially load/initialize...")
        time.sleep(2) 

        print("2. Ensuring 'Book Cipher' tab is active by directly calling JavaScript showTab('book-cipher-tab')")
        driver.execute_script("showTab('book-cipher-tab');")
        print("   JavaScript showTab('book-cipher-tab') executed.")
        time.sleep(1) 

        book_cipher_tab_div = driver.find_element(By.ID, "book-cipher-tab")
        tab_class = book_cipher_tab_div.get_attribute("class")
        print(f"   Class of #book-cipher-tab after JS call: '{tab_class}'")
        if "hidden" in tab_class:
            errors.append("#book-cipher-tab was unexpectedly hidden after JS call")
            raise Exception("Book Cipher tab did not become visible.")

        print("3. Locating dropdown #book-selection")
        book_selection_dropdown_element = wait.until(EC.visibility_of_element_located((By.ID, "book-selection")))
        wait.until(EC.element_to_be_clickable((By.ID, "book-selection")))
        dropdown = Select(book_selection_dropdown_element)

        print("4. Selecting 'long_book' option")
        dropdown.select_by_value("long_book")
        time.sleep(0.5)

        print("5. Locating and clicking button #start-book-btn")
        start_button = wait.until(EC.element_to_be_clickable((By.ID, "start-book-btn")))
        
        start_time = time.time()
        start_button.click()
        print("   #start-book-btn clicked.")
        
        # Wait for book to load by checking for a change from the default or a known initial state
        # For a long book, the initial display might be many underscores.
        # Let's wait for the text not to be the placeholder "Choose a book" related text or the default "**** *** ****".
        # A more robust check would be to see if it's not empty or if it starts with underscores.
        wait.until(EC.visibility_of_element_located((By.ID, "target-text-display"))) # Ensure element is there
        
        # Wait for the target text to be populated with underscores, indicating loading has started/finished
        # We expect at least 20 underscores.
        wait.until(lambda d: d.find_element(By.ID, "target-text-display").text.startswith("____"))
        
        end_time = time.time()
        loading_time = end_time - start_time
        results["loading_time"] = loading_time
        print(f"   Book loading time: {loading_time:.2f} seconds.")
        loading_delay_reported = True


        # 6.a. Get initial text content of #target-text-display (first 20 chars)
        print("6.a. Getting initial text from #target-text-display")
        target_text_element = driver.find_element(By.ID, "target-text-display")
        initial_text = target_text_element.text
        results["initial_target_text_display"] = initial_text[:20]
        print(f"   Initial Target text (first 20 chars): '{results['initial_target_text_display']}'")

        # 6.b. Check if #book-cipher-morse-io is enabled
        print("6.b. Checking if #book-cipher-morse-io is enabled")
        book_cipher_io = driver.find_element(By.ID, "book-cipher-morse-io")
        results["book_cipher_io_enabled_initial"] = book_cipher_io.is_enabled()
        print(f"   Is #book-cipher-morse-io enabled? {results['book_cipher_io_enabled_initial']}")

        # 6.d. Simulate decoding of 'L'
        print("6.d. Simulating decoding of 'L' by dispatching 'visualTapperCharacterComplete' event with '.-..'")
        driver.execute_script("document.dispatchEvent(new CustomEvent('visualTapperCharacterComplete', { detail: { morseString: '.-..' } }));")
        print("   Event dispatched.")
        time.sleep(1) # Allow JS event handler to process

        # 6.e. Get updated text content of #target-text-display (first 20 chars)
        print("6.e. Waiting for #target-text-display to update (first char 'L')")
        wait.until(EC.text_to_be_present_in_element((By.ID, "target-text-display"), "L")) # Wait for 'L' to appear
        updated_text = driver.find_element(By.ID, "target-text-display").text
        results["updated_target_text_display"] = updated_text[:20]
        print(f"   Updated Target text (first 20 chars): '{results['updated_target_text_display']}'")
        
        # 6.f. Get text content of #unlocked-text-display
        print("6.f. Waiting for #unlocked-text-display to update to 'L'")
        wait.until(EC.text_to_be_present_in_element((By.ID, "unlocked-text-display"), "L"))
        results["unlocked_text_display"] = driver.find_element(By.ID, "unlocked-text-display").text
        print(f"   Unlocked text: '{results['unlocked_text_display']}'")

        # 6.c. Capture console errors
        print("6.c. Capturing console logs")
        log_entries = driver.get_log("browser")
        for entry in log_entries:
            if entry['level'] == 'SEVERE':
                print(f"   SEVERE Console Error: {entry['message']}")
                console_severe_errors.append(entry['message'])
        
        results["console_errors"] = console_severe_errors
        if not console_severe_errors:
            print("   No SEVERE console errors found.")
        else:
            non_favicon_errors = [e for e in console_severe_errors if "favicon.ico" not in e['message']]
            if not non_favicon_errors:
                print("   Only favicon.ico 404 error found in console.")
            else:
                print("   Other SEVERE console errors found:")
                for err_entry in non_favicon_errors:
                    print(f"     - {err_entry['message']}")

    except Exception as e:
        print(f"An error occurred during the test: {type(e).__name__}: {e}")
        errors.append(str(e))
        if driver: 
            try:
                driver.save_screenshot("error_screenshot.png")
                print("Screenshot saved as error_screenshot.png")
            except Exception as se:
                print(f"Could not save screenshot: {se}")
    finally:
        if driver: 
            driver.quit()
        print("Browser closed.")

    # --- Report Results ---
    print("\n--- Test Results ---")
    
    expected_initial_target_prefix = "____________________" # 20 underscores
    expected_updated_target_prefix = "L___________________" # L followed by 19 underscores
    expected_unlocked_text = "L"
    expected_io_enabled = True

    script_error_occurred = bool(errors)
    
    actual_initial_target = results.get('initial_target_text_display', 'N/A')
    actual_io_enabled = results.get('book_cipher_io_enabled_initial', None)
    actual_updated_target = results.get('updated_target_text_display', 'N/A')
    actual_unlocked_text = results.get('unlocked_text_display', 'N/A')
    actual_console_errors = results.get("console_errors", [])
    actual_loading_time = results.get("loading_time", -1)

    non_favicon_console_errors = [e for e in actual_console_errors if "favicon.ico" not in e['message']]

    all_steps_passed = not script_error_occurred and \
                       actual_initial_target == expected_initial_target_prefix and \
                       actual_io_enabled is expected_io_enabled and \
                       actual_updated_target == expected_updated_target_prefix and \
                       actual_unlocked_text == expected_unlocked_text and \
                       not non_favicon_console_errors

    if all_steps_passed:
        print("Test Status: SUCCESS")
    else:
        print("Test Status: FAILED")
        if script_error_occurred:
             print("Script execution errors:")
             for err in errors:
                print(f"- {err}")
        if actual_initial_target != expected_initial_target_prefix:
            print(f"  Assertion Failed for initial #target-text-display: Expected '{expected_initial_target_prefix}', Got '{actual_initial_target}'")
        if actual_io_enabled is not expected_io_enabled:
            print(f"  Assertion Failed for #book-cipher-morse-io enabled (initial): Expected {expected_io_enabled}, Got {actual_io_enabled}")
        if actual_updated_target != expected_updated_target_prefix:
            print(f"  Assertion Failed for updated #target-text-display: Expected '{expected_updated_target_prefix}', Got '{actual_updated_target}'")
        if actual_unlocked_text != expected_unlocked_text:
            print(f"  Assertion Failed for #unlocked-text-display: Expected '{expected_unlocked_text}', Got '{actual_unlocked_text}'")
        
        if non_favicon_console_errors:
            print("  Other SEVERE console errors found:")
            for err_entry_msg in non_favicon_console_errors:
                print(f"    - {err_entry_msg}")
        elif actual_console_errors:
             print("  Only favicon.ico 404 error found in console (considered acceptable).")

    print("\nDetails Reported:")
    if loading_delay_reported:
        print(f"a. Loading delay for 'long_book': {actual_loading_time:.2f} seconds.")
    else:
        print("a. Loading delay for 'long_book': Not measured due to earlier error.")
    print(f"b. Initial text content of #target-text-display (first 20): '{actual_initial_target}' (Expected: '{expected_initial_target_prefix}')")
    print(f"c. Is #book-cipher-morse-io enabled (initial)? {actual_io_enabled} (Expected: {expected_io_enabled})")
    print(f"d. Browser developer console (SEVERE errors):")
    if actual_console_errors:
        for err_entry_msg in actual_console_errors: # Iterate directly over messages if that's what's stored
            print(f"  - {err_entry_msg}")
    elif "console_errors" in results and not results["console_errors"]:
        print("  No SEVERE console errors found.")
    else: 
        print("  Console logs not captured.")
    print(f"e. Event 'visualTapperCharacterComplete' with '.-..' (L) dispatched.")
    print(f"f. Updated text content of #target-text-display (first 20): '{actual_updated_target}' (Expected: '{expected_updated_target_prefix}')")
    print(f"g. Text content of #unlocked-text-display: '{actual_unlocked_text}' (Expected: '{expected_unlocked_text}')")

if __name__ == "__main__":
    run_test()
