// The Final, Corrected admob.js

const { AdMob, AdmobConsentStatus, BannerAdPluginEvents } = window.Capacitor.Plugins;

export const AdMobService = {
  isInitialized: false,

  async initialize() {
    if (this.isInitialized) {
      return;
    }
    console.log('Starting AdMob initialization with UMP consent flow...');

    // STEP 1: RESET CONSENT (for debugging)
    await AdMob.resetConsentInfo();
    console.log('Consent info has been reset for debugging.');

    // --- DEBUG SETTINGS TO FORCE THE FORM ---
    const umpDebugSettings = {
      testDeviceIdentifiers: ['4F624EB2-3567-4481-BEB8-A1B684C9F258'],
      geography: 1,
    };

    // STEP 2: REQUEST CONSENT
    const consentInfo = await AdMob.requestConsentInfo({
      debugSettings: umpDebugSettings,
    });
    console.log('UMP Consent Info:', consentInfo);

    // STEP 3: SHOW THE FORM (if required)
    if (
      consentInfo.isConsentFormAvailable &&
      consentInfo.status === AdmobConsentStatus.REQUIRED
    ) {
      console.log('UMP consent form is required. Showing form...');
      // Direct await ensures we wait for user interaction
      await AdMob.showConsentForm();
    }

    // STEP 4: INITIALIZE ADMOB (only after consent is handled)
    await AdMob.initialize({
      requestTrackingAuthorization: false,
      initializeForTesting: true,
    });
    this.isInitialized = true;
    console.log('AdMob SDK initialized successfully.');

    // STEP 5: SHOW THE BANNER
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
