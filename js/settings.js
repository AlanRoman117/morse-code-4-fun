document.addEventListener('DOMContentLoaded', () => {
    const unitTimeInput = document.getElementById('unit-time-input');
    const currentUnitTimeDisplay = document.getElementById('current-unit-time-display');

    // Check if the necessary elements are found
    if (!unitTimeInput || !currentUnitTimeDisplay) {
        console.error("Settings U.I. elements (unit-time-input or current-unit-time-display) not found. Settings script will not initialize.");
        return;
    }

    // Function to update the settings UI elements
    function updateSettingsUI(value) {
        if (value === undefined || value === null) {
            console.warn("updateSettingsUI called with undefined or null value.");
            return;
        }
        const numericValue = parseInt(value);
        if (isNaN(numericValue)) {
            console.warn("updateSettingsUI called with a non-numeric value:", value);
            return;
        }
        unitTimeInput.value = numericValue.toString();
        currentUnitTimeDisplay.textContent = numericValue.toString();
    }

    // Initialize the UI with the current UNIT_TIME_MS from visualTapper.js
    // This relies on UNIT_TIME_MS being a global variable (e.g., window.UNIT_TIME_MS or declared with var/let at top scope of visualTapper.js)
    // and visualTapper.js having executed its localStorage load logic.
    if (typeof UNIT_TIME_MS !== 'undefined') {
        updateSettingsUI(UNIT_TIME_MS);
    } else {
        console.error("UNIT_TIME_MS is not defined globally. Cannot initialize settings UI. Ensure visualTapper.js is loaded first and defines UNIT_TIME_MS globally.");
        // Fallback to a default value for the UI if UNIT_TIME_MS is somehow not available
        // This helps prevent a broken UI state, though underlying functionality might be impaired.
        updateSettingsUI(150); // Default visual
    }

    // Event listener for the input field
    unitTimeInput.addEventListener('input', () => {
        const newValue = parseInt(unitTimeInput.value);
        if (isNaN(newValue)) {
            console.warn("Invalid input for unit time:", unitTimeInput.value);
            return;
        }

        // Call the global function from visualTapper.js to update the actual timing
        if (typeof updateVisualTapperUnitTime === 'function') {
            updateVisualTapperUnitTime(newValue);
        } else {
            console.error("updateVisualTapperUnitTime function is not defined globally. Cannot update tapper speed. Ensure visualTapper.js is loaded first and defines this function globally.");
        }

        // Update the UI in the settings tab
        updateSettingsUI(newValue);
    });
});
