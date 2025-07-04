// The Final, Definitive admob.js with Chained Promises

export const AdMobService = {
  isInitialized: false,

  initialize() {
    if (this.isInitialized) {
      return;
    }
    console.log('AdMob Plus: Starting initialization chain...');

    // Use .then() chaining to be more resilient to bridge issues.
    // The admob.plus.start() promise will resolve when the SDK is ready.
    admob.plus.start()
      .then(() => {
        this.isInitialized = true;
        console.log('AdMob Plus: SDK Initialized successfully.');
        this.showBanner();
      })
      .catch(error => {
        console.error('CRITICAL ERROR during AdMob Start:', error);
      });
  },

  showBanner() {
    // We can now safely assume AdMob is ready.
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
    banner.show();
  },
};