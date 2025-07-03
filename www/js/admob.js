// src/js/admob.js

const { AdMob, AdmobConsentStatus, BannerAdPluginEvents } = window.Capacitor.Plugins;

// --- AdMob Service ---
export const AdMobService = {
  isInitialized: false,

  async initialize() {
    if (this.isInitialized) {
      return;
    }
    console.log('Starting AdMob initialization with UMP consent flow...');

    // --- DEBUGGING OPTIONS TO FORCE CONSENT FORM ---
    // This uses the test device ID from your Xcode console log.
    const umpDebugSettings = {
      testDeviceIdentifiers: ['E3D6A0C8-F0A4-49E5-B389-CC7EC8649636'],
      geography: 1, // 1 = EEA (forces the consent form for testing)
    };
    // --------------------------------------------------

    // STEP 1: Request consent information with debug settings
    const consentInfo = await AdMob.requestConsentInfo({
      debugSettings: umpDebugSettings,
    });

    // STEP 2: Show consent form if required (will be required in debug mode)
    if (
      consentInfo.isConsentFormAvailable &&
      consentInfo.status === AdmobConsentStatus.REQUIRED
    ) {
      console.log('UMP consent form is required. Showing form...');
      await AdMob.showConsentForm();
    }

    // STEP 3: Initialize AdMob
    await AdMob.initialize({
      requestTrackingAuthorization: false, // UMP handles this
      initializeForTesting: true,
    });
    this.isInitialized = true;
    console.log('AdMob SDK initialized successfully.');

    // STEP 4: Setup Listeners and Show Banner
    this.setupBannerListener();
    this.showBanner();
  },

  setupBannerListener() {
    AdMob.addListener(BannerAdPluginEvents.SizeChanged, (size) => {
      console.log(`Banner Ad: UI adjustment for size ${size.width}x${size.height}`);
      const nav = document.querySelector('nav');
      if (nav) {
        nav.style.bottom = `${size.height}px`;
      }
    });
  },

  async showBanner() {
    if (!this.isInitialized) {
      console.error('AdMob not initialized.');
      return;
    }

    AdMob.addListener(BannerAdPluginEvents.Loaded, () => {
      console.log('SUCCESS: Banner Ad Loaded');
    });

    AdMob.addListener(BannerAdPluginEvents.FailedToLoad, (error) => {
      console.error('FAILURE: Banner Ad failed to load.', error);
    });

    console.log('Attempting to show banner...');
    await AdMob.showBanner({
      adId: 'ca-app-pub-3940256099942544/2934735716',
      adSize: 'ADAPTIVE_BANNER',
      position: 'BOTTOM_CENTER',
      isTesting: true,
    });
  },
};
