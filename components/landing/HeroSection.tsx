'use client';

import HeroPreview from './HeroPreview';
import { useTranslation } from 'react-i18next';

export default function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="hero lanyard-landing-hero landing-section" style={{ position: 'relative', overflow: 'hidden', padding: 0 }} itemScope itemType="https://schema.org/WebPageElement">
      {/* Background Images - determining section height */}
      <div className="hero-background">
        <img
          src="/images/landing/lanyard-mobile.webp"
          alt="Lanyard Background"
          className="mobile-bg"
          style={{ width: '100%', height: 'auto' }}
        />
        <img
          src="/images/landing/lanyard-desktop.webp"
          alt="Lanyard Background"
          className="desktop-bg"
          style={{ width: '100%', height: 'auto' }}
        />
      </div>

      {/* Content Overlay */}
      <div className="hero-content-overlay">
        <div className="hero-content">
          <h1 className="hero-title" itemProp="headline">
            {t('hero.title')}<br />
            {t('hero.subtitle')}
          </h1>
          <div className="lanyard-landing-hero-preview-wrapper">
            <HeroPreview />
          </div>
        </div>
      </div>

      <style jsx>{`
        .hero-background {
          position: relative;
          width: 100%;
          z-index: 0;
          line-height: 0; /* Remove potential extra space under images */
        }
        
        .mobile-bg { display: block; }
        .desktop-bg { display: none; }
        
        @media (min-width: 769px) {
          .mobile-bg { display: none; }
          .desktop-bg { display: block; }
        }

        .hero-content-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 10;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          pointer-events: none;
        }
        
        .hero-content {
          pointer-events: auto;
          text-align: center;
          width: 90%;
          max-width: 1000px;
          padding: var(--space-8);
          /* Glass background removed as requested */
        }

        @media (max-width: 768px) {
          .hero-content {
            width: 95%;
            padding: var(--space-6) var(--space-4);
          }
        }
      `}</style>
    </section>
  );
}

