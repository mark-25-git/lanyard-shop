'use client';

import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ms' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="nav-link"
      aria-label="Switch language"
      style={{
        background: 'transparent',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        outline: 'none',
      }}
      onMouseDown={(e) => e.preventDefault()}
      onFocus={(e) => e.currentTarget.blur()}
    >
      <i className="bi bi-globe"></i>
      <span>{i18n.language === 'en' ? 'BM' : 'EN'}</span>
    </button>
  );
}
