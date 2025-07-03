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

    // --- STEP 1: RESET CONSENT (for debugging) ---
    // This is a powerful debug tool to force the consent form to show every time.
    await AdMob.resetConsentInfo();
    console.log('Consent info has been reset for debugging.');
    // ---------------------------------------------

    const umpDebugSettings = {
      testDeviceIdentifiers: ['E3D6A0C8-F0A4-49E5-B389-CC7EC8649636'],
      geography: 1, // 1 = EEA (forces the consent form for testing)
    };

    const consentInfo = await AdMob.requestConsentInfo({
      debugSettings: umpDebugSettings,
    });
    console.log('UMP Consent Info:', consentInfo);

    if (
      consentInfo.isConsentFormAvailable &&
      consentInfo.status === AdmobConsentStatus.REQUIRED
    ) {
      console.log('UMP consent form is required. Showing form...');
      await AdMob.showConsentForm();
    }

    await AdMob.initialize({
      requestTrackingAuthorization: false,
      initializeForTesting: true,
    });
    this.isInitialized = true;
    console.log('AdMob SDK initialized successfully.');

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
