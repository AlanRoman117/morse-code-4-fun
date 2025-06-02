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
        wait = WebDriverWait(driver, 15) 

        results = {}
        errors = []
        console_severe_errors = []

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

        print("4. Selecting 'short_book' option")
        dropdown.select_by_value("short_book")
        time.sleep(0.5)

        print("5. Locating and clicking button #start-book-btn")
        start_button = wait.until(EC.element_to_be_clickable((By.ID, "start-book-btn")))
        start_button.click()
        print("   #start-book-btn clicked.")
        
        print("   Waiting for book to load (target-text-display to change to '__')...")
        wait.until(EC.text_to_be_present_in_element((By.ID, "target-text-display"), "__"))
        print("   Book loaded.")

        # 6.a. Get initial text content of #target-text-display
        print("6.a. Getting initial text from #target-text-display")
        target_text_element = driver.find_element(By.ID, "target-text-display")
        results["initial_target_text_display"] = target_text_element.text
        print(f"   Initial Target text: '{results['initial_target_text_display']}'")

        # 6.b. Check if #book-cipher-morse-io is enabled
        print("6.b. Checking if #book-cipher-morse-io is enabled")
        book_cipher_io = driver.find_element(By.ID, "book-cipher-morse-io")
        results["book_cipher_io_enabled_initial"] = book_cipher_io.is_enabled()
        print(f"   Is #book-cipher-morse-io enabled? {results['book_cipher_io_enabled_initial']}")

        # 6.d. Simulate decoding of 'H'
        print("6.d. Simulating decoding of 'H' by dispatching 'visualTapperCharacterComplete' event with '....'")
        driver.execute_script("document.dispatchEvent(new CustomEvent('visualTapperCharacterComplete', { detail: { morseString: '....' } }));")
        print("   Event dispatched.")
        time.sleep(1) # Allow JS event handler to process

        # 6.e. Get updated text content of #target-text-display
        print("6.e. Waiting for #target-text-display to update to 'H_'")
        wait.until(EC.text_to_be_present_in_element((By.ID, "target-text-display"), "H_"))
        results["updated_target_text_display"] = driver.find_element(By.ID, "target-text-display").text
        print(f"   Updated Target text: '{results['updated_target_text_display']}'")
        
        # 6.f. Get text content of #unlocked-text-display
        print("6.f. Waiting for #unlocked-text-display to update to 'H'")
        wait.until(EC.text_to_be_present_in_element((By.ID, "unlocked-text-display"), "H"))
        results["unlocked_text_display"] = driver.find_element(By.ID, "unlocked-text-display").text
        print(f"   Unlocked text: '{results['unlocked_text_display']}'")

        # 6.c. Capture console errors (done at the end of try block)
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
            # Filter out favicon error for reporting purposes
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
    
    expected_initial_target = "__"
    expected_updated_target = "H_"
    expected_unlocked_text = "H"
    expected_io_enabled = True

    script_error_occurred = bool(errors)
    
    actual_initial_target = results.get('initial_target_text_display', 'N/A')
    actual_io_enabled = results.get('book_cipher_io_enabled_initial', None)
    actual_updated_target = results.get('updated_target_text_display', 'N/A')
    actual_unlocked_text = results.get('unlocked_text_display', 'N/A')
    # Use the filtered list for checking success
    final_console_errors_for_check = [e for e in console_severe_errors if "favicon.ico" not in e['message']]


    all_steps_passed = not script_error_occurred and \
                       actual_initial_target == expected_initial_target and \
                       actual_io_enabled is expected_io_enabled and \
                       actual_updated_target == expected_updated_target and \
                       actual_unlocked_text == expected_unlocked_text and \
                       not final_console_errors_for_check

    if all_steps_passed:
        print("Test Status: SUCCESS")
    else:
        print("Test Status: FAILED")
        if script_error_occurred:
             print("Script execution errors:")
             for err in errors:
                print(f"- {err}")
        if actual_initial_target != expected_initial_target:
            print(f"  Assertion Failed for initial #target-text-display: Expected '{expected_initial_target}', Got '{actual_initial_target}'")
        if actual_io_enabled is not expected_io_enabled: # Note: is_enabled() returns True/False, not string "true"
            print(f"  Assertion Failed for #book-cipher-morse-io enabled (initial): Expected {expected_io_enabled}, Got {actual_io_enabled}")
        if actual_updated_target != expected_updated_target:
            print(f"  Assertion Failed for updated #target-text-display: Expected '{expected_updated_target}', Got '{actual_updated_target}'")
        if actual_unlocked_text != expected_unlocked_text:
            print(f"  Assertion Failed for #unlocked-text-display: Expected '{expected_unlocked_text}', Got '{actual_unlocked_text}'")
        
        if final_console_errors_for_check:
            print("  Other SEVERE console errors found:")
            for err_entry_msg in final_console_errors_for_check:
                print(f"    - {err_entry_msg}")
        elif console_severe_errors: # Implies only favicon errors if non_favicon_console_errors is empty
             print("  Only favicon.ico 404 error found in console (considered acceptable).")


    print("\nDetails Reported:")
    print(f"a. Initial text content of #target-text-display: '{actual_initial_target}' (Expected: '{expected_initial_target}')")
    print(f"b. Is #book-cipher-morse-io enabled (initial)? {actual_io_enabled} (Expected: {expected_io_enabled})")
    print("c. Browser developer console (SEVERE errors):")
    if console_severe_errors: # Print all captured severe errors
        for err_entry in console_severe_errors:
            print(f"  - {err_entry['message']}") # Access message attribute
    elif "console_errors" in results and not results["console_errors"]: 
        print("  No SEVERE console errors found.")
    else: 
        print("  Console logs not captured (likely due to an earlier script error or no errors).")
    print(f"d. Event 'visualTapperCharacterComplete' with '....' dispatched.")
    print(f"e. Updated text content of #target-text-display: '{actual_updated_target}' (Expected: '{expected_updated_target}')")
    print(f"f. Text content of #unlocked-text-display: '{actual_unlocked_text}' (Expected: '{expected_unlocked_text}')")

if __name__ == "__main__":
    run_test()
