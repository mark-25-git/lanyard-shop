'use client';

import HeroPreview from './HeroPreview';
import { useTranslation } from 'react-i18next';

export default function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="hero lanyard-landing-hero landing-section section-padding" itemScope itemType="https://schema.org/WebPageElement">
      <div className="hero-content">
        <h1 className="hero-title fade-in" itemProp="headline">
          {t('hero.title')}<br />
          {t('hero.subtitle')}
        </h1>
        <div className="lanyard-landing-hero-preview-wrapper fade-in">
          <HeroPreview />
        </div>
      </div>
    </section>
  );
}

