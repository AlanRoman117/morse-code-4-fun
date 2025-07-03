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

    // STEP 1: Request consent information
    const consentInfo = await AdMob.requestConsentInfo();

    // STEP 2: Show consent form if required
    if (
      consentInfo.isConsentFormAvailable &&
      consentInfo.status === AdmobConsentStatus.REQUIRED
    ) {
      console.log('UMP consent form is required. Showing form...');
      await AdMob.showConsentForm();
    }

    // STEP 3: Request ATT authorization (will now work because of your phone setting)
    const trackingStatus = await AdMob.trackingAuthorizationStatus();
    if (trackingStatus.status === 'notDetermined') {
        console.log('Requesting ATT authorization...');
        await AdMob.requestTrackingAuthorization();
    }

    // STEP 4: Initialize AdMob
    await AdMob.initialize({
      requestTrackingAuthorization: false, // We've already handled it
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
