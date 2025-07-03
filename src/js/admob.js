// src/js/admob.js

const { AdMob, AdmobConsentStatus, BannerAdPluginEvents } = window.Capacitor.Plugins;

// --- AdMob Service ---
// Encapsulates all AdMob logic into a single object.
export const AdMobService = {
  // A flag to prevent multiple initializations
  isInitialized: false,

  /**
   * Initializes the AdMob service, handling the critical iOS consent flow.
   * This MUST be called once when the app starts.
   */
  async initialize() {
    // Prevent re-initialization
    if (this.isInitialized) {
      console.log('AdMob Service already initialized.');
      return;
    }

    console.log('Starting AdMob initialization with consent flow...');

    // --- DEBUGGING OPTIONS ---
    // Use the testDeviceIdentifiers from your Xcode console log
    const umpDebugSettings = {
      testDeviceIdentifiers: ['E3D6A0C8-F0A4-49E5-B389-CC7EC8649636'],
      geography: 1, // 1 = EEA (European Economic Area), forces the consent form
    };
    // -------------------------

    // STEP 1: Request Consent Information from Google's UMP with DEBUG settings
    const consentInfo = await AdMob.requestConsentInfo({
        debugSettings: umpDebugSettings,
    });
    console.log('UMP Consent Info:', consentInfo);

    // STEP 2: Check if a consent form is available and required
    if (
      consentInfo.isConsentFormAvailable &&
      consentInfo.status === AdmobConsentStatus.REQUIRED
    ) {
      console.log('UMP consent form is required. Showing form...');
      // STEP 3: Show the UMP Consent Form
      await AdMob.showConsentForm();
      console.log('UMP consent form has been shown.');
    }

    // STEP 4: Check the final App Tracking Transparency (ATT) status for logging
    const trackingStatus = await AdMob.trackingAuthorizationStatus();
    console.log('Final ATT Status:', trackingStatus.status);

    // STEP 5: Initialize the AdMob SDK AFTER the consent flow is complete
    await AdMob.initialize({
      requestTrackingAuthorization: false,
      initializeForTesting: true,
    });
    
    this.isInitialized = true;
    console.log('AdMob SDK initialized successfully after consent flow.');

    console.log('Setting up banner listeners...');
    this.setupBannerListener();

    console.log('Attempting to show banner...');
    this.showBanner();
  },

  /**
   * Sets up a listener to adjust the UI when the banner ad changes size.
   * This prevents the banner from overlapping your app's content.
   */
  setupBannerListener() {
    // Use the correct event name from the plugin
    AdMob.addListener(BannerAdPluginEvents.SizeChanged, (size) => {
        console.log(`Banner Ad: UI adjustment for size ${size.width}x${size.height}`);
        const nav = document.querySelector('nav');
        if (nav) {
            // Set the 'bottom' style of the nav bar to the height of the ad
            nav.style.bottom = `${size.height}px`;
        }
    });
},

  /**
   * Shows a banner ad.
   */
  async showBanner() {
    if (!this.isInitialized) {
        console.error('AdMob not initialized. Call AdMobService.initialize() first.');
        return;
    }

    // Attach listeners BEFORE showing the banner for robust error handling
    AdMob.addListener(BannerAdPluginEvents.Loaded, () => {
        console.log('Banner Ad: Loaded');
    });

    AdMob.addListener(BannerAdPluginEvents.FailedToLoad, (error) => {
        console.error('Banner Ad: Failed to load.', error);
    });

    const options = {
        adId: 'ca-app-pub-3940256099942544/2934735716', // Google's test ID for banners
        adSize: 'ADAPTIVE_BANNER',
        position: 'BOTTOM_CENTER',
        isTesting: true,
    };

    await AdMob.showBanner(options);
    console.log('Banner Ad: showBanner() called successfully.');
},
};
