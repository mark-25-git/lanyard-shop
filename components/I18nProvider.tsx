'use client';

import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  const [i18nInstance, setI18nInstance] = useState<any>(null);

  useEffect(() => {
    // Dynamic import to prevent SSR evaluation
    Promise.all([
      import('@/lib/i18n'),
      import('@/locales/en.json'),
      import('@/locales/ms.json')
    ]).then(([i18nModule, enModule, msModule]) => {
      const i18n = i18nModule.default;
      const enTranslations = enModule.default || enModule;
      const msTranslations = msModule.default || msModule;
      
      // Add resources to i18n instance
      i18n.addResourceBundle('en', 'translation', enTranslations, true, true);
      i18n.addResourceBundle('ms', 'translation', msTranslations, true, true);
      
      setI18nInstance(i18n);
    }).catch((err) => {
      console.error('Failed to load i18n', err);
      // Set a fallback to prevent blocking
      setI18nInstance(null);
    });
  }, []);

  // Wait for i18n instance before providing context
  // This prevents hydration errors and translation key flashes
  if (!i18nInstance) {
    return null; // or return a loading spinner if preferred
  }

  return <I18nextProvider i18n={i18nInstance}>{children}</I18nextProvider>;
}
