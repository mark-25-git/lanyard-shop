import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Initialize immediately when this module loads (client-side only)
// Since this is now loaded dynamically via import(), it only runs in browser
if (typeof window !== 'undefined' && !i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      fallbackLng: 'en',
      supportedLngs: ['en', 'ms'],
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
      },
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
      // Start with empty resources - will be added by I18nProvider
      resources: {
        en: { translation: {} },
        ms: { translation: {} },
      },
    });
}

export default i18n;
