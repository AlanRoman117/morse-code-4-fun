// The Final admob.js for admob-plus

// The AdMob object is now accessed directly from the global admob object

export const AdMobService = {
  isInitialized: false,

  async initialize() {
    const { AdMob } = admob.plus;
    
    if (this.isInitialized) {
      return;
    }
    console.log('AdMob Plus: Initializing...');

    // AdMob-Plus handles consent automatically as part of its 'start' method.
    // This simplifies the flow greatly.
    await AdMob.start();
    this.isInitialized = true;
    console.log('AdMob Plus: SDK Initialized.');

    this.showBanner();
  },

  async showBanner() {
    if (!this.isInitialized) {
      console.error('AdMob-Plus not initialized.');
      return;
    }
    console.log('AdMob Plus: Attempting to show banner...');

    // Listen for events on the document
    document.addEventListener('admob.ad.load', () => {
        console.log('SUCCESS: Banner Ad Loaded');
        // We can get the ad height from the banner's state
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
      adUnitId: 'ca-app-pub-3940256099942544/2934735716', // Test ID
    });

    await banner.show();
  },
};
