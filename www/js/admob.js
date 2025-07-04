// The Final, Definitive admob.js with Chained Promises

const { AdMob, AdmobConsentStatus, BannerAdPluginEvents } = window.Capacitor.Plugins;

export const AdMobService = {
  isInitialized: false,

  initialize() {
    if (this.isInitialized) {
      return;
    }
    console.log('AdMobService.initialize() called.');

    // Use .then() chaining to avoid a long await chain
    AdMob.resetConsentInfo()
      .then(() => {
        console.log('Consent info reset.');
        const umpDebugSettings = {
          testDeviceIdentifiers: ['4F624EB2-3567-4481-BEB8-A1B684C9F258'],
          geography: 1,
        };
        return AdMob.requestConsentInfo({ debugSettings: umpDebugSettings });
      })
      .then((consentInfo) => {
        console.log('UMP Consent Info:', consentInfo);
        if (
          consentInfo.isConsentFormAvailable &&
          consentInfo.status === AdmobConsentStatus.REQUIRED
        ) {
          console.log('Attempting to show consent form...');
          return AdMob.showConsentForm();
        }
      })
      .then(() => {
        console.log('Consent process complete. Initializing AdMob...');
        return AdMob.initialize({
          requestTrackingAuthorization: false,
          initializeForTesting: true,
        });
      })
      .then(() => {
        this.isInitialized = true;
        console.log('AdMob SDK initialized successfully.');
        this.setupBannerListener();
        this.showBanner();
      })
      .catch(error => {
        console.error('CRITICAL ERROR in AdMob initialization chain:', error);
      });
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
