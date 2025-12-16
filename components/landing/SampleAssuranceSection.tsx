'use client';

import { trackEvent } from '@/lib/ga';
import { useTranslation } from 'react-i18next';

export default function SampleAssuranceSection() {
  const { t } = useTranslation();
  const whatsappUrl =
    'https://wa.me/60137482481?text=Please%20enter%20your%20details%20for%20free%20lanyard%20sample%20delivery.%0ARecipient%20Name:%0APhone%20Number:%0AAddress:';

  const handleClick = () => {
    trackEvent('sample_free_lanyard_click', {
      location: 'sample_assurance_section',
    });
  };

  return (
    <section
      className="landing-section section-padding simplicity-section sample-assurance-section"
      aria-labelledby="sample-assurance-title"
    >
      <div className="container">
        <div className="simplicity-content">
          <h2
            id="sample-assurance-title"
            className="hero-title simplicity-title fade-in"
          >
            {t('sample.title')}
          </h2>
          <p className="simplicity-subtitle fade-in">
            {t('sample.subtitle1')}<br />
            {t('sample.subtitle2')}
          </p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary simplicity-read-more fade-in"
            onClick={handleClick}
          >
            {t('sample.button')}
          </a>
        </div>
      </div>
    </section>
  );
}


