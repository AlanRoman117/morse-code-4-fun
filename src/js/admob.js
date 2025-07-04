// The Final, Production-Ready admob.js

const { AdMob, AdmobConsentStatus, BannerAdPluginEvents } = window.Capacitor.Plugins;

export const AdMobService = {
  isInitialized: false,

  async initialize() {
    if (this.isInitialized) {
      return;
    }
    console.log('AdMobService.initialize() called.');

    // Reset consent for definitive testing
    await AdMob.resetConsentInfo();
    console.log('Consent info reset.');

    // Force consent form for this device
    const umpDebugSettings = {
      testDeviceIdentifiers: ['4F624EB2-3567-4481-BEB8-A1B684C9F258'], // Your device ID
      geography: 1, // Force EEA
    };

    // Correct UMP Flow
    const consentInfo = await AdMob.requestConsentInfo({
      debugSettings: umpDebugSettings,
    });

    if (
      consentInfo.isConsentFormAvailable &&
      consentInfo.status === AdmobConsentStatus.REQUIRED
    ) {
      console.log('Attempting to show consent form...');
      await AdMob.showConsentForm();
      console.log('Consent form shown and dismissed.');
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

  // ... (setupBannerListener and showBanner functions remain the same)
};
