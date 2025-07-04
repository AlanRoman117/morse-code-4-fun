// The Final, Definitive admob.js for AdMob-Plus

// The AdMob object is now accessed INSIDE the functions that use it.

export const AdMobService = {
  isInitialized: false,

  async initialize() {
    // Access the plugin here, once the app is ready and this function is called.
    const { AdMob } = admob.plus;

    if (this.isInitialized) {
      return;
    }
    console.log('AdMob Plus: Initializing...');

    // This single call handles consent and starts the SDK.
    await AdMob.start();
    this.isInitialized = true;
    console.log('AdMob Plus: SDK Initialized.');

    this.showBanner();
  },

  async showBanner() {
    // Access the plugin here as well to be safe.
    const { AdMob } = admob.plus;

    if (!this.isInitialized) {
      console.error('AdMob-Plus not initialized.');
      return;
    }
    console.log('AdMob Plus: Attempting to show banner...');

    document.addEventListener('admob.ad.load', () => {
      console.log('SUCCESS: Banner Ad Loaded');
      const { adHeight } = AdMob.banner.state;
      const nav = document.querySelector('nav');
      if (nav && adHeight > 0) {
        console.log(`Ad impression registered. Adjusting UI for height: ${adHeight}`);
        nav.style.bottom = `${adHeight}px`;
      }
    });
    document.addEventListener('admob.ad.loadfail', (evt) => {
      console.error('FAILURE: Banner Ad failed to load.', evt.data);
    });

    const banner = new AdMob.BannerAd({
      adUnitId: 'ca-app-pub-3940256099942544/2934735716',
    });

    await banner.show();
  },
};