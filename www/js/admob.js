// src/js/admob.js

const { AdMob, AdmobConsentStatus, BannerAdPluginEvents } = window.Capacitor.Plugins;

// --- AdMob Service ---
export const AdMobService = {
  isInitialized: false,

// In admob.js, inside the AdMobService object

  async initialize() {
    if (this.isInitialized) {
      return;
    }
    console.log('Starting AdMob initialization with UMP consent flow...');

    // STEP 1: Handle Consent
    const consentInfo = await AdMob.requestConsentInfo();
    if (
      consentInfo.isConsentFormAvailable &&
      consentInfo.status === AdmobConsentStatus.REQUIRED
    ) {
      await AdMob.showConsentForm();
    }

    // STEP 2: Handle Tracking Authorization
    const trackingStatus = await AdMob.trackingAuthorizationStatus();
    if (trackingStatus.status === 'notDetermined') {
        await AdMob.requestTrackingAuthorization();
    }

    // STEP 3: Initialize AdMob
    await AdMob.initialize({
      requestTrackingAuthorization: false,
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
