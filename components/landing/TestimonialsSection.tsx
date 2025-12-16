'use client';

import { useTranslation } from 'react-i18next';

export default function TestimonialsSection() {
  const { t } = useTranslation();

  return (
    <section className="landing-section section-padding testimonials-section">
      <div className="container">
        <h2 className="hero-title testimonials-title fade-in">
          {t('testimonials.title')}
        </h2>
        <div className="testimonials-grid-landing">
          {/* Testimonial Card 1 - The Professional */}
          <div className="landing-card testimonial-card-landing fade-in">
            <div className="testimonial-content">
              <p className="testimonial-text">
                {t('testimonials.testimonial1')}
              </p>
            </div>
            <div className="testimonial-author">
              <div className="author-info">
                <p className="author-details">
                  <span className="author-name">Camy</span>
                  {t('testimonials.testimonial1Author')}
                </p>
              </div>
            </div>
          </div>

          {/* Testimonial Card 2 - The Student / Gen Z */}
          <div className="landing-card testimonial-card-landing fade-in">
            <div className="testimonial-content">
              <p className="testimonial-text">
                {t('testimonials.testimonial2')}
              </p>
            </div>
            <div className="testimonial-author">
              <div className="author-info">
                <p className="author-details">
                  <span className="author-name">Tong</span>
                  {t('testimonials.testimonial2Author')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

