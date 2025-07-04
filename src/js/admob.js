// The Final, Definitive admob.js

const { AdMob, AdmobConsentStatus, BannerAdPluginEvents } = window.Capacitor.Plugins;

export const AdMobService = {
  isInitialized: false,

  async initialize() {
    if (this.isInitialized) {
      return;
    }
    console.log('Final Test: Forcing consent form directly.');

    // Add a small delay to ensure the main ViewController is ready
    setTimeout(async () => {
      // STEP 1: RESET CONSENT (ensures a clean slate)
      await AdMob.resetConsentInfo();
      console.log('Consent info has been reset.');

      // STEP 2: SHOW THE FORM DIRECTLY
      console.log('Attempting to show consent form directly...');
      try {
        await AdMob.showConsentForm();
        console.log('Consent form was shown and dismissed.');
      } catch (error) {
        console.error('CRITICAL: showConsentForm() failed!', error);
        return; // Stop execution if the form fails
      }

      // STEP 3: INITIALIZE ADMOB
      await AdMob.initialize({
        requestTrackingAuthorization: false,
        initializeForTesting: true,
      });
      this.isInitialized = true;
      console.log('AdMob SDK initialized successfully.');

      // STEP 4: SHOW THE BANNER
      this.setupBannerListener();
      this.showBanner();
    }, 250); // 250 millisecond delay to ensure the view is ready
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
