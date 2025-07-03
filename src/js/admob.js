// src/js/admob.js

const { AdMob, AdmobConsentStatus, BannerAdPluginEvents } = window.Capacitor.Plugins;

// --- AdMob Service ---
// Encapsulates all AdMob logic into a single object.
export const AdMobService = {
  // A flag to prevent multiple initializations
  isInitialized: false,

  async initialize() {
    // Prevent re-initialization
    if (this.isInitialized) {
      console.log('AdMob Service already initialized.');
      return;
    }
    console.log('Starting DIRECT App Tracking authorization...');

    // --- Direct ATT Test ---
    // We are calling the tracking request directly to isolate the issue.
    const { status } = await AdMob.requestTrackingAuthorization();
    console.log('Direct ATT Request Status:', status);

    // --- Initialize AdMob ---
    await AdMob.initialize({
      initializeForTesting: true,
    });
    
    this.isInitialized = true;
    console.log('AdMob SDK initialized successfully.');

    // --- Show Banner ---
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
