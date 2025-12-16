'use client';

import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-links">
            <a
              href="https://www.instagram.com/team_teevent/"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              {t('footer.instagram')}
            </a>
            <a
              href="mailto:team.teevent@gmail.com"
              className="footer-link"
              id="emailLink"
            >
              {t('footer.email')}
            </a>
            <a
              href="https://wa.me/60137482481"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              {t('footer.whatsapp')}
            </a>
          </div>
          <div className="footer-center">
            <div className="footer-logo">
              <img
                src="/images/landing/teevent.svg"
                alt="Teevent - Custom Event Merchandise Malaysia"
                className="footer-logo-image"
              />
            </div>
            <div className="footer-company-info">
              <p>Teevent Enterprise (202503285823)</p>
            </div>
          </div>
        </div>
        <div className="footer-copyright">
          <p>{t('footer.copyright')}</p>
        </div>
      </div>
    </footer>
  );
}


