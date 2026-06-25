// ══════════════════════════════════════════
// APP CHECK — attaches a verified-browser token to the enquiry submission,
// so the Cloud Function can tell real visitors apart from scripted abuse.
// Loaded only on contact.html, where the enquiry form lives.
// ══════════════════════════════════════════

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
  getToken,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-check.js';

if (FIREBASE_CONFIG.recaptchaSiteKey) {
  const app = initializeApp(FIREBASE_CONFIG, 'appcheck');
  const appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(FIREBASE_CONFIG.recaptchaSiteKey),
    isTokenAutoRefreshEnabled: true,
  });

  window.getAppCheckHeader = async () => {
    try {
      const { token } = await getToken(appCheck);
      return { 'X-Firebase-AppCheck': token };
    } catch (error) {
      console.warn('App Check token unavailable:', error.message);
      return {};
    }
  };
}
