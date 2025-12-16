'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

export default function Header() {
  const { t } = useTranslation();

  return (
    <header className="header" itemScope itemType="https://schema.org/WPHeader">
      <nav className="nav" role="navigation" aria-label="Main navigation">
        <Link 
          href="/" 
          aria-label="Go to Teevent homepage"
          style={{ outline: 'none' }}
          onFocus={(e) => e.currentTarget.blur()}
        >
          <img
            src="/images/teevent-logo.svg"
            alt="Teevent - Custom Event Merchandise Malaysia"
            className="logo"
            itemProp="logo"
          />
        </Link>
        <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <Link href="/blog" className="nav-link">
            {t('header.blog')}
          </Link>
          <LanguageSwitcher />
        </div>
      </nav>
    </header>
  );
}

