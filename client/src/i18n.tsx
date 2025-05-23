import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import translationEN from './locales/en/translation.json';
import translationNO from './locales/no/translation.json';

// Configure i18next
i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    debug: false,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    resources: {
      en: {
        translation: translationEN
      },
      no: {
        translation: translationNO
      }
    },
    // Store the language in localStorage
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'guttakrutt_language',
      caches: ['localStorage']
    }
  });

export default i18n;