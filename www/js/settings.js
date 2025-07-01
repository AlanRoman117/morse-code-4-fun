// Master sound setting
let isMasterSoundEnabled = true; // Default value

function loadMasterSoundSetting() {
    const savedSetting = localStorage.getItem('masterSoundEnabled');
    if (savedSetting !== null) {
        isMasterSoundEnabled = JSON.parse(savedSetting); // Ensure boolean
    }
    // If nothing in localStorage, it remains true (the default)
    console.log('Master sound setting loaded:', isMasterSoundEnabled);
    // Ensure the global variable is updated after loading
    window.isMasterSoundEnabled = isMasterSoundEnabled;
}

function saveMasterSoundSetting() {
    localStorage.setItem('masterSoundEnabled', JSON.stringify(window.isMasterSoundEnabled));
    console.log('Master sound setting saved:', window.isMasterSoundEnabled);
}

// Load the setting when the script is initialized
loadMasterSoundSetting();

// Make isMasterSoundEnabled accessible globally
window.isMasterSoundEnabled = isMasterSoundEnabled;

// Provide a way for other scripts to update it through a setter
window.setMasterSoundEnabled = function(value) {
    window.isMasterSoundEnabled = value;
    saveMasterSoundSetting();
    // Potentially dispatch an event if other parts of the UI need to react instantly
    // window.dispatchEvent(new CustomEvent('masterSoundSettingChanged', { detail: { isEnabled: window.isMasterSoundEnabled } }));
};

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
    // This relies on getVisualTapperUnitTime being a global function from visualTapper.js
    // and visualTapper.js having executed its localStorage load logic.

    // New code for Master Sound Toggle
    const masterSoundToggle = document.getElementById('master-sound-toggle');
    const masterSoundStatusText = document.getElementById('master-sound-status-text');

    if (!masterSoundToggle || !masterSoundStatusText) {
        console.error("Master sound UI elements (master-sound-toggle or master-sound-status-text) not found. Master sound script adjustments will not initialize.");
        // We don't return here, as other settings might still be configurable.
        // However, the following lines related to masterSoundToggle will fail if elements are missing.
        // Thus, their specific logic should be conditional on their existence.
    }

    if (masterSoundToggle && masterSoundStatusText) {
        // Initialize UI based on the loaded setting
        // window.isMasterSoundEnabled should be already loaded by loadMasterSoundSetting() called at the start of the script.
        masterSoundToggle.checked = window.isMasterSoundEnabled;
        masterSoundStatusText.textContent = window.isMasterSoundEnabled ? 'On' : 'Off';

        // Add event listener for changes on the toggle
        masterSoundToggle.addEventListener('change', () => {
            const newState = masterSoundToggle.checked;
            window.setMasterSoundEnabled(newState); // Updates global var and saves to localStorage
            masterSoundStatusText.textContent = newState ? 'On' : 'Off';
            console.log('Master Sound toggled to:', newState ? 'On' : 'Off');
        });
    }
    if (typeof getVisualTapperUnitTime === 'function') {
        updateSettingsUI(getVisualTapperUnitTime());
    } else {
        console.error("getVisualTapperUnitTime is not defined globally. Cannot initialize settings UI. Ensure visualTapper.js is loaded first. Falling back to default.");
        // Fallback to a default value for the UI if getVisualTapperUnitTime is somehow not available
        // This helps prevent a broken UI state, though underlying functionality might be impaired.
        updateSettingsUI(150); // Default visual
    }

    // Event listener for the input field (ensure it exists before adding listener)
    if (unitTimeInput) {
        unitTimeInput.addEventListener('input', () => {
            const rawValue = unitTimeInput.value;
            const newValue = parseInt(rawValue);
            const min = parseInt(unitTimeInput.min);
            const max = parseInt(unitTimeInput.max);
            const feedbackEl = document.getElementById('unit-time-save-feedback');

            if (rawValue === '') { // Handle empty input - could be intermediate state or cleared
                if (feedbackEl) {
                    feedbackEl.textContent = 'Please enter a value.';
                    feedbackEl.className = 'text-sm ml-2 feedback-message text-red-500';
                    setTimeout(() => { feedbackEl.textContent = ''; }, 3000);
                }
                // Do not revert yet, user might be typing
                return;
            }

            if (isNaN(newValue) || newValue < min || newValue > max) {
                if (feedbackEl) {
                    feedbackEl.textContent = `Invalid: Must be ${min}-${max}ms.`;
                    feedbackEl.className = 'text-sm ml-2 feedback-message text-red-500';
                    setTimeout(() => { feedbackEl.textContent = ''; }, 3000);
                }
                // Revert to the last known good value if getVisualTapperUnitTime is available and reliable
                if (typeof getVisualTapperUnitTime === 'function') {
                    unitTimeInput.value = getVisualTapperUnitTime();
                }
                return; // Don't proceed with saving or updating if invalid
            }

            // If valid, proceed with updateVisualTapperUnitTime and "Saved!" feedback
            if (typeof updateVisualTapperUnitTime === 'function') {
                updateVisualTapperUnitTime(newValue); // This function should also update global UNIT_TIME_MS
                if (feedbackEl) {
                    feedbackEl.textContent = 'Saved!';
                    feedbackEl.className = 'text-sm ml-2 feedback-message text-green-500';
                    setTimeout(() => { feedbackEl.textContent = ''; }, 2000);
                }
            } else {
                console.error("updateVisualTapperUnitTime function is not defined globally. Cannot update tapper speed.");
                if (feedbackEl) {
                    feedbackEl.textContent = 'Error saving settings!';
                    feedbackEl.className = 'text-sm ml-2 feedback-message text-red-500';
                    setTimeout(() => { feedbackEl.textContent = ''; }, 2000);
                }
            }

            // Update the UI display for current effective value (already handled by updateSettingsUI if UNIT_TIME_MS changes)
            // but if updateVisualTapperUnitTime directly updates UNIT_TIME_MS, then call updateSettingsUI with that.
            // For now, assuming updateVisualTapperUnitTime handles the underlying UNIT_TIME_MS update.
            // The current updateSettingsUI(newValue) below might be redundant if UNIT_TIME_MS is the source of truth.
            // Let's ensure updateSettingsUI is called with the *actual* applied value (which is newValue here as it's validated).
            updateSettingsUI(newValue);
        });
    }
});
